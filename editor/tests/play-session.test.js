import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import * as pc from 'playcanvas';
import { TerrainGenerator } from '../src/engine/terrain-generator.js';
import { Editor } from '../src/core/editor.js';
import { BehaviorManager } from '../src/core/behaviors.js';
import { ProjectPersistence } from '../src/project/project-persistence.js';
import { bindEditorPhysics } from '../src/engine/editor-physics.js';
import { exportRuntimeAssets } from '../build-support/runtime-assets.js';
import descriptor from '../runtime-manifest.json' with { type: 'json' };

function setup() {
  const app = new pc.AppBase({ id: 'play-session-test' }), options = new pc.AppOptions();
  options.graphicsDevice = new pc.NullGraphicsDevice({ width: 64, height: 64 });
  options.componentSystems = [pc.RenderComponentSystem, pc.CollisionComponentSystem, pc.RigidBodyComponentSystem, pc.CameraComponentSystem]; options.resourceHandlers = []; app.init(options);
  const editor = new Editor(); editor.runtime = { app };
  new BehaviorManager(editor);
  return { editor, app };
}

test('Stop restores original identities, hierarchy, local enabled flags, material, behavior, HUD and undo history after destructive play', () => {
  const { editor, app } = setup();
  try {
    const camera = new pc.Entity('EditorCamera'); camera.setPosition(0, 5, 10); app.root.addChild(camera);
    const parent = editor.createEntity({ name: 'Group' }); parent.enabled = false;
    const child = editor.createEntity({ name: 'Child', parent });
    const player = editor.createEntity({ name: 'Player', transform: { position: [1, 2, 3] }, components: [{ type: 'render', properties: { type: 'box' } }] });
    const material = new pc.StandardMaterial(); material.diffuse.set(0.2, 0.3, 0.4); material.update(); player.render.material = material;
    editor.behaviors.attachBehavior(player, 'health', { maxHp: 100 });
    editor.selection.set(player); editor.triggers.triggers.set('Player', { radius: 2 });
    const before = editor.exportProjectJSON(), history = [...editor.commandBus.undoStack], originalBehavior = editor.behaviors.activeBehaviors;
    const originals = [...app.root.children];
    assert.equal(editor.startPlay(), true);
    const preview = app.root.findByName('Player'); assert.notEqual(preview, player);
    assert.equal(player.enabled, false); assert.equal(preview.enabled, true);
    preview.setPosition(99, -10, 4); preview.render.material.diffuse.set(1, 0, 0);
    editor.behaviors.getBehaviors(preview)[0].params.currentHp = 0;
    editor.hudConfig.score.initial = 900; editor.triggers.triggers.get('Player').radius = 100;
    const spawned = editor.createEntity({ name: 'Temporary' });
    const detached = editor.createEntity({ name: 'Detached' }); detached.remove();
    let spawnedDestroyed = 0, detachedDestroyed = 0;
    spawned.once('destroy', () => spawnedDestroyed++); detached.once('destroy', () => detachedDestroyed++);
    camera.setPosition(100, 100, 100);
    preview.destroy();
    assert.equal(editor.commandBus.undo(), null); assert.deepEqual(editor.commandBus.undoStack, history);
    assert.throws(() => editor.exportProjectJSON(), /Stop/);
    assert.equal(editor.switchScene('Another'), false); assert.equal(editor.loadSceneJSON({}), false);
    assert.equal(editor.stopPlay(), true);
    assert.deepEqual(app.root.children, originals); assert.equal(editor.selection.getActive(), player);
    assert.equal(editor.behaviors.activeBehaviors, originalBehavior);
    assert.equal(player.render.material, material); assert.equal(material.diffuse.r, 0.2);
    assert.equal(child._enabled, true); assert.equal(parent.enabled, false);
    assert.deepEqual(camera.getPosition().toArray(), [0, 5, 10]);
    assert.equal(spawnedDestroyed, 1); assert.equal(detachedDestroyed, 1);
    assert.equal(editor.exportProjectJSON(), before);
    assert.deepEqual(editor.commandBus.undoStack, history);
    editor.commandBus.undo(); assert.equal(app.root.findByName('Player'), null);
    editor.commandBus.redo(); assert.equal(app.root.findByName('Player'), player);
    assert.equal(editor.stopPlay(), false);
  } finally { app.destroy(); }
});

test('real Ammo simulates only the disposable body and repeated sessions start at the authoring position', async () => {
  const oldAmmo = globalThis.Ammo;
  const source = exportRuntimeAssets().get(`runtime/${descriptor.files.physics.file}`).toString();
  globalThis.Ammo = await vm.runInNewContext(source + '\nAmmo;', { console, setTimeout, clearTimeout })();
  const { editor, app } = setup();
  try {
    app.systems.rigidbody.setPhysicsWorld(new pc.AmmoPhysicsWorld()); bindEditorPhysics(app, editor.events);
    const body = editor.createEntity({ name: 'Falling', transform: { position: [0, 5, 0] }, components: [
      { type: 'collision', properties: { type: 'sphere', radius: 0.5 } }, { type: 'rigidbody', properties: { type: 'dynamic', mass: 1 } }
    ] });
    for (let run = 0; run < 3; run++) {
      editor.startPlay(); const preview = app.root.findByName('Falling');
      assert.equal(preview.getPosition().y, 5);
      for (let frame = 0; frame < 30; frame++) app.systems.rigidbody.onUpdate(1 / 60);
      assert.ok(preview.getPosition().y < 4.5); assert.equal(body.getPosition().y, 5);
      editor.stopPlay(); assert.equal(app.root.findByName('Falling'), body); assert.equal(body.getPosition().y, 5);
      assert.equal(app.systems.rigidbody.timeScale, 0);
    }
  } finally { app.destroy(); globalThis.Ammo = oldAmmo; }
});

