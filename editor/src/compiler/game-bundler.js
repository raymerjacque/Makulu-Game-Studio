import { PROCEDURAL_SFX_RUNTIME_CODE } from '../engine/procedural-sfx.js';

/**
 * Standalone HTML5 Game Bundler & Compiler
 * Packages the active scene, entities, materials, behaviors, 2D HUD, Base64 assets, Ammo.js physics, particle emitters,
 * 3D spatial audio, and skeletal mesh character animations into a self-contained playable game.
 */

export class GameBundler {
  constructor(editor) {
    this.editor = editor;
  }

  compileStandaloneHTML(options = {}) {
    const sceneJSON = this.editor.exportSceneJSON();
    const title = options.title || this.editor.projectName || 'My MakuluLinux 3D Game';
    const author = options.author || 'MakuluLinux Creator';

    // Collect Base64 encoded assets if available
    const assetRegistry = [];
    if (this.editor.assetsPanel && this.editor.assetsPanel.assets) {
      this.editor.assetsPanel.assets.forEach(a => {
        if (a.base64Data) {
          assetRegistry.push({
            name: a.name,
            type: a.type,
            dataUrl: a.base64Data
          });
        }
      });
    }

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
  <title>${this.escapeHTML(title)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; overflow: hidden; background: #000; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; user-select: none; }
    #game-canvas { width: 100%; height: 100%; display: block; }

    /* Top Left Title Overlay */
    #ui-overlay {
      position: absolute;
      top: 12px;
      left: 12px;
      color: #fff;
      font-size: 12px;
      background: rgba(0,0,0,0.6);
      backdrop-filter: blur(8px);
      padding: 6px 14px;
      border-radius: 20px;
      pointer-events: none;
      display: flex;
      align-items: center;
      gap: 8px;
      z-index: 10;
    }

    /* 2D HUD UI Overlay Panel */
    #hud-container {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 20;
    }

    #hud-health-bar-wrap {
      position: absolute;
      top: 16px;
      left: 50%;
      transform: translateX(-50%);
      width: 240px;
      background: rgba(0,0,0,0.75);
      border: 1px solid rgba(255,255,255,0.2);
      border-radius: 12px;
      padding: 6px 10px;
      backdrop-filter: blur(8px);
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    #hud-health-label-wrap {
      display: flex;
      justify-content: space-between;
      color: #fff;
      font-size: 11px;
      font-weight: 700;
    }

    #hud-health-track {
      width: 100%;
      height: 10px;
      background: rgba(255,255,255,0.15);
      border-radius: 6px;
      overflow: hidden;
    }

    #hud-health-fill {
      height: 100%;
      width: 100%;
      background: #ef4444;
      transition: width 0.2s ease-out;
    }

    #hud-score-counter {
      position: absolute;
      top: 16px;
      right: 16px;
      background: rgba(0,0,0,0.75);
      border: 1px solid rgba(234,179,8,0.4);
      color: #facc15;
      font-weight: 800;
      font-size: 14px;
      padding: 6px 16px;
      border-radius: 20px;
      backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      gap: 8px;
    }

    #hud-ammo-counter {
      position: absolute;
      bottom: 20px;
      left: 20px;
      background: rgba(0,0,0,0.75);
      border: 1px solid rgba(0,229,255,0.4);
      color: #00e5ff;
      font-weight: 800;
      font-size: 13px;
      padding: 6px 14px;
      border-radius: 12px;
      backdrop-filter: blur(8px);
      display: none;
    }

    #hud-crosshair {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: rgba(255,255,255,0.85);
      font-size: 18px;
      font-weight: 700;
      pointer-events: none;
    }

    /* Game Over Modal Screen */
    #gameover-screen {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(15, 0, 0, 0.88);
      backdrop-filter: blur(12px);
      display: none;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 100;
      color: #fff;
      text-align: center;
      padding: 20px;
    }

    #gameover-title {
      font-size: 42px;
      font-weight: 900;
      color: #ef4444;
      text-shadow: 0 0 20px rgba(239,68,68,0.6);
      margin-bottom: 8px;
    }

    #gameover-msg {
      font-size: 14px;
      color: #cbd5e1;
      max-width: 400px;
      margin-bottom: 24px;
    }

    /* Victory Modal Screen */
    #victory-screen {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 20, 10, 0.88);
      backdrop-filter: blur(12px);
      display: none;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 100;
      color: #fff;
      text-align: center;
      padding: 20px;
    }

    #victory-title {
      font-size: 42px;
      font-weight: 900;
      color: #10b981;
      text-shadow: 0 0 25px rgba(16,185,129,0.8);
      margin-bottom: 8px;
    }

    #victory-msg {
      font-size: 14px;
      color: #cbd5e1;
      max-width: 400px;
      margin-bottom: 24px;
    }

    .btn-restart {
      background: #ef4444;
      color: #fff;
      border: none;
      padding: 10px 24px;
      font-size: 14px;
      font-weight: 700;
      border-radius: 8px;
      cursor: pointer;
      box-shadow: 0 0 15px rgba(239,68,68,0.5);
      pointer-events: auto;
    }

    .btn-win-restart {
      background: #10b981;
      color: #fff;
      border: none;
      padding: 10px 24px;
      font-size: 14px;
      font-weight: 700;
      border-radius: 8px;
      cursor: pointer;
      box-shadow: 0 0 15px rgba(16,185,129,0.5);
      pointer-events: auto;
    }

    #ui-fullscreen {
      position: absolute;
      bottom: 12px;
      right: 12px;
      background: rgba(255,102,0,0.85);
      border: none;
      color: #fff;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 700;
      cursor: pointer;
      z-index: 30;
    }
  </style>

  <!-- PlayCanvas Engine & Ammo.js Physics Engine Runtime -->
  <script src="https://code.playcanvas.com/ammo.751ef4f.js"></script>
  <script src="https://code.playcanvas.com/playcanvas-stable.min.js"></script>
