import test from 'node:test';
import assert from 'node:assert/strict';
import { Editor } from '../src/core/editor.js';
import { BehaviorManager } from '../src/core/behaviors.js';
import * as pc from 'playcanvas';

test('BehaviorManager attaches audio_trigger and postfx_trigger behaviors', () => {
  const editor = new Editor();
  const bm = new BehaviorManager(editor);
  const dummyEntity = new pc.Entity('TestEntity');

  bm.attachBehavior(dummyEntity, 'audio_trigger', { radius: 3.5, sfxType: 'laser' });
  assert.equal(bm.hasBehavior(dummyEntity, 'audio_trigger'), true);

  const behaviors = bm.getBehaviors(dummyEntity);
  const audioB = behaviors.find(b => b.type === 'audio_trigger');
  assert.ok(audioB);
  assert.equal(audioB.params.sfxType, 'laser');

  bm.attachBehavior(dummyEntity, 'postfx_trigger', { radius: 5.0, atmosphere: 'sunset' });
  assert.equal(bm.hasBehavior(dummyEntity, 'postfx_trigger'), true);

  bm.removeBehavior(dummyEntity, 'audio_trigger');
  assert.equal(bm.hasBehavior(dummyEntity, 'audio_trigger'), false);
  assert.equal(bm.hasBehavior(dummyEntity, 'postfx_trigger'), true);
});
