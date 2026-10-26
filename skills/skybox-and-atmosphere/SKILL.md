---
name: skybox-and-atmosphere
category: lighting-and-atmosphere
tags: [skybox, atmosphere, environment, preset, ambient]
description: "Switch and customize scene sky atmosphere presets: Clear Day, Sunset, Cyberpunk, Foggy Valley, and Night."
---

# Skybox and Atmosphere Skill

## 🎯 When to Use This Skill
Use this skill when changing the world ambiance, time of day, or stylistic theme of your level.

## 🔑 Key Concepts & Architecture
- Managed in `editor/src/core/runtime.js` (`setAtmosphere(preset)`).
- Available presets:
  - `day`: Warm sunny sky, soft blue ambient light, crisp directional sun.
  - `sunset`: Golden orange horizon, deep purple zenith, long shadows.
  - `cyberpunk`: Deep midnight blue with neon magenta and cyan highlights.
  - `foggy`: Overcast grey sky with thick low-visibility fog falloff.
  - `night`: Dark starry sky with cool moonlit illumination.

## 🛠️ Step-by-Step Implementation Guide
1. Click **Atmosphere ▾** in the Viewport Toolbar or Topbar and select any preset.
2. In AI Copilot: Use `set_sky_atmosphere` action.

## 💻 Code Examples & Action Recipes
### AI Copilot Action Block
```json:actions
{
  "actions": [
    {
      "action": "set_sky_atmosphere",
      "preset": "sunset"
    }
  ]
}
```
