---
name: command-bus-undo-redo
category: editor-interface
tags: [command-bus, undo, redo, history, transaction]
description: "Record user actions and AI modifications to the Command Bus for full Ctrl+Z and Ctrl+Y support."
---

# Command Bus Undo and Redo Skill

## 🎯 When to Use This Skill
Use this skill whenever modifying the scene to ensure non-destructive editing and reversible operations.

## 🔑 Key Concepts & Architecture
- Implemented in `editor/src/core/commands.js` (`CommandBus` and `Command`).
- Methods:
  - `commandBus.execute(command)`: Executes forward action and pushes to undo stack.
  - `commandBus.undo()`: Pops last command and invokes its `undo()` callback.
  - `commandBus.redo()`: Redoes popped command.
- Hotkeys: `Ctrl+Z` (Undo), `Ctrl+Y` or `Ctrl+Shift+Z` (Redo).
