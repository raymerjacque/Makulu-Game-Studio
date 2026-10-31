import { bindEditorPhysics } from './editor-physics.js';
import * as pc from 'playcanvas';

/**
 * PlayCanvas Engine Runtime & Viewport Controller
 * Manages the main 3D canvas rendering loop, editor orbit camera, infinite floor grid,
 * interactive 3D transform gizmos, raycast picking, and light/camera helper fixtures.
 */
export class EngineRuntime {
  constructor(canvasElement, editor) {
    this.canvas = canvasElement;
    this.editor = editor;

    // Initialize PlayCanvas Application
    this.app = new pc.Application(this.canvas, {
      mouse: new pc.Mouse(this.canvas),
      touch: new pc.TouchDevice(this.canvas),
      keyboard: new pc.Keyboard(window),
      graphicsDeviceOptions: {
        alpha: false,
        antialias: true,
        preserveDrawingBuffer: true,
        preferWebGl2: true
      }
    });

    this.app.start();
    this.disposePhysicsBinding = bindEditorPhysics(this.app, editor.events);

    // Editor viewport canvas sizing: Must use FILLMODE_NONE with exact container bounds
    this.app.setCanvasFillMode(pc.FILLMODE_NONE);
    this.app.setCanvasResolution(pc.RESOLUTION_AUTO);

    const resizeCanvasToContainer = () => {
      const container = this.canvas.parentElement;
      if (container) {
        const rect = container.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          this.app.resizeCanvas(rect.width, rect.height);
        }
      }
    };

    window.addEventListener('resize', resizeCanvasToContainer);
    if (window.ResizeObserver && this.canvas.parentElement) {
      new ResizeObserver(resizeCanvasToContainer).observe(this.canvas.parentElement);
    }
    resizeCanvasToContainer();

    // Default lighting atmosphere
    this.app.scene.ambientLight = new pc.Color(0.22, 0.24, 0.28);
    this.app.scene.toneMapping = pc.TONEMAP_ACES;

    // Register runtime reference on editor instance
    this.editor.runtime = this;

    // Setup Runtime Subsystems
    this.editorCamera = new EditorCameraController(this.app, this.canvas, this.editor);
    this.grid = new EditorGrid(this.app);
    this.gizmoManager = new GizmoManager(this.app, this.editorCamera, this.editor);
    this.selectionHighlighter = new SelectionHighlighter(this.app, this.editor);
    this.visualHelpers = new ComponentVisualHelpers(this.app, this.editor);

    // Initial Scene Setup (Sun + Default Ambient)
    this.setupDefaultScene();

