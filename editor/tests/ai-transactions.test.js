import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import { exportRuntimeAssets } from '../build-support/runtime-assets.js';
import descriptor from '../runtime-manifest.json' with { type: 'json' };
import * as pc from 'playcanvas';
import { Editor } from '../src/core/editor.js';
import { Command } from '../src/core/command-bus.js';
import { AIExecutor } from '../src/ai/ai-executor.js';
import { validateActionBatch } from '../src/ai/action-contract.js';
import { BehaviorManager } from '../src/core/behaviors.js';
import { EngineRuntime } from '../src/engine/pc-app.js';
import { ProjectPersistence } from '../src/project/project-persistence.js';
import ids from '../src/ai/action-ids.json' with { type: 'json' };
import behaviors from '../src/ai/behavior-ids.json' with { type: 'json' };

function fixture() {
  const app = new pc.AppBase({ id: 'ai-transaction-test' }), options = new pc.AppOptions();
  options.graphicsDevice = new pc.NullGraphicsDevice({ width: 64, height: 64 });
  options.componentSystems = [pc.RenderComponentSystem, pc.LightComponentSystem, pc.CollisionComponentSystem, pc.RigidBodyComponentSystem]; options.resourceHandlers = []; app.init(options);
  const editor = new Editor(), runtime = Object.create(EngineRuntime.prototype); runtime.app = app; editor.runtime = runtime; new BehaviorManager(editor);
  return { app, editor, executor: new AIExecutor(editor) };
}

test('contracts reject malformed/unknown/dangerous action payloads before changing the project', async () => {
  const { app, editor, executor } = fixture();
  try {
    const before = editor.exportProjectJSON();
    for (const bad of [ { action: 'unknown' }, { action: 'spawn_primitive', type: 'imaginary' }, { action: 'modify_entity', name: 'x', position: [1, NaN, 3] }, { action: 'create_light', intensity: 'bright' }, { action: 'generate_script', name: 'constructor', code: '/* invalid registry key */' }, { action: 'spawn_primitive', type: 'box', typo: true }, { action: 'spawn_primitive', type: 'box', components: [{ type: 'rigidbody' }] }, { action: 'configure_hud', config: { health: { enabled: 'false' } } }, JSON.parse('{"action":"generate_script","name":"x","code":"ok","__proto__":{}}') ]) {
      await assert.rejects(executor.executeActions([{ action: 'spawn_primitive', type: 'box', name: 'Never' }, bad]));
      assert.equal(editor.exportProjectJSON(), before); assert.equal(editor.commandBus.undoStack.length, 0);
    }
    assert.throws(() => executor.parseActions('```json:actions\n{broken}\n```'), /No edits/);
  } finally { app.destroy(); }
});

test('mixed supported batch preserves exact scene/settings/behavior/script state through one Undo and Redo', async () => {
  const { app, editor, executor } = fixture();
  try {
    const original = editor.createEntity({ name: 'Original', transform: { position: [2, 0, 0] }, components: [{ type: 'render', properties: { type: 'box' } }] });
    editor.selection.set(original); const before = editor.exportProjectJSON(), count = editor.commandBus.undoStack.length;
    const result = await executor.executeActions([
      { action: 'spawn_primitive', type: 'sphere', name: 'Created', position: [1, 2, 3] },
      { action: 'modify_entity', name: 'Original', position: [3, 4, 5], rotation: [0, 30, 0] },
      { action: 'create_material', target: 'Created', diffuse: [0, 1, 0], opacity: 0, metalness: 0 },
      { action: 'attach_behavior', target: 'Created', behavior: 'spin', properties: { speed: 12 } },
      { action: 'generate_script', name: 'test.js', code: '/* stored only */' },
      { action: 'configure_hud', config: { score: { initial: 20 } } },
      { action: 'set_physics_gravity', gravity: [0, 0, 0] },
      { action: 'set_sky_atmosphere', preset: 'sunset' },
      { action: 'create_light', name: 'ZeroLight', intensity: 0, range: 0 }
    ]);
    const after = editor.exportProjectJSON(), created = app.root.findByName('Created');
    assert.equal(result.batchInfo.undoable, true); assert.equal(result.length, 9); assert.equal(editor.commandBus.undoStack.length, count + 1);
    assert.equal(app.root.findByName('ZeroLight').light.intensity, 0); assert.equal(created.render.material.opacity, 0); assert.equal(editor.hudConfig.score.label, 'Score:');
    editor.commandBus.undo(); assert.equal(editor.exportProjectJSON(), before); assert.equal(editor.selection.getActive(), original); assert.equal(created.enabled, false);
    editor.commandBus.redo(); assert.equal(editor.exportProjectJSON(), after); assert.equal(app.root.findByName('Created'), created);
    editor.commandBus.undo(); editor.commandBus.undo(); assert.equal(original.parent, null);
  } finally { app.destroy(); }
});

