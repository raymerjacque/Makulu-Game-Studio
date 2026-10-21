import * as pc from 'playcanvas';
import { MaterialPreviewRenderer } from './material-preview.js';

/**
 * Entity & Component Inspector Panel
 * Dynamically switches between Beginner-Friendly Simple Mode and Technical Pro Mode.
 */
export class InspectorPanel {
  constructor(container, editor, codeEditorModal = null) {
    this.container = container;
    this.editor = editor;
    this.codeEditor = codeEditorModal;
    this.currentEntity = null;
    this.matPreview = null;

    this.render();
    this.bindEvents();
  }

  render() {
    this.container.innerHTML = `
      <div class="panel-header">
        <span>Inspector</span>
        <div class="panel-header-actions" id="inspector-actions"></div>
      </div>
      <div class="inspector-body" id="inspector-content">
        <div style="padding: 24px 12px; text-align: center; color: var(--text-muted); font-size: 12px;">
          Select an entity from Hierarchy or click one in the 3D Viewport to inspect properties.
        </div>
      </div>
    `;
  }

  bindEvents() {
    this.editor.selection.subscribe((selected, active) => {
      this.currentEntity = active;
      this.updateView();
    });

    this.editor.events.on('entity:transformed', (entity) => {
      if (this.currentEntity === entity) {
        this.syncTransformInputs();
      }
    });

    this.editor.events.on('entity:component:changed', (entity) => {
      if (this.currentEntity === entity) {
        this.updateView();
      }
    });

    this.editor.events.on('mode:changed', () => {
      this.updateView();
    });
  }

  updateView() {
    if (this.matPreview) {
      this.matPreview.destroy();
      this.matPreview = null;
    }

    const body = this.container.querySelector('#inspector-content');
    if (!this.currentEntity) {
      body.innerHTML = `
        <div style="padding: 30px 16px; text-align: center; color: var(--text-muted); font-size: 12px;">
          <div style="font-size: 24px; margin-bottom: 8px;">🎯</div>
          <div>No entity selected.</div>
          <div style="font-size: 11px; margin-top: 4px;">Click an object in the 3D scene or choose one from the Hierarchy.</div>
        </div>
      `;
      return;
    }

    const ent = this.currentEntity;
    const isSimple = this.editor.mode === 'simple';

    if (isSimple) {
      this.renderSimpleModeView(body, ent);
    } else {
      this.renderProModeView(body, ent);
    }
  }

