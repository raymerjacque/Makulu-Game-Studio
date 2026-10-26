---
name: prefab-system
category: models-and-assets
tags: [prefab, templates, reuse, instances]
description: "Save entity hierarchies as reusable .prefab files and spawn them repeatedly with 1 click."
---

# Prefab System Skill

## 🎯 When to Use This Skill
Use this skill to create reusable templates (e.g. a fully decorated street lamp with light and collider, or an enemy archetype).

## 🔑 Key Concepts & Architecture
- Managed by `PrefabSystem` in `editor/src/core/prefabs.js`.
- Creates `<EntityName>.prefab` files stored in `/assets/prefabs`.
- In the Inspector, click **💾 Save as Prefab** to serialize the active entity.
- Double-click any prefab in the Assets Panel to spawn a new instance into the scene.
