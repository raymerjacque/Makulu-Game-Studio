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

test('HUD configuration export and scene serialization', () => {
  const editor = new Editor();
  editor.hudConfig.health.label = 'Armor';
  editor.hudConfig.health.max = 200;

  const json = editor.exportSceneJSON();
  assert.ok(json.includes('"hud"'));
  assert.ok(json.includes('"Armor"'));

  const newEditor = new Editor();
  newEditor.loadSceneJSON(json);
  assert.equal(newEditor.hudConfig.health.label, 'Armor');
  assert.equal(newEditor.hudConfig.health.max, 200);
});

test('Health and Combat Damage behaviors in BehaviorManager', () => {
  const editor = new Editor();
  const player = { name: 'Player' };
  const hazard = { name: 'Spike' };

  if (editor.behaviors) {
    editor.behaviors.attachBehavior(player, 'health', { maxHp: 100, currentHp: 100 });
    assert.equal(editor.behaviors.hasBehavior(player, 'health'), true);

    const b = editor.behaviors.getBehaviors(player).find(item => item.type === 'health');
    assert.equal(b.params.currentHp, 100);

    editor.behaviors.attachBehavior(hazard, 'damage_dealer', { damage: 25, radius: 2.0 });
    assert.equal(editor.behaviors.hasBehavior(hazard, 'damage_dealer'), true);
  }
});

test('New Game Behaviors: Enemy AI, Projectile Shooter, Mouse Look', () => {
  const editor = new Editor();
  const enemy = { name: 'Goblin' };
  const player = { name: 'Player' };

  if (editor.behaviors) {
    editor.behaviors.attachBehavior(enemy, 'enemy_ai', { speed: 3.5, detectRadius: 15, damage: 15 });
    assert.equal(editor.behaviors.hasBehavior(enemy, 'enemy_ai'), true);

    editor.behaviors.attachBehavior(player, 'projectile_shooter', { speed: 30, damage: 35 });
    assert.equal(editor.behaviors.hasBehavior(player, 'projectile_shooter'), true);

    editor.behaviors.attachBehavior(player, 'mouse_look', { speed: 90 });
    assert.equal(editor.behaviors.hasBehavior(player, 'mouse_look'), true);
  }
});

test('Win Level Victory Trigger action registration and execution', () => {
  const editor = new Editor();
  editor.triggers.registerTrigger('FinishLine', {
    eventType: 'on_enter',
    action: 'win_level',
    victoryMessage: 'Level 1 Cleared!'
  });

  assert.equal(editor.triggers.hasTrigger('FinishLine'), true);
  const trig = editor.triggers.getTrigger('FinishLine');
  assert.equal(trig.action, 'win_level');
  assert.equal(trig.victoryMessage, 'Level 1 Cleared!');
});

test('GameBundler generates standalone HTML with HUD, Victory screen, Base64 assets and new behaviors', () => {
  const editor = new Editor();
  editor.projectName = 'Awesome 3D Game';
  editor.assetsPanel = {
    assets: [
      { name: 'custom_audio.mp3', type: 'audio', base64Data: 'data:audio/mp3;base64,SUQzBAAAAAAA' }
    ]
  };

  const bundler = new GameBundler(editor);
  const html = bundler.compileStandaloneHTML({ title: 'Awesome 3D Game' });

  assert.equal(typeof html, 'string');
  assert.ok(html.includes('<!DOCTYPE html>'));
  assert.ok(html.includes('Awesome 3D Game'));
  assert.ok(html.includes('hud-container'));
  assert.ok(html.includes('hud-health-bar-wrap'));
  assert.ok(html.includes('gameover-screen'));
  assert.ok(html.includes('victory-screen'));
  assert.ok(html.includes('data:audio/mp3;base64,SUQzBAAAAAAA'));
});
