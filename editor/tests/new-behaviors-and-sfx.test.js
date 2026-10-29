import test from 'node:test';
import assert from 'node:assert/strict';
import { Editor } from '../src/core/editor.js';
import { BehaviorManager } from '../src/core/behaviors.js';
import { BEHAVIOR_CATALOG } from '../src/ui/inspector.js';
import { generateWAVDataURL } from '../src/engine/procedural-sfx.js';
import { GameBundler } from '../src/compiler/game-bundler.js';
import { AIExecutor } from '../src/ai/ai-executor.js';

test('BEHAVIOR_CATALOG contains exactly 90 total behaviors', () => {
  assert.equal(BEHAVIOR_CATALOG.length, 90);

  const newTypes = [
    'footstep_audio',
    'floating_nametag',
    'respawn_kill_plane',
    'item_magnet',
    'turret_laser_sight',
    'breakable_crate_loot',
    'rotating_skybox_sun',
    'minimap_blip',
    'damage_number_popup',
    'combo_kill_announcer'
  ];

  newTypes.forEach(type => {
    const found = BEHAVIOR_CATALOG.find(b => b.type === type);
    assert.ok(found, `Behavior catalog must contain ${type}`);
    assert.ok(found.icon, `Behavior ${type} must have icon`);
    assert.ok(found.name, `Behavior ${type} must have name`);
  });
});

test('BehaviorManager attaches and manages all 10 new behaviors', () => {
  const editor = new Editor();
  const manager = new BehaviorManager(editor);
  const entity = editor.createEntity({ name: 'TestEntity' });

  const newTypes = [
    'footstep_audio',
    'floating_nametag',
    'respawn_kill_plane',
    'item_magnet',
    'turret_laser_sight',
    'breakable_crate_loot',
    'rotating_skybox_sun',
    'minimap_blip',
    'damage_number_popup',
    'combo_kill_announcer'
  ];

  newTypes.forEach(type => {
    manager.attachBehavior(entity, type, { customParam: true });
    assert.ok(manager.hasBehavior(entity, type), `Entity should have behavior ${type}`);
  });

  const behaviors = manager.getBehaviors(entity);
  assert.equal(behaviors.length, 10);

  newTypes.forEach(type => {
    manager.removeBehavior(entity, type);
    assert.equal(manager.hasBehavior(entity, type), false);
  });
});

test('Procedural SFX generator produces valid WAV base64 Data URLs for new sound presets', () => {
  const newSFXTypes = ['footstep', 'teleport', 'powerup', 'shield_hit', 'reload', 'magic_spell'];

  newSFXTypes.forEach(type => {
    const dataUrl = generateWAVDataURL(type);
    assert.ok(dataUrl.startsWith('data:audio/wav;base64,'), `SFX ${type} must produce valid WAV base64 Data URL`);
    assert.ok(dataUrl.length > 100, `Data URL for ${type} should not be empty`);
  });
});

test('GameBundler compiles standalone HTML containing new behaviors and procedural SFX', () => {
  const editor = new Editor();
  const manager = new BehaviorManager(editor);
  editor.behaviors = manager;

  const entity = editor.createEntity({ name: 'PlayerHero' });
  manager.attachBehavior(entity, 'footstep_audio', { sfxType: 'footstep' });
  manager.attachBehavior(entity, 'respawn_kill_plane', { minY: -25 });

  const bundler = new GameBundler(editor);
  const html = bundler.compileStandaloneHTML({ title: 'Test Export' });

  assert.ok(html.includes('footstep_audio'), 'HTML output should include footstep_audio behavior');
  assert.ok(html.includes('respawn_kill_plane'), 'HTML output should include respawn_kill_plane behavior');
  assert.ok(html.includes('playProceduralSFX'), 'HTML output should include procedural audio runtime code');
});

test('AIExecutor processes capture_screenshot and new behavior actions', async () => {
  const editor = new Editor();
  const manager = new BehaviorManager(editor);
  editor.behaviors = manager;
  const executor = new AIExecutor(editor);

  const actions = [
    { action: 'spawn_primitive', type: 'box', name: 'MagnetHolder' },
    { action: 'attach_behavior', target: 'MagnetHolder', behavior: 'item_magnet', properties: { pullRadius: 10 } },
    { action: 'capture_screenshot', name: 'TestSnapshot.png' }
  ];

  const executed = await executor.executeActions(actions);
  assert.equal(executed.length, 3);
  assert.equal(executed[0].action, 'spawn_primitive');
  assert.equal(executed[1].action, 'attach_behavior');
  assert.equal(executed[2].action, 'capture_screenshot');

  const magnetEntity = executor.findTarget('MagnetHolder');
  assert.ok(magnetEntity, 'Entity MagnetHolder should exist');
  assert.ok(manager.hasBehavior(magnetEntity, 'item_magnet'), 'Entity should have item_magnet behavior attached');
});
