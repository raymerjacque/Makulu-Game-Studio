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
    this.app.setCanvasFillMode(pc.FILLMODE_FILL_WINDOW);
    this.app.setCanvasResolution(pc.RESOLUTION_AUTO);

    // Default lighting atmosphere
    this.app.scene.ambientLight = new pc.Color(0.22, 0.24, 0.28);
    this.app.scene.toneMapping = pc.TONEMAP_ACES;

    // Handle Window Resizing
    window.addEventListener('resize', () => this.app.resizeCanvas());

    // Setup Runtime Subsystems
    this.editorCamera = new EditorCameraController(this.app, this.canvas);
    this.grid = new EditorGrid(this.app);
    this.gizmoManager = new GizmoManager(this.app, this.editorCamera, this.editor);
    this.selectionHighlighter = new SelectionHighlighter(this.app, this.editor);

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

  setupViewportPicking() {
    let mouseDownPos = { x: 0, y: 0 };

    this.canvas.addEventListener('mousedown', (e) => {
      mouseDownPos = { x: e.clientX, y: e.clientY };
    });

    this.canvas.addEventListener('click', (e) => {
      // Ignore click if user was dragging camera or gizmo
      const dist = Math.hypot(e.clientX - mouseDownPos.x, e.clientY - mouseDownPos.y);
      if (dist > 4) return;

      // Ignore if clicking gizmo handle
      if (this.gizmoManager.isHovered) return;

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

    const raycastNode = (node) => {
      if (node === this.grid.entity || node === this.editorCamera.entity || node.name === 'GizmoRoot' || node.name === 'SelectionOutline') {
        return;
      }

      if (node.render && node.enabled && node.parent) {
        const bbox = node.render.meshInstances[0]?.aabb;
        if (bbox) {
          const ray = new pc.Ray(start, end.clone().sub(start).normalize());
          const hitPoint = new pc.Vec3();
          if (bbox.intersectsRay(ray, hitPoint)) {
            const dist = start.distance(hitPoint);
            if (dist < closestDist) {
              closestDist = dist;
              closestHit = node;
            }
          }
        }
      }

      if (node.children) {
        node.children.forEach(raycastNode);
      }
    };

    this.app.root.children.forEach(raycastNode);
    return closestHit;
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
            } else {
              this.editor.createEntity({
                name: asset.name.replace(/\.[^/.]+$/, ""),
                transform: { position: [0, 1, 0] },
                components: [{ type: 'render', properties: { type: 'box' } }]
              });
            }
          }
        }
      } catch (err) {
        // Drop handled
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
  constructor(app, canvas) {
    this.app = app;
    this.canvas = canvas;

    this.target = new pc.Vec3(0, 1, 0);
    this.distance = 8;
    this.pitch = -20;
    this.yaw = 35;

    this.entity = new pc.Entity('EditorCamera');
    this.entity.addComponent('camera', {
      clearColor: new pc.Color(0.08, 0.1, 0.13),
      fov: 55,
      nearClip: 0.1,
      farClip: 1000
    });

    this.app.root.addChild(this.entity);
    this.updatePosition();
    this.bindMouseControls();
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
    if (targetEntity.render && targetEntity.render.meshInstances[0]) {
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
    this.pitch = Math.max(-89, Math.min(89, this.pitch));

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
    window.addEventListener('keydown', (e) => keys[e.key.toLowerCase()] = true);
    window.addEventListener('keyup', (e) => keys[e.key.toLowerCase()] = false);

    this.canvas.addEventListener('contextmenu', e => e.preventDefault());

    this.canvas.addEventListener('mousedown', (e) => {
      lastX = e.clientX;
      lastY = e.clientY;

      if (e.button === 0 && !e.shiftKey) {
        isOrbiting = true;
      } else if (e.button === 2 || (e.button === 0 && e.shiftKey)) {
        isPanning = true;
      }
    });

    window.addEventListener('mousemove', (e) => {
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;

      if (isOrbiting) {
        this.yaw -= dx * 0.3;
        this.pitch -= dy * 0.3;
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
    this.createGridMesh();
    this.app.root.addChild(this.entity);
  }

  setVisible(visible) {
    this.visible = visible;
    this.entity.enabled = visible;
  }

  createGridMesh() {
    const size = 30;
    const step = 1;
    const lines = [];
    const colors = [];

    const mainColor = new pc.Color(0.22, 0.28, 0.35, 0.6);
    const axisXColor = new pc.Color(0.9, 0.25, 0.25, 1);
    const axisZColor = new pc.Color(0.25, 0.5, 0.9, 1);

    for (let i = -size; i <= size; i += step) {
      // Lines along Z
      lines.push(i, 0, -size, i, 0, size);
      const colorZ = i === 0 ? axisZColor : mainColor;
      colors.push(colorZ.r, colorZ.g, colorZ.b, colorZ.a, colorZ.r, colorZ.g, colorZ.b, colorZ.a);

      // Lines along X
      lines.push(-size, 0, i, size, 0, i);
      const colorX = i === 0 ? axisXColor : mainColor;
      colors.push(colorX.r, colorX.g, colorX.b, colorX.a, colorX.r, colorX.g, colorX.b, colorX.a);
    }

    const mesh = pc.createMesh(this.app.graphicsDevice, lines, {
      colors: colors,
      primitiveType: pc.PRIMITIVE_LINES
    });

    const material = new pc.StandardMaterial();
    material.useVertexColors = true;
    material.blendType = pc.BLEND_NORMAL;
    material.update();

    const meshInstance = new pc.MeshInstance(mesh, material);
    this.entity.addComponent('render', {
      meshInstances: [meshInstance]
    });
  }
}

/**
 * Interactive 3D Transform Gizmo Manager (Translate, Rotate, Scale)
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

    this.isHovered = false;
    this.isDragging = false;
    this.activeAxis = null; // 'x', 'y', 'z'

    this.rootEntity = new pc.Entity('GizmoRoot');
    this.app.root.addChild(this.rootEntity);

    this.createGizmoMeshes();
    this.bindEvents();

    this.editor.selection.subscribe((selected, active) => {
      this.updateGizmoTarget(active);
    });
  }

  setMode(mode) {
    this.mode = mode;
    this.updateGizmoVisibility();
  }

  setCoordSpace(space) {
    this.coordSpace = space;
  }

  setSnap(enabled, increment = 1.0) {
    this.snapEnabled = enabled;
    this.snapIncrement = increment;
  }

  updateGizmoTarget(activeEntity) {
    this.targetEntity = activeEntity;
    this.updateGizmoVisibility();
  }

  updateGizmoVisibility() {
    if (!this.targetEntity || this.mode === 'none') {
      this.rootEntity.enabled = false;
      return;
    }

    this.rootEntity.enabled = true;
    this.rootEntity.setPosition(this.targetEntity.getPosition());

    if (this.coordSpace === 'local') {
      this.rootEntity.setRotation(this.targetEntity.getRotation());
    } else {
      this.rootEntity.setEulerAngles(0, 0, 0);
    }

    // Scale gizmo so it stays constant size on screen
    const camPos = this.cameraController.entity.getPosition();
    const dist = camPos.distance(this.rootEntity.getPosition());
    const scale = Math.max(0.2, dist * 0.12);
    this.rootEntity.setLocalScale(scale, scale, scale);

    this.translateGroup.enabled = this.mode === 'translate';
    this.rotateGroup.enabled = this.mode === 'rotate';
    this.scaleGroup.enabled = this.mode === 'scale';
  }

  createGizmoMeshes() {
    this.translateGroup = new pc.Entity('GizmoTranslate');
    this.rotateGroup = new pc.Entity('GizmoRotate');
    this.scaleGroup = new pc.Entity('GizmoScale');

    this.rootEntity.addChild(this.translateGroup);
    this.rootEntity.addChild(this.rotateGroup);
    this.rootEntity.addChild(this.scaleGroup);

    // Build Translate Handles (X: Red, Y: Green, Z: Blue)
    this.buildArrowHandle(this.translateGroup, 'x', [1, 0, 0], [0, 0, -90], [0.8, 0, 0]);
    this.buildArrowHandle(this.translateGroup, 'y', [0, 1, 0], [0, 0, 0], [0, 0.8, 0]);
    this.buildArrowHandle(this.translateGroup, 'z', [0, 0, 1], [90, 0, 0], [0, 0.4, 0.9]);

    // Build Scale Handles
    this.buildCubeHandle(this.scaleGroup, 'x', [0.8, 0, 0], [1, 0, 0]);
    this.buildCubeHandle(this.scaleGroup, 'y', [0, 0.8, 0], [0, 1, 0]);
    this.buildCubeHandle(this.scaleGroup, 'z', [0, 0, 0.8], [0, 0.4, 0.9]);

    // Build Rotate Rings
    this.buildRingHandle(this.rotateGroup, 'x', [90, 0, 0], [1, 0, 0]);
    this.buildRingHandle(this.rotateGroup, 'y', [0, 0, 0], [0, 1, 0]);
    this.buildRingHandle(this.rotateGroup, 'z', [0, 90, 0], [0, 0.4, 0.9]);

    this.app.on('update', () => {
      if (this.targetEntity && this.rootEntity.enabled) {
        this.updateGizmoVisibility();
      }
    });
  }

  buildArrowHandle(parent, axis, pos, rot, colorArr) {
    const ent = new pc.Entity(`Gizmo_Arrow_${axis}`);
    ent.setPosition(...pos);
    ent.setEulerAngles(...rot);

    const mat = new pc.StandardMaterial();
    mat.diffuse = new pc.Color(...colorArr);
    mat.useLighting = false;
    mat.update();

    ent.addComponent('render', { type: 'cone', material: mat });
    ent.setLocalScale(0.12, 0.4, 0.12);
    parent.addChild(ent);
  }

  buildCubeHandle(parent, axis, pos, colorArr) {
    const ent = new pc.Entity(`Gizmo_Scale_${axis}`);
    ent.setPosition(...pos);

    const mat = new pc.StandardMaterial();
    mat.diffuse = new pc.Color(...colorArr);
    mat.useLighting = false;
    mat.update();

    ent.addComponent('render', { type: 'box', material: mat });
    ent.setLocalScale(0.15, 0.15, 0.15);
    parent.addChild(ent);
  }

  buildRingHandle(parent, axis, rot, colorArr) {
    const ent = new pc.Entity(`Gizmo_Rotate_${axis}`);
    ent.setEulerAngles(...rot);

    const mat = new pc.StandardMaterial();
    mat.diffuse = new pc.Color(...colorArr);
    mat.useLighting = false;
    mat.update();

    ent.addComponent('render', { type: 'cylinder', material: mat });
    ent.setLocalScale(1.4, 0.02, 1.4);
    parent.addChild(ent);
  }

  bindEvents() {
    let initialTransform = null;
    let dragStartMouse = { x: 0, y: 0 };

    const canvas = this.app.graphicsDevice.canvas;

    canvas.addEventListener('mousedown', (e) => {
      if (!this.targetEntity || this.mode === 'none') return;

      const hitGizmo = this.pickGizmoAxis(e.clientX, e.clientY);
      if (hitGizmo) {
        this.isDragging = true;
        this.activeAxis = hitGizmo;
        dragStartMouse = { x: e.clientX, y: e.clientY };

        initialTransform = {
          initialPos: this.targetEntity.getPosition().clone(),
          initialRot: this.targetEntity.getEulerAngles().clone(),
          initialScale: this.targetEntity.getLocalScale().clone()
        };
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isDragging || !this.targetEntity) return;

      const dx = (e.clientX - dragStartMouse.x) * 0.02;
      const dy = -(e.clientY - dragStartMouse.y) * 0.02;

      if (this.mode === 'translate') {
        const delta = new pc.Vec3();
        if (this.activeAxis === 'x') delta.x = dx;
        if (this.activeAxis === 'y') delta.y = dy;
        if (this.activeAxis === 'z') delta.z = dx;

        if (this.snapEnabled) {
          delta.x = Math.round(delta.x / this.snapIncrement) * this.snapIncrement;
          delta.y = Math.round(delta.y / this.snapIncrement) * this.snapIncrement;
          delta.z = Math.round(delta.z / this.snapIncrement) * this.snapIncrement;
        }

        const newPos = initialTransform.initialPos.clone().add(delta);
        this.targetEntity.setPosition(newPos);
        this.editor.events.emit('entity:transformed', this.targetEntity);

      } else if (this.mode === 'rotate') {
        const rotAmount = (dx + dy) * 30;
        const newRot = initialTransform.initialRot.clone();
        if (this.activeAxis === 'x') newRot.x += rotAmount;
        if (this.activeAxis === 'y') newRot.y += rotAmount;
        if (this.activeAxis === 'z') newRot.z += rotAmount;

        this.targetEntity.setEulerAngles(newRot);
        this.editor.events.emit('entity:transformed', this.targetEntity);

      } else if (this.mode === 'scale') {
        const scaleAmount = dx;
        const newScale = initialTransform.initialScale.clone();
        if (this.activeAxis === 'x') newScale.x = Math.max(0.05, newScale.x + scaleAmount);
        if (this.activeAxis === 'y') newScale.y = Math.max(0.05, newScale.y + scaleAmount);
        if (this.activeAxis === 'z') newScale.z = Math.max(0.05, newScale.z + scaleAmount);

        this.targetEntity.setLocalScale(newScale);
        this.editor.events.emit('entity:transformed', this.targetEntity);
      }
    });

    window.addEventListener('mouseup', () => {
      if (this.isDragging && this.targetEntity && initialTransform) {
        this.isDragging = false;
        this.editor.commitEntityTransform(this.targetEntity, initialTransform);
        initialTransform = null;
      }
    });
  }

  pickGizmoAxis(screenX, screenY) {
    if (!this.rootEntity.enabled) return null;
    const camera = this.cameraController.entity.camera;
    if (!camera) return null;

    const start = new pc.Vec3();
    const end = new pc.Vec3();
    camera.screenToWorld(screenX, screenY, camera.nearClip, start);
    camera.screenToWorld(screenX, screenY, camera.farClip, end);

    const ray = new pc.Ray(start, end.clone().sub(start).normalize());
    const gizmoPos = this.rootEntity.getPosition();

    // Simple proximity pick to gizmo axes
    const dist = ray.distanceToPoint(gizmoPos);
    if (dist < 1.2) {
      this.isHovered = true;
      return 'y';
    }
    this.isHovered = false;
    return null;
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
