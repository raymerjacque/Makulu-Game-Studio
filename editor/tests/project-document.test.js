import test from 'node:test';
import assert from 'node:assert/strict';
import * as pc from 'playcanvas';
import { Editor } from '../src/core/editor.js';
import { BehaviorManager } from '../src/core/behaviors.js';
import { PROJECT_FORMAT, parseProjectDocument } from '../src/project/project-document.js';
const near = (a, b) => a.forEach((n, i) => assert.ok(Math.abs(n - b[i]) < 0.0001, `${a} differs from ${b}`));
const pos = e => [e.getPosition().x, e.getPosition().y, e.getPosition().z];
function fixture() {
  const e = new Editor(); new BehaviorManager(e); e.projectName = 'Island';
  e.scripts.set('controller.js', '/* preserved source */');
  const parent = e.createEntity({ name: 'Island', transform: { position: [10, 2, -3], rotation: [0, 35, 0], scale: [2, 2, 2] } });
  const child = e.createEntity({ name: 'Crystal', parent }); child.setLocalPosition(1, 3, 2); child.setLocalEulerAngles(5, 15, 20);
  child.scriptData = { controller: { speed: 7 } }; e.behaviors.attachBehavior(child, 'collectible', { score: 25 });
  const id = JSON.parse(e.exportSceneJSON()).root.children[0].children[0].id, world = pos(child);
  assert.equal(e.switchScene('Exit'), true); assert.equal(e.root.children.length, 0);
  e.createEntity({ name: 'Gate' }); e.scripts.set('exit.js', '/* source */');
  e.audioVolumes = { master: 0.5, music: 0, sfx: 0.8 };
  e.prefabs.prefabs.set('prefab-1', { name: 'Crystal.prefab', entityData: { name: 'Crystal' } });
  e.projectAssets = [{ id: 'audio-1', name: 'click.wav', type: 'audio', url: 'data:audio/wav;base64,AAAA' }];
  return { e, id, world };
}
test('project round trip preserves scenes, IDs, scripts, hierarchy, behavior config, attributes, assets, prefabs and settings', () => {
  const { e, id, world } = fixture(), json = e.exportProjectJSON(), document = JSON.parse(json);
  assert.equal(document.format, PROJECT_FORMAT); assert.equal(document.schemaVersion, 1); assert.equal(document.scenes.length, 2);
  const restored = new Editor(); new BehaviorManager(restored);
  assert.equal(restored.loadProjectJSON(json), true, restored.lastProjectError);
  assert.equal(restored.projectId, e.projectId); assert.equal(restored.activeSceneName, 'Exit'); assert.equal(restored.projectName, 'Island');
  assert.equal(restored.scripts.size, 2); assert.deepEqual(restored.audioVolumes, e.audioVolumes); assert.deepEqual(restored.projectAssets, e.projectAssets); assert.ok(restored.prefabs.prefabs.has('prefab-1'));
  assert.equal(restored.switchScene('Main Scene'), true);
  const child = restored.root.findByName('Crystal'); near(pos(child), world); assert.equal(child._studioId, id);
  assert.deepEqual(child.scriptData, { controller: { speed: 7 } }); assert.equal(restored.behaviors.getBehaviors(child)[0].params.score, 25);
  assert.equal(restored.scripts.size, 2); assert.equal(restored.switchScene('Exit'), true); assert.ok(restored.root.findByName('Gate'));
  assert.equal(restored.behaviors.activeBehaviors.size, 0); assert.equal(JSON.parse(restored.exportProjectJSON()).scenes.length, 2);
});
test('legacy scene migrates with nested world transforms and script text without executing imported code', () => {
  const legacy = { project: 'Old', scene: 'Legacy', scripts: { test: 'throw new Error("must not execute")' }, root: { children: [
    { name: 'Parent', position: [10, 0, 0], rotation: [0, 45, 0], scale: [2, 2, 2], children: [{ name: 'Child', position: [12, 3, 4], rotation: [0, 0, 0] }] }
  ] } };
  const e = new Editor(); assert.equal(e.loadProjectJSON(JSON.stringify(legacy)), true, e.lastProjectError);
  near(pos(e.root.findByName('Child')), [12, 3, 4]); assert.equal(e.scripts.get('test'), legacy.scripts.test);
  assert.equal(JSON.parse(e.exportProjectJSON()).format, PROJECT_FORMAT);
});
test('invalid inactive scenes, duplicate IDs, unsafe keys and future versions are rejected before project mutation', () => {
  const { e } = fixture(), saved = e.exportProjectJSON();
  const change = f => { const d = JSON.parse(saved); f(d); return d; };
  for (const bad of ['{bad', change(d => { d.schemaVersion = 999; }), change(d => { d.activeSceneId = 'missing'; }),
    change(d => { d.scenes[0].data.root.children[0].position = [Infinity, 0, 0]; }), change(d => { d.scenes[0].data.root.children = 'bad'; }),
    change(d => { d.scenes[1].id = d.scenes[0].id; }), change(d => { d.scripts = { test: 42 }; }), JSON.parse('{"__proto__":{"polluted":true},"root":{"children":[]}}')]) {
    assert.equal(e.loadProjectJSON(bad), false); assert.ok(e.lastProjectError); assert.equal(e.exportProjectJSON(), saved);
  }
  assert.equal({}.polluted, undefined);
});
test('failed component reconstruction discards staging while retaining current scene', () => {
  const e = new Editor(); e.createEntity({ name: 'KeepMe' }); const saved = e.exportSceneJSON();
  assert.equal(e.loadSceneJSON({ root: { children: [{ name: 'Bad', components: { render: { type: 'box' } } }] } }), false);
  assert.equal(e.exportSceneJSON(), saved);
});
test('asset bytes replace temporary URLs, generated model children are excluded, and private file/provider fields are not serialized', () => {
  const e = new Editor(), model = e.createEntity({ name: 'Model' }); model._modelUrl = 'blob:temporary';
  e.createEntity({ name: 'GeneratedMesh', parent: model })._studioModelInstance = true;
  e.projectAssets = [{ id: 'model-1', name: 'test.glb', type: 'models', url: 'blob:temporary', sourceUrl: 'blob:temporary', base64Data: 'data:model/gltf-binary;base64,AAAA', file: { private: true }, apiKey: 'test-only-secret' }];
  const json = e.exportProjectJSON();
  assert.ok(!json.includes('blob:temporary')); assert.ok(!json.includes('test-only-secret')); assert.ok(!json.includes('GeneratedMesh'));
  assert.equal(JSON.parse(json).scenes[0].data.root.children[0].modelUrl, 'data:model/gltf-binary;base64,AAAA');
  delete e.projectAssets[0].base64Data; assert.throws(() => e.exportProjectJSON(), /still importing/);
});
test('scene rename and repeated duplicates retain unique scene identity without overwriting scenes', () => {
  const { e } = fixture(), id = e.sceneIds.get('Exit'); assert.equal(e.renameScene('Exit', 'Escape'), true); assert.equal(e.sceneIds.get('Escape'), id);
  assert.equal(e.renameScene('Escape', 'Main Scene'), false); assert.equal(e.duplicateScene('Escape'), 'Escape_Copy'); assert.equal(e.duplicateScene('Escape'), 'Escape_Copy_2');
  const d = parseProjectDocument(e.exportProjectJSON()); assert.equal(new Set(d.scenes.map(s => s.id)).size, 4);
  assert.equal(d.scenes.find(s => s.id === d.activeSceneId).name, 'Escape_Copy_2');
});
test('collision extents, zero-valued physics and script bindings survive round trip using real engine component systems', () => {
  const app = new pc.AppBase({ id: 'roundtrip' }), options = new pc.AppOptions();
  options.graphicsDevice = new pc.NullGraphicsDevice({ width: 64, height: 64 });
  options.componentSystems = [pc.CollisionComponentSystem, pc.RigidBodyComponentSystem, pc.ScriptComponentSystem]; options.resourceHandlers = []; app.init(options);
  try {
    const e = new Editor(); e.runtime = { app }; const box = e.createEntity({ name: 'PhysicsBox' });
    box.addComponent('collision', { type: 'box', halfExtents: new pc.Vec3(2, 3, 4) }); box.addComponent('rigidbody', { type: 'static', mass: 0, friction: 0, restitution: 0 });
    box.addComponent('script'); box.scriptData = { controller: { speed: 4 } }; e.scripts.set('controller.js', '/* not executed */');
    assert.equal(e.loadProjectJSON(e.exportProjectJSON()), true, e.lastProjectError);
    const restored = app.root.findByName('PhysicsBox'), extents = restored.collision.halfExtents;
    near([extents.x, extents.y, extents.z], [2, 3, 4]); assert.equal(restored.rigidbody.mass, 0); assert.equal(restored.rigidbody.friction, 0); assert.equal(restored.rigidbody.restitution, 0);
    assert.deepEqual(restored.scriptData, { controller: { speed: 4 } }); assert.equal(e.scripts.size, 1);
  } finally { app.destroy(); }
});

