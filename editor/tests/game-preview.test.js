import test from 'node:test';
import assert from 'node:assert/strict';
import { createRuntimeAssetLoader, startRuntimeAudio } from '../src/runtime/runtime-assets.js';
import { createPreviewDocument, previewStatus, PREVIEW_SANDBOX } from '../src/runtime/preview-document.js';
import { prepareGame } from '../src/runtime/prepare-game.js';
import * as pc from 'playcanvas';
import { Editor } from '../src/core/editor.js';

function fixture(options) {
  const callbacks = [], applied = [];
  const app = { assets: { loadFromUrl(url, type, callback) { callbacks.push(callback); } } };
  return { callbacks, applied, loader: createRuntimeAssetLoader(app, options) };
}

test('runtime readiness waits for every declared resource and catches apply failures', async () => {
  const { loader, callbacks, applied } = fixture();
  loader.load('model', 'container', () => applied.push('model'));
  loader.load('map', 'texture', () => applied.push('texture'));
  let settled = false; const done = loader.wait().then(value => { settled = true; return value; });
  callbacks[0](null, { resource: {} }); await Promise.resolve(); assert.equal(settled, false);
  callbacks[1](null, { resource: {} }); assert.equal(await done, 2); assert.deepEqual(applied, ['model', 'texture']);
  const played = [], slot = { name: 'wind', asset: 0, autoPlay: false };
  startRuntimeAudio({ root: { findComponents: () => [{ enabled: true, entity: { enabled: true }, _studioSlotAutoPlay: { wind: true }, slots: { wind: slot }, play: name => played.push(name) }] } });
  assert.deepEqual(played, ['wind']); assert.equal(slot.autoPlay, true);
  const broken = fixture(); broken.loader.load('model', 'container', () => { throw new Error('apply'); });
  broken.callbacks[0](null, { resource: {} }); await assert.rejects(broken.loader.wait(), /initialize/);
});

test('resource errors, missing resources and timeouts fail startup, and late callbacks cannot apply', async () => {
  const { loader, callbacks } = fixture({ timeoutMs: 10 }); let applied = 0;
  loader.load('broken', 'container', () => applied++); callbacks[0]('missing');
  loader.load('empty', 'audio', () => applied++); callbacks[1](null, {});
  loader.load('slow', 'texture', () => applied++);
  await assert.rejects(loader.wait(), /timed out/); callbacks[2](null, { resource: {} }); assert.equal(applied, 0);
});

test('synchronous transport exceptions and cached callbacks are handled deterministically', async () => {
  const failing = createRuntimeAssetLoader({ assets: { loadFromUrl() { throw new Error('transport'); } } });
  failing.load('broken', 'texture', () => {}); await assert.rejects(failing.wait(), /could not load/);
  let applied = 0;
  const cached = createRuntimeAssetLoader({ assets: { loadFromUrl(url, type, callback) { callback(null, { resource: {} }); callback(null, { resource: {} }); } } });
  cached.load('cached', 'texture', () => applied++); assert.equal(await cached.wait(), 1); assert.equal(applied, 1);
});

test('preview document restricts origin, network, navigation and permissions while retaining inline game code', () => {
  const html = createPreviewDocument('<html><head></head><body><script>/* game */</script></body></html>', '</script>');
  assert.equal(PREVIEW_SANDBOX, 'allow-scripts allow-pointer-lock');
  assert.ok(!PREVIEW_SANDBOX.includes('allow-same-origin')); assert.ok(!PREVIEW_SANDBOX.includes('allow-top-navigation'));
  assert.ok(html.includes("connect-src data: blob:")); assert.ok(html.includes("frame-src 'none'"));
  assert.ok(!html.includes('"token":"</script>"')); assert.ok(html.includes('/* game */'));
});

test('status channel rejects wrong windows, origins, tokens and command payloads', () => {
  const source = {}, data = { channel: 'makulu-game-preview-v1', token: 'correct', state: 'running', cameraName: 'Game', resourceCount: 2 };
  assert.deepEqual(previewStatus({ source, origin: 'null', data }, source, 'correct'), { state: 'running', cameraName: 'Game', resourceCount: 2 });
  for (const event of [ { source: {}, origin: 'null', data }, { source, origin: 'https://studio.test', data }, { source, origin: 'null', data: { ...data, token: 'old' } }, { source, origin: 'null', data: { ...data, state: 'execute' } } ]) assert.equal(previewStatus(event, source, 'correct'), null);
  assert.equal(previewStatus({ source, origin: 'null', data: { ...data, cameraName: '<b>text</b>', execute: 'ignored' } }, source, 'correct').cameraName, '<b>text</b>');
});

test('shared game preparation captures one revision and does not mutate the editable project', async () => {
  const editor = new Editor(); editor.projectName = 'Captured'; editor.createEntity({ name: 'Original' });
  const before = editor.exportProjectJSON();
  const html = await prepareGame(editor, {
    packager: { async packageScene(scene) { editor.projectName = 'Later'; return { scene, manifest: { entries: [] } }; } },
    loadRuntimes: async () => ({ engine: '/* engine */', physics: '/* physics */', engineLicense: 'test', physicsLicense: 'test', descriptor: {} })
  });
  assert.ok(html.includes('<title>Captured</title>')); assert.ok(!html.includes('<title>Later</title>'));
  editor.projectName = 'Captured'; assert.equal(editor.exportProjectJSON(), before);
  editor.isPlaying = true; await assert.rejects(prepareGame(editor), /Stop/);
  editor.isPlaying = false; editor.sceneResourceStatus = { status: 'loading' }; await assert.rejects(prepareGame(editor), /resources/);
});


test('disabled camera components stay disabled across editable save/open', () => {
  const app = new pc.AppBase({ id: 'preview-camera-test' }), options = new pc.AppOptions();
  options.graphicsDevice = new pc.NullGraphicsDevice({ width: 64, height: 64 });
  options.componentSystems = [pc.CameraComponentSystem]; options.resourceHandlers = []; app.init(options);
  try {
    const editor = new Editor(); editor.runtime = { app };
    editor.createEntity({ name: 'DisabledCamera', components: [{ type: 'camera', properties: { enabled: false } }] });
    editor.createEntity({ name: 'ActiveCamera', components: [{ type: 'camera' }] });
    const document = editor.exportProjectJSON();
    assert.equal(JSON.parse(document).scenes[0].data.root.children[0].components.camera.enabled, false);
    assert.equal(editor.loadProjectJSON(document), true);
    assert.equal(app.root.findByName('DisabledCamera').camera.enabled, false);
    assert.equal(app.root.findByName('ActiveCamera').camera.enabled, true);
  } finally { app.destroy(); }
});
