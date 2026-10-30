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
    this.shadingMode = 'lit';
    this.statsVisible = false;
    this._statsInterval = null;

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

      <div style="width: 24px; height: 1px; background: var(--border-subtle); margin: 6px 0;"></div>

      <!-- Shading Mode Switcher (Lit / Wireframe / Unlit) -->
      <button class="btn btn-icon" id="tool-shading-mode" title="Cycle Shading Mode (Lit / Wireframe / Unlit)" style="font-size: 10px; font-weight: 700; color: #38bdf8;">LIT</button>

      <!-- Viewport Performance & Stats Overlay Toggle -->
      <button class="btn btn-icon" id="tool-perf-stats" title="Toggle Performance & Scene Stats Profiler (FPS, Draw Calls, Polys)" style="font-size: 11px; color: #fbbf24;">📊</button>

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

    // Shading Mode Switcher
    const shadingBtn = this.container.querySelector('#tool-shading-mode');
    shadingBtn.addEventListener('click', () => {
      const modes = ['lit', 'wireframe', 'unlit'];
      const nextIdx = (modes.indexOf(this.shadingMode) + 1) % modes.length;
      this.shadingMode = modes[nextIdx];
      shadingBtn.textContent = this.shadingMode.toUpperCase();

      if (this.editor.runtime && typeof this.editor.runtime.setShadingMode === 'function') {
        this.editor.runtime.setShadingMode(this.shadingMode);
      }
      showToast(`Shading Mode: ${this.shadingMode === 'lit' ? '💡 Full Lit PBR' : this.shadingMode === 'wireframe' ? '🕸️ Wireframe' : '🎨 Unlit Flat'}`, 'info');
    });

    // Performance & Stats Profiler Toggle
    const statsBtn = this.container.querySelector('#tool-perf-stats');
    statsBtn.addEventListener('click', () => {
      this.togglePerfStats();
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

  togglePerfStats() {
    this.statsVisible = !this.statsVisible;
    const btn = this.container.querySelector('#tool-perf-stats');
    if (btn) btn.classList.toggle('active', this.statsVisible);

    let overlay = document.getElementById('viewport-stats-overlay');
    if (!this.statsVisible) {
      if (overlay) overlay.style.display = 'none';
      if (this._statsInterval) {
        clearInterval(this._statsInterval);
        this._statsInterval = null;
      }
      showToast('Scene Statistics Overlay: Hidden', 'info');
      return;
    }

    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'viewport-stats-overlay';
      overlay.style.cssText = `
        position: absolute;
        top: 14px;
        left: 14px;
        background: rgba(15, 23, 42, 0.88);
        border: 1px solid rgba(251, 191, 36, 0.4);
        border-radius: 8px;
        padding: 8px 12px;
        font-family: var(--font-mono, monospace);
        font-size: 11px;
        color: #f8fafc;
        pointer-events: none;
        z-index: 40;
        backdrop-filter: blur(4px);
        min-width: 140px;
        line-height: 1.5;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
      `;
      const vp = document.getElementById('viewport-container') || document.body;
      vp.appendChild(overlay);
    }

    overlay.style.display = 'block';

    const updateStats = () => {
      if (!this.statsVisible || !overlay) return;
      let fps = 60, drawCalls = 1, triangles = 250, entities = 1;
      if (this.editor.runtime && typeof this.editor.runtime.getSceneStats === 'function') {
        const s = this.editor.runtime.getSceneStats();
        fps = s.fps;
        drawCalls = s.drawCalls;
        triangles = s.triangles;
        entities = s.entities;
      }
      overlay.innerHTML = `
        <div style="font-weight: 700; color: #fbbf24; margin-bottom: 2px; font-size: 10px; text-transform: uppercase;">📊 Viewport Profiler</div>
        <div><span style="color: #94a3b8;">FPS:</span> <b style="color: ${fps >= 50 ? '#34d399' : fps >= 30 ? '#facc15' : '#f87171'};">${fps}</b></div>
        <div><span style="color: #94a3b8;">Draw Calls:</span> <b>${drawCalls}</b></div>
        <div><span style="color: #94a3b8;">Triangles:</span> <b>${triangles.toLocaleString()}</b></div>
        <div><span style="color: #94a3b8;">Entities:</span> <b>${entities}</b></div>
      `;
    };

    updateStats();
    if (!this._statsInterval) {
      this._statsInterval = setInterval(updateStats, 500);
    }
    showToast('📊 Viewport Profiler Overlay: Active', 'success');
  }
}
