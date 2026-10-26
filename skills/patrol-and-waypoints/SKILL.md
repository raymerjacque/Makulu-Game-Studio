---
name: patrol-and-waypoints
category: ai-and-combat
tags: [patrol, waypoints, navigation, routes]
description: "Set up back-and-forth linear patrol routes or multi-node 3D waypoint circuits."
---

# Patrol and Waypoints Skill

## 🎯 When to Use This Skill
Use this skill for perimeter guards, wandering animals, or patrolling security drones.

## 🔑 Key Concepts & Architecture
- Behaviors available:
  - `patrol`: Moves along a single axis back and forth across a fixed `distance` from start position.
  - `waypoint_patrol`: Accepts an array of 3D coordinates `waypoints: [[x,y,z], ...]` and navigates smoothly between them in a loop.
- Parameters: `speed`, `distance`, `waypoints`.
