import test from 'node:test';
import assert from 'node:assert/strict';
import * as pc from 'playcanvas';
import { Editor } from '../src/core/editor.js';
import { BEHAVIOR_CATALOG } from '../src/ui/inspector.js';
import { BehaviorManager } from '../src/core/behaviors.js';
import { GameBundler } from '../src/compiler/game-bundler.js';
import { AIExecutor } from '../src/ai/ai-executor.js';

test('AAA Expansion v3: All new behaviors exist in BEHAVIOR_CATALOG', () => {
  const newTypes = [
    'crouch_stealth_mechanic',
    'grappling_hook_rope_beam',
    'procedural_water_ripple',
    'enemy_boss_healthbar_hud',
    'screen_blood_vignette'
  ];

  newTypes.forEach(t => {
    const entry = BEHAVIOR_CATALOG.find(b => b.type === t);
    assert.ok(entry, `Behavior ${t} should exist in BEHAVIOR_CATALOG`);
    assert.ok(entry.name, `Behavior ${t} should have a name`);
  });
});

test('AAA Expansion v3: BehaviorManager attaches and manages all 5 new AAA behaviors', () => {
  const container = { appendChild: () => {} };
  const editor = new Editor(container);
  const bm = new BehaviorManager(editor);

  const hero = editor.createEntity({ name: 'HeroPlayer' });
  const boss = editor.createEntity({ name: 'DragonBoss' });

  bm.attachBehavior(hero, 'crouch_stealth_mechanic', { crouchSpeed: 3.5, heightScale: 0.5 });
  bm.attachBehavior(hero, 'grappling_hook_rope_beam', { thickness: 0.08 });
  bm.attachBehavior(hero, 'procedural_water_ripple', { rippleSpeed: 4.0 });
  bm.attachBehavior(boss, 'enemy_boss_healthbar_hud', { bossName: 'DragonBoss', maxHp: 1000 });
  bm.attachBehavior(hero, 'screen_blood_vignette', { threshold: 0.35 });

  assert.ok(bm.hasBehavior(hero, 'crouch_stealth_mechanic'));
  assert.ok(bm.hasBehavior(hero, 'grappling_hook_rope_beam'));
  assert.ok(bm.hasBehavior(hero, 'procedural_water_ripple'));
  assert.ok(bm.hasBehavior(boss, 'enemy_boss_healthbar_hud'));
  assert.ok(bm.hasBehavior(hero, 'screen_blood_vignette'));
});

test('AAA Expansion v3: AIExecutor processes set_hud_config, create_particle_preset, and create_light_fixture actions', async () => {
  const container = { appendChild: () => {} };
  const editor = new Editor(container);
  const executor = new AIExecutor(editor);

  const actions = [
    { action: 'set_hud_config', config: { health: { enabled: true, max: 200 } } },
    { action: 'create_particle_preset', preset: 'fire', name: 'TorchFlame' },
    { action: 'create_light_fixture', type: 'spot', name: 'DungeonSpot', color: [1, 0.8, 0.2] }
  ];

  const executed = await executor.executeActions(actions);
  assert.equal(executed.length, 3);
  assert.equal(executed[0].target, '2D HUD Config');
  assert.equal(executed[1].target, 'TorchFlame');
  assert.equal(executed[2].target, 'DungeonSpot');
});

test('AAA Expansion v3: GameBundler compiles HTML containing new behaviors and HUD elements', () => {
  const container = { appendChild: () => {} };
  const editor = new Editor(container);
  const bm = new BehaviorManager(editor);

  const player = editor.createEntity({ name: 'Player' });
  bm.attachBehavior(player, 'crouch_stealth_mechanic', { crouchSpeed: 3.5 });
  bm.attachBehavior(player, 'screen_blood_vignette', { threshold: 0.3 });

  const bundler = new GameBundler(editor);
  const html = bundler.compileStandaloneHTML({ title: 'AAA Test Game' });

  assert.ok(html.includes('crouch_stealth_mechanic'));
  assert.ok(html.includes('screen_blood_vignette'));
  assert.ok(html.includes('hud-blood-vignette'));
  assert.ok(html.includes('hud-boss-bar-wrap'));
});
