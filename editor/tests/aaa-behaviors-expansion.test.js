import test from 'node:test';
import assert from 'node:assert/strict';
import * as pc from 'playcanvas';
import { Editor } from '../src/core/editor.js';
import { BehaviorManager } from '../src/core/behaviors.js';
import { GameBundler } from '../src/compiler/game-bundler.js';
import { generateWAVDataURL } from '../src/engine/procedural-sfx.js';
import { BEHAVIOR_CATALOG } from '../src/ui/inspector.js';

test('Procedural SFX generateWAVDataURL creates valid base64 WAV data URL', () => {
  const dataUrl = generateWAVDataURL('laser');
  assert.ok(dataUrl.startsWith('data:audio/wav;base64,'));
  assert.ok(dataUrl.length > 100);

  const coinUrl = generateWAVDataURL('coin');
  assert.ok(coinUrl.startsWith('data:audio/wav;base64,'));
  assert.ok(coinUrl.length > 100);
});

test('BEHAVIOR_CATALOG includes all 5 new AAA behaviors', () => {
  const types = BEHAVIOR_CATALOG.map(b => b.type);
  assert.ok(types.includes('third_person_controller'));
  assert.ok(types.includes('stamina_system'));
  assert.ok(types.includes('damage_flash'));
  assert.ok(types.includes('climbable_ladder'));
  assert.ok(types.includes('slow_motion_zone'));
});

test('BehaviorManager attaches and updates all 5 new AAA behaviors', () => {
  const editor = new Editor();
  const behaviors = new BehaviorManager(editor);
  editor.behaviors = behaviors;

  const entity = new pc.Entity('HeroCharacter');
  editor.root.addChild(entity);

  behaviors.attachBehavior(entity, 'third_person_controller', { speed: 10, cameraDistance: 5 });
  behaviors.attachBehavior(entity, 'stamina_system', { maxStamina: 100, drainRate: 20 });
  behaviors.attachBehavior(entity, 'damage_flash', { flashDuration: 0.2 });
  behaviors.attachBehavior(entity, 'climbable_ladder', { climbSpeed: 6 });
  behaviors.attachBehavior(entity, 'slow_motion_zone', { timeScale: 0.2 });

  assert.ok(behaviors.hasBehavior(entity, 'third_person_controller'));
  assert.ok(behaviors.hasBehavior(entity, 'stamina_system'));
  assert.ok(behaviors.hasBehavior(entity, 'damage_flash'));
  assert.ok(behaviors.hasBehavior(entity, 'climbable_ladder'));
  assert.ok(behaviors.hasBehavior(entity, 'slow_motion_zone'));

  const list = behaviors.getBehaviors(entity);
  assert.equal(list.length, 5);
});

test('HUD Stamina Bar Overlay config exports and serializes cleanly in scene JSON', () => {
  const editor = new Editor();
  editor.hudConfig.stamina = { enabled: true, label: 'STAMINA', max: 100 };

  const jsonString = editor.exportSceneJSON();
  assert.ok(jsonString.includes('"stamina"'));
  assert.ok(jsonString.includes('"STAMINA"'));

  const parsed = JSON.parse(jsonString);
  assert.equal(parsed.hud.stamina.label, 'STAMINA');
  assert.equal(parsed.hud.stamina.enabled, true);
});

test('GameBundler compiles standalone HTML with 5 new behaviors and stamina HUD overlay', () => {
  const editor = new Editor();
  const behaviors = new BehaviorManager(editor);
  editor.behaviors = behaviors;

  const entity = new pc.Entity('PlayerWithAAA');
  editor.root.addChild(entity);

  behaviors.attachBehavior(entity, 'third_person_controller', { speed: 8 });
  behaviors.attachBehavior(entity, 'stamina_system', { maxStamina: 100 });
  behaviors.attachBehavior(entity, 'damage_flash', { flashDuration: 0.2 });

  const bundler = new GameBundler(editor);
  const html = bundler.compileStandaloneHTML({ title: 'AAA Test Game' });

  assert.ok(html.includes('third_person_controller'));
  assert.ok(html.includes('stamina_system'));
  assert.ok(html.includes('damage_flash'));
  assert.ok(html.includes('climbable_ladder'));
  assert.ok(html.includes('slow_motion_zone'));
  assert.ok(html.includes('hud-stamina-bar-wrap'));
});
