import { createResourceTestApp } from './fixtures/resource-app.js';
import { test } from 'node:test';
import assert from 'node:assert';
import * as pc from 'playcanvas';
import { Editor } from '../src/core/editor.js';
import { BehaviorManager } from '../src/core/behaviors.js';
import { BEHAVIOR_CATALOG } from '../src/ui/inspector.js';
import { GameBundler } from '../src/compiler/game-bundler.js';
import { generateWAVDataURL } from '../src/engine/procedural-sfx.js';
import { AIExecutor } from '../src/ai/ai-executor.js';

test('AAA Expansion V3: BEHAVIOR_CATALOG contains at least 135 behaviors', () => {
  assert.ok(BEHAVIOR_CATALOG.length >= 135, `Catalog length should be >= 135, got ${BEHAVIOR_CATALOG.length}`);
});

test('AAA Expansion V3: BehaviorManager attaches and manages visual_flow_graph and new AAA behaviors', () => {
  const editor = new Editor();
  const bm = new BehaviorManager(editor);
  const entity = editor.createEntity({ name: 'FlowTestHero' });

  bm.attachBehavior(entity, 'visual_flow_graph', { title: 'Dungeon Master Logic' });
  bm.attachBehavior(entity, 'reflection_probe_cubemap', { intensity: 1.2 });
  bm.attachBehavior(entity, 'vehicle_suspension_physics', { stiffness: 25 });
  bm.attachBehavior(entity, 'quest_journal_tracker', { questTitle: 'Slay Dragon' });

  assert.strictEqual(bm.hasBehavior(entity, 'visual_flow_graph'), true);
  assert.strictEqual(bm.hasBehavior(entity, 'reflection_probe_cubemap'), true);
  assert.strictEqual(bm.hasBehavior(entity, 'vehicle_suspension_physics'), true);
  assert.strictEqual(bm.hasBehavior(entity, 'quest_journal_tracker'), true);
});

test('AAA Expansion V3: Procedural SFX generator produces valid WAV base64 Data URLs for new audio presets', () => {
  const wavGrass = generateWAVDataURL('footstep_grass');
  const wavSword = generateWAVDataURL('slash_sword');
  const wavThunder = generateWAVDataURL('thunder_bolt');

  assert.ok(wavGrass.startsWith('data:audio/wav;base64,'));
  assert.ok(wavSword.startsWith('data:audio/wav;base64,'));
  assert.ok(wavThunder.startsWith('data:audio/wav;base64,'));
});

test('AAA Expansion V3: GameBundler compiles standalone HTML containing new behaviors, physics joints, and procedural audio', () => {
  const editor = new Editor();
  const bm = new BehaviorManager(editor);
  const hero = editor.createEntity({ name: 'StandaloneHero' });

  bm.attachBehavior(hero, 'visual_flow_graph', { title: 'Combat Flow' });
  bm.attachBehavior(hero, 'hud_floating_minimap', { scanRange: 40 });

  hero.joint = { type: 'hinge', targetEntity: 'DoorFrame', pivot: [0, 1, 0] };

  const bundler = new GameBundler(editor);
  const html = bundler.compileStandaloneHTML({ title: 'AAA Test Game' });

  assert.ok(html.includes('<!DOCTYPE html>'));
  assert.ok(html.includes('AAA Test Game'));
  assert.ok(html.includes('visual_flow_graph'));
  assert.ok(html.includes('hud_floating_minimap'));
  assert.ok(html.includes('playProceduralSFX'));
});

test('AAA Expansion V3: AIExecutor executes new actions cleanly', async (t) => {
  const app = createResourceTestApp();
  t.after(() => app.destroy());
  const editor = new Editor();
  const bm = new BehaviorManager(editor);
  editor.behaviors = bm;

  editor.setRuntime({
    app,
    setAtmosphere: (preset) => { editor.atmosphere = preset; }
  });

  const ai = new AIExecutor(editor);

  const actions = [
    { action: 'create_flow_graph', target: 'selected', title: 'AI Generated Blueprint' },
    { action: 'set_hdri_skybox', preset: 'cyberpunk' },
    { action: 'configure_joint', target: 'selected', jointType: 'slider' },
    { action: 'sculpt_terrain_heightmap', name: 'AI Mountains', width: 60, depth: 60 }
  ];

  const hero = editor.createEntity({ name: 'AITargetEntity' });
  editor.selection.set(hero);

  const res = await ai.executeActions(actions);
  assert.strictEqual(res.length, 4);
});
