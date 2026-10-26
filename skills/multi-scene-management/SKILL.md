---
name: multi-scene-management
category: progression-and-flow
tags: [scenes, levels, multi-scene, duplicate-scene]
description: "Create, duplicate, rename, switch between, and delete multiple scenes and levels in a single project."
---

# Multi-Scene Management Skill

## 🎯 When to Use This Skill
Use this skill for multi-level games (e.g. "Main Menu", "Level 1", "Boss Arena").

## 🔑 Key Concepts & Architecture
- Managed in `editor.scenes` (`Map<string, string>` storing JSON scene states).
- Methods on `Editor`:
  - `editor.createScene(name)`
  - `editor.switchScene(name)` (automatically snapshots current scene before loading new one)
  - `editor.duplicateScene(name)`
  - `editor.renameScene(oldName, newName)`
  - `editor.deleteScene(name)`
