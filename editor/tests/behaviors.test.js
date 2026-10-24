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

test('BehaviorManager handles new behaviors: lava_hazard, coin_bounce, light_color_cycle, waypoint_patrol', () => {
  const editor = new Editor();
  const bm = new BehaviorManager(editor);
  const dummyEntity = new pc.Entity('HazardEntity');

  bm.attachBehavior(dummyEntity, 'lava_hazard', { radius: 2.5, damage: 100 });
  assert.equal(bm.hasBehavior(dummyEntity, 'lava_hazard'), true);

  bm.attachBehavior(dummyEntity, 'coin_bounce', { speed: 90, amplitude: 0.3 });
  assert.equal(bm.hasBehavior(dummyEntity, 'coin_bounce'), true);

  bm.attachBehavior(dummyEntity, 'light_color_cycle', { speed: 1.5 });
  assert.equal(bm.hasBehavior(dummyEntity, 'light_color_cycle'), true);

  bm.attachBehavior(dummyEntity, 'waypoint_patrol', { speed: 4.0 });
  assert.equal(bm.hasBehavior(dummyEntity, 'waypoint_patrol'), true);

  const bList = bm.getBehaviors(dummyEntity);
  assert.equal(bList.length, 4);
});
