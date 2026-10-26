---
name: victory-and-game-over
category: progression-and-flow
tags: [victory, gameover, win, defeat, hud]
description: "Configure Victory fanfare screens, Game Over screens, and restart mechanics."
---

# Victory and Game Over Skill

## 🎯 When to Use This Skill
Use this skill for end-of-level finish lines, boss arenas, or death screens.

## 🔑 Key Concepts & Architecture
- In HUD config: `hudConfig.victory` and `hudConfig.gameover`.
- Triggered by:
  - `win_level` trigger action.
  - Player health reaching 0 (without checkpoints).
- Standalone HTML game renders full-screen overlays with **Play Again** buttons.
