import { createResourceTestApp, provideTestAudio } from './fixtures/resource-app.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { Editor } from '../src/core/editor.js';
import { BehaviorManager } from '../src/core/behaviors.js';
import { AIExecutor } from '../src/ai/ai-executor.js';
import { GameBundler } from '../src/compiler/game-bundler.js';

test('AAA Behaviors: Attach and query all new AAA game behaviors', (t) => {
  const editor = new Editor();
  const behaviors = new BehaviorManager(editor);
  editor.behaviors = behaviors;

  const player = editor.createEntity({ name: 'PlayerHero' });
  const boss = editor.createEntity({ name: 'DragonBoss' });

  behaviors.attachBehavior(player, 'vehicle_controller', { topSpeed: 30 });
  behaviors.attachBehavior(player, 'shield_generator', { maxShield: 100 });
  behaviors.attachBehavior(boss, 'boss_ai', { maxHp: 1000, damage: 50 });

  assert.equal(behaviors.hasBehavior(player, 'vehicle_controller'), true);
  assert.equal(behaviors.hasBehavior(player, 'shield_generator'), true);
  assert.equal(behaviors.hasBehavior(boss, 'boss_ai'), true);

  const bList = behaviors.getBehaviors(boss);
  assert.equal(bList.length, 1);
  assert.equal(bList[0].params.maxHp, 1000);
});

test('AI Executor: Execute new autonomous AI scene actions', async (t) => {
  const app = createResourceTestApp();
  t.after(() => app.destroy());
  provideTestAudio(app);
  const editor = new Editor();
  editor.runtime = { app };
  const behaviors = new BehaviorManager(editor);
  editor.behaviors = behaviors;
  const executor = new AIExecutor(editor);

  const actions = [
    { action: 'spawn_primitive', type: 'box', name: 'AI_Wall', position: [0, 2, 0] },
    { action: 'create_material', target: 'AI_Wall', diffuse: [1, 0, 0], metalness: 0.8 },
    { action: 'attach_behavior', target: 'AI_Wall', behavior: 'boss_ai', properties: { maxHp: 500 } },
    { action: 'add_particle_system', name: 'SnowParticles', numParticles: 150 },
    { action: 'add_sound', name: 'AmbientWind', url: './models/wind.wav', volume: 0.5 },
    { action: 'duplicate_entity', target: 'AI_Wall' }
  ];

  const executed = await executor.executeActions(actions);
  assert.equal(executed.length, 6);
  assert.equal(executed[0].action, 'spawn_primitive');
  assert.equal(executed[2].action, 'attach_behavior');
});

test('Game Bundler: Compiles standalone HTML5 game with AAA behaviors and AI actions', (t) => {
  const editor = new Editor();
  const behaviors = new BehaviorManager(editor);
  editor.behaviors = behaviors;

  const player = editor.createEntity({ name: 'Player' });
  behaviors.attachBehavior(player, 'vehicle_controller', { topSpeed: 25 });
  behaviors.attachBehavior(player, 'shield_generator', { maxShield: 50 });

  const bundler = new GameBundler(editor);
  const html = bundler.compileStandaloneHTML({ title: 'AAA Test Game' });

  assert.ok(html.includes('vehicle_controller'));
  assert.ok(html.includes('shield_generator'));
  assert.ok(html.includes('boss_ai'));
  assert.ok(html.includes('weather_emitter'));
  assert.ok(html.includes('combo_score_counter'));
  assert.ok(html.includes('AAA Test Game'));
});

test('Combat System: Shield Generator absorbs damage and Checkpoint System handles respawn', (t) => {
  const editor = new Editor();
  const behaviors = new BehaviorManager(editor);
  editor.behaviors = behaviors;

  const player = editor.createEntity({ name: 'PlayerHero' });
  player.setPosition(0, 0, 0);

  behaviors.attachBehavior(player, 'health', { maxHp: 100, currentHp: 100 });
  behaviors.attachBehavior(player, 'shield_generator', { maxShield: 50, currentShield: 50 });

  // 1. Damage smaller than shield should deplete shield only
  behaviors.applyDamage(player, 30, 'TestHazard');
  const shieldB = behaviors.getBehaviors(player).find(b => b.type === 'shield_generator');
  const healthB = behaviors.getBehaviors(player).find(b => b.type === 'health');

  assert.equal(shieldB.params.currentShield, 20);
  assert.equal(healthB.params.currentHp, 100);

  // 2. Damage exceeding shield should deplete remaining shield and hit health
  behaviors.applyDamage(player, 40, 'TestHazard');
  assert.equal(shieldB.params.currentShield, 0);
  assert.equal(healthB.params.currentHp, 80);

  // 3. Lethal damage with checkpoint respawns player at checkpoint
  player._respawnCheckpoint = [10, 5, 10];
  behaviors.applyDamage(player, 100, 'LethalTrap');
  assert.equal(healthB.params.currentHp, 100);
});
