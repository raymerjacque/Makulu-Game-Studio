import { createServer } from 'vite';
import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const profile = await mkdtemp(path.join(os.tmpdir(), 'studio-play-browser-'));
let reportResult;
const reportPromise = new Promise(resolve => { reportResult = resolve; });
const probe = "(async () => {\n  setInterval(() => parent.postMessage({ fixture: 'heartbeat' }, '*'), 50);\n  const send = data => parent.postMessage({ fixture: 'isolation-probe', ...data }, '*');\n  let parentBlocked = false, storageBlocked = false;\n  try { parent.document.body.dataset.untrustedWrite = 'bad'; } catch { parentBlocked = true; }\n  try { localStorage.getItem('fixture-only'); } catch { storageBlocked = true; }\n  let networkBlocked = false;\n  try { await fetch('https://example.com/preview-fixture'); } catch { networkBlocked = true; }\n  const timer = setInterval(() => {\n    if (window.__makuluRuntimeStatus?.state !== 'running') return;\n    clearInterval(timer);\n    const app = window.__fixtureApp, node = app.root.findByName('InputProbe'), before = node.getPosition().clone();\n    dispatchEvent(new KeyboardEvent('keydown', { key: 'w' })); app.fire('update', 0.1);\n    const moved = node.getPosition().clone(); dispatchEvent(new Event('blur')); app.fire('update', 0.1);\n    send({ parentBlocked, storageBlocked, networkBlocked, bridgeAbsent: typeof window.makuluDesktop === 'undefined', inputMoved: moved.distance(before) > 0.1, blurCleared: node.getPosition().distance(moved) < 0.0001, cameraName: window.__makuluRuntimeStatus.cameraName, resourceCount: window.__makuluRuntimeStatus.resourceCount, startPosition: before.toArray() });\n  }, 100);\n})();";
const page = `<!doctype html><html><head><title>Play restoration fixture</title></head><body>
<div id="toolbar"></div><div id="viewport-container" style="position:relative;width:640px;height:480px"><canvas id="canvas" tabindex="0"></canvas></div>
<script type="module">
import { Editor } from '/src/core/editor.js';
import { BehaviorManager } from '/src/core/behaviors.js';
import { EngineRuntime } from '/src/engine/pc-app.js';
import { initializeEditorPhysics } from '/src/compiler/runtime-bundle.js';
import { TopBar } from '/src/ui/topbar.js';
import { ModelResizerOverlay } from '/src/ui/model-resizer-overlay.js';
import { TerrainModal } from '/src/ui/terrain-modal.js';
import { prepareGame } from '/src/runtime/prepare-game.js';
let checks = 0, report;
const check = (value, message) => { if (!value) throw new Error(message); checks++; };
try {
  await initializeEditorPhysics();
  const editor = new Editor(); new BehaviorManager(editor);
  const runtime = new EngineRuntime(document.querySelector('canvas'), editor); editor.setRuntime(runtime);
  const topbar = new TopBar(document.getElementById('toolbar'), editor, null);
  const player = editor.createEntity({ name: 'Player', transform: { position: [0, 5, 0] }, components: [
    { type: 'render', properties: { type: 'sphere' } }, { type: 'collision', properties: { type: 'sphere', radius: 0.5 } }, { type: 'rigidbody', properties: { type: 'dynamic', mass: 1 } }
  ] });
  editor.behaviors.attachBehavior(player, 'health', { maxHp: 100 });
  const duck = await editor.loadModel('/models/Duck.glb', { name: 'Duck' });
  const mesh = duck.findComponents('render')[0].meshInstances[0].mesh;
  editor.selection.set(player);
  editor.createEntity({ name: 'DisabledCamera', components: [{ type: 'camera', properties: { enabled: false } }] });
  editor.createEntity({ name: 'MainGameCamera', transform: { position: [0, 3, 7] }, components: [{ type: 'camera' }] });
  const inputProbe = editor.createEntity({ name: 'InputProbe', transform: { position: [0, 0, 0] } });
  editor.behaviors.attachBehavior(inputProbe, 'wasd', { speed: 4 });
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
  const preview = topbar.gamePreview;
  preview.prepare = async source => {
    let html = await prepareGame(source);
    html = html.replace('<head>', '<head><script>addEventListener("error", e => parent.postMessage({fixture: "diagnostic", message: e.error?.stack || e.message}, "*"));<' + '/script>');
    html = html.replace('})().catch(() => {', '})().catch(startupError => { parent.postMessage({fixture: "diagnostic", message: String(startupError)}, "*");');
    html = html.replace('    app.start();', '    window.__fixtureApp = app; app.start();');
    return html.replace('</body>', '<script>' + ${JSON.stringify(probe)} + '<' + '/script></body>');
  };
  let probeResult, parentKeys = 0, diagnostic = "", heartbeats = 0;
  const gameWindows = new Set();
  window.addEventListener('message', event => { if (event.data?.fixture === 'diagnostic') diagnostic = event.data.message; });
  const receive = event => {
    if (gameWindows.has(event.source) && event.data?.fixture === 'heartbeat') heartbeats++;
    if (event.source === preview.frame?.contentWindow && event.data?.fixture === 'isolation-probe') { probeResult = event.data; gameWindows.add(event.source); }
  };
  window.addEventListener('message', receive);
  window.addEventListener('keydown', () => parentKeys++);
  const wait = async condition => { const end = performance.now() + 20000; while (!condition()) { if (preview.status?.getAttribute('role') === 'alert') { await new Promise(resolve => setTimeout(resolve, 100)); throw new Error(preview.status.textContent + ' ' + diagnostic); } if (performance.now() > end) throw new Error('Preview fixture timed out: ' + preview.status?.textContent + ' ' + diagnostic); await new Promise(resolve => setTimeout(resolve, 50)); } };
  document.getElementById('btn-game-preview').click();
  for (let run = 0; run < 2; run++) {
    await wait(() => probeResult && preview.status.textContent.startsWith('Playing'));
    check(preview.status.textContent.startsWith('Playing'), 'Preview did not reach running status');
    check(preview.frame.getAttribute('sandbox') === 'allow-scripts allow-pointer-lock' && preview.frame.contentDocument === null, 'Preview frame is not origin-isolated');
    check(probeResult.parentBlocked && probeResult.storageBlocked && probeResult.bridgeAbsent && probeResult.networkBlocked, 'Preview accessed parent, storage, desktop bridge or external network');
    check(probeResult.inputMoved && probeResult.blurCleared && parentKeys === 0, 'Game input/blur handling or input ownership failed');
    check(probeResult.cameraName === 'MainGameCamera' && probeResult.resourceCount >= 1, 'Game camera selection or model readiness failed');
    check(JSON.stringify(probeResult.startPosition) === '[0,0,0]', 'Restart did not reset game state');
    check(editor.exportProjectJSON() === original && editor.selection.getActive() === player, 'Preview changed the editable project');
    if (run === 0) { const oldFrame = preview.frame; probeResult = null; preview.restartButton.click(); check(!oldFrame.isConnected, 'Restart retained the old frame'); }
  }
  const oldFrame = preview.frame; preview.closeButton.click();
  check(!preview.dialog && !oldFrame.isConnected && !document.querySelector('iframe'), 'Close retained the preview runtime');
  await new Promise(resolve => setTimeout(resolve, 150)); const closedHeartbeat = heartbeats;
  await new Promise(resolve => setTimeout(resolve, 250));
  check(heartbeats === closedHeartbeat, 'Closed runtime continued sending heartbeats');
  let finishPreparation;
  preview.prepare = () => new Promise(resolve => { finishPreparation = resolve; });
  const opening = preview.open(); preview.close(); finishPreparation('<html><head></head><body></body></html>'); await opening;
  check(!preview.dialog && !preview.frame, 'Late preparation reopened a closed preview');
  preview.prepare = async () => { throw new Error('fixture preparation failure'); };
  await preview.open(); check(preview.status.getAttribute('role') === 'alert' && !preview.frame, 'Preparation failure was reported as running'); preview.close();
  preview.prepare = async () => '<html><head></head><body><script>window.__makuluRuntimeStatus={state: "error"};<' + '/script></body></html>';
  await preview.open(); await wait(() => preview.status.getAttribute('role') === 'alert' && !preview.frame);
  check(!preview.frame, 'Failed game runtime was not removed'); preview.close();
  preview.timeoutMs = 100; preview.prepare = async () => '<html><head></head><body>No startup signal</body></html>';
  await preview.open(); await wait(() => preview.status.getAttribute('role') === 'alert' && !preview.frame);
  check(preview.status.textContent.includes('timed out'), 'Hung runtime did not time out'); preview.close();
  check(editor.exportProjectJSON() === original, 'Failure/cancellation changed the editing project');
  window.removeEventListener('message', receive);
  check(!document.body.dataset.untrustedWrite, 'Untrusted code changed parent document');
  const resizer = new ModelResizerOverlay(document.getElementById('viewport-container'), editor);
  const terrainModal = new TerrainModal(editor); terrainModal.open();
  terrainModal.modal.querySelector('#terrain-size').value = '40';
  terrainModal.modal.querySelector('#terrain-subdivs').value = '32';
  terrainModal.modal.querySelector('#terrain-height').value = '8';
  terrainModal.modal.querySelector('#terrain-seed').value = '1234';
  terrainModal.modal.querySelector('#terrain-btn-generate').click();
  const terrain = runtime.app.root.findByName('Procedural Terrain');
  check(Boolean(terrain), 'Terrain dialog failed to place mesh: ' + document.getElementById('toast-container')?.textContent);
  check(terrain.render.meshInstances[0].mesh.vertexBuffer.numVertices === 1089 && terrain._terrainData.heights.length === 33, 'Terrain is a primitive block instead of the requested height grid');
  const bounds = resizer.getModelBounds(terrain);
  check(Math.abs(bounds.halfExtents.x * 2 - 40) < 0.001 && Math.abs(bounds.halfExtents.z * 2 - 40) < 0.001 && bounds.halfExtents.y > 0.1, 'Terrain bounds do not show a full elevated surface');
  check(terrain.collision.type === 'mesh' && terrain.rigidbody.type === 'static' && editor.selection.getActive() === terrain && !terrainModal.isOpen, 'Terrain collision/selection/modal did not finish');
  const collisionHelper = runtime.visualHelpers.helperEntity.findByName('CollisionGizmo');
  check(collisionHelper.render.meshInstances[0].mesh === terrain.render.meshInstances[0].mesh && collisionHelper.render.meshInstances[0].renderStyle === 1, 'Terrain collision helper substituted a solid block');
  check(runtime.editorCamera.distance >= 60, 'Camera did not frame the full terrain');
  editor.commandBus.undo(); check(!terrain.parent, 'Terrain undo did not remove the mesh');
  editor.commandBus.redo(); check(terrain.parent === runtime.app.root && resizer.getModelBounds(terrain).halfExtents.x > 19, 'Terrain redo did not restore the full mesh');
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
  console.log(`Real-browser Play/Stop and isolated game-preview checks passed: ${report.checks}.`);
} finally {
  clearTimeout(timeout);
  if (child && child.exitCode === null) { const closed = new Promise(resolve => child.once('close', resolve)); child.kill(); await closed; }
  await server.close(); await rm(profile, { recursive: true, force: true });
}
