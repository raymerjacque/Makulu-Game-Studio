import test from 'node:test';
import assert from 'node:assert/strict';
import * as pc from 'playcanvas';
import vm from 'node:vm';
import { Editor } from '../src/core/editor.js';
import { TerrainGenerator } from '../src/engine/terrain-generator.js';
import { generateTerrainData, terrainGeometry, TERRAIN_RUNTIME_CODE } from '../src/engine/terrain-data.js';
import { SOUND_RUNTIME_CODE, serializeSoundComponent } from '../src/engine/sound-data.js';
import { GameBundler } from '../src/compiler/game-bundler.js';

function setup() {
  const app = new pc.AppBase({ id: 'terrain-audio-test' }), options = new pc.AppOptions();
  options.graphicsDevice = new pc.NullGraphicsDevice({ width: 64, height: 64 }); options.soundManager = new pc.SoundManager();
  options.componentSystems = [pc.RenderComponentSystem, pc.CollisionComponentSystem, pc.RigidBodyComponentSystem, pc.SoundComponentSystem]; options.resourceHandlers = []; app.init(options);
  const editor = new Editor(); editor.runtime = { app };
  return { editor, app };
}
function exportedBuilder(editor, app) {
  const html = new GameBundler(editor).compileStandaloneHTML();
  const start = html.indexOf('    function buildNode(data, parent)'), end = html.indexOf('    if (SCENE_DATA.root && SCENE_DATA.root.children)', start);
  const context = vm.createContext({ pc, app, EMBEDDED_ASSETS: [] });
  context.runtimeAssets = { load: (...args) => app.assets.loadFromUrl(...args) };
  vm.runInContext(TERRAIN_RUNTIME_CODE + '\n' + SOUND_RUNTIME_CODE + '\n' + html.slice(start, end), context);
  return context.buildNode;
}

test('terrain uses deterministic seed zero/noise and stores final imported heights, including flat zero-height terrain', () => {
  const options = { seed: 0, subdivisions: 4, brushMode: 'noise', maxHeight: 5 };
  assert.deepEqual(generateTerrainData(options), generateTerrainData(options));
  const imported = generateTerrainData({ subdivisions: 1, maxHeight: 10, customHeights: [[0, 0.2], [0.5, 1]] });
  assert.deepEqual(imported.heights, [[0, 2], [5, 10]]);
  const flat = terrainGeometry(generateTerrainData({ subdivisions: 2, maxHeight: 0, seed: 0 }));
  assert.ok(flat.positions.every(Number.isFinite)); assert.ok(flat.normals.every(Number.isFinite));
  for (const invalid of [{ subdivisions: 1000000 }, { width: 0 }, { seed: -1 }, { subdivisions: 1, customHeights: [[0]] }]) assert.throws(() => generateTerrainData(invalid));
});

test('terrain mesh and collision source survive save/open and the delivered builder reconstructs identical geometry', async () => {
  const { editor, app } = setup();
  try {
    const terrain = new TerrainGenerator(editor).generate({ name: 'Island', seed: 0, subdivisions: 4, brushMode: 'noise' });
    terrain.setLocalPosition(2, 1, -4); const data = structuredClone(terrain._terrainData), expected = terrainGeometry(data);
    assert.equal(terrain.render.meshInstances[0].mesh.vertexBuffer.numVertices, 25);
    assert.equal(terrain.rigidbody.type, 'static');
    assert.equal(terrain.collision.model.meshInstances[0].mesh, terrain.render.meshInstances[0].mesh);
    assert.equal((await editor.openProjectJSON(editor.exportProjectJSON())).status, 'ready');
    const reopened = app.root.findByName('Island'); assert.deepEqual(reopened._terrainData, data);
    assert.equal(reopened.render.type, 'asset'); assert.equal(reopened.render.material.diffuseMapVertexColor, true);
    const positions = []; reopened.render.meshInstances[0].mesh.getPositions(positions);
    assert.equal(positions.length, expected.positions.length);
    positions.forEach((value, i) => assert.ok(Math.abs(value - expected.positions[i]) < 0.00001));
    const node = JSON.parse(editor.exportSceneJSON()).root.children[0]; node.name = 'ExportedIsland';
    const delivered = exportedBuilder(editor, app)(node, app.root);
    assert.deepEqual(JSON.parse(JSON.stringify(delivered._terrainData)), data);
    assert.equal(delivered.collision.model.meshInstances[0].mesh, delivered.render.meshInstances[0].mesh);
    const exportedPositions = []; delivered.render.meshInstances[0].mesh.getPositions(exportedPositions); assert.deepEqual(exportedPositions, positions);
  } finally { app.destroy(); }
});

