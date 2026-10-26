---
name: first-person-controller
category: player-controllers
tags: [fpc, fps, first-person, mouselook, wasd]
description: "Lock camera to entity head height with mouse-look and strafe controls for FPS games."
---

# First Person Controller Skill

## 🎯 When to Use This Skill
Use this skill when making first-person shooters, dungeon crawlers, or exploratory walking simulators.

## 🔑 Key Concepts & Architecture
- Behavior: `first_person_controller`.
- Parameters:
  - `speed`: Strafe/run speed (default: 10.0).
  - `rotSpeed`: Keyboard turning speed (default: 90 deg/s).
  - `sensitivity`: Mouse-look pointer lock sensitivity (default: 0.15).
- Automatically locks the main camera to `entity.getPosition() + [0, 1.6, 0]` (average human eye height).
- Enables browser pointer lock on canvas click.
