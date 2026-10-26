---
name: interactive-doors-and-keys
category: interactive-world
tags: [door, key, lock, gate, puzzle]
description: "Create proximity-opening doors, locked dungeon gates, and collectible key pickups."
---

# Interactive Doors and Keys Skill

## 🎯 When to Use This Skill
Use this skill for adventure puzzle doors, dungeon gates, and treasure vaults.

## 🔑 Key Concepts & Architecture
- Behaviors:
  - `interactive_door`: Automatically swings open when player enters `radius` (default: 3.0m).
  - `locked_door`: Requires player to possess a named key in inventory (`requiredKey`).
  - `key_pickup`: Collectible item providing `keyName` to player upon contact.
