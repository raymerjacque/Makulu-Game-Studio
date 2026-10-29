import test from 'node:test';
import assert from 'node:assert/strict';
import * as pc from 'playcanvas';
import { Editor } from '../src/core/editor.js';
import { BehaviorManager } from '../src/core/behaviors.js';
import { GameBundler } from '../src/compiler/game-bundler.js';
import { BEHAVIOR_CATALOG } from '../src/ui/inspector.js';

test('Studio Expansion v2: All 80 behaviors exist in BEHAVIOR_CATALOG', () => {
  assert.equal(BEHAVIOR_CATALOG.length, 80, 'Behavior catalog should contain exactly 80 AAA no-code behaviors');
  const types = BEHAVIOR_CATALOG.map(b => b.type);
  assert.ok(types.includes('gravity_well_attractor'));
  assert.ok(types.includes('flashlight_battery'));
  assert.ok(types.includes('waypoint_flight_path'));
  assert.ok(types.includes('weather_rain_snow_toggle'));
  assert.ok(types.includes('destructible_wall_cluster'));
  assert.ok(types.includes('inventory_drop_spawner'));
});

test('Studio Expansion v2: New 7 behaviors attach and update in BehaviorManager', () => {
  const editor = new Editor();
  const bm = new BehaviorManager(editor);
  const ent = new pc.Entity('TestHero');
  const other = new pc.Entity('DynamicBox');
  other.rigidbody = { type: 'dynamic' };

  editor.root.addChild(ent);
  editor.root.addChild(other);

  bm.attachBehavior(ent, 'gravity_well_attractor', { radius: 10, force: 15 });
  bm.attachBehavior(ent, 'flashlight_battery', { maxBattery: 100, drainRate: 5 });
  bm.attachBehavior(ent, 'waypoint_flight_path', { speed: 8, bankAngle: 25 });
  bm.attachBehavior(ent, 'weather_rain_snow_toggle', { weatherType: 'rain' });
  bm.attachBehavior(ent, 'destructible_wall_cluster', { rows: 3, cols: 4 });
  bm.attachBehavior(ent, 'inventory_drop_spawner', { dropItem: 'Health Potion' });

  assert.equal(bm.hasBehavior(ent, 'gravity_well_attractor'), true);
  assert.equal(bm.hasBehavior(ent, 'flashlight_battery'), true);
  assert.equal(bm.hasBehavior(ent, 'waypoint_flight_path'), true);
  assert.equal(bm.hasBehavior(ent, 'weather_rain_snow_toggle'), true);
  assert.equal(bm.hasBehavior(ent, 'destructible_wall_cluster'), true);
  assert.equal(bm.hasBehavior(ent, 'inventory_drop_spawner'), true);
});

test('Studio Expansion v2: Material normal map and emissive serialization', () => {
  const editor = new Editor();
  const ent = new pc.Entity('TexturedEntity');
  const mat = new pc.StandardMaterial();
  mat.diffuse = new pc.Color(0.8, 0.2, 0.1);
  mat.emissive = new pc.Color(0.1, 0.5, 0.9);
  mat._normalMapUrl = './textures/normal_map.png';
  ent.render = { type: 'box', material: mat };

  editor.root.addChild(ent);

  const json = editor.exportSceneJSON();
  const data = JSON.parse(json);

  const childNode = data.root.children.find(c => c.name === 'TexturedEntity');
  assert.ok(childNode);
  assert.ok(childNode.components.render.material);
  assert.equal(childNode.components.render.material.normalMapUrl, './textures/normal_map.png');
  assert.deepEqual(childNode.components.render.material.emissive, [0.1, 0.5, 0.9]);
});

test('Studio Expansion v2: Standalone GameBundler compiles HTML with new behaviors and normal map data', () => {
  const editor = new Editor();
  const bm = new BehaviorManager(editor);
  const ent = new pc.Entity('FlyingShip');
  ent.render = { type: 'capsule' };

  bm.attachBehavior(ent, 'waypoint_flight_path', { speed: 10, bankAngle: 30 });
  bm.attachBehavior(ent, 'gravity_well_attractor', { radius: 12 });
  editor.root.addChild(ent);

  const bundler = new GameBundler(editor);
  const html = bundler.compileStandaloneHTML({ title: 'Expanded Studio Game' });

  assert.ok(html.includes('waypoint_flight_path'));
  assert.ok(html.includes('gravity_well_attractor'));
  assert.ok(html.includes('Expanded Studio Game'));
});