test('failed Play subscriber rolls back and failed Stop subscriber still restores originals', () => {
  const { editor, app } = setup();
  try {
    const original = editor.createEntity({ name: 'Keep' }), before = editor.exportProjectJSON();
    const unsubscribe = editor.events.on('game:play', () => { throw new Error('start failure'); });
    assert.throws(() => editor.startPlay(), /start failure/);
    assert.equal(editor.isPlaying, false); assert.equal(editor.playSession.state, 'idle');
    assert.equal(editor.exportProjectJSON(), before); assert.equal(app.root.findByName('Keep'), original);
    unsubscribe(); editor.startPlay();
    const off = editor.events.on('game:stop', () => { throw new Error('stop failure'); });
    assert.throws(() => editor.stopPlay(), /stop failure/); off();
    assert.equal(editor.isPlaying, false); assert.equal(editor.exportProjectJSON(), before);
    assert.equal(editor.startPlay(), true); editor.stopPlay();
  } finally { app.destroy(); }
});

test('resource failures block Play without changing state and duplicate Play cannot replace its snapshot', () => {
  const { editor, app } = setup();
  try {
    const original = editor.createEntity({ name: 'Keep' });
    editor.sceneResourceStatus = { status: 'failed' };
    assert.throws(() => editor.startPlay(), /resources/); assert.equal(editor.isPlaying, undefined);
    assert.equal(app.root.findByName('Keep'), original);
    editor.sceneResourceStatus.status = 'ready'; editor.startPlay();
    assert.throws(() => editor.startPlay(), /already active/); editor.stopPlay();
    assert.equal(app.root.findByName('Keep'), original);
  } finally { app.destroy(); }
});

test('runtime events and temporary edits do not dirty a saved project or replace its recovery snapshot', async () => {
  const { editor, app } = setup();
  const rows = [], persistence = new ProjectPersistence(editor, { intervalMs: 0, store: { list: async () => [], save: async row => rows.push(row) } });
  try {
    editor.createEntity({ name: 'Keep' }); await persistence.initialize();
    const baseline = persistence.baseline;
    editor.startPlay(); editor.createEntity({ name: 'RuntimeOnly' }); editor.hudConfig.score.initial = 50;
    assert.equal(await persistence.checkpoint(), false); assert.equal(persistence.state.dirty, false);
    editor.stopPlay(); persistence.check();
    assert.equal(persistence.state.dirty, false); assert.equal(persistence.baseline, baseline); assert.equal(rows.length, 0);
  } finally { persistence.dispose(); app.destroy(); }
});


test('terrain mesh resources survive disposable preview teardown without rebuilding the authoring mesh', () => {
  const { editor, app } = setup();
  try {
    const terrain = new TerrainGenerator(editor).generate({ name: 'Island', seed: 2, subdivisions: 4 });
    const mesh = terrain.render.meshInstances[0].mesh, vertices = mesh.vertexBuffer;
    for (let run = 0; run < 2; run++) {
      editor.startPlay();
      const preview = app.root.findByName('Island'); assert.notEqual(preview, terrain);
      assert.deepEqual(preview._terrainData, terrain._terrainData);
      preview.setPosition(9, 8, 7); editor.stopPlay();
      assert.equal(terrain.render.meshInstances[0].mesh, mesh); assert.equal(mesh.vertexBuffer, vertices);
      assert.equal(vertices.numVertices, 25); assert.equal(app.root.findByName('Island'), terrain);
    }
  } finally { app.destroy(); }
});


test('editor-only helpers are omitted from saved content and survive scene replacement', () => {
  const { editor, app } = setup();
  try {
    const helper = new pc.Entity('HelperWithArbitraryName'); helper._studioEditorOnly = true;
    app.root.addChild(helper); editor.createEntity({ name: 'Content' });
    const document = editor.exportProjectJSON(); assert.ok(!document.includes('HelperWithArbitraryName'));
    assert.equal(editor.loadProjectJSON(document), true); assert.equal(helper.parent, app.root);
    editor.startPlay(); assert.equal(app.root.findByName('HelperWithArbitraryName'), helper);
    editor.stopPlay(); assert.equal(helper.parent, app.root);
  } finally { app.destroy(); }
});

test('session-owned delayed callbacks are cancelled on Stop and cannot affect a later session', async () => {
  const { editor, app } = setup(); let fired = 0;
  try {
    editor.startPlay(); editor.playSession.defer(() => fired++, 10); editor.stopPlay();
    editor.startPlay(); await new Promise(resolve => setTimeout(resolve, 30));
    assert.equal(fired, 0); assert.equal(editor.playSession.timers.size, 0); editor.stopPlay();
  } finally { app.destroy(); }
});
