import test from 'node:test';
import assert from 'node:assert/strict';
import * as pc from 'playcanvas';
import { Editor } from '../src/core/editor.js';
import { AIExecutor } from '../src/ai/ai-executor.js';

function fixture() {
  const app = new pc.AppBase({ id: 'prepared-ai-assets' }), options = new pc.AppOptions();
  options.graphicsDevice = new pc.NullGraphicsDevice({ width: 64, height: 64 });
  options.componentSystems = [pc.RenderComponentSystem]; options.resourceHandlers = []; app.init(options);
  const editor = new Editor(); editor.runtime = { app }; const executor = new AIExecutor(editor), requests = [], textures = [];
  app.assets.loadFromUrl = (url, type, callback) => requests.push({ url, type, callback });
  const texture = () => { const asset = new pc.Asset('Map', 'texture', { url: './map.png' }); asset.resource = new pc.Texture(app.graphicsDevice, { width: 1, height: 1 }); textures.push(asset.resource); return asset; };
  let instances = 0, destroyed = 0;
  const model = () => { const asset = new pc.Asset('Model', 'container', { url: './model.glb' }); asset.resource = { animations: [], instantiateRenderEntity() { instances++; const node = new pc.Entity('LoadedMesh', app); node.addComponent('render', { type: 'box' }); node.once('destroy', () => destroyed++); return node; } }; return asset; };
  return { app, editor, executor, requests, texture, model, counts: () => ({ instances, destroyed }), dispose() { app.destroy(); textures.forEach(texture => texture.destroy()); } };
}
const modelAction = { action: 'spawn_model', name: 'Loaded', url: './model.glb', position: [1, 2, 3] };
const materialAction = { action: 'create_material', target: 'Surface', diffuseMapUrl: './map.png', normalMapUrl: './normal.png', roughnessMapUrl: './rough.png', emissiveMapUrl: './emissive.png' };
const surface = editor => editor.createEntity({ name: 'Surface', components: [{ type: 'render', properties: { type: 'box' } }] });

test('model and all material maps load before any edit, then commit as one reversible batch', async () => {
  const f = fixture(); let foreignApp;
  try {
    const node = surface(f.editor), before = f.editor.exportProjectJSON(), count = f.editor.commandBus.undoStack.length;
    const pending = f.executor.executeActions([{ action: 'modify_entity', name: 'Surface', position: [9, 0, 0] }, modelAction, materialAction]);
    assert.equal(f.requests.length, 5); assert.equal(f.editor.exportProjectJSON(), before); assert.equal(f.counts().instances, 0);
    foreignApp = new pc.AppBase({ id: 'another-preview' });
    const foreignOptions = new pc.AppOptions(); foreignOptions.graphicsDevice = new pc.NullGraphicsDevice({ width: 64, height: 64 }); foreignOptions.componentSystems = []; foreignOptions.resourceHandlers = []; foreignApp.init(foreignOptions);
    const loadedModel = f.model(); f.requests[0].callback(null, loadedModel);
    for (let index = 1; index < 4; index++) f.requests[index].callback(null, f.texture());
    await Promise.resolve(); assert.equal(f.editor.exportProjectJSON(), before); assert.equal(f.counts().instances, 0);
    const last = f.texture(); f.requests[4].callback(null, last);
    const result = await pending, after = f.editor.exportProjectJSON(), loaded = f.app.root.findByName('Loaded');
    assert.equal(result.batchInfo.undoable, true); assert.equal(f.editor.commandBus.undoStack.length, count + 1); assert.equal(f.counts().instances, 1);
    assert.equal(loaded._app, f.app); assert.equal(loaded.children[0]._app, f.app); assert.equal(loaded._modelUrl, './model.glb'); assert.equal(loaded.children[0]._studioModelInstance, true);
    assert.equal(node.render.material.emissiveMap, last.resource); assert.equal(node.render.material._normalMapUrl, './normal.png'); assert.equal(node.render.material.glossInvert, true);
    assert.equal(JSON.parse(after).scenes[0].data.root.children[0].components.render.material.diffuseMapUrl, './map.png');
    f.editor.commandBus.undo(); assert.equal(f.editor.exportProjectJSON(), before); assert.equal(loaded.enabled, false);
    f.editor.commandBus.redo(); assert.equal(f.editor.exportProjectJSON(), after); assert.equal(f.requests.length, 5); assert.equal(f.counts().instances, 1);
  } finally { foreignApp?.destroy(); f.dispose(); }
});

