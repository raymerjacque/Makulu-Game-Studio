---
name: jetpack-controller
category: player-controllers
tags: [jetpack, flight, fuel, thrust, vertical]
description: "Add vertical jetpack thrust, fuel depletion, and recharging mechanics."
---

# Jetpack Controller Skill

## 🎯 When to Use This Skill
Use this skill for sci-fi platformers, aerial combat, or vertical exploration.

## 🔑 Key Concepts & Architecture
- Behavior: `jetpack`.
- Parameters:
  - `fuel`: Maximum fuel capacity (default: 100).
  - `thrust`: Upward lift acceleration (default: 15.0).
  - `rechargeRate`: Fuel recovery per second when grounded (default: 20.0).
- Activated by holding `Spacebar` or `C`.
