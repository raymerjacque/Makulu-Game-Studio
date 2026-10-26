---
name: configure-rigidbody-physics
category: physics-and-constraints
tags: [physics, rigidbody, ammo, mass, friction, restitution]
description: "Configure authentic Ammo.js physics rigidbodies with mass, friction, bounce, and degree-of-freedom factors."
---

# Configure Rigidbody Physics Skill

## 🎯 When to Use This Skill
Use this skill on any entity that needs to fall under gravity, collide with other objects, bounce, or roll.

## 🔑 Key Concepts & Architecture
- Powered by Ammo.js (WebAssembly Bullet Physics).
- Body Types:
  - `static`: Immovable scenery (floors, walls, cliffs). Infinite mass (`mass = 0`).
  - `dynamic`: Fully simulated physics body responding to gravity and impulses.
  - `kinematic`: Moved by code or animation, pushes dynamic bodies without being pushed back.
- Properties:
  - `mass`: Weight in kilograms (e.g. 1.0 for boxes, 80 for characters).
  - `friction`: Surface grip (0 = ice, 1 = rubber).
  - `restitution`: Bounciness (0 = thud, 1 = super ball).
  - `linearFactor`: [X, Y, Z] lock axes (e.g. [1, 1, 1] free, or [1, 0, 1] locked vertically).
  - `angularFactor`: [X, Y, Z] rotational locks (e.g. [0, 1, 0] upright character lock).

## 🛠️ Step-by-Step Implementation Guide
1. Select entity.
2. In the Inspector, click **➕ Add Component** and select **Rigidbody Physics**.
3. Choose Static or Dynamic and set Mass and Restitution.
