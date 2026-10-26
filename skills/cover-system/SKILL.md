---
name: cover-system
category: ai-and-combat
tags: [cover, crouch, mitigation, tactical]
description: "Enable tactical cover mechanics reducing incoming enemy damage by 75%."
---

# Cover System Skill

## 🎯 When to Use This Skill
Use this skill for tactical shooters (Gears of War / The Division) where crouching behind barricades protects players.

## 🔑 Key Concepts & Architecture
- Behavior: `cover_system`.
- Parameters:
  - `damageReduction`: Multiplier mitigation (default: 0.75 / 75%).
- Triggered by pressing `C` or `Ctrl` near a barricade or obstacle.