    // 3D Canvas Picking & Drag-and-Drop
    this.setupViewportPicking();
    this.setupCanvasDragAndDrop();
  }

  setupDefaultScene() {
    // Default Directional Sunlight
    const sun = new pc.Entity('Directional Sun');
    sun.addComponent('light', {
      type: 'directional',
      color: new pc.Color(1, 0.98, 0.92),
      intensity: 1.8,
      castShadows: true,
      shadowBias: 0.2,
      normalOffsetBias: 0.05
    });
    sun.setEulerAngles(45, 30, 0);
    sun.setPosition(0, 10, 0);
    this.app.root.addChild(sun);
  }

  setAtmosphere(preset) {
    if (!this.app || !this.app.scene) return;
    this.currentAtmosphere = preset;

    if (preset === 'sunset') {
      this.app.scene.ambientLight = new pc.Color(0.4, 0.2, 0.25);
      this.app.scene.fog.type = pc.FOG_EXP2;
      this.app.scene.fogColor = new pc.Color(0.8, 0.4, 0.2);
      this.app.scene.fogDensity = 0.015;
    } else if (preset === 'cyberpunk') {
      this.app.scene.ambientLight = new pc.Color(0.05, 0.08, 0.18);
      this.app.scene.fog.type = pc.FOG_EXP2;
      this.app.scene.fogColor = new pc.Color(0.02, 0.05, 0.15);
      this.app.scene.fogDensity = 0.02;
    } else if (preset === 'foggy') {
      this.app.scene.ambientLight = new pc.Color(0.3, 0.35, 0.4);
      this.app.scene.fog.type = pc.FOG_EXP2;
      this.app.scene.fogColor = new pc.Color(0.45, 0.5, 0.55);
      this.app.scene.fogDensity = 0.035;
    } else if (preset === 'night') {
      this.app.scene.ambientLight = new pc.Color(0.02, 0.03, 0.08);
      this.app.scene.fog.type = pc.FOG_NONE;
    } else {
      // Clear Day
      this.app.scene.ambientLight = new pc.Color(0.22, 0.24, 0.28);
      this.app.scene.fog.type = pc.FOG_NONE;
    }
  }

  /**
   * Sets viewport shading mode: 'lit' (standard PBR), 'wireframe', or 'unlit'
   */
  setShadingMode(mode = 'lit') {
    this.shadingMode = mode;
    if (!this.app || !this.app.root) return;

    const applyShadingToEntity = (node) => {
      if (node.render) {
        if (node.render.material) {
          if (mode === 'wireframe') {
            node.render.material.wireframe = true;
            node.render.material.useLighting = false;
          } else if (mode === 'unlit') {
            node.render.material.wireframe = false;
            node.render.material.useLighting = false;
          } else {
            // Full lit
            node.render.material.wireframe = false;
            node.render.material.useLighting = true;
          }
          node.render.material.update();
        }
      }
      if (node.children) {
        node.children.forEach(applyShadingToEntity);
      }
    };

    applyShadingToEntity(this.app.root);
  }

  /**
   * Computes live performance and scene statistics (FPS, draw calls, triangles, entities)
   */
  getSceneStats() {
    const stats = {
      fps: 60,
      entities: 0,
      drawCalls: 0,
      triangles: 0
    };

    if (this.app) {
      if (this.app.stats && this.app.stats.frame) {
        stats.fps = Math.round(this.app.stats.frame.fps || 60);
      }
      if (this.app.stats && this.app.stats.drawCalls) {
        stats.drawCalls = this.app.stats.drawCalls.total || 0;
        stats.triangles = this.app.stats.drawCalls.triangles || 0;
      }

      let count = 0;
      const countNodes = (n) => {
        count++;
        if (n.children) n.children.forEach(countNodes);
      };
      if (this.app.root) countNodes(this.app.root);
      stats.entities = count;

      if (stats.drawCalls === 0) {
        // Fallback estimate based on render components
        let renderCount = 0;
        const estimateMeshes = (n) => {
          if (n.render) renderCount++;
          if (n.children) n.children.forEach(estimateMeshes);
        };
        if (this.app.root) estimateMeshes(this.app.root);
        stats.drawCalls = Math.max(1, renderCount);
        stats.triangles = renderCount * 250;
      }
    }
    return stats;
  }

  setBloomFX(bloomConfig) {
    if (!this.app || !this.app.scene) return;
    this.bloomConfig = bloomConfig;
    if (bloomConfig && bloomConfig.enabled) {
      this.app.scene.exposure = (this.app.scene.exposure || 1.0) * (bloomConfig.intensity || 1.0);
    }
  }

  setupViewportPicking() {
    let mouseDownPos = { x: 0, y: 0 };

    this.canvas.addEventListener('mousedown', (e) => {
      mouseDownPos = { x: e.clientX, y: e.clientY };
    });

    this.canvas.addEventListener('click', (e) => {
      // Ignore click if user was dragging camera or gizmo
      const dist = Math.hypot(e.clientX - mouseDownPos.x, e.clientY - mouseDownPos.y);
      if (dist > 4) return;

      // Ignore if clicking gizmo handle or actively manipulating gizmo
      if (this.gizmoManager.isHovered || this.gizmoManager.isDragging) return;

      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const hitEntity = this.raycastPick(x, y);
      if (hitEntity) {
        this.editor.selection.set(hitEntity);
      } else {
        this.editor.selection.clear();
      }
    });
  }

  raycastPick(screenX, screenY) {
    const camera = this.editorCamera.entity.camera;
    if (!camera) return null;

    const start = new pc.Vec3();
    const end = new pc.Vec3();

    camera.screenToWorld(screenX, screenY, camera.nearClip, start);
    camera.screenToWorld(screenX, screenY, camera.farClip, end);

    let closestHit = null;
    let closestDist = Infinity;

    const rayDir = end.clone().sub(start).normalize();
    const ray = new pc.Ray(start, rayDir);

    const raycastNode = (node) => {
      const lowerName = node.name.toLowerCase();
      if (
        node === this.grid.entity ||
        node === this.editorCamera.entity ||
        lowerName.startsWith('gizmo') ||
        lowerName === 'selectionoutline' ||
        lowerName === 'componentvisualhelpers'
      ) {
        return;
      }

      if (node.render && node.enabled && node.parent) {
        const meshInstances = node.render.meshInstances;
        if (meshInstances && meshInstances.length > 0) {
          const hitPoint = new pc.Vec3();
          for (let i = 0; i < meshInstances.length; i++) {
            const bbox = meshInstances[i].aabb;
            if (bbox && bbox.intersectsRay(ray, hitPoint)) {
              const dist = start.distance(hitPoint);
              if (dist < closestDist) {
                closestDist = dist;
                closestHit = node;
              }
            }
          }
        }
      }

      if (node.children) {
        node.children.forEach(raycastNode);
      }
    };

    this.app.root.children.forEach(raycastNode);

    // If we hit an entity that is a child of a model or compound prefab, bubble up to top selectable entity
    if (closestHit) {
      let selectable = closestHit;
      while (
        selectable.parent &&
        selectable.parent !== this.app.root &&
        !selectable.parent.name.toLowerCase().startsWith('gizmo')
      ) {
        selectable = selectable.parent;
      }
      return selectable;
    }

    return null;
  }

  setupCanvasDragAndDrop() {
    this.canvas.addEventListener('dragover', (e) => e.preventDefault());
    this.canvas.addEventListener('drop', (e) => {
      e.preventDefault();
      try {
        const textData = e.dataTransfer.getData('text/plain');
        if (textData) {
          const asset = JSON.parse(textData);
          if (asset.type === 'models' || asset.type === 'model') {
            if (asset.url) {
              this.editor.loadModel(asset.url, {
                name: asset.name.replace(/\.[^/.]+$/, ""),
                position: [0, 0, 0]
              });
            }
          } else if (asset.type === 'prefabs') {
            if (this.editor.prefabs) {
              this.editor.prefabs.instantiate(asset.data || asset.prefabData, {
                position: [0, 0, 0]
              });
            }
          } else if (asset.type === 'materials' && asset.materialData) {
            const rect = this.canvas.getBoundingClientRect();
            const hit = this.raycastPick(e.clientX - rect.left, e.clientY - rect.top);
            if (hit && hit.render) {
              const matProps = asset.materialData;
              const mat = new pc.StandardMaterial();
              if (matProps.diffuse) mat.diffuse = new pc.Color(...matProps.diffuse);
              if (matProps.metalness !== undefined) {
                mat.metalness = matProps.metalness;
                mat.useMetalness = true;
              }
              if (matProps.roughness !== undefined) mat.roughness = matProps.roughness;
              if (matProps.opacity !== undefined) {
                mat.opacity = matProps.opacity;
                if (mat.opacity < 1.0) mat.blendType = pc.BLEND_NORMAL;
              }
              mat.update();
              hit.render.material = mat;
              this.editor.events.emit('entity:component:changed', hit);
            }
          }
        }
      } catch (err) {
        console.error('Drag and drop error:', err);
      }
    });
  }
}