test('target failure rolls back earlier edits and retains prior undo and redo stacks', async () => {
  const { app, editor, executor } = fixture();
  try {
    const keep = editor.createEntity({ name: 'Keep' }); editor.createEntity({ name: 'RedoKeep' }); editor.commandBus.undo(); editor.selection.set(keep);
    const before = editor.exportProjectJSON(), undo = [...editor.commandBus.undoStack], redo = [...editor.commandBus.redoStack];
    await assert.rejects(executor.executeActions([{ action: 'spawn_primitive', type: 'box', name: 'Temporary' }, { action: 'generate_script', name: 'temp.js', code: '/* temp */' }, { action: 'modify_entity', name: 'Missing', position: [9, 9, 9] }]), /rolled back/);
    assert.equal(editor.exportProjectJSON(), before); assert.equal(editor.selection.getActive(), keep);
    assert.deepEqual(editor.commandBus.undoStack, undo); assert.deepEqual(editor.commandBus.redoStack, redo); assert.equal(app.root.findByName('Temporary'), null);
  } finally { app.destroy(); }
});

test('ambiguous names and helper targets are refused, stable IDs select exactly one editable entity', async () => {
  const { app, editor, executor } = fixture();
  try {
    const a = editor.createEntity({ name: 'Twin' }), b = editor.createEntity({ name: 'Twin' });
    const helper = new pc.Entity('Protected'); helper._studioEditorOnly = true; app.root.addChild(helper); const nested = new pc.Entity('NestedHelper'); helper.addChild(nested);
    editor.exportProjectJSON();
    await assert.rejects(executor.executeActions([{ action: 'modify_entity', name: 'Twin', position: [1, 0, 0] }]), /ambiguous/);
    await assert.rejects(executor.executeActions([{ action: 'delete_entity', target: 'NestedHelper' }]), /not found/);
    await executor.executeActions([{ action: 'modify_entity', targetId: a._studioId, position: [1, 0, 0] }]);
    assert.equal(a.getPosition().x, 1); assert.equal(b.getPosition().x, 0);
  } finally { app.destroy(); }
});

test('delete restores sibling order and local enabled state, and selected refers to the pre-batch selection', async () => {
  const { app, editor, executor } = fixture();
  try {
    const a = editor.createEntity({ name: 'First' }), b = editor.createEntity({ name: 'Second' }), c = editor.createEntity({ name: 'Third' });
    b.enabled = false; editor.selection.set(b);
    await executor.executeActions([{ action: 'spawn_primitive', name: 'New', type: 'box' }, { action: 'modify_entity', name: 'selected', position: [2, 0, 0] }, { action: 'delete_entity', target: 'First' }]);
    assert.equal(b.getPosition().x, 2); assert.equal(a.parent, null);
    editor.commandBus.undo(); assert.deepEqual(app.root.children, [a, b, c]); assert.equal(b._enabled, false); assert.equal(editor.selection.getActive(), b);
    const child = editor.createEntity({ name: 'Child', parent: a }); editor.selection.set(child);
    await executor.executeActions([{ action: 'delete_entity', target: 'First' }]); assert.equal(editor.selection.getActive(), null);
    editor.commandBus.undo(); assert.equal(editor.selection.getActive(), child);
  } finally { app.destroy(); }
});

test('failed recovery checkpoint and stale project revision prevent every AI mutation', async () => {
  const { app, editor, executor } = fixture();
  try {
    const actions = [{ action: 'generate_script', name: 'never.js', code: '/* no */' }];
    editor.persistence = { protectBeforeReplace: async () => false };
    await assert.rejects(executor.executeActions(actions), /checkpoint/); assert.equal(editor.scripts.size, 0);
    editor.persistence.protectBeforeReplace = async () => { editor.projectName = 'Changed by user'; return true; };
    await assert.rejects(executor.executeActions(actions), /project changed/); assert.equal(editor.scripts.size, 0); assert.equal(editor.commandBus.undoStack.length, 0);
  } finally { app.destroy(); }
});

test('pre-edit recovery captures original content and rollback recalculates clean state', async () => {
  const { app, editor, executor } = fixture(), rows = [];
  const persistence = new ProjectPersistence(editor, { intervalMs: 0, store: { list: async () => [], save: async row => rows.push(row) } });
  try {
    await persistence.initialize(); editor.createEntity({ name: 'UnsavedKeep' });
    await executor.executeActions([{ action: 'generate_script', name: 'change.js', code: '/* edit */' }]);
    assert.ok(rows.length); assert.equal(JSON.parse(rows[0].json).scripts['change.js'], undefined);
    editor.commandBus.undo(); persistence.baseline = editor.exportProjectJSON(); persistence.state.dirty = false;
    await assert.rejects(executor.executeActions([{ action: 'generate_script', name: 'temp.js', code: '' }, { action: 'delete_entity', target: 'Absent' }]), /rolled back/);
    assert.equal(persistence.state.dirty, false);
  } finally { persistence.dispose(); app.destroy(); }
});

