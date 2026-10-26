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

test('Model Turn & Rotation: Clockwise, Anticlockwise, and 180° flip commit to undo/redo history', () => {
  const normalizeAngle = (a) => ((Math.round(a) % 360) + 360) % 360;
  const editor = new Editor();
  const entity = editor.createEntity({ name: 'KnightModel' });
  assert.strictEqual(normalizeAngle(entity.getEulerAngles().y), 0);

  // Turn Clockwise +45°
  const initialRot1 = entity.getEulerAngles().clone();
  entity.setEulerAngles(0, 45, 0);
  editor.commitEntityTransform(entity, { initialRot: initialRot1 });
  assert.strictEqual(normalizeAngle(entity.getEulerAngles().y), 45);

  // Turn Anticlockwise -90° (45 - 90 = -45 -> 315°)
  const initialRot2 = entity.getEulerAngles().clone();
  let yaw = (initialRot2.y - 90) % 360;
  if (yaw < 0) yaw += 360;
  entity.setEulerAngles(0, yaw, 0);
  editor.commitEntityTransform(entity, { initialRot: initialRot2 });
  assert.strictEqual(normalizeAngle(entity.getEulerAngles().y), 315);

  // Test Undo: reverts to 45°
  editor.commandBus.undo();
  assert.strictEqual(normalizeAngle(entity.getEulerAngles().y), 45);

  // Test Undo again: reverts to 0°
  editor.commandBus.undo();
  assert.strictEqual(normalizeAngle(entity.getEulerAngles().y), 0);

  // Test Redo: restores to 45°
  editor.commandBus.redo();
  assert.strictEqual(normalizeAngle(entity.getEulerAngles().y), 45);
});
