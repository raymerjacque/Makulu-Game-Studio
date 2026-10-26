---
name: stealth-ai
category: ai-and-combat
tags: [stealth, vision-cone, fov, detection]
description: "Implement field-of-view vision cone detection for stealth games and guard evasion."
---

# Stealth AI Skill

## 🎯 When to Use This Skill
Use this skill for Metal Gear / Splinter Cell style infiltration games where players must sneak behind guards without being seen.

## 🔑 Key Concepts & Architecture
- Behavior: `stealth_ai`.
- Parameters:
  - `visionAngle`: Field-of-view cone angle in degrees (default: 60°).
  - `detectRadius`: Maximum eyesight range (default: 15.0).
  - `speed`: Alert pursuit speed (default: 2.5).
