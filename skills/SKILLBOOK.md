# 📖 MakuluLinux Game Studio · The Skillbook

Complete reference guide to every capability, behavior, component, and compilation target in MakuluLinux Game Studio.

# 🧠 MakuluLinux Game Studio · Agent Skills Library

> Standardized, microscopic operational skills for autonomous AI coding agents (Antigravity, Jules, Claude Code, Cursor) and the In-Editor AI Copilot. Modeled after the industry standards pioneered by [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills) and [mattpocock/skills](https://github.com/mattpocock/skills).

Total Skills Available: **64 skills**

---

## 🎯 How AI Agents Must Use These Skills
Before attempting to write code, spawn entities, configure animations, or compile games, the AI **MUST** consult the relevant skill file in `skills/<skill-name>/SKILL.md`.
Each skill provides:
1. **When to use the skill** and trigger context.
2. **Key APIs, component classes, and behavior identifiers**.
3. **Step-by-step procedure** with copy-paste recipes.
4. **Exact JSON action syntax** for the in-editor AI Copilot (`json:actions`).
5. **Common pitfalls and edge cases** to avoid bugs and broken states.

---

## 📚 Master Skills Directory by Category

### 📦 3D Models, Meshes & Assets (8 skills)

| Skill | Description | Tags |
| :--- | :--- | :--- |
| [`duplicate-and-delete`](./duplicate-and-delete/SKILL.md) | Safely clone entities with all attached behaviors and components, or delete them with full undo/redo history. | `duplicate`, `delete`, `clone`, `undo` |
| [`manage-hierarchy`](./manage-hierarchy/SKILL.md) | Organize scene entities, manage parent-child relationships, filter by name, and group scene props. | `hierarchy`, `parenting`, `grouping`, `search` |
| [`prefab-system`](./prefab-system/SKILL.md) | Save entity hierarchies as reusable .prefab files and spawn them repeatedly with 1 click. | `prefab`, `templates`, `reuse`, `instances` |
| [`procedural-terrain`](./procedural-terrain/SKILL.md) | Generate multi-octave Perlin noise 3D terrain heightmaps with biomes and collision. | `terrain`, `perlin-noise`, `heightmap`, `sculptor`, `mountains` |
| [`resize-3d-model`](./resize-3d-model/SKILL.md) | Interactively resize 3D models using viewport corner hook arrows, floating transform HUD, or Simple Mode size slider. | `resize`, `scale`, `transform`, `corner-arrows`, `hud` |
| [`spawn-3d-model`](./spawn-3d-model/SKILL.md) | Load and instantiate authentic 3D GLB/glTF models from the catalog or custom URLs into the scene. | `model`, `glb`, `gltf`, `mesh`, `spawn`, `catalog` |
| [`spawn-primitive`](./spawn-primitive/SKILL.md) | Spawn geometric 3D primitives with render, material, and collision components. | `primitive`, `box`, `sphere`, `capsule`, `cylinder`, `cone`, `plane` |
| [`transform-entity`](./transform-entity/SKILL.md) | Manipulate entity position, orientation, and scale using gizmos or numeric Inspector inputs. | `position`, `rotation`, `scale`, `transform`, `gizmo` |

### 💃 Character Locomotion & Skeletal Animation (6 skills)

| Skill | Description | Tags |
| :--- | :--- | :--- |
| [`anim-blend-graph`](./anim-blend-graph/SKILL.md) | Build and edit visual animation state machines with custom conditions and blend times in AnimBlendModal. | `state-machine`, `blend-tree`, `transitions`, `graph` |
| [`character-locomotion`](./character-locomotion/SKILL.md) | Drive seamless velocity-based transitions between Idle and Walk/Sprint animations when characters move. | `locomotion`, `walk`, `idle`, `run`, `wasd`, `enemy-ai` |
| [`glb-skeletal-rigging`](./glb-skeletal-rigging/SKILL.md) | Automatically extract GLB animation tracks, build a multi-state AnimStateGraph, and attach an AnimComponent. | `skeletal`, `animation`, `rigging`, `anim-component`, `animstategraph` |
| [`inspector-animation-player`](./inspector-animation-player/SKILL.md) | Preview, switch, and control character animation clips directly from the Inspector UI. | `inspector`, `animation-player`, `preview`, `clips` |
| [`procedural-limb-animation`](./procedural-limb-animation/SKILL.md) | Apply procedural harmonic leg and arm walk cycle swinging for blocky or modular models without bones. | `procedural`, `limbs`, `walk-cycle`, `modular`, `swing` |
| [`timeline-keyframe-sequencer`](./timeline-keyframe-sequencer/SKILL.md) | Animate entity properties over time using the multi-track visual keyframe timeline sequencer. | `timeline`, `keyframe`, `sequencer`, `cinematic` |

### 🎨 Materials, PBR & Texture Compression (3 skills)

| Skill | Description | Tags |
| :--- | :--- | :--- |
| [`apply-material-presets`](./apply-material-presets/SKILL.md) | Instantly apply pre-tuned PBR material presets to entities. | `presets`, `gold`, `neon`, `lava`, `water`, `wood`, `stone` |
| [`configure-pbr-material`](./configure-pbr-material/SKILL.md) | Create and customize physically-based rendering (PBR) materials on any entity. | `material`, `pbr`, `metalness`, `roughness`, `diffuse`, `emissive` |
| [`texture-compression-pipeline`](./texture-compression-pipeline/SKILL.md) | Configure Basis Universal / KTX2 GPU texture compression formats and hardware anisotropic filtering. | `texture-compression`, `basis`, `ktx2`, `astc`, `dxt`, `etc2`, `bc7` |

### ☀️ Lighting, Atmosphere & PostFX (4 skills)

| Skill | Description | Tags |
| :--- | :--- | :--- |
| [`configure-lights`](./configure-lights/SKILL.md) | Spawn and adjust Directional, Point, and Spot lights with custom color, intensity, and shadow casting. | `light`, `directional`, `point`, `spot`, `shadows` |
| [`fog-and-postfx`](./fog-and-postfx/SKILL.md) | Configure exponential squared atmospheric fog density, fog color, and camera exposure tone-mapping. | `fog`, `postfx`, `exposure`, `atmosphere`, `fogginess` |
| [`light-flicker-and-cycle`](./light-flicker-and-cycle/SKILL.md) | Attach procedural Perlin noise flickering to torches or smooth RGB color cycling to party lights. | `light-flicker`, `spotlight-flicker`, `color-cycle`, `torch` |
| [`skybox-and-atmosphere`](./skybox-and-atmosphere/SKILL.md) | Switch and customize scene sky atmosphere presets: Clear Day, Sunset, Cyberpunk, Foggy Valley, and Night. | `skybox`, `atmosphere`, `environment`, `preset`, `ambient` |

### ⚙️ Physics, Colliders & Joint Constraints (4 skills)

| Skill | Description | Tags |
| :--- | :--- | :--- |
| [`configure-rigidbody-physics`](./configure-rigidbody-physics/SKILL.md) | Configure authentic Ammo.js physics rigidbodies with mass, friction, bounce, and degree-of-freedom factors. | `physics`, `rigidbody`, `ammo`, `mass`, `friction`, `restitution` |
| [`physics-collision-shapes`](./physics-collision-shapes/SKILL.md) | Assign and size physics collision bounding shapes for physical contact and raycasting. | `collision`, `collider`, `box`, `sphere`, `capsule`, `mesh` |
| [`physics-joint-constraints`](./physics-joint-constraints/SKILL.md) | Link two entities with physics joint constraints (hinges, swinging doors, ball joints). | `joints`, `constraints`, `hinge`, `point-to-point`, `ragdoll` |
| [`ragdoll-physics`](./ragdoll-physics/SKILL.md) | Trigger dynamic ragdoll physics collapse and impulses upon character defeat. | `ragdoll`, `death`, `defeat`, `collapse`, `physics` |

### 🎮 Player Controllers & Traversal (7 skills)

| Skill | Description | Tags |
| :--- | :--- | :--- |
| [`dash-boost`](./dash-boost/SKILL.md) | Execute instant directional dash bursts with cooldowns and camera impact. | `dash`, `boost`, `dodge`, `burst-speed` |
| [`first-person-controller`](./first-person-controller/SKILL.md) | Lock camera to entity head height with mouse-look and strafe controls for FPS games. | `fpc`, `fps`, `first-person`, `mouselook`, `wasd` |
| [`grappling-hook`](./grappling-hook/SKILL.md) | Launch grappling hook cables to swing and pull toward distant target surfaces. | `grapple`, `hook`, `swing`, `traversal` |
| [`jetpack-controller`](./jetpack-controller/SKILL.md) | Add vertical jetpack thrust, fuel depletion, and recharging mechanics. | `jetpack`, `flight`, `fuel`, `thrust`, `vertical` |
| [`vehicle-controller`](./vehicle-controller/SKILL.md) | Drive cars, buggies, or speedboats with acceleration, steering, and braking physics. | `vehicle`, `car`, `steering`, `driving`, `acceleration` |
| [`wall-run-controller`](./wall-run-controller/SKILL.md) | Implement wall-running parkour movement along vertical obstacle surfaces. | `wall-run`, `parkour`, `titanfall`, `movement` |
| [`wasd-player-controller`](./wasd-player-controller/SKILL.md) | Turn any entity into a playable character with planar WASD and arrow-key movement. | `wasd`, `movement`, `player`, `keyboard`, `controls` |

### ⚔️ AI Enemies, Combat & Weapons (11 skills)

| Skill | Description | Tags |
| :--- | :--- | :--- |
| [`ai-copilot-action-protocol`](./ai-copilot-action-protocol/SKILL.md) | Instruct the AI Copilot to execute scene modifications using the structured json:actions protocol. | `ai-copilot`, `json-actions`, `autonomous`, `ai-executor` |
| [`boss-ai`](./boss-ai/SKILL.md) | Create multi-phase boss encounters with health thresholds, enrage speed multipliers, and screen-shaking attacks. | `boss`, `boss-ai`, `phases`, `enrage`, `aoe` |
| [`cover-system`](./cover-system/SKILL.md) | Enable tactical cover mechanics reducing incoming enemy damage by 75%. | `cover`, `crouch`, `mitigation`, `tactical` |
| [`enemy-ai`](./enemy-ai/SKILL.md) | Implement autonomous enemy tracking, pursuit, attack distance checks, and melee damage. | `enemy`, `ai`, `pursuit`, `combat`, `attack` |
| [`enemy-spawner`](./enemy-spawner/SKILL.md) | Spawn repeated waves of enemies from portals, nests, or doors at regular intervals. | `spawner`, `waves`, `portal`, `respawn` |
| [`health-and-damage`](./health-and-damage/SKILL.md) | Manage entity health pools, take damage, apply invincibility frames, and collect health pickups. | `health`, `damage`, `hp`, `heal`, `pickup` |
| [`patrol-and-waypoints`](./patrol-and-waypoints/SKILL.md) | Set up back-and-forth linear patrol routes or multi-node 3D waypoint circuits. | `patrol`, `waypoints`, `navigation`, `routes` |
| [`projectile-shooter`](./projectile-shooter/SKILL.md) | Equip characters with weapon shooting mechanics, spawning high-speed projectiles on key press. | `gun`, `projectile`, `shooter`, `bullet`, `fire` |
| [`shield-generator`](./shield-generator/SKILL.md) | Add energy shields that absorb incoming combat damage before health is depleted. | `shield`, `armor`, `overshield`, `recharge` |
| [`stealth-ai`](./stealth-ai/SKILL.md) | Implement field-of-view vision cone detection for stealth games and guard evasion. | `stealth`, `vision-cone`, `fov`, `detection` |
| [`turret-ai`](./turret-ai/SKILL.md) | Deploy defensive turrets that track the player within range and fire laser projectiles. | `turret`, `defense`, `projectiles`, `targeting` |

### 🚪 Interactive World, Doors, Platforms & Triggers (6 skills)

| Skill | Description | Tags |
| :--- | :--- | :--- |
| [`environmental-hazards`](./environmental-hazards/SKILL.md) | Construct hazardous lava pits, acid pools, and spike traps that deal lethal contact damage. | `hazard`, `lava`, `acid`, `spikes`, `damage-zone` |
| [`interactive-doors-and-keys`](./interactive-doors-and-keys/SKILL.md) | Create proximity-opening doors, locked dungeon gates, and collectible key pickups. | `door`, `key`, `lock`, `gate`, `puzzle` |
| [`moving-platforms`](./moving-platforms/SKILL.md) | Build vertical elevators and horizontal moving shuttle platforms with smooth direction reversal. | `platform`, `elevator`, `lift`, `shuttle` |
| [`pressure-plates`](./pressure-plates/SKILL.md) | Create floor pressure switches that trigger target entities or toggle doors when stepped on. | `pressure-plate`, `switch`, `trigger`, `puzzle` |
| [`sensor-triggers-and-teleport`](./sensor-triggers-and-teleport/SKILL.md) | Register invisible sensor zones that teleport players, award points, or trigger scene events. | `trigger`, `sensor`, `teleport`, `portal`, `events` |
| [`water-volumes-and-buoyancy`](./water-volumes-and-buoyancy/SKILL.md) | Spawn semi-transparent buoyant water volumes with upward floating physics forces. | `water`, `swimming`, `buoyancy`, `ocean` |

### 🏆 Progression, Quests, Scenes & Checkpoints (5 skills)

| Skill | Description | Tags |
| :--- | :--- | :--- |
| [`checkpoints-and-respawn`](./checkpoints-and-respawn/SKILL.md) | Place checkpoint markers that save player progress and restore health on defeat. | `checkpoint`, `respawn`, `death`, `flag` |
| [`inventory-and-crafting`](./inventory-and-crafting/SKILL.md) | Manage player inventory item slots, collectible items, and crafting recipes. | `inventory`, `crafting`, `recipes`, `items` |
| [`multi-scene-management`](./multi-scene-management/SKILL.md) | Create, duplicate, rename, switch between, and delete multiple scenes and levels in a single project. | `scenes`, `levels`, `multi-scene`, `duplicate-scene` |
| [`quest-and-dialogue-system`](./quest-and-dialogue-system/SKILL.md) | Implement NPC dialogue speech balloons, quest tracking, and objective progression. | `quest`, `dialogue`, `npc`, `story`, `rpg` |
| [`victory-and-game-over`](./victory-and-game-over/SKILL.md) | Configure Victory fanfare screens, Game Over screens, and restart mechanics. | `victory`, `gameover`, `win`, `defeat`, `hud` |

### 🔊 Audio, Spatial Sound & Particles (3 skills)

| Skill | Description | Tags |
| :--- | :--- | :--- |
| [`3d-spatial-audio`](./3d-spatial-audio/SKILL.md) | Attach 3D spatialized sound sources with distance attenuation falloff and Doppler realism. | `audio`, `spatial-audio`, `3d-sound`, `sound`, `music` |
| [`particle-effects`](./particle-effects/SKILL.md) | Spawn and configure particle emitters for fire, smoke, sparks, snow, and rain. | `particles`, `fire`, `smoke`, `snow`, `rain`, `sparks` |
| [`procedural-sfx-generator`](./procedural-sfx-generator/SKILL.md) | Synthesize retro and arcade sound effects on-the-fly using the Web Audio API without audio files. | `sfx`, `procedural-audio`, `web-audio`, `sound-effects` |

### 🖥️ HUD, UI & Screen Overlays (1 skills)

| Skill | Description | Tags |
| :--- | :--- | :--- |
| [`hud-system-configuration`](./hud-system-configuration/SKILL.md) | Customize on-screen HUD elements: health bar, ammo counter, crosshairs, and minimap. | `hud`, `ui`, `healthbar`, `ammo`, `crosshair`, `minimap` |

### 📜 Scripting, Code Editor & Attributes (2 skills)

| Skill | Description | Tags |
| :--- | :--- | :--- |
| [`in-editor-code-editor`](./in-editor-code-editor/SKILL.md) | Write and test JavaScript scripts directly inside the built-in CodeEditorModal with syntax highlighting. | `code-editor`, `ide`, `syntax`, `escape`, `modal` |
| [`scripting-and-attributes`](./scripting-and-attributes/SKILL.md) | Author PlayCanvas JavaScript scripts and declare Script.attributes for dynamic Inspector controls. | `script`, `attributes`, `playcanvas`, `code`, `reflection` |

### 🚀 Standalone Compilation & Scene Backup (2 skills)

| Skill | Description | Tags |
| :--- | :--- | :--- |
| [`compile-standalone-game`](./compile-standalone-game/SKILL.md) | Bundle entire 3D games into a single self-contained, offline-playable .html file. | `compiler`, `game-bundler`, `standalone`, `html5`, `export` |
| [`export-and-import-scene`](./export-and-import-scene/SKILL.md) | Export scenes to clean human-readable JSON files and reload them safely. | `json`, `export-scene`, `import-scene`, `backup`, `schema` |

### 🛠️ Editor Modes, Undo/Redo & Workflows (2 skills)

| Skill | Description | Tags |
| :--- | :--- | :--- |
| [`command-bus-undo-redo`](./command-bus-undo-redo/SKILL.md) | Record user actions and AI modifications to the Command Bus for full Ctrl+Z and Ctrl+Y support. | `command-bus`, `undo`, `redo`, `history`, `transaction` |
| [`editor-modes-simple-vs-pro`](./editor-modes-simple-vs-pro/SKILL.md) | Switch between 🌱 Simple Mode for beginners and ⚡ Pro Mode for full ECS engineering. | `simple-mode`, `pro-mode`, `workflow`, `novice`, `expert` |