  /* ========================================================================= */
  /* 🌱 SIMPLE / NOVICE MODE VIEW                                              */
  /* ========================================================================= */
  renderSimpleModeView(body, ent) {
    body.innerHTML = `
      <!-- Mode Banner -->
      <div style="background: rgba(16, 185, 129, 0.12); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: var(--radius-md); padding: 8px 10px; display: flex; align-items: center; justify-content: space-between;">
        <span style="color: var(--accent-green); font-weight: 700; font-size: 11px;">🌱 SIMPLE MODE ACTIVE</span>
        <label class="toggle-switch">
          <input type="checkbox" id="entity-enabled" ${ent.enabled ? 'checked' : ''}>
          <span class="toggle-slider"></span>
        </label>
      </div>

      <!-- Entity Name -->
      <div class="inspector-section">
        <div class="inspector-section-header"><span>Object Name</span></div>
        <div class="inspector-section-content">
          <input type="text" id="entity-name-input" class="text-input" value="${ent.name}">
        </div>
      </div>

      <!-- 1-Click Quick Color Swatches -->
      <div class="inspector-section">
        <div class="inspector-section-header"><span>🎨 Quick Appearance Color</span></div>
        <div class="inspector-section-content">
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px;" id="simple-color-swatches">
            <button class="btn" data-color="#ff6600" style="background: #ff6600; height: 28px; border: none;"></button>
            <button class="btn" data-color="#ef4444" style="background: #ef4444; height: 28px; border: none;"></button>
            <button class="btn" data-color="#3b82f6" style="background: #3b82f6; height: 28px; border: none;"></button>
            <button class="btn" data-color="#10b981" style="background: #10b981; height: 28px; border: none;"></button>
            <button class="btn" data-color="#eab308" style="background: #eab308; height: 28px; border: none;"></button>
            <button class="btn" data-color="#a855f7" style="background: #a855f7; height: 28px; border: none;"></button>
            <button class="btn" data-color="#ffffff" style="background: #ffffff; height: 28px; border: none;"></button>
            <button class="btn" data-color="#1e293b" style="background: #1e293b; height: 28px; border: none;"></button>
          </div>
        </div>
      </div>

      <!-- Quick Size Buttons -->
      <div class="inspector-section">
        <div class="inspector-section-header"><span>📏 Object Size</span></div>
        <div class="inspector-section-content" style="display: flex; gap: 6px;">
          <button class="btn" id="btn-size-sm" style="flex: 1;">⚪ Small</button>
          <button class="btn" id="btn-size-md" style="flex: 1;">📦 Medium</button>
          <button class="btn" id="btn-size-lg" style="flex: 1;">🏢 Large</button>
        </div>
      </div>

      <!-- Quick Nudge Placement -->
      <div class="inspector-section">
        <div class="inspector-section-header"><span>🕹️ Easy Placement</span></div>
        <div class="inspector-section-content" style="display: flex; flex-direction: column; gap: 6px;">
          <div style="display: flex; gap: 6px;">
            <button class="btn" id="nudge-up" style="flex: 1;">⬆ Lift Higher (+1m)</button>
            <button class="btn" id="nudge-down" style="flex: 1;">⬇ Lower Ground (-1m)</button>
          </div>
          <div style="display: flex; gap: 6px;">
            <button class="btn" id="nudge-left" style="flex: 1;">⬅ Move Left</button>
            <button class="btn" id="nudge-right" style="flex: 1;">➡ Move Right</button>
          </div>
          <button class="btn btn-primary" id="btn-center-origin" style="font-size: 11px;">🎯 Center at Origin (0, 0, 0)</button>
        </div>
      </div>

      <!-- Plug-and-Play No-Code Behaviors -->
      <div class="inspector-section" style="border-color: var(--accent-orange);">
        <div class="inspector-section-header" style="background: rgba(255,102,0,0.15); color: var(--accent-orange);">
          <span>⚡ No-Code Game Behaviors</span>
        </div>
        <div class="inspector-section-content" style="display: flex; flex-direction: column; gap: 8px;">
          <button class="btn" id="add-spin-behavior" style="justify-content: flex-start; gap: 8px;">
            <span>🔄</span> <span>Add Continuous Spin</span>
          </button>
          <button class="btn" id="add-wasd-behavior" style="justify-content: flex-start; gap: 8px;">
            <span>🎮</span> <span>Make Player WASD Controlled</span>
          </button>
          <button class="btn" id="add-flicker-behavior" style="justify-content: flex-start; gap: 8px;">
            <span>💡</span> <span>Add Flame/Light Flicker</span>
          </button>
        </div>
      </div>
    `;

    // Bind Simple Mode actions
    body.querySelector('#entity-enabled').addEventListener('change', (e) => {
      ent.enabled = e.target.checked;
    });

    body.querySelector('#entity-name-input').addEventListener('change', (e) => {
      ent.name = e.target.value;
      this.editor.events.emit('scene:changed');
    });

    // Swatches
    body.querySelectorAll('#simple-color-swatches .btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const hex = btn.dataset.color;
        const r = parseInt(hex.slice(1, 3), 16) / 255;
        const g = parseInt(hex.slice(3, 5), 16) / 255;
        const b = parseInt(hex.slice(5, 7), 16) / 255;

        if (ent.render) {
          if (!ent.render.material) {
            ent.render.material = new pc.StandardMaterial();
          }
          ent.render.material.diffuse = new pc.Color(r, g, b);
          ent.render.material.update();
        }
      });
    });

    // Size
    body.querySelector('#btn-size-sm').addEventListener('click', () => {
      ent.setLocalScale(0.5, 0.5, 0.5);
      this.editor.events.emit('entity:transformed', ent);
    });
    body.querySelector('#btn-size-md').addEventListener('click', () => {
      ent.setLocalScale(1.0, 1.0, 1.0);
      this.editor.events.emit('entity:transformed', ent);
    });
    body.querySelector('#btn-size-lg').addEventListener('click', () => {
      ent.setLocalScale(2.5, 2.5, 2.5);
      this.editor.events.emit('entity:transformed', ent);
    });

    // Nudge
    body.querySelector('#nudge-up').addEventListener('click', () => {
      ent.translate(0, 1, 0);
      this.editor.events.emit('entity:transformed', ent);
    });
    body.querySelector('#nudge-down').addEventListener('click', () => {
      ent.translate(0, -1, 0);
      this.editor.events.emit('entity:transformed', ent);
    });
    body.querySelector('#nudge-left').addEventListener('click', () => {
      ent.translate(-1, 0, 0);
      this.editor.events.emit('entity:transformed', ent);
    });
    body.querySelector('#nudge-right').addEventListener('click', () => {
      ent.translate(1, 0, 0);
      this.editor.events.emit('entity:transformed', ent);
    });
    body.querySelector('#btn-center-origin').addEventListener('click', () => {
      ent.setPosition(0, ent.getLocalScale().y / 2, 0);
      ent.setEulerAngles(0, 0, 0);
      this.editor.events.emit('entity:transformed', ent);
    });

    // Behaviors
    body.querySelector('#add-spin-behavior').addEventListener('click', () => {
      if (this.editor.behaviors) {
        this.editor.behaviors.attachBehavior(ent, 'spin', { speed: 45, axis: 'y' });
        alert(`Attached Continuous Spin Behavior to ${ent.name}!`);
      }
    });

    body.querySelector('#add-wasd-behavior').addEventListener('click', () => {
      if (this.editor.behaviors) {
        this.editor.behaviors.attachBehavior(ent, 'wasd', { speed: 8 });
        alert(`Attached WASD Player Controller to ${ent.name}! Click ▶ Play to test!`);
      }
    });

    body.querySelector('#add-flicker-behavior').addEventListener('click', () => {
      if (this.editor.behaviors) {
        this.editor.behaviors.attachBehavior(ent, 'light_flicker', { variance: 0.5 });
        alert(`Attached Light Flicker Behavior to ${ent.name}!`);
      }
    });
  }

  /* ========================================================================= */
  /* ⚡ PRO / ADVANCED MODE VIEW                                               */
  /* ========================================================================= */
  renderProModeView(body, ent) {
    body.innerHTML = `
      <!-- Mode Banner -->
      <div style="background: rgba(255, 102, 0, 0.12); border: 1px solid rgba(255, 102, 0, 0.3); border-radius: var(--radius-md); padding: 8px 10px; display: flex; align-items: center; justify-content: space-between;">
        <span style="color: var(--accent-orange); font-weight: 700; font-size: 11px;">⚡ PRO ECS MODE ACTIVE</span>
        <label class="toggle-switch">
          <input type="checkbox" id="entity-enabled" ${ent.enabled ? 'checked' : ''}>
          <span class="toggle-slider"></span>
        </label>
      </div>

      <!-- Entity General -->
      <div class="inspector-section">
        <div class="inspector-section-header">
          <span>Entity Info</span>
        </div>
        <div class="inspector-section-content">
          <div class="prop-row">
            <span class="prop-label">Name</span>
            <div class="prop-control">
              <input type="text" id="entity-name-input" class="text-input" value="${ent.name}">
            </div>
          </div>
        </div>
      </div>

      <!-- Transform -->
      <div class="inspector-section">
        <div class="inspector-section-header">
          <span>Transform</span>
          <button id="btn-reset-transform" class="btn" style="padding: 1px 6px; font-size: 10px;">Reset</button>
        </div>
        <div class="inspector-section-content">
          <!-- Position -->
          <div class="prop-row">
            <span class="prop-label">Position</span>
            <div class="vec3-group">
              <div class="vec3-item x"><span class="vec3-prefix">X</span><input type="number" step="0.1" id="pos-x" class="vec3-input"></div>
              <div class="vec3-item y"><span class="vec3-prefix">Y</span><input type="number" step="0.1" id="pos-y" class="vec3-input"></div>
              <div class="vec3-item z"><span class="vec3-prefix">Z</span><input type="number" step="0.1" id="pos-z" class="vec3-input"></div>
            </div>
          </div>

          <!-- Rotation -->
          <div class="prop-row">
            <span class="prop-label">Rotation</span>
            <div class="vec3-group">
              <div class="vec3-item x"><span class="vec3-prefix">X</span><input type="number" step="1" id="rot-x" class="vec3-input"></div>
              <div class="vec3-item y"><span class="vec3-prefix">Y</span><input type="number" step="1" id="rot-y" class="vec3-input"></div>
              <div class="vec3-item z"><span class="vec3-prefix">Z</span><input type="number" step="1" id="rot-z" class="vec3-input"></div>
            </div>
          </div>

          <!-- Scale -->
          <div class="prop-row">
            <span class="prop-label">Scale</span>
            <div class="vec3-group">
              <div class="vec3-item x"><span class="vec3-prefix">X</span><input type="number" step="0.1" id="scale-x" class="vec3-input"></div>
              <div class="vec3-item y"><span class="vec3-prefix">Y</span><input type="number" step="0.1" id="scale-y" class="vec3-input"></div>
              <div class="vec3-item z"><span class="vec3-prefix">Z</span><input type="number" step="0.1" id="scale-z" class="vec3-input"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Components Container -->
      <div id="components-stack" style="display: flex; flex-direction: column; gap: 8px;"></div>

      <!-- Add Component Dropdown -->
      <div style="margin-top: 8px;">
        <select id="add-component-select" class="select-input" style="padding: 6px; font-weight: 600; text-align: center; border-color: var(--accent-orange); color: var(--accent-orange);">
          <option value="">+ Add Component</option>
          <option value="render">Render / Mesh</option>
          <option value="light">Light Source</option>
          <option value="camera">Camera</option>
          <option value="collision">Collision Shape</option>
          <option value="rigidbody">Rigidbody Physics</option>
          <option value="script">Script Behavior</option>
        </select>
      </div>
    `;

    this.bindEntityInputs();
    this.renderComponents();
    this.syncTransformInputs();
  }

  bindEntityInputs() {
    const ent = this.currentEntity;
    if (!ent) return;

    // Enabled toggle
    const enabledInput = this.container.querySelector('#entity-enabled');
    if (enabledInput) {
      enabledInput.addEventListener('change', () => {
        ent.enabled = enabledInput.checked;
      });
    }

    // Name input
    const nameInput = this.container.querySelector('#entity-name-input');
    if (nameInput) {
      nameInput.addEventListener('change', () => {
        ent.name = nameInput.value;
        this.editor.events.emit('scene:changed');
      });
    }

    // Reset transform
    const btnReset = this.container.querySelector('#btn-reset-transform');
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        ent.setPosition(0, 0, 0);
        ent.setEulerAngles(0, 0, 0);
        ent.setLocalScale(1, 1, 1);
        this.syncTransformInputs();
        this.editor.events.emit('entity:transformed', ent);
      });
    }

    // Transform inputs
    const posInputs = ['pos-x', 'pos-y', 'pos-z'].map(id => this.container.querySelector(`#${id}`)).filter(Boolean);
    const rotInputs = ['rot-x', 'rot-y', 'rot-z'].map(id => this.container.querySelector(`#${id}`)).filter(Boolean);
    const scaleInputs = ['scale-x', 'scale-y', 'scale-z'].map(id => this.container.querySelector(`#${id}`)).filter(Boolean);

    const updatePos = () => {
      ent.setPosition(parseFloat(posInputs[0].value) || 0, parseFloat(posInputs[1].value) || 0, parseFloat(posInputs[2].value) || 0);
      this.editor.events.emit('entity:transformed', ent);
    };
    const updateRot = () => {
      ent.setEulerAngles(parseFloat(rotInputs[0].value) || 0, parseFloat(rotInputs[1].value) || 0, parseFloat(rotInputs[2].value) || 0);
      this.editor.events.emit('entity:transformed', ent);
    };
    const updateScale = () => {
      ent.setLocalScale(parseFloat(scaleInputs[0].value) || 1, parseFloat(scaleInputs[1].value) || 1, parseFloat(scaleInputs[2].value) || 1);
      this.editor.events.emit('entity:transformed', ent);
    };

    posInputs.forEach(inp => inp.addEventListener('input', updatePos));
    rotInputs.forEach(inp => inp.addEventListener('input', updateRot));
    scaleInputs.forEach(inp => inp.addEventListener('input', updateScale));

    // Add Component Select
    const compSelect = this.container.querySelector('#add-component-select');
    if (compSelect) {
      compSelect.addEventListener('change', () => {
        const type = compSelect.value;
        if (type) {
          this.editor.addComponent(ent, type);
          compSelect.value = '';
        }
      });
    }
  }

  syncTransformInputs() {
    const ent = this.currentEntity;
    if (!ent) return;

    const pos = ent.getPosition();
    const rot = ent.getEulerAngles();
    const scale = ent.getLocalScale();

    const setVal = (id, val) => {
      const el = this.container.querySelector(`#${id}`);
      if (el && document.activeElement !== el) {
        el.value = (Math.round(val * 100) / 100).toFixed(2);
      }
    };

    setVal('pos-x', pos.x); setVal('pos-y', pos.y); setVal('pos-z', pos.z);
    setVal('rot-x', rot.x); setVal('rot-y', rot.y); setVal('rot-z', rot.z);
    setVal('scale-x', scale.x); setVal('scale-y', scale.y); setVal('scale-z', scale.z);
  }

  renderComponents() {
    const ent = this.currentEntity;
    const stack = this.container.querySelector('#components-stack');
    if (!ent || !stack) return;

    stack.innerHTML = '';

    // Render Component Card & Material Preview
    if (ent.render) {
      const card = document.createElement('div');
      card.className = 'inspector-section';
      card.innerHTML = `
        <div class="inspector-section-header">
          <span>📦 Render (Mesh)</span>
          <button class="btn btn-remove-comp" data-comp="render" style="padding: 1px 6px; font-size: 10px; color: #ef4444;">✕</button>
        </div>
        <div class="inspector-section-content">
          <div class="prop-row">
            <span class="prop-label">Type</span>
            <select class="select-input" id="render-type-select">
              ${['box', 'sphere', 'capsule', 'cylinder', 'cone', 'plane'].map(t => `<option value="${t}" ${ent.render.type === t ? 'selected' : ''}>${t}</option>`).join('')}
            </select>
          </div>
          <div class="prop-row">
            <span class="prop-label">Cast Shadows</span>
            <input type="checkbox" id="render-cast-shadows" ${ent.render.castShadows ? 'checked' : ''}>
          </div>

          <!-- PBR Material Preview -->
          <div style="margin-top: 8px; border-top: 1px solid var(--border-subtle); padding-top: 8px;">
            <div style="display: flex; gap: 10px; align-items: center; margin-bottom: 8px;">
              <canvas id="mat-preview-canvas" width="64" height="64" style="width: 64px; height: 64px; border-radius: 8px; border: 1px solid var(--border-highlight); background: #000; flex-shrink: 0;"></canvas>
              <div>
                <div style="font-weight: 600; font-size: 11px; color: var(--text-primary);">PBR Material</div>
                <div style="font-size: 10px; color: var(--text-muted);">Physical Shading</div>
              </div>
            </div>

            <div class="prop-row">
              <span class="prop-label">Diffuse Color</span>
              <input type="color" id="mat-diffuse-color" value="#ff9900" style="background: none; border: none; width: 40px; height: 24px; cursor: pointer;">
            </div>

            <div class="prop-row">
              <span class="prop-label">Metalness</span>
              <input type="range" min="0" max="1" step="0.05" id="mat-metalness" value="0.5" class="text-input">
            </div>

            <div class="prop-row">
              <span class="prop-label">Roughness</span>
              <input type="range" min="0" max="1" step="0.05" id="mat-roughness" value="0.3" class="text-input">
            </div>
          </div>
        </div>
      `;

      card.querySelector('#render-type-select').addEventListener('change', (e) => {
        ent.render.type = e.target.value;
      });
      card.querySelector('#render-cast-shadows').addEventListener('change', (e) => {
        ent.render.castShadows = e.target.checked;
      });
      card.querySelector('.btn-remove-comp').addEventListener('click', () => {
        this.editor.removeComponent(ent, 'render');
      });

      stack.appendChild(card);

      setTimeout(() => {
        const previewCanvas = card.querySelector('#mat-preview-canvas');
        if (previewCanvas) {
          this.matPreview = new MaterialPreviewRenderer(previewCanvas);
          const diffuseInp = card.querySelector('#mat-diffuse-color');
          const metalInp = card.querySelector('#mat-metalness');
          const roughInp = card.querySelector('#mat-roughness');

          const updateMat = () => {
            const hex = diffuseInp.value;
            const r = parseInt(hex.slice(1, 3), 16) / 255;
            const g = parseInt(hex.slice(3, 5), 16) / 255;
            const b = parseInt(hex.slice(5, 7), 16) / 255;

            const metalness = parseFloat(metalInp.value);
            const roughness = parseFloat(roughInp.value);

            if (this.matPreview) {
              this.matPreview.updateMaterial({ diffuse: [r, g, b], metalness, roughness });
            }

            if (ent.render && ent.render.material) {
              ent.render.material.diffuse = new pc.Color(r, g, b);
              ent.render.material.metalness = metalness;
              ent.render.material.roughness = roughness;
              ent.render.material.update();
            }
          };

          diffuseInp.addEventListener('input', updateMat);
          metalInp.addEventListener('input', updateMat);
          roughInp.addEventListener('input', updateMat);
        }
      }, 50);
    }

    // Light Component Card
    if (ent.light) {
      const card = document.createElement('div');
      card.className = 'inspector-section';
      card.innerHTML = `
        <div class="inspector-section-header">
          <span>💡 Light</span>
          <button class="btn btn-remove-comp" data-comp="light" style="padding: 1px 6px; font-size: 10px; color: #ef4444;">✕</button>
        </div>
        <div class="inspector-section-content">
          <div class="prop-row">
            <span class="prop-label">Type</span>
            <select class="select-input" id="light-type-select">
              <option value="point" ${ent.light.type === 'point' ? 'selected' : ''}>Point</option>
              <option value="directional" ${ent.light.type === 'directional' ? 'selected' : ''}>Directional</option>
              <option value="spot" ${ent.light.type === 'spot' ? 'selected' : ''}>Spot</option>
            </select>
          </div>
          <div class="prop-row">
            <span class="prop-label">Intensity</span>
            <input type="range" min="0" max="10" step="0.1" class="text-input" id="light-intensity" value="${ent.light.intensity}">
          </div>
          <div class="prop-row">
            <span class="prop-label">Range</span>
            <input type="number" min="0.1" max="100" class="text-input" id="light-range" value="${ent.light.range}">
          </div>
        </div>
      `;
      card.querySelector('#light-intensity').addEventListener('input', (e) => {
        ent.light.intensity = parseFloat(e.target.value);
      });
      card.querySelector('#light-range').addEventListener('input', (e) => {
        ent.light.range = parseFloat(e.target.value);
      });
      card.querySelector('.btn-remove-comp').addEventListener('click', () => {
        this.editor.removeComponent(ent, 'light');
      });
      stack.appendChild(card);
    }

    // Camera Component Card
    if (ent.camera) {
      const card = document.createElement('div');
      card.className = 'inspector-section';
      card.innerHTML = `
        <div class="inspector-section-header">
          <span>🎥 Camera</span>
          <button class="btn btn-remove-comp" data-comp="camera" style="padding: 1px 6px; font-size: 10px; color: #ef4444;">✕</button>
        </div>
        <div class="inspector-section-content">
          <div class="prop-row">
            <span class="prop-label">FOV</span>
            <input type="range" min="30" max="120" step="1" class="text-input" id="cam-fov" value="${ent.camera.fov || 60}">
          </div>
          <div class="prop-row">
            <span class="prop-label">Near Clip</span>
            <input type="number" step="0.01" min="0.01" class="text-input" id="cam-near" value="${ent.camera.nearClip || 0.1}">
          </div>
          <div class="prop-row">
            <span class="prop-label">Far Clip</span>
            <input type="number" step="10" min="10" class="text-input" id="cam-far" value="${ent.camera.farClip || 1000}">
          </div>
        </div>
      `;
      card.querySelector('#cam-fov').addEventListener('input', (e) => {
        ent.camera.fov = parseFloat(e.target.value);
      });
      card.querySelector('#cam-near').addEventListener('change', (e) => {
        ent.camera.nearClip = parseFloat(e.target.value);
      });
      card.querySelector('#cam-far').addEventListener('change', (e) => {
        ent.camera.farClip = parseFloat(e.target.value);
      });
      card.querySelector('.btn-remove-comp').addEventListener('click', () => {
        this.editor.removeComponent(ent, 'camera');
      });
      stack.appendChild(card);
    }

    // Collision Component Card
    if (ent.collision) {
      const card = document.createElement('div');
      card.className = 'inspector-section';
      card.innerHTML = `
        <div class="inspector-section-header">
          <span>🎯 Collision</span>
          <button class="btn btn-remove-comp" data-comp="collision" style="padding: 1px 6px; font-size: 10px; color: #ef4444;">✕</button>
        </div>
        <div class="inspector-section-content">
          <div class="prop-row">
            <span class="prop-label">Shape</span>
            <select class="select-input" id="collision-type-select">
              <option value="box" ${ent.collision.type === 'box' ? 'selected' : ''}>Box</option>
              <option value="sphere" ${ent.collision.type === 'sphere' ? 'selected' : ''}>Sphere</option>
              <option value="capsule" ${ent.collision.type === 'capsule' ? 'selected' : ''}>Capsule</option>
              <option value="cylinder" ${ent.collision.type === 'cylinder' ? 'selected' : ''}>Cylinder</option>
              <option value="mesh" ${ent.collision.type === 'mesh' ? 'selected' : ''}>Mesh</option>
            </select>
          </div>
        </div>
      `;
      card.querySelector('#collision-type-select').addEventListener('change', (e) => {
        ent.collision.type = e.target.value;
      });
      card.querySelector('.btn-remove-comp').addEventListener('click', () => {
        this.editor.removeComponent(ent, 'collision');
      });
      stack.appendChild(card);
    }

    // Rigidbody Physics Card
    if (ent.rigidbody) {
      const card = document.createElement('div');
      card.className = 'inspector-section';
      card.innerHTML = `
        <div class="inspector-section-header">
          <span>⚙️ Rigidbody Physics</span>
          <button class="btn btn-remove-comp" data-comp="rigidbody" style="padding: 1px 6px; font-size: 10px; color: #ef4444;">✕</button>
        </div>
        <div class="inspector-section-content">
          <div class="prop-row">
            <span class="prop-label">Body Type</span>
            <select class="select-input" id="rigidbody-type-select">
              <option value="static" ${ent.rigidbody.type === 'static' ? 'selected' : ''}>Static</option>
              <option value="dynamic" ${ent.rigidbody.type === 'dynamic' ? 'selected' : ''}>Dynamic</option>
              <option value="kinematic" ${ent.rigidbody.type === 'kinematic' ? 'selected' : ''}>Kinematic</option>
            </select>
          </div>
          <div class="prop-row">
            <span class="prop-label">Mass (kg)</span>
            <input type="number" min="0.1" step="0.5" class="text-input" id="rigidbody-mass" value="${ent.rigidbody.mass || 1}">
          </div>
        </div>
      `;
      card.querySelector('#rigidbody-type-select').addEventListener('change', (e) => {
        ent.rigidbody.type = e.target.value;
      });
      card.querySelector('#rigidbody-mass').addEventListener('change', (e) => {
        ent.rigidbody.mass = parseFloat(e.target.value);
      });
      card.querySelector('.btn-remove-comp').addEventListener('click', () => {
        this.editor.removeComponent(ent, 'rigidbody');
      });
      stack.appendChild(card);
    }

    // Script Behavior Component Card
    if (ent.script) {
      const card = document.createElement('div');
      card.className = 'inspector-section';
      card.innerHTML = `
        <div class="inspector-section-header">
          <span>📜 Script Behavior</span>
          <button class="btn btn-remove-comp" data-comp="script" style="padding: 1px 6px; font-size: 10px; color: #ef4444;">✕</button>
        </div>
        <div class="inspector-section-content" style="display: flex; flex-direction: column; gap: 6px;">
          <button class="btn btn-primary" id="btn-open-code-script" style="font-size: 11px; padding: 4px;">
            📝 Edit Attached Script
          </button>
        </div>
      `;
      card.querySelector('#btn-open-code-script').addEventListener('click', () => {
        if (this.codeEditor) {
          this.codeEditor.open('customScript.js');
        }
      });
      card.querySelector('.btn-remove-comp').addEventListener('click', () => {
        this.editor.removeComponent(ent, 'script');
      });
      stack.appendChild(card);
    }
  }
}
