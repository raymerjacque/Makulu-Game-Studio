import { showToast } from './toast.js';

/**
 * 2D Screen UI / HUD Designer Modal
 * Visual configurator for Health Bar, Score Counter, Crosshair, and Game Over overlays.
 */
export class HUDModal {
  constructor(editor) {
    this.editor = editor;
    this.container = null;
    this.createModal();
  }

  createModal() {
    this.container = document.createElement('div');
    this.container.className = 'modal-backdrop';
    this.container.id = 'hud-modal';
    this.container.style.display = 'none';

    this.container.innerHTML = `
      <div class="modal-dialog" style="max-width: 600px;">
        <div class="modal-header">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 18px;">📺</span>
            <span style="font-weight: 700; font-size: 14px;">2D Screen UI & HUD Designer</span>
          </div>
          <button class="btn btn-icon btn-close-modal" id="hud-close">✕</button>
        </div>

        <div class="modal-body" style="display: flex; flex-direction: column; gap: 16px;">
          <p style="font-size: 11px; color: var(--text-muted); margin: 0;">
            Configure 2D screen UI overlays (Health Bar, Score Counter, Crosshair, Game Over Screen) for live simulation and compiled standalone games.
          </p>

          <!-- Health Bar Config -->
          <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 12px; display: flex; flex-direction: column; gap: 10px;">
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <span style="font-weight: 700; font-size: 12px; color: #ef4444;">❤️ Health Bar Overlay</span>
              <label class="toggle-switch">
                <input type="checkbox" id="hud-health-enabled" checked>
                <span class="toggle-slider"></span>
              </label>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 11px;">
              <div>
                <label style="color: var(--text-muted); display: block; margin-bottom: 4px;">Health Bar Label</label>
                <input type="text" id="hud-health-label" class="text-input" value="HP">
              </div>
              <div>
                <label style="color: var(--text-muted); display: block; margin-bottom: 4px;">Max Health Value</label>
                <input type="number" id="hud-health-max" class="text-input" value="100" min="1" max="1000">
              </div>
            </div>
            <div style="display: flex; align-items: center; gap: 10px; font-size: 11px;">
              <span style="color: var(--text-muted);">Fill Color:</span>
              <input type="color" id="hud-health-color" value="#ef4444" style="border: none; background: none; width: 32px; height: 24px; cursor: pointer;">
            </div>
          </div>

          <!-- Score Counter Config -->
          <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 12px; display: flex; flex-direction: column; gap: 10px;">
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <span style="font-weight: 700; font-size: 12px; color: #eab308;">⭐ Score Counter Overlay</span>
              <label class="toggle-switch">
                <input type="checkbox" id="hud-score-enabled" checked>
                <span class="toggle-slider"></span>
              </label>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 11px;">
              <div>
                <label style="color: var(--text-muted); display: block; margin-bottom: 4px;">Score Prefix Label</label>
                <input type="text" id="hud-score-label" class="text-input" value="Score:">
              </div>
              <div>
                <label style="color: var(--text-muted); display: block; margin-bottom: 4px;">Initial Score Value</label>
                <input type="number" id="hud-score-initial" class="text-input" value="0">
              </div>
            </div>
          </div>

          <!-- Level Victory Screen Config -->
          <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 12px; display: flex; flex-direction: column; gap: 10px;">
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <span style="font-weight: 700; font-size: 12px; color: #10b981;">🏆 Victory / Level Complete Overlay</span>
              <label class="toggle-switch">
                <input type="checkbox" id="hud-victory-enabled" checked>
                <span class="toggle-slider"></span>
              </label>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 11px;">
              <div>
                <label style="color: var(--text-muted); display: block; margin-bottom: 4px;">Victory Title</label>
                <input type="text" id="hud-victory-title" class="text-input" value="🏆 VICTORY!">
              </div>
              <div>
                <label style="color: var(--text-muted); display: block; margin-bottom: 4px;">Victory Message</label>
                <input type="text" id="hud-victory-msg" class="text-input" value="Congratulations! You completed the level!">
              </div>
            </div>
          </div>

          <!-- Key Inventory Overlay Config -->
          <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 12px; display: flex; flex-direction: column; gap: 10px;">
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <span style="font-weight: 700; font-size: 12px; color: #facc15;">🔑 Key Inventory Display</span>
              <label class="toggle-switch">
                <input type="checkbox" id="hud-keys-enabled" checked>
                <span class="toggle-slider"></span>
              </label>
            </div>
            <div style="font-size: 11px; color: var(--text-muted);">
              Displays active key items (e.g. Gold Key, Red Key) collected by the player on screen.
            </div>
          </div>

          <!-- Jetpack Fuel Gauge Config -->
          <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 12px; display: flex; flex-direction: column; gap: 10px;">
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <span style="font-weight: 700; font-size: 12px; color: #38bdf8;">🚀 Jetpack Fuel Gauge Overlay</span>
              <label class="toggle-switch">
                <input type="checkbox" id="hud-jetpack-enabled" checked>
                <span class="toggle-slider"></span>
              </label>
            </div>
            <div style="font-size: 11px; color: var(--text-muted);">
              Displays live jetpack boost fuel gauge for characters equipped with jetpack behavior.
            </div>
          </div>

          <!-- Crosshair Config -->
          <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 12px; display: flex; flex-direction: column; gap: 10px;">
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <span style="font-weight: 700; font-size: 12px; color: #00e5ff;">🎯 Center Screen Crosshair</span>
              <label class="toggle-switch">
                <input type="checkbox" id="hud-crosshair-enabled" checked>
                <span class="toggle-slider"></span>
              </label>
            </div>
            <div style="display: flex; align-items: center; gap: 12px; font-size: 11px;">
              <span style="color: var(--text-muted);">Style:</span>
              <select id="hud-crosshair-style" class="select-input" style="width: 140px;">
                <option value="dot">● Dot</option>
                <option value="cross">┼ Crosshair</option>
                <option value="circle">◯ Circle</option>
              </select>
            </div>
          </div>

          <!-- Game Over Screen Config -->
          <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 12px; display: flex; flex-direction: column; gap: 10px;">
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <span style="font-weight: 700; font-size: 12px; color: #c084fc;">💀 Game Over Screen Overlay</span>
              <label class="toggle-switch">
                <input type="checkbox" id="hud-gameover-enabled" checked>
                <span class="toggle-slider"></span>
              </label>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 11px;">
              <div>
                <label style="color: var(--text-muted); display: block; margin-bottom: 4px;">Game Over Title</label>
                <input type="text" id="hud-gameover-title" class="text-input" value="GAME OVER">
              </div>
              <div>
                <label style="color: var(--text-muted); display: block; margin-bottom: 4px;">Subtitle / Message</label>
                <input type="text" id="hud-gameover-msg" class="text-input" value="Your health reached 0. Press Restart to try again.">
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer" style="display: flex; justify-content: flex-end; gap: 8px;">
          <button class="btn" id="hud-cancel">Cancel</button>
          <button class="btn btn-primary" id="hud-save">Save HUD Config</button>
        </div>
      </div>
    `;

    document.body.appendChild(this.container);
    this.bindEvents();
  }

