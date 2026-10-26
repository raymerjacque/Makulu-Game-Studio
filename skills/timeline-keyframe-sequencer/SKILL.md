---
name: timeline-keyframe-sequencer
category: character-locomotion
tags: [timeline, keyframe, sequencer, cinematic]
description: "Animate entity properties over time using the multi-track visual keyframe timeline sequencer."
---

# Timeline Keyframe Sequencer Skill

## 🎯 When to Use This Skill
Use this skill to create scripted camera flythroughs, moving doors, opening chests, or cinematic cutscenes.

## 🔑 Key Concepts & Architecture
- Docked panel at the bottom of the editor (`editor/src/ui/timeline.js`).
- Tracks position, rotation, and scale keyframes over a 0 to 10-second timeline.
- Features:
  - **🔴 Add Keyframe:** Records current entity transform at playhead position.
  - **▶ Play / ⏸ Pause:** Previews keyframe interpolation.
  - Scrubbable time ruler with loop toggle.
