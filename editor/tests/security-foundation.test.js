import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createServer } from 'vite';
import { AISettingsManager } from '../src/ai/ai-settings.js';
import { AIAssistantUI } from '../src/ui/ai-assistant.js';
const require = createRequire(import.meta.url);
const { isTrustedDocument, isTrustedAuthSender, isSafeExternalUrl } = require('../desktop-security.cjs');
const attack = '<img src=x onerror="alert(1)"><svg onload=alert(2)> & "test"';

function makeUI() {
  const body = { children: [], appendChild(node) { this.children.push(node); }, scrollHeight: 0 };
  const ui = Object.create(AIAssistantUI.prototype);
  ui.panel = { style: {}, querySelector: () => body };
  ui.showThinkingIndicator = ui.updateThinkingStatus = ui.hideThinkingIndicator = () => {};
  ui.client = { sendMessage: async () => attack };
  ui.executor = { parseActions: () => [{ action: 'test' }], executeActions: async () => [{ action: attack, target: attack }] };
  return { ui, body };
}

// Test the actual UI rendering paths without creating a graphics context.
test('chat escapes model text, action results, user input and provider errors', async () => {
  const previous = globalThis.document;
  globalThis.document = { createElement: () => ({ querySelector: () => null }) };
  try {
    const { ui, body } = makeUI();
    await ui.sendUserPrompt(attack);
    assert.equal(body.children.length, 2);
    for (const node of body.children) {
      assert.ok(!node.innerHTML.includes('<img'));
      assert.ok(!node.innerHTML.includes('<svg'));
      assert.ok(node.innerHTML.includes('&lt;img'));
    }
    ui.client.sendMessage = async () => { throw new Error(attack); };
    await ui.sendUserPrompt('retry');
    assert.ok(body.children.at(-1).innerHTML.includes('&lt;img'));
    assert.ok(!body.children.at(-1).innerHTML.includes('<img'));
    ui.swarmView = { isTeamModeActive: true };
    ui.team = { executeTeamTask: async () => { throw new Error(attack); } };
    await ui.sendUserPrompt('team');
    assert.ok(!body.children.at(-1).innerHTML.includes('<img'));
  } finally { globalThis.document = previous; }
});

test('team messages and scene audit escape object names and message metadata', () => {
  const previous = globalThis.document;
  globalThis.document = { createElement: () => ({ querySelector: () => null }) };
  try {
    const { ui, body } = makeUI();
    let receive;
    ui.team = { messageBus: { subscribe: fn => { receive = fn; } } };
    ui.bindSwarmMessages();
    receive({ from: attack, type: attack, content: attack });
    ui.auditor = { audit: () => ({ issues: [{ type: 'error', msg: attack }], stats: { totalEntities: 1, totalLights: 0, shadowCasters: 0 } }) };
    ui.runSceneAudit();
    assert.equal(body.children.length, 2);
    for (const node of body.children) {
      assert.ok(!node.innerHTML.includes('<img'));
      assert.ok(node.innerHTML.includes('&lt;img'));
    }
  } finally { globalThis.document = previous; }
});

test('credential policy accepts only the owning main frame at the exact entry document', () => {
  const entry = 'http://127.0.0.1:3000/';
  const frame = { url: entry };
  const contents = { mainFrame: frame };
  const window = { webContents: contents, isDestroyed: () => false };
  const event = { sender: contents, senderFrame: frame };
  assert.equal(isTrustedAuthSender(event, window, entry), true);
  assert.equal(isTrustedAuthSender({ ...event, sender: {} }, window, entry), false);
  assert.equal(isTrustedAuthSender({ ...event, senderFrame: { url: entry } }, window, entry), false);
  frame.url = 'https://example.com/';
  assert.equal(isTrustedAuthSender(event, window, entry), false);
  assert.equal(isTrustedAuthSender(event, null, entry), false);
  assert.equal(isTrustedAuthSender(event, { ...window, isDestroyed: () => true }, entry), false);
});

test('navigation policy rejects other origins, paths, protocols and URL credentials', () => {
  const entry = 'http://127.0.0.1:3000/';
  assert.equal(isTrustedDocument(entry + '?reload=1#editor', entry), true);
  for (const url of ['http://localhost:3000/', 'http://127.0.0.1:3000/game.html', 'https://127.0.0.1:3000/', 'http://user@127.0.0.1:3000/', 'javascript:alert(1)', 'not a URL']) {
    assert.equal(isTrustedDocument(url, entry), false, url);
  }
  assert.equal(isTrustedDocument('file:///studio/dist/index.html', 'file:///studio/dist/index.html'), true);
  assert.equal(isTrustedDocument('file:///studio/other.html', 'file:///studio/dist/index.html'), false);
});

test('external links allow web URLs and reject privileged protocol handlers', () => {
  for (const url of ['https://example.com/help', 'http://127.0.0.1:3000/']) assert.equal(isSafeExternalUrl(url), true);
  for (const url of ['file:///etc/passwd', 'javascript:alert(1)', 'data:text/html,test', 'custom-app:run', 'https://user:password@example.com', 'bad']) assert.equal(isSafeExternalUrl(url), false);
});

test('development and preview bind locally and the old credential HTTP endpoint serves no credentials', async () => {
  const server = await createServer({ server: { port: 0, open: false } });
  try {
    assert.equal(server.config.server.host, '127.0.0.1');
    assert.equal(server.config.preview.host, '127.0.0.1');
    await server.listen();
    const address = server.httpServer.address();
    assert.equal(address.address, '127.0.0.1');
    const res = await fetch(`http://127.0.0.1:${address.port}/api/electra-auth`);
    // Vite may return its HTML fallback, but it must never return credential JSON.
    assert.ok(!res.headers.get('content-type')?.includes('application/json'));
    assert.ok(!(await res.text()).includes('"apiKey"'));
  } finally { await server.close(); }
});

test('system auth uses desktop bridge only and never fetches OS credentials over HTTP', async () => {
  const previousWindow = globalThis.window;
  const previousFetch = globalThis.fetch;
  const manager = Object.create(AISettingsManager.prototype);
  manager.providers = { makulu: { apiKey: '' } };
  manager.notify = () => {};
  globalThis.fetch = () => { throw new Error('Unexpected HTTP credential request'); };
  try {
    globalThis.window = {};
    await manager.detectSystemAuth();
    assert.equal(manager.providers.makulu.apiKey, '');
    globalThis.window = { makuluDesktop: { getElectraAuth: async () => ({ apiKey: 'test-only-dummy', tier: 'Test', username: 'fixture' }) } };
    await manager.detectSystemAuth();
    assert.equal(manager.providers.makulu.apiKey, 'test-only-dummy');
    assert.equal(manager.isSystemAuthDetected, true);
  } finally { globalThis.window = previousWindow; globalThis.fetch = previousFetch; }
});
