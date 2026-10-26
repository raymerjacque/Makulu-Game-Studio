---
name: physics-joint-constraints
category: physics-and-constraints
tags: [joints, constraints, hinge, point-to-point, ragdoll]
description: "Link two entities with physics joint constraints (hinges, swinging doors, ball joints)."
---

# Physics Joint Constraints Skill

## 🎯 When to Use This Skill
Use this skill to build swinging saloon doors, hanging chains, pendulums, rope bridges, or wrecking balls.

## 🔑 Key Concepts & Architecture
- Implemented via `entity.joint` and evaluated in both editor runtime and GameBundler.
- Joint Types:
  - `hinge`: Constrains rotation to a single axis (doors, gates, levers).
  - `point_to_point`: Keeps two points anchored at a fixed distance (chains, ropes, pendants).
  - `ball_socket`: 3-DOF rotation around a spherical socket anchor.
- Target entity: name of the entity this joint attaches to.
- Pivot: `[x, y, z]` local offset from the anchor.

## 🛠️ Step-by-Step Implementation Guide
1. In the Inspector on the moving entity, add the Joint constraint.
2. Select target anchor entity and joint type (`hinge` or `point_to_point`).
