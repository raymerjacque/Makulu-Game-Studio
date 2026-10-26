---
name: editor-modes-simple-vs-pro
category: editor-interface
tags: [simple-mode, pro-mode, workflow, novice, expert]
description: "Switch between 🌱 Simple Mode for beginners and ⚡ Pro Mode for full ECS engineering."
---

# Editor Modes: Simple vs Pro Skill

## 🎯 When to Use This Skill
Use this skill to adapt the editor UI complexity to user skill level.

## 🔑 Key Concepts & Architecture
- Toggled via the Topbar mode selector or `editor.setEditorMode('simple' | 'pro')`.
- **🌱 Simple Mode:**
  - Hides complex matrix/quaternion/physics parameters.
  - Shows unified sliders (e.g. Model Size, Speed, Health).
  - Streamlines 1-click behavior injection.
- **⚡ Pro Mode:**
  - Exposes raw Entity-Component-System properties.
  - Detailed physics constraints, linear/angular factors, shaders, scripts, and blend graphs.
