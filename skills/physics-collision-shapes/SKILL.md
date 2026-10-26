---
name: physics-collision-shapes
category: physics-and-constraints
tags: [collision, collider, box, sphere, capsule, mesh]
description: "Assign and size physics collision bounding shapes for physical contact and raycasting."
---

# Physics Collision Shapes Skill

## 🎯 When to Use This Skill
Must always accompany a `rigidbody` component so the physics engine knows the shape of the collider.

## 🔑 Key Concepts & Architecture
- Shapes supported:
  - `box`: Defined by `halfExtents: [x, y, z]`. Perfect for crates, walls, and platforms.
  - `sphere`: Defined by `radius`. Best for balls, coins, and projectiles.
  - `capsule`: Defined by `radius` and `height`. Standard industry shape for humanoid characters.
  - `cylinder`: Defined by `radius` and `height`. Useful for barrels, pillars, and wheels.
  - `mesh`: Exact triangle mesh collision (static terrain only).

## ⚠️ Common Pitfalls & Edge Cases
- Dynamic rigidbodies should **never** use arbitrary `mesh` colliders as performance will degrade; always use convex primitives (`box`, `sphere`, or `capsule`).
