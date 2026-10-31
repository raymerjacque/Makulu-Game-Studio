import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { spawn } from 'node:child_process';
import { webcrypto } from 'node:crypto';
import { Editor } from '../src/core/editor.js';
import { GameBundler } from '../src/compiler/game-bundler.js';
import { AssetPackager } from '../src/project/asset-packager.js';
import { exportRuntimeAssets } from '../build-support/runtime-assets.js';
import { loadExportRuntimes, EXPORT_RUNTIME } from '../src/compiler/runtime-bundle.js';

const root = await fs.mkdtemp(path.join(os.tmpdir(), 'studio-offline-game-'));
const profile = path.join(root, 'profile'), output = path.join(root, 'moved-game.html');
let browser;
try {
  const assets = exportRuntimeAssets();
  const runtimeBundle = await loadExportRuntimes({ crypto: webcrypto, readText: file => assets.get(`runtime/${file}`).toString('utf8') });
  const editor = new Editor(); editor.projectName = 'Offline fixture';
  editor.createEntity({ name: 'Ground', transform: { position: [0, -0.5, 0], scale: [20, 1, 20] }, components: [
    { type: 'render', properties: { type: 'box' } }, { type: 'collision', properties: { type: 'box' } }, { type: 'rigidbody', properties: { type: 'static', friction: 0.8, restitution: 0 } }
  ] });
  editor.createEntity({ name: 'Ball', transform: { position: [0, 3, 0] }, components: [
    { type: 'render', properties: { type: 'sphere' } }, { type: 'collision', properties: { type: 'sphere', radius: 0.5 } }, { type: 'rigidbody', properties: { type: 'dynamic', mass: 1, friction: 0.5, restitution: 0 } }
  ] });
  editor.createEntity({ name: 'Sun', components: [{ type: 'light', properties: { type: 'directional', color: { r: 1, g: 1, b: 1 }, intensity: 1 } }] });
  editor.createEntity({ name: 'Duck', transform: { position: [2, 0, 0] } })._modelUrl = './Duck.glb';
  const duck = await fs.readFile(new URL('../public/models/Duck.glb', import.meta.url));
  const packager = new AssetPackager({ baseUrl: 'https://synthetic.invalid/', crypto: webcrypto, fetcher: async () => new Response(duck, { headers: { 'content-type': 'model/gltf-binary' } }) });
  const packaged = await packager.packageScene(JSON.parse(editor.exportSceneJSON()));
  let html = new GameBundler(editor).compileStandaloneHTML({ runtimeBundle, sceneData: packaged.scene, embeddedAssets: [], assetManifest: packaged.manifest });
  if (/<script\b[^>]*\bsrc=/i.test(html)) throw new Error('Export contains runtime script URLs.');
  // Instrument the generated artifact only to observe the real app; its startup/runtime logic is unchanged.
  if (!html.includes('    app.start();')) throw new Error('Fixture hook no longer matches the export.');
  html = html.replace('    app.start();', '    window.__fixtureApp = app; app.start();');
  html = html.replace('<head>', `<head><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline' 'unsafe-eval' data: blob:; style-src 'unsafe-inline'; connect-src data: blob:; img-src data: blob:; media-src data: blob:; worker-src blob:">`);
  const checks = `<script>
    const started = performance.now();
    const finish = (ok, detail) => {
      document.body.setAttribute('data-offline-result', ok ? 'pass' : 'fail');
      const result = document.createElement('pre'); result.id = 'offline-test-result'; result.textContent = JSON.stringify(detail); document.body.appendChild(result);
    };
    const timer = setInterval(() => {
      if (window.__makuluRuntimeStatus?.state === 'error') { clearInterval(timer); finish(false, { error: 'Runtime startup failed' }); return; }
      const app = window.__fixtureApp, model = app?.root.findByName('Duck');
      if (window.__makuluRuntimeStatus?.state === 'running' && model?.findComponents('render').length) {
        clearInterval(timer);
        try {
          app.autoRender = false;
          const ball = app.root.findByName('Ball'); ball.rigidbody.teleport(0, 3, 0); ball.rigidbody.linearVelocity = new pc.Vec3(0, 0, 0);
          for (let i = 0; i < 240; i++) app.systems.rigidbody.onUpdate(1 / 60);
          const y = ball.getPosition().y;
          const result = { engine: pc.version, physics: Boolean(app.systems.rigidbody.physicsWorld), ballY: y, modelRenders: model.findComponents('render').length };
          finish(result.engine === '${EXPORT_RUNTIME.engineVersion}' && result.physics && y > 0.3 && y < 0.8 && result.modelRenders > 0, result);
        } catch (error) { finish(false, { error: 'Physics/model verification failed: ' + error.message }); }
      } else if (performance.now() - started > 8000) { clearInterval(timer); finish(false, { error: 'Runtime or embedded model did not become available', state: window.__makuluRuntimeStatus }); }
    }, 50);
  </script>`;
  await fs.writeFile(output, html.replace('</body>', checks + '</body>'));
  browser = spawn(process.env.CHROME_BIN || 'google-chrome', ['--headless', '--no-sandbox', '--enable-unsafe-swiftshader', '--use-gl=angle', '--use-angle=swiftshader', '--disable-gpu-sandbox', '--disable-background-networking', '--disable-sync', '--no-first-run', '--virtual-time-budget=12000', '--dump-dom', `--user-data-dir=${profile}`, pathToFileURL(output).href], { stdio: ['ignore', 'pipe', 'ignore'] });
  let dom = '', timeout;
  browser.stdout.on('data', chunk => { dom += chunk.toString(); });
  const code = await new Promise((resolve, reject) => {
    timeout = setTimeout(() => { browser.kill('SIGKILL'); reject(new Error('Offline browser test timed out')); }, 30000);
    browser.on('error', reject); browser.on('close', resolve);
  }).finally(() => clearTimeout(timeout));
  if (code !== 0 || !/<body\b[^>]*data-offline-result="pass"/.test(dom)) {
    await fs.writeFile('/tmp/studio-offline-export-failure.html', dom);
    const detail = dom.match(/<pre id="offline-test-result">([^<]+)</)?.[1] || 'No runtime result';
    throw new Error(`Moved-file offline export failed: ${detail}`);
  }
  console.log('Moved-file offline game passed: pinned engine, initialized physics, falling-body floor contact, embedded GLB load; network blocked by CSP.');
} finally {
  if (browser && browser.exitCode === null) browser.kill('SIGKILL');
  await fs.rm(root, { recursive: true, force: true });
}