</head>
<body>
  <div id="ui-overlay">
    <span style="color: #ff6600; font-weight: 700;">●</span>
    <span>${this.escapeHTML(title)}</span>
  </div>

  <!-- 2D HUD Screen UI -->
  <div id="hud-container">
    <div id="hud-health-bar-wrap" style="display: none;">
      <div id="hud-health-label-wrap">
        <span id="hud-health-title">HP</span>
        <span id="hud-health-num">100 / 100</span>
      </div>
      <div id="hud-health-track">
        <div id="hud-health-fill"></div>
      </div>
    </div>

    <div id="hud-score-counter" style="display: none;">
      <span id="hud-score-text">Score: 0</span>
    </div>

    <div id="hud-ammo-counter">
      <span id="hud-ammo-text">🔫 Plasma Ammo: 30 / ∞</span>
    </div>

    <div id="hud-keys-container" style="display: none; position: absolute; top: 70px; left: 20px; background: rgba(0,0,0,0.65); border: 1px solid rgba(250,204,21,0.4); padding: 4px 12px; border-radius: 12px; color: #facc15; font-size: 11px; font-weight: 700;">
      <span id="hud-keys-text">🔑 Keys: None</span>
    </div>

    <div id="hud-jetpack-container" style="display: none; position: absolute; bottom: 65px; left: 20px; width: 140px; background: rgba(0,0,0,0.65); border: 1px solid rgba(56,189,248,0.4); padding: 6px; border-radius: 8px;">
      <div style="font-size: 10px; color: #38bdf8; font-weight: 700; margin-bottom: 2px;">🚀 JETPACK FUEL</div>
      <div style="width: 100%; height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; overflow: hidden;">
        <div id="hud-jetpack-fill" style="width: 100%; height: 100%; background: #38bdf8; transition: width 0.08s linear;"></div>
      </div>
    </div>

    <div id="hud-crosshair" style="display: none;">●</div>
  </div>

  <!-- Game Over Screen -->
  <div id="gameover-screen">
    <div id="gameover-title">GAME OVER</div>
    <div id="gameover-msg">Your health reached 0. Press Restart to try again.</div>
    <button class="btn-restart" onclick="window.location.reload()">🔄 Restart Level</button>
  </div>

  <!-- Victory Screen -->
  <div id="victory-screen">
    <div id="victory-title">🏆 VICTORY!</div>
    <div id="victory-msg">Congratulations! You completed the level!</div>
    <button class="btn-win-restart" onclick="window.location.reload()">🎮 Play Again</button>
  </div>

  <button id="ui-fullscreen" onclick="document.documentElement.requestFullscreen()">⛶ Fullscreen</button>
  <canvas id="game-canvas"></canvas>

  <script>
    // Embedded Scene Data & Inlined Base64 Assets
    const SCENE_DATA = ${sceneJSON};
    const EMBEDDED_ASSETS = ${JSON.stringify(assetRegistry)};

    // Initialize PlayCanvas Runtime
    const canvas = document.getElementById('game-canvas');
    const app = new pc.Application(canvas, {
      mouse: new pc.Mouse(canvas),
      touch: new pc.TouchDevice(canvas),
      keyboard: new pc.Keyboard(window)
    });

    app.start();
    app.setCanvasFillMode(pc.FILLMODE_FILL_WINDOW);
    app.setCanvasResolution(pc.RESOLUTION_AUTO);

    window.addEventListener('resize', () => app.resizeCanvas());

    app.scene.ambientLight = new pc.Color(0.25, 0.25, 0.28);
    app.scene.toneMapping = pc.TONEMAP_ACES;

    // Set Atmosphere, Fog & PostFX Pipeline from Scene Data
    const preset = SCENE_DATA.atmosphere || 'day';
    if (preset === 'sunset') {
      app.scene.ambientLight = new pc.Color(0.4, 0.2, 0.25);
      app.scene.fog = pc.FOG_EXP2;
      app.scene.fogColor = new pc.Color(0.8, 0.4, 0.2);
      app.scene.fogDensity = 0.015;
    } else if (preset === 'cyberpunk') {
      app.scene.ambientLight = new pc.Color(0.05, 0.08, 0.18);
      app.scene.fog = pc.FOG_EXP2;
      app.scene.fogColor = new pc.Color(0.02, 0.05, 0.15);
      app.scene.fogDensity = 0.02;
    } else if (preset === 'foggy') {
      app.scene.ambientLight = new pc.Color(0.3, 0.35, 0.4);
      app.scene.fog = pc.FOG_EXP2;
      app.scene.fogColor = new pc.Color(0.45, 0.5, 0.55);
      app.scene.fogDensity = 0.035;
    } else if (preset === 'night') {
      app.scene.ambientLight = new pc.Color(0.02, 0.03, 0.08);
      app.scene.fog = pc.FOG_NONE;
    } else {
      app.scene.ambientLight = new pc.Color(0.25, 0.25, 0.28);
      app.scene.fog = pc.FOG_NONE;
    }

    if (SCENE_DATA.postProcessing) {
      const pfx = SCENE_DATA.postProcessing;
      if (pfx.exposure !== undefined) app.scene.exposure = pfx.exposure;
      if (pfx.toneMapping === 'aces') app.scene.toneMapping = pc.TONEMAP_ACES;
      else if (pfx.toneMapping === 'filmic') app.scene.toneMapping = pc.TONEMAP_FILMIC;
      else if (pfx.toneMapping === 'linear') app.scene.toneMapping = pc.TONEMAP_LINEAR;

      if (pfx.fog && pfx.fog.enabled) {
        app.scene.fog = pc.FOG_EXP2;
        if (pfx.fog.color) {
          const hex = pfx.fog.color;
          const r = parseInt(hex.slice(1, 3), 16) / 255;
          const g = parseInt(hex.slice(3, 5), 16) / 255;
          const b = parseInt(hex.slice(5, 7), 16) / 255;
          app.scene.fogColor = new pc.Color(r, g, b);
        }
        if (pfx.fog.density !== undefined) app.scene.fogDensity = pfx.fog.density;
      }

      if (pfx.bloom && pfx.bloom.enabled) {
        app.scene.exposure = (app.scene.exposure || 1.0) * (pfx.bloom.intensity || 1.0);
      }
    }

    if (SCENE_DATA.gravity && app.systems && app.systems.rigidbody) {
      app.systems.rigidbody.gravity.set(...SCENE_DATA.gravity);
    }

    // Apply Texture Compression & Hardware Filtering Pipeline
    if (SCENE_DATA.textureCompression && app.graphicsDevice) {
      if (SCENE_DATA.textureCompression.maxAnisotropy) {
        app.graphicsDevice.maxAnisotropy = SCENE_DATA.textureCompression.maxAnisotropy;
      }
    }

    // Execute Standalone Project Scripts
    if (SCENE_DATA.scripts) {
      Object.entries(SCENE_DATA.scripts).forEach(([scriptName, scriptCode]) => {
        try {
          const sTag = document.createElement('script');
          sTag.textContent = scriptCode;
          document.head.appendChild(sTag);
        } catch (err) {
          console.warn('Failed to load standalone script: ' + scriptName, err);
        }
      });
    }

    // Setup 2D HUD Screen UI
    const hudConfig = SCENE_DATA.hud || {};
    if (hudConfig.health && hudConfig.health.enabled !== false) {
      const barWrap = document.getElementById('hud-health-bar-wrap');
      if (barWrap) {
        barWrap.style.display = 'flex';
        document.getElementById('hud-health-title').textContent = hudConfig.health.label || 'HP';
        document.getElementById('hud-health-fill').style.background = hudConfig.health.color || '#ef4444';
      }
    }

    if (hudConfig.score && hudConfig.score.enabled !== false) {
      const scoreEl = document.getElementById('hud-score-counter');
      if (scoreEl) {
        scoreEl.style.display = 'flex';
        document.getElementById('hud-score-text').textContent = (hudConfig.score.label || 'Score:') + ' ' + (hudConfig.score.initial || 0);
      }
    }

    if (hudConfig.crosshair && hudConfig.crosshair.enabled !== false) {
      const chEl = document.getElementById('hud-crosshair');
      if (chEl) {
        chEl.style.display = 'block';
        if (hudConfig.crosshair.style === 'cross') chEl.textContent = '┼';
        else if (hudConfig.crosshair.style === 'circle') chEl.textContent = '◯';
        else chEl.textContent = '●';
      }
    }

    // Screen Shake Utility
    window._shakeTimer = 0;
    window._shakeIntensity = 0;
    window._shakeBaseCamPos = null;
    window.triggerScreenShake = function(intensity, duration) {
      window._shakeIntensity = intensity || 0.4;
      window._shakeTimer = duration || 0.3;
    };

    // Inline Procedural Web Audio SFX Generator
    ${PROCEDURAL_SFX_RUNTIME_CODE}

    // Build Scene Graph from Exported Data
    function buildNode(data, parent) {
      const ent = new pc.Entity(data.name);
      if (data.position) ent.setPosition(...data.position);
      if (data.rotation) ent.setEulerAngles(...data.rotation);
      if (data.scale) ent.setLocalScale(...data.scale);
      ent.enabled = data.enabled !== false;

      // 3D GLB Model Asset Loading & Skeletal Mesh Animation Control
      if (data.modelUrl) {
        const embedded = EMBEDDED_ASSETS.find(a => a.name === data.modelUrl || a.dataUrl === data.modelUrl);
        const urlToLoad = embedded ? embedded.dataUrl : data.modelUrl;

        app.assets.loadFromUrl(urlToLoad, 'container', (err, asset) => {
          if (!err && asset && asset.resource) {
            const modelEntity = asset.resource.instantiateRenderEntity({
              castShadows: true,
              receiveShadows: true
            });
            ent.addChild(modelEntity);

            // Skeletal Animation Player detection & Auto-Configuration
            if (asset.resource.animations && asset.resource.animations.length > 0) {
              const animAssets = asset.resource.animations;
              const animNames = animAssets.map(a => a.name);
              const idleClip = animNames.find(n => /idle|stand|survey|breath/i.test(n)) || animNames[0];
              const walkClip = animNames.find(n => /walk|stride/i.test(n)) || animNames.find(n => /move|run|sprint/i.test(n)) || animNames[0];
              const runClip = animNames.find(n => /sprint|run|fast/i.test(n)) || walkClip;

              ent._modelAnimations = animNames;
              ent._idleClip = idleClip;
              ent._walkClip = walkClip;
              ent._runClip = runClip;

              if (typeof pc !== 'undefined' && pc.AnimStateGraph) {
                const states = [
                  { name: 'START', speed: 1 },
                  ...animNames.map(name => ({
                    name: name,
                    speed: 1,
                    loop: true,
                    defaultState: name === idleClip
                  }))
                ];
                const transitions = [{ from: 'START', to: idleClip }];

                modelEntity.addComponent('anim', { activate: true, speed: 1.0 });
                modelEntity.anim.loadStateGraph(new pc.AnimStateGraph({
                  layers: [{ name: 'Base', states, transitions }],
                  parameters: { speed: { name: 'speed', type: 'FLOAT', value: 0 } }
                }));

                animAssets.forEach(a => {
                  if (a && a.resource) modelEntity.anim.assignAnimation(a.name, a.resource);
                });

                ent._animComp = modelEntity.anim;
                if (modelEntity.anim.baseLayer) modelEntity.anim.baseLayer.play(idleClip);
              }
            } else {
              const animComponent = ent.findComponent ? ent.findComponent('anim') || modelEntity.findComponent('anim') : null;
              if (animComponent) {
                ent._animComp = animComponent;
                if (animComponent.play) animComponent.play();
              }
            }
          }
        });
      }

      // Render Component & Material
      if (data.components && data.components.render) {
        ent.addComponent('render', {
          type: data.components.render.type || 'box',
          castShadows: data.components.render.castShadows !== false
        });
        if (data.components.render.material) {
          const m = data.components.render.material;
          const mat = new pc.StandardMaterial();
          if (m.diffuse) mat.diffuse = new pc.Color(...m.diffuse);
          if (m.metalness !== undefined) { mat.metalness = m.metalness; mat.useMetalness = true; }
          if (m.roughness !== undefined) mat.roughness = m.roughness;
          if (m.opacity !== undefined) { mat.opacity = m.opacity; if (m.opacity < 1.0) mat.blendType = pc.BLEND_NORMAL; }
          mat.update();
          ent.render.material = mat;
        }
      }

      // Light Component
      if (data.components && data.components.light) {
        const l = data.components.light;
        ent.addComponent('light', {
          type: l.type || 'point',
          color: l.color ? new pc.Color(...l.color) : new pc.Color(1, 1, 1),
          intensity: l.intensity !== undefined ? l.intensity : 2,
          range: l.range !== undefined ? l.range : 10,
          castShadows: l.castShadows !== false
        });
      }

      // Camera Component
      if (data.components && data.components.camera) {
        ent.addComponent('camera', {
          fov: data.components.camera.fov || 60,
          nearClip: data.components.camera.nearClip || 0.1,
          farClip: data.components.camera.farClip || 1000,
          clearColor: new pc.Color(0.1, 0.12, 0.15)
        });
      }

      // Collision Component
      if (data.components && data.components.collision) {
        const col = data.components.collision;
        ent.addComponent('collision', {
          type: col.type || 'box',
          radius: col.radius || 0.5,
          height: col.height || 2
        });
      }

      // Rigidbody Component
      if (data.components && data.components.rigidbody) {
        const rb = data.components.rigidbody;
        ent.addComponent('rigidbody', {
          type: rb.type || 'static',
          mass: rb.mass || 1,
          restitution: rb.restitution || 0.5,
          friction: rb.friction || 0.5,
          linearFactor: rb.linearFactor ? new pc.Vec3(...rb.linearFactor) : new pc.Vec3(1, 1, 1),
          angularFactor: rb.angularFactor ? new pc.Vec3(...rb.angularFactor) : new pc.Vec3(1, 1, 1)
        });
      }

      // Particle System Component
      if (data.components && data.components.particlesystem) {
        const ps = data.components.particlesystem;
        ent.addComponent('particlesystem', {
          numParticles: ps.numParticles || 60,
          lifetime: ps.lifetime || 1.5,
          rate: ps.rate || 0.05,
          particleScale: ps.particleScale || 0.5,
          colorGraph: ps.colorTint ? new pc.CurveSet([[0, ps.colorTint[0]], [0, ps.colorTint[1]], [0, ps.colorTint[2]]]) : null
        });
      }

      // 3D Spatial Audio / Sound Component
      if (data.components && data.components.sound) {
        const snd = data.components.sound;
        ent.addComponent('sound', {
          volume: snd.volume !== undefined ? snd.volume : 1,
          pitch: snd.pitch !== undefined ? snd.pitch : 1,
          loop: snd.loop !== false,
          minDistance: snd.minDistance !== undefined ? snd.minDistance : 1,
          maxDistance: snd.maxDistance !== undefined ? snd.maxDistance : 15,
          autoPlay: Boolean(snd.autoPlay)
        });
      }

      // Physics Joint Constraint Component
      if (data.components && data.components.joint) {
        ent.joint = data.components.joint;
      }

      // Visual Anim Graph State Machine
      if (data.animGraph) {
        ent._animGraph = data.animGraph;
      }

      // Script Component & Script Attributes Reflection
      if (data.components && data.components.script) {
        ent.addComponent('script');
        if (data.components.script.attributes) {
          ent.scriptData = data.components.script.attributes;
          Object.entries(data.components.script.attributes).forEach(([scriptName, attrs]) => {
            try {
              if (app.scripts && app.scripts.has(scriptName)) {
                ent.script.create(scriptName, { attributes: attrs });
              }
            } catch (err) {
              console.warn('Could not instantiate standalone script: ' + scriptName, err);
            }
          });
        }
      }

      // Behaviors
      if (data.behaviors) {
        ent._behaviors = data.behaviors;
      }

      parent.addChild(ent);

      if (data.children) {
        data.children.forEach(child => buildNode(child, ent));
      }

      return ent;
    }

    // Load Scene
    if (SCENE_DATA.root && SCENE_DATA.root.children) {
      SCENE_DATA.root.children.forEach(c => buildNode(c, app.root));
    }

    // Ensure a Camera exists
    let gameCamera = app.root.find(node => node.camera);
    if (!gameCamera) {
      gameCamera = new pc.Entity('Fallback Camera');
      gameCamera.addComponent('camera', {
        clearColor: new pc.Color(0.08, 0.1, 0.13),
        fov: 55
      });
      gameCamera.setPosition(0, 3, 7);
      gameCamera.lookAt(0, 1, 0);
      app.root.addChild(gameCamera);
    }

    // WASD Movement Runtime Loop
    const keys = {};
    window.addEventListener('keydown', e => keys[e.key.toLowerCase()] = true);
    window.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

    // Mouse Look / Pointer Lock
    let mouseDeltaX = 0;
    canvas.addEventListener('click', () => {
      if (document.pointerLockElement !== canvas) {
        canvas.requestPointerLock?.();
      }
    });
    document.addEventListener('mousemove', (e) => {
      if (document.pointerLockElement === canvas) {
        mouseDeltaX += e.movementX;
      }
    });

    const playerEntity = app.root.find(n => n.name.toLowerCase().includes('player') || n.name.toLowerCase().includes('character') || n.name.toLowerCase().includes('hero') || n.name.toLowerCase().includes('warrior')) || app.root.children[0];

    // Locomotion handler for standalone games (drives skeletal AnimComponent or procedural limbs)
    const updateLocomotion = (entity, speed, isMoving, dt) => {
      if (!entity) return;
      const animComp = entity._animComp || (entity.findComponent ? entity.findComponent('anim') : null) || entity.anim;
      if (animComp && animComp.baseLayer) {
        const activeState = animComp.baseLayer.activeState;
        const walkClip = entity._walkClip || 'walk';
        const runClip = entity._runClip || 'run';
        const idleClip = entity._idleClip || 'idle';
        if (isMoving) {
          const targetClip = (speed > 7.0 && entity._modelAnimations && entity._modelAnimations.includes(runClip)) ? runClip : walkClip;
          if (activeState !== targetClip) {
            try { animComp.baseLayer.transition(targetClip, 0.15); } catch(e) {
              try { animComp.baseLayer.play(targetClip); } catch(err) {}
            }
          }
          if (typeof animComp.setFloat === 'function') animComp.setFloat('speed', speed);
        } else {
          if (activeState !== idleClip) {
            try { animComp.baseLayer.transition(idleClip, 0.2); } catch(e) {
              try { animComp.baseLayer.play(idleClip); } catch(err) {}
            }
          }
          if (typeof animComp.setFloat === 'function') animComp.setFloat('speed', 0);
        }
        return;
      }

      // Procedural Limb Locomotion
      entity._locoPhase = (entity._locoPhase || 0) + (isMoving ? dt * speed * 2.5 : 0);
      const leftLeg = entity.findByName ? (entity.findByName('leg-left') || entity.findByName('LeftLeg')) : null;
      const rightLeg = entity.findByName ? (entity.findByName('leg-right') || entity.findByName('RightLeg')) : null;
      const leftArm = entity.findByName ? (entity.findByName('arm-left') || entity.findByName('LeftArm')) : null;
      const rightArm = entity.findByName ? (entity.findByName('arm-right') || entity.findByName('RightArm')) : null;
      if (leftLeg || rightLeg || leftArm || rightArm) {
        if (isMoving) {
          const legAngle = Math.sin(entity._locoPhase) * 26;
          const armAngle = -legAngle * 0.7;
          if (leftLeg) leftLeg.setLocalEulerAngles(legAngle, 0, 0);
          if (rightLeg) rightLeg.setLocalEulerAngles(-legAngle, 0, 0);
          if (leftArm) leftArm.setLocalEulerAngles(armAngle, 0, 0);
          if (rightArm) rightArm.setLocalEulerAngles(-armAngle, 0, 0);
        } else {
          if (leftLeg) leftLeg.setLocalEulerAngles(0, 0, 0);
          if (rightLeg) rightLeg.setLocalEulerAngles(0, 0, 0);
          if (leftArm) leftArm.setLocalEulerAngles(0, 0, 0);
          if (rightArm) rightArm.setLocalEulerAngles(0, 0, 0);
        }
      }
    };

    app.on('update', dt => {
      // Screen Shake Evaluation (nudges camera locally without snapping world position)
      if (window._shakeTimer > 0) {
        window._shakeTimer -= dt;
        const offsetX = (Math.random() - 0.5) * window._shakeIntensity;
        const offsetY = (Math.random() - 0.5) * window._shakeIntensity;
        gameCamera.translateLocal(offsetX, offsetY, 0);
      }

      // Execute embedded behaviors
      app.root.forEach(node => {
        if (!node.enabled || !node._behaviors) return;
        node._behaviors.forEach(b => {
          if (b.type === 'spin') {
            const speed = b.properties?.speed || 45;
            const axis = b.properties?.axis || 'y';
            const s = speed * dt;
            if (axis === 'x') node.rotate(s, 0, 0);
            else if (axis === 'y') node.rotate(0, s, 0);
            else if (axis === 'z') node.rotate(0, 0, s);
          } else if (b.type === 'light_flicker') {
            if (node.light) {
              const variance = b.properties?.variance || 0.4;
              const base = b.properties?.baseIntensity || 2;
              node.light.intensity = Math.max(0.1, base + (Math.random() - 0.5) * variance);
            }
          } else if (b.type === 'physics_impulse') {
            if (node.rigidbody && (keys[' '] || keys['space'])) {
              const force = b.properties?.force || 8;
              node.rigidbody.applyImpulse(0, force, 0);
            }
          } else if (b.type === 'patrol') {
            const speed = b.properties?.speed || 3;
            const distance = b.properties?.distance || 6;
            if (!b._state) b._state = { startX: node.getPosition().x, dir: 1 };
            const currentX = node.getPosition().x;
            const delta = currentX - b._state.startX;
            if (delta > distance && b._state.dir > 0) b._state.dir = -1;
            if (delta < -distance && b._state.dir < 0) b._state.dir = 1;
            node.translate(b._state.dir * speed * dt, 0, 0);
            updateLocomotion(node, speed, true, dt);
          } else if (b.type === 'moving_platform') {
            const speed = b.properties?.speed || 2.5;
            const distance = b.properties?.distance || 8;
            const axis = b.properties?.axis || 'y';
            if (!b._state) b._state = { startPos: node.getPosition().clone(), dir: 1 };
            const curPos = node.getPosition();
            if (axis === 'y') {
              const d = curPos.y - b._state.startPos.y;
              if (d > distance && b._state.dir > 0) b._state.dir = -1;
              if (d < 0 && b._state.dir < 0) b._state.dir = 1;
              node.translate(0, b._state.dir * speed * dt, 0);
            } else if (axis === 'z') {
              const d = curPos.z - b._state.startPos.z;
              if (d > distance && b._state.dir > 0) b._state.dir = -1;
              if (d < -distance && b._state.dir < 0) b._state.dir = 1;
              node.translate(0, 0, b._state.dir * speed * dt);
            } else {
              const d = curPos.x - b._state.startPos.x;
              if (d > distance && b._state.dir > 0) b._state.dir = -1;
              if (d < -distance && b._state.dir < 0) b._state.dir = 1;
              node.translate(b._state.dir * speed * dt, 0, 0);
            }
          } else if (b.type === 'interactive_door') {
            if (playerEntity) {
              const nPos = node.getPosition();
              const pPos = playerEntity.getPosition();
              const distXZ = Math.hypot(nPos.x - pPos.x, nPos.z - pPos.z);
              const radius = b.properties?.radius || 3.0;
              if (!b._state) b._state = { isOpen: false, startY: nPos.y };
              if (distXZ <= radius && !b._state.isOpen) {
                b._state.isOpen = true;
                node.translate(0, 3, 0);
              } else if (distXZ > radius && b._state.isOpen) {
                b._state.isOpen = false;
                node.setPosition(nPos.x, b._state.startY, nPos.z);
              }
            }
          } else if (b.type === 'enemy_spawner') {
            if (!b._timer) b._timer = 0;
            b._timer -= dt;
            if (b._timer <= 0) {
              b._timer = b.properties?.interval || 6.0;
              const enemy = new pc.Entity('Spawned_Enemy_' + Date.now());
              enemy.setPosition(node.getPosition().clone().add(new pc.Vec3(0, 1, 0)));
              enemy.setLocalScale(0.9, 1.8, 0.9);

              const mat = new pc.StandardMaterial();
              mat.diffuse = new pc.Color(0.9, 0.1, 0.1);
              mat.update();

              enemy.addComponent('render', { type: 'capsule', material: mat });
              enemy._behaviors = [{ type: 'enemy_ai', properties: { speed: 3, damage: 10 } }];
              app.root.addChild(enemy);
            }
          } else if (b.type === 'weapon_inventory') {
            const ammoEl = document.getElementById('hud-ammo-counter');
            if (ammoEl) {
              ammoEl.style.display = 'block';
              document.getElementById('hud-ammo-text').textContent = "🔫 Weapon Active: " + (b.properties?.weaponName || 'Plasma Gun') + " | Ammo: " + (b.properties?.ammo !== undefined ? b.properties.ammo : '∞');
            }
          } else if (b.type === 'billboard') {
            const cam = app.root.find(c => c.camera);
            if (cam) {
              node.lookAt(cam.getPosition());
              node.rotateLocal(0, 180, 0);
            }
          } else if (b.type === 'sine_float') {
            const amplitude = b.properties?.amplitude || 0.5;
            const frequency = b.properties?.frequency || 2.0;
            if (!b._state) b._state = { initialY: node.getPosition().y, time: 0 };
            b._state.time += dt * frequency;
            const p = node.getPosition();
            node.setPosition(p.x, b._state.initialY + Math.sin(b._state.time) * amplitude, p.z);
          } else if (b.type === 'orbit') {
            const speed = b.properties?.speed || 1.0;
            const radius = b.properties?.radius || 5.0;
            if (!b._state) {
              b._state = {
                angle: 0,
                center: b.properties?.center ? new pc.Vec3(...b.properties.center) : new pc.Vec3(0, node.getPosition().y, 0)
              };
            }
            b._state.angle += dt * speed;
            const x = b._state.center.x + Math.cos(b._state.angle) * radius;
            const z = b._state.center.z + Math.sin(b._state.angle) * radius;
            node.setPosition(x, node.getPosition().y, z);
          } else if (b.type === 'camera_follow') {
            const cam = app.root.find(c => c.camera);
            if (cam) {
              const offset = b.properties?.offset || [0, 4, 8];
              const targetPos = node.getPosition().clone().add(new pc.Vec3(...offset));
              const curPos = cam.getPosition();
              curPos.lerp(curPos, targetPos, Math.min(1.0, dt * 5.0));
              cam.setPosition(curPos);
              cam.lookAt(node.getPosition());
            }
          } else if (b.type === 'collectible') {
            if (playerEntity) {
              const dist = node.getPosition().distance(playerEntity.getPosition());
              if (dist < (b.properties?.radius || 1.5)) {
                node.enabled = false;
              }
            }
          } else if (b.type === 'health') {
            if (b.properties.currentHp === undefined) b.properties.currentHp = b.properties.maxHp || 100;
            if (!b._invincibleTimer) b._invincibleTimer = 0;
            if (b._invincibleTimer > 0) b._invincibleTimer -= dt;

            // Update 2D Screen HUD Health Bar
            const maxHp = b.properties.maxHp || 100;
            const curHp = b.properties.currentHp;
            const pct = Math.max(0, Math.min(100, (curHp / maxHp) * 100));

            const fillEl = document.getElementById('hud-health-fill');
            const numEl = document.getElementById('hud-health-num');
            if (fillEl) fillEl.style.width = pct + '%';
            if (numEl) numEl.textContent = curHp + ' / ' + maxHp;

            if (curHp <= 0) {
              const goScreen = document.getElementById('gameover-screen');
              if (goScreen) goScreen.style.display = 'flex';
            }
          } else if (b.type === 'damage_dealer') {
            if (playerEntity) {
              const dist = node.getPosition().distance(playerEntity.getPosition());
              const radius = b.properties?.radius || 1.8;
              const dmg = b.properties?.damage || 20;
              if (dist < radius) {
                const playerB = playerEntity._behaviors || [];
                const healthB = playerB.find(hb => hb.type === 'health');
                if (healthB && (!healthB._invincibleTimer || healthB._invincibleTimer <= 0)) {
                  healthB.properties.currentHp = Math.max(0, (healthB.properties.currentHp || healthB.properties.maxHp || 100) - dmg);
                  healthB._invincibleTimer = b.properties?.cooldown || 1.0;
                  window.triggerScreenShake(0.5, 0.25);
                }
              }
            }
          } else if (b.type === 'health_pickup') {
            if (playerEntity) {
              const dist = node.getPosition().distance(playerEntity.getPosition());
              const radius = b.properties?.radius || 1.5;
              const heal = b.properties?.healAmount || 25;
              if (dist < radius) {
                const playerB = playerEntity._behaviors || [];
                const healthB = playerB.find(hb => hb.type === 'health');
                if (healthB) {
                  const maxHp = healthB.properties.maxHp || 100;
                  healthB.properties.currentHp = Math.min(maxHp, (healthB.properties.currentHp || maxHp) + heal);
                  node.enabled = false;
                }
              }
            }
          } else if (b.type === 'enemy_ai') {
            if (playerEntity) {
              const speed = b.properties?.speed || 3.5;
              const detectRadius = b.properties?.detectRadius || 15;
              const attackRadius = b.properties?.attackRadius || 1.8;
              const pos = node.getPosition();
              const targetPos = playerEntity.getPosition();
              const dist = pos.distance(targetPos);

              if (dist <= detectRadius) {
                const lookPos = new pc.Vec3(targetPos.x, pos.y, targetPos.z);
                node.lookAt(lookPos);

                if (dist > attackRadius) {
                  const dir = lookPos.sub(pos).normalize().mulScalar(speed * dt);
                  node.translate(dir);
                  updateLocomotion(node, speed, true, dt);
                } else {
                  updateLocomotion(node, speed, false, dt);
                  if (!b._attackTimer) b._attackTimer = 0;
                  b._attackTimer -= dt;
                  if (b._attackTimer <= 0) {
                    b._attackTimer = b.properties?.attackRate || 1.0;
                    const playerB = playerEntity._behaviors || [];
                    const healthB = playerB.find(hb => hb.type === 'health');
                    if (healthB) {
                      const dmg = b.properties?.damage || 15;
                      healthB.properties.currentHp = Math.max(0, (healthB.properties.currentHp || 100) - dmg);
                      window.triggerScreenShake(0.4, 0.2);
                    }
                  }
                }
              } else {
                updateLocomotion(node, speed, false, dt);
              }
            }
          } else if (b.type === 'first_person_controller') {
            const speed = b.properties?.speed || 10;
            const rotSpeed = b.properties?.rotSpeed || 90;
            const move = new pc.Vec3();

            const forward = new pc.Vec3(node.forward.x, 0, node.forward.z);
            if (forward.lengthSq() > 0.0001) forward.normalize();
            const right = new pc.Vec3(node.right.x, 0, node.right.z);
            if (right.lengthSq() > 0.0001) right.normalize();

            if (keys['w'] || keys['arrowup']) move.add(forward);
            if (keys['s'] || keys['arrowdown']) move.sub(forward);
            if (keys['a']) move.sub(right);
            if (keys['d']) move.add(right);

            if (keys['q'] || keys['arrowleft']) node.rotate(0, rotSpeed * dt, 0);
            if (keys['e'] || keys['arrowright']) node.rotate(0, -rotSpeed * dt, 0);

            if (mouseDeltaX !== 0) {
              const sens = b.properties?.sensitivity || 0.15;
              node.rotate(0, -mouseDeltaX * sens, 0);
              mouseDeltaX = 0;
            }

            const isMoving = move.lengthSq() > 0.0001;
            if (isMoving) {
              move.normalize().mulScalar(speed * dt);
              node.translate(move);
            }
            updateLocomotion(node, speed, isMoving, dt);

            if (gameCamera) {
              gameCamera.setPosition(node.getPosition().clone().add(new pc.Vec3(0, 1.6, 0)));
              gameCamera.setEulerAngles(node.getEulerAngles());
            }
          } else if (b.type === 'target_health') {
            if (b.properties.currentHp === undefined) b.properties.currentHp = b.properties.maxHp || 100;
            if (b.properties.currentHp <= 0 && node.enabled) {
              node.enabled = false;
              if (window.playProceduralSFX) window.playProceduralSFX('explosion');
              window.triggerScreenShake(0.5, 0.25);
            }
          } else if (b.type === 'key_pickup') {
            if (playerEntity) {
              const dist = node.getPosition().distance(playerEntity.getPosition());
              const radius = b.properties?.radius || 1.8;
              if (dist < radius) {
                node.enabled = false;
                if (!playerEntity._collectedKeys) playerEntity._collectedKeys = new Set();
                const keyName = b.properties?.keyName || 'Gold Key';
                playerEntity._collectedKeys.add(keyName);
                if (window.playProceduralSFX) window.playProceduralSFX('coin');
                const keysEl = document.getElementById('hud-keys-container');
                if (keysEl) {
                  keysEl.style.display = 'block';
                  const keyText = document.getElementById('hud-keys-text');
                  if (keyText) keyText.textContent = "🔑 Keys: " + Array.from(playerEntity._collectedKeys).join(', ');
                }
              }
            }
          } else if (b.type === 'locked_door') {
            if (playerEntity) {
              const nPos = node.getPosition();
              const pPos = playerEntity.getPosition();
              const distXZ = Math.hypot(nPos.x - pPos.x, nPos.z - pPos.z);
              const radius = b.properties?.radius || 3.5;
              const reqKey = b.properties?.requiredKey || 'Gold Key';

              if (!b._state) b._state = { isOpen: false, startY: nPos.y };
              const hasKey = Boolean(playerEntity._collectedKeys && playerEntity._collectedKeys.has(reqKey));

              if (distXZ <= radius && !b._state.isOpen) {
                if (hasKey) {
                  b._state.isOpen = true;
                  node.translate(0, 3.5, 0);
                  if (window.playProceduralSFX) window.playProceduralSFX('door');
                }
              } else if (distXZ > radius && b._state.isOpen) {
                b._state.isOpen = false;
                node.setPosition(nPos.x, b._state.startY, nPos.z);
              }
            }
          } else if (b.type === 'jetpack') {
            if (b.properties.fuel === undefined) b.properties.fuel = b.properties.maxFuel || 100;
            const thrustKey = keys['shift'] || keys['space'] || keys[' '];
            if (thrustKey && b.properties.fuel > 0) {
              b.properties.fuel = Math.max(0, b.properties.fuel - dt * 35);
              const thrust = b.properties?.thrust || 12;
              if (node.rigidbody) {
                node.rigidbody.applyImpulse(0, thrust * dt, 0);
              } else {
                node.translate(0, thrust * dt * 0.5, 0);
              }
              if (window.playProceduralSFX) window.playProceduralSFX('boost', 0.2);
            } else {
              b.properties.fuel = Math.min(b.properties.maxFuel || 100, b.properties.fuel + dt * 20);
            }

            const jpEl = document.getElementById('hud-jetpack-container');
            if (jpEl) {
              jpEl.style.display = 'block';
              const fill = document.getElementById('hud-jetpack-fill');
              if (fill) fill.style.width = Math.max(0, Math.min(100, (b.properties.fuel / (b.properties.maxFuel || 100)) * 100)) + '%';
            }
          } else if (b.type === 'level_portal') {
            if (playerEntity) {
              const dist = node.getPosition().distance(playerEntity.getPosition());
              const radius = b.properties?.radius || 2.0;
              if (dist < radius) {
                if (window.playProceduralSFX) window.playProceduralSFX('victory');
                const vicScreen = document.getElementById('victory-screen');
                if (vicScreen) vicScreen.style.display = 'flex';
              }
            }
          } else if (b.type === 'audio_trigger') {
            if (playerEntity) {
              const dist = node.getPosition().distance(playerEntity.getPosition());
              const radius = b.properties?.radius || 3.0;
              if (!b._state) b._state = { triggered: false };
              if (dist < radius && !b._state.triggered) {
                b._state.triggered = true;
                if (window.playProceduralSFX) window.playProceduralSFX(b.properties?.sfxType || 'coin');
              } else if (dist >= radius && b._state.triggered) {
                b._state.triggered = false;
              }
            }
          } else if (b.type === 'postfx_trigger') {
            if (playerEntity) {
              const dist = node.getPosition().distance(playerEntity.getPosition());
              const radius = b.properties?.radius || 4.0;
              if (!b._state) b._state = { active: false };
              if (dist < radius && !b._state.active) {
                b._state.active = true;
                const preset = b.properties?.atmosphere || 'cyberpunk';
                if (preset === 'sunset') {
                  app.scene.ambientLight = new pc.Color(0.4, 0.2, 0.25);
                  app.scene.fog = pc.FOG_EXP2;
                  app.scene.fogColor = new pc.Color(0.8, 0.4, 0.2);
                  app.scene.fogDensity = 0.015;
                } else if (preset === 'cyberpunk') {
                  app.scene.ambientLight = new pc.Color(0.05, 0.08, 0.18);
                  app.scene.fog = pc.FOG_EXP2;
                  app.scene.fogColor = new pc.Color(0.02, 0.05, 0.15);
                  app.scene.fogDensity = 0.02;
                } else if (preset === 'foggy') {
                  app.scene.ambientLight = new pc.Color(0.3, 0.35, 0.4);
                  app.scene.fog = pc.FOG_EXP2;
                  app.scene.fogColor = new pc.Color(0.45, 0.5, 0.55);
                  app.scene.fogDensity = 0.035;
                } else if (preset === 'night') {
                  app.scene.ambientLight = new pc.Color(0.02, 0.03, 0.08);
                  app.scene.fog = pc.FOG_NONE;
                } else {
                  app.scene.ambientLight = new pc.Color(0.25, 0.25, 0.28);
                  app.scene.fog = pc.FOG_NONE;
                }
              } else if (dist >= radius && b._state.active) {
                b._state.active = false;
              }
            }
          } else if (b.type === 'mouse_look') {
            const rotSpeed = b.properties?.speed || 90;
            if (keys['arrowleft'] || keys['q']) node.rotate(0, rotSpeed * dt, 0);
            if (keys['arrowright'] || keys['e']) node.rotate(0, -rotSpeed * dt, 0);
            if (mouseDeltaX !== 0) {
              const sens = b.properties?.sensitivity || 0.15;
              node.rotate(0, -mouseDeltaX * sens, 0);
              mouseDeltaX = 0;
            }
          } else if (b.type === 'lava_hazard') {
            if (playerEntity) {
              const dist = node.getPosition().distance(playerEntity.getPosition());
              const radius = b.properties?.radius || 2.5;
              const dmg = b.properties?.damage || 100;
              if (dist < radius) {
                const playerB = playerEntity._behaviors || [];
                const healthB = playerB.find(hb => hb.type === 'health');
                if (healthB && (!healthB._invincibleTimer || healthB._invincibleTimer <= 0)) {
                  healthB.properties.currentHp = Math.max(0, (healthB.properties.currentHp || 100) - dmg);
                  healthB._invincibleTimer = 1.0;
                  if (window.playProceduralSFX) window.playProceduralSFX('explosion');
                  window.triggerScreenShake(0.6, 0.3);
                }
              }
            }
          } else if (b.type === 'coin_bounce') {
            const speed = b.properties?.speed || 90;
            const amp = b.properties?.amplitude || 0.3;
            if (!b._state) b._state = { startY: node.getPosition().y, time: 0 };
            b._state.time += dt * 3.0;
            node.rotate(0, speed * dt, 0);
            const pos = node.getPosition();
            node.setPosition(pos.x, b._state.startY + Math.sin(b._state.time) * amp, pos.z);
          } else if (b.type === 'light_color_cycle') {
            if (node.light) {
              const speed = b.properties?.speed || 1.0;
              if (!b._state) b._state = { time: 0 };
              b._state.time += dt * speed;
              const r = (Math.sin(b._state.time) + 1) / 2;
              const g = (Math.sin(b._state.time + 2.094) + 1) / 2;
              const bColor = (Math.sin(b._state.time + 4.188) + 1) / 2;
              node.light.color = new pc.Color(r, g, bColor);
            }
          } else if (b.type === 'waypoint_patrol') {
            let waypoints = b.properties?.waypoints || [[-5, 0, 0], [5, 0, 0], [0, 0, 5]];
            if (typeof waypoints === 'string') {
              try { waypoints = JSON.parse(waypoints); } catch (e) { waypoints = [[-5, 0, 0], [5, 0, 0], [0, 0, 5]]; }
            }
            if (!Array.isArray(waypoints) || waypoints.length === 0) waypoints = [[-5, 0, 0], [5, 0, 0], [0, 0, 5]];
            const speed = b.properties?.speed || 4.0;
            if (!b._state) b._state = { index: 0 };
            const targetCoord = waypoints[b._state.index % waypoints.length];
            if (targetCoord && targetCoord.length >= 3) {
              const targetVec = new pc.Vec3(targetCoord[0], targetCoord[1], targetCoord[2]);
              const curPos = node.getPosition();
              const dist = curPos.distance(targetVec);

              if (dist < 0.5) {
                b._state.index++;
                updateLocomotion(node, speed, false, dt);
              } else {
                const dir = targetVec.clone().sub(curPos).normalize().scale(speed * dt);
                node.translate(dir);
                updateLocomotion(node, speed, true, dt);
              }
            }
          } else if (b.type === 'dash_boost') {
            if (!b._cooldown) b._cooldown = 0;
            if (b._cooldown > 0) b._cooldown -= dt;
            const boostKey = keys['shift'] || keys['lshift'];
            if (boostKey && b._cooldown <= 0) {
              b._cooldown = b.properties?.cooldown || 1.2;
              const force = b.properties?.force || 25;
              const forwardDir = new pc.Vec3(node.forward.x, 0, node.forward.z);
              if (forwardDir.lengthSq() > 0.0001) forwardDir.normalize();
              else forwardDir.set(0, 0, -1);
              if (node.rigidbody) {
                node.rigidbody.applyImpulse(forwardDir.x * force, 0, forwardDir.z * force);
              } else {
                node.translate(forwardDir.x * (force * 0.15), 0, forwardDir.z * (force * 0.15));
              }
              if (window.playProceduralSFX) window.playProceduralSFX('boost', 0.25);
            }
          } else if (b.type === 'health_regen') {
            if (!b._regenTimer) b._regenTimer = 0;
            b._regenTimer -= dt;
            if (b._regenTimer <= 0) {
              b._regenTimer = b.properties?.interval || 2.0;
              const playerB = node._behaviors || [];
              const healthB = playerB.find(hb => hb.type === 'health' || hb.type === 'target_health');
              if (healthB) {
                const maxHp = healthB.properties?.maxHp || 100;
                const regenAmount = b.properties?.amount || 5;
                if ((healthB.properties.currentHp || maxHp) < maxHp) {
                  healthB.properties.currentHp = Math.min(maxHp, (healthB.properties.currentHp || maxHp) + regenAmount);
                }
              }
            }
          } else if (b.type === 'day_night_cycle') {
            const speed = b.properties?.speed || 0.1;
            node.rotate(speed * dt * 15, 0, 0);
          } else if (b.type === 'spotlight_flicker') {
            if (node.light && node.light.type === 'spot') {
              const baseAngle = b.properties?.baseOuterAngle || 45;
              const variance = b.properties?.variance || 8;
              node.light.outerConeAngle = Math.max(10, baseAngle + (Math.random() - 0.5) * variance);
            }
          } else if (b.type === 'target_lock_on') {
            const targetName = b.properties?.targetEntity;
            if (targetName) {
              const target = app.root.findByName(targetName) || app.root.find(e => e.name && e.name.toLowerCase().includes(targetName.toLowerCase()));
              if (target && target.enabled) {
                node.lookAt(target.getPosition());
              }
            }
          } else if (b.type === 'turret_ai') {
            if (playerEntity) {
              const range = b.properties?.range || 20;
              const fireRate = b.properties?.fireRate || 1.5;
              const pos = node.getPosition();
              const plyPos = playerEntity.getPosition();
              const dist = pos.distance(plyPos);
              if (dist <= range) {
                node.lookAt(plyPos);
                if (!b._fireTimer) b._fireTimer = 0;
                b._fireTimer -= dt;
                if (b._fireTimer <= 0) {
                  b._fireTimer = fireRate;
                  if (window.playProceduralSFX) window.playProceduralSFX('laser');
                  const bullet = new pc.Entity('TurretBullet_' + Date.now());
                  bullet.setPosition(pos.clone().add(node.forward.clone().mulScalar(1.2)));
                  bullet.setEulerAngles(node.getEulerAngles());
                  bullet.setLocalScale(0.2, 0.2, 0.4);
                  const mat = new pc.StandardMaterial();
                  mat.diffuse = new pc.Color(1, 0, 0.5);
                  mat.emissive = new pc.Color(1, 0, 0.5);
                  mat.update();
                  bullet.addComponent('render', { type: 'sphere', material: mat });
                  app.root.addChild(bullet);
                  let lifetime = 2.0;
                  const bulletSpeed = b.properties?.bulletSpeed || 25;
                  const updateTB = (bdt) => {
                    lifetime -= bdt;
                    if (lifetime <= 0 || !bullet.parent) {
                      app.off('update', updateTB);
                      if (bullet.parent) bullet.destroy();
                      return;
                    }
                    bullet.translateLocal(0, 0, -bulletSpeed * bdt);
                    if (playerEntity && playerEntity.enabled && bullet.getPosition().distance(playerEntity.getPosition()) < 1.5) {
                      const playerB = playerEntity._behaviors || [];
                      const healthB = playerB.find(hb => hb.type === 'health' || hb.type === 'target_health');
                      if (healthB) {
                        healthB.properties.currentHp = Math.max(0, (healthB.properties.currentHp || 100) - (b.properties?.damage || 15));
                        window.triggerScreenShake(0.3, 0.15);
                      }
                      lifetime = 0;
                    }
                  };
                  app.on('update', updateTB);
                }
              }
            }
          } else if (b.type === 'pressure_plate') {
            if (playerEntity) {
              const dist = node.getPosition().distance(playerEntity.getPosition());
              const radius = b.properties?.radius || 1.5;
              if (!b._state) b._state = { pressed: false };
              if (dist < radius && !b._state.pressed) {
                b._state.pressed = true;
                if (window.playProceduralSFX) window.playProceduralSFX('door');
                const targetName = b.properties?.targetEntity;
                if (targetName) {
                  const target = app.root.findByName(targetName) || app.root.find(e => e.name && e.name.toLowerCase().includes(targetName.toLowerCase()));
                  if (target) target.enabled = !target.enabled;
                }
              } else if (dist >= radius && b._state.pressed) {
                b._state.pressed = false;
              }
            }
          } else if (b.type === 'teleport_gateway') {
            if (playerEntity) {
              if (!b._teleportCd) b._teleportCd = 0;
              if (b._teleportCd > 0) b._teleportCd -= dt;
              const dist = node.getPosition().distance(playerEntity.getPosition());
              const radius = b.properties?.radius || 1.8;
              if (dist < radius && b._teleportCd <= 0) {
                b._teleportCd = b.properties?.cooldown || 2.0;
                const destName = b.properties?.destinationEntity;
                let destPos = new pc.Vec3(0, 2, 0);
                if (destName) {
                  const destEnt = app.root.findByName(destName) || app.root.find(e => e.name && e.name.toLowerCase().includes(destName.toLowerCase()));
                  if (destEnt) destPos = destEnt.getPosition().clone().add(new pc.Vec3(0, 1, 0));
                } else if (b.properties?.targetPosition) {
                  destPos = new pc.Vec3(...b.properties.targetPosition);
                }
                if (playerEntity.rigidbody) {
                  playerEntity.rigidbody.teleport(destPos);
                } else {
                  playerEntity.setPosition(destPos);
                }
                if (window.playProceduralSFX) window.playProceduralSFX('victory');
              }
            }
          } else if (b.type === 'water_volume') {
            const entPos = node.getPosition();
            const extents = b.properties?.extents || [5, 3, 5];
            const halfX = extents[0] / 2;
            const halfY = extents[1] / 2;
            const halfZ = extents[2] / 2;
            app.root.forEach(other => {
              if (other !== node && other.enabled && other.rigidbody && other.rigidbody.type === 'dynamic') {
                const oPos = other.getPosition();
                if (Math.abs(oPos.x - entPos.x) <= halfX && Math.abs(oPos.z - entPos.z) <= halfZ && oPos.y <= entPos.y + halfY) {
                  const buoyancy = b.properties?.buoyancyForce || 15;
                  other.rigidbody.applyForce(0, buoyancy * dt * 60, 0);
                }
              }
            });
          } else if (b.type === 'flashlight') {
            const toggleKey = keys['l'] || keys['keyl'];
            if (!b._keyWasDown) b._keyWasDown = false;
            if (toggleKey && !b._keyWasDown) {
              if (node.light) node.light.enabled = !node.light.enabled;
            }
            b._keyWasDown = toggleKey;
          } else if (b.type === 'overhead_healthbar') {
            const cam = app.root.find(c => c.camera);
            if (cam) {
              const ePos = node.getPosition();
              const cPos = cam.getPosition();
              const targetLook = new pc.Vec3(cPos.x, ePos.y, cPos.z);
              node.lookAt(targetLook);
              node.rotateLocal(0, 180, 0);
            }
          } else if (b.type === 'ambient_audio') {
            if (!b._state) b._state = { playing: false };
            if (!b._state.playing) {
              b._state.playing = true;
              if (window.playProceduralSFX) window.playProceduralSFX('victory', b.properties?.volume || 0.3);
            }
          } else if (b.type === 'boss_ai') {
            if (b.properties.currentHp === undefined) b.properties.currentHp = b.properties.maxHp || 500;
            if (playerEntity && b.properties.currentHp > 0) {
              const pos = node.getPosition();
              const plyPos = playerEntity.getPosition();
              const dist = pos.distance(plyPos);
              const isEnraged = (b.properties.currentHp / (b.properties.maxHp || 500)) <= (b.properties.enrageThreshold || 0.5);

              node.lookAt(new pc.Vec3(plyPos.x, pos.y, plyPos.z));

              // Boss advances toward player if outside melee range
              if (dist > 3.5 && dist <= 25) {
                const bSpeed = (b.properties.speed || 3.0) * (isEnraged ? 1.5 : 1.0);
                node.translateLocal(0, 0, -bSpeed * dt);
              }

              if (!b._attackTimer) b._attackTimer = 0;
              b._attackTimer -= dt;
              if (b._attackTimer <= 0 && dist <= 4.0) {
                b._attackTimer = isEnraged ? (b.properties.attackRate || 2.0) * 0.5 : (b.properties.attackRate || 2.0);
                if (window.playProceduralSFX) window.playProceduralSFX('explosion');
                window.triggerScreenShake(0.6, 0.3);
                const playerB = playerEntity._behaviors || [];
                const coverB = playerB.find(cb => cb.type === 'cover_system');
                let dmg = isEnraged ? (b.properties.damage || 30) * 1.5 : (b.properties.damage || 30);
                if (coverB && coverB._inCover) {
                  dmg = Math.round(dmg * (1.0 - (coverB.properties?.damageReduction || 0.75)));
                }
                const shieldB = playerB.find(sb => sb.type === 'shield_generator');
                let remDmg = dmg;
                if (shieldB && (shieldB.properties.currentShield || 0) > 0) {
                  shieldB._rechargeTimer = shieldB.properties.rechargeDelay || 3.0;
                  if (shieldB.properties.currentShield >= remDmg) {
                    shieldB.properties.currentShield -= remDmg;
                    remDmg = 0;
                  } else {
                    remDmg -= shieldB.properties.currentShield;
                    shieldB.properties.currentShield = 0;
                  }
                }
                if (remDmg > 0) {
                  const healthB = playerB.find(hb => hb.type === 'health');
                  if (healthB) {
                    healthB.properties.currentHp = Math.max(0, (healthB.properties.currentHp || 100) - remDmg);
                    if (healthB.properties.currentHp <= 0) {
                      const ragdollB = playerB.find(rb => rb.type === 'ragdoll_physics');
                      if (ragdollB && playerEntity.rigidbody) {
                        playerEntity.rigidbody.angularFactor = new pc.Vec3(1, 1, 1);
                        playerEntity.rigidbody.linearFactor = new pc.Vec3(1, 1, 1);
                        playerEntity.rigidbody.applyImpulse((Math.random() - 0.5) * 5, 2, (Math.random() - 0.5) * 5);
                      }
                      if (playerEntity._respawnCheckpoint) {
                        playerEntity.setPosition(playerEntity._respawnCheckpoint);
                        healthB.properties.currentHp = healthB.properties.maxHp || 100;
                      }
                    }
                  }
                }
              }
            } else if (b.properties.currentHp <= 0 && node.enabled) {
              node.enabled = false;
              if (window.playProceduralSFX) window.playProceduralSFX('victory');
            }
          } else if (b.type === 'stealth_ai') {
            if (playerEntity) {
              const pos = node.getPosition();
              const plyPos = playerEntity.getPosition();
              const dist = pos.distance(plyPos);
              const visionRadius = b.properties?.visionRadius || 12;

              if (dist <= visionRadius) {
                const toPlayer = plyPos.clone().sub(pos).normalize();
                const forward = node.forward.clone().normalize();
                const angle = Math.acos(Math.max(-1, Math.min(1, forward.dot(toPlayer)))) * (180 / Math.PI);
                const visionAngle = b.properties?.visionAngle || 60;

                if (angle <= visionAngle / 2) {
                  node.lookAt(new pc.Vec3(plyPos.x, pos.y, plyPos.z));
                  node.translateLocal(0, 0, -(b.properties?.speed || 2.5) * dt);

                  if (!b._attackTimer) b._attackTimer = 0;
                  b._attackTimer -= dt;
                  if (dist < 1.8 && b._attackTimer <= 0) {
                    b._attackTimer = 1.0;
                    const playerB = playerEntity._behaviors || [];
                    const shieldB = playerB.find(sb => sb.type === 'shield_generator');
                    let remDmg = b.properties?.damage || 25;
                    if (shieldB && (shieldB.properties.currentShield || 0) > 0) {
                      shieldB._rechargeTimer = shieldB.properties.rechargeDelay || 3.0;
                      if (shieldB.properties.currentShield >= remDmg) {
                        shieldB.properties.currentShield -= remDmg;
                        remDmg = 0;
                      } else {
                        remDmg -= shieldB.properties.currentShield;
                        shieldB.properties.currentShield = 0;
                      }
                    }
                    if (remDmg > 0) {
                      const healthB = playerB.find(hb => hb.type === 'health');
                      if (healthB) {
                        healthB.properties.currentHp = Math.max(0, (healthB.properties.currentHp || 100) - remDmg);
                        window.triggerScreenShake(0.4, 0.2);
                        if (healthB.properties.currentHp <= 0 && playerEntity._respawnCheckpoint) {
                          playerEntity.setPosition(playerEntity._respawnCheckpoint);
                          healthB.properties.currentHp = healthB.properties.maxHp || 100;
                        }
                      }
                    }
                  }
                }
              }
            }
          } else if (b.type === 'vehicle_controller') {
            const topSpeed = b.properties?.topSpeed || 25;
            const accel = b.properties?.accel || 15;
            const steerSpeed = b.properties?.steerSpeed || 60;

            if (!b._vspeed) b._vspeed = 0;

            if (keys['w'] || keys['arrowup']) {
              b._vspeed = Math.min(topSpeed, b._vspeed + accel * dt);
            } else if (keys['s'] || keys['arrowdown']) {
              b._vspeed = Math.max(-topSpeed * 0.4, b._vspeed - accel * dt);
            } else {
              b._vspeed *= Math.pow(0.1, dt);
            }

            if (Math.abs(b._vspeed) > 0.1) {
              const dir = b._vspeed > 0 ? 1 : -1;
              if (keys['a'] || keys['arrowleft']) node.rotate(0, steerSpeed * dt * dir, 0);
              if (keys['d'] || keys['arrowright']) node.rotate(0, -steerSpeed * dt * dir, 0);
            }

            node.translateLocal(0, 0, -b._vspeed * dt);

            if (gameCamera) {
              const camTarget = node.getPosition().clone().sub(node.forward.clone().mulScalar(8)).add(new pc.Vec3(0, 4, 0));
              const curPos = gameCamera.getPosition();
              gameCamera.setPosition(curPos.clone().lerp(curPos, camTarget, Math.min(1, dt * 5)));
              gameCamera.lookAt(node.getPosition());
            }
          } else if (b.type === 'destruction_mesh') {
            if (b.properties.health === undefined) b.properties.health = b.properties.maxHealth || 50;
            if (b.properties.health <= 0 && node.enabled) {
              node.enabled = false;
              if (window.playProceduralSFX) window.playProceduralSFX('explosion');
              window.triggerScreenShake(0.5, 0.2);

              const debrisCount = b.properties?.debrisCount || 6;
              const pos = node.getPosition();
              for (let i = 0; i < debrisCount; i++) {
                const chunk = new pc.Entity('Debris_' + i);
                chunk.setPosition(pos.clone().add(new pc.Vec3((Math.random()-0.5)*1.5, Math.random()*1.5, (Math.random()-0.5)*1.5)));
                chunk.setLocalScale(0.3, 0.3, 0.3);
                const mat = new pc.StandardMaterial();
                mat.diffuse = new pc.Color(0.8, 0.4, 0.1);
                mat.update();
                chunk.addComponent('render', { type: 'box', material: mat });
                app.root.addChild(chunk);
                setTimeout(() => {
                  try { chunk.destroy(); } catch (e) {}
                }, 3000);
              }
            }
          } else if (b.type === 'cinematic_cutscene_trigger') {
            if (playerEntity) {
              const dist = node.getPosition().distance(playerEntity.getPosition());
              const radius = b.properties?.radius || 2.5;
              if (!b._state) b._state = { played: false };
              if (dist < radius && !b._state.played) {
                b._state.played = true;
                window.triggerScreenShake(0.3, 0.3);
                if (window.playProceduralSFX) window.playProceduralSFX('victory');
              }
            }
          } else if (b.type === 'checkpoint_system') {
            if (playerEntity) {
              const dist = node.getPosition().distance(playerEntity.getPosition());
              const radius = b.properties?.radius || 2.0;
              if (dist < radius) {
                playerEntity._respawnCheckpoint = node.getPosition().clone().add(new pc.Vec3(0, 1, 0));
                if (!b._state) b._state = { active: false };
                if (!b._state.active) {
                  b._state.active = true;
                  if (window.playProceduralSFX) window.playProceduralSFX('coin');
                }
              }
            }
          } else if (b.type === 'combo_score_counter') {
            if (!b._state) b._state = { hits: 0, timer: 0 };
            if (b._state.timer > 0) {
              b._state.timer -= dt;
              if (b._state.timer <= 0) {
                b._state.hits = 0;
                b._state.timer = 0;
              }
            }
          } else if (b.type === 'weather_emitter') {
            if (!b._weatherTimer) b._weatherTimer = 0;
            b._weatherTimer -= dt;
            if (b._weatherTimer <= 0) {
              b._weatherTimer = 0.08;
              const drop = new pc.Entity('WeatherParticle');
              const pos = node.getPosition();
              const isSnow = (b.properties?.type || 'snow').toLowerCase() === 'snow';
              drop.setPosition(pos.x + (Math.random() - 0.5) * 30, pos.y + 12, pos.z + (Math.random() - 0.5) * 30);
              drop.setLocalScale(isSnow ? 0.12 : 0.04, isSnow ? 0.12 : 0.3, isSnow ? 0.12 : 0.04);
              const mat = new pc.StandardMaterial();
              mat.diffuse = isSnow ? new pc.Color(0.9, 0.95, 1.0) : new pc.Color(0.4, 0.6, 0.9);
              mat.opacity = 0.7;
              mat.blendType = pc.BLEND_NORMAL;
              mat.update();
              drop.addComponent('render', { type: isSnow ? 'sphere' : 'cylinder', material: mat });
              app.root.addChild(drop);

              let dropLife = 1.8;
              const dropSpeed = isSnow ? 3.5 : 16.0;
              const updateDrop = (ddt) => {
                dropLife -= ddt;
                drop.translate(0, -dropSpeed * ddt, 0);
                if (dropLife <= 0) {
                  app.off('update', updateDrop);
                  try { drop.destroy(); } catch (e) {}
                }
              };
              app.on('update', updateDrop);
            }
          } else if (b.type === 'shield_generator') {
            if (b.properties.currentShield === undefined) b.properties.currentShield = b.properties.maxShield || 50;
            if (!b._rechargeTimer) b._rechargeTimer = 0;
            if (b._rechargeTimer > 0) {
              b._rechargeTimer -= dt;
            } else if (b.properties.currentShield < (b.properties.maxShield || 50)) {
              b.properties.currentShield = Math.min(b.properties.maxShield || 50, b.properties.currentShield + (b.properties.rechargeRate || 10) * dt);
            }
          } else if (b.type === 'sway_foliage') {
            const speed = b.properties?.speed || 2.5;
            const amplitude = b.properties?.amplitude || 5.0;
            if (!b._state) b._state = { time: 0, baseRot: node.getEulerAngles().clone() };
            b._state.time += dt * speed;
            node.setEulerAngles(b._state.baseRot.x + Math.sin(b._state.time) * amplitude, b._state.baseRot.y, b._state.baseRot.z + Math.cos(b._state.time * 0.8) * (amplitude * 0.5));
          } else if (b.type === 'spline_follower') {
            const speed = b.properties?.speed || 3.0;
            node.translateLocal(0, 0, -speed * dt);
          } else if (b.type === 'screen_shake_zone') {
            if (playerEntity) {
              const dist = node.getPosition().distance(playerEntity.getPosition());
              const radius = b.properties?.radius || 5.0;
              if (dist < radius) {
                window.triggerScreenShake(b.properties?.intensity || 0.6, 0.1);
              }
            }
          } else if (b.type === 'exploding_barrel') {
            if (playerEntity) {
              const dist = node.getPosition().distance(playerEntity.getPosition());
              if (dist < 1.8 && node.enabled) {
                node.enabled = false;
                if (window.playProceduralSFX) window.playProceduralSFX('explosion');
                window.triggerScreenShake(0.8, 0.4);
                const playerB = playerEntity._behaviors || [];
                const healthB = playerB.find(hb => hb.type === 'health');
                if (healthB) {
                  const dmg = b.properties?.blastDamage || 80;
                  healthB.properties.currentHp = Math.max(0, (healthB.properties.currentHp || 100) - dmg);
                }
              }
            }
          } else if (b.type === 'audio_reverb_zone') {
            if (playerEntity) {
              const dist = node.getPosition().distance(playerEntity.getPosition());
              const radius = b.properties?.radius || 8.0;
              b._playerInZone = dist <= radius;
            }
          } else if (b.type === 'wall_run_controller') {
            if (keys['w'] || keys['arrowup']) {
              node.translateLocal(0, (b.properties?.climbRate || 0.5) * dt, -(b.properties?.speed || 10) * dt * 0.4);
              if (keys[' '] || keys['space']) {
                if (node.rigidbody) node.rigidbody.applyImpulse(0, b.properties?.jumpForce || 12, 0);
                else node.translate(0, 2, 0);
                if (window.playProceduralSFX) window.playProceduralSFX('jump');
              }
            }
          } else if (b.type === 'grappling_hook') {
            const gKey = keys['g'] || keys['keyg'];
            if (gKey) {
              if (!b._state) b._state = { active: false, targetPos: null };
              if (!b._state.active) {
                b._state.active = true;
                const fwd = node.forward.clone().normalize().mulScalar(b.properties?.range || 35);
                b._state.targetPos = node.getPosition().clone().add(fwd);
                if (window.playProceduralSFX) window.playProceduralSFX('laser');
              }
              if (b._state.targetPos) {
                const curPos = node.getPosition();
                const dir = b._state.targetPos.clone().sub(curPos);
                if (dir.lengthSq() > 0.5) {
                  dir.normalize().mulScalar((b.properties?.pullSpeed || 20) * dt);
                  if (node.rigidbody) {
                    node.rigidbody.teleport(curPos.clone().add(dir));
                    node.rigidbody.linearVelocity = pc.Vec3.ZERO;
                  } else {
                    node.translate(dir);
                  }
                }
              }
            } else {
              if (b._state) b._state.active = false;
            }
          } else if (b.type === 'grav_gun_physicshandler') {
            const grabKey = keys['e'] || keys['keye'];
            const launchKey = keys['f'] || keys['keyf'];
            if (!b._state) b._state = { heldEntity: null };

            if (grabKey && !b._state.heldEntity && !b._grabCooldown) {
              b._grabCooldown = 0.3;
              app.root.forEach(other => {
                if (other !== node && other.rigidbody && other.enabled) {
                  if (node.getPosition().distance(other.getPosition()) < (b.properties?.range || 12)) {
                    b._state.heldEntity = other;
                    if (window.playProceduralSFX) window.playProceduralSFX('boost');
                  }
                }
              });
            } else if (grabKey && b._state.heldEntity && !b._grabCooldown) {
              b._grabCooldown = 0.3;
              b._state.heldEntity = null;
            }
            if (b._grabCooldown > 0) b._grabCooldown -= dt;

            if (b._state.heldEntity) {
              const holdPos = node.getPosition().clone().add(node.forward.clone().mulScalar(3.0)).add(new pc.Vec3(0, 0.5, 0));
              if (b._state.heldEntity.rigidbody) {
                b._state.heldEntity.rigidbody.teleport(holdPos);
                b._state.heldEntity.rigidbody.linearVelocity = pc.Vec3.ZERO;
              } else {
                b._state.heldEntity.setPosition(holdPos);
              }

              if (launchKey) {
                const launchVec = node.forward.clone().normalize().mulScalar(b.properties?.launchForce || 30);
                if (b._state.heldEntity.rigidbody) {
                  b._state.heldEntity.rigidbody.applyImpulse(launchVec.x, launchVec.y, launchVec.z);
                }
                if (window.playProceduralSFX) window.playProceduralSFX('explosion');
                window.triggerScreenShake(0.4, 0.2);
                b._state.heldEntity = null;
              }
            }
          } else if (b.type === 'inventory_crafting') {
            if (!b._state) b._state = { items: ['Wood', 'Iron Ore'] };
            const craftKey = keys['c'] || keys['keyc'];
            if (craftKey && !b._keyCd) {
              b._keyCd = true;
              if (window.playProceduralSFX) window.playProceduralSFX('coin');
            }
            if (!craftKey) b._keyCd = false;
          } else if (b.type === 'dialogue_system') {
            if (playerEntity) {
              const dist = node.getPosition().distance(playerEntity.getPosition());
              const radius = b.properties?.radius || 3.0;
              if (!b._state) b._state = { active: false };
              if (dist <= radius && !b._state.active) {
                b._state.active = true;
                if (window.playProceduralSFX) window.playProceduralSFX('door');
              } else if (dist > radius && b._state.active) {
                b._state.active = false;
              }
            }
          } else if (b.type === 'quest_tracker') {
            if (b.properties.currentCount === undefined) b.properties.currentCount = 0;
            if (!b._state) b._state = { completed: false };
            if (b.properties.currentCount >= (b.properties.requiredCount || 1) && !b._state.completed) {
              b._state.completed = true;
              if (window.playProceduralSFX) window.playProceduralSFX('victory');
            }
          } else if (b.type === 'minimap_radar') {
            if (!b._state) b._state = { blips: [] };
          } else if (b.type === 'cover_system') {
            const inCoverKey = keys['c'] || keys['shift'];
            b._inCover = Boolean(inCoverKey);
          } else if (b.type === 'ragdoll_physics') {
            // Handled on defeat
          } else if (b.type === 'day_night_weather_cycle') {
            const speed = b.properties?.cycleSpeed || 0.05;
            node.rotate(speed * dt * 20, 0, 0);
          } else if (b.type === 'projectile_shooter') {
            if (!b._cooldown) b._cooldown = 0;
            if (b._cooldown > 0) b._cooldown -= dt;
            const shootKey = keys['f'] || keys['keyf'] || keys['e'] || keys[' '];
            if (shootKey && b._cooldown <= 0) {
              // Deduct ammo if weapon inventory is attached
              const inv = (node._behaviors || []).find(wb => wb.type === 'weapon_inventory');
              if (inv && inv.properties && typeof inv.properties.ammo === 'number') {
                if (inv.properties.ammo <= 0) return;
                inv.properties.ammo--;
                const ammoEl = document.getElementById('hud-ammo-text');
                if (ammoEl) {
                  ammoEl.textContent = "🔫 Weapon Active: " + (inv.properties.weaponName || 'Plasma Gun') + " | Ammo: " + inv.properties.ammo;
                }
              }

              b._cooldown = b.properties?.cooldown || 0.3;
              const bullet = new pc.Entity('Bullet_' + Date.now());
              bullet.setPosition(node.getPosition().clone().add(node.forward.clone().mulScalar(1.2)));
              bullet.setEulerAngles(node.getEulerAngles());
              bullet.setLocalScale(0.2, 0.2, 0.4);

              const mat = new pc.StandardMaterial();
              mat.diffuse = new pc.Color(1, 0.3, 0);
              mat.emissive = new pc.Color(1, 0.6, 0);
              mat.update();

              bullet.addComponent('render', { type: 'sphere', material: mat });
              app.root.addChild(bullet);

              const bulletSpeed = b.properties?.speed || 30;
              let lifetime = b.properties?.lifetime || 2.0;

              const updateBullet = (bdt) => {
                lifetime -= bdt;
                if (lifetime <= 0 || !bullet.parent) {
                  app.off('update', updateBullet);
                  if (bullet.parent) bullet.destroy();
                  return;
                }
                bullet.translateLocal(0, 0, -bulletSpeed * bdt);

                // Collision check against hostile entities
                app.root.forEach(other => {
                  if (other !== bullet && other !== node && other.enabled && other.parent) {
                    const name = (other.name || '').toLowerCase();
                    if (name.includes('enemy') || name.includes('monster') || name.includes('target') || name.includes('dummy')) {
                      if (bullet.getPosition().distance(other.getPosition()) < 1.6) {
                        const targetB = (other._behaviors || []).find(tb => tb.type === 'target_health');
                        if (targetB) {
                          targetB.properties.currentHp = Math.max(0, (targetB.properties.currentHp || 100) - (b.properties?.damage || 35));
                          if (targetB.properties.currentHp <= 0) {
                            other.enabled = false;
                            if (window.playProceduralSFX) window.playProceduralSFX('explosion');
                            window.triggerScreenShake(0.5, 0.25);
                          } else {
                            if (window.playProceduralSFX) window.playProceduralSFX('hurt');
                            window.triggerScreenShake(0.2, 0.1);
                          }
                        } else {
                          other.enabled = false;
                          if (window.playProceduralSFX) window.playProceduralSFX('explosion');
                          window.triggerScreenShake(0.3, 0.15);
                        }
                        lifetime = 0;
                      }
                    }
                  }
                });
              };
              app.on('update', updateBullet);
            }
          }
        });
      });

      if (!playerEntity) return;
      const move = new pc.Vec3();
      if (keys['w'] || keys['arrowup']) move.add(playerEntity.forward);
      if (keys['s'] || keys['arrowdown']) move.sub(playerEntity.forward);
      if (keys['a'] || keys['arrowleft']) move.sub(playerEntity.right);
      if (keys['d'] || keys['arrowright']) move.add(playerEntity.right);

      const isPlayerMoving = move.lengthSq() > 0;
      if (isPlayerMoving) {
        move.normalize().mulScalar(8 * dt);
        playerEntity.translate(move);
      }
      updateLocomotion(playerEntity, 8.0, isPlayerMoving, dt);

      // Evaluate Physics Joint Constraints
      app.root.forEach(node => {
        if (!node.enabled || !node.joint) return;
        const j = node.joint;
        if (j.targetEntity) {
          const target = app.root.findByName(j.targetEntity);
          if (target) {
            const pivot = j.pivot ? new pc.Vec3(...j.pivot) : new pc.Vec3(0, 0, 0);
            if (j.type === 'point_to_point') {
              const desiredPos = target.getPosition().clone().add(pivot);
              node.setPosition(desiredPos);
            } else if (j.type === 'hinge') {
              const anchor = target.getPosition().clone().add(pivot);
              const cur = node.getPosition();
              node.setPosition(anchor.x, cur.y, anchor.z);
            }
          }
        }
      });

      // Evaluate Character Animation State Machine & Blending
      app.root.forEach(node => {
        if (!node.enabled || !node._animGraph) return;
        const ag = node._animGraph;
        if (!ag.states || !ag.transitions) return;

        let curSpeed = 0;
        if (node === playerEntity && move.lengthSq() > 0) {
          curSpeed = 6.0;
        }
        ag.parameters = ag.parameters || {};
        ag.parameters.speed = curSpeed;

        let stateNow = node._currentAnimState || ag.defaultState || 'Idle';
        for (const t of ag.transitions) {
          if (t.from === stateNow) {
            let matched = false;
            if (t.condition.includes('speed >') && curSpeed > parseFloat(t.condition.split('>')[1])) matched = true;
            if (t.condition.includes('speed <=') && curSpeed <= parseFloat(t.condition.split('<=')[1])) matched = true;
            if (t.condition.includes('isGrounded == false') && !ag.parameters.isGrounded) matched = true;
            if (t.condition.includes('isGrounded == true') && ag.parameters.isGrounded) matched = true;
            if (t.condition.includes('isAttacking == true') && ag.parameters.isAttacking) matched = true;

            if (matched && stateNow !== t.to) {
              node._currentAnimState = t.to;
              const targetState = ag.states.find(s => s.id === t.to);
              if (targetState && node._animComp && node._animComp.play) {
                try {
                  node._animComp.play(targetState.name || targetState.clip || t.to);
                } catch(e) {}
              }
              break;
            }
          }
        }
      });

      // Execute Triggers
      if (SCENE_DATA.triggers && playerEntity) {
        Object.entries(SCENE_DATA.triggers).forEach(([trigName, config]) => {
          const trigEnt = app.root.findByName(trigName);
          if (!trigEnt || !trigEnt.enabled) return;

          const dist = trigEnt.getPosition().distance(playerEntity.getPosition());
          const triggerDist = config.radius || 2.0;
          const isInside = dist <= triggerDist;
          const wasInside = Boolean(config._wasInside);

          const fireAction = () => {
            if (config.action === 'teleport' && config.targetPosition) {
              playerEntity.setPosition(...config.targetPosition);
            } else if (config.action === 'damage_player') {
              const playerB = playerEntity._behaviors || [];
              const healthB = playerB.find(hb => hb.type === 'health');
              if (healthB) {
                const dmg = config.amount || 20;
                healthB.properties.currentHp = Math.max(0, (healthB.properties.currentHp || healthB.properties.maxHp || 100) - dmg);
                window.triggerScreenShake(0.5, 0.25);
              }
            } else if (config.action === 'heal_player') {
              const playerB = playerEntity._behaviors || [];
              const healthB = playerB.find(hb => hb.type === 'health');
              if (healthB) {
                const heal = config.amount || 25;
                const maxHp = healthB.properties.maxHp || 100;
                healthB.properties.currentHp = Math.min(maxHp, (healthB.properties.currentHp || maxHp) + heal);
              }
            } else if (config.action === 'add_score') {
              const pts = config.amount || 100;
              window._currentScore = (window._currentScore !== undefined ? window._currentScore : (SCENE_DATA.hud?.score?.initial || 0)) + pts;
              const scEl = document.getElementById('hud-score-counter');
              if (scEl) scEl.textContent = (SCENE_DATA.hud?.score?.label || 'Score:') + ' ' + window._currentScore;
            } else if (config.action === 'toggle_visibility' && config.targetEntity) {
              const target = app.root.findByName(config.targetEntity);
              if (target) target.enabled = !target.enabled;
            } else if (config.action === 'destroy' && config.targetEntity) {
              const target = app.root.findByName(config.targetEntity);
              if (target && target.parent) target.parent.removeChild(target);
            } else if (config.action === 'win_level') {
              const vicScreen = document.getElementById('victory-screen');
              if (vicScreen) {
                if (config.victoryMessage) {
                  const msgEl = document.getElementById('victory-msg');
                  if (msgEl) msgEl.textContent = config.victoryMessage;
                }
                vicScreen.style.display = 'flex';
              }
            }
          };

          if (isInside && !wasInside) {
            config._wasInside = true;
            if (config.eventType !== 'on_exit') fireAction();
          } else if (!isInside && wasInside) {
            config._wasInside = false;
            if (config.eventType === 'on_exit') fireAction();
          }
        });
      }
    });

    console.log("🎮 Game loaded successfully!");
  </script>
</body>
</html>`;

    return html;
  }

  escapeHTML(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
}
