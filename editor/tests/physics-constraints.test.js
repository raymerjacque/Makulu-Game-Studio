import test from 'node:test';
import assert from 'node:assert/strict';
import { Editor } from '../src/core/editor.js';

test('Physics joint constraints attach to entities and serialize cleanly in scene JSON', () => {
  const editor = new Editor();
  const parentEnt = editor.createEntity({ name: 'DoorFrame' });
  const doorEnt = editor.createEntity({ name: 'DoorPanel' });

  doorEnt.joint = {
    type: 'hinge',
    targetEntity: 'DoorFrame',
    pivot: [0, 1.5, 0],
    axis: [0, 1, 0]
  };

  const jsonStr = editor.exportSceneJSON();
  const parsed = JSON.parse(jsonStr);

  const savedDoor = parsed.root.children.find(c => c.name === 'DoorPanel');
  assert.ok(savedDoor);
  assert.ok(savedDoor.components.joint);
  assert.equal(savedDoor.components.joint.type, 'hinge');
  assert.equal(savedDoor.components.joint.targetEntity, 'DoorFrame');
  assert.deepEqual(savedDoor.components.joint.pivot, [0, 1.5, 0]);
});
