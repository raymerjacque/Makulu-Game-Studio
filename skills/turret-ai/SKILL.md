---
name: turret-ai
category: ai-and-combat
tags: [turret, defense, projectiles, targeting]
description: "Deploy defensive turrets that track the player within range and fire laser projectiles."
---

# Turret AI Skill

## 🎯 When to Use This Skill
Use this skill for stationary defense towers, sci-fi turrets, or castle archer towers.

## 🔑 Key Concepts & Architecture
- Behavior: `turret_ai`.
- Parameters:
  - `range`: Target acquisition distance (default: 20.0).
  - `fireRate`: Seconds between projectile discharges (default: 1.5).
  - `damage`: Projectile impact damage (default: 15).
  - `bulletSpeed`: Bullet travel velocity (default: 25.0).