  bindEvents() {
    this.container.querySelector('#hud-close').addEventListener('click', () => this.close());
    this.container.querySelector('#hud-cancel').addEventListener('click', () => this.close());

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.container && this.container.style.display === 'flex') {
        this.close();
      }
    });

    this.container.querySelector('#hud-save').addEventListener('click', () => {
      const config = {
        health: {
          enabled: this.container.querySelector('#hud-health-enabled').checked,
          label: this.container.querySelector('#hud-health-label').value.trim() || 'HP',
          max: parseInt(this.container.querySelector('#hud-health-max').value, 10) || 100,
          color: this.container.querySelector('#hud-health-color').value
        },
        score: {
          enabled: this.container.querySelector('#hud-score-enabled').checked,
          label: this.container.querySelector('#hud-score-label').value.trim() || 'Score:',
          initial: parseInt(this.container.querySelector('#hud-score-initial').value, 10) || 0
        },
        crosshair: {
          enabled: this.container.querySelector('#hud-crosshair-enabled').checked,
          style: this.container.querySelector('#hud-crosshair-style').value
        },
        keys: {
          enabled: this.container.querySelector('#hud-keys-enabled').checked
        },
        jetpack: {
          enabled: this.container.querySelector('#hud-jetpack-enabled').checked
        },
        gameOver: {
          enabled: this.container.querySelector('#hud-gameover-enabled').checked,
          title: this.container.querySelector('#hud-gameover-title').value.trim() || 'GAME OVER',
          message: this.container.querySelector('#hud-gameover-msg').value.trim() || 'Your health reached 0.'
        },
        victory: {
          enabled: this.container.querySelector('#hud-victory-enabled').checked,
          title: this.container.querySelector('#hud-victory-title').value.trim() || '🏆 VICTORY!',
          message: this.container.querySelector('#hud-victory-msg').value.trim() || 'Congratulations! You completed the level!'
        }
      };

      this.editor.hudConfig = config;
      this.editor.events.emit('hud:config:changed', config);
      showToast('📺 2D Screen HUD Designer configuration saved!', 'success');
      this.close();
    });
  }

  open() {
    const config = this.editor.hudConfig || {
      health: { enabled: true, label: 'HP', max: 100, color: '#ef4444' },
      score: { enabled: true, label: 'Score:', initial: 0 },
      crosshair: { enabled: true, style: 'dot' },
      gameOver: { enabled: true, title: 'GAME OVER', message: 'Your health reached 0.' }
    };

    if (config.health) {
      this.container.querySelector('#hud-health-enabled').checked = config.health.enabled !== false;
      this.container.querySelector('#hud-health-label').value = config.health.label || 'HP';
      this.container.querySelector('#hud-health-max').value = config.health.max || 100;
      this.container.querySelector('#hud-health-color').value = config.health.color || '#ef4444';
    }

    if (config.score) {
      this.container.querySelector('#hud-score-enabled').checked = config.score.enabled !== false;
      this.container.querySelector('#hud-score-label').value = config.score.label || 'Score:';
      this.container.querySelector('#hud-score-initial').value = config.score.initial !== undefined ? config.score.initial : 0;
    }

    if (config.keys) {
      this.container.querySelector('#hud-keys-enabled').checked = config.keys.enabled !== false;
    }

    if (config.jetpack) {
      this.container.querySelector('#hud-jetpack-enabled').checked = config.jetpack.enabled !== false;
    }

    if (config.crosshair) {
      this.container.querySelector('#hud-crosshair-enabled').checked = config.crosshair.enabled !== false;
      this.container.querySelector('#hud-crosshair-style').value = config.crosshair.style || 'dot';
    }

    if (config.gameOver) {
      this.container.querySelector('#hud-gameover-enabled').checked = config.gameOver.enabled !== false;
      this.container.querySelector('#hud-gameover-title').value = config.gameOver.title || 'GAME OVER';
      this.container.querySelector('#hud-gameover-msg').value = config.gameOver.message || 'Your health reached 0.';
    }

    if (config.victory) {
      this.container.querySelector('#hud-victory-enabled').checked = config.victory.enabled !== false;
      this.container.querySelector('#hud-victory-title').value = config.victory.title || '🏆 VICTORY!';
      this.container.querySelector('#hud-victory-msg').value = config.victory.message || 'Congratulations! You completed the level!';
    }

    this.container.style.display = 'flex';
  }

  close() {
    this.container.style.display = 'none';
  }
}