/**
 * Editor Camera Controller
 * Supports smooth Orbit (Left Drag), Pan (Right Drag), Zoom (Scroll),
 * WASD Spectator Flythrough, and Frame Entity (F key).
 */
export class EditorCameraController {
  constructor(app, canvas, editor = null) {
    this.app = app;
    this.canvas = canvas;
    this.editor = editor;

    this.target = new pc.Vec3(0, 0.5, 0);
    this.distance = 9;
    this.pitch = -28;
    this.yaw = -45;

    this.entity = new pc.Entity('EditorCamera');
    this.entity._studioEditorOnly = true;
    this.entity.addComponent('camera', {
      clearColor: new pc.Color(0.08, 0.1, 0.13),
      fov: 55,
      nearClip: 0.1,
      farClip: 1000
    });

    this.app.root.addChild(this.entity);
    this.updatePosition();
    this.bindMouseControls();
    this.createViewportTripodOverlay();
  }

  snapView(viewType) {
    if (viewType === 'top') {
      this.pitch = -89.5;
      this.yaw = 0;
    } else if (viewType === 'front') {
      this.pitch = -0.5;
      this.yaw = 0;
    } else if (viewType === 'side') {
      this.pitch = -0.5;
      this.yaw = -90;
    } else if (viewType === 'iso') {
      this.pitch = -35;
      this.yaw = -45;
    }
    this.updatePosition();
  }

