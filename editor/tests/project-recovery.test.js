import test from 'node:test';
import assert from 'node:assert/strict';
import { Editor } from '../src/core/editor.js';
import { ProjectPersistence } from '../src/project/project-persistence.js';

class MemoryStore {
  constructor() { this.rows = []; this.fail = false; this.gate = null; }
  async list() { if (this.fail) throw new Error('storage unavailable'); return [...this.rows]; }
  async save(row) { if (this.gate) await this.gate; if (this.fail) throw new Error('quota exceeded'); this.rows.push(structuredClone(row)); return row; }
  async delete(id) { this.rows = this.rows.filter(row => row.id !== id); }
}
async function setup(store = new MemoryStore()) {
  const editor = new Editor(); let time = 100;
  const persistence = new ProjectPersistence(editor, { store, intervalMs: 0, now: () => ++time });
  await persistence.initialize();
  return { editor, persistence, store };
}

test('autosnapshot keeps dirty work dirty, retains a recoverable document and omits provider settings', async () => {
  const { editor, persistence, store } = await setup();
  assert.equal(persistence.state.dirty, false);
  editor.providerSettings = { apiKey: 'test-only-private-value' };
  editor.createEntity({ name: 'KeepMe' }); assert.equal(persistence.state.dirty, true);
  assert.equal(await persistence.checkpoint(), true);
  assert.equal(persistence.state.dirty, true); assert.equal(persistence.state.recovery, 'saved');
  assert.equal(store.rows.length, 1); assert.ok(!store.rows[0].json.includes('test-only-private-value'));
  await persistence.checkpoint(); assert.equal(store.rows.length, 1, 'Unchanged projects should not fill recovery history');
  persistence.dispose();
});

test('direct legacy edits are detected by sampling and undo back to baseline clears dirty state', async () => {
  const { editor, persistence } = await setup();
  editor.createEntity({ name: 'Temporary' }); editor.commandBus.undo(); persistence.check(); assert.equal(persistence.state.dirty, false);
  editor.scripts.set('direct.js', '/* direct mutation */'); persistence.check(); assert.equal(persistence.state.dirty, true);
  persistence.dispose();
});

test('download baseline is separate from recovery and later edits become dirty', async () => {
  const { editor, persistence, store } = await setup();
  editor.createEntity({ name: 'Saved' }); persistence.markDownloaded(editor.exportProjectJSON());
  if (persistence.busy) await persistence.busy;
  assert.equal(persistence.state.source, 'downloaded'); assert.equal(persistence.state.dirty, false); assert.equal(store.rows.length, 1);
  editor.createEntity({ name: 'NewChange' }); assert.equal(persistence.state.dirty, true);
  persistence.dispose();
});

test('reopening the application offers prior snapshots without overwriting the default project, then restores explicitly', async () => {
  const first = await setup(); first.editor.createEntity({ name: 'RecoveredIsland' }); await first.persistence.checkpoint(); first.persistence.dispose();
  const second = await setup(first.store);
  assert.equal(second.editor.root.findByName('RecoveredIsland'), null);
  const report = await second.persistence.restore(first.store.rows[0].id);
  assert.equal(report.status, 'ready'); assert.ok(second.editor.root.findByName('RecoveredIsland'));
  assert.equal(second.persistence.state.source, 'recovered'); assert.equal(second.persistence.state.dirty, true);
  second.persistence.markDownloaded(second.editor.exportProjectJSON()); if (second.persistence.busy) await second.persistence.busy;
  assert.equal(second.persistence.state.dirty, false); second.persistence.dispose();
});

test('failed storage writes preserve old snapshots, report failure and block replacement of unsaved work', async () => {
  const { editor, persistence, store } = await setup();
  editor.createEntity({ name: 'First' }); await persistence.checkpoint(); const previous = store.rows[0].json;
  editor.createEntity({ name: 'Second' }); store.fail = true;
  assert.equal(await persistence.checkpoint(), false); assert.equal(persistence.state.recovery, 'error'); assert.equal(persistence.state.dirty, true);
  assert.equal(store.rows.length, 1); assert.equal(store.rows[0].json, previous);
  assert.equal(await persistence.protectBeforeReplace(), false); assert.ok(editor.root.findByName('Second'));
  store.fail = false; assert.equal(await persistence.checkpoint(), true); assert.equal(persistence.state.recovery, 'saved'); persistence.dispose();
});

test('play sessions and loading restoration are not sampled into recovery', async () => {
  const { editor, persistence, store } = await setup(); editor.createEntity({ name: 'EditingState' });
  editor.isPlaying = true; assert.equal(await persistence.checkpoint(), false); assert.equal(await persistence.protectBeforeReplace(), false);
  editor.isPlaying = false; editor.sceneResourceStatus = { status: 'loading' }; assert.equal(await persistence.checkpoint(), false);
  assert.equal(store.rows.length, 0); editor.sceneResourceStatus = { status: 'ready' }; assert.equal(await persistence.checkpoint(), true);
  persistence.dispose();
});