test('invalid terrain in an inactive scene is rejected before replacement and terrain duplication owns a distinct mesh', () => {
  const { editor, app } = setup();
  try {
    const terrain = new TerrainGenerator(editor).generate({ subdivisions: 2, seed: 1 });
    const copy = editor.duplicateEntity(terrain);
    assert.deepEqual(copy._terrainData, terrain._terrainData);
    assert.notEqual(copy.render.meshInstances[0].mesh, terrain.render.meshInstances[0].mesh);
    const saved = editor.exportProjectJSON(), document = JSON.parse(saved);
    const bad = structuredClone(document.scenes[0]); bad.id = 'bad'; bad.name = 'Broken'; bad.data.root.children[0].terrain.heights[0][0] = null; document.scenes.push(bad);
    assert.equal(editor.loadProjectJSON(document), false); assert.equal(editor.exportProjectJSON(), saved);
    terrain.destroy(); assert.ok(copy.render.meshInstances[0].mesh.vertexBuffer); // Independent copy remains usable.
  } finally { app.destroy(); }
});

test('audio source/slot settings restore silently, join readiness and bind the correct registered audio asset', async () => {
  const { editor, app } = setup(), requests = [];
  app.assets.loadFromUrl = (url, type, callback) => requests.push({ url, type, callback });
  try {
    const source = { root: { children: [{ name: 'Ambience', components: { sound: { volume: 0, pitch: 1.2, minDistance: 3, maxDistance: 45, positional: true, slots: [
      { name: 'main', url: './wind.wav', volume: 0.7, pitch: 0.8, loop: true, autoPlay: true, overlap: false, startTime: 0.1, duration: 1.5 }
    ] } } }] } };
    const opened = editor.openProjectJSON(source); assert.equal(requests[0].type, 'audio'); assert.equal(editor.sceneResourceStatus.status, 'loading');
    const asset = new pc.Asset('wind', 'audio', { url: './wind.wav' }); asset.resource = new pc.Sound({ duration: 3 }); asset.loaded = true; app.assets.add(asset);
    requests[0].callback(null, asset); assert.equal((await opened).status, 'ready');
    const entity = app.root.findByName('Ambience'), slot = entity.sound.slot('main');
    assert.equal(slot.asset, asset.id); assert.equal(slot.autoPlay, false, 'Project opening must not begin audio playback');
    assert.equal(entity.sound.refDistance, 3); assert.equal(entity.sound.volume, 0);
    const saved = JSON.parse(editor.exportProjectJSON()).scenes[0].data.root.children[0].components.sound;
    assert.equal(saved.slots[0].url, './wind.wav'); assert.equal(saved.slots[0].autoPlay, true); assert.equal(saved.slots[0].duration, 1.5);
    let played = null; entity.sound.play = name => { played = name; }; editor.playSceneAudio(); assert.equal(played, 'main');
    const exported = exportedBuilder(editor, app)({ name: 'DeliveredAudio', components: { sound: saved } }, app.root);
    requests[1].callback(null, asset); assert.equal(exported.sound.slot('main').asset, asset.id); assert.equal(exported.sound.slot('main').autoPlay, false, 'Audio waits for whole-game readiness');
    exported.sound.stop();
  } finally { editor.sceneResourceSession?.cancel(); app.destroy(); }
});

test('missing audio retains its source for retry and malformed sound slots are rejected without replacing the scene', async () => {
  const { editor, app } = setup();
  app.assets.loadFromUrl = (url, type, callback) => callback('missing');
  try {
    const report = await editor.openProjectJSON({ root: { children: [{ name: 'MissingSound', components: { sound: { assetUrl: './missing.wav', autoPlay: true } } }] } });
    assert.equal(report.status, 'failed'); assert.equal(report.failures[0].kind, 'audio:main');
    const saved = editor.exportProjectJSON(); assert.ok(saved.includes('./missing.wav'));
    const bad = JSON.parse(saved); bad.scenes[0].data.root.children[0].components.sound.slots.push({ name: 'main', url: './duplicate.wav' });
    assert.equal(editor.loadProjectJSON(bad), false); assert.equal(editor.exportProjectJSON(), saved);
    assert.equal(serializeSoundComponent(app.root.findByName('MissingSound').sound, app.assets).slots[0].url, './missing.wav');
  } finally { editor.sceneResourceSession?.cancel(); app.destroy(); }
});

