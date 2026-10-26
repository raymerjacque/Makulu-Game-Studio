---
name: configure-lights
category: lighting-and-atmosphere
tags: [light, directional, point, spot, shadows]
description: "Spawn and adjust Directional, Point, and Spot lights with custom color, intensity, and shadow casting."
---

# Configure Lights Skill

## 🎯 When to Use This Skill
Use this skill to illuminate the 3D scene, create daytime sunlight, torch light, neon glow, or dramatic spotlights.

## 🔑 Key Concepts & Architecture
- PlayCanvas `light` component supports three types:
  - `directional`: Infinitely distant sun/moon with parallel rays. Casts shadows over large areas.
  - `point`: Omnidirectional light bulb radiating in all directions within `range`.
  - `spot`: Conical flashlight beam defined by `innerConeAngle` and `outerConeAngle`.
- Key properties:
  - `color`: [R, G, B] in range [0, 1].
  - `intensity`: Brightness multiplier (typically 1.0 to 10.0).
  - `range`: Maximum distance of light reach (point/spot).
  - `castShadows`: Boolean enabling real-time shadow map generation.

## 🛠️ Step-by-Step Implementation Guide
1. **Via Topbar Menu:** Click **Add Light ▾** and choose Directional, Point, or Spot Light.
2. **Via Inspector:** Select the light entity and tweak Color, Intensity, Range, or Shadows.
3. **Via AI Copilot:**
   ```json:actions
   {
     "actions": [
       {
         "action": "create_light",
         "type": "point",
         "name": "TorchLight",
         "position": [0, 2.5, 0],
         "color": [1.0, 0.6, 0.2],
         "intensity": 3.0,
         "range": 12.0
       }
     ]
   }
   ```
