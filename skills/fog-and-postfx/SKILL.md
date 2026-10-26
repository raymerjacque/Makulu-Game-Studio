---
name: fog-and-postfx
category: lighting-and-atmosphere
tags: [fog, postfx, exposure, atmosphere, fogginess]
description: "Configure exponential squared atmospheric fog density, fog color, and camera exposure tone-mapping."
---

# Fog and PostFX Skill

## 🎯 When to Use This Skill
Use this skill to create mysterious dungeons, eerie swamps, or vast horizons that hide far clip clipping planes.

## 🔑 Key Concepts & Architecture
- Uses PlayCanvas `pc.FOG_EXP2` (exponential squared fog).
- Properties:
  - `scene.fog`: 'exp2', 'exp', 'linear', or 'none'.
  - `scene.fogColor`: [R, G, B].
  - `scene.fogDensity`: Typically `0.01` to `0.08`.
  - Camera `exposure`: Multiplier for overall scene luminance.

## 💻 Code Examples & Action Recipes
### AI Copilot Action Block
```json:actions
{
  "actions": [
    {
      "action": "set_postfx",
      "exposure": 1.2,
      "fog": {
        "color": [0.3, 0.4, 0.5],
        "density": 0.03
      }
    }
  ]
}
```
