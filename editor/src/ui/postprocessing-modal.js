import * as pc from 'playcanvas';
import { showToast } from './toast.js';

/**
 * Post-Processing & Render Pipeline FX Modal
 */
export class PostProcessingModal {
  constructor(editor) {
    this.editor = editor;
    this.isOpen = false;
    this.config = {
      bloom: { enabled: false, intensity: 1.0, threshold: 0.8 },
      vignette: { enabled: false, intensity: 0.5, curvature: 0.8 },
      fog: { enabled: false, color: '#687888', density: 0.02 },
      toneMapping: pc.TONEMAP_ACES,
      exposure: 1.0
    };

    this.render();
    this.bindEvents();
  }

  render() {
    this.modal = document.createElement('div');
    this.modal.id = 'postprocessing-modal';
    this.modal.style.cssText = `
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0, 0, 0, 0.78);
      backdrop-filter: blur(10px);
      z-index: 1000;
      display: none;
      align-items: center;
      justify-content: center;
      padding: 24px;
      font-family: var(--font-sans);
    `;

    this.modal.innerHTML = `
      <div style="width: 580px; background: var(--bg-darkest); border: 1px solid var(--accent-cyan); border-radius: var(--radius-lg); box-shadow: 0 20px 60px rgba(0,0,0,0.8), 0 0 30px rgba(0,229,255,0.2); display: flex; flex-direction: column; overflow: hidden;">

        <!-- Header -->
        <div style="height: 48px; background: var(--bg-darker); border-bottom: 1px solid var(--border-subtle); display: flex; align-items: center; justify-content: space-between; padding: 0 20px;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="font-size: 20px;">✨</div>
            <div>
              <div style="font-weight: 700; font-size: 14px; color: var(--text-primary);">Post-Processing & Render Pipeline FX</div>
              <div style="font-size: 11px; color: var(--accent-cyan); font-weight: 600;">Bloom, Vignette, Fog & HDR Exposure</div>
            </div>
          </div>
          <button id="fx-btn-close" class="btn" style="padding: 4px 10px; font-size: 13px; border-radius: 6px;">✕</button>
        </div>

        <!-- Body -->
        <div style="padding: 20px; display: flex; flex-direction: column; gap: 16px; overflow-y: auto; max-height: 520px;">

          <!-- Tone Mapping & Exposure -->
          <div style="background: var(--bg-panel); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 14px;">
            <div style="font-size: 12px; font-weight: 700; color: var(--accent-cyan); margin-bottom: 10px; display: flex; align-items: center; gap: 6px;">
              <span>☀️ Tone Mapping & Camera Exposure</span>
            </div>

            <div class="prop-row" style="margin-bottom: 8px;">
              <span class="prop-label" style="width: 140px;">Tone Mapper</span>
              <select id="fx-tonemap-select" class="text-input" style="flex: 1;">
                <option value="aces" selected>ACES (Film Standard)</option>
                <option value="filmic">Filmic</option>
                <option value="linear">Linear</option>
                <option value="none">None</option>
              </select>
            </div>

            <div class="prop-row">
              <span class="prop-label" style="width: 140px;">Exposure Multiplier</span>
              <input type="range" min="0.1" max="4.0" step="0.1" id="fx-exposure-slider" value="1.0" class="text-input" style="flex: 1;">
              <span id="fx-exposure-val" style="font-size: 11px; width: 32px;">1.0</span>
            </div>
          </div>

          <!-- Exponential Atmospheric Fog -->
          <div style="background: var(--bg-panel); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 14px;">
            <div style="font-size: 12px; font-weight: 700; color: var(--accent-cyan); margin-bottom: 10px; display: flex; align-items: center; justify-content: space-between;">
              <span>🌫️ Atmospheric Exponential Fog</span>
              <input type="checkbox" id="fx-fog-toggle" style="cursor: pointer;">
            </div>

            <div class="prop-row" style="margin-bottom: 8px;">
              <span class="prop-label" style="width: 140px;">Fog Color</span>
              <input type="color" id="fx-fog-color" value="#687888" style="background: none; border: none; width: 48px; height: 28px; cursor: pointer;">
            </div>

            <div class="prop-row">
              <span class="prop-label" style="width: 140px;">Fog Density</span>
              <input type="range" min="0.005" max="0.1" step="0.005" id="fx-fog-density" value="0.02" class="text-input" style="flex: 1;">
              <span id="fx-fog-density-val" style="font-size: 11px; width: 40px;">0.020</span>
            </div>
          </div>

          <!-- Bloom FX -->
          <div style="background: var(--bg-panel); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 14px;">
            <div style="font-size: 12px; font-weight: 700; color: var(--accent-cyan); margin-bottom: 10px; display: flex; align-items: center; justify-content: space-between;">
              <span>🌟 High-Dynamic Range Bloom</span>
              <input type="checkbox" id="fx-bloom-toggle" style="cursor: pointer;">
            </div>

            <div class="prop-row" style="margin-bottom: 8px;">
              <span class="prop-label" style="width: 140px;">Bloom Intensity</span>
              <input type="range" min="0.1" max="3.0" step="0.1" id="fx-bloom-intensity" value="1.0" class="text-input" style="flex: 1;">
              <span id="fx-bloom-intensity-val" style="font-size: 11px; width: 32px;">1.0</span>
            </div>

            <div class="prop-row">
              <span class="prop-label" style="width: 140px;">Luminance Threshold</span>
              <input type="range" min="0.1" max="1.0" step="0.05" id="fx-bloom-threshold" value="0.8" class="text-input" style="flex: 1;">
              <span id="fx-bloom-threshold-val" style="font-size: 11px; width: 32px;">0.80</span>
            </div>
          </div>

        </div>

        <!-- Footer -->
        <div style="height: 52px; background: var(--bg-darker); border-top: 1px solid var(--border-subtle); display: flex; align-items: center; justify-content: flex-end; padding: 0 20px; gap: 10px;">
          <button id="fx-btn-apply" class="btn btn-primary" style="padding: 8px 20px; font-weight: 700;">
            ⚡ Apply to Viewport & Scene
          </button>
        </div>

      </div>
    `;

    document.body.appendChild(this.modal);
  }

