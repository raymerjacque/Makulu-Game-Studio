---
name: sensor-triggers-and-teleport
category: interactive-world
tags: [trigger, sensor, teleport, portal, events]
description: "Register invisible sensor zones that teleport players, award points, or trigger scene events."
---

# Sensor Triggers and Teleport Skill

## 🎯 When to Use This Skill
Use this skill for wormhole portals, invisible trap boundaries, and score collection zones.

## 🔑 Key Concepts & Architecture
- Managed by `TriggerSystem` in `editor/src/core/triggers.js`.
- Event types: `on_enter`, `on_exit`.
- Trigger actions:
  - `teleport`: Transports player to `targetPosition: [x, y, z]`.
  - `win_level`: Triggers Victory Screen and level completion fanfare.
  - `add_score`: Increments player HUD score.
