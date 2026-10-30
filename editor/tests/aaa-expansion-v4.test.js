import test from 'node:test';
import assert from 'node:assert/strict';
import * as pc from 'playcanvas';
import { Editor } from '../src/core/editor.js';
import { BehaviorManager } from '../src/core/behaviors.js';
import { BEHAVIOR_CATALOG } from '../src/ui/inspector.js';
import { GameBundler } from '../src/compiler/game-bundler.js';
import { AIExecutor } from '../src/ai/ai-executor.js';
import { ShaderGraphModal } from '../src/ui/shader-graph-modal.js';

test('BEHAVIOR_CATALOG contains at least 120 behaviors', () => {
  assert.ok(BEHAVIOR_CATALOG.length >= 120);
});

test('BehaviorManager attaches and manages new AAA behaviors', () => {
  const editor = new Editor();
  const bm = new BehaviorManager(editor);
  const ent = new pc.Entity('Hero_Player');

  bm.attachBehavior(ent, 'grappling_hook_physics_swing', { swingForce: 30 });
  bm.attachBehavior(ent, 'enemy_boss_phase_transition', { phaseThreshold: 0.5 });
  bm.attachBehavior(ent, 'procedural_spline_mesh_deformer', { curveRadius: 6.0 });
  bm.attachBehavior(ent, 'screen_space_impact_vfx', { hitstopMs: 100 });
  bm.attachBehavior(ent, 'interactive_inventory_chest', { goldAmount: 250 });

  assert.equal(bm.hasBehavior(ent, 'grappling_hook_physics_swing'), true);
  assert.equal(bm.hasBehavior(ent, 'enemy_boss_phase_transition'), true);
  assert.equal(bm.hasBehavior(ent, 'procedural_spline_mesh_deformer'), true);
  assert.equal(bm.hasBehavior(ent, 'screen_space_impact_vfx'), true);
  assert.equal(bm.hasBehavior(ent, 'interactive_inventory_chest'), true);

  const list = bm.getBehaviors(ent);
  assert.equal(list.length, 5);
});

test('ShaderGraphModal instantiates and generates material parameters', () => {
  const editor = new Editor();
  const sg = new ShaderGraphModal(editor);

  assert.equal(typeof sg.addNode, 'function');
  assert.equal(typeof sg.clearGraph, 'function');

  sg.addNode('color', 100, 100, { color: '#ff00ff' });
  sg.addNode('output', 400, 100);

  assert.equal(sg.nodes.length, 2);
  sg.clearGraph();
  assert.equal(sg.nodes.length, 0);
});

test('GameBundler compiles standalone HTML containing new behaviors', () => {
  const editor = new Editor();
  const bm = new BehaviorManager(editor);
  const ent = editor.createEntity({ name: 'Chest_Prop' });
  bm.attachBehavior(ent, 'interactive_inventory_chest', { goldAmount: 500 });
  bm.attachBehavior(ent, 'enemy_boss_phase_transition', { phaseThreshold: 0.5 });

  const bundler = new GameBundler(editor);
  const html = bundler.compileStandaloneHTML({ title: 'AAA Test Game' });

  assert.match(html, /<!DOCTYPE html>/);
  assert.match(html, /interactive_inventory_chest/);
  assert.match(html, /enemy_boss_phase_transition/);
  assert.match(html, /grappling_hook_physics_swing/);
});

test('AIExecutor processes create_shader_graph and new spawn actions', async () => {
  const editor = new Editor();
  const executor = new AIExecutor(editor);

  const target = editor.createEntity({ name: 'Sphere_Target' });
  editor.selection.set(target);

  const actions = [
    { action: 'spawn_treasure_chest', name: 'Golden_Chest', goldAmount: 300, position: [0, 1, 0] },
    { action: 'create_shader_graph', target: 'Sphere_Target', diffuse: [0, 1, 0], emissive: [0, 0.5, 0] },
    { action: 'trigger_impact_vfx', intensity: 0.8 }
  ];

  const executed = await executor.executeActions(actions);
  assert.equal(executed.length, 3);
});
