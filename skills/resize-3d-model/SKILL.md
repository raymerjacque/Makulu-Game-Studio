---
name: resize-3d-model
category: models-and-assets
tags: [resize, scale, transform, corner-arrows, hud]
description: "Interactively resize 3D models using viewport corner hook arrows, floating transform HUD, or Simple Mode size slider."
---

# Resize 3D Model Skill

## 🎯 When to Use This Skill
Use this skill when placing or adjusting 3D models that need to be made larger, smaller, or proportional to other scene props.

## 🔑 Key Concepts & Architecture
- **Interactive 3D Resizer Overlay (`editor/src/ui/model-resizer-overlay.js`):**
  - Displays 4 draggable corner hook arrows (⬉ ⬈ ⬊ ⬋) projected in screen space around the model's bounding box.
  - Dragging the corner hook arrows applies uniform scaling across [X, Y, Z] with 10% step increments.
- **Floating Transform HUD:**
  - Floats dynamically above the selected model on the 3D canvas showing current dimensions and scale percentage.
  - Features 1-click **[-]** and **[+]** buttons plus a **Reset** button to restore [1, 1, 1].
- **Simple Mode Size Slider:**
  - Located in the Inspector under **🌱 Simple Model Controls** (`#simple-prop-size`).
  - Scales model uniformly between 0.1× and 10.0×.
- **Clamped Limits:** Scale is clamped between 0.05 and 50.0 to prevent inverted or non-renderable zero-scale entities.
- **Undo/Redo:** Every drag commits a transactional command to the Command Bus.

## 🛠️ Step-by-Step Implementation Guide
1. Select the model entity in the Viewport or Hierarchy panel.
2. Grab any of the 4 corner hook arrows around the model and drag diagonally outward to enlarge, or inward to shrink.
3. Or use the floating HUD above the model: click **[+]** for 1.2× or **[-]** for 0.8×.
4. Or in the Inspector (Simple Mode), adjust the **Model Size** slider.

## 💻 Code Examples & Action Recipes
### AI Copilot Action Block
```json:actions
{
  "actions": [
    {
      "action": "modify_entity",
      "name": "Knight_Hero",
      "scale": [2.5, 2.5, 2.5]
    }
  ]
}
```

## ⚠️ Common Pitfalls & Edge Cases
- Do not set scale to 0.0 or negative values, as physics collision shapes will collapse.
