---
name: enemy-spawner
category: ai-and-combat
tags: [spawner, waves, portal, respawn]
description: "Spawn repeated waves of enemies from portals, nests, or doors at regular intervals."
---

# Enemy Spawner Skill

## 🎯 When to Use This Skill
Use this skill for horde survival modes, monster nests, zombie gates, or continuous wave generators.

## 🔑 Key Concepts & Architecture
- Behavior: `enemy_spawner`.
- Parameters:
  - `interval`: Delay in seconds between spawns (default: 6.0).
  - `maxEnemies`: Cap on simultaneously active enemies spawned by this portal.
