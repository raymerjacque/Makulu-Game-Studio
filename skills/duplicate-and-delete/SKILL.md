---
name: duplicate-and-delete
category: models-and-assets
tags: [duplicate, delete, clone, undo]
description: "Safely clone entities with all attached behaviors and components, or delete them with full undo/redo history."
---

# Duplicate and Delete Skill

## 🎯 When to Use This Skill
Use this skill when duplicating props (e.g. creating rows of trees or coins) or cleaning up entities from the scene.

## 🔑 Key Concepts & Architecture
- **Duplication (`editor.duplicateEntity(entity)`):**
  - Creates a deep copy of the entity and its children.
  - Clones all components: render, light, camera, collision, rigidbody, particle system, sound, and joint.
  - Clones all attached behaviors and their state parameters.
  - Automatically offsets duplicate position by `[1, 0, 1]` to avoid overlapping.
- **Deletion (`editor.deleteEntity(entity)`):**
  - Unparents the entity safely and clears selection.
  - Recorded to the Command Bus so pressing `Ctrl+Z` instantly restores it.

## 🛠️ Step-by-Step Implementation Guide
1. Select entity.
2. Press `Ctrl+D` to duplicate.
3. Press `Delete` or `Backspace` to remove.

## 💻 Code Examples & Action Recipes
### AI Copilot Action Block
```json:actions
{
  "actions": [
    {
      "action": "duplicate_entity",
      "target": "Tree_Pine"
    },
    {
      "action": "delete_entity",
      "target": "Old_Barrel"
    }
  ]
}
```
