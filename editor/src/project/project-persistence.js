import { newDocumentId } from './project-document.js';
import { RecoveryStore } from './recovery-store.js';

/** Recovery snapshots protect local work; they never mean a project file was saved. */
export class ProjectPersistence {
  constructor(editor, { store = new RecoveryStore(), intervalMs = 15000, now = () => Date.now() } = {}) {
    this.editor = editor;
    this.store = store;
    this.intervalMs = intervalMs;
    this.now = now;
    this.baseline = null;
    this.lastRecoveredJSON = null;
    this.state = { dirty: false, source: 'new', recovery: 'idle', recoveredAt: null, message: '' };
    this.disposers = [];
    this.busy = null;
    this.restoring = false;
    this.epoch = 0;
    this.disposed = false;
    editor.persistence = this;
  }

  publish() { this.editor.events.emit('project:save-state', { ...this.state }); }
  capture() { return this.editor.exportProjectJSON(); }
  editable() { return !this.disposed && !this.editor.isPlaying && this.editor.sceneResourceStatus?.status !== 'loading'; }

  async initialize() {
    try { this.baseline = this.capture(); }
    catch {
      this.state.dirty = true; this.state.recovery = 'error';
      this.state.message = 'Project data is not ready for recovery. Finish imports before saving.';
    }
    for (const name of ['scene:changed', 'entity:transformed', 'entity:component:changed', 'scene:list:changed', 'project:content:changed']) {
      this.disposers.push(this.editor.events.on(name, () => {
        if (this.editor.isPlaying || this.restoring) return;
        this.state.dirty = true; this.publish();
      }));
    }
    this.disposers.push(this.editor.events.on('project:loaded', () => {
      if (this.restoring) return;
      this.epoch++;
      this.lastRecoveredJSON = null;
      this.state = { dirty: false, source: 'opened', recovery: 'idle', recoveredAt: null, message: '' };
      try { this.baseline = this.capture(); }
      catch {
        this.baseline = null; this.state.dirty = true; this.state.recovery = 'error';
        this.state.message = 'Project data opened, but some references are not ready for recovery.';
      }
      this.publish();
    }));
    try {
      const snapshots = await this.store.list();
      this.editor.events.emit('project:recovery:available', snapshots.length);
    } catch {
      this.state.recovery = 'error'; this.state.message = 'Local recovery storage is unavailable. Download a project file to keep your work.';
    }
    this.publish();
    if (this.intervalMs > 0) this.timer = setInterval(() => { void this.checkpoint(); }, this.intervalMs);
  }

  /** Polling also catches legacy tools that mutate data without a command or event. */
  check() {
    if (!this.editable() || this.restoring) return null;
    const json = this.capture();
    this.state.dirty = this.state.source === 'recovered' || json !== this.baseline;
    this.publish();
    return json;
  }

  markDownloaded(json) {
    this.baseline = json;
    this.state.source = 'downloaded';
    try { this.state.dirty = this.capture() !== json; } catch { this.state.dirty = true; }
    this.publish();
    void this.checkpoint({ force: true });
  }

  checkpoint({ force = false } = {}) {
    if (this.busy) return this.busy.then(() => this.checkpoint({ force }));
    if (!this.editable() || this.restoring) return Promise.resolve(false);
    this.busy = this.writeCheckpoint(force).finally(() => { this.busy = null; });
    return this.busy;
  }

  async writeCheckpoint(force) {
    const epoch = this.epoch;
    try {
      const json = this.check();
      if (!json) return false;
      if (!force && (json === this.lastRecoveredJSON || !this.state.dirty)) return true;
      const document = JSON.parse(json);
      this.state.recovery = 'saving'; this.publish();
      const snapshot = { id: newDocumentId(), projectId: document.id, name: document.name, createdAt: this.now(), json };
      await this.store.save(snapshot);
      // Do not attach an old completion to a newly opened project.
      if (!this.disposed && this.epoch === epoch && this.editor.projectId === document.id && !this.restoring) {
        this.lastRecoveredJSON = json;
        this.state.recovery = 'saved'; this.state.recoveredAt = snapshot.createdAt; this.state.message = '';
        this.check();
      }
      return true;
    } catch {
      if (this.disposed || this.epoch !== epoch) return false;
      this.state.recovery = 'error';
      this.state.message = 'Recovery could not be saved. Download a project file; previous snapshots have been retained where available.';
      this.publish();
      return false;
    }
  }

  async protectBeforeReplace() {
    if (!this.editable() || this.restoring) return false;
    try { this.check(); } catch { return false; }
    return !this.state.dirty || await this.checkpoint({ force: true });
  }

  async restore(id) {
    if (!this.editable() || this.restoring) return { status: 'invalid', message: 'Stop play and wait for loading before restoring a snapshot.' };
    const snapshot = (await this.store.list()).find(row => row.id === id);
    if (!snapshot) return { status: 'invalid', message: 'Recovery snapshot no longer exists.' };
    if (!await this.protectBeforeReplace()) return { status: 'invalid', message: 'Could not protect current changes. Download the current project before restoring.' };
    this.restoring = true;
    try {
      const report = await this.editor.openProjectJSON(snapshot.json);
      if (report.dataLoaded && report.status !== 'cancelled') {
        this.baseline = null;
        this.lastRecoveredJSON = snapshot.json;
        this.state = { dirty: true, source: 'recovered', recovery: 'saved', recoveredAt: snapshot.createdAt, message: '' };
        this.publish();
      }
      return report;
    } finally { this.restoring = false; }
  }

  dispose() {
    this.disposed = true;
    clearInterval(this.timer);
    this.disposers.forEach(dispose => dispose());
    this.disposers = [];
  }
}
