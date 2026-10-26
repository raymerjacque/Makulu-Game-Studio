---
name: spawn-primitive
category: models-and-assets
tags: [primitive, box, sphere, capsule, cylinder, cone, plane]
description: "Spawn geometric 3D primitives with render, material, and collision components."
---

# Spawn Primitive Skill

## 🎯 When to Use This Skill
Use this skill when building greybox levels, architectural walls, floors, obstacles, collision volumes, or simple objects.

## 🔑 Key Concepts & Architecture
- Supported primitive types: `box`, `sphere`, `capsule`, `cylinder`, `cone`, `plane`.
- Created via `editor.createPrimitive(type, options)`.
- Automatically adds a `render` component with a default `pc.StandardMaterial` and matching `collision` component.

## 🛠️ Step-by-Step Implementation Guide
1. **Via Topbar Menu:** Click **Add Entity ▾ -> 3D Primitives** and select Box, Sphere, Capsule, Cylinder, Cone, or Plane.
2. **Via AI Copilot:** Use `spawn_primitive` action specifying type, position, and dimensions.
3. **Via JavaScript API:**
   ```javascript
   const ground = editor.createPrimitive('plane', {
     name: 'Floor_Main',
     position: [0, 0, 0],
     scale: [20, 1, 20]
   });
   ```

## 💻 Code Examples & Action Recipes
### AI Copilot Action Block
```json:actions
{
  "actions": [
    {
      "action": "spawn_primitive",
      "type": "box",
      "name": "Wall_East",
      "position": [10, 2.5, 0],
      "scale": [1, 5, 20]
    }
  ]
}
```