test('terrain creation is one undoable operation and redo preserves the final height grid', () => {
  const { editor, app } = setup();
  try {
    const terrain = new TerrainGenerator(editor).generate({ subdivisions: 2, seed: 0, maxHeight: 0 });
    const original = structuredClone(terrain._terrainData);
    assert.equal(editor.commandBus.undoStack.length, 1); editor.commandBus.undo(); assert.equal(terrain.parent, null);
    editor.commandBus.redo(); assert.equal(terrain.parent, app.root); assert.deepEqual(terrain._terrainData, original);
  } finally { app.destroy(); }
});

test('AI sound action configures a real slot and duplicate entities retain desired editor-silent autoplay metadata', async () => {
  const { editor, app } = setup();
  try {
    const { AIExecutor } = await import('../src/ai/ai-executor.js');
    const asset = new pc.Asset('voice', 'audio', { url: './voice.wav' }); asset.resource = new pc.Sound({ duration: 2 }); asset.loaded = true; app.assets.add(asset);
    app.assets.loadFromUrl = (url, type, callback) => callback(null, asset);
    const executed = await new AIExecutor(editor).executeActions([{ action: 'add_sound', name: 'Voice', url: './voice.wav', autoPlay: true, loop: false, volume: 0 }]);
    assert.equal(executed.length, 1);
    const entity = app.root.findByName('Voice'); assert.equal(entity.sound.slot('main').asset, asset.id); assert.equal(entity.sound.volume, 0);
    const duplicate = editor.duplicateEntity(entity);
    const saved = serializeSoundComponent(duplicate.sound, app.assets);
    assert.equal(saved.slots[0].autoPlay, true); assert.equal(saved.slots[0].loop, false); assert.equal(duplicate.sound.slot('main').autoPlay, false);
  } finally { editor.sceneResourceSession?.cancel(); app.destroy(); }
});

test('delivered audio references resolve completed local import bytes and unresolved blob sources fail visibly', async () => {
  const { editor, app } = setup();
  try {
    const entity = editor.createEntity({ name: 'ImportedAudio' }); entity.addComponent('sound'); entity.sound.assetUrl = 'blob:audio-import';
    editor.projectAssets = [{ id: 'audio', name: 'sound.wav', type: 'audio', url: 'data:audio/wav;base64,AAAA', sourceUrl: 'blob:audio-import', base64Data: 'data:audio/wav;base64,AAAA' }];
    const html = new GameBundler(editor).compileStandaloneHTML();
    assert.ok(!html.includes('blob:audio-import')); assert.ok(html.includes('data:audio/wav;base64,AAAA'));
    delete editor.projectAssets[0].base64Data;
    assert.throws(() => new GameBundler(editor).compileStandaloneHTML(), /temporary asset reference/);
  } finally { app.destroy(); }
});

test('repairing one audio source does not clear unrelated missing-model readiness failures', async () => {
  const { editor, app } = setup();
  app.assets.loadFromUrl = (url, type, done) => done('missing');
  try {
    await editor.openProjectJSON({ root: { children: [
      { name: 'MissingTree', modelUrl: './missing.glb' },
      { name: 'Audio', components: { sound: { assetUrl: './old.wav' } } }
    ] } });
    const asset = new pc.Asset('fixed', 'audio', { url: './fixed.wav' }); asset.resource = new pc.Sound({ duration: 2 }); asset.loaded = true; app.assets.add(asset);
    app.assets.loadFromUrl = (url, type, done) => done(null, asset);
    const report = await editor.configureSound(app.root.findByName('Audio'), { assetUrl: './fixed.wav' });
    assert.equal(report.status, 'failed'); assert.equal(report.failures.length, 1); assert.equal(report.failures[0].entityName, 'MissingTree');
    assert.equal(app.root.findByName('Audio').sound.slot('main').asset, asset.id);
  } finally { editor.sceneResourceSession?.cancel(); app.destroy(); }
});
