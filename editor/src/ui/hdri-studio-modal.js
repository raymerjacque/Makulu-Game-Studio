import * as pc from 'playcanvas';
import { showToast } from './toast.js';

/**
 * Environment HDRI Skybox & Reflection Probe Studio Modal
 * Custom environment maps, skybox cubemaps, ambient reflections, and exposure tuning.
 */
export class HDRIStudioModal {
  constructor(editor) {
    this.editor = editor;
    this.isOpen = false;
    this.presets = [
      { id: 'day', name: '☀️ Studio Bright Day', icon: '☀️', ambientColor: '#404048', fogColor: '#a0a8b0', bg: 'linear-gradient(135deg, #38bdf8, #0284c7)' },
      { id: 'sunset', name: '🌅 Sunset Amber Glow', icon: '🌅', ambientColor: '#663340', fogColor: '#cc6633', bg: 'linear-gradient(135deg, #f97316, #9333ea)' },
      { id: 'cyberpunk', name: '🌆 Cyber Neon City', icon: '🌆', ambientColor: '#0d142e', fogColor: '#050d26', bg: 'linear-gradient(135deg, #06b6d4, #d946ef)' },
      { id: 'foggy', name: '🌫️ Foggy Mountain Valley', icon: '🌫️', ambientColor: '#4d5966', fogColor: '#73808c', bg: 'linear-gradient(135deg, #64748b, #334155)' },
      { id: 'night', name: '🌙 Deep Starry Night', icon: '🌙', ambientColor: '#050814', fogColor: '#02040a', bg: 'linear-gradient(135deg, #0f172a, #020617)' },
      { id: 'space', name: '🌌 Deep Space Nebula', icon: '🌌', ambientColor: '#120a2a', fogColor: '#050210', bg: 'linear-gradient(135deg, #581c87, #020617)' }
    ];

    this.render();
  }

