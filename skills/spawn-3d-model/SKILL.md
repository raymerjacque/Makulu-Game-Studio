---
name: spawn-3d-model
category: models-and-assets
tags: [model, glb, gltf, mesh, spawn, catalog]
description: "Load and instantiate authentic 3D GLB/glTF models from the catalog or custom URLs into the scene."
---

# Spawn 3D Model Skill

## 🎯 When to Use This Skill
Use this skill whenever you need to spawn, import, or place an authentic 3D model (GLB or glTF 2.0 container) into the active scene.

## 🔑 Key Concepts & Architecture
- Models are loaded via `editor.loadModel(url, options)`.
- PlayCanvas container loader (`app.assets.loadFromUrl(url, 'container', ...)`) instantiates the hierarchy with `asset.resource.instantiateRenderEntity({ castShadows: true, receiveShadows: true })`.
- Models are attached to a designated root `pc.Entity` which tracks `_modelUrl`, world transforms, and attached behaviors.
- The model catalog is defined in `editor/src/store/model-store.js` (`MODEL_CATALOG`), featuring 19 CC0 models including:
  - `/models/character_hero.glb` (Hero Warrior, 27 animations)
  - `/models/character_warrior.glb` (Armored Enemy, 27 animations)
  - `/models/oak_tree.glb`, `/models/pine_tree.glb`, `/models/palm_tree.glb`
  - `/models/pirate_ship.glb`, `/models/cannon.glb`, `/models/chest.glb`
  - `/models/crate.glb`, `/models/barrel.glb`, `/models/stone_bridge.glb`

## 🛠️ Step-by-Step Implementation Guide
1. **Via Editor UI:**
   - Click **📦 3D Models** in the Topbar to open the Model Store Modal.
   - Or open the **Assets Panel**, select **3D Models**, and click on any model card or drag it onto the canvas.
2. **Via AI Copilot Action:**
   - Provide the action type `spawn_model` with `url`, `name`, `position`, and `scale`.
3. **Via JavaScript API:**
   ```javascript
   await editor.loadModel('/models/character_hero.glb', {
     name: 'PlayerHero',
     position: [0, 0, 0],
     scale: [1, 1, 1],
     rotation: [0, 0, 0]
   });
   ```

## 💻 Code Examples & Action Recipes
### AI Copilot Action Block
```json:actions
{
  "actions": [
    {
      "action": "spawn_model",
      "url": "/models/character_hero.glb",
      "name": "Knight_Hero",
      "position": [0, 0, 0],
      "scale": [1, 1, 1]
    }
  ]
}
```

## ⚠️ Common Pitfalls & Edge Cases
- **Root Scale Offset:** Always apply user transformations to the parent root entity, never modify child mesh bones directly.
- **Embedded Textures:** All official models use self-contained bufferView textures. When using external URLs, ensure CORS headers permit fetching the binary GLB.
