---
name: procedural-sfx-generator
category: audio-and-sfx
tags: [sfx, procedural-audio, web-audio, sound-effects]
description: "Synthesize retro and arcade sound effects on-the-fly using the Web Audio API without audio files."
---

# Procedural SFX Generator Skill

## 🎯 When to Use This Skill
Use this skill when instant sound feedback is needed without downloading external audio files.

## 🔑 Key Concepts & Architecture
- Implemented in `editor/src/audio/procedural-sfx.js`.
- Presets:
  - `jump`: Ascending frequency sweep.
  - `laser`: Fast downward modulated saw wave.
  - `coin`: Dual harmonic bell tone.
  - `explosion`: Filtered white noise with low-frequency rumble.
  - `hurt`: Short distorted crunch tone.
  - `door`: Low frequency servo hum.
  - `victory`: Arpeggiated triumphal fanfare chords.
- Available in browser and bundled into standalone HTML games.
