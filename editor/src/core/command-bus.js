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
    return this.undoStack.length > 0;
  }

  canRedo() {
    return this.redoStack.length > 0;
  }

  /**
   * Execute a command and record it to history
   */
  execute(command) {
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

  /**
   * Undo last command
   */
  undo() {
    if (this.editor.isPlaying) return null;
    if (!this.canUndo()) return null;
    const command = this.undoStack.pop();
    try {
      const result = command.undo();
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
    const command = this.redoStack.pop();
    try {
      const result = command.execute();
      this.undoStack.push(command);
      this.notify('redo', command);
      return result;
    } catch (err) {
      console.error(`CommandBus: Redo error in "${command.name}":`, err);
      throw err;
    }
  }

  clear() {
    if (this.editor.isPlaying) return;
    this.undoStack = [];
    this.redoStack = [];
    this.notify('clear', null);
  }
}
