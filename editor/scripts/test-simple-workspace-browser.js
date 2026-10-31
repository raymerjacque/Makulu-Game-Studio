import { createServer } from 'vite';
import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const profile = await mkdtemp(path.join(os.tmpdir(), 'studio-simple-browser-'));
let reportResult;
const reportPromise = new Promise(resolve => { reportResult = resolve; });
const page = String.raw`<!doctype html><html><head><title>Simple workspace fixture</title>
<link rel="stylesheet" href="/src/styles/theme.css"><link rel="stylesheet" href="/src/styles/layout.css"><link rel="stylesheet" href="/src/styles/components.css"><link rel="stylesheet" href="/src/styles/ai.css"><link rel="stylesheet" href="/src/styles/simple-workspace.css">
</head><body><div id="app-shell"><header id="top-bar"></header><main id="workspace"><aside id="tool-strip"></aside><section id="hierarchy-panel"></section><section id="center-stage"><div id="viewport-container"><canvas id="viewport-canvas" tabindex="0"></canvas></div><section id="assets-panel"></section></section><aside id="inspector-panel"></aside></main></div>
<script type="module">
import { Editor } from '/src/core/editor.js';
import { BehaviorManager } from '/src/core/behaviors.js';
import { EngineRuntime } from '/src/engine/pc-app.js';
import { initializeEditorPhysics } from '/src/compiler/runtime-bundle.js';
import { TopBar } from '/src/ui/topbar.js';
import { AIAssistantUI } from '/src/ui/ai-assistant.js';
import { SimpleWorkspace } from '/src/ui/simple-workspace.js';
import { HierarchyPanel } from '/src/ui/hierarchy.js';
import { ToolStrip } from '/src/ui/toolstrip.js';
import { ProjectPersistence } from '/src/project/project-persistence.js';
import { RecoveryStore } from '/src/project/recovery-store.js';
let checks = 0, report;
const check = (value, message) => { if (!value) throw new Error(message); checks++; };
const wait = async condition => { const end = performance.now() + 20000; while (!condition()) { if (performance.now() > end) throw new Error('Simple workspace timed out'); await new Promise(resolve => setTimeout(resolve, 50)); } };
try {
  await initializeEditorPhysics();
  const editor = new Editor(), ai = new AIAssistantUI(editor); new BehaviorManager(editor);
  const runtime = new EngineRuntime(document.querySelector('canvas'), editor); editor.setRuntime(runtime);
  const topbar = new TopBar(document.getElementById('top-bar'), editor, ai);
  new HierarchyPanel(document.getElementById('hierarchy-panel'), editor); new ToolStrip(document.getElementById('tool-strip'), editor);
  const store = new RecoveryStore({ databaseName: 'simple-fixture-' + crypto.randomUUID() });
  const persistence = new ProjectPersistence(editor, { store, intervalMs: 0 }); await persistence.initialize();
  const simple = new SimpleWorkspace(editor, ai);
  check(simple.active && getComputedStyle(document.getElementById('workspace')).display === 'none' && getComputedStyle(document.getElementById('top-bar')).display === 'none', 'Simple still exposes Pro workspace');
  check(document.documentElement.scrollWidth <= innerWidth && (innerWidth <= 680 ? getComputedStyle(simple.root.querySelector('.simple-content')).display === 'flex' : getComputedStyle(simple.root.querySelector('.simple-content')).display === 'grid'), 'Workspace overflows horizontally or does not adapt to viewport');
  check(ai.panel.parentElement.id === 'simple-chat-host' && getComputedStyle(ai.swarmView.element).display === 'none' && getComputedStyle(ai.panel).position === 'static', 'Chat is not docked or still exposes advanced team controls');
  const entity = editor.createEntity({ name: 'Keep', components: [{ type: 'render', properties: { type: 'box' } }] });
  const before = editor.exportProjectJSON(), selection = editor.selection.getActive(), history = [...editor.commandBus.undoStack];
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete' }));
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'd', ctrlKey: true }));
  check(editor.exportProjectJSON() === before && editor.selection.getActive() === selection, 'Hidden Pro shortcuts changed Simple project');
  const panel = ai.panel; const chat = ai.panel.querySelector('#ai-chat-body'); const draft = ai.panel.querySelector('#ai-text-input'); draft.value = 'Draft survives modes';
  simple.root.querySelector('#simple-pro').click();
  check(!simple.active && editor.mode === 'pro' && getComputedStyle(document.getElementById('workspace')).display !== 'none', 'Pro workspace did not return');
  topbar.container.querySelector('[data-mode="simple"]').click();
  check(simple.active && ai.panel === panel && panel.querySelector('#ai-chat-body') === chat && draft.value === 'Draft survives modes', 'Mode switch recreated chat or lost draft');
  check(editor.exportProjectJSON() === before && editor.selection.getActive() === selection && editor.commandBus.undoStack.length === history.length, 'Mode switch changed project, selection or history');
  simple.root.querySelector('#simple-pro').click(); topbar.container.querySelector('#btn-play-sim').click();
  check(editor.isPlaying, 'Pro simulation did not start'); topbar.container.querySelector('[data-mode="simple"]').click();
  check(!editor.isPlaying && topbar.container.querySelector('#play-text').textContent === 'Play' && editor.exportProjectJSON() === before, 'Simple mode did not stop/restore Pro simulation and its controls');
  const downloads = [], originalCreateURL = URL.createObjectURL.bind(URL);
  URL.createObjectURL = blob => { downloads.push(blob); return originalCreateURL(blob); };
  simple.root.querySelector('[data-file-action="menu-action-export"]').click();
  check(JSON.parse(await downloads.at(-1).text()).format === 'makulu-game-studio-project' && persistence.state.source === 'downloaded', 'Simple Save did not download editable project');
  const saveCount = downloads.length; window.dispatchEvent(new KeyboardEvent('keydown', { key: 's', ctrlKey: true }));
  check(downloads.length === saveCount + 1, 'Simple Ctrl+S did not save exactly one editable project');
  let settings = 0; ai.setSettingsModal({ open() { settings++; } }); simple.root.querySelector('#simple-settings').click(); check(settings === 1, 'AI settings action failed');
  ai.swarmView.isTeamModeActive = false;
  let finishRequest, calls = 0;
  ai.client.sendMessage = async () => { calls++; return new Promise(resolve => { finishRequest = resolve; }); };
  draft.value = 'Create one box'; panel.querySelector('#ai-btn-send').click();
  check(ai.isBusy && draft.disabled && simple.root.querySelector('#simple-refresh').disabled, 'Busy request state does not protect controls');
  await ai.sendUserPrompt('duplicate'); check(calls === 1, 'Concurrent prompt was submitted');
  const ticks = String.fromCharCode(96).repeat(3);
  finishRequest(ticks + 'json:actions\n' + JSON.stringify([{ action: 'spawn_primitive', type: 'box', name: 'FromPrompt' }]) + '\n' + ticks);
  await wait(() => !ai.isBusy);
  check(Boolean(runtime.app.root.findByName('FromPrompt')) && !draft.disabled, 'Prompt action failed or input remained blocked');
  await wait(() => simple.preview.status?.textContent.startsWith('Playing'));
  check(simple.preview.frame.parentElement.parentElement.parentElement.id === 'simple-preview-host' && !document.querySelector('dialog'), 'Simple preview opened a separate modal');
  check(simple.preview.frame.getAttribute('sandbox') === 'allow-scripts allow-pointer-lock' && simple.preview.frame.contentDocument === null, 'Simple preview lost isolation');
  const current = editor.exportProjectJSON(); simple.preview.restartButton.click();
  await wait(() => simple.preview.status.textContent.startsWith('Playing'));
  check(editor.exportProjectJSON() === current, 'Embedded Restart changed authoring project');
  const frame = simple.preview.frame; simple.root.querySelector('#simple-pro').click();
  check(!frame.isConnected && !simple.preview.frame && editor.exportProjectJSON() === current, 'Pro switch kept hidden game running or changed content');
  editor.setEditorMode('simple');
  const exportsBefore = downloads.length; simple.root.querySelector('[data-file-action="menu-action-export-html"]').click(); await wait(() => downloads.length > exportsBefore);
  check((await downloads.at(-1).text()).startsWith('<!DOCTYPE html>'), 'Simple game export failed');
  const id = editor.projectId;
  await simple.newProject();
  check(editor.projectId !== id && !runtime.app.root.findByName('FromPrompt') && (await store.list()).some(row => row.projectId === id), 'New project did not preserve old work in recovery');
  check(ai.client.history.length === 0 && !chat.textContent.includes('Create one box'), 'New project retained old conversation context');
  const loaded = JSON.parse(before); loaded.id = 'fixture-open-project'; loaded.name = 'Loaded Fixture';
  const originalClick = HTMLInputElement.prototype.click;
  HTMLInputElement.prototype.click = function() {
    if (this.type !== 'file') return originalClick.call(this);
    const files = new DataTransfer(); files.items.add(new File([JSON.stringify(loaded)], 'fixture.json', { type: 'application/json' })); this.files = files.files; this.dispatchEvent(new Event('change'));
  };
  simple.root.querySelector('[data-file-action="menu-action-import"]').click();
  await wait(() => editor.projectId === 'fixture-open-project');
  check(simple.root.querySelector('#simple-project-name').textContent === 'Loaded Fixture' && runtime.app.root.findByName('Keep'), 'Open failed to restore project/name in Simple');
  HTMLInputElement.prototype.click = originalClick;
  await simple.refresh(); await wait(() => simple.preview.status.textContent.startsWith('Playing'));
  simple.preview.closeButton.click(); check(!simple.preview.frame, 'Embedded Stop kept runtime alive');
  persistence.dispose(); runtime.app.destroy(); report = { ok: true, checks };
} catch (error) { report = { ok: false, checks, error: error.message, stack: error.stack }; }
await fetch('/__simple-result', { method: 'POST', body: JSON.stringify(report) });
</script></body></html>`;
const server = await createServer({ root: fileURLToPath(new URL('../', import.meta.url)), configFile: fileURLToPath(new URL('../vite.config.js', import.meta.url)), server: { host: '127.0.0.1', port: 0, open: false }, plugins: [{ name: 'simple-workspace-fixture', configureServer(server) {
  server.middlewares.use((request, response, next) => {
    if (request.url === '/__simple-fixture') { response.setHeader('Content-Type', 'text/html'); response.end(page); }
    else if (request.url === '/__simple-result' && request.method === 'POST') { let body = ''; request.on('data', chunk => { body += chunk; }); request.on('end', () => { try { reportResult(JSON.parse(body)); } catch { reportResult({ ok: false, error: 'Invalid report' }); } response.end('ok'); }); }
    else next();
  });
} }] });
let child, timeout;
try {
  await server.listen();
  child = spawn(process.env.CHROME_BIN || 'google-chrome', ['--headless', '--no-sandbox', '--enable-unsafe-swiftshader', '--use-gl=angle', '--use-angle=swiftshader', '--disable-gpu-sandbox', '--disable-background-networking', '--disable-sync', '--no-first-run', '--autoplay-policy=no-user-gesture-required', `--window-size=${process.env.SIMPLE_VIEWPORT || '1440,1000'}`, `--user-data-dir=${profile}`, `http://127.0.0.1:${server.httpServer.address().port}/__simple-fixture`], { stdio: 'ignore' });
  child.on('error', () => reportResult({ ok: false, error: 'Headless browser unavailable; set CHROME_BIN.' }));
  const report = await Promise.race([reportPromise, new Promise(resolve => { timeout = setTimeout(() => resolve({ ok: false, error: 'Simple browser test timed out' }), 45000); })]);
  if (!report.ok) throw new Error(JSON.stringify(report));
  console.log(`Real-browser Simple workspace checks passed: ${report.checks}.`);
} finally {
  clearTimeout(timeout);
  if (child && child.exitCode === null) { const closed = new Promise(resolve => child.once('close', resolve)); child.kill(); await closed; }
  await server.close(); await rm(profile, { recursive: true, force: true, maxRetries: 8, retryDelay: 100 });
}