  createViewportTripodOverlay() {
    if (typeof document === 'undefined') return;
    const container = this.canvas.parentElement;
    if (!container || container.querySelector('.viewport-tripod-overlay')) return;

    const overlay = document.createElement('div');
    overlay.className = 'viewport-tripod-overlay';
    overlay.style.cssText = `
      position: absolute;
      top: 12px;
      right: 12px;
      display: flex;
      gap: 4px;
      background: rgba(15, 23, 42, 0.75);
      border: 1px solid var(--border-subtle);
      border-radius: 6px;
      padding: 3px;
      backdrop-filter: blur(8px);
      z-index: 25;
    `;
    overlay.innerHTML = `
      <button class="btn btn-sm btn-icon" id="btn-view-top" title="Top View (Y)" style="font-size: 10px; font-weight: 700; width: 24px; height: 22px;">Y</button>
      <button class="btn btn-sm btn-icon" id="btn-view-front" title="Front View (Z)" style="font-size: 10px; font-weight: 700; width: 24px; height: 22px; color: #38bdf8;">Z</button>
      <button class="btn btn-sm btn-icon" id="btn-view-side" title="Side View (X)" style="font-size: 10px; font-weight: 700; width: 24px; height: 22px; color: #ef4444;">X</button>
      <button class="btn btn-sm btn-icon" id="btn-view-iso" title="Isometric View" style="font-size: 10px; font-weight: 700; width: 24px; height: 22px; color: #facc15;">3D</button>
    `;

    overlay.querySelector('#btn-view-top').addEventListener('click', () => this.snapView('top'));
    overlay.querySelector('#btn-view-front').addEventListener('click', () => this.snapView('front'));
    overlay.querySelector('#btn-view-side').addEventListener('click', () => this.snapView('side'));
    overlay.querySelector('#btn-view-iso').addEventListener('click', () => this.snapView('iso'));

    container.appendChild(overlay);
  }

  setProjection(type) {
    if (this.entity.camera) {
      this.entity.camera.projection = type === 'ortho' ? pc.PROJECTION_ORTHOGRAPHIC : pc.PROJECTION_PERSPECTIVE;
      if (type === 'ortho') {
        this.entity.camera.orthoHeight = 10;
      }
    }
  }

  frameEntity(targetEntity) {
    if (!targetEntity) return;

    let targetPos = targetEntity.getPosition().clone();

    // Check mesh bounds if render component exists
    if (targetEntity.render && targetEntity.render.meshInstances && targetEntity.render.meshInstances[0]) {
      const bbox = targetEntity.render.meshInstances[0].aabb;
      targetPos = bbox.center.clone();
      const maxDim = Math.max(bbox.halfExtents.x, bbox.halfExtents.y, bbox.halfExtents.z);
      this.distance = Math.max(2.5, maxDim * 3.5);
    } else {
      this.distance = 5;
    }

    this.target.copy(targetPos);
    this.updatePosition();
  }

  updatePosition() {
    // Robust NaN protection
    if (isNaN(this.target.x) || isNaN(this.target.y) || isNaN(this.target.z)) {
      this.target.set(0, 0.5, 0);
    }
    if (isNaN(this.distance) || this.distance <= 0) {
      this.distance = 9;
    }
    if (isNaN(this.pitch)) {
      this.pitch = -28;
    }
    if (isNaN(this.yaw)) {
      this.yaw = -45;
    }

    this.pitch = Math.max(-89.5, Math.min(-0.5, this.pitch));

    const quat = new pc.Quat();
    quat.setFromEulerAngles(this.pitch, this.yaw, 0);

    const offset = quat.transformVector(new pc.Vec3(0, 0, this.distance));
    const pos = this.target.clone().add(offset);

    this.entity.setPosition(pos);
    this.entity.setRotation(quat);
  }

  bindMouseControls() {
    let isOrbiting = false;
    let isPanning = false;
    let lastX = 0;
    let lastY = 0;

    const keys = {};
    window.addEventListener('keydown', (e) => {
      if (this.editor?.simpleWorkspace?.active) return;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;
      keys[e.key.toLowerCase()] = true;
      if (e.key.toLowerCase() === 'f' && this.editor) {
        const active = this.editor.selection.getActive();
        if (active) this.frameEntity(active);
      }
    });
    window.addEventListener('keyup', (e) => keys[e.key.toLowerCase()] = false);

    this.canvas.addEventListener('contextmenu', e => e.preventDefault());

    this.canvas.addEventListener('mousedown', (e) => {
      lastX = e.clientX;
      lastY = e.clientY;

      if (e.button === 0 && !e.shiftKey) {
        // Do not orbit if clicking a gizmo handle or dragging
        if (this.editor?.runtime?.gizmoManager?.isHovered || this.editor?.runtime?.gizmoManager?.isDragging) {
          return;
        }
        isOrbiting = true;
      } else if (e.button === 2 || (e.button === 0 && e.shiftKey)) {
        isPanning = true;
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (this.editor?.runtime?.gizmoManager?.isDragging) {
        isOrbiting = false;
        return;
      }

      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;

      if (isOrbiting) {
        this.yaw -= dx * 0.3;
        this.pitch += dy * 0.3;
        this.updatePosition();
      } else if (isPanning) {
        const panSpeed = this.distance * 0.0015;
        const right = this.entity.right.clone().mulScalar(-dx * panSpeed);
        const up = this.entity.up.clone().mulScalar(dy * panSpeed);
        this.target.add(right).add(up);
        this.updatePosition();
      }
    });

    window.addEventListener('mouseup', () => {
      isOrbiting = false;
      isPanning = false;
    });

    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY > 0 ? 1.1 : 0.9;
      this.distance = Math.max(0.5, Math.min(250, this.distance * zoomFactor));
      this.updatePosition();
    }, { passive: false });

