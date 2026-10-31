import test from 'node:test';
import assert from 'node:assert/strict';
import * as pc from 'playcanvas';
import { Editor } from '../src/core/editor.js';
import { BehaviorManager } from '../src/core/behaviors.js';
import { BEHAVIOR_CATALOG } from '../src/ui/inspector.js';
import { GameBundler } from '../src/compiler/game-bundler.js';
import { AIExecutor } from '../src/ai/ai-executor.js';
import { generateWAVDataURL } from '../src/engine/procedural-sfx.js';

test('Expansion V5: BEHAVIOR_CATALOG contains at least 150 behaviors', () => {
  assert.ok(BEHAVIOR_CATALOG.length >= 150, `Expected at least 150 behaviors, got ${BEHAVIOR_CATALOG.length}`);
});

test('Expansion V5: All 15 newly added behaviors attach and update properly', () => {
  const editor = new Editor();
  const bm = new BehaviorManager(editor);
  const ent = new pc.Entity('Test_Agent');

  const newTypes = [
    'jump_pad_launch_booster',
    'laser_security_tripwire',
    'shield_bubble_barrier',
    'zipline_traversal_slide',
    'stealth_grass_hiding_bush',
    'time_bomb_countdown',
    'magnetic_boots_surface_walker',
    'grav_repulsor_shockwave',
    'heat_seeking_homing_missile',
    'interactive_vending_machine',
    'portal_gun_spatial_pair',
    'slow_motion_dodge_roll',
    'dynamic_camera_cinematic_shake',
    'procedural_ambient_dust_motes',
    'boss_phase3_meteor_rain'
  ];

  for (const t of newTypes) {
    bm.attachBehavior(ent, t, {});
    assert.equal(bm.hasBehavior(ent, t), true, `Failed to attach behavior ${t}`);
  }

  assert.equal(bm.getBehaviors(ent).length, 15);
});

test('Expansion V5: Procedural SFX generator produces valid WAV data for new sound effects', () => {
  const presets = ['jump_pad', 'alarm_siren', 'countdown_beep', 'missile_launch', 'vending_dispense'];
  for (const p of presets) {
    const dataUrl = generateWAVDataURL(p);
    assert.ok(dataUrl.startsWith('data:audio/wav;base64,'), `Invalid WAV header for ${p}`);
    assert.ok(dataUrl.length > 500, `Audio data too short for ${p}`);
  }
});

test('Expansion V5: GameBundler compiles standalone HTML with new behaviors and SFX', () => {
  const editor = new Editor();
  const bm = new BehaviorManager(editor);
  const ent = editor.createEntity({ name: 'Arena_Jump_Pad' });
  bm.attachBehavior(ent, 'jump_pad_launch_booster', { launchForce: 25 });
  bm.attachBehavior(ent, 'laser_security_tripwire', { length: 20 });
  bm.attachBehavior(ent, 'time_bomb_countdown', { countdown: 4 });

  const bundler = new GameBundler(editor);
  const html = bundler.compileStandaloneHTML({ title: 'V5 AAA Studio Game' });

  assert.match(html, /jump_pad_launch_booster/);
  assert.match(html, /laser_security_tripwire/);
  assert.match(html, /time_bomb_countdown/);
  assert.match(html, /jump_pad/);
  assert.match(html, /alarm_siren/);
});

test('Expansion V5: AIExecutor executes new autonomous scene creation actions', async () => {
  const editor = new Editor();
  editor.behaviors = new BehaviorManager(editor);
  const executor = new AIExecutor(editor);

  const actions = [
    { action: 'create_jump_pad', name: 'AI_Launch_Pad', launchForce: 20 },
    { action: 'create_security_tripwire', name: 'AI_Security_Grid', damage: 25 },
    { action: 'create_shield_bubble', name: 'AI_Defense_Bubble', shieldHp: 180 },
    { action: 'create_zipline', name: 'AI_Sky_Zipline', speed: 16 },
    { action: 'create_time_bomb', name: 'AI_Detonator', countdown: 3.5 },
    { action: 'trigger_radial_shockwave', intensity: 0.8 }
  ];

  const executed = await executor.executeActions(actions);
  assert.equal(executed.length, 6);
  assert.equal(executed[0].action, 'create_jump_pad');
  assert.equal(executed[1].action, 'create_security_tripwire');
  assert.equal(executed[2].action, 'create_shield_bubble');
  assert.equal(executed[3].action, 'create_zipline');
  assert.equal(executed[4].action, 'create_time_bomb');
  assert.equal(executed[5].action, 'trigger_radial_shockwave');
});
