import { showToast } from './toast.js';

/**
 * Left Tool Strip
 * Handles transform mode switches, snapping, coordinate space, and framing.
 */
export class ToolStrip {
  constructor(container, editor) {
    this.container = container;
    this.editor = editor;
    this.editor.toolstrip = this;
    this.currentMode = 'translate';
    this.coordSpace = 'world';
    this.snapEnabled = false;
    this.posSnapIncrement = 1.0;
    this.rotSnapIncrement = 15.0;
    this.physicsDebugEnabled = false;

    this.render();
    this.bindEvents();
  }

  render() {
    this.container.innerHTML = `
      <button class="btn btn-icon" id="tool-select" title="Select (Q)">⛶</button>
      <button class="btn btn-icon active" id="tool-translate" title="Translate (W)">✥</button>
      <button class="btn btn-icon" id="tool-rotate" title="Rotate (E)">↻</button>
      <button class="btn btn-icon" id="tool-scale" title="Scale (R)">⤢</button>

      <div style="width: 24px; height: 1px; background: var(--border-subtle); margin: 6px 0;"></div>

      <button class="btn btn-icon" id="tool-space" title="Toggle Coordinate Space (World / Local)" style="font-size: 10px; font-weight: 700;">WLD</button>
      <div style="position: relative;">
        <button class="btn btn-icon" id="tool-snap" title="Toggle Grid Snapping (Right-click or hold for step settings)" style="font-size: 11px;">🧲</button>
      </div>
      <button class="btn btn-icon" id="tool-frame" title="Frame Selection (F)" style="font-size: 11px;">🎯</button>
      <button class="btn btn-icon" id="tool-grid" title="Toggle 3D Floor Grid" style="font-size: 11px;">#</button>
      <button class="btn btn-icon" id="tool-physics-debug" title="Toggle Real-Time Physics Collider Wireframe Debugger" style="font-size: 11px; color: #22c55e;">🟢</button>

      <div style="margin-top: auto; display: flex; flex-direction: column; gap: 6px; align-items: center;">
        <button class="btn btn-icon" id="tool-console" title="Toggle Console & Logs" style="font-size: 11px;">📋</button>
        <button class="btn btn-icon" id="tool-ai" title="Toggle Makulu AI Copilot" style="background: rgba(255,102,0,0.15); border-color: var(--accent-orange); color: var(--accent-orange);">✨</button>
      </div>
    `;
  }

