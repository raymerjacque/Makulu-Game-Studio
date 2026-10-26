---
name: apply-material-presets
category: materials-and-shaders
tags: [presets, gold, neon, lava, water, wood, stone]
description: "Instantly apply pre-tuned PBR material presets to entities."
---

# Apply Material Presets Skill

## 🎯 When to Use This Skill
Use this skill for rapid prototyping when you need authentic physical materials without tweaking individual slider values.

## 🔑 Key Concepts & Architecture
- Supported presets:
  - `gold`: Metallic yellow, low roughness, highly specular.
  - `neon`: Vibrant blue with strong emissive glow.
  - `lava`: Intense red/orange emissive with dark stone crust.
  - `water`: Semi-transparent cyan with smooth specular sheen.
  - `stone`: Matte grey with high roughness and no metalness.
  - `wood`: Warm brown with moderate roughness.

## 💻 Code Examples & Action Recipes
### AI Copilot Action Block
```json:actions
{
  "actions": [
    {
      "action": "apply_material_preset",
      "target": "Courtyard_Statue",
      "preset": "gold"
    }
  ]
}
```
