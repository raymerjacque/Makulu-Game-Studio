<div align="center">

<img src="docs/images/logo.png" width="128" height="128" alt="MakuluLinux Game Studio Logo" />

# 🎮 MakuluLinux Game Studio
### Next-Generation AI-First 3D Game Engine & Desktop/Web Studio Editor
**Forked & Engineered on top of the PlayCanvas WebGL/WebGPU 3D Engine**

[![License: MIT](https://img.shields.io/badge/License-MIT-orange.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Linux%20%7C%20Web%20%7C%20Windows%20%7C%20macOS-blue.svg)](#cross-distro-desktop-packaging)
[![Engine](https://img.shields.io/badge/Engine-PlayCanvas%20WebGL2%20%2F%20WebGPU-ff6600.svg)](https://playcanvas.com)
[![AI Integration](https://img.shields.io/badge/AI%20Copilot-Multi--Provider%20Autonomous-success.svg)](#-native-ai-studio-copilot)
[![AppImage](https://img.shields.io/badge/Package-AppImage%20%26%20Debian-green.svg)](#-building-and-packaging)

<br/>

<img src="docs/images/studio-viewport.png" width="96%" alt="MakuluLinux Game Studio Viewport" style="border-radius: 10px; box-shadow: 0 10px 40px rgba(0,0,0,0.8);" />

</div>

---

## 🌟 Executive Overview

**MakuluLinux Game Studio** is a professional, high-performance, AI-native 3D game creation suite designed to make AAA-grade game development accessible to novices while giving experienced developers technical depth.

Built upon a dual architecture (**Web Standards + Native Electron Shell**), the studio runs seamlessly across all Linux distributions (MakuluLinux, Ubuntu, Debian, Fedora, Arch, openSUSE) as a self-contained zero-install **AppImage** and native **Debian (`.deb`)** package, as well as on Windows, macOS, and standard modern web browsers.

### 🏛️ PlayCanvas Engine Heritage
MakuluLinux Game Studio is proudly **forked from and built upon the open-source PlayCanvas WebGL2/WebGPU engine**. By leveraging PlayCanvas's battle-tested 60fps rendering pipeline, clustered lighting, physical PBR shaders, and lightweight memory footprint, games created in MakuluLinux Studio load in milliseconds and run at high framerates on desktop PCs, laptops, and mobile devices without requiring heavyweight runtime installs or browser plugins.

---

## 🏗️ Core Architecture

<div align="center">
  <img src="docs/images/architecture.svg" width="94%" alt="MakuluLinux Game Studio Architecture Diagram" />
</div>

The studio is organized into five unified subsystems:
1. **Interactive 5-Pane Docked Interface:** A docked layout modeled after industry standards (Unity, Unreal, PlayCanvas) with customizable resizable splitters.
2. **Dual-Tier Workflow (🌱 Simple vs ⚡ Pro):** Switch effortlessly between beginner visual creation and technical Entity-Component-System (ECS) engineering.
3. **Universal Command Bus:** Transactional action bus providing full Undo/Redo (`Ctrl+Z`, `Ctrl+Y`) for both user clicks and autonomous AI modifications.
4. **Native AI Studio Copilot:** Connected to MakuluLinux Electra AI, OpenAI, Google Gemini, Anthropic Claude, Groq, Mistral, Moonshot, and local Ollama instances.
5. **Zero-Install Game Compiler:** Bundles entire 3D games into a single `.html` file that can be double-clicked on any computer or phone to play instantly.

---

## 🖥️ 5-Pane Studio Interface

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ [M] MakuluLinux Studio | Scene: Main | 🎮 Templates | 🎬 Timeline | 📖 Guide | ❓ Help | ⚙️ AI Settings | ⚙️ Project     │
├─────────┬──────────────────────────────────────────────────────────────────────────────────────────────┬───────────────┤
│ HIER-   │ 3D VIEWPORT                                                                                  │ INSPECTOR     │
│ ARCHY   │                                                                                              │               │
│         │   • Infinite 3D Floor Grid & Coordinate Axes                                                │ [🌱 Simple /  │
│ [Search]│   • PlayCanvas 3D Gizmos (W: Move, E: Rotate, R: Scale)                                      │  ⚡ Pro Mode]  │
│         │   • Atmosphere Sky Presets (Day, Sunset, Cyberpunk, Foggy, Night) + ✨ FX Post-Processing    │               │
│ + Add   │   • Smooth Orbit, Pan, Zoom, WASD Flythrough, Framing (F)                                    │ • Transforms  │
│  ├ Cube │   • Drag-and-Drop Reparenting in Scene Hierarchy                                             │ • Materials   │
│  ├ Sun  │   • Visual Wireframe Helpers (Light Range, Audio Radius, Collision Boxes)                    │ • Prefabs     │
│  └ Cam  │                                                                                              │ • ECS Cards   │
├─────────┴──────────────────────────────────────────────────────────────────────────────────────────────┴───────────────┤
│ ASSETS & CODE STUDIO                                                                                                   │
│ [📁 All] [📦 Prefabs] [📦 3D Store] [🏔️ Terrain Sculptor] [🎨 Material Studio] [📜 Script Studio] [🩺 Console Drawer] │
└────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

1. **Hierarchy Panel (Left):** Real-time scene graph with instant search, tree nesting, visual **drag-and-drop reparenting**, and the `+ Add` menu for primitives, lights, cameras, particles, and audio.
2. **Interactive 3D Viewport (Center):** High-DPI canvas with an infinite procedural floor grid, raycast picking, transform gizmos, live **Component Visual Wireframe Helpers** (light ranges, audio radius, collision bounding shapes), and real-time **Atmosphere & Fog Sky selector** with **✨ FX Post-Processing**.
3. **Inspector Panel (Right):** Morphing property editor that automatically adapts based on whether you are in Simple or Pro Mode, with **1-click Prefab Creation** and complete ECS component stacks for Cameras, Collisions, Rigidbodies, Particles, Spatial Audio, and Scripts.
4. **Asset Browser & Code Studio (Bottom):** Integrated project file explorer with dedicated `/assets/prefabs` support, authentic CC0 3D model importer, procedural Perlin terrain generator, visual PBR material studio, and Monaco-style script editor.
5. **Top Navigation Bar:** Scene selector, Simple/Pro switcher, AI Quick Prompt bar, Play/Simulate mode, Templates, Animation Timeline Sequencer, Guide, Help, AI Settings, Project Physics Settings, Post-Processing FX, Scene Import/Export, and 1-Click Web Publishing.

---

## 🌱 Dual-Tier Workflow: Simple vs. Pro Mode

MakuluLinux Game Studio introduces a breakthrough dual-tier interface, allowing beginners to create without being overwhelmed by technical jargon, while giving engineers access to raw engine mechanics:

| Feature | 🌱 Simple Mode (Novices) | ⚡ Pro Mode (Engineers) |
| :--- | :--- | :--- |
| **Material Coloring** | **8-Color Quick Swatches:** Red, Orange, Amber, Emerald, Cyan, Cobalt, Purple, Obsidian | **PBR Material Preview Sphere:** Real-time 3D orbiting sphere with Diffuse, Metalness, and Roughness sliders |
| **Transform & Sizing** | **Visual Size Sliders & ±0.5 Nudge Buttons:** Move objects with arrows, scale smoothly from 0.1x to 10x | **Exact Vector3 Coordinate Inputs:** Float precision Position [X, Y, Z], Rotation [Pitch, Yaw, Roll], and Scale |
| **Gameplay Logic** | **Plug & Play Behavior Cards:** 1-Click activate WASD Player Controller, Continuous Spin, or Torch Flicker | **Component Stack & Script Studio:** Custom PlayCanvas script attachments, lifecycle hooks (`initialize`, `update`), and raw ECS components |
| **Lighting** | **Visual Light Swatches:** Instant amber, cyan, white, red fixtures with visible fixture bodies | **Light Physics:** Inner/outer cone angles, range, attenuation, real-time shadow cascades |

---

## 🤖 Native AI Studio Copilot

The MakuluLinux AI Copilot is an autonomous co-creator connected directly to the studio's **Universal Command Bus**. The AI does not merely generate chat text; it can directly create 3D meshes, position lights, sculpt mountains, and debug code.

### 🔑 Dynamic Credential Auto-Detection (Zero Configuration)
- **On MakuluLinux AI-OS:** When launched on MakuluLinux, the studio automatically detects and loads the user's Electra credentials from `~/.config/ai_terminal/electra_auth.json`. The user never has to copy-paste or enter API keys.
- **On Other Distros (Ubuntu, Arch, Fedora) or Web:** If no system key is found, users can enter their Electra AI key or choose from a wide range of external AI providers in the **⚙️ AI Settings** menu.

### 🌐 Supported AI Providers & Models
Users can configure their own API keys (Bring-Your-Own-Key) with local, private `localStorage` persistence:
* **🐧 MakuluLinux Electra:** `electra-nano` (rapid sub-second scene commands) and `electra` (complex architecture synthesis).
* **⚡ OpenAI:** `gpt-4o`, `gpt-4o-mini`, `o3-mini`, `gpt-4-turbo`.
* **✨ Google Gemini:** `gemini-2.0-flash`, `gemini-1.5-pro`, `gemini-1.5-flash`, `gemini-2.5-pro-exp`.
* **🧠 Anthropic Claude:** `claude-3-5-sonnet-20241022`, `claude-3-5-haiku-20241022`, `claude-3-opus-20240229`.
* **⚡ Groq Cloud (Ultra-Fast LPU):** `llama-3.3-70b-versatile`, `llama-3.1-8b-instant`, `deepseek-r1-distill-llama-70b`.
* **🌙 Kimi (Moonshot AI):** `moonshot-v1-8k`, `moonshot-v1-32k`, `moonshot-v1-128k`.
* **🌪️ Mistral AI:** `mistral-large-latest`, `codestral-latest` (dedicated game code model).
* **🔮 MiniMax / Mimo:** `MiniMax-Text-01`, `abab6.5s-chat`.
* **🌐 OpenRouter:** Multi-model gateway (`openrouter/auto`, `deepseek/deepseek-chat`, etc.).
* **💻 Custom / Local AI (Offline):** Connect directly to local **Ollama**, **LM Studio**, or **vLLM** (`http://localhost:11434/v1/chat/completions`).

### 🛠️ Autonomous AI Action Capabilities
The AI Executor translates intent into direct engine modifications with full undo history:
* **Scene Construction:** Spawn primitives, GLB 3D models, procedural terrains, and lights.
* **Transform Operations:** Translate, rotate (Euler angles), and scale entities.
* **Behavior Injection:** Attach interactive WASD, Spin, Flicker, Patrol, Billboard, or Collectible behaviors.
* **Atmosphere Control:** Switch sky presets (Day, Sunset, Cyberpunk, Foggy, Night) via AI prompts.
* **Component Engineering:** Dynamically attach Rigidbody, Collision, Light, Render, Audio, and Particle components.
* **Entity Management:** Select, frame, reparent, duplicate, and delete scene nodes on command.

---

## ⚡ Plug & Play Behavior Engine

Add interactive gameplay logic without writing a single line of JavaScript:

1. **🎮 WASD Player Controller:**
   Converts any mesh (Sphere, Cube, Capsule, or imported 3D character) into a responsive player character. Steer using `W`, `A`, `S`, `D` or Arrow Keys with acceleration and rotational smoothing during Play/Simulate mode.
2. **🌀 Continuous Spin Animation:**
   Smoothly rotates entities along their vertical Y-axis. Perfect for floating gems, powerups, spinning coins, and radar antennas.
3. **🔥 Torch Light Flicker:**
   Modulates light intensity and range using procedural Perlin noise fluctuation, creating realistic medieval campfires, dungeon torches, and flickering neon lamps.
4. **💥 Spacebar Physics Jump:**
   Adds dynamic rigidbody impulse jumping on Spacebar press during simulation mode.
5. **🚶 Patrol Movement:**
   Automatically translates entities back and forth along an axis across a configurable travel distance and speed. Ideal for guards, moving platforms, and patrolling enemies.
6. **🎯 Billboard Camera Alignment:**
   Dynamically rotates entities to face the active camera at all times. Perfect for 2D sprites, health bars, nametags, and UI icons in 3D space.
7. **💎 Collectible Item Pickups:**
   Detects proximity between player entities and items, triggering collection events, sound effects, and entity removal.
8. **🌊 Sine Wave Floating:**
   Oscillates entities vertically using smooth sinusoidal motion with adjustable amplitude and frequency. Perfect for hovering powerups, mystical relics, and floating platforms.
9. **💫 Orbit Movement:**
   Rotates entities circularly around a central point at a configurable speed and radius. Ideal for planetary bodies, circling drones, and magical shields.
10. **🎥 Third-Person Camera Follow:**
    Smoothly lerps the scene camera to track the target entity from a customizable offset vector, creating an instant third-person action game perspective.
11. **❤️ Health Component:**
    Assigns health points (HP) to player or entity characters with damage invincibility frames, automated HUD health bar syncing, and Game Over triggers upon reaching 0 HP.
12. **⚔️ Damage Dealer Hazard:**
    Transforms entities into dangerous enemies, spikes, or lava traps that inflict contact damage onto player characters within an adjustable radius.
13. **💚 Health Potion Pickup:**
    Creates restorative item drops that heal the player's health points upon contact, up to the maximum HP cap.

---

## 📺 2D Screen UI & HUD Designer

Design and customize responsive screen UI overlays directly from the TopBar (`📺 HUD`):
* **❤️ Health Bar Overlay:** Toggleable health bar with customizable label, max health, custom fill colors, and animated depletion.
* **⭐ Score Counter:** Dynamic score counter with prefix label and live updates from collectible coins and trigger points.
* **🎯 Center Screen Crosshair:** Toggleable aiming reticle with multiple styles (**● Dot**, **┼ Crosshair**, **◯ Circle**).
* **💀 Game Over Screen:** High-impact overlay with custom death messages and a 1-click **Restart** button that triggers on player defeat.
* **Seamless Standalone Compilation:** All HUD elements compile natively into standalone single-file `.html` web games.

---

## ⚡ Interactive Trigger System

Create reactive game mechanics through modular trigger volumes:
* **Visual Inspector Trigger Configurator:** Configure trigger volumes directly on any entity in both Simple Mode and Pro Mode.
* **Dual Event Types:** Support for both **On Player Enter** (`on_enter`) and **On Player Exit** (`on_exit`) proximity triggers.
* **🌀 Teleport:** Instantaneous entity relocation across the scene.
* **⚔️ Damage Player:** Inflict direct numeric damage onto the player's health points.
* **💚 Heal Player:** Restore health points to the player character upon entering zones.
* **⭐ Add Score:** Reward points directly to the screen UI HUD score counter.
* **💡 Toggle Visibility:** Dynamically reveal secret rooms, hidden passages, and puzzle clues.
* **💥 Destroy Entity:** Remove destructible obstacles, defeated enemies, or consumed barriers.
* **✨ Spawn Prefab:** Dynamically instantiate prefab templates (loot, enemies, hazards) upon entering trigger zones.
* **🔊 Audio Playback:** Trigger spatial sounds, ambient stingers, and musical cues.
* **Standalone Web Execution:** All trigger volume mechanics compile directly into standalone `.html` web games.

---

## 🎨 PBR Material Studio & Global Project Settings

* **🎨 PBR Material & Shader Creator (`🎨 Material`):**
  * Live **3D Orbiting Sphere Preview** rendered via real-time WebGL.
  * Adjust Diffuse Color, Metallic, Roughness, Emissive Glow, and Opacity.
  * Direct 1-click **"Apply to Selected Object"** or **"Save as Asset"** to your project library.
  * **🎨 PBR Preset Material Hub:** Integrated into the Model Store, featuring pre-tuned material presets (Gold, Cyber Neon, Rustic Wood, Cobblestone Brick, Mossy Stone, Molten Lava, Crystal Water) with 1-click apply and project saving.
  * **Drag-and-Drop Material Assignment:** Drag `.mat` material cards from the Asset Browser directly onto any 3D entity in the viewport to apply instantly.
  * **Double-Click Quick Apply:** Double-click any saved material in the asset browser to immediately dress the currently selected entity.
  * **🖼️ Texture Diffuse Mapping:** Double-click image textures in the asset browser to assign them directly as diffuse texture maps.
  * **🔊 Instant Audio Previews:** Double-click audio assets in the asset browser to preview playback on the fly.
* **⚙️ Global Project & Physics Settings (`⚙️ Project`):**
  * **Physics Gravity Y:** Freely tune gravity between Earth (`-9.8 m/s²`), Moon (`-1.6 m/s²`), Zero-G (`0`), or high-gravity worlds.
  * **Tone Mapping Selection:** Choose between ACES Filmic, Linear Standard, and High Contrast Filmic.
  * **Shadow Map Resolution:** Toggle between Medium (1024×1024), High Crisp (2048×2048), and Low Mobile (512×512).
* **✨ Post-Processing & Render Pipeline FX (`✨ FX`):**
  * **High-Dynamic Range Bloom:** Adjustable bloom intensity and luminance threshold.
  * **Tone Mapping & Exposure:** Fine-tune exposure multiplier and HDR curve algorithms.
  * **Exponential Atmospheric Fog:** Custom fog color picker, fog density slider, and distance falloff.
* **🌌 Dynamic Atmosphere & Sky Presets:**
  * Switch between **☀️ Clear Day**, **🌅 Sunset**, **🌆 Cyberpunk**, **🌫️ Foggy Valley**, and **🌙 Night** with real-time ambient lighting and exponential squared fog (`pc.FOG_EXP2`).
* **🎬 Visual Animation Timeline & Keyframe Sequencer (`🎬 Timeline`):**
  * Integrated multi-track keyframe sequencer for position, rotation, and scale.
  * Real-time scrubbable time ruler with **🔴 Add Keyframe** recording and seamless playback loop evaluation.

---

## 📦 3D Model Store, Procedural Terrain, Prefabs & ECS Engine

* **📦 CC0 3D Model Store & Asset Hub:** Integrated catalog of 19 authentic public-domain (CC0) 3D GLB models (Kenney, Khronos) ready for 1-click spawning: hero characters, armored warriors, ships, trees, rocks, barrels, chests, and gates. Also includes direct links to **Poly Haven** (AAA CC0 HDRIs & textures), **ambientCG** (2,000+ seamless PBR maps), **Poly Pizza**, **Quaternius**, **CGTrader Free Models**, **OpenGameArt**, **Sketchfab**, and **Mixamo**, plus automatic asset registration for custom uploaded `.glb` files.
* **🦴 Skeletal Animation Playback:** Inspector animation controller automatically traverses root and child hierarchies to trigger and control skeletal animations on complex imported models.
* **📦 Prefab & Entity Template System:** Save any configured entity hierarchy as a reusable Prefab with 1-click **"Save Prefab"** in the Inspector. Re-instantiate prefabs into the scene with a single click or double-click from `/assets/prefabs`.
* **🏔️ Procedural Terrain Sculptor:** Multi-octave Perlin noise heightmap mesh generator with customizable resolution (16×16 to 128×128 vertices), max altitude, roughness, seamless edge falloff, and elevation-based vertex coloring (beach sand, lush grass, mountain rock, and snow peak). Includes physics mesh collision.
* **👁️ 3D Viewport Component Visual Wireframe Helpers:**
  * **Light Range Gizmo:** Wireframe sphere matching point/spot light radius and color.
  * **Spatial Audio Gizmo:** Cyan wireframe sphere displaying audio maximum attenuation range.
  * **Physics Collision Gizmo:** Real-time green wireframe outlines displaying box, sphere, capsule, and cylinder collision bounds.
* **🧩 Advanced ECS Component Inspector:**
  * **🎥 Camera:** FOV, Near Clip, and Far Clip.
  * **💡 Light Source:** Real-time visual color wheel picker, Intensity, Range, Cone Angles, and Shadow cascades.
  * **🎯 Collision Shapes:** Box, Sphere, Capsule, Cylinder, and Mesh.
  * **⚡ Rigidbody Physics:** Dynamic, Kinematic, Static, Mass, Restitution (bounciness), and Friction controls.
  * **✨ Particle Systems:** Built-in particle presets (🔥 Fire, 💨 Smoke, ⚡ Sparks, ✨ Magic Dust) with instant 1-click preset switching, particle count, rate, sorting, half-extents, and lifetime controls.
  * **🔊 3D Spatial Audio:** Audio asset URL configuration with in-editor playback preview, Volume, Pitch, and Loop toggles.
  * **⚡ Trigger Volumes:** Pro Mode addition and visual configuration of interactive proximity triggers.
  * **📜 Custom Scripting:** 1-click code editor attachment and execution.
* **🗂️ Multi-Scene Management & Hierarchy Power Tools:**
  * **Multi-Scene Switcher:** Create and navigate between multiple levels (`Main Scene`, `Level_2`, etc.) with automatic background state retention and scene JSON snapshotting.
  * **Scene Power Tools:** 1-click **Rename (`✏️`)**, **Duplicate (`📋`)**, and **Delete (`🗑️`)** scene actions directly in the TopBar.
  * **Entity Right-Click Context Menu:** Right-click any entity in the hierarchy tree to Rename, Frame (`F`), Duplicate (`Ctrl+D`), Add Child Entity, or Delete.
  * **Eye-Icon Visibility Toggles:** 1-click hide (`🙈`) or show (`👁️`) individual entities without deleting them.
  * **Drag & Drop Reparenting:** Organize complex scenes by dragging entities onto parents directly in the hierarchy tree.
  * **📂 Scene Import & 💾 Export:** Save and load full scene graphs as portable JSON files with complete component, model, trigger, and behavior state.

---

## 🎮 1-Click Game Genre Starter Templates

Test gameplay mechanics instantly using ready-to-play prototypes:
* **🎯 First-Person Arena (FPS):** Stone perimeter pillars, target dummies, directional lighting, and an active WASD player controller.
* **🗡️ Medieval Courtyard:** Rolling terrain, ancient stone arches, glowing campfire with light flicker behavior, and loot chest props.
* **🌆 Cyberpunk Neon City:** Dark obsidian ground, neon cyan and magenta spotlights, emissive floating holograms, and spinning signs.
* **🎲 Domino Physics Playground:** Row of domino slabs positioned in a chain reaction, with rigidbodies and an impulse trigger sphere.

---

## 🚀 Game Compiling & Cloud Publishing

Share games instantly across any platform:
* **Zero-Install Single-File HTML5 Compiler:** Packages the entire game, PlayCanvas 3D engine, custom behaviors (WASD, spin, flicker, patrol, billboard, collectible, float, orbit, camera follow, health, damage, potions), 2D Screen UI HUD overlays (health bar, score counter, crosshair, game over screen), Base64 inlined offline assets (audio, textures, models), PBR materials, lights with shadow casting, collision shapes, dynamic/static rigidbodies, atmosphere presets with exponential fog, interactive trigger volumes, particles, and spatial audio into a **single self-contained `.html` file**. Double-click to play in any browser (Linux, Windows, Mac, iOS, Android) with zero setup.
* **1-Click Makulu Cloud Web Hosting:** Click **🚀 Publish** to generate an instant live shareable web URL with clipboard copying and responsive touch controls.

---

## ⌨️ Complete Keyboard Shortcuts Reference

| Shortcut | Function | Context |
| :---: | :--- | :--- |
| **`Q`** | Select Mode (Hide Gizmos) | 3D Viewport |
| **`W`** | Translate / Move Gizmo | 3D Viewport |
| **`E`** | Rotate Gizmo | 3D Viewport |
| **`R`** | Scale Gizmo | 3D Viewport |
| **`F`** | Frame Selected (Center camera on object) | 3D Viewport |
| **`Ctrl + D`** | Duplicate Selected Entity | Hierarchy / Viewport |
| **`Ctrl + S`** | Export Scene JSON | Global |
| **`Ctrl + Z`** | Undo Last Scene / AI Action | Global |
| **`Ctrl + Y`** | Redo Last Action | Global |
| **`Delete`** | Delete Selected Entity | Hierarchy / Viewport |
| **`Spacebar`** | Physics Jump (when behavior attached) | Simulation (Play) |
| **Left Click + Drag** | Orbit Camera in 3D Space (Above-grid safe) | 3D Viewport |
| **Right Click + Drag** | WASD Spectator Flythrough Mode | 3D Viewport |
| **Middle Click / Shift+Left** | Pan View Horizontally & Vertically | 3D Viewport |
| **Mouse Wheel** | Zoom In / Out Exponentially | 3D Viewport |
| **`Escape`** | Deselect All / Close Dialogs | Global |

---

## 🛠️ Building and Packaging

### Prerequisites
* **Node.js** (v18.0.0 or higher)
* **npm** (v9.0.0 or higher)
* Linux, Windows, or macOS

### 1. Clone the Repository
```bash
git clone https://github.com/raymerjacque/Makulu-Game-Studio.git
cd Makulu-Game-Studio
```

### 2. Install Dependencies
```bash
cd editor
npm install
```

### 3. Run Automated Tests
```bash
# Run unit test suite
npm test
```

### 4. Launch Development Server
```bash
# Start Vite local development server (runs on http://localhost:3000)
npm run dev
```

### 5. Launch Native Desktop App (Electron)
```bash
# Launch native desktop studio shell
./launch.sh
# or from inside editor/
npm run electron
```

### 6. Build Standalone Linux Packages (AppImage & Debian)
```bash
# Builds production bundle, universal AppImage, and Debian .deb
npm run dist:linux
```
Output binaries will be generated in `editor/release/`:
* `MakuluLinux Game Studio-1.0.0.AppImage` (Universal across all Linux distros)
* `makululinux-game-studio_1.0.0_amd64.deb` (Debian, Ubuntu, Linux Mint)
* `linux-unpacked/makululinux-game-studio` (Standalone folder executable)

---

## 📄 License & Attribution

* **MakuluLinux Game Studio** is open source software licensed under the **[MIT License](LICENSE)**.
* **PlayCanvas Engine:** Forked and built upon the open-source [PlayCanvas Engine](https://github.com/playcanvas/engine) (MIT License).
* Built by the **MakuluLinux Team** for creators worldwide.
