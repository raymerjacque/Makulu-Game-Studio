/**
 * Universal Command Bus for MakuluLinux Game Studio
 * Handles all state modifications, transactional execution, and Undo/Redo history.
 */

export class Command {
  constructor(name, executeFn, undoFn) {
    this.name = name;
    this.executeFn = executeFn;
    this.undoFn = undoFn;
    this.timestamp = Date.now();
  }

  execute() {
    return this.executeFn();
  }

  undo() {
    return this.undoFn();
  }
}

export class CommandBus {
  constructor(editor) {
    this.editor = editor;
    this.undoStack = [];
    this.redoStack = [];
    this.maxHistory = 100;
    this.listeners = new Set();
  }

  /**
   * Subscribe to command events
   */
  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notify(event, command) {
    for (const listener of this.listeners) {
      listener(event, command, {
        canUndo: this.canUndo(),
        canRedo: this.canRedo()
      });
    }
  }

  canUndo() {
    return !this.transaction && this.undoStack.length > 0;
  }

  canRedo() {
    return !this.transaction && this.redoStack.length > 0;
  }

  /**
   * Execute a command and record it to history
   */
  execute(command) {
    if (this.transaction) {
      try {
        const result = command.execute();
        if (result?.then) throw new Error('This transaction supports synchronous commands only.');
        this.transaction.commands.push(command); return result;
      } catch (error) {
        this.transaction.failure = error;
        try { command.undo(); } catch { this.transaction.rollbackFailed = true; }
        try { command.dispose?.(); } catch { this.transaction.rollbackFailed = true; }
        throw error;
      }
    }
    try {
      const result = command.execute();
      if (this.editor.isPlaying) return result;
      this.undoStack.push(command);
      if (this.undoStack.length > this.maxHistory) {
        this.undoStack.shift();
      }
      this.redoStack = []; // Clear redo stack on new action
      this.notify('execute', command);
      return result;
    } catch (err) {
      console.error(`CommandBus: Execution error in "${command.name}":`, err);
      throw err;
    }
  }

  /** Collect synchronous commands into one history entry; no failed batch can retain partial history. */
  runTransaction(name, operation) {
    if (this.transaction || this.editor.isPlaying) throw new Error('Stop play and finish the current edit before starting a transaction.');
    if (operation?.constructor?.name === 'AsyncFunction') throw new Error('Async edits require the resource-aware transaction runner.');
    const selection = this.editor.selection.getEntities();
    const restoreSelection = nodes => { this.editor.selection.clear(); nodes.forEach(node => { if (node.parent) this.editor.selection.add(node); }); };
    const transaction = { commands: [] }; this.transaction = transaction;
    let result;
    try {
      result = operation();
      if (result?.then) throw new Error('Async commands require the resource-aware transaction runner.');
      if (transaction.failure) throw transaction.failure;
    } catch (error) {
      for (const command of [...transaction.commands].reverse()) {
        try { command.undo(); } catch { transaction.rollbackFailed = true; }
      }
      for (const command of transaction.commands) { try { command.dispose?.(); } catch { transaction.rollbackFailed = true; } }
      this.transaction = null;
      restoreSelection(selection);
      this.editor.persistence?.check();
      this.notify('rollback', null);
      throw new Error(transaction.rollbackFailed ? 'AI edit failed and rollback needs attention. Restore a recovery snapshot.' : `AI edit rolled back: ${error.message}`);
    }
    this.transaction = null;
    if (!transaction.commands.length) return result;
    const afterSelection = this.editor.selection.getEntities();
    const commands = transaction.commands;
    const compound = new Command(name, () => {
      const applied = [];
      try { for (const command of commands) { try { command.execute(); } catch (error) { command.undo(); throw error; } applied.push(command); } }
      catch (error) { for (const command of applied.reverse()) command.undo(); restoreSelection(selection); throw error; }
      restoreSelection(afterSelection);
    }, () => {
      const undone = [];
      try { for (const command of [...commands].reverse()) { try { command.undo(); } catch (error) { command.execute(); throw error; } undone.push(command); } }
      catch (error) { for (const command of undone.reverse()) command.execute(); restoreSelection(afterSelection); throw error; }
      restoreSelection(selection);
    });
    compound.actionCount = commands.length;
    this.undoStack.push(compound);
    if (this.undoStack.length > this.maxHistory) this.undoStack.shift();
    this.redoStack = [];
    this.notify('execute', compound);
    return result;
  }

  /**
   * Undo last command
   */
  undo() {
    if (this.editor.isPlaying) return null;
    if (!this.canUndo()) return null;
    const command = this.undoStack[this.undoStack.length - 1];
    try {
      const result = command.undo();
      this.undoStack.pop();
      this.redoStack.push(command);
      this.notify('undo', command);
      return result;
    } catch (err) {
      console.error(`CommandBus: Undo error in "${command.name}":`, err);
      throw err;
    }
  }

  /**
   * Redo previously undone command
   */
  redo() {
    if (this.editor.isPlaying) return null;
    if (!this.canRedo()) return null;
    const command = this.redoStack[this.redoStack.length - 1];
    try {
      const result = command.execute();
      this.redoStack.pop();
      this.undoStack.push(command);
      this.notify('redo', command);
      return result;
    } catch (err) {
      console.error(`CommandBus: Redo error in "${command.name}":`, err);
      throw err;
    }
  }

  clear() {
    if (this.transaction) throw new Error('Cannot clear history during an edit transaction.');
    if (this.editor.isPlaying) return;
    this.undoStack = [];
    this.redoStack = [];
    this.notify('clear', null);
  }
}
