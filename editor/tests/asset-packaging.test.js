import test from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { AssetPackager } from '../src/project/asset-packager.js';
import { Editor } from '../src/core/editor.js';
import { GameBundler } from '../src/compiler/game-bundler.js';
const decode = url => Uint8Array.from(atob(url.split(',')[1]), c => c.charCodeAt(0));
const jsonOf = url => JSON.parse(new TextDecoder().decode(decode(url)));
const gltf = { asset: { version: '2.0' }, buffers: [{ uri: 'mesh.bin', byteLength: 4 }], images: [{ uri: 'color.png' }] };
function harness(files) {
  const calls = [];
  const fetcher = async (url, options) => {
    calls.push({ url, options });
    const data = files[new URL(url).pathname];
    return data === undefined ? new Response('missing', { status: 404 }) : new Response(data, { headers: { 'content-type': url.includes('.gltf') ? 'model/gltf+json' : 'application/octet-stream' } });
  };
  return { calls, packager: new AssetPackager({ baseUrl: 'https://studio.test/editor/', fetcher, crypto: webcrypto }) };
}

test('all project scenes, declared library resources, prefab material maps and model dependencies are embedded without mutating the editor', async () => {
  const editor = new Editor();
  editor.createEntity({ name: 'Model' })._modelUrl = './model.gltf'; editor.switchScene('Other'); editor.createEntity({ name: 'OtherModel' })._modelUrl = './model.gltf';
  editor.projectAssets = [{ id: 'sound', name: 'Sound', type: 'audio', url: './sound.wav', license: 'CC0-1.0', author: 'Synthetic fixture' }];
  editor.prefabs.prefabs.set('prefab', { entityData: { name: 'Material', components: [{ type: 'render', material: { diffuseMapUrl: './color.png' } }] } });
  const source = editor.exportProjectJSON();
  const { packager, calls } = harness({ '/editor/model.gltf': JSON.stringify(gltf), '/editor/mesh.bin': new Uint8Array([1, 2, 3, 4]), '/editor/color.png': new Uint8Array([137, 80, 78, 71]), '/editor/sound.wav': 'RIFF' });
  const result = await packager.packageProject(source);
  assert.equal(editor.exportProjectJSON(), source);
  assert.equal(result.project.scenes.length, 2);
  const url = result.project.scenes[0].data.root.children[0].modelUrl;
  assert.ok(url.startsWith('data:model/gltf+json;base64,')); assert.equal(result.project.scenes[1].data.root.children[0].modelUrl, url);
  const embedded = jsonOf(url); assert.ok(embedded.buffers[0].uri.startsWith('data:')); assert.ok(embedded.images[0].uri.startsWith('data:image/png'));
  assert.ok(result.project.prefabs[0].data.entityData.components[0].material.diffuseMapUrl.startsWith('data:'));
  assert.equal(result.project.assets[0].license, 'CC0-1.0'); assert.equal(calls.length, 4);
  assert.ok(calls.every(call => call.options.credentials === 'omit' && call.options.redirect === 'error'));
  assert.equal(result.manifest.engineIncluded, false); assert.ok(result.manifest.entries.every(entry => entry.sha256.length === 64));
  assert.equal(new Editor().loadProjectJSON(result.json), true, 'Project data remains importable without fetching during validation');
});

test('real bundled GLB preserves its binary chunk while producing an independently embedded model', async () => {
  const bytes = new Uint8Array(await fs.readFile(new URL('../public/models/Duck.glb', import.meta.url)));
  const { packager } = harness({ '/editor/Duck.glb': bytes });
  const packed = await packager.asset('./Duck.glb', 'model'); const result = decode(packed);
  const original = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength), view = new DataView(result.buffer);
  assert.equal(view.getUint32(0, true), 0x46546c67); assert.equal(view.getUint32(8, true), result.length);
  const oldJSONLength = original.getUint32(12, true), newJSONLength = view.getUint32(12, true);
  assert.deepEqual(result.slice(20 + newJSONLength), bytes.slice(20 + oldJSONLength));
});

test('missing, cyclic, oversized, unsupported decoder and unresolved embedded-model dependencies fail visibly', async () => {
  const scene = { root: { children: [{ name: 'Model', modelUrl: './bad.gltf' }] } };
  const cases = [undefined, JSON.stringify({ ...gltf, buffers: [{ uri: 'bad.gltf' }] }), JSON.stringify({ asset: { version: '2.0' }, extensionsUsed: ['KHR_draco_mesh_compression'] })];
  for (const data of cases) {
    const { packager } = harness({ '/editor/bad.gltf': data }); await assert.rejects(packager.packageScene(scene));
  }
  const { packager } = harness({ '/editor/large.png': new Uint8Array(10) }); packager.maxFileBytes = 4;
  await assert.rejects(packager.asset('./large.png'), /packaged|size/);
  const embedded = `data:model/gltf+json;base64,${btoa(JSON.stringify(gltf))}`;
  await assert.rejects(new AssetPackager({ crypto: webcrypto }).asset(embedded, 'model'), /unresolved external dependencies/);
});

