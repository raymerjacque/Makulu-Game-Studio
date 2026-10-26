---
name: dash-boost
category: player-controllers
tags: [dash, boost, dodge, burst-speed]
description: "Execute instant directional dash bursts with cooldowns and camera impact."
---

# Dash Boost Skill

## 🎯 When to Use This Skill
Use this skill for soulslike dodge rolls, anime burst dashes, or rapid combat repositioning.

## 🔑 Key Concepts & Architecture
- Behavior: `dash_boost`.
- Parameters:
  - `force`: Dash burst impulse strength (default: 25.0).
  - `cooldown`: Delay in seconds between dashes (default: 1.2).
- Triggered with `Shift` key.
