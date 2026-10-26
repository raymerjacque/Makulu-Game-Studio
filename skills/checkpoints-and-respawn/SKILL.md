---
name: checkpoints-and-respawn
category: progression-and-flow
tags: [checkpoint, respawn, death, flag]
description: "Place checkpoint markers that save player progress and restore health on defeat."
---

# Checkpoints and Respawn Skill

## 🎯 When to Use This Skill
Use this skill across long levels, dungeon floors, or difficult obstacle sections.

## 🔑 Key Concepts & Architecture
- Behavior: `checkpoint_system`.
- When player enters proximity radius:
  - Registers `player._respawnCheckpoint = checkpointEntity.getPosition()`.
  - Displays HUD toast: "🚩 Respawn checkpoint updated!".
- Upon defeat, player is teleported back to the active checkpoint with health restored.
