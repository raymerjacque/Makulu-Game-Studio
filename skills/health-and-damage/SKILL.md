---
name: health-and-damage
category: ai-and-combat
tags: [health, damage, hp, heal, pickup]
description: "Manage entity health pools, take damage, apply invincibility frames, and collect health pickups."
---

# Health and Damage Skill

## 🎯 When to Use This Skill
Use this skill on players, breakable targets, and enemies to govern life, injury, and healing.

## 🔑 Key Concepts & Architecture
- Evaluated centrally in `BehaviorManager.applyDamage(entity, amount, sourceName)`.
- Behaviors:
  - `health`: Stores `maxHp` and `currentHp` (default: 100).
  - `target_health`: For destructible crates, doors, and boss targets.
  - `health_pickup`: Restores `healAmount` on contact.
  - `health_regen`: Passively regenerates HP per second after a delay.