test('exported scene builder preserves nested transforms in both new and legacy scene representations', async () => {
  const { GameBundler } = await import('../src/compiler/game-bundler.js');
  const vm = await import('node:vm');
  const { e, world } = fixture(); e.switchScene('Main Scene');
  const html = new GameBundler(e).compileStandaloneHTML();
  const start = html.indexOf('    function buildNode(data, parent)');
  const end = html.indexOf('    if (SCENE_DATA.root && SCENE_DATA.root.children)', start);
  assert.ok(start > 0 && end > start);
  const context = vm.createContext({ pc });
  context.runtimeAssets = { load: () => { throw new Error('Unexpected resource in hierarchy-only fixture.'); } };
  vm.runInContext(html.slice(start, end), context);
  const root = new pc.Entity('ExportRoot');
  const data = JSON.parse(e.exportSceneJSON()).root.children[0];
  // The editor runtime owns behavior execution; this test exercises only the exported scene builder.
  context.buildNode(data, root);
  near(pos(root.findByName('Crystal')), world);
  const removeLocal = node => { delete node.localPosition; delete node.localRotation; node.children?.forEach(removeLocal); };
  removeLocal(data);
  const oldRoot = new pc.Entity('LegacyExportRoot'); context.buildNode(data, oldRoot);
  near(pos(oldRoot.findByName('Crystal')), world);
});

