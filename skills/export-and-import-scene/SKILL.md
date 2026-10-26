---
name: export-and-import-scene
category: compilation-and-export
tags: [json, export-scene, import-scene, backup, schema]
description: "Export scenes to clean human-readable JSON files and reload them safely."
---

# Export and Import Scene Skill

## 🎯 When to Use This Skill
Use this skill for project backups, version control sharing, and procedural scene generation.

## 🔑 Key Concepts & Architecture
- Serializer: `editor.exportSceneJSON()` in `editor/src/core/editor.js`.
- Deserializer: `editor.loadSceneJSON(jsonStr)`.
- Schema includes:
  - Scene tree: `root.children` with position, rotation, scale, enabled.
  - Component dictionaries: `render`, `light`, `camera`, `collision`, `rigidbody`, `joint`, `sound`, `particlesystem`, `script`.
  - Behavior lists: `behaviors: [{ type, params }]`.
  - Environmental settings: `atmosphere`, `fog`, `hud`, `triggers`.
