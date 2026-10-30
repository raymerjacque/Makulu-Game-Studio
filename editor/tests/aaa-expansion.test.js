import test from 'node:test';
import assert from 'node:assert/strict';
import { Editor } from '../src/core/editor.js';
import { BehaviorManager } from '../src/core/behaviors.js';
import { BEHAVIOR_CATALOG } from '../src/ui/inspector.js';
import { generateWAVDataURL, proceduralSFX } from '../src/engine/procedural-sfx.js';
import { GameBundler } from '../src/compiler/game-bundler.js';

test('AAA Expansion: BEHAVIOR_CATALOG contains at least 100 total behaviors', () => {
  assert.ok(BEHAVIOR_CATALOG.length >= 100);

  const aaaTypes = [
    'grappling_rope_physics',
    'portal_teleport_pair',
    'tactical_time_dilation',
    'dynamic_weather_storm',
    'loot_box_gacha',
    'magnetic_shield',
    'combo_hit_counter_hud',
    'climbable_ledge_parkour',
    'orbiting_drone_companion',
    'directional_damage_indicator'
  ];

  aaaTypes.forEach(type => {
    const found = BEHAVIOR_CATALOG.find(b => b.type === type);
    assert.ok(found, `Behavior catalog must contain ${type}`);
    assert.ok(found.icon, `Behavior ${type} must have icon`);
    assert.ok(found.name, `Behavior ${type} must have name`);
  });
});

test('AAA Expansion: BehaviorManager attaches and manages all 10 new AAA behaviors', () => {
  const editor = new Editor();
  const manager = new BehaviorManager(editor);
  const entity = editor.createEntity({ name: 'AAATestEntity' });

  const aaaTypes = [
    'grappling_rope_physics',
    'portal_teleport_pair',
    'tactical_time_dilation',
    'dynamic_weather_storm',
    'loot_box_gacha',
    'magnetic_shield',
    'combo_hit_counter_hud',
    'climbable_ledge_parkour',
    'orbiting_drone_companion',
    'directional_damage_indicator'
  ];

  aaaTypes.forEach(type => {
    manager.attachBehavior(entity, type, { customParam: true });
    assert.ok(manager.hasBehavior(entity, type), `Entity should have behavior ${type}`);
  });

  const behaviors = manager.getBehaviors(entity);
  assert.equal(behaviors.length, 10);

  aaaTypes.forEach(type => {
    manager.removeBehavior(entity, type);
    assert.equal(manager.hasBehavior(entity, type), false);
  });
});

test('AAA Expansion: Procedural SFX supports custom ADSR & waveform parameters in WAV generation', () => {
  const customParams = {
    waveType: 'square',
    startFreq: 880,
    endFreq: 220,
    attack: 0.05,
    decay: 0.1,
    sustain: 0.4,
    release: 0.2
  };

  const dataUrl = generateWAVDataURL(customParams);
  assert.ok(dataUrl.startsWith('data:audio/wav;base64,'), 'Custom ADSR sound must produce valid WAV base64 Data URL');
  assert.ok(dataUrl.length > 500, 'Data URL for custom sound should not be empty');
});

test('AAA Expansion: GameBundler exports post-processing FX config including vignette & DoF', () => {
  const editor = new Editor();
  editor.postProcessingConfig = {
    exposure: 1.2,
    toneMapping: 'aces',
    vignette: { enabled: true, intensity: 0.6, curvature: 0.9 },
    dof: { enabled: true, focusDistance: 12, blurAmount: 0.8 },
    chromaticAberration: { enabled: true, offset: 0.008 },
    colorGrading: { brightness: 1.1, contrast: 1.2, saturation: 1.05 }
  };

  const bundler = new GameBundler(editor);
  const html = bundler.compileStandaloneHTML({ title: 'AAA PostFX Game' });

  assert.ok(html.includes('_vignetteFX'), 'HTML export must include vignette FX configuration');
  assert.ok(html.includes('_dofFX'), 'HTML export must include DoF FX configuration');
  assert.ok(html.includes('_chromaticFX'), 'HTML export must include chromatic aberration configuration');
});