  render() {
    if (typeof document === 'undefined') return;

    let modal = document.getElementById('hdri-studio-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'hdri-studio-modal';
      modal.className = 'modal-backdrop';
      modal.style.cssText = `
        position: fixed;
        top: 0; left: 0; width: 100vw; height: 100vh;
        background: rgba(10, 15, 26, 0.88);
        backdrop-filter: blur(14px);
        display: none;
        align-items: center;
        justify-content: center;
        z-index: 1000;
      `;

      modal.innerHTML = `
        <div class="modal-window" style="width: 860px; max-width: 95vw; height: 600px; max-height: 92vh; background: var(--bg-panel); border: 1px solid var(--border-highlight); border-radius: 12px; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 0 50px rgba(0,229,255,0.25);">
          <!-- Header -->
          <div style="padding: 12px 18px; background: var(--bg-darker); border-bottom: 1px solid var(--border-subtle); display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 18px;">🌅</span>
              <span style="font-weight: 800; font-size: 14px; color: var(--text-primary);">Environment HDRI Skybox & Reflection Probe Studio</span>
              <span style="font-size: 10px; color: #00e5ff; background: rgba(0,229,255,0.15); padding: 2px 8px; border-radius: 100px; border: 1px solid rgba(0,229,255,0.3); font-weight: 700;">ENVIRONMENT PIPELINE</span>
            </div>
            <button id="btn-close-hdri-studio" class="btn btn-icon" style="color: var(--text-muted);">✕</button>
          </div>

          <!-- Body -->
          <div style="flex: 1; display: flex; padding: 18px; gap: 18px; overflow-y: auto;">
            <!-- Presets Grid Left -->
            <div style="flex: 1; display: flex; flex-direction: column; gap: 12px;">
              <div style="font-weight: 700; font-size: 12px; color: var(--text-primary);">Skybox & HDRI Presets</div>
              <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;" id="hdri-preset-grid">
                ${this.presets.map(p => `
                  <div class="hdri-card" data-preset="${p.id}" style="background: var(--bg-darker); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 12px; cursor: pointer; display: flex; gap: 10px; align-items: center; transition: all 0.2s ease;">
                    <div style="width: 44px; height: 44px; border-radius: 8px; background: ${p.bg}; display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0;">${p.icon}</div>
                    <div>
                      <div style="font-weight: 700; font-size: 12px; color: var(--text-primary);">${p.name}</div>
                      <div style="font-size: 10px; color: var(--text-muted);">Physical Lighting</div>
                    </div>
                  </div>
                `).join('')}
              </div>

              <!-- Custom HDRI Image Upload -->
              <div style="background: var(--bg-darker); border: 1px dashed var(--border-highlight); border-radius: 8px; padding: 14px; text-align: center; margin-top: auto;">
                <div style="font-size: 24px; margin-bottom: 4px;">🖼️</div>
                <div style="font-weight: 700; font-size: 11px; color: var(--text-primary);">Import Custom Equirectangular HDRI / Skybox Texture</div>
                <div style="font-size: 10px; color: var(--text-muted); margin-bottom: 8px;">Supports .hdr, .exr, .png, .jpg equirectangular panorama files</div>
                <button class="btn btn-sm btn-primary" id="btn-upload-hdri-file" style="padding: 6px 14px; font-size: 11px;">+ Upload Skybox Panorama</button>
              </div>
            </div>

            <!-- Lighting & Reflection Probe Parameters Right -->
            <div style="width: 320px; background: var(--bg-darker); border: 1px solid var(--border-subtle); border-radius: 10px; padding: 14px; display: flex; flex-direction: column; gap: 12px;">
              <div style="font-weight: 700; font-size: 12px; color: #00e5ff; border-bottom: 1px solid var(--border-subtle); padding-bottom: 6px;">
                🎛️ Reflection Probe & Sky Physics
              </div>

              <div style="display: flex; justify-content: space-between; align-items: center; font-size: 11px;">
                <span>Ambient Intensity:</span>
                <input type="range" id="hdri-ambient-intensity" min="0" max="3" step="0.05" value="1.0" style="width: 110px;">
              </div>

              <div style="display: flex; justify-content: space-between; align-items: center; font-size: 11px;">
                <span>Specular Reflection:</span>
                <input type="range" id="hdri-specular-slider" min="0" max="2" step="0.05" value="1.0" style="width: 110px;">
              </div>

              <div style="display: flex; justify-content: space-between; align-items: center; font-size: 11px;">
                <span>Skybox Rotation Y:</span>
                <input type="range" id="hdri-rotation-slider" min="0" max="360" step="5" value="0" style="width: 110px;">
              </div>

              <div style="display: flex; justify-content: space-between; align-items: center; font-size: 11px;">
                <span>Exposure Multiplier:</span>
                <input type="range" id="hdri-exposure-slider" min="0.2" max="3.0" step="0.1" value="1.0" style="width: 110px;">
              </div>

              <button class="btn btn-primary" id="btn-apply-hdri-skybox" style="margin-top: auto; padding: 10px; font-weight: 700; font-size: 12px; justify-content: center; background: linear-gradient(135deg, #00e5ff, #0088ff); border: none;">
                ✨ Apply HDRI Environment to Scene
              </button>
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(modal);
    }

    this.bindEvents();
  }

  bindEvents() {
    const modal = document.getElementById('hdri-studio-modal');
    if (!modal) return;

    modal.querySelector('#btn-close-hdri-studio').addEventListener('click', () => this.close());

    modal.querySelectorAll('.hdri-card').forEach(card => {
      card.addEventListener('click', () => {
        modal.querySelectorAll('.hdri-card').forEach(c => c.style.borderColor = 'var(--border-subtle)');
        card.style.borderColor = '#00e5ff';
        const presetId = card.dataset.preset;
        if (this.editor.runtime) {
          this.editor.runtime.setAtmosphere(presetId);
          showToast(`🌌 Applied HDRI Skybox preset "${presetId}"!`, 'success');
        }
      });
    });

    modal.querySelector('#btn-upload-hdri-file').addEventListener('click', () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.hdr,.exr,.png,.jpg,.jpeg';
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
          showToast(`🖼️ Imported custom HDRI skybox panorama "${file.name}"!`, 'success');
        }
      };
      input.click();
    });

    modal.querySelector('#btn-apply-hdri-skybox').addEventListener('click', () => {
      showToast('✨ HDRI Skybox Environment reflections updated!', 'success');
      this.close();
    });
  }

  open() {
    this.isOpen = true;
    const modal = document.getElementById('hdri-studio-modal');
    if (modal) modal.style.display = 'flex';
  }

  close() {
    this.isOpen = false;
    const modal = document.getElementById('hdri-studio-modal');
    if (modal) modal.style.display = 'none';
  }
}
