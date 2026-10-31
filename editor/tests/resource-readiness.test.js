import test from 'node:test';
import assert from 'node:assert/strict';
import * as pc from 'playcanvas';
import { Editor } from '../src/core/editor.js';
import { ResourceLoadSession } from '../src/project/resource-load-session.js';

const scene = (name = 'Model') => ({ project: 'Resource fixture', scene: 'Main', root: { children: [{ name, modelUrl: './model.glb' }] } });
function harness() {
  const editor = new Editor(), requests = [], status = [];
  const app = { root: new pc.Entity('Root'), assets: { loadFromUrl(url, type, callback) { requests.push({ url, type, callback }); } } };
  editor.runtime = { app }; editor.events.on('scene:resources', report => status.push(report));
  const resource = { instantiateRenderEntity: () => new pc.Entity('Mesh') };
  return { editor, app, requests, status, resource };
}

test('project opening waits for actual model completion and publishes progress before ready', async () => {
  const { editor, requests, status, resource } = harness(); let settled = false;
  const opened = editor.openProjectJSON(scene(), { assetTimeoutMs: 1000 }).then(report => { settled = true; return report; });
  await Promise.resolve(); assert.equal(settled, false); assert.equal(editor.sceneResourceStatus.status, 'loading');
  requests[0].callback(null, { resource });
  const report = await opened;
  assert.equal(report.status, 'ready'); assert.equal(report.loaded, 1); assert.equal(report.pending, 0); assert.equal(report.dataLoaded, true);
  assert.ok(status.some(report => report.status === 'loading')); assert.equal(status.at(-1).status, 'ready');
  assert.ok(editor.getApp().root.findByName('Mesh'));
});

test('failed requests report actionable entity/type metadata without echoing raw errors or credential URLs', async () => {
  const { editor, requests } = harness();
  const opened = editor.openProjectJSON(scene('MissingTree'));
  requests[0].callback(new Error('private-provider-response?token=test-only-value'));
  const report = await opened;
  assert.equal(report.status, 'failed'); assert.equal(report.dataLoaded, true);
  assert.equal(report.failures[0].entityName, 'MissingTree'); assert.equal(report.failures[0].kind, 'model');
  assert.ok(!JSON.stringify(report).includes('test-only-value'));
  assert.ok(editor.lastProjectError.includes('1 scene resource'));
});

test('timeouts settle and late callbacks cannot apply resources', async () => {
  const { editor, requests, resource } = harness();
  const report = await editor.openProjectJSON(scene(), { assetTimeoutMs: 10 });
  assert.equal(report.status, 'failed'); assert.equal(report.failures[0].reason, 'Loading timed out.');
  requests[0].callback(null, { resource });
  assert.equal(editor.getApp().root.findByName('Mesh'), null);
  assert.equal(editor.sceneResourceStatus.status, 'failed');
});

test('new scene cancels the previous wait promptly and stale callbacks do not mutate the replacement', async () => {
  const { editor, requests, resource } = harness();
  const first = editor.openProjectJSON(scene('OldModel'));
  const next = editor.openProjectJSON({ root: { children: [{ name: 'Replacement' }] } });
  assert.equal((await first).status, 'cancelled'); assert.equal((await next).status, 'ready');
  requests[0].callback(null, { resource });
  assert.ok(editor.getApp().root.findByName('Replacement')); assert.equal(editor.getApp().root.findByName('Mesh'), null);
});

test('invalid project does not cancel an in-flight valid scene restoration', async () => {
  const { editor, requests, resource } = harness();
  const first = editor.openProjectJSON(scene()); const session = editor.sceneResourceSession;
  assert.equal((await editor.openProjectJSON('{invalid')).status, 'invalid'); assert.equal(editor.sceneResourceSession, session);
  requests[0].callback(null, { resource }); assert.equal((await first).status, 'ready');
});

test('retry restores failed resource references and keeps edits, scripts and stable entity identity', async () => {
  const { editor, app, requests, resource } = harness();
  const opened = editor.openProjectJSON(scene()); requests[0].callback('not-found'); await opened;
  const model = app.root.findByName('Model'); model.setLocalPosition(4, 5, 6);
  const id = model._studioId; editor.scripts.set('preserve.js', '/* source */');
  const retried = editor.retrySceneResources(); requests[1].callback(null, { resource });
  assert.equal((await retried).status, 'ready');
  const restored = app.root.findByName('Model'); assert.equal(restored._studioId, id);
  assert.deepEqual([restored.getLocalPosition().x, restored.getLocalPosition().y, restored.getLocalPosition().z], [4, 5, 6]);
  assert.equal(editor.scripts.get('preserve.js'), '/* source */'); assert.ok(app.root.findByName('Mesh'));
});

