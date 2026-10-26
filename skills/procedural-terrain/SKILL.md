---
name: procedural-terrain
category: models-and-assets
tags: [terrain, perlin-noise, heightmap, sculptor, mountains]
description: "Generate multi-octave Perlin noise 3D terrain heightmaps with biomes and collision."
---

# Procedural Terrain Skill

## 🎯 When to Use This Skill
Use this skill to spawn natural mountains, valleys, islands, and rolling hills with elevation-based coloring.

## 🔑 Key Concepts & Architecture
- Managed via `create_terrain` action and Terrain Sculptor modal.
- Generates a mesh with resolution (16×16 up to 128×128 vertices).
- Elevation biomes:
  - Shore / Sand (Low)
  - Lush Grass (Mid)
  - Mountain Rock (High)
  - Snow Peak (Max altitude)
- Automatically attaches a `collision` component with type `mesh` for walking on slopes.
