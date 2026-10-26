---
name: light-flicker-and-cycle
category: lighting-and-atmosphere
tags: [light-flicker, spotlight-flicker, color-cycle, torch]
description: "Attach procedural Perlin noise flickering to torches or smooth RGB color cycling to party lights."
---

# Light Flicker and Color Cycle Skill

## 🎯 When to Use This Skill
Use this skill to make campfires feel alive, horror lights flicker intermittently, or arcade lights cycle through rainbow hues.

## 🔑 Key Concepts & Architecture
- Behaviors available in `BehaviorManager`:
  - `light_flicker`: Modulates `light.intensity = base + noise` with Perlin variance.
  - `spotlight_flicker`: Intermittently cuts spotlight intensity to 0 for horror effects.
  - `light_color_cycle`: Uses harmonic sine waves to cycle RGB colors: `r = sin(t), g = sin(t+2.09), b = sin(t+4.18)`.

## 💻 Code Examples & Action Recipes
### AI Copilot Action Block
```json:actions
{
  "actions": [
    {
      "action": "attach_behavior",
      "target": "Torch_Pillar",
      "behavior": "light_flicker",
      "properties": {
        "baseIntensity": 2.5,
        "variance": 0.8
      }
    }
  ]
}
```