test('resource failures, wrong types and timeouts apply no edits and ignore late callbacks', async () => {
  for (const mode of ['failure', 'wrong-type', 'timeout', 'changed-cache']) {
    const f = fixture();
    try {
      const before = f.editor.exportProjectJSON(), pending = f.executor.executeActions([{ action: 'generate_script', name: 'never.js', code: '' }, modelAction], { assetTimeoutMs: 5 });
      if (mode === 'failure') f.requests[0].callback('missing');
      if (mode === 'wrong-type') f.requests[0].callback(null, f.texture());
      if (mode === 'changed-cache') { const asset = f.model(); f.requests[0].callback(null, asset); asset.resource = {}; }
      await assert.rejects(pending, mode === 'changed-cache' ? /prepared asset changed/ : /failed or timed out/);
      f.requests[0].callback(null, f.model());
      assert.equal(f.editor.exportProjectJSON(), before); assert.equal(f.counts().instances, 0); assert.equal(f.editor.commandBus.undoStack.length, 0); assert.equal(f.executor.activeOperation, null);
    } finally { f.dispose(); }
  }
});

test('Cancel loading and AbortSignal stop preparation, release the executor and quarantine later results', async () => {
  for (const signalMode of [false, true]) {
    const f = fixture(), controller = new AbortController();
    try {
      const before = f.editor.exportProjectJSON();
      const pending = f.executor.executeActions([modelAction], signalMode ? { signal: controller.signal } : {});
      await assert.rejects(f.executor.executeActions([{ action: 'generate_script', name: 'other', code: '' }]), /Another AI/);
      if (signalMode) controller.abort(); else { assert.equal(f.executor.cancelPending(), true); assert.equal(f.executor.cancelPending(), false); }
      await assert.rejects(pending, /cancelled/); f.requests[0].callback(null, f.model());
      assert.equal(f.editor.exportProjectJSON(), before); assert.equal(f.counts().instances, 0); assert.equal(f.executor.activeOperation, null);
      await f.executor.executeActions([{ action: 'generate_script', name: 'next.js', code: '' }]); assert.equal(f.editor.scripts.has('next.js'), true);
    } finally { f.dispose(); }
  }
});

test('a user edit while assets wait is preserved and prevents application of the stale batch', async () => {
  const f = fixture();
  try {
    surface(f.editor); const pending = f.executor.executeActions([modelAction, { action: 'modify_entity', name: 'Surface', position: [99, 0, 0] }]);
    f.editor.projectName = 'User edit'; const current = f.editor.exportProjectJSON(), history = f.editor.commandBus.undoStack.length;
    f.requests[0].callback(null, f.model()); await assert.rejects(pending, /project changed/);
    assert.equal(f.editor.exportProjectJSON(), current); assert.equal(f.editor.commandBus.undoStack.length, history); assert.equal(f.counts().instances, 0);
  } finally { f.dispose(); }
});

test('a commit failure destroys owned model instances and restores material while keeping borrowed textures', async () => {
  const f = fixture();
  try {
    const node = surface(f.editor), original = node.render.material, before = f.editor.exportProjectJSON();
    const pending = f.executor.executeActions([modelAction, { action: 'create_material', target: 'Surface', diffuseMapUrl: './map.png' }, { action: 'delete_entity', target: 'Missing' }]);
    f.requests[0].callback(null, f.model()); const map = f.texture(); let destroyed = 0; const destroy = map.resource.destroy.bind(map.resource); map.resource.destroy = () => { destroyed++; destroy(); };
    f.requests[1].callback(null, map); await assert.rejects(pending, /rolled back/);
    assert.equal(f.editor.exportProjectJSON(), before); assert.equal(node.render.material, original); assert.deepEqual(f.counts(), { instances: 1, destroyed: 1 }); assert.equal(destroyed, 0);
  } finally { f.dispose(); }
});

