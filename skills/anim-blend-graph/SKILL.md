---
name: anim-blend-graph
category: character-locomotion
tags: [state-machine, blend-tree, transitions, graph]
description: "Build and edit visual animation state machines with custom conditions and blend times in AnimBlendModal."
---

# Visual Animation Blend Graph Skill

## 🎯 When to Use This Skill
Use this skill when authoring complex character animation logic (such as combat combos, jumping, falling, and transitions between idle, walk, and run).

## 🔑 Key Concepts & Architecture
- Modal implemented in `editor/src/ui/anim-blend-modal.js`.
- Nodes represent animation states (`Idle`, `Walk`, `Run`, `Jump`).
- Connections represent transitions with conditions:
  - `speed > 0.1` -> Walk
  - `speed <= 0.1` -> Idle
  - `speed > 5.0` -> Run
  - `isGrounded == false` -> Jump
- Serialized to entity JSON: `entity.animGraph`.

## 🛠️ Step-by-Step Implementation Guide
1. Open via **Tools ▾ -> 🕺 Visual Animation Blend Graph** or from the Inspector Animation Player card.
2. Click **➕ Add State Node** to add a new state.
3. Click **⚡ Add Transition** to link states with a condition.
4. Click **💾 Save & Apply** to bind the graph to the selected entity.
