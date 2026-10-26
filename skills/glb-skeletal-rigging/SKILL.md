---
name: glb-skeletal-rigging
category: character-locomotion
tags: [skeletal, animation, rigging, anim-component, animstategraph]
description: "Automatically extract GLB animation tracks, build a multi-state AnimStateGraph, and attach an AnimComponent."
---

# GLB Skeletal Rigging Skill

## 🎯 When to Use This Skill
Use this skill when importing animated characters or creatures from Mixamo, Kenney, Sketchfab, or Blender so their skeletons can play animation clips.

## 🔑 Key Concepts & Architecture
- Implemented in `editor.setupModelAnimations(rootEntity, modelEntity, animations)` in `editor/src/core/editor.js`.
- GLB container resources contain `asset.resource.animations` (array of `pc.Asset` with `pc.AnimTrack`).
- Automatically creates a `pc.AnimStateGraph` with:
  - Default layer: `Base`
  - States: `START`, plus every animation clip found in the GLB.
  - Identifies and sets `defaultState` to the `idle` clip.
  - Parameter: `speed` (`FLOAT`, default 0).
- Attaches modern `AnimComponent` (`entity.addComponent('anim', { activate: true, speed: 1.0 })`).
- Automatically begins playing the Idle clip on spawn so characters are alive immediately.

## 🛠️ Step-by-Step Implementation Guide
- Automated on load! When calling `editor.loadModel(url)`, if animations exist, this rigging runs automatically.
- References are preserved on the root entity: `rootEntity._animComp`, `rootEntity._modelAnimations`, `rootEntity._idleClip`, `rootEntity._walkClip`.
