import test from 'node:test';
import assert from 'node:assert/strict';
import * as pc from 'playcanvas';
import { Editor } from '../src/core/editor.js';
import { BehaviorManager } from '../src/core/behaviors.js';
import { BEHAVIOR_CATALOG } from '../src/ui/inspector.js';
import { GameBundler } from '../src/compiler/game-bundler.js';
import { proceduralSFX, generateWAVDataURL } from '../src/engine/procedural-sfx.js';

test('Completed 15 Behaviors: verify all exist in BEHAVIOR_CATALOG and BehaviorManager', () => {
  const targetTypes = [
    'visual_flow_graph',
    'reflection_probe_cubemap',
    'vehicle_suspension_physics',
    'procedural_chain_rope_physics',
    'cinematic_camera_rail',
    'interactive_switch_toggle',
    'weapon_overheat_system',
    'quest_journal_tracker',
    'inventory_quick_slot_bar',
    'procedural_footstep_surface_detector',
    'screen_space_vignette',
    'dynamic_foliage_wind',
    'destruction_cluster_explosion',
    'enemy_boss_rage_phase',
    'hud_floating_minimap'
  ];

  for (const t of targetTypes) {
    const entry = BEHAVIOR_CATALOG.find(b => b.type === t);
    assert.ok(entry, `BEHAVIOR_CATALOG should contain ${t}`);
  }

  const editor = new Editor();
  const bm = new BehaviorManager(editor);
  const ent = new pc.Entity('TestProp');

  for (const t of targetTypes) {
    const entry = BEHAVIOR_CATALOG.find(b => b.type === t);
    bm.attachBehavior(ent, t, entry.defaultParams);
    assert.equal(bm.hasBehavior(ent, t), true, `Entity should have behavior ${t}`);
  }

  const attached = bm.getBehaviors(ent);
  assert.equal(attached.length, targetTypes.length);
});

test('GameBundler includes newly completed behaviors and wasd player handling', () => {
  const editor = new Editor();
  const bundler = new GameBundler(editor);
  const html = bundler.compileStandaloneHTML({ title: 'Test Export' });

  assert.ok(html.includes("b.type === 'wasd'"), 'Compiled HTML should contain explicit wasd handling');
  assert.ok(html.includes("b.type === 'interactive_switch_toggle'"), 'Compiled HTML should contain interactive_switch_toggle');
  assert.ok(html.includes("b.type === 'weapon_overheat_system'"), 'Compiled HTML should contain weapon_overheat_system');
  assert.ok(html.includes("b.type === 'inventory_quick_slot_bar'"), 'Compiled HTML should contain inventory_quick_slot_bar');
  assert.ok(html.includes("b.type === 'cinematic_camera_rail'"), 'Compiled HTML should contain cinematic_camera_rail');
});

test('Procedural SFX synthesis produces valid Data URLs for new audio presets', () => {
  const newPresets = ['whoosh', 'laser_heavy', 'magic_portal', 'equip_item', 'heartbeat_low_hp', 'ui_click'];
  for (const p of newPresets) {
    const dataUrl = generateWAVDataURL(p);
    assert.ok(dataUrl.startsWith('data:audio/wav;base64,'), `Preset ${p} should return a valid base64 wav URL`);
    assert.ok(dataUrl.length > 100, `Preset ${p} data URL should have non-trivial payload length`);
  }
});
