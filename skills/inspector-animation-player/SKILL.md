---
name: inspector-animation-player
category: character-locomotion
tags: [inspector, animation-player, preview, clips]
description: "Preview, switch, and control character animation clips directly from the Inspector UI."
---

# Inspector Animation Player Skill

## 🎯 When to Use This Skill
Use this skill to preview all available animation clips on an imported character model, test playback, or adjust animation speed.

## 🔑 Key Concepts & Architecture
- Located in `editor/src/ui/inspector.js` under **💃 Skeletal Animation Player**.
- Features:
  - **Current Clip Badge:** Displays the currently playing animation state.
  - **Clip Selector Dropdown (`#anim-clip-select`):** Lists every animation clip found in the model.
  - **▶ Play Clip / ⏸ Pause:** Starts or pauses playback.
  - **Speed Slider (`#anim-speed`):** Multiplies playback speed from 0.1× to 2.5×.
  - **🕺 Edit Animation Blend Graph:** Opens the visual node state machine modal.

## 🛠️ Step-by-Step Implementation Guide
1. Select any character model in the Hierarchy (e.g. `character_hero`).
2. Scroll to the **💃 Skeletal Animation Player** card in the Inspector.
3. Select any clip (e.g. `attack-melee-right`, `walk`, `die`) from the dropdown to preview it immediately.
