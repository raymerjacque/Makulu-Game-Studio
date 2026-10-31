import * as pc from 'playcanvas';

/**
 * Interactive 3D Model Canvas Resizer Overlay
 * Provides corner hook arrows and floating transform controls directly on 3D models in the viewport.
 */
export class ModelResizerOverlay {
  constructor(container, editor) {
    this.container = container;
    this.editor = editor;
    this.canvas = container.querySelector('#viewport-canvas');
    this.targetEntity = null;
    this.isDragging = false;
    this.isRotating = false;
    this.dragCorner = null;
    this.dragData = null;
    this.rotateDragData = null;

    this.createDOM();
    this.bindEvents();
  }

  createDOM() {
    this.overlay = document.createElement('div');
    this.overlay.className = 'model-resizer-overlay';
    this.overlay.style.display = 'none';

    this.overlay.innerHTML = `
      <!-- Bounding Box Outline -->
      <div class="resizer-box-frame"></div>

      <!-- Turn / Rotation Stem and Handle -->
      <div class="resizer-turn-stem"></div>
      <div class="resizer-turn-handle" title="Drag to Turn / Rotate Model (Shift for 15° Snap)">
        <svg viewBox="0 0 24 24" class="turn-handle-svg">
          <path d="M 12 4 A 8 8 0 1 1 4 12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
          <polyline points="4,7 4,12 9,12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>

      <!-- 4 Corner Hook Arrows -->
      <div class="resizer-corner-hook corner-nw" data-corner="nw" title="Drag Corner to Resize Model">
        <svg viewBox="0 0 24 24" class="corner-hook-svg">
          <path d="M 18 5 L 6 5 L 6 17 M 6 5 L 17 16" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>

      <div class="resizer-corner-hook corner-ne" data-corner="ne" title="Drag Corner to Resize Model">
        <svg viewBox="0 0 24 24" class="corner-hook-svg">
          <path d="M 6 5 L 18 5 L 18 17 M 18 5 L 7 16" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>

      <div class="resizer-corner-hook corner-se" data-corner="se" title="Drag Corner to Resize Model">
        <svg viewBox="0 0 24 24" class="corner-hook-svg">
          <path d="M 6 19 L 18 19 L 18 7 M 18 19 L 7 8" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>

      <div class="resizer-corner-hook corner-sw" data-corner="sw" title="Drag Corner to Resize Model">
        <svg viewBox="0 0 24 24" class="corner-hook-svg">
          <path d="M 18 19 L 6 19 L 6 7 M 6 19 L 17 8" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>

      <!-- Floating On-Canvas Transform Pill -->
      <div class="resizer-floating-hud">
        <div class="hud-mode-group">
          <button class="hud-btn mode-move" title="Move Object (W)">✥ Move</button>
          <button class="hud-btn mode-rotate" title="Rotate Object (E)">↻ Rotate</button>
          <button class="hud-btn mode-scale active" title="Resize Object (R)">⤢ Resize</button>
        </div>
        <div class="hud-divider"></div>
        <div class="hud-scale-group">
          <button class="hud-btn scale-dec" title="Shrink Size (-15%)">➖</button>
          <span class="hud-scale-val">1.00x</span>
          <button class="hud-btn scale-inc" title="Enlarge Size (+15%)">➕</button>
          <button class="hud-btn scale-reset" title="Reset Scale (1x)">↺ 1x</button>
        </div>
        <div class="hud-divider"></div>
        <div class="hud-rotate-group">
          <button class="hud-btn turn-ccw" title="Turn Left / Anticlockwise (-45°)">↶ -45°</button>
          <span class="hud-rot-val" title="Current Rotation (Y-axis)">0°</span>
          <button class="hud-btn turn-cw" title="Turn Right / Clockwise (+45°)">↷ +45°</button>
          <button class="hud-btn turn-180" title="Turn 180° (Face Backward)">↻ 180°</button>
        </div>
      </div>

      <!-- Live Drag Tooltip -->
      <div class="resizer-drag-tooltip" style="display: none;">📐 Scale: 1.00x</div>
    `;

    this.container.appendChild(this.overlay);

    this.boxFrame = this.overlay.querySelector('.resizer-box-frame');
    this.turnStem = this.overlay.querySelector('.resizer-turn-stem');
    this.turnHandle = this.overlay.querySelector('.resizer-turn-handle');
    this.floatingHud = this.overlay.querySelector('.resizer-floating-hud');
    this.scaleValText = this.overlay.querySelector('.hud-scale-val');
    this.rotValText = this.overlay.querySelector('.hud-rot-val');
    this.tooltip = this.overlay.querySelector('.resizer-drag-tooltip');
    this.cornerHooks = this.overlay.querySelectorAll('.resizer-corner-hook');
  }

