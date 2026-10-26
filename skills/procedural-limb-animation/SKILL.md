---
name: procedural-limb-animation
category: character-locomotion
tags: [procedural, limbs, walk-cycle, modular, swing]
description: "Apply procedural harmonic leg and arm walk cycle swinging for blocky or modular models without bones."
---

# Procedural Limb Animation Skill

## 🎯 When to Use This Skill
Use this skill for custom characters, robots, or blocky Minecraft/Roblox-style models that lack embedded skeletal bones but have limb child nodes.

## 🔑 Key Concepts & Architecture
- Locates child limb nodes: `leg-left`, `leg-right`, `arm-left`, `arm-right` (or `LeftLeg`, `RightLeg`, etc.).
- Accumulates movement phase: `entity._locoPhase += dt * speed * 2.5`.
- **Opposing Harmonics:**
  - Legs swing on local X-axis: `legAngle = Math.sin(_locoPhase) * 26°`.
  - Left leg = `+legAngle`, Right leg = `-legAngle`.
  - Arms swing in opposition to legs: Left arm = `-legAngle * 0.7`, Right arm = `+legAngle * 0.7`.
- When stopped, smoothly restores limb rotations to neutral [0, 0, 0].
