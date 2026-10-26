import test from 'node:test';
import assert from 'node:assert/strict';
import { Editor } from '../src/core/editor.js';
import { BehaviorManager } from '../src/core/behaviors.js';
import { GameBundler } from '../src/compiler/game-bundler.js';

test('Editor.setupModelAnimations initializes anim state graph and detects Idle/Walk/Run clips', () => {
  const editor = new Editor();
  const root = { name: 'Hero' };
  let animAdded = null;
  const model = {
    name: 'Hero_Render',
    addComponent: (type, options) => {
      animAdded = {
        type,
        options,
        states: [],
        assignedTracks: {},
        baseLayer: {
          activeState: null,
          play: (st) => { animAdded.baseLayer.activeState = st; },
          transition: (to, time) => { animAdded.baseLayer.activeState = to; }
        },
        loadStateGraph: (graph) => {
          animAdded.graph = graph;
        },
        assignAnimation: (name, track) => {
          animAdded.assignedTracks[name] = track;
        }
      };
      model.anim = animAdded;
    }
  };

  const fakeAnimations = [
    { name: 'static', resource: { duration: 1.0 } },
    { name: 'idle', resource: { duration: 2.0 } },
    { name: 'walk', resource: { duration: 1.0 } },
    { name: 'sprint', resource: { duration: 0.8 } },
    { name: 'attack-melee-right', resource: { duration: 0.6 } }
  ];

  const result = editor.setupModelAnimations(root, model, fakeAnimations);

  assert.ok(root._modelAnimations, 'Root entity has model animations list');
  assert.equal(root._modelAnimations.length, 5);
  assert.equal(root._idleClip, 'idle');
  assert.equal(root._walkClip, 'walk');
  assert.equal(root._runClip, 'sprint');

  assert.ok(animAdded, 'Anim component added to model');
  assert.equal(animAdded.type, 'anim');
  assert.equal(animAdded.options.activate, true);
  assert.equal(animAdded.baseLayer.activeState, 'idle', 'Automatically started playing idle animation');
});

test('BehaviorManager.updateLocomotion seamlessly blends between Idle, Walk, and Run on skeletal entities', () => {
  const editor = new Editor();
  const bm = new BehaviorManager(editor);

  let activeClip = 'idle';
  const fakeAnimComp = {
    baseLayer: {
      get activeState() { return activeClip; },
      transition: (to, blendTime) => { activeClip = to; },
      play: (to) => { activeClip = to; }
    },
    setFloat: (param, val) => {}
  };

  const characterEntity = {
    name: 'PlayerWarrior',
    _animComp: fakeAnimComp,
    _idleClip: 'idle',
    _walkClip: 'walk',
    _runClip: 'sprint',
    _modelAnimations: ['idle', 'walk', 'sprint']
  };

  // Initially idle
  assert.equal(activeClip, 'idle');

  // Player starts walking (speed 5.0)
  bm.updateLocomotion(characterEntity, 5.0, true, 0.016);
  assert.equal(activeClip, 'walk', 'Transitioned to walk clip while moving at standard speed');

  // Player runs fast (speed 9.0)
  bm.updateLocomotion(characterEntity, 9.0, true, 0.016);
  assert.equal(activeClip, 'sprint', 'Transitioned to sprint clip when speed exceeds sprint threshold');

  // Player stops moving
  bm.updateLocomotion(characterEntity, 0, false, 0.016);
  assert.equal(activeClip, 'idle', 'Transitioned back to idle clip when stationary');
});

test('BehaviorManager.updateLocomotion applies procedural limb swinging on modular character hierarchies', () => {
  const editor = new Editor();
  const bm = new BehaviorManager(editor);

  let leftLegRot = null;
  let rightLegRot = null;
  let leftArmRot = null;
  let rightArmRot = null;

  const characterEntity = {
    name: 'BlockyCharacter',
    findByName: (n) => {
      if (n === 'leg-left') return { setLocalEulerAngles: (x, y, z) => { leftLegRot = [x, y, z]; } };
      if (n === 'leg-right') return { setLocalEulerAngles: (x, y, z) => { rightLegRot = [x, y, z]; } };
      if (n === 'arm-left') return { setLocalEulerAngles: (x, y, z) => { leftArmRot = [x, y, z]; } };
      if (n === 'arm-right') return { setLocalEulerAngles: (x, y, z) => { rightArmRot = [x, y, z]; } };
      return null;
    }
  };

  // Move character for multiple frames
  bm.updateLocomotion(characterEntity, 5.0, true, 0.1);

  assert.ok(leftLegRot !== null, 'Left leg rotation updated');
  assert.ok(rightLegRot !== null, 'Right leg rotation updated');
  assert.ok(leftArmRot !== null, 'Left arm rotation updated');
  assert.ok(rightArmRot !== null, 'Right arm rotation updated');

  // Legs swing in opposite phases
  assert.equal(leftLegRot[0], -rightLegRot[0], 'Left and right legs swing in opposition');

  // Arms swing in opposite phase to legs
  assert.equal(Math.sign(leftArmRot[0]), -Math.sign(leftLegRot[0]), 'Left arm swings opposite to left leg');

  // Stopping resets limbs to zero
  bm.updateLocomotion(characterEntity, 0, false, 0.016);
  assert.deepEqual(leftLegRot, [0, 0, 0], 'Left leg returned to neutral rotation');
  assert.deepEqual(rightLegRot, [0, 0, 0], 'Right leg returned to neutral rotation');
});

test('GameBundler exports standalone HTML with automatic skeletal locomotion and anim state graph setup', () => {
  const editor = new Editor();
  editor.projectName = 'Locomotion Demo';

  const bundler = new GameBundler(editor);
  const html = bundler.compileStandaloneHTML({ title: 'Locomotion Demo' });

  assert.ok(html.includes('updateLocomotion'), 'Compiled HTML contains updateLocomotion function');
  assert.ok(html.includes('_modelAnimations'), 'Compiled HTML checks for model animations');
  assert.ok(html.includes('pc.AnimStateGraph'), 'Compiled HTML sets up AnimStateGraph');
  assert.ok(html.includes('_idleClip'), 'Compiled HTML tracks idleClip');
  assert.ok(html.includes('_walkClip'), 'Compiled HTML tracks walkClip');
});
