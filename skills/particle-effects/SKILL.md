---
name: particle-effects
category: audio-and-sfx
tags: [particles, fire, smoke, snow, rain, sparks]
description: "Spawn and configure particle emitters for fire, smoke, sparks, snow, and rain."
---

# Particle Effects Skill

## 🎯 When to Use This Skill
Use this skill for torches, chimney smoke, magic portals, weather, or explosion debris.

## 🔑 Key Concepts & Architecture
- PlayCanvas `particlesystem` component.
- Properties:
  - `numParticles`: Total active particle pool (e.g. 60 to 500).
  - `lifetime`: Lifespan in seconds before particle fades (default: 1.5).
  - `rate`: Emission frequency (default: 0.05).
  - `particleScale`: Size multiplier.
  - `colorTint`: [R, G, B] particle tinting.
