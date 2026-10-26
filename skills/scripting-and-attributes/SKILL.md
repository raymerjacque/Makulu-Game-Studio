---
name: scripting-and-attributes
category: scripting-and-code
tags: [script, attributes, playcanvas, code, reflection]
description: "Author PlayCanvas JavaScript scripts and declare Script.attributes for dynamic Inspector controls."
---

# Scripting and Attributes Skill

## 🎯 When to Use This Skill
Use this skill when custom programming is required beyond the 63 built-in No-Code behaviors.

## 🔑 Key Concepts & Architecture
- Standard PlayCanvas script lifecycle:
  ```javascript
  const Rotator = pc.createScript('rotator');

  Rotator.attributes.add('speed', { type: 'number', default: 50, title: 'Rotation Speed' });
  Rotator.attributes.add('axis', { type: 'string', default: 'y', title: 'Rotation Axis' });
  Rotator.attributes.add('glowColor', { type: 'rgb', default: [1, 0, 0], title: 'Glow Color' });

  Rotator.prototype.initialize = function() {
    // Called once on start
  };

  Rotator.prototype.update = function(dt) {
    this.entity.rotate(0, this.speed * dt, 0);
  };
  ```
- Inspector dynamically parses `Rotator.attributes.add` and renders live sliders, toggles, and color pickers!