    // WASD Spectator Flythrough when Right-Click held
    this.app.on('update', (dt) => {
      if (this.editor?.simpleWorkspace?.active) return;
      if (isPanning && keys) {
        const move = new pc.Vec3();
        const speed = 10 * dt;
        if (keys['w']) move.add(this.entity.forward);
        if (keys['s']) move.sub(this.entity.forward);
        if (keys['a']) move.sub(this.entity.right);
        if (keys['d']) move.add(this.entity.right);

        if (move.lengthSq() > 0) {
          move.normalize().mulScalar(speed);
          this.target.add(move);
          this.updatePosition();
        }
      }
    });
  }
}

/**
 * Procedural Infinite 3D Floor Grid
 */
export class EditorGrid {
  constructor(app) {
    this.app = app;
    this.visible = true;
    this.entity = new pc.Entity('EditorGrid');
    this.entity._studioEditorOnly = true;
    this.createGridMesh();
    this.app.root.addChild(this.entity);
  }

  setVisible(visible) {
    this.visible = visible;
    this.entity.enabled = visible;
  }

  createGridMesh() {
    const size = 50;
    const step = 1;
    const lines = [];
    const colors = [];

    // Authentic AutoCAD / 3D CAD Grid Styling
    const minorColor = new pc.Color(0.20, 0.26, 0.34, 0.40); // Subtle secondary grid lines
    const majorColor = new pc.Color(0.35, 0.45, 0.58, 0.85); // Prominent major grid lines every 5m
    const axisXColor = new pc.Color(0.95, 0.25, 0.25, 1.0);  // Bold Red X axis
    const axisZColor = new pc.Color(0.25, 0.55, 1.0, 1.0);   // Bold Blue Z axis

    for (let i = -size; i <= size; i += step) {
      // Lines along Z
      lines.push(i, 0, -size, i, 0, size);
      const colZ = i === 0 ? axisZColor : (i % 5 === 0 ? majorColor : minorColor);
      colors.push(colZ.r, colZ.g, colZ.b, colZ.a, colZ.r, colZ.g, colZ.b, colZ.a);

      // Lines along X
      lines.push(-size, 0, i, size, 0, i);
      const colX = i === 0 ? axisXColor : (i % 5 === 0 ? majorColor : minorColor);
      colors.push(colX.r, colX.g, colX.b, colX.a, colX.r, colX.g, colX.b, colX.a);
    }

    const mesh = new pc.Mesh(this.app.graphicsDevice);
    mesh.setPositions(lines);
    mesh.setColors(colors);
    mesh.update(pc.PRIMITIVE_LINES);
    if (mesh.primitive && mesh.primitive[0]) {
      mesh.primitive[0].type = pc.PRIMITIVE_LINES;
    }

    const material = new pc.StandardMaterial();
    material.useVertexColors = true;
    material.blendType = pc.BLEND_NORMAL;
    material.cull = pc.CULLFACE_NONE;
    material.depthWrite = false;
    material.update();

    const meshInstance = new pc.MeshInstance(mesh, material);
    this.entity.addComponent('render', {
      meshInstances: [meshInstance]
    });
  }
}

/**
 * Interactive 3D Transform Gizmo Manager (Translate, Rotate, Scale)
 * Powered by PlayCanvas official native Gizmo system (TranslateGizmo, RotateGizmo, ScaleGizmo).
 */
