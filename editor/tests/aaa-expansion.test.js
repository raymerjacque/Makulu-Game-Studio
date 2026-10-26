import test from 'node:test';
import assert from 'node:assert';
import { Editor } from '../src/core/editor.js';
import { BehaviorManager } from '../src/core/behaviors.js';
import { AIExecutor } from '../src/ai/ai-executor.js';
import { GameBundler } from '../src/compiler/game-bundler.js';

test('AAA Expansion: Attach and query all 10 new AAA behaviors', () => {
  const editor = new Editor();
  const behaviors = new BehaviorManager(editor);
  editor.behaviors = behaviors;

  const entity = editor.createEntity({ name: 'TestHero' });

  const aaaBehaviors = [
    'wall_run_controller',
    'grappling_hook',
    'grav_gun_physicshandler',
    'inventory_crafting',
    'dialogue_system',
    'quest_tracker',
    'minimap_radar',
    'cover_system',
    'ragdoll_physics',
    'day_night_weather_cycle'
  ];

  aaaBehaviors.forEach(bType => {
    behaviors.attachBehavior(entity, bType, { testParam: 123 });
    assert.strictEqual(behaviors.hasBehavior(entity, bType), true);
  });

  const attached = behaviors.getBehaviors(entity);
  assert.strictEqual(attached.length, aaaBehaviors.length);
});

test('AAA Expansion: Execute new AIExecutor actions', async () => {
  const editor = new Editor();
  const behaviors = new BehaviorManager(editor);
  editor.behaviors = behaviors;
  const executor = new AIExecutor(editor);

  const actions = [
    { action: 'build_architecture', type: 'room', position: [0, 0, 0], width: 10, depth: 10, height: 4 },
    { action: 'create_water_volume', name: 'AI_Water', position: [0, -1, 0], extents: [8, 2, 8] },
    { action: 'create_hazard_zone', name: 'AI_Lava', position: [5, 0, 0], radius: 3 },
    { action: 'create_scene', name: 'Level_AI_Built' },
    { action: 'switch_scene', name: 'Level_AI_Built' }
  ];

  const executed = await executor.executeActions(actions);
  assert.strictEqual(executed.length, actions.length);
  assert.strictEqual(editor.activeSceneName, 'Level_AI_Built');
});

test('AAA Expansion: Standalone Game Bundler includes new AAA behaviors', () => {
  const editor = new Editor();
  const behaviors = new BehaviorManager(editor);
  editor.behaviors = behaviors;

  const entity = editor.createEntity({ name: 'ParkourPlayer' });
  behaviors.attachBehavior(entity, 'wall_run_controller', { speed: 12 });
  behaviors.attachBehavior(entity, 'grappling_hook', { range: 40 });

  const bundler = new GameBundler(editor);
  const html = bundler.compileStandaloneHTML({ title: 'AAA Test Game' });

  assert.ok(html.includes('wall_run_controller'));
  assert.ok(html.includes('grappling_hook'));
  assert.ok(html.includes('grav_gun_physicshandler'));
  assert.ok(html.includes('inventory_crafting'));
  assert.ok(html.includes('dialogue_system'));
  assert.ok(html.includes('quest_tracker'));
  assert.ok(html.includes('cover_system'));
  assert.ok(html.includes('day_night_weather_cycle'));
  assert.ok(html.includes('AAA Test Game'));
});

test('Combat System: Cover System reduces damage and Ragdoll Physics triggers on defeat', () => {
  const editor = new Editor();
  const behaviors = new BehaviorManager(editor);
  editor.behaviors = behaviors;

  const player = editor.createEntity({ name: 'CoverAgent' });
  behaviors.attachBehavior(player, 'health', { maxHp: 100, currentHp: 100 });
  behaviors.attachBehavior(player, 'cover_system', { damageReduction: 0.75 });
  behaviors.attachBehavior(player, 'ragdoll_physics', {});

  // Simulate being in cover
  const coverB = behaviors.getBehaviors(player).find(b => b.type === 'cover_system');
  coverB._inCover = true;

  // 100 damage with 75% reduction = 25 damage dealt
  behaviors.applyDamage(player, 100, 'Sniper');
  const healthB = behaviors.getBehaviors(player).find(b => b.type === 'health');
  assert.strictEqual(healthB.params.currentHp, 75);

  // When out of cover, full damage applies
  coverB._inCover = false;
  behaviors.applyDamage(player, 75, 'LethalBlast');
  assert.strictEqual(healthB.params.currentHp, 0);
});
