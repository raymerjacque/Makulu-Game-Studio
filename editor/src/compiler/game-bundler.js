/**
 * Standalone HTML5 Game Bundler & Compiler
 * Packages the active scene, entities, materials, and behaviors into a self-contained playable game.
 */

export class GameBundler {
  constructor(editor) {
    this.editor = editor;
  }

  compileStandaloneHTML(options = {}) {
    const sceneJSON = this.editor.exportSceneJSON();
    const title = options.title || this.editor.projectName || 'My MakuluLinux 3D Game';
    const author = options.author || 'MakuluLinux Creator';

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
  <title>${this.escapeHTML(title)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; overflow: hidden; background: #000; font-family: -apple-system, sans-serif; }
    #game-canvas { width: 100%; height: 100%; display: block; }
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
    }
  </style>
  <script src="https://code.playcanvas.com/playcanvas-stable.min.js"></script>
</head>
<body>
  <div id="ui-overlay">
    <span style="color: #ff6600; font-weight: 700;">●</span>
    <span>${this.escapeHTML(title)}</span>
  </div>
  <button id="ui-fullscreen" onclick="document.documentElement.requestFullscreen()">⛶ Fullscreen</button>
  <canvas id="game-canvas"></canvas>

  <script>
    // Embedded Scene Data
    const SCENE_DATA = ${sceneJSON};

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

    // Build Scene Graph from Exported Data
    function buildNode(data, parent) {
      const ent = new pc.Entity(data.name);
      if (data.position) ent.setPosition(...data.position);
      if (data.rotation) ent.setEulerAngles(...data.rotation);
      if (data.scale) ent.setLocalScale(...data.scale);
      ent.enabled = data.enabled !== false;

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

      // Particle System Component
      if (data.components && data.components.particlesystem) {
        ent.addComponent('particlesystem', {
          numParticles: data.components.particlesystem.numParticles || 50,
          lifetime: data.components.particlesystem.lifetime || 1.5
        });
      }

      // Sound Component
      if (data.components && data.components.sound) {
        ent.addComponent('sound', {
          volume: data.components.sound.volume !== undefined ? data.components.sound.volume : 1,
          pitch: data.components.sound.pitch !== undefined ? data.components.sound.pitch : 1,
          loop: data.components.sound.loop !== false
        });
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

    const playerEntity = app.root.find(n => n.name.toLowerCase().includes('player') || n.name.toLowerCase().includes('character')) || app.root.children[0];

    app.on('update', dt => {
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
          } else if (b.type === 'patrol') {
            const speed = b.properties?.speed || 3;
            const distance = b.properties?.distance || 6;
            if (!b._state) b._state = { startX: node.getPosition().x, dir: 1 };
            const currentX = node.getPosition().x;
            const delta = currentX - b._state.startX;
            if (delta > distance && b._state.dir > 0) b._state.dir = -1;
            if (delta < -distance && b._state.dir < 0) b._state.dir = 1;
            node.translate(b._state.dir * speed * dt, 0, 0);
          }
        });
      });

      if (!playerEntity) return;
      const move = new pc.Vec3();
      if (keys['w'] || keys['arrowup']) move.add(playerEntity.forward);
      if (keys['s'] || keys['arrowdown']) move.sub(playerEntity.forward);
      if (keys['a'] || keys['arrowleft']) move.sub(playerEntity.right);
      if (keys['d'] || keys['arrowright']) move.add(playerEntity.right);

      if (move.lengthSq() > 0) {
        move.normalize().mulScalar(8 * dt);
        playerEntity.translate(move);
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