export class GizmoManager {
  constructor(app, cameraController, editor) {
    this.app = app;
    this.cameraController = cameraController;
    this.editor = editor;

    this.mode = 'translate'; // 'none', 'translate', 'rotate', 'scale'
    this.coordSpace = 'world'; // 'world', 'local'
    this.snapEnabled = false;
    this.snapIncrement = 1.0;
    this.targetEntity = null;

    // Create a dedicated layer for rendering Gizmos
    this.layer = pc.Gizmo.createLayer(this.app, 'GizmoLayer');

    const camera = this.cameraController.entity.camera;
    this.translateGizmo = new pc.TranslateGizmo(camera, this.layer);
    this.rotateGizmo = new pc.RotateGizmo(camera, this.layer);
    this.scaleGizmo = new pc.ScaleGizmo(camera, this.layer);
    this.scaleGizmo.uniform = true;
    this.scaleGizmo.axisCenterSize = 0.35;
    this.scaleGizmo.axisBoxSize = 0.28;
    this.scaleGizmo.axisLineLength = 1.6;

    this.gizmos = {
      translate: this.translateGizmo,
      rotate: this.rotateGizmo,
      scale: this.scaleGizmo
    };

    // Configure all gizmos: detach on boot, set default space and snap
    Object.values(this.gizmos).forEach(gizmo => {
      gizmo.root._studioEditorOnly = true;
      // Only permit Left Click (button 0) to manipulate gizmos
      if (gizmo.mouseButtons) {
        gizmo.mouseButtons[0] = true;
        gizmo.mouseButtons[1] = false;
        gizmo.mouseButtons[2] = false;
      }

      gizmo.coordSpace = this.coordSpace;
      gizmo.snap = this.snapEnabled;
      gizmo.snapIncrement = this.snapIncrement;
      gizmo.detach();

      let initialTransform = null;

      gizmo.on('transform:start', () => {
        if (this.targetEntity) {
          initialTransform = {
            initialPos: this.targetEntity.getPosition().clone(),
            initialRot: this.targetEntity.getEulerAngles().clone(),
            initialScale: this.targetEntity.getLocalScale().clone()
          };
        }
      });

      gizmo.on('transform:move', () => {
        if (this.targetEntity) {
          this.editor.events.emit('entity:transformed', this.targetEntity);
        }
      });

      gizmo.on('transform:end', () => {
        if (this.targetEntity && initialTransform) {
          this.editor.commitEntityTransform(this.targetEntity, initialTransform);
          initialTransform = null;
        }
      });
    });

    this.editor.selection.subscribe((selected, active) => {
      this.updateGizmoTarget(active);
    });
  }

  get isDragging() {
    return Boolean(
      (this.translateGizmo && this.translateGizmo._dragging) ||
      (this.rotateGizmo && this.rotateGizmo._dragging) ||
      (this.scaleGizmo && this.scaleGizmo._dragging)
    );
  }

  get isHovered() {
    return Boolean(
      (this.translateGizmo && this.translateGizmo._hoverAxis) ||
      (this.rotateGizmo && this.rotateGizmo._hoverAxis) ||
      (this.scaleGizmo && this.scaleGizmo._hoverAxis)
    );
  }

  setMode(mode) {
    this.mode = mode;
    this.updateGizmoVisibility();
  }

  setCoordSpace(space) {
    this.coordSpace = space;
    Object.values(this.gizmos).forEach(g => {
      if (g) g.coordSpace = space;
    });
  }

  setSnap(enabled, increment = 1.0) {
    this.snapEnabled = enabled;
    this.snapIncrement = increment;
    Object.values(this.gizmos).forEach(g => {
      if (g) {
        g.snap = enabled;
        g.snapIncrement = increment;
      }
    });
  }

  updateGizmoTarget(activeEntity) {
    this.targetEntity = activeEntity;
    this.updateGizmoVisibility();
  }

  updateGizmoVisibility() {
    if (this.editor && this.editor.isPlaying) {
      Object.values(this.gizmos).forEach(gizmo => gizmo.detach());
      return;
    }

    Object.entries(this.gizmos).forEach(([modeKey, gizmo]) => {
      if (this.targetEntity && this.mode === modeKey) {
        gizmo.attach([this.targetEntity]);
      } else {
        gizmo.detach();
      }
    });
  }
}

/**
 * Selection Highlight Outline Box
 */
export class SelectionHighlighter {
  constructor(app, editor) {
    this.app = app;
    this.editor = editor;

    this.entity = new pc.Entity('SelectionOutline');
    this.entity._studioEditorOnly = true;
    this.entity.enabled = false;
    this.app.root.addChild(this.entity);

    this.editor.selection.subscribe((selected, active) => {
      this.updateHighlight(active);
    });

    this.editor.events.on('entity:transformed', (active) => {
      if (this.editor.selection.getActive() === active) {
        this.updateHighlight(active);
      }
    });
  }

  updateHighlight(activeEntity) {
    if (!activeEntity || activeEntity === this.app.root) {
      this.entity.enabled = false;
      return;
    }

    this.entity.enabled = true;
    this.entity.setPosition(activeEntity.getPosition());
    this.entity.setRotation(activeEntity.getRotation());
    this.entity.setLocalScale(activeEntity.getLocalScale().clone().add(new pc.Vec3(0.05, 0.05, 0.05)));
  }
}

