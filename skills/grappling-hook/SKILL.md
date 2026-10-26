---
name: grappling-hook
category: player-controllers
tags: [grapple, hook, swing, traversal]
description: "Launch grappling hook cables to swing and pull toward distant target surfaces."
---

# Grappling Hook Skill

## 🎯 When to Use This Skill
Use this skill for Batman/Spider-Man style grappling traversal across rooftops and chasms.

## 🔑 Key Concepts & Architecture
- Behavior: `grappling_hook`.
- Parameters:
  - `pullSpeed`: Speed at which player is drawn toward the anchor (default: 18.0).
  - `maxDistance`: Maximum reach of the grappling ray (default: 35.0).
- Triggered by key press (`E` or `G`).
