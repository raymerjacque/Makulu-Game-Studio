---
name: shield-generator
category: ai-and-combat
tags: [shield, armor, overshield, recharge]
description: "Add energy shields that absorb incoming combat damage before health is depleted."
---

# Shield Generator Skill

## 🎯 When to Use This Skill
Use this skill for Halo/Destiny style recharging overshields on sci-fi characters.

## 🔑 Key Concepts & Architecture
- Behavior: `shield_generator`.
- Parameters:
  - `maxShield`: Maximum shield capacity (default: 50).
  - `rechargeRate`: Shield points restored per second (default: 10.0).
  - `rechargeDelay`: Delay after taking damage before shields recharge (default: 3.0s).
- First absorbs 100% of damage until depleted, passing remaining overflow to health.