  bindEvents() {
    const gizmoBtns = {
      'tool-select': 'none',
      'tool-translate': 'translate',
      'tool-rotate': 'rotate',
      'tool-scale': 'scale'
    };

    Object.entries(gizmoBtns).forEach(([id, mode]) => {
      const btn = this.container.querySelector(`#${id}`);
      btn.addEventListener('click', () => {
        this.setTransformMode(mode);
      });
    });

    // Keyboard shortcuts Q, W, E, R, F
    window.addEventListener('keydown', (e) => {
      // Don't trigger if typing in an input or simulation is running
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;
      if (this.editor.isPlaying) return;

      const k = e.key.toLowerCase();
      if (k === 'q') this.setTransformMode('none');
      if (k === 'w') this.setTransformMode('translate');
      if (k === 'e') this.setTransformMode('rotate');
      if (k === 'r') this.setTransformMode('scale');
      if (k === 'f') {
        const active = this.editor.selection.getActive();
        if (active && this.editor.runtime) {
          this.editor.runtime.editorCamera.frameEntity(active);
        }
      }
    });

    // World / Local toggle
    const spaceBtn = this.container.querySelector('#tool-space');
    spaceBtn.addEventListener('click', () => {
      this.coordSpace = this.coordSpace === 'world' ? 'local' : 'world';
      spaceBtn.textContent = this.coordSpace === 'world' ? 'WLD' : 'LOC';
      if (this.editor.runtime && this.editor.runtime.gizmoManager) {
        this.editor.runtime.gizmoManager.setCoordSpace(this.coordSpace);
      }
      showToast(`Coordinate Space: ${this.coordSpace === 'world' ? '🌐 World' : '📦 Local'}`, 'info');
    });

    // Snapping toggle & context step picker
    const snapBtn = this.container.querySelector('#tool-snap');
    snapBtn.addEventListener('click', () => {
      this.snapEnabled = !this.snapEnabled;
      snapBtn.classList.toggle('active', this.snapEnabled);
      if (this.editor.runtime && this.editor.runtime.gizmoManager) {
        this.editor.runtime.gizmoManager.setSnap(this.snapEnabled, this.posSnapIncrement);
      }
      showToast(`Grid Snapping: ${this.snapEnabled ? `🧲 ON (${this.posSnapIncrement}m / ${this.rotSnapIncrement}°)` : 'OFF'}`, this.snapEnabled ? 'success' : 'info');
    });

    snapBtn.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      const posVal = prompt('Enter position snap increment (0.1, 0.25, 0.5, 1.0, 2.0):', this.posSnapIncrement);
      const rotVal = prompt('Enter rotation snap angle (15, 30, 45, 90):', this.rotSnapIncrement);
      if (posVal && !isNaN(parseFloat(posVal))) {
        this.posSnapIncrement = parseFloat(posVal);
      }
      if (rotVal && !isNaN(parseFloat(rotVal))) {
        this.rotSnapIncrement = parseFloat(rotVal);
      }
      this.snapEnabled = true;
      snapBtn.classList.add('active');
      if (this.editor.runtime && this.editor.runtime.gizmoManager) {
        this.editor.runtime.gizmoManager.setSnap(true, this.posSnapIncrement);
      }
      showToast(`🧲 Snapping set to ${this.posSnapIncrement}m / ${this.rotSnapIncrement}°!`, 'success');
    });

    // Physics Wireframe Debugger Toggle
    const physDebugBtn = this.container.querySelector('#tool-physics-debug');
    physDebugBtn.addEventListener('click', () => {
      this.physicsDebugEnabled = !this.physicsDebugEnabled;
      physDebugBtn.classList.toggle('active', this.physicsDebugEnabled);
      if (this.editor.runtime && this.editor.runtime.visualHelpers) {
        this.editor.runtime.visualHelpers.setPhysicsDebugAll(this.physicsDebugEnabled);
      }
      showToast(`🟢 Physics Collider Debug Wireframes: ${this.physicsDebugEnabled ? 'ACTIVE (All Colliders Visible)' : 'OFF'}`, this.physicsDebugEnabled ? 'success' : 'info');
    });

    // Frame button
    const frameBtn = this.container.querySelector('#tool-frame');
    frameBtn.addEventListener('click', () => {
      const active = this.editor.selection.getActive();
      if (active && this.editor.runtime) {
        this.editor.runtime.editorCamera.frameEntity(active);
        showToast(`🎯 Framed "${active.name}"`, 'success');
      } else {
        showToast('Select an entity to frame first', 'warn');
      }
    });

    // Floor Grid toggle
    const gridBtn = this.container.querySelector('#tool-grid');
    gridBtn.addEventListener('click', () => {
      if (this.editor.runtime && this.editor.runtime.grid) {
        const next = !this.editor.runtime.grid.visible;
        this.editor.runtime.grid.setVisible(next);
        gridBtn.classList.toggle('active', next);
        showToast(`Floor Grid: ${next ? 'Visible' : 'Hidden'}`, 'info');
      }
    });

    // Console Drawer Toggle
    const consoleBtn = this.container.querySelector('#tool-console');
    consoleBtn.addEventListener('click', () => {
      this.editor.events.emit('console:toggle');
    });

    // AI Copilot Toggle
    const aiBtn = this.container.querySelector('#tool-ai');
    aiBtn.addEventListener('click', () => {
      this.editor.events.emit('ai:toggle');
      showToast('✨ Makulu AI Copilot toggled', 'info');
    });
  }

  setTransformMode(mode) {
    this.currentMode = mode;
    ['tool-select', 'tool-translate', 'tool-rotate', 'tool-scale'].forEach(id => {
      this.container.querySelector(`#${id}`).classList.remove('active');
    });

    const activeMap = {
      'none': 'tool-select',
      'translate': 'tool-translate',
      'rotate': 'tool-rotate',
      'scale': 'tool-scale'
    };
    if (activeMap[mode]) {
      this.container.querySelector(`#${activeMap[mode]}`).classList.add('active');
    }

    if (this.editor.runtime && this.editor.runtime.gizmoManager) {
      this.editor.runtime.gizmoManager.setMode(mode);
    }

    const toastMap = {
      'none': '⛶ Selection Tool Active',
      'translate': '✥ Translate Gizmo Active (W)',
      'rotate': '↻ Rotate Gizmo Active (E)',
      'scale': '⤢ Scale Gizmo Active (R)'
    };
    showToast(toastMap[mode] || mode, 'info');
  }
}
