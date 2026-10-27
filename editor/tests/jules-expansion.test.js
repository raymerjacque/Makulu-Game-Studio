import test from 'node:test';
import assert from 'node:assert';
import { Editor } from '../src/core/editor.js';
import { BehaviorManager } from '../src/core/behaviors.js';
import { GameBundler } from '../src/compiler/game-bundler.js';
import { SFXStudioModal } from '../src/ui/sfx-studio-modal.js';
import { playProceduralSFX } from '../src/engine/procedural-sfx.js';

test('Jules Expansion: Attach and query all 5 new AAA behaviors', () => {
  const editor = new Editor();
  const behaviors = new BehaviorManager(editor);
  editor.behaviors = behaviors;

  const entity = editor.createEntity({ name: 'FoliageTree' });

  const newBehaviors = [
    'sway_foliage',
    'spline_follower',
    'screen_shake_zone',
    'exploding_barrel',
    'audio_reverb_zone'
  ];

  newBehaviors.forEach(bType => {
    behaviors.attachBehavior(entity, bType, { speed: 2.5, radius: 5.0 });
    assert.strictEqual(behaviors.hasBehavior(entity, bType), true);
  });

  const attached = behaviors.getBehaviors(entity);
  assert.strictEqual(attached.length, newBehaviors.length);

  // Verify parameters
  const sway = attached.find(b => b.type === 'sway_foliage');
  assert.strictEqual(sway.params.speed, 2.5);

  const barrel = attached.find(b => b.type === 'exploding_barrel');
  assert.strictEqual(barrel.params.radius, 5.0);

  // Test removal
  behaviors.removeBehavior(entity, 'sway_foliage');
  assert.strictEqual(behaviors.hasBehavior(entity, 'sway_foliage'), false);
  assert.strictEqual(behaviors.getBehaviors(entity).length, 4);
});

test('Jules Expansion: Standalone Game Bundler includes new behaviors and post-processing', () => {
  const editor = new Editor();
  const behaviors = new BehaviorManager(editor);
  editor.behaviors = behaviors;

  const barrel = editor.createEntity({ name: 'Barrel' });
  behaviors.attachBehavior(barrel, 'exploding_barrel', { blastDamage: 90 });

  const foliage = editor.createEntity({ name: 'Foliage' });
  behaviors.attachBehavior(foliage, 'sway_foliage', { speed: 3.0 });

  editor.postProcessingConfig = {
    bloom: { enabled: true, intensity: 1.5, threshold: 0.8 },
    exposure: 1.2,
    fog: { enabled: true, color: '#334455', density: 0.02 }
  };

  const bundler = new GameBundler(editor);
  const html = bundler.compileStandaloneHTML({ title: 'Jules Expansion Game' });

  assert.ok(html.includes('sway_foliage'), 'Compiled HTML contains sway_foliage');
  assert.ok(html.includes('spline_follower'), 'Compiled HTML contains spline_follower');
  assert.ok(html.includes('screen_shake_zone'), 'Compiled HTML contains screen_shake_zone');
  assert.ok(html.includes('exploding_barrel'), 'Compiled HTML contains exploding_barrel');
  assert.ok(html.includes('audio_reverb_zone'), 'Compiled HTML contains audio_reverb_zone');
  assert.ok(html.includes('SCENE_DATA.postProcessing'), 'Compiled HTML includes postProcessing pipeline');
  assert.ok(html.includes('Jules Expansion Game'), 'Compiled HTML includes custom game title');
});

test('Jules Expansion: Procedural SFX export and audio studio integration', () => {
  const editor = new Editor();
  editor.assetsPanel = {
    assets: [],
    addAsset(a) {
      this.assets.push(a);
    }
  };

  // Test playProceduralSFX without throw
  assert.doesNotThrow(() => {
    playProceduralSFX('laser', 0.5);
    playProceduralSFX('explosion', 0.8);
    playProceduralSFX('coin', 0.6);
  });

  // Verify modal instantiation in headless mode
  const modal = new SFXStudioModal(editor);
  assert.strictEqual(modal.isOpen, false);
  assert.strictEqual(modal.sfxType, 'laser');
});
