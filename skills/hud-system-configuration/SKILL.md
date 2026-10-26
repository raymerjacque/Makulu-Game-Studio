---
name: hud-system-configuration
category: ui-and-hud
tags: [hud, ui, healthbar, ammo, crosshair, minimap]
description: "Customize on-screen HUD elements: health bar, ammo counter, crosshairs, and minimap."
---

# HUD System Configuration Skill

## 🎯 When to Use This Skill
Use this skill to configure game player stats and display them over the 3D viewport.

## 🔑 Key Concepts & Architecture
- Configured via `editor.hudConfig` in `editor/src/core/editor.js`.
- Elements:
  - `health`: Current HP, max HP, bar color, label (e.g. "Armor", "Shield", "Life").
  - `ammo`: Active weapon and remaining ammunition.
  - `score`: Combo multiplier and point counter.
  - `crosshair`: Center screen aiming reticle.
  - `minimap`: Top-down radar view of surroundings.
