---
name: wasd-player-controller
category: player-controllers
tags: [wasd, movement, player, keyboard, controls]
description: "Turn any entity into a playable character with planar WASD and arrow-key movement."
---

# WASD Player Controller Skill

## 🎯 When to Use This Skill
Use this skill whenever creating a playable character (third-person hero, top-down hero, or arcade avatar).

## 🔑 Key Concepts & Architecture
- Behavior: `wasd`.
- Parameters: `speed` (default: 8.0 units/sec).
- Features:
  - Responsive keyboard reading (`W`, `A`, `S`, `D` and Arrow Keys).
  - Calculates planar camera-relative or entity-forward vectors.
  - Teleports/updates velocity when `rigidbody` is present.
  - Automatically drives `BehaviorManager.updateLocomotion` so the character walks when moving and idles when stopped!

## 💻 Code Examples & Action Recipes
### AI Copilot Action Block
```json:actions
{
  "actions": [
    {
      "action": "attach_behavior",
      "target": "Knight_Hero",
      "behavior": "wasd",
      "properties": {
        "speed": 8.0
      }
    }
  ]
}
```
