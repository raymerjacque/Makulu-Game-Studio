---
name: pressure-plates
category: interactive-world
tags: [pressure-plate, switch, trigger, puzzle]
description: "Create floor pressure switches that trigger target entities or toggle doors when stepped on."
---

# Pressure Plates Skill

## 🎯 When to Use This Skill
Use this skill for dungeon floor traps, secret doors, and cooperative switches.

## 🔑 Key Concepts & Architecture
- Behavior: `pressure_plate`.
- Parameters:
  - `radius`: Trigger detection radius (default: 1.5).
  - `targetEntity`: Name of the entity to toggle or activate.
