---
name: projectile-shooter
category: ai-and-combat
tags: [gun, projectile, shooter, bullet, fire]
description: "Equip characters with weapon shooting mechanics, spawning high-speed projectiles on key press."
---

# Projectile Shooter Skill

## 🎯 When to Use This Skill
Use this skill when giving players laser blasters, magic missiles, fireballs, or cannons.

## 🔑 Key Concepts & Architecture
- Behavior: `projectile_shooter`.
- Parameters:
  - `speed`: Bullet travel velocity (default: 30.0).
  - `damage`: Impact damage (default: 35.0).
  - `cooldown`: Minimum delay between shots (default: 0.25s).
- Triggered with `F`, `E`, or `Left Click`.
