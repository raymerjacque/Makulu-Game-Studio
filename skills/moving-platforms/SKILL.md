---
name: moving-platforms
category: interactive-world
tags: [platform, elevator, lift, shuttle]
description: "Build vertical elevators and horizontal moving shuttle platforms with smooth direction reversal."
---

# Moving Platforms Skill

## 🎯 When to Use This Skill
Use this skill for platforming challenges, rising elevators, and shuttles over lava pits.

## 🔑 Key Concepts & Architecture
- Behavior: `moving_platform`.
- Parameters:
  - `axis`: Movement direction ('x', 'y', or 'z').
  - `speed`: Travel velocity (default: 2.5).
  - `distance`: Total travel distance before reversing (default: 8.0).
