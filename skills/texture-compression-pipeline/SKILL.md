---
name: texture-compression-pipeline
category: materials-and-shaders
tags: [texture-compression, basis, ktx2, astc, dxt, etc2, bc7]
description: "Configure Basis Universal / KTX2 GPU texture compression formats and hardware anisotropic filtering."
---

# Texture Compression Pipeline Skill

## 🎯 When to Use This Skill
Use this skill when optimizing texture memory (VRAM), reducing package download sizes, or targeting specific hardware platforms.

## 🔑 Key Concepts & Architecture
- Configured in `Settings ▾ -> ⚙️ Project Settings` (`editor/src/ui/project-settings-modal.js`).
- **GPU Transcode Targets:**
  - `auto`: Hardware best fit.
  - `astc`: Modern mobile and high-fidelity devices.
  - `dxt`: Standard desktop PCs (BC1/BC3).
  - `etc2`: Standard Android.
  - `bc7`: AAA desktop high detail.
  - `uncompressed`: Raw RGBA8.
- **Anisotropic Filtering:** Hardware oblique filtering levels (`1x`, `4x`, `8x`, `16x`).
- Serialized in project settings and embedded into compiled standalone games.
