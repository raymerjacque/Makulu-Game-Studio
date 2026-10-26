---
name: boss-ai
category: ai-and-combat
tags: [boss, boss-ai, phases, enrage, aoe]
description: "Create multi-phase boss encounters with health thresholds, enrage speed multipliers, and screen-shaking attacks."
---

# Boss AI Skill

## 🎯 When to Use This Skill
Use this skill for end-of-level bosses, dungeon titans, or climactic encounters.

## 🔑 Key Concepts & Architecture
- Behavior: `boss_ai`.
- Parameters:
  - `maxHp`: Total boss health pool (default: 500).
  - `speed`: Base walking speed (default: 3.0).
  - `damage`: Base strike damage (default: 30).
  - `enrageThreshold`: Health percentage triggering enrage mode (default: 0.4 / 40%).
- Enraged Phase: Multiplies movement speed by 1.5×, halves attack cooldown, and increases damage output by 50%.
- Triggers victory sound and fanfare upon defeat.
