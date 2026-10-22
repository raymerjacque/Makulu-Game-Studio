import test from 'node:test';
import assert from 'node:assert/strict';
import { AnimBlendModal } from '../src/ui/anim-blend-modal.js';
import { Editor } from '../src/core/editor.js';

test('AnimBlendModal initializes graph and evaluates parameters correctly', () => {
  const editor = new Editor();
  const modal = new AnimBlendModal(editor);

  assert.ok(modal.graph);
  assert.equal(modal.graph.defaultState, 'Idle');
  assert.equal(modal.graph.states.length, 4);
  assert.equal(modal.graph.transitions.length, 7);

  // Evaluate transitions when grounded and speed > 0.1
  modal.graph.parameters.speed = 2.0;
  modal.graph.parameters.isGrounded = true;
  modal.evaluateTransitions();
  assert.equal(modal.activeState, 'Walk');

  // Evaluate transitions when jump (isGrounded = false)
  modal.graph.parameters.isGrounded = false;
  modal.evaluateTransitions();
  assert.equal(modal.activeState, 'Jump');
});

test('AnimBlend state machine graph serializes and restores cleanly in scene JSON', () => {
  const editor = new Editor();
  const player = editor.createEntity({ name: 'PlayerCharacter' });
  player.animGraph = {
    defaultState: 'Idle',
    states: [{ id: 'Idle', name: 'Idle' }, { id: 'Run', name: 'Run' }],
    transitions: [{ from: 'Idle', to: 'Run', condition: 'speed > 1.0' }]
  };

  const jsonStr = editor.exportSceneJSON();
  const parsed = JSON.parse(jsonStr);

  const restoredPlayer = parsed.root.children.find(c => c.name === 'PlayerCharacter');
  assert.ok(restoredPlayer);
  assert.ok(restoredPlayer.animGraph);
  assert.equal(restoredPlayer.animGraph.defaultState, 'Idle');
  assert.equal(restoredPlayer.animGraph.states.length, 2);

  const editor2 = new Editor();
  editor2.loadSceneJSON(jsonStr);
  const reloadedChild = editor2.root.children.find(c => c.name === 'PlayerCharacter');
  assert.ok(reloadedChild);
  assert.ok(reloadedChild.animGraph);
  assert.equal(reloadedChild.animGraph.defaultState, 'Idle');
});
