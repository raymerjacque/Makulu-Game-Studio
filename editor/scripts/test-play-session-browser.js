import { createServer } from 'vite';
import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const profile = await mkdtemp(path.join(os.tmpdir(), 'studio-play-browser-'));
let reportResult;
const reportPromise = new Promise(resolve => { reportResult = resolve; });
const page = `<!doctype html><html><head><title>Play restoration fixture</title></head><body>
<div id="toolbar"></div><div id="viewport-container" style="position:relative;width:640px;height:480px"><canvas id="canvas" tabindex="0"></canvas></div>
<script type="module">
import { Editor } from '/src/core/editor.js';
import { BehaviorManager } from '/src/core/behaviors.js';
import { EngineRuntime } from '/src/engine/pc-app.js';
import { initializeEditorPhysics } from '/src/compiler/runtime-bundle.js';
import { TopBar } from '/src/ui/topbar.js';
let checks = 0, report;
const check = (value, message) => { if (!value) throw new Error(message); checks++; };
try {
  await initializeEditorPhysics();
  const editor = new Editor(); new BehaviorManager(editor);
  const runtime = new EngineRuntime(document.querySelector('canvas'), editor); editor.setRuntime(runtime);
  new TopBar(document.getElementById('toolbar'), editor, null);
  const player = editor.createEntity({ name: 'Player', transform: { position: [0, 5, 0] }, components: [
    { type: 'render', properties: { type: 'sphere' } }, { type: 'collision', properties: { type: 'sphere', radius: 0.5 } }, { type: 'rigidbody', properties: { type: 'dynamic', mass: 1 } }
  ] });
  editor.behaviors.attachBehavior(player, 'health', { maxHp: 100 });
  const duck = await editor.loadModel('/models/Duck.glb', { name: 'Duck' });
  const mesh = duck.findComponents('render')[0].meshInstances[0].mesh;
  editor.selection.set(player);
  const original = editor.exportProjectJSON(), undoCount = editor.commandBus.undoStack.length;
  const button = document.getElementById('btn-play-sim');
  for (let run = 0; run < 2; run++) {
    button.click();
    check(editor.isPlaying && document.getElementById('play-text').textContent === 'Stop', 'Play button did not start session');
    const preview = runtime.app.root.findByName('Player');
    check(preview !== player && preview.getPosition().y === 5, 'Play did not start with disposable original-state body');
    check(runtime.app.root.findByName('Duck') !== duck, 'Loaded GLB was not copied');
    for (let i = 0; i < 30; i++) runtime.app.systems.rigidbody.onUpdate(1 / 60);
    check(preview.getPosition().y < 4.5 && player.getPosition().y === 5, 'Real physics changed original or did not advance copy');
    editor.behaviors.getBehaviors(preview)[0].params.currentHp = 0;
    editor.hudConfig.score.initial = 99;
    editor.createEntity({ name: 'RuntimeSpawn' }); preview.destroy();
    button.click();
    check(!editor.isPlaying && document.getElementById('play-text').textContent === 'Play', 'Stop button did not return to editing');
    const after = editor.exportProjectJSON();
    if (after !== original) {
      const differences = [];
      const compare = (a, b, path = '') => {
        if (JSON.stringify(a) === JSON.stringify(b)) return;
        if (a && b && typeof a === 'object' && typeof b === 'object') for (const key of new Set([...Object.keys(a), ...Object.keys(b)])) compare(a[key], b[key], path + '/' + key);
        else if (differences.length < 15) differences.push({ path, before: a, after: b });
      };
      compare(JSON.parse(original), JSON.parse(after)); throw new Error(JSON.stringify(differences));
    }
    check(after === original && editor.selection.getActive() === player && editor.commandBus.undoStack.length === undoCount, 'Editing state, selection or history changed');
    check(duck.findComponents('render')[0].meshInstances[0].mesh === mesh && mesh.vertexBuffer.numVertices > 0, 'Preview teardown damaged original GLB');
  }
  runtime.app.destroy(); report = { ok: true, checks };
} catch (error) { report = { ok: false, checks, error: error.message, stack: error.stack }; }
await fetch('/__play-result', { method: 'POST', body: JSON.stringify(report) });
</script></body></html>`;
const server = await createServer({ root: fileURLToPath(new URL('../', import.meta.url)), configFile: fileURLToPath(new URL('../vite.config.js', import.meta.url)), server: { host: '127.0.0.1', port: 0, open: false }, plugins: [{ name: 'play-session-browser-fixture', configureServer(server) {
  server.middlewares.use((request, response, next) => {
    if (request.url === '/__play-fixture') { response.setHeader('Content-Type', 'text/html'); response.end(page); }
    else if (request.url === '/__play-result' && request.method === 'POST') {
      let body = ''; request.on('data', chunk => { body += chunk; }); request.on('end', () => { try { reportResult(JSON.parse(body)); } catch { reportResult({ ok: false, error: 'Invalid browser report' }); } response.end('ok'); });
    } else next();
  });
} }] });
let child, timeout;
try {
  await server.listen();
  const port = server.httpServer.address().port;
  child = spawn(process.env.CHROME_BIN || 'google-chrome', ['--headless', '--no-sandbox', '--enable-unsafe-swiftshader', '--use-gl=angle', '--use-angle=swiftshader', '--disable-gpu-sandbox', '--disable-background-networking', '--disable-sync', '--no-first-run', '--autoplay-policy=no-user-gesture-required', `--user-data-dir=${profile}`, `http://127.0.0.1:${port}/__play-fixture`], { stdio: 'ignore' });
  child.on('error', () => reportResult({ ok: false, error: 'Headless browser unavailable; set CHROME_BIN.' }));
  const report = await Promise.race([reportPromise, new Promise(resolve => { timeout = setTimeout(() => resolve({ ok: false, error: 'Play session browser test timed out' }), 45000); })]);
  if (!report.ok) throw new Error(JSON.stringify(report));
  console.log(`Real-browser Play/Stop restoration checks passed: ${report.checks}.`);
} finally {
  clearTimeout(timeout);
  if (child && child.exitCode === null) { const closed = new Promise(resolve => child.once('close', resolve)); child.kill(); await closed; }
  await server.close(); await rm(profile, { recursive: true, force: true });
}
