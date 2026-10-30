import test from 'node:test';
import assert from 'node:assert/strict';
import { Editor } from '../src/core/editor.js';
import { BehaviorManager } from '../src/core/behaviors.js';
import { BEHAVIOR_CATALOG } from '../src/ui/inspector.js';
import { GameBundler } from '../src/compiler/game-bundler.js';

test('BEHAVIOR_CATALOG contains at least 110 total behaviors', () => {
  assert.ok(BEHAVIOR_CATALOG.length >= 110, `Expected >= 110 behaviors, got ${BEHAVIOR_CATALOG.length}`);
});

test('BehaviorManager attaches and manages new AAA behaviors', () => {
  const editor = new Editor();
  const behaviors = new BehaviorManager(editor);
  editor.behaviors = behaviors;

  const ent = editor.createEntity({ name: 'TestHero' });

  const newTypes = [
    'navmesh_agent',
    'telekinesis_gravity_lift',
    'procedural_ik_footing',
    'time_rewind_effect',
    'procedural_dungeon_room_spawner',
    'magnetic_grapple_tether',
    'surface_climbing_spider',
    'stealth_invisibility_cloak',
    'thermal_night_vision_toggle',
    'weapon_recoil_camera_kick'
  ];

  newTypes.forEach(type => {
    behaviors.attachBehavior(ent, type, { testParam: 1 });
    assert.ok(behaviors.hasBehavior(ent, type), `Behavior ${type} should be attached`);
  });

  const attached = behaviors.getBehaviors(ent);
  assert.ok(attached.length >= 10, 'All 10 new behaviors should be attached');
});

test('Entity tagging and transform lock (freeze) properties persist in JSON export', () => {
  const editor = new Editor();
  const ent = editor.createEntity({
    name: 'TaggedChest',
    tags: ['loot', 'interactable'],
    locked: true
  });

  assert.deepEqual(ent.tags, ['loot', 'interactable']);
  assert.equal(ent.locked, true);

  const json = editor.exportSceneJSON();
  const parsed = JSON.parse(json);

  const rootChild = parsed.root.children.find(c => c.name === 'TaggedChest');
  assert.ok(rootChild, 'Child entity should exist in JSON');
  assert.deepEqual(rootChild.tags, ['loot', 'interactable']);
  assert.equal(rootChild.locked, true);

  // Restore scene
  const editor2 = new Editor();
  editor2.loadSceneJSON(json);
  const restored = editor2.root.children.find(c => c.name === 'TaggedChest');
  assert.ok(restored, 'Restored entity should exist');
  assert.deepEqual(restored.tags, ['loot', 'interactable']);
  assert.equal(restored.locked, true);
});

test('Physics collision group and mask bitmasks persist in JSON export', () => {
  const editor = new Editor();
  const ent = editor.createEntity({ name: 'PhysicsWall' });
  editor.addComponent(ent, 'collision', { type: 'box', group: 2, mask: 4 });
  editor.addComponent(ent, 'rigidbody', { type: 'static', group: 2, mask: 4 });

  const json = editor.exportSceneJSON();
  const parsed = JSON.parse(json);
  const rootChild = parsed.root.children.find(c => c.name === 'PhysicsWall');

  assert.equal(rootChild.components.collision.group, 2);
  assert.equal(rootChild.components.collision.mask, 4);
  assert.equal(rootChild.components.rigidbody.group, 2);
  assert.equal(rootChild.components.rigidbody.mask, 4);
});

test('GameBundler compiles standalone HTML with new AAA behaviors', () => {
  const editor = new Editor();
  const behaviors = new BehaviorManager(editor);
  editor.behaviors = behaviors;

  const player = editor.createEntity({ name: 'PlayerHero', tags: ['player'] });
  behaviors.attachBehavior(player, 'stealth_invisibility_cloak', { duration: 5.0 });
  behaviors.attachBehavior(player, 'thermal_night_vision_toggle', { ambientBoost: 2.0 });

  const bundler = new GameBundler(editor);
  const html = bundler.compileStandaloneHTML({ title: 'Expansion Test' });

  assert.ok(html.includes('stealth_invisibility_cloak'), 'Compiled HTML should include stealth_invisibility_cloak handler');
  assert.ok(html.includes('thermal_night_vision_toggle'), 'Compiled HTML should include thermal_night_vision_toggle handler');
  assert.ok(html.includes('navmesh_agent'), 'Compiled HTML should include navmesh_agent handler');
});