test('resource sessions handle cached, failed-to-apply, duplicate and throwing callbacks without false readiness', async () => {
  let applied = 0;
  const session = new ResourceLoadSession();
  session.add({ kind: 'cached' }, done => { done(null, { resource: {} }); done(null, { resource: {} }); }, () => { applied++; });
  session.add({ kind: 'apply-error' }, done => done(null, { resource: {} }), () => { throw new Error('bad resource'); });
  session.add({ kind: 'request-error' }, () => { throw new Error('bad request'); }, () => {});
  session.start(); const report = await session.done;
  assert.equal(applied, 1); assert.equal(report.status, 'failed'); assert.equal(report.loaded, 1); assert.equal(report.failures.length, 2);
  const empty = new ResourceLoadSession(); empty.start(); assert.equal((await empty.done).status, 'ready');
});

test('all supported material texture slots round-trip and wait for application through real engine components', async () => {
  const app = new pc.AppBase({ id: 'texture-readiness' }), options = new pc.AppOptions();
  options.graphicsDevice = new pc.NullGraphicsDevice({ width: 64, height: 64 });
  options.componentSystems = [pc.RenderComponentSystem]; options.resourceHandlers = []; app.init(options);
  const texture = new pc.Texture(options.graphicsDevice, { width: 1, height: 1 }), requests = [];
  app.assets.loadFromUrl = (url, type, callback) => requests.push({ url, type, callback });
  const editor = new Editor(); editor.runtime = { app };
  try {
    const fixture = { root: { children: [{ name: 'Surface', components: { render: { type: 'box', material: {
      diffuseMapUrl: './color.png', normalMapUrl: './normal.png', roughnessMapUrl: './rough.png', emissiveMapUrl: './emissive.png'
    } } } }] } };
    const opened = editor.openProjectJSON(fixture); assert.equal(requests.length, 4);
    requests.slice(0, 3).forEach(request => request.callback(null, { resource: texture }));
    assert.equal(editor.sceneResourceStatus.status, 'loading');
    requests[3].callback(null, { resource: texture }); assert.equal((await opened).status, 'ready');
    const material = app.root.findByName('Surface').render.material;
    for (const field of ['diffuseMap', 'normalMap', 'glossMap', 'emissiveMap']) assert.equal(material[field], texture);
    assert.equal(material.glossInvert, true);
    const saved = JSON.parse(editor.exportProjectJSON()).scenes[0].data.root.children[0].components.render.material;
    assert.equal(saved.diffuseMapUrl, './color.png'); assert.equal(saved.roughnessMapUrl, './rough.png'); assert.equal(saved.emissiveMapUrl, './emissive.png');
    const { GameBundler } = await import('../src/compiler/game-bundler.js');
    const vm = await import('node:vm');
    const html = new GameBundler(editor).compileStandaloneHTML();
    const start = html.indexOf('    function buildNode(data, parent)'), end = html.indexOf('    if (SCENE_DATA.root && SCENE_DATA.root.children)', start);
    const context = vm.createContext({ pc, app, EMBEDDED_ASSETS: [] });
    vm.runInContext(html.slice(start, end), context);
    requests.length = 0;
    const exported = context.buildNode({ name: 'ExportedSurface', components: { render: { type: 'box', material: saved } } }, app.root);
    assert.equal(requests.length, 4, 'Delivered scene builder must load every saved texture slot');
    requests.forEach(request => request.callback(null, { resource: texture }));
    for (const field of ['diffuseMap', 'normalMap', 'glossMap', 'emissiveMap']) assert.equal(exported.render.material[field], texture);
    assert.equal(exported.render.material.glossInvert, true);
  } finally { editor.sceneResourceSession?.cancel(); texture.destroy(); app.destroy(); }
});

test('scene status UI uses text labels and play is blocked while resources are loading or missing', async () => {
  const { TopBar } = await import('../src/ui/topbar.js');
  const { editor } = harness(), status = {}, retry = { style: {}, addEventListener() {} }, handlers = {};
  const play = { addEventListener: (event, handler) => { handlers.play = handler; } };
  const bar = Object.create(TopBar.prototype); bar.editor = editor; bar.isPlaying = false;
  bar.container = { querySelector: selector => ({ '#scene-resource-status': status, '#retry-scene-resources': retry, '#btn-play-sim': play, '#play-icon': {}, '#play-text': {} })[selector] };
  bar.bindResourceStatus(); bar.setupSimulation();
  const pending = { status: 'loading', total: 2, loaded: 1, failures: [] };
  editor.sceneResourceStatus = pending; editor.events.emit('scene:resources', pending); handlers.play();
  assert.equal(bar.isPlaying, false); assert.equal(status.textContent, 'Loading 1/2');
  const failed = { status: 'failed', total: 2, loaded: 1, failures: [{ entityName: '<img onerror=alert(1)>', kind: 'model', reason: 'Resource could not be loaded.' }] };
  editor.sceneResourceStatus = failed; editor.events.emit('scene:resources', failed); handlers.play();
  assert.equal(bar.isPlaying, false); assert.equal(status.textContent, '1 asset(s) missing'); assert.equal(status.innerHTML, undefined);
  assert.equal(retry.style.display, ''); assert.ok(status.title.includes('<img'));
});
