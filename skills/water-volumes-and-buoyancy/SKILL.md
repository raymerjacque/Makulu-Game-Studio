---
name: water-volumes-and-buoyancy
category: interactive-world
tags: [water, swimming, buoyancy, ocean]
description: "Spawn semi-transparent buoyant water volumes with upward floating physics forces."
---

# Water Volumes and Buoyancy Skill

## 🎯 When to Use This Skill
Use this skill for oceans, swimming lakes, rivers, or sewer drainage pits.

## 🔑 Key Concepts & Architecture
- Action: `create_water_volume`.
- Behavior: `water_volume`.
- Parameters: `buoyancyForce` (default: 12.0), `extents: [w, h, d]`.
- Applies an upward physical impulse against gravity to any dynamic rigidbody inside the volume.
