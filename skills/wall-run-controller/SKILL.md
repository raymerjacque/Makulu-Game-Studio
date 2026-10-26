---
name: wall-run-controller
category: player-controllers
tags: [wall-run, parkour, titanfall, movement]
description: "Implement wall-running parkour movement along vertical obstacle surfaces."
---

# Wall Run Controller Skill

## 🎯 When to Use This Skill
Use this skill for high-speed parkour games, ninja acrobats, or fast-paced arena movement.

## 🔑 Key Concepts & Architecture
- Behavior: `wall_run_controller`.
- Parameters:
  - `speed`: Forward wall-run speed (default: 10.0).
  - `climbRate`: Vertical climb or subtle descent rate (default: 0.5).
  - `jumpForce`: Impulse force when wall-jumping off the wall (default: 12.0).
