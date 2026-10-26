import test from 'node:test';
import assert from 'node:assert/strict';
import * as pc from 'playcanvas';
import { Editor } from '../src/core/editor.js';
import { BehaviorManager } from '../src/core/behaviors.js';
import { GameBundler } from '../src/compiler/game-bundler.js';

test('Expansion features: New No-Code Behaviors attach and process correctly', () => {
  const editor = new Editor();
  const behaviors = new BehaviorManager(editor);
  const entity = new pc.Entity('HeroCharacter');

  // Test attaching new behaviors
  behaviors.attachBehavior(entity, 'dash_boost', { force: 30, cooldown: 1.0 });
  behaviors.attachBehavior(entity, 'health_regen', { amount: 10, interval: 1.0 });
  behaviors.attachBehavior(entity, 'spotlight_flicker', { baseOuterAngle: 45, variance: 5 });

  const active = behaviors.getBehaviors(entity);
  assert.equal(active.length, 3);
  assert.ok(behaviors.hasBehavior(entity, 'dash_boost'));
  assert.ok(behaviors.hasBehavior(entity, 'health_regen'));
  assert.ok(behaviors.hasBehavior(entity, 'spotlight_flicker'));
});

test('Expansion features: Rigidbody linear/angular factors and Sound attenuation serialize cleanly', () => {
  const editor = new Editor();
  const entity = new pc.Entity('PhysicsBox');
  editor.root.addChild(entity);

  editor.addComponent(entity, 'rigidbody', {
    type: 'dynamic',
    mass: 5,
    linearFactor: new pc.Vec3(1, 0, 1),
    angularFactor: new pc.Vec3(0, 1, 0)
  });

  editor.addComponent(entity, 'sound', {
    volume: 0.8,
    pitch: 1.1,
    minDistance: 2.0,
    maxDistance: 25.0,
    autoPlay: true
  });

  const jsonStr = editor.exportSceneJSON();
  const data = JSON.parse(jsonStr);

  const boxData = data.root.children.find(c => c.name === 'PhysicsBox');
  assert.ok(boxData);
  assert.deepEqual(boxData.components.rigidbody.linearFactor, [1, 0, 1]);
  assert.deepEqual(boxData.components.rigidbody.angularFactor, [0, 1, 0]);
  assert.equal(boxData.components.sound.minDistance, 2.0);
  assert.equal(boxData.components.sound.maxDistance, 25.0);
  assert.equal(boxData.components.sound.autoPlay, true);
});

test('Expansion features: GameBundler compiles standalone HTML with new behaviors and constraints', () => {
  const editor = new Editor();
  const behaviors = new BehaviorManager(editor);
  const player = new pc.Entity('Player');
  editor.root.addChild(player);

  editor.addComponent(player, 'rigidbody', {
    type: 'dynamic',
    linearFactor: new pc.Vec3(1, 0, 1)
  });

  behaviors.attachBehavior(player, 'dash_boost', { force: 20 });
  behaviors.attachBehavior(player, 'health_regen', { amount: 5 });

  const bundler = new GameBundler(editor);
  const html = bundler.compileStandaloneHTML({ title: 'Expansion Test Game' });

  assert.ok(html.includes('Expansion Test Game'));
  assert.ok(html.includes('dash_boost'));
  assert.ok(html.includes('health_regen'));
  assert.ok(html.includes('linearFactor'));
});
