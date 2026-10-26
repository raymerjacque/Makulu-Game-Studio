---
name: transform-entity
category: models-and-assets
tags: [position, rotation, scale, transform, gizmo]
description: "Manipulate entity position, orientation, and scale using gizmos or numeric Inspector inputs."
---

# Transform Entity Skill

## 🎯 When to Use This Skill
Use this skill to position, orient, or scale any entity in 3D space.

## 🔑 Key Concepts & Architecture
- **Shortcut Keys:**
  - `W`: Translate Gizmo
  - `E`: Rotate Gizmo
  - `R`: Scale Gizmo
- Gizmos update `entity.setPosition`, `entity.setEulerAngles`, and `entity.setLocalScale`.
- Position uses standard Cartesian [X: Right/Left, Y: Up/Down, Z: Forward/Back].
- Rotations are stored in Euler degrees [Pitch, Yaw, Roll].

## 🛠️ Step-by-Step Implementation Guide
1. Select entity in Viewport or Hierarchy.
2. In the Inspector Transform card, enter exact values for Position, Rotation, or Scale.
3. Every transform triggers `editor.events.emit('entity:transformed', entity)`.

## 💻 Code Examples & Action Recipes
### AI Copilot Action Block
```json:actions
{
  "actions": [
    {
      "action": "modify_entity",
      "name": "selected",
      "position": [5.0, 0.0, -10.0],
      "rotation": [0.0, 45.0, 0.0],
      "scale": [1.0, 1.0, 1.0]
    }
  ]
}
```