  bindEvents() {
    // Selection changed
    this.editor.selection.subscribe((selected, active) => {
      this.targetEntity = active;
      this.updateVisibility();
    });

    // Entity transformed
    this.editor.events.on('entity:transformed', (ent) => {
      if (this.targetEntity === ent) {
        this.updateScaleDisplay();
        this.updateRotationDisplay();
        this.updatePositions();
      }
    });

    // Update overlay position on engine render tick
    const updateLoop = () => {
      if (this.targetEntity && !this.editor.isPlaying) {
        this.updatePositions();
      }
      requestAnimationFrame(updateLoop);
    };
    requestAnimationFrame(updateLoop);

    // Top Turn / Rotation Handle Dragging
    if (this.turnHandle) {
      this.turnHandle.addEventListener('mousedown', (e) => {
        if (!this.targetEntity) return;
        e.preventDefault();
        e.stopPropagation();

        this.isRotating = true;
        const bounds = this.getScreenBounds(this.targetEntity);
        const rect = this.canvas.getBoundingClientRect();
        const centerScreen = {
          x: rect.left + (bounds ? bounds.centerX : rect.width / 2),
          y: rect.top + (bounds ? bounds.centerY : rect.height / 2)
        };

        const startAngle = Math.atan2(e.clientY - centerScreen.y, e.clientX - centerScreen.x) * (180 / Math.PI);
        const initialRot = this.targetEntity.getEulerAngles().clone();
        const initialPos = this.targetEntity.getPosition().clone();
        const initialScale = this.targetEntity.getLocalScale().clone();

        this.rotateDragData = {
          initialRot,
          initialPos,
          initialScale,
          centerScreen,
          startAngle
        };

        this.tooltip.style.display = 'block';
        this.tooltip.style.left = `${e.clientX + 16}px`;
        this.tooltip.style.top = `${e.clientY - 28}px`;
        const initialYaw = Math.round(((initialRot.y % 360) + 360) % 360);
        this.tooltip.textContent = `↻ Turn: ${initialYaw}°`;
        document.body.classList.add('rotating-model');
      });
    }

    // Corner Hook Dragging
    this.cornerHooks.forEach(hook => {
      hook.addEventListener('mousedown', (e) => {
        if (!this.targetEntity) return;
        e.preventDefault();
        e.stopPropagation();

        const corner = hook.dataset.corner;
        this.isDragging = true;
        this.dragCorner = corner;

        const bounds = this.getScreenBounds(this.targetEntity);
        const rect = this.canvas.getBoundingClientRect();
        const centerScreen = {
          x: rect.left + (bounds ? bounds.centerX : rect.width / 2),
          y: rect.top + (bounds ? bounds.centerY : rect.height / 2)
        };

        const initialDist = Math.max(25, Math.hypot(e.clientX - centerScreen.x, e.clientY - centerScreen.y));

        this.dragData = {
          initialScale: this.targetEntity.getLocalScale().clone(),
          centerScreen,
          initialDist
        };

        this.tooltip.style.display = 'block';
        this.tooltip.style.left = `${e.clientX + 16}px`;
        this.tooltip.style.top = `${e.clientY - 28}px`;
        this.tooltip.textContent = `📐 Scale: ${(this.dragData.initialScale.x).toFixed(2)}x`;
        document.body.classList.add('resizing-model');
      });
    });

    window.addEventListener('mousemove', (e) => {
      // Rotation drag
      if (this.isRotating && this.targetEntity && this.rotateDragData) {
        e.preventDefault();
        const { initialRot, centerScreen, startAngle } = this.rotateDragData;
        const curAngle = Math.atan2(e.clientY - centerScreen.y, e.clientX - centerScreen.x) * (180 / Math.PI);
        const delta = curAngle - startAngle;

        let newYaw = initialRot.y - delta;
        if (e.shiftKey) {
          // Snap to 15° increments with Shift
          newYaw = Math.round(newYaw / 15) * 15;
        }
        newYaw = ((newYaw % 360) + 360) % 360;

        this.targetEntity.setEulerAngles(initialRot.x, newYaw, initialRot.z);
        this.editor.events.emit('entity:transformed', this.targetEntity);

        this.tooltip.style.left = `${e.clientX + 16}px`;
        this.tooltip.style.top = `${e.clientY - 28}px`;
        this.tooltip.textContent = `↻ Turn: ${Math.round(newYaw)}°${e.shiftKey ? ' (Snap 15°)' : ''}`;
        this.updateRotationDisplay();
        return;
      }

      // Scale drag
      if (!this.isDragging || !this.targetEntity || !this.dragData) return;
      e.preventDefault();

      const { initialScale, centerScreen, initialDist } = this.dragData;
      const curDist = Math.hypot(e.clientX - centerScreen.x, e.clientY - centerScreen.y);
      let ratio = curDist / initialDist;

      // Clamp scale multiplier between 0.05x and 25x
      ratio = Math.max(0.05, Math.min(25.0, ratio));

      // Gentle snap to 1.0x if close
      if (Math.abs(ratio - 1.0) < 0.03) ratio = 1.0;

      const newScale = initialScale.clone().mulScalar(ratio);
      this.targetEntity.setLocalScale(newScale);
      this.editor.events.emit('entity:transformed', this.targetEntity);

      this.tooltip.style.left = `${e.clientX + 16}px`;
      this.tooltip.style.top = `${e.clientY - 28}px`;
      this.tooltip.textContent = `📐 Scale: ${ratio.toFixed(2)}x (${Math.round(ratio * 100)}%)`;
    });

    window.addEventListener('mouseup', () => {
      // End rotation drag
      if (this.isRotating) {
        this.isRotating = false;
        document.body.classList.remove('rotating-model');
        this.tooltip.style.display = 'none';

        if (this.targetEntity && this.rotateDragData) {
          const { initialRot, initialPos, initialScale } = this.rotateDragData;
          this.editor.commitEntityTransform(this.targetEntity, { initialRot, initialPos, initialScale });
        }
        this.rotateDragData = null;
      }

      // End scale drag
      if (this.isDragging) {
        this.isDragging = false;
        document.body.classList.remove('resizing-model');
        this.tooltip.style.display = 'none';

        if (this.targetEntity && this.dragData) {
          this.editor.commitEntityTransform(this.targetEntity, { initialScale: this.dragData.initialScale });
        }
        this.dragData = null;
      }
    });

    // Floating HUD Mode Buttons
    const btnMove = this.overlay.querySelector('.mode-move');
    const btnRotate = this.overlay.querySelector('.mode-rotate');
    const btnScale = this.overlay.querySelector('.mode-scale');

    btnMove.addEventListener('click', (e) => {
      e.stopPropagation();
      this.setGizmoMode('translate');
    });

    btnRotate.addEventListener('click', (e) => {
      e.stopPropagation();
      this.setGizmoMode('rotate');
    });

    btnScale.addEventListener('click', (e) => {
      e.stopPropagation();
      this.setGizmoMode('scale');
    });

    // Floating HUD Quick Scale Increments
    const btnDec = this.overlay.querySelector('.scale-dec');
    const btnInc = this.overlay.querySelector('.scale-inc');
    const btnReset = this.overlay.querySelector('.scale-reset');

    btnDec.addEventListener('click', (e) => {
      e.stopPropagation();
      this.scaleByFactor(0.85);
    });

    btnInc.addEventListener('click', (e) => {
      e.stopPropagation();
      this.scaleByFactor(1.15);
    });

    btnReset.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!this.targetEntity) return;
      const initialScale = this.targetEntity.getLocalScale().clone();
      this.targetEntity.setLocalScale(1, 1, 1);
      this.editor.commitEntityTransform(this.targetEntity, { initialScale });
      this.editor.events.emit('entity:transformed', this.targetEntity);
    });

    // Floating HUD Quick Turn Buttons (Clockwise, Anticlockwise, 180 Flip)
    const btnTurnCCW = this.overlay.querySelector('.turn-ccw');
    const btnTurnCW = this.overlay.querySelector('.turn-cw');
    const btnTurn180 = this.overlay.querySelector('.turn-180');

    if (btnTurnCCW) {
      btnTurnCCW.addEventListener('click', (e) => {
        e.stopPropagation();
        this.rotateByDegrees(-45);
      });
    }

    if (btnTurnCW) {
      btnTurnCW.addEventListener('click', (e) => {
        e.stopPropagation();
        this.rotateByDegrees(45);
      });
    }

    if (btnTurn180) {
      btnTurn180.addEventListener('click', (e) => {
        e.stopPropagation();
        this.rotateByDegrees(180);
      });
    }
  }

  setGizmoMode(mode) {
    if (this.editor.toolstrip) {
      this.editor.toolstrip.setTransformMode(mode);
    } else if (this.editor.runtime?.gizmoManager) {
      this.editor.runtime.gizmoManager.setMode(mode);
    }

    const moveBtn = this.overlay.querySelector('.mode-move');
    const rotBtn = this.overlay.querySelector('.mode-rotate');
    const scaleBtn = this.overlay.querySelector('.mode-scale');

    moveBtn.classList.toggle('active', mode === 'translate');
    rotBtn.classList.toggle('active', mode === 'rotate');
    scaleBtn.classList.toggle('active', mode === 'scale');
  }

  scaleByFactor(factor) {
    if (!this.targetEntity) return;
    const initialScale = this.targetEntity.getLocalScale().clone();
    const newScale = initialScale.clone().mulScalar(factor);
    this.targetEntity.setLocalScale(newScale);
    this.editor.commitEntityTransform(this.targetEntity, { initialScale });
    this.editor.events.emit('entity:transformed', this.targetEntity);
  }

  updateScaleDisplay() {
    if (!this.targetEntity) return;
    const s = this.targetEntity.getLocalScale();
    const avg = (s.x + s.y + s.z) / 3;
    if (this.scaleValText) {
      this.scaleValText.textContent = `${avg.toFixed(2)}x`;
    }
  }

  rotateByDegrees(delta) {
    if (!this.targetEntity) return;
    const initialRot = this.targetEntity.getEulerAngles().clone();
    const initialPos = this.targetEntity.getPosition().clone();
    const initialScale = this.targetEntity.getLocalScale().clone();

    let newYaw = (initialRot.y + delta) % 360;
    if (newYaw < 0) newYaw += 360;

    this.targetEntity.setEulerAngles(initialRot.x, newYaw, initialRot.z);
    this.editor.commitEntityTransform(this.targetEntity, { initialRot, initialPos, initialScale });
    this.editor.events.emit('entity:transformed', this.targetEntity);
    this.updateRotationDisplay();
  }

  updateRotationDisplay() {
    if (!this.targetEntity) return;
    const rotY = Math.round(this.targetEntity.getEulerAngles().y);
    const normalized = ((rotY % 360) + 360) % 360;
    if (this.rotValText) {
      this.rotValText.textContent = `${normalized}°`;
    }
  }

  updateVisibility() {
    const app = this.editor.getApp();
    if (!this.targetEntity || this.targetEntity === (app ? app.root : null) || this.editor.isPlaying) {
      this.overlay.style.display = 'none';
      return;
    }

    this.overlay.style.display = 'block';
    this.updateScaleDisplay();
    this.updateRotationDisplay();
    this.updatePositions();
  }

  getModelBounds(entity) {
    if (!entity) return null;
    let aabb = null;

    const visit = (node) => {
      const lower = node.name ? node.name.toLowerCase() : '';
      if (lower.startsWith('gizmo') || lower === 'selectionoutline' || lower === 'componentvisualhelpers') {
        return;
      }

      if (node.render && node.render.meshInstances && node.render.meshInstances.length > 0) {
        node.render.meshInstances.forEach(mi => {
          if (mi && mi.aabb) {
            if (!aabb) {
              aabb = new pc.BoundingBox(mi.aabb.center.clone(), mi.aabb.halfExtents.clone());
            } else {
              aabb.add(mi.aabb);
            }
          }
        });
      }
      if (node.children) node.children.forEach(visit);
    };

    visit(entity);

    if (!aabb) {
      const pos = entity.getPosition();
      const s = entity.getLocalScale();
      const hx = Math.max(0.6, Math.abs(s.x) * 0.5);
      const hy = Math.max(0.6, Math.abs(s.y) * 0.5);
      const hz = Math.max(0.6, Math.abs(s.z) * 0.5);
      aabb = new pc.BoundingBox(pos, new pc.Vec3(hx, hy, hz));
    }

    return aabb;
  }

  getScreenBounds(entity) {
    if (!this.editor.runtime?.editorCamera?.entity?.camera) return null;
    const camera = this.editor.runtime.editorCamera.entity.camera;
    const aabb = this.getModelBounds(entity);
    if (!aabb) return null;

    const c = aabb.center;
    const h = aabb.halfExtents;

    const corners = [
      new pc.Vec3(c.x - h.x, c.y - h.y, c.z - h.z),
      new pc.Vec3(c.x + h.x, c.y - h.y, c.z - h.z),
      new pc.Vec3(c.x + h.x, c.y - h.y, c.z + h.z),
      new pc.Vec3(c.x - h.x, c.y - h.y, c.z + h.z),
      new pc.Vec3(c.x - h.x, c.y + h.y, c.z - h.z),
      new pc.Vec3(c.x + h.x, c.y + h.y, c.z - h.z),
      new pc.Vec3(c.x + h.x, c.y + h.y, c.z + h.z),
      new pc.Vec3(c.x - h.x, c.y + h.y, c.z + h.z)
    ];

    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    let visibleCount = 0;
    const screenCoord = new pc.Vec3();

    for (let i = 0; i < corners.length; i++) {
      camera.worldToScreen(corners[i], screenCoord);
      if (screenCoord.z > 0) {
        visibleCount++;
        if (screenCoord.x < minX) minX = screenCoord.x;
        if (screenCoord.x > maxX) maxX = screenCoord.x;
        if (screenCoord.y < minY) minY = screenCoord.y;
        if (screenCoord.y > maxY) maxY = screenCoord.y;
      }
    }

    if (visibleCount < 2) return null;

    const centerScreen = new pc.Vec3();
    camera.worldToScreen(c, centerScreen);

    // Padding around bounds
    const pad = 10;
    minX -= pad; maxX += pad;
    minY -= pad; maxY += pad;

    return {
      left: minX,
      top: minY,
      width: Math.max(36, maxX - minX),
      height: Math.max(36, maxY - minY),
      centerX: centerScreen.x,
      centerY: centerScreen.y
    };
  }

  updatePositions() {
    if (!this.targetEntity || this.editor.isPlaying) {
      this.overlay.style.display = 'none';
      return;
    }

    const bounds = this.getScreenBounds(this.targetEntity);
    if (!bounds) {
      this.overlay.style.display = 'none';
      return;
    }

    this.overlay.style.display = 'block';

    // Position bounding box frame
    this.boxFrame.style.left = `${bounds.left}px`;
    this.boxFrame.style.top = `${bounds.top}px`;
    this.boxFrame.style.width = `${bounds.width}px`;
    this.boxFrame.style.height = `${bounds.height}px`;

    // Position 4 corner hook arrows
    const nw = this.overlay.querySelector('.corner-nw');
    const ne = this.overlay.querySelector('.corner-ne');
    const se = this.overlay.querySelector('.corner-se');
    const sw = this.overlay.querySelector('.corner-sw');

    nw.style.left = `${bounds.left - 14}px`;
    nw.style.top = `${bounds.top - 14}px`;

    ne.style.left = `${bounds.left + bounds.width - 14}px`;
    ne.style.top = `${bounds.top - 14}px`;

    se.style.left = `${bounds.left + bounds.width - 14}px`;
    se.style.top = `${bounds.top + bounds.height - 14}px`;

    sw.style.left = `${bounds.left - 14}px`;
    sw.style.top = `${bounds.top + bounds.height - 14}px`;

    // Position Top Turn / Rotation Handle & Stem
    if (this.turnStem && this.turnHandle) {
      const centerX = bounds.left + bounds.width / 2;
      this.turnStem.style.left = `${centerX - 1}px`;
      this.turnStem.style.top = `${bounds.top - 30}px`;
      this.turnStem.style.height = `30px`;

      this.turnHandle.style.left = `${centerX - 14}px`;
      this.turnHandle.style.top = `${bounds.top - 44}px`;
    }

    // Position Floating Transform Pill above bounding box and turn handle
    const hudWidth = 360;
    let hudLeft = bounds.left + bounds.width / 2 - hudWidth / 2;
    let hudTop = bounds.top - 82;

    // Viewport containment bounds
    const containerRect = this.container.getBoundingClientRect();
    hudLeft = Math.max(12, Math.min(containerRect.width - hudWidth - 12, hudLeft));
    if (hudTop < 45) {
      // If object is near top edge, place floating HUD right underneath
      hudTop = bounds.top + bounds.height + 14;
    }

    this.floatingHud.style.left = `${hudLeft}px`;
    this.floatingHud.style.top = `${hudTop}px`;
  }
}
