---
name: compile-standalone-game
category: compilation-and-export
tags: [compiler, game-bundler, standalone, html5, export]
description: "Bundle entire 3D games into a single self-contained, offline-playable .html file."
---

# Compile Standalone Game Skill

## 🎯 When to Use This Skill
Use this skill to export and publish your game to itch.io, Discord, web servers, or mobile devices as a zero-install HTML5 package.

## 🔑 Key Concepts & Architecture
- Engine: `GameBundler` in `editor/src/compiler/game-bundler.js`.
- Single-File Architecture:
  - Injects PlayCanvas engine, Ammo.js physics WebAssembly runtime, and audio drivers.
  - Inlines all scene entities, materials, lights, joint constraints, and triggers.
  - Converts external audio and images to Base64 data URIs.
  - Compiles full HUD, Game Over, and Victory screens.
  - Includes all 63 No-Code behaviors and automatic character locomotion.
- The resulting `.html` file double-clicks and runs on any device without internet access or web servers!