test('unsupported URL schemes, URL credentials and raw provider settings are not fetched or included in manifests', async () => {
  const { packager, calls } = harness({ '/editor/model.gltf': JSON.stringify({ asset: { version: '2.0' } }) });
  for (const url of ['javascript:alert(1)', 'ftp://studio.test/model.glb', 'https://user:password@studio.test/model.glb']) await assert.rejects(packager.asset(url, 'model'));
  assert.equal(calls.length, 0);
  await packager.asset('./model.gltf?token=test-only-query', 'model');
  assert.ok(!JSON.stringify([...packager.entries.values()]).includes('test-only-query'));
});

test('already packaged scene assets can be repackaged with network access disabled', async () => {
  const { packager } = harness({ '/editor/model.gltf': JSON.stringify({ asset: { version: '2.0' } }) });
  const first = await packager.packageScene({ root: { children: [{ name: 'Model', modelUrl: './model.gltf' }] } });
  const offline = new AssetPackager({ crypto: webcrypto, fetcher: () => { throw new Error('network prohibited'); } });
  const second = await offline.packageScene(first.scene); assert.deepEqual(second.scene, first.scene);
});

test('generated game data cannot terminate its script tag and preserves source text exactly', () => {
  const editor = new Editor(); const hostile = '</script><img src=x onerror=alert(1)>';
  editor.projectName = hostile; editor.scripts.set('source.js', `/* ${hostile} */`);
  const html = new GameBundler(editor).compileStandaloneHTML({ embeddedAssets: [] });
  const data = html.match(/const SCENE_DATA = (.*);/)[1]; assert.ok(!data.includes('</script>'));
  assert.equal(vm.runInNewContext(`(${data})`).scripts['source.js'], `/* ${hostile} */`);
});

test('desktop bundled-media reader rejects traversal, symlink escapes, unsupported files and remote URLs', async () => {
  const { readBundledAsset } = createRequire(import.meta.url)('../bundled-assets.cjs');
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'studio-bundle-test-'));
  try {
    const media = path.join(root, 'media'); await fs.mkdir(media);
    const asset = path.join(media, 'fixture.bin'), outside = path.join(root, 'private.bin');
    await fs.writeFile(asset, new Uint8Array([1, 2, 3])); await fs.writeFile(outside, 'test-only-private');
    assert.deepEqual([...(await readBundledAsset(media, pathToFileURL(asset).href)).bytes], [1, 2, 3]);
    await assert.rejects(readBundledAsset(media, pathToFileURL(outside).href));
    await fs.symlink(outside, path.join(media, 'escape.bin')); await assert.rejects(readBundledAsset(media, pathToFileURL(path.join(media, 'escape.bin')).href));
    await fs.writeFile(path.join(media, 'script.js'), 'test'); await assert.rejects(readBundledAsset(media, pathToFileURL(path.join(media, 'script.js')).href));
    await assert.rejects(readBundledAsset(media, 'https://studio.test/fixture.bin'));
  } finally { await fs.rm(root, { recursive: true, force: true }); }
});

test('asset timeouts and total byte budgets fail without altering source scene data', async () => {
  const source = { root: { children: [{ name: 'Model', modelUrl: './model.gltf' }] } }, original = JSON.stringify(source);
  const packager = new AssetPackager({ baseUrl: 'https://studio.test/', crypto: webcrypto, timeoutMs: 10,
    fetcher: (url, options) => new Promise((resolve, reject) => options.signal.addEventListener('abort', () => reject(new Error('aborted')), { once: true })) });
  await assert.rejects(packager.packageScene(source), /could not be packaged/); assert.equal(JSON.stringify(source), original);
  const { packager: limited } = harness({ '/editor/one.png': '1234', '/editor/two.png': '5678' }); limited.maxTotalBytes = 6;
  await limited.asset('./one.png'); await assert.rejects(limited.asset('./two.png'), /budget exceeded/);
});

test('desktop asset IPC refuses untrusted senders before calling the filesystem reader', async () => {
  const source = await fs.readFile(new URL('../electron.cjs', import.meta.url), 'utf8');
  const handlers = new Map(); let reads = 0;
  const nodeRequire = createRequire(import.meta.url);
  vm.runInNewContext(source, { __dirname: '/synthetic/studio', process: { env: {} }, console,
    require(name) {
      if (name === 'electron') return { app: { commandLine: { appendSwitch() {} }, whenReady: () => ({ then() {} }), on() {} }, ipcMain: { handle: (id, handler) => handlers.set(id, handler) } };
      if (name === './bundled-assets.cjs') return { readBundledAsset: async () => { reads++; return {}; } };
      if (name === './desktop-security.cjs') return nodeRequire('../desktop-security.cjs');
      return nodeRequire(name);
    } });
  assert.equal(await handlers.get('read-bundled-asset')({ sender: {} }, 'file:///private/file.bin'), null);
  assert.equal(reads, 0);
});