test('unavailable storage leaves dirty tracking usable and corrupt snapshots do not replace the project', async () => {
  const store = new MemoryStore(); store.fail = true; const { editor, persistence } = await setup(store);
  assert.equal(persistence.state.recovery, 'error'); editor.createEntity({ name: 'KeepCurrent' }); assert.equal(persistence.state.dirty, true);
  store.fail = false; store.rows.push({ id: 'corrupt', createdAt: 1, json: '{invalid' });
  const report = await persistence.restore('corrupt'); assert.equal(report.status, 'invalid'); assert.ok(editor.root.findByName('KeepCurrent'));
  assert.equal(persistence.state.source, 'new'); persistence.dispose();
});

test('current changes are checkpointed before a different recovery project replaces them', async () => {
  const source = await setup(); source.editor.createEntity({ name: 'OlderProject' }); await source.persistence.checkpoint(); source.persistence.dispose();
  const { editor, persistence, store } = await setup(source.store); editor.createEntity({ name: 'CurrentUnsaved' });
  const report = await persistence.restore(store.rows[0].id); assert.equal(report.status, 'ready');
  assert.ok(store.rows.some(row => row.json.includes('CurrentUnsaved'))); assert.ok(editor.root.findByName('OlderProject'));
  persistence.dispose();
});

test('edits during an asynchronous snapshot write remain dirty and are captured on the next pass', async () => {
  const { editor, persistence, store } = await setup(); let release; store.gate = new Promise(resolve => { release = resolve; });
  editor.createEntity({ name: 'VersionOne' }); const saving = persistence.checkpoint();
  editor.createEntity({ name: 'VersionTwo' }); release(); await saving; store.gate = null;
  assert.equal(persistence.state.dirty, true); assert.ok(!store.rows[0].json.includes('VersionTwo'));
  await persistence.checkpoint(); assert.ok(store.rows[1].json.includes('VersionTwo')); persistence.dispose();
});

test('late storage completion cannot mark a subsequently opened project recovered or clean', async () => {
  const { editor, persistence, store } = await setup(); let release; store.gate = new Promise(resolve => { release = resolve; });
  editor.createEntity({ name: 'Old' }); const saving = persistence.checkpoint();
  assert.equal(editor.loadProjectJSON({ project: 'New', root: { children: [{ name: 'Replacement' }] } }), true);
  release(); await saving;
  assert.equal(persistence.state.source, 'opened'); assert.equal(persistence.state.recovery, 'idle'); assert.equal(persistence.state.dirty, false);
  assert.ok(editor.root.findByName('Replacement')); persistence.dispose();
});

test('save-state display distinguishes local recovery, explicit download and storage failure using text', async () => {
  const { TopBar } = await import('../src/ui/topbar.js');
  const { editor, persistence, store } = await setup();
  const label = {}; const bar = Object.create(TopBar.prototype); bar.editor = editor; bar.container = { querySelector: () => label }; bar.bindSaveState();
  editor.createEntity({ name: 'Test' }); await persistence.checkpoint();
  assert.ok(label.textContent.startsWith('Unsaved changes')); assert.ok(label.textContent.includes('Recovery saved'));
  persistence.markDownloaded(editor.exportProjectJSON()); if (persistence.busy) await persistence.busy;
  assert.ok(label.textContent.startsWith('No changes since download'));
  editor.createEntity({ name: 'Later' }); store.fail = true; await persistence.checkpoint();
  assert.ok(label.textContent.startsWith('Recovery failed')); assert.equal(label.innerHTML, undefined); persistence.dispose();
});

test('native dirty-window close keeps editing by default and closes only for the explicit discard choice', async () => {
  const { createRequire } = await import('node:module');
  const { confirmUnsavedClose } = createRequire(import.meta.url)('../desktop-security.cjs');
  for (const choice of [0, 1]) {
    let allowed = false;
    confirmUnsavedClose({ preventDefault() { allowed = true; } }, {}, { showMessageBoxSync(window, options) {
      assert.equal(options.defaultId, 0); assert.equal(options.cancelId, 0); return choice;
    } });
    assert.equal(allowed, choice === 1);
  }
});

test('unserializable references do not turn a data-adoption event into a failed project open', async () => {
  const { editor, persistence } = await setup();
  assert.equal(editor.loadProjectJSON({ root: { children: [{ name: 'Unresolved', modelUrl: 'blob:not-portable' }] } }), true);
  assert.equal(persistence.state.dirty, true); assert.equal(persistence.state.recovery, 'error');
  assert.equal(await persistence.checkpoint(), false); persistence.dispose();
});

test('replacement protection writes a fresh snapshot even when its earlier identical recovery was deleted', async () => {
  const { editor, persistence, store } = await setup(); editor.createEntity({ name: 'MustKeep' }); await persistence.checkpoint();
  await store.delete(store.rows[0].id); assert.equal(store.rows.length, 0);
  assert.equal(await persistence.protectBeforeReplace(), true); assert.equal(store.rows.length, 1);
  assert.ok(store.rows[0].json.includes('MustKeep')); persistence.dispose();
});
