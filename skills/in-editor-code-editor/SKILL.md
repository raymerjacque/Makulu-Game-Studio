---
name: in-editor-code-editor
category: scripting-and-code
tags: [code-editor, ide, syntax, escape, modal]
description: "Write and test JavaScript scripts directly inside the built-in CodeEditorModal with syntax highlighting."
---

# In-Editor Code Editor Skill

## 🎯 When to Use This Skill
Use this skill to write, edit, and inspect game scripts without switching to an external text editor.

## 🔑 Key Concepts & Architecture
- Modal implemented in `editor/src/ui/code-editor.js`.
- Features:
  - Line numbers and syntax indentation.
  - Global `Escape` key listener cleanly closes modal.
  - **Save & Apply** compiles the script directly into the running PlayCanvas application.