test('shared texture URLs are deduplicated and synchronous cache callbacks are safe', async () => {
  const f = fixture();
  try {
    const node = surface(f.editor), map = f.texture(); let calls = 0;
    f.app.assets.loadFromUrl = (url, type, callback) => { calls++; callback(null, map); callback(null, map); };
    await f.executor.executeActions([{ action: 'create_material', target: 'Surface', diffuseMapUrl: './same.png', emissiveMapUrl: './same.png' }]);
    assert.equal(calls, 1); assert.equal(node.render.material.diffuseMap, map.resource); assert.equal(node.render.material.emissiveMap, map.resource);
  } finally { f.dispose(); }
});

test('unsafe resource URLs and an already-aborted operation are rejected before loading', async () => {
  const f = fixture();
  try {
    const before = f.editor.exportProjectJSON();
    for (const url of ['file:///private/model.glb', 'javascript:alert(1)', 'https://user:secret@example.invalid/model.glb', '../outside.glb', './%252e%252e/outside.glb', 'C:\\private\\model.glb']) await assert.rejects(f.executor.executeActions([{ ...modelAction, url }]));
    const controller = new AbortController(); controller.abort(); await assert.rejects(f.executor.executeActions([modelAction], { signal: controller.signal }), /cancelled/);
    assert.equal(f.requests.length, 0); assert.equal(f.editor.exportProjectJSON(), before);
    const previousLocation = globalThis.location;
    try {
      globalThis.location = { protocol: 'file:' };
      await assert.rejects(f.executor.executeActions([{ ...modelAction, url: '/private/model.glb' }]), /bundled media/);
      const action = { ...modelAction, url: '/models/model.glb' }, pending = f.executor.executeActions([action]);
      assert.equal(f.requests[0].url, './models/model.glb'); f.requests[0].callback(null, f.model()); await pending;
      assert.equal(action.url, '/models/model.glb'); assert.equal(f.app.root.findByName('Loaded')._modelUrl, './models/model.glb');
    } finally { globalThis.location = previousLocation; }
  } finally { f.dispose(); }
});

test('a cancelled old callback cannot overwrite a later batch using the same texture URL', async () => {
  const f = fixture();
  try {
    const node = surface(f.editor), action = { action: 'create_material', target: 'Surface', diffuseMapUrl: './same.png' };
    const old = f.executor.executeActions([action]); f.executor.cancelPending(); await assert.rejects(old, /cancelled/);
    const next = f.executor.executeActions([action]), nextMap = f.texture(); f.requests[1].callback(null, nextMap); await next;
    f.requests[0].callback(null, f.texture()); assert.equal(node.render.material.diffuseMap, nextMap.resource);
  } finally { f.dispose(); }
});


test('abort during checkpoint or on the final ready notification still prevents commit', async () => {
  for (const phase of ['checkpoint', 'ready']) {
    const f = fixture(), controller = new AbortController();
    try {
      const before = f.editor.exportProjectJSON(); let release;
      if (phase === 'checkpoint') f.editor.persistence = { protectBeforeReplace: () => new Promise(resolve => { release = resolve; }) };
      else f.editor.events.on('ai:resources:state', report => { if (report.status === 'ready') controller.abort(); });
      const pending = f.executor.executeActions([modelAction], { signal: controller.signal });
      if (phase === 'checkpoint') { controller.abort(); release(true); }
      else f.requests[0].callback(null, f.model());
      await assert.rejects(pending, /cancelled/);
      assert.equal(f.editor.exportProjectJSON(), before); assert.equal(f.counts().instances, 0); assert.equal(f.executor.activeOperation, null);
    } finally { f.dispose(); }
  }
});
