/** Origin-local recovery history. Writes and pruning commit in one IndexedDB transaction. */
export class RecoveryStore {
  constructor({ indexedDB = globalThis.indexedDB, databaseName = 'makulu-studio-recovery-v1', perProject = 5, total = 20 } = {}) {
    if (![perProject, total].every(limit => Number.isInteger(limit) && limit > 0)) throw new Error('Recovery history limits must be positive integers.');
    this.indexedDB = indexedDB;
    this.databaseName = databaseName;
    this.perProject = perProject;
    this.total = total;
    this.connection = null;
  }

  async open() {
    if (!this.indexedDB) throw new Error('Local recovery storage is unavailable.');
    if (!this.connection) {
      this.connection = new Promise((resolve, reject) => {
        const request = this.indexedDB.open(this.databaseName, 1);
        request.onupgradeneeded = () => request.result.createObjectStore('snapshots', { keyPath: 'id' });
        let blocked = false;
        request.onerror = () => reject(new Error('Could not open local recovery storage.'));
        request.onblocked = () => { blocked = true; reject(new Error('Recovery storage is blocked by another window.')); };
        request.onsuccess = () => {
          const db = request.result;
          if (blocked) { db.close(); return; }
          db.onversionchange = () => { db.close(); this.connection = null; };
          resolve(db);
        };
      }).catch(error => { this.connection = null; throw error; });
    }
    return this.connection;
  }

  async list() {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('snapshots', 'readonly');
      const request = transaction.objectStore('snapshots').getAll();
      transaction.oncomplete = () => resolve(request.result.sort((a, b) => b.createdAt - a.createdAt || b.id.localeCompare(a.id)));
      transaction.onabort = transaction.onerror = () => reject(new Error('Could not read recovery snapshots.'));
    });
  }

  async save(snapshot) {
    if (typeof snapshot.id !== 'string' || typeof snapshot.projectId !== 'string' || typeof snapshot.json !== 'string' || !Number.isFinite(snapshot.createdAt)) {
      throw new Error('Invalid recovery snapshot.');
    }
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('snapshots', 'readwrite');
      const store = transaction.objectStore('snapshots');
      transaction.oncomplete = () => resolve(snapshot);
      transaction.onabort = transaction.onerror = () => reject(new Error('Recovery snapshot could not be stored. Storage may be full or unavailable.'));
      const request = store.getAll();
      request.onsuccess = () => {
        try {
          const rows = [...request.result.filter(row => row.id !== snapshot.id), snapshot]
            .sort((a, b) => b.createdAt - a.createdAt || (a.id === snapshot.id ? -1 : b.id === snapshot.id ? 1 : b.id.localeCompare(a.id)));
          const counts = new Map();
          const retained = rows.filter(row => {
            const count = (counts.get(row.projectId) || 0) + 1;
            counts.set(row.projectId, count);
            return count <= this.perProject;
          }).slice(0, this.total);
          // Reject an obsolete timestamp rather than silently discarding the requested snapshot.
          if (!retained.some(row => row.id === snapshot.id)) throw new Error('Obsolete snapshot.');
          store.put(snapshot);
          const keep = new Set(retained.map(row => row.id));
          for (const row of rows) if (!keep.has(row.id)) store.delete(row.id);
        } catch { transaction.abort(); }
      };
    });
  }

  async delete(id) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('snapshots', 'readwrite');
      transaction.objectStore('snapshots').delete(id);
      transaction.oncomplete = () => resolve();
      transaction.onerror = transaction.onabort = () => reject(new Error('Could not delete the recovery snapshot.'));
    });
  }
}