/**
 * 3D Viewport Component Visual Wireframe Helpers
 * Renders range spheres for lights/audio, wireframe frustums for cameras, and bounding boxes for physics collision shapes.
 */
export class ComponentVisualHelpers {
  constructor(app, editor) {
    this.app = app;
    this.editor = editor;
    this.physicsDebugAll = false;

    this.helperEntity = new pc.Entity('ComponentVisualHelpers');
    this.helperEntity._studioEditorOnly = true;
    this.helperEntity.enabled = false;
    this.app.root.addChild(this.helperEntity);

    this.editor.selection.subscribe((selected, active) => {
      this.updateHelpers(active);
    });

    this.editor.events.on('entity:transformed', (active) => {
      if (this.editor.selection.getActive() === active || this.physicsDebugAll) {
        this.updateHelpers(this.editor.selection.getActive());
      }
    });

    this.editor.events.on('scene:changed', () => {
      if (this.physicsDebugAll) {
        this.updateHelpers(this.editor.selection.getActive());
      }
    });
  }

  setPhysicsDebugAll(enabled) {
    this.physicsDebugAll = enabled;
    this.updateHelpers(this.editor.selection.getActive());
  }

  updateHelpers(active) {
    // Clear previous helper children
    while (this.helperEntity.children.length > 0) {
      const child = this.helperEntity.children[0];
      this.helperEntity.removeChild(child);
      child.destroy();
    }

    if (this.physicsDebugAll) {
      this.helperEntity.enabled = true;
      const renderAllColliders = (node) => {
        if (node.collision && node !== this.helperEntity && node.enabled && node.parent) {
          const col = node.collision;
          const colEntity = new pc.Entity(`AllPhysicsDebug_${node.name}`);
          colEntity.setPosition(node.getPosition());
          colEntity.setRotation(node.getRotation());

          const mat = new pc.StandardMaterial();
          mat.diffuse = new pc.Color(0.2, 1.0, 0.4); // Bright green wireframe
          mat.wireframe = true;
          mat.update();

          let meshType = 'box';
          if (col.type === 'sphere') {
            meshType = 'sphere';
            const r = col.radius || 0.5;
            colEntity.setLocalScale(r * 2, r * 2, r * 2);
          } else if (col.type === 'capsule' || col.type === 'cylinder') {
            meshType = 'cylinder';
            const r = col.radius || 0.5;
            const h = col.height || 2;
            colEntity.setLocalScale(r * 2, h, r * 2);
          } else {
            const half = col.halfExtents || new pc.Vec3(0.5, 0.5, 0.5);
            colEntity.setLocalScale(half.x * 2, half.y * 2, half.z * 2);
          }

          colEntity.addComponent('render', { type: meshType, material: mat });
          this.helperEntity.addChild(colEntity);
        }
        if (node.children) node.children.forEach(renderAllColliders);
      };

      if (this.app && this.app.root) {
        this.app.root.children.forEach(renderAllColliders);
      }
    }

    if (!active || active === this.app.root) {
      if (!this.physicsDebugAll) this.helperEntity.enabled = false;
      return;
    }

    this.helperEntity.enabled = true;

    // Light Range Helper
    if (active.light && active.light.type !== 'directional') {
      const range = active.light.range || 10;
      const sphere = new pc.Entity('LightRangeGizmo');
      sphere.setPosition(active.getPosition());
      sphere.setLocalScale(range * 2, range * 2, range * 2);

      const mat = new pc.StandardMaterial();
      mat.diffuse = active.light.color || new pc.Color(1, 1, 0);
      mat.wireframe = true;
      mat.update();

      sphere.addComponent('render', { type: 'sphere', material: mat });
      this.helperEntity.addChild(sphere);
    }

    // Audio Spatial Radius Helper
    if (active.sound) {
      const maxDist = active.sound.maxDistance || 15;
      const soundSphere = new pc.Entity('SoundRadiusGizmo');
      soundSphere.setPosition(active.getPosition());
      soundSphere.setLocalScale(maxDist * 2, maxDist * 2, maxDist * 2);

      const mat = new pc.StandardMaterial();
      mat.diffuse = new pc.Color(0, 0.9, 1);
      mat.wireframe = true;
      mat.update();

      soundSphere.addComponent('render', { type: 'sphere', material: mat });
      this.helperEntity.addChild(soundSphere);
    }

    // Collision Shape Helper
    if (active.collision) {
      const col = active.collision;
      const colEntity = new pc.Entity('CollisionGizmo');
      colEntity.setPosition(active.getPosition());
      colEntity.setRotation(active.getRotation());

      const mat = new pc.StandardMaterial();
      mat.diffuse = new pc.Color(0.2, 1.0, 0.3);
      mat.wireframe = true;
      mat.update();

      let meshType = 'box';
      if (col.type === 'sphere') {
        meshType = 'sphere';
        const r = col.radius || 0.5;
        colEntity.setLocalScale(r * 2, r * 2, r * 2);
      } else if (col.type === 'capsule' || col.type === 'cylinder') {
        meshType = 'cylinder';
        const r = col.radius || 0.5;
        const h = col.height || 2;
        colEntity.setLocalScale(r * 2, h, r * 2);
      } else {
        const half = col.halfExtents || new pc.Vec3(0.5, 0.5, 0.5);
        colEntity.setLocalScale(half.x * 2, half.y * 2, half.z * 2);
      }

      if (col.type === 'mesh' && col.model?.meshInstances?.length) {
        colEntity.setLocalScale(active.getWorldTransform().getScale());
        colEntity.addComponent('render', { meshInstances: col.model.meshInstances.map(source => new pc.MeshInstance(source.mesh, mat, colEntity)) });
      } else colEntity.addComponent('render', { type: meshType, material: mat });
      // Wireframe is a mesh-instance render style in this engine version, not a material flag.
      colEntity.render.meshInstances.forEach(instance => { instance.renderStyle = pc.RENDERSTYLE_WIREFRAME; });
      colEntity.once('destroy', () => mat.destroy());
      this.helperEntity.addChild(colEntity);
    }

    // Physics Joint Constraint Gizmo Helper
    if (active.joint) {
      const joint = active.joint;
      const jointEntity = new pc.Entity('JointConstraintGizmo');
      const pivot = joint.pivot ? new pc.Vec3(...joint.pivot) : new pc.Vec3(0, 0, 0);
      jointEntity.setPosition(active.getPosition().clone().add(pivot));

      const mat = new pc.StandardMaterial();
      mat.diffuse = new pc.Color(1.0, 0.8, 0.0); // Gold wireframe
      mat.wireframe = true;
      mat.update();

      jointEntity.setLocalScale(0.6, 0.6, 0.6);
      jointEntity.addComponent('render', { type: joint.type === 'hinge' ? 'cylinder' : 'sphere', material: mat });
      this.helperEntity.addChild(jointEntity);
    }

    // Camera Frustum Wireframe Pyramid Gizmo
    if (active.camera) {
      const camEntity = new pc.Entity('CameraFrustumGizmo');
      camEntity.setPosition(active.getPosition());
      camEntity.setRotation(active.getRotation());

      const mat = new pc.StandardMaterial();
      mat.diffuse = new pc.Color(0.8, 0.3, 1.0); // Magenta wireframe
      mat.wireframe = true;
      mat.update();

      camEntity.setLocalScale(1.2, 0.9, 1.8);
      camEntity.addComponent('render', { type: 'cone', material: mat });
      this.helperEntity.addChild(camEntity);
    }

    // Interactive Trigger Volume Bounding Shape Gizmo
    if (this.editor && this.editor.triggers && this.editor.triggers.hasTrigger(active.name)) {
      const trigConfig = this.editor.triggers.getTrigger(active.name);
      const radius = trigConfig ? (trigConfig.radius || 2.0) : 2.0;

      const trigEntity = new pc.Entity('TriggerVolumeGizmo');
      trigEntity.setPosition(active.getPosition());
      trigEntity.setLocalScale(radius * 2, radius * 2, radius * 2);

      const mat = new pc.StandardMaterial();
      mat.diffuse = new pc.Color(0.0, 0.9, 1.0); // Cyan wireframe
      mat.wireframe = true;
      mat.update();

      trigEntity.addComponent('render', { type: 'sphere', material: mat });
      this.helperEntity.addChild(trigEntity);
    }

    // Particle System Emitter Bounds Helper
    if (active.particlesystem) {
      const psEntity = new pc.Entity('ParticleEmitterGizmo');
      psEntity.setPosition(active.getPosition());
      psEntity.setRotation(active.getRotation());

      const mat = new pc.StandardMaterial();
      mat.diffuse = new pc.Color(1.0, 0.6, 0.0); // Amber wireframe
      mat.wireframe = true;
      mat.update();

      psEntity.setLocalScale(1.0, 1.0, 1.0);
      psEntity.addComponent('render', { type: 'box', material: mat });
      this.helperEntity.addChild(psEntity);
    }
  }
}
