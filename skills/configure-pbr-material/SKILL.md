---
name: configure-pbr-material
category: materials-and-shaders
tags: [material, pbr, metalness, roughness, diffuse, emissive]
description: "Create and customize physically-based rendering (PBR) materials on any entity."
---

# Configure PBR Material Skill

## 🎯 When to Use This Skill
Use this skill when changing an object's visual appearance: color, metallic sheen, surface roughness, glow, or transparency.

## 🔑 Key Concepts & Architecture
- Uses `pc.StandardMaterial`.
- Core properties:
  - `diffuse`: Base surface color [R, G, B] (0 to 1).
  - `metalness`: Metallic reflection (0 = non-metal/dielectric, 1 = polished metal).
  - `roughness`: Surface smoothness (0 = glossy mirror, 1 = rough matte).
  - `emissive`: Glowing light emitted by surface [R, G, B].
  - `opacity`: Alpha transparency (0 to 1), with `blendType = pc.BLEND_NORMAL` when < 1.0.

## 🛠️ Step-by-Step Implementation Guide
1. Select entity with a `render` component.
2. In the Inspector Material card, tweak Diffuse color, Metalness, Roughness, or Emissive color.
3. In JavaScript:
   ```javascript
   const mat = new pc.StandardMaterial();
   mat.diffuse = new pc.Color(0.2, 0.6, 1.0);
   mat.metalness = 0.8;
   mat.roughness = 0.2;
   mat.update();
   entity.render.material = mat;
   ```

## 💻 Code Examples & Action Recipes
### AI Copilot Action Block
```json:actions
{
  "actions": [
    {
      "action": "create_material",
      "target": "selected",
      "diffuse": [0.1, 0.8, 0.4],
      "metalness": 0.5,
      "roughness": 0.3,
      "emissive": [0.0, 0.2, 0.1]
    }
  ]
}
```
