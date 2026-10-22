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
