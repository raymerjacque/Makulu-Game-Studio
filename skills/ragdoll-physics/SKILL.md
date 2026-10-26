---
name: ragdoll-physics
category: physics-and-constraints
tags: [ragdoll, death, defeat, collapse, physics]
description: "Trigger dynamic ragdoll physics collapse and impulses upon character defeat."
---

# Ragdoll Physics Skill

## 🎯 When to Use This Skill
Use this skill on enemy or player characters so they collapse physically upon death rather than vanishing abruptly.

## 🔑 Key Concepts & Architecture
- Attached behavior: `ragdoll_physics`.
- When an entity's health reaches 0:
  - Unlocks `entity.rigidbody.angularFactor = [1, 1, 1]` and `linearFactor = [1, 1, 1]`.
  - Applies a randomized physical impulse (`applyImpulse`) sending the body tumbling realistically.
