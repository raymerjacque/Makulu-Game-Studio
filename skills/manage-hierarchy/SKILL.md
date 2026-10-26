---
name: manage-hierarchy
category: models-and-assets
tags: [hierarchy, parenting, grouping, search]
description: "Organize scene entities, manage parent-child relationships, filter by name, and group scene props."
---

# Manage Hierarchy Skill

## 🎯 When to Use This Skill
Use this skill when structuring complex scenes, grouping objects into folders, or parenting props to characters.

## 🔑 Key Concepts & Architecture
- Hierarchy Panel (`editor/src/ui/hierarchy.js`) visualizes the scene tree.
- Child entities inherit their parent's world position, rotation, and scale.
- Search input at the top of the Hierarchy panel filters entities in real-time.
- Multi-selection and group folder creation (`Create Empty Folder`).

## 🛠️ Step-by-Step Implementation Guide
1. Drag and drop any entity onto another entity in the Hierarchy to parent it.
2. In JavaScript:
   ```javascript
   parentEntity.addChild(childEntity);
   ```
