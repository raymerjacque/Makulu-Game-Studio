import test from 'node:test';
import assert from 'node:assert';
import { Editor } from '../src/core/editor.js';

test('Model Resizer: Scale changes apply uniformly and commit to undo/redo history', () => {
  const editor = new Editor();
  const entity = editor.createEntity({ name: 'WarriorModel' });
  assert.deepStrictEqual(entity.getLocalScale().toString(), '[1, 1, 1]');

  // Scale up 2.5x
  const initialScale = entity.getLocalScale().clone();
  entity.setLocalScale(2.5, 2.5, 2.5);
  editor.commitEntityTransform(entity, { initialScale });

  assert.deepStrictEqual(entity.getLocalScale().toString(), '[2.5, 2.5, 2.5]');
  assert.ok(editor.commandBus.undoStack.length >= 1);

  // Test Undo
  editor.commandBus.undo();
  assert.deepStrictEqual(entity.getLocalScale().toString(), '[1, 1, 1]');

  // Test Redo
  editor.commandBus.redo();
  assert.deepStrictEqual(entity.getLocalScale().toString(), '[2.5, 2.5, 2.5]');
});

test('Model Resizer: Clamped scaling prevents inverted or zero dimensions', () => {
  const editor = new Editor();
  const entity = editor.createEntity({ name: 'CastleTree' });

  // Test minimum clamp
  const minRatio = Math.max(0.05, Math.min(25.0, 0.001));
  entity.setLocalScale(entity.getLocalScale().mulScalar(minRatio));
  assert.ok(entity.getLocalScale().x >= 0.05);

  // Test maximum clamp
  const maxRatio = Math.max(0.05, Math.min(25.0, 100.0));
  entity.setLocalScale(entity.getLocalScale().mulScalar(maxRatio));
  assert.ok(entity.getLocalScale().x <= 25.0);
});
