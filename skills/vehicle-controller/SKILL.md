---
name: vehicle-controller
category: player-controllers
tags: [vehicle, car, steering, driving, acceleration]
description: "Drive cars, buggies, or speedboats with acceleration, steering, and braking physics."
---

# Vehicle Controller Skill

## 🎯 When to Use This Skill
Use this skill when placing drivable vehicles, speedboats, or racing avatars.

## 🔑 Key Concepts & Architecture
- Behavior: `vehicle_controller`.
- Parameters:
  - `topSpeed`: Maximum forward velocity (default: 25.0).
  - `accel`: Acceleration rate (default: 15.0).
  - `steerSpeed`: Turning angular velocity (default: 60 deg/s).
- Controls: `W` (Accelerate), `S` (Reverse/Brake), `A`/`D` (Steer).
