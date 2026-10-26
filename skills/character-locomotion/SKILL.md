---
name: character-locomotion
category: character-locomotion
tags: [locomotion, walk, idle, run, wasd, enemy-ai]
description: "Drive seamless velocity-based transitions between Idle and Walk/Sprint animations when characters move."
---

# Character Locomotion Skill

## 🎯 When to Use This Skill
Use this skill whenever a character entity moves in the world via player input (`wasd`, `first_person_controller`) or AI navigation (`enemy_ai`, `patrol`, `waypoint_patrol`).

## 🔑 Key Concepts & Architecture
- Evaluated by `BehaviorManager.updateLocomotion(entity, speed, isMoving, dt)` in `editor/src/core/behaviors.js`.
- **Moving State (`isMoving = true`):**
  - Cross-fades to the walk clip (`animComp.baseLayer.transition(walkClip, 0.15)`).
  - If speed exceeds sprint threshold (> 7.0) and a sprint/run clip is available, transitions to sprint.
  - Updates anim float parameter: `animComp.setFloat('speed', speed)`.
- **Stationary State (`isMoving = false`):**
  - Smoothly cross-fades back to the idle clip (`animComp.baseLayer.transition(idleClip, 0.2)`).
  - Updates anim float parameter: `animComp.setFloat('speed', 0)`.

## 🛠️ Step-by-Step Implementation Guide
1. Attach `wasd` behavior to an animated character entity.
2. Click **Simulate** or compile the standalone game.
3. Pressing `W`, `A`, `S`, `D` immediately walks or runs the character with natural leg and arm movement!
