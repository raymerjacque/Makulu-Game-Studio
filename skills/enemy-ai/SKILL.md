---
name: enemy-ai
category: ai-and-combat
tags: [enemy, ai, pursuit, combat, attack]
description: "Implement autonomous enemy tracking, pursuit, attack distance checks, and melee damage."
---

# Enemy AI Skill

## 🎯 When to Use This Skill
Use this skill on guards, monsters, zombies, or adversarial NPCs that should detect and hunt down the player.

## 🔑 Key Concepts & Architecture
- Behavior: `enemy_ai`.
- Parameters:
  - `speed`: Chasing speed (default: 3.5).
  - `detectRadius`: Distance threshold where enemy notices player (default: 15.0).
  - `attackRadius`: Melee strike range (default: 1.8).
  - `damage`: Attack damage per strike (default: 15.0).
  - `attackRate`: Attack cooldown in seconds (default: 1.0).
- Automatically triggers `BehaviorManager.updateLocomotion` so the enemy walks when chasing and returns to idle when waiting.

## 💻 Code Examples & Action Recipes
### AI Copilot Action Block
```json:actions
{
  "actions": [
    {
      "action": "attach_behavior",
      "target": "Goblin_Warrior",
      "behavior": "enemy_ai",
      "properties": {
        "speed": 4.0,
        "detectRadius": 18.0,
        "damage": 20.0
      }
    }
  ]
}
```