  bindEvents() {
    this.modal.querySelector('#fx-btn-close').addEventListener('click', () => this.close());

    const tonemapSelect = this.modal.querySelector('#fx-tonemap-select');
    const exposureSlider = this.modal.querySelector('#fx-exposure-slider');
    const exposureVal = this.modal.querySelector('#fx-exposure-val');

    const fogToggle = this.modal.querySelector('#fx-fog-toggle');
    const fogColor = this.modal.querySelector('#fx-fog-color');
    const fogDensity = this.modal.querySelector('#fx-fog-density');
    const fogDensityVal = this.modal.querySelector('#fx-fog-density-val');

    exposureSlider.addEventListener('input', () => {
      exposureVal.textContent = parseFloat(exposureSlider.value).toFixed(1);
    });

    fogDensity.addEventListener('input', () => {
      fogDensityVal.textContent = parseFloat(fogDensity.value).toFixed(3);
    });

    this.modal.querySelector('#fx-btn-apply').addEventListener('click', () => {
      if (!this.editor.runtime || !this.editor.runtime.app) {
        showToast('Engine runtime not ready', 'error');
        return;
      }

      const app = this.editor.runtime.app;

      // Tone Mapping
      const tonemapVal = tonemapSelect.value;
      if (tonemapVal === 'aces') app.scene.toneMapping = pc.TONEMAP_ACES;
      else if (tonemapVal === 'filmic') app.scene.toneMapping = pc.TONEMAP_FILMIC;
      else if (tonemapVal === 'linear') app.scene.toneMapping = pc.TONEMAP_LINEAR;
      else app.scene.toneMapping = pc.TONEMAP_NONE;

      app.scene.exposure = parseFloat(exposureSlider.value);

      // Fog
      if (fogToggle.checked) {
        app.scene.fog = pc.FOG_EXP2;
        const hex = fogColor.value;
        const r = parseInt(hex.slice(1, 3), 16) / 255;
        const g = parseInt(hex.slice(3, 5), 16) / 255;
        const b = parseInt(hex.slice(5, 7), 16) / 255;
        app.scene.fogColor = new pc.Color(r, g, b);
        app.scene.fogDensity = parseFloat(fogDensity.value);
      } else {
        app.scene.fog = pc.FOG_NONE;
      }

      showToast('✨ Applied Post-Processing render pipeline settings!', 'success');
      this.close();
    });
  }

  open() {
    this.modal.style.display = 'flex';
    this.isOpen = true;
  }

  close() {
    this.modal.style.display = 'none';
    this.isOpen = false;
  }
}