test('legacy batches are identified separately and contract ID lists match the source catalogs', async () => {
  const { app, editor, executor } = fixture();
  try {
    const result = await executor.executeActions([{ action: 'open_tool_modal', modal: 'Terrain' }]); assert.equal(result.batchInfo.mode, 'legacy'); assert.equal(result.batchInfo.undoable, false);
    const source = await fs.readFile(new URL('../src/ai/ai-executor.js', import.meta.url), 'utf8');
    assert.deepEqual(ids, [...source.matchAll(/case '([^']+)'/g)].map(match => match[1]));
    const inspector = await fs.readFile(new URL('../src/ui/inspector.js', import.meta.url), 'utf8');
    assert.deepEqual(behaviors, [...new Set([...inspector.matchAll(/\{ type: '([^']+)', icon:/g)].map(match => match[1]))]);
    assert.throws(() => validateActionBatch(new Array(101).fill({ action: 'clear_scene' })), /100/);
  } finally { app.destroy(); }
});

test('command replay failures keep their history entry available and synchronous transactions reject nesting', () => {
  const editor = new Editor(); let value = 0, failUndo = false;
  editor.commandBus.runTransaction('Batch', () => editor.commandBus.execute(new Command('Value', () => { value = 1; }, () => { if (failUndo) throw new Error('undo blocked'); value = 0; })));
  failUndo = true; assert.throws(() => editor.commandBus.undo(), /undo blocked/); assert.equal(editor.commandBus.undoStack.length, 1); assert.equal(value, 1);
  failUndo = false; editor.commandBus.undo(); assert.equal(value, 0);
  assert.throws(() => editor.commandBus.runTransaction('Outer', () => editor.commandBus.runTransaction('Inner', () => {})), /rolled back/);
});


test('real physics bodies leave simulation on batch Undo and failed batches destroy owned bodies', async () => {
  const oldAmmo = globalThis.Ammo;
  const source = exportRuntimeAssets().get(`runtime/${descriptor.files.physics.file}`).toString();
  globalThis.Ammo = await vm.runInNewContext(source + '\nAmmo;', { console, setTimeout, clearTimeout })();
  const { app, editor, executor } = fixture();
  try {
    app.systems.rigidbody.setPhysicsWorld(new pc.AmmoPhysicsWorld());
    const spawn = { action: 'spawn_primitive', type: 'sphere', name: 'Body', position: [0, 5, 0], components: [{ type: 'collision', properties: { type: 'sphere', radius: 0.5 } }, { type: 'rigidbody', properties: { type: 'dynamic', mass: 1 } }] };
    await executor.executeActions([spawn]); const body = app.root.findByName('Body'); assert.equal(body.rigidbody._simulationEnabled, true);
    editor.commandBus.undo(); assert.equal(body.rigidbody._simulationEnabled, false);
    const before = body.getPosition().y; for (let i = 0; i < 30; i++) app.systems.rigidbody.onUpdate(1 / 60); assert.equal(body.getPosition().y, before);
    editor.commandBus.redo(); assert.equal(body.rigidbody._simulationEnabled, true);
    for (let i = 0; i < 30; i++) app.systems.rigidbody.onUpdate(1 / 60); assert.ok(body.getPosition().y < 4.5);
    let removed = 0; app.systems.rigidbody.on('remove', () => removed++);
    await assert.rejects(executor.executeActions([{ ...spawn, name: 'TemporaryBody' }, { action: 'delete_entity', target: 'Missing' }]), /rolled back/);
    assert.equal(app.root.findByName('TemporaryBody'), null); assert.ok(removed > 0);
  } finally { app.destroy(); globalThis.Ammo = oldAmmo; }
});


test('material batch Undo restores distinct per-mesh materials without destroying shared authoring resources', async () => {
  const { app, editor, executor } = fixture();
  try {
    const node = editor.createEntity({ name: 'Multi', components: [{ type: 'render', properties: { type: 'box' } }] });
    const old = node.render.meshInstances[0], original = old.material, other = new pc.StandardMaterial();
    const first = new pc.MeshInstance(old.mesh, original, node), second = new pc.MeshInstance(old.mesh, other, node); node.render.meshInstances = [first, second];
    await executor.executeActions([{ action: 'create_material', target: 'Multi', diffuse: [0.2, 0.3, 0.4] }]);
    assert.equal(first.material, second.material); assert.notEqual(first.material, original);
    editor.commandBus.undo(); assert.equal(first.material, original); assert.equal(second.material, other);
    editor.commandBus.redo(); assert.equal(first.material, second.material);
  } finally { app.destroy(); }
});