test('project import and saving are blocked during play to avoid persisting simulation mutations', () => {
  const { e } = fixture(), saved = e.exportProjectJSON(); e.isPlaying = true;
  assert.throws(() => e.exportProjectJSON(), /Stop the play session/);
  assert.equal(e.loadProjectJSON(saved), false);
  e.isPlaying = false; assert.equal(e.exportProjectJSON(), saved);
});

test('restored asset cards treat imported names, icons and size labels as text', async () => {
  const { AssetsPanel } = await import('../src/ui/assets.js');
  const previous = globalThis.document;
  const grid = { children: [], appendChild(node) { this.children.push(node); } };
  globalThis.document = { createElement: () => ({ style: {}, children: [], append(...nodes) { this.children.push(...nodes); }, addEventListener() {} }) };
  try {
    const panel = Object.create(AssetsPanel.prototype);
    panel.container = { querySelector: () => grid }; panel.activeFolder = 'all'; panel.assetFilterText = '';
    const hostile = '<img src=x onerror=alert(1)>';
    panel.assets = [{ id: '1', name: hostile, icon: hostile, size: hostile, type: 'audio' }];
    panel.renderAssetCards();
    const card = grid.children[0];
    assert.equal(card.innerHTML, undefined);
    for (const child of card.children) { assert.equal(child.innerHTML, undefined); assert.equal(child.textContent, hostile); }
  } finally { globalThis.document = previous; }
});

test('scene navigation does not resurrect deleted scripts or overwrite project-wide title and compression settings', () => {
  const { e } = fixture();
  e.projectName = 'Renamed Adventure'; e.textureCompressionSettings = { targetFormat: 'bc7' }; e.scripts.delete('controller.js');
  e.switchScene('Main Scene');
  assert.equal(e.projectName, 'Renamed Adventure'); assert.deepEqual(e.textureCompressionSettings, { targetFormat: 'bc7' });
  assert.equal(e.scripts.has('controller.js'), false);
  const saved = JSON.parse(e.exportProjectJSON()); assert.equal(Object.hasOwn(saved.scripts, 'controller.js'), false);
  assert.ok(saved.scenes.every(scene => scene.data.scripts === undefined), 'Inactive snapshots must not retain obsolete script copies');
  assert.equal(e.deleteScene('Main Scene'), true); assert.equal(e.activeSceneName, 'Exit'); assert.equal(e.projectName, 'Renamed Adventure');
  assert.equal(e.duplicateScene('missing'), null); assert.equal(e.scenes.size, 1);
});

test('cached model callbacks work during staging and stale callbacks cannot populate a later scene', () => {
  const e = new Editor(), callbacks = [];
  let cached = true;
  const resource = { instantiateRenderEntity: () => new pc.Entity('GeneratedModel') };
  const app = { root: new pc.Entity('AppRoot'), assets: { loadFromUrl(url, type, callback) {
    if (cached) callback(null, { resource }); else callbacks.push(callback);
  } } };
  e.runtime = { app };
  const scene = { root: { children: [{ name: 'Model', modelUrl: './fixture.glb' }] } };
  assert.equal(e.loadSceneJSON(scene), true);
  assert.ok(app.root.findByName('GeneratedModel'), 'Cached assets can resolve synchronously before commit');
  assert.equal(JSON.parse(e.exportSceneJSON()).root.children[0].children.length, 0, 'Generated model subtrees must not serialize twice');
  cached = false;
  assert.equal(e.loadSceneJSON(scene), true);
  const oldModel = app.root.findByName('Model');
  assert.equal(e.loadSceneJSON({ root: { children: [{ name: 'Replacement' }] } }), true);
  callbacks[0](null, { resource });
  assert.equal(oldModel.children.length, 0); assert.equal(app.root.findByName('GeneratedModel'), null);
});
