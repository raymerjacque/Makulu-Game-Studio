import test from 'node:test';
import assert from 'node:assert/strict';
import { Editor } from '../src/core/editor.js';
import { GameBundler } from '../src/compiler/game-bundler.js';

test('Editor initialization and mode switching', () => {
  const editor = new Editor();
  assert.equal(editor.mode, 'simple');
  assert.equal(editor.projectName, 'Untitled Project');
  assert.equal(editor.activeSceneName, 'Main Scene');

  editor.setEditorMode('pro');
  assert.equal(editor.mode, 'pro');
});

test('Multi-scene management: create, rename, duplicate, delete', () => {
  const editor = new Editor();

  // Duplicate scene
  const dupName = editor.duplicateScene('Main Scene');
  assert.equal(dupName, 'Main Scene_Copy');
  assert.equal(editor.scenes.has('Main Scene_Copy'), true);

  // Rename scene
  const renamed = editor.renameScene('Main Scene_Copy', 'Level_2');
  assert.equal(renamed, true);
  assert.equal(editor.scenes.has('Level_2'), true);
  assert.equal(editor.scenes.has('Main Scene_Copy'), false);

  // Delete scene
  const deleted = editor.deleteScene('Level_2');
  assert.equal(deleted, true);
  assert.equal(editor.scenes.has('Level_2'), false);
});

test('TriggerSystem registration and lookup', () => {
  const editor = new Editor();
  editor.triggers.registerTrigger('Door_Sensor', {
    eventType: 'on_enter',
    action: 'teleport',
    targetPosition: [10, 0, 10]
  });

  assert.equal(editor.triggers.hasTrigger('Door_Sensor'), true);
  const trig = editor.triggers.getTrigger('Door_Sensor');
  assert.equal(trig.action, 'teleport');
  assert.deepEqual(trig.targetPosition, [10, 0, 10]);

  editor.triggers.removeTrigger('Door_Sensor');
  assert.equal(editor.triggers.hasTrigger('Door_Sensor'), false);
});

test('BehaviorManager attaching and detaching behaviors', () => {
  const editor = new Editor();
  const dummyEntity = { name: 'Player' };

  if (editor.behaviors) {
    editor.behaviors.attachBehavior(dummyEntity, 'wasd', { speed: 8 });
    assert.equal(editor.behaviors.hasBehavior(dummyEntity, 'wasd'), true);

    const list = editor.behaviors.getBehaviors(dummyEntity);
    assert.equal(list.length, 1);
    assert.equal(list[0].type, 'wasd');

    editor.behaviors.removeBehavior(dummyEntity, 'wasd');
    assert.equal(editor.behaviors.hasBehavior(dummyEntity, 'wasd'), false);
  }
});

test('PrefabSystem serializing and querying prefabs', () => {
  const editor = new Editor();
  const mockEntity = {
    name: 'Chest',
    getPosition: () => ({ x: 0, y: 1, z: 0 }),
    getEulerAngles: () => ({ x: 0, y: 0, z: 0 }),
    getLocalScale: () => ({ x: 1, y: 1, z: 1 }),
    render: { type: 'box' }
  };

  const prefab = editor.prefabs.createPrefabFromEntity(mockEntity);
  assert.ok(prefab);
  assert.equal(prefab.name, 'Chest.prefab');

  const fetched = editor.prefabs.getPrefab('Chest');
  assert.ok(fetched);
  assert.equal(fetched.name, 'Chest.prefab');
});

test('GameBundler generates standalone HTML output', () => {
  const editor = new Editor();
  editor.projectName = 'Awesome 3D Game';
  const bundler = new GameBundler(editor);

  const html = bundler.compileStandaloneHTML({ title: 'Awesome 3D Game' });
  assert.equal(typeof html, 'string');
  assert.ok(html.includes('<!DOCTYPE html>'));
  assert.ok(html.includes('Awesome 3D Game'));
  assert.ok(html.includes('playcanvas-stable.min.js'));
  assert.ok(html.includes('SCENE_DATA'));
});
