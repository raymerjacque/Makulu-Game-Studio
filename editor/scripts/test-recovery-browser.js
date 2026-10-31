import http from 'node:http';
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

// Isolated synthetic-data browser check; never uses an existing browser profile.
const browser = process.env.CHROME_BIN || 'google-chrome';
const profile = await mkdtemp(path.join(os.tmpdir(), 'studio-recovery-test-'));
const heightmapSource = await readFile(new URL('../src/engine/heightmap-reader.js', import.meta.url), 'utf8');
const packageModules = new Map(await Promise.all([['/asset-packager.js', '../src/project/asset-packager.js'], ['/project-document.js', '../src/project/project-document.js'], ['/engine/terrain-data.js', '../src/engine/terrain-data.js'], ['/engine/sound-data.js', '../src/engine/sound-data.js']].map(async ([url, file]) => [url, await readFile(new URL(file, import.meta.url), 'utf8')])));
const source = await readFile(new URL('../src/project/recovery-store.js', import.meta.url), 'utf8');
let resolveReport;
const reportPromise = new Promise(resolve => { resolveReport = resolve; });
const page = `<!doctype html><meta charset="utf-8"><title>Recovery storage regression</title><script type="module">
import { RecoveryStore } from '/recovery-store.js';
import { readHeightmap } from '/heightmap-reader.js';
import { AssetPackager } from '/asset-packager.js';
let checks = 0;
const check = (condition, message) => { if (!condition) throw new Error(message); checks++; };
const name = 'studio-recovery-regression-' + crypto.randomUUID();
const store = new RecoveryStore({ databaseName: name, perProject: 2, total: 3 });
const second = new RecoveryStore({ databaseName: name, perProject: 2, total: 3 });
const row = (id, projectId = 'A') => ({ id: String(id), projectId, name: 'Synthetic fixture', createdAt: id, json: '{"fixture":true}' });
let report;
try {
  check((await store.list()).length === 0, 'New history must be empty');
  for (let i = 1; i <= 3; i++) await store.save(row(i));
  check((await store.list()).map(r => r.id).join() === '3,2', 'Per-project retention failed');
  check((await second.list()).map(r => r.id).join() === '3,2', 'History did not persist across connections');
  await store.save(row(4, 'B')); await store.save(row(5, 'B'));
  check((await store.list()).map(r => r.id).join() === '5,4,3', 'Global retention failed');
  let failed = false;
  try { await store.save({ ...row(6, 'B'), cannotClone: () => {} }); } catch { failed = true; }
  check(failed, 'Uncloneable write must fail');
  check((await store.list()).map(r => r.id).join() === '5,4,3', 'Aborted write lost prior snapshots');
  await store.delete('5');
  check((await store.list()).map(r => r.id).join() === '4,3', 'Snapshot deletion failed');
  const canvas = document.createElement('canvas'); canvas.width = 2; canvas.height = 2;
  const context = canvas.getContext('2d');
  context.putImageData(new ImageData(new Uint8ClampedArray([0,0,0,255, 255,255,255,255, 128,128,128,255, 255,255,255,0]), 2, 2), 0, 0);
  const png = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
  const heights = await readHeightmap(png, 1);
  check(heights[0][0] === 0 && heights[0][1] === 1 && Math.abs(heights[1][0] - 128/255) < 0.00001 && heights[1][1] === 0, 'Heightmap PNG pixels were not decoded correctly');
  let imageFailed = false; try { await readHeightmap(new Blob(['invalid image']), 1); } catch { imageFailed = true; }
  check(imageFailed, 'Invalid heightmap must fail');
  let resolutionFailed = false; try { await readHeightmap(png, 1000000); } catch { resolutionFailed = true; }
  check(resolutionFailed, 'Invalid heightmap resolution must fail');
  const packaged = await new AssetPackager({ baseUrl: location.href }).packageScene({ root: { children: [{ name: 'Model', modelUrl: './fixture.gltf' }] } });
  const modelUri = packaged.scene.root.children[0].modelUrl;
  const model = JSON.parse(atob(modelUri.split(',')[1]));
  check(modelUri.startsWith('data:') && model.buffers[0].uri.startsWith('data:') && model.images[0].uri.startsWith('data:'), 'Nested model dependencies were not embedded');
  const offline = new AssetPackager({ fetcher: () => { throw new Error('Network prohibited'); } });
  check(JSON.stringify((await offline.packageScene(packaged.scene)).scene) === JSON.stringify(packaged.scene), 'Embedded assets still require network');
  check(packaged.manifest.entries.every(entry => entry.sha256.length === 64), 'Asset integrity hashes missing');
  report = { ok: true, checks };
} catch (error) { report = { ok: false, checks, error: error.message }; }
finally {
  (await store.open()).close(); (await second.open()).close();
  await new Promise(resolve => { const request = indexedDB.deleteDatabase(name); request.onsuccess = request.onerror = request.onblocked = resolve; });
}
await fetch('/result', { method: 'POST', body: JSON.stringify(report) });
</script>`;
const server = http.createServer((request, response) => {
  if (packageModules.has(request.url)) { response.setHeader('Content-Type', 'text/javascript'); response.end(packageModules.get(request.url)); }
  else if (request.url === '/fixture.gltf') { response.setHeader('Content-Type', 'model/gltf+json'); response.end(JSON.stringify({ asset: { version: '2.0' }, buffers: [{ uri: './fixture.bin', byteLength: 4 }], images: [{ uri: './fixture.png' }] })); }
  else if (request.url === '/fixture.bin') { response.end(Buffer.from([1, 2, 3, 4])); }
  else if (request.url === '/fixture.png') { response.setHeader('Content-Type', 'image/png'); response.end(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jQmcAAAAASUVORK5CYII=', 'base64')); }
  else if (request.url === '/heightmap-reader.js') { response.setHeader('Content-Type', 'text/javascript'); response.end(heightmapSource); }
  else if (request.url === '/recovery-store.js') { response.setHeader('Content-Type', 'text/javascript'); response.end(source); }
  else if (request.url === '/result' && request.method === 'POST') {
    let body = ''; request.on('data', chunk => { body += chunk; }); request.on('end', () => {
      try { resolveReport(JSON.parse(body)); } catch { resolveReport({ ok: false, error: 'Invalid browser result' }); }
      response.end('ok');
    });
  } else { response.setHeader('Content-Type', 'text/html'); response.end(page); }
});
let child, timeout;
try {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  child = spawn(browser, ['--headless', '--no-sandbox', '--disable-gpu', '--disable-background-networking', '--disable-sync', '--no-first-run', `--user-data-dir=${profile}`, `http://127.0.0.1:${server.address().port}/`], { stdio: 'ignore' });
  child.on('error', () => resolveReport({ ok: false, error: 'Headless browser unavailable; set CHROME_BIN.' }));
  const report = await Promise.race([reportPromise, new Promise(resolve => { timeout = setTimeout(() => resolve({ ok: false, error: 'Browser storage test timed out' }), 20000); })]);
  if (!report.ok) throw new Error(report.error);
  console.log(`Real-browser storage, heightmap and packaging checks passed: ${report.checks}.`);
} finally {
  clearTimeout(timeout);
  if (child && child.exitCode === null) {
    const closed = new Promise(resolve => child.once('close', resolve)); child.kill(); await closed;
  }
  await new Promise(resolve => server.close(resolve));
  await rm(profile, { recursive: true, force: true });
}
