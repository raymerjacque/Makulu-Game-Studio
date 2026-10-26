---
name: 3d-spatial-audio
category: audio-and-sfx
tags: [audio, spatial-audio, 3d-sound, sound, music]
description: "Attach 3D spatialized sound sources with distance attenuation falloff and Doppler realism."
---

# 3D Spatial Audio Skill

## 🎯 When to Use This Skill
Use this skill for river sounds, crackling campfires, machine hums, or ambient music emitters.

## 🔑 Key Concepts & Architecture
- PlayCanvas `sound` component.
- Properties:
  - `volume`: Loudness (0.0 to 1.0).
  - `pitch`: Frequency pitch multiplier (default: 1.0).
  - `loop`: Continuous loop toggle.
  - `minDistance`: Distance within which sound is at maximum volume (default: 1.0m).
  - `maxDistance`: Distance beyond which sound attenuates to silence (default: 15.0m).
  - `autoPlay`: Start playing immediately on scene load.
