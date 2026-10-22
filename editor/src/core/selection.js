import * as pc from 'playcanvas';

/**
 * Selection Manager
 * Manages active entity selection, multi-selection, and dispatches selection events.
 */

export class SelectionManager {
  constructor(editor) {
    this.editor = editor;
    this.selected = []; // Array of pc.Entity
    this.listeners = new Set();
  }

  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notify() {
    for (const listener of this.listeners) {
      listener(this.selected, this.getActive());
    }
  }

  getActive() {
    return this.selected.length > 0 ? this.selected[this.selected.length - 1] : null;
  }

  getEntities() {
    return [...this.selected];
  }

  set(entity) {
    if (!entity) {
      this.clear();
      return;
    }
    if (this.selected.length === 1 && this.selected[0] === entity) return;
    this.selected = [entity];
    this.notify();
  }

  add(entity) {
    if (!entity || this.selected.includes(entity)) return;
    this.selected.push(entity);
    this.notify();
  }

  remove(entity) {
    const idx = this.selected.indexOf(entity);
    if (idx !== -1) {
      this.selected.splice(idx, 1);
      this.notify();
    }
  }

  toggle(entity) {
    if (this.selected.includes(entity)) {
      this.remove(entity);
    } else {
      this.add(entity);
    }
  }

  clear() {
    if (this.selected.length === 0) return;
    this.selected = [];
    this.notify();
  }
}
