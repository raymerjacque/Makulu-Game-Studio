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
      dof: { enabled: false, focusDistance: 10, blurAmount: 0.5 },
      chromaticAberration: { enabled: false, offset: 0.005 },
      colorGrading: { brightness: 1.0, contrast: 1.0, saturation: 1.0 },
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
      <div style="width: 620px; background: var(--bg-darkest); border: 1px solid var(--accent-cyan); border-radius: var(--radius-lg); box-shadow: 0 20px 60px rgba(0,0,0,0.8), 0 0 30px rgba(0,229,255,0.2); display: flex; flex-direction: column; overflow: hidden;">

        <!-- Header -->
        <div style="height: 48px; background: var(--bg-darker); border-bottom: 1px solid var(--border-subtle); display: flex; align-items: center; justify-content: space-between; padding: 0 20px;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="font-size: 20px;">✨</div>
            <div>
              <div style="font-weight: 700; font-size: 14px; color: var(--text-primary);">Post-Processing & Render Pipeline FX</div>
              <div style="font-size: 11px; color: var(--accent-cyan); font-weight: 600;">Bloom, Vignette, DoF, Chromatic Aberration & Color Grading</div>
            </div>
          </div>
          <button id="fx-btn-close" class="btn" style="padding: 4px 10px; font-size: 13px; border-radius: 6px;">✕</button>
        </div>

        <!-- Body -->
        <div style="padding: 20px; display: flex; flex-direction: column; gap: 16px; overflow-y: auto; max-height: 540px;">

          <!-- Tone Mapping & Exposure -->
          <div style="background: var(--bg-panel); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 14px;">
            <div style="font-size: 12px; font-weight: 700; color: var(--accent-cyan); margin-bottom: 10px; display: flex; align-items: center; gap: 6px;">
              <span>☀️ Tone Mapping & Camera Exposure</span>
            </div>

            <div class="prop-row" style="margin-bottom: 8px;">
              <span class="prop-label" style="width: 150px;">Tone Mapper</span>
              <select id="fx-tonemap-select" class="text-input" style="flex: 1;">
                <option value="aces" selected>ACES (Film Standard)</option>
                <option value="filmic">Filmic</option>
                <option value="linear">Linear</option>
                <option value="none">None</option>
              </select>
            </div>

            <div class="prop-row">
              <span class="prop-label" style="width: 150px;">Exposure Multiplier</span>
              <input type="range" min="0.1" max="4.0" step="0.1" id="fx-exposure-slider" value="1.0" class="text-input" style="flex: 1;">
              <span id="fx-exposure-val" style="font-size: 11px; width: 32px;">1.0</span>
            </div>
          </div>

          <!-- Color Grading (Brightness, Contrast, Saturation) -->
          <div style="background: var(--bg-panel); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 14px;">
            <div style="font-size: 12px; font-weight: 700; color: var(--accent-cyan); margin-bottom: 10px;">
              🎨 Color Grading & Look Adjustment
            </div>

            <div class="prop-row" style="margin-bottom: 8px;">
              <span class="prop-label" style="width: 150px;">Brightness</span>
              <input type="range" min="0.5" max="1.8" step="0.05" id="fx-brightness-slider" value="1.0" class="text-input" style="flex: 1;">
              <span id="fx-brightness-val" style="font-size: 11px; width: 32px;">1.00</span>
            </div>

            <div class="prop-row" style="margin-bottom: 8px;">
              <span class="prop-label" style="width: 150px;">Contrast</span>
              <input type="range" min="0.5" max="2.0" step="0.05" id="fx-contrast-slider" value="1.0" class="text-input" style="flex: 1;">
              <span id="fx-contrast-val" style="font-size: 11px; width: 32px;">1.00</span>
            </div>

            <div class="prop-row">
              <span class="prop-label" style="width: 150px;">Saturation</span>
              <input type="range" min="0.0" max="2.5" step="0.05" id="fx-saturation-slider" value="1.0" class="text-input" style="flex: 1;">
              <span id="fx-saturation-val" style="font-size: 11px; width: 32px;">1.00</span>
            </div>
          </div>

          <!-- Exponential Atmospheric Fog -->
          <div style="background: var(--bg-panel); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 14px;">
            <div style="font-size: 12px; font-weight: 700; color: var(--accent-cyan); margin-bottom: 10px; display: flex; align-items: center; justify-content: space-between;">
              <span>🌫️ Atmospheric Exponential Fog</span>
              <input type="checkbox" id="fx-fog-toggle" style="cursor: pointer;">
            </div>

            <div class="prop-row" style="margin-bottom: 8px;">
              <span class="prop-label" style="width: 150px;">Fog Color</span>
              <input type="color" id="fx-fog-color" value="#687888" style="background: none; border: none; width: 48px; height: 28px; cursor: pointer;">
            </div>

            <div class="prop-row">
              <span class="prop-label" style="width: 150px;">Fog Density</span>
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
              <span class="prop-label" style="width: 150px;">Bloom Intensity</span>
              <input type="range" min="0.1" max="3.0" step="0.1" id="fx-bloom-intensity" value="1.0" class="text-input" style="flex: 1;">
              <span id="fx-bloom-intensity-val" style="font-size: 11px; width: 32px;">1.0</span>
            </div>

            <div class="prop-row">
              <span class="prop-label" style="width: 150px;">Luminance Threshold</span>
              <input type="range" min="0.1" max="1.0" step="0.05" id="fx-bloom-threshold" value="0.8" class="text-input" style="flex: 1;">
              <span id="fx-bloom-threshold-val" style="font-size: 11px; width: 32px;">0.80</span>
            </div>
          </div>

          <!-- Vignette Effect -->
          <div style="background: var(--bg-panel); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 14px;">
            <div style="font-size: 12px; font-weight: 700; color: var(--accent-cyan); margin-bottom: 10px; display: flex; align-items: center; justify-content: space-between;">
              <span>🖼️ Lens Vignette</span>
              <input type="checkbox" id="fx-vignette-toggle" style="cursor: pointer;">
            </div>

            <div class="prop-row" style="margin-bottom: 8px;">
              <span class="prop-label" style="width: 150px;">Vignette Intensity</span>
              <input type="range" min="0.1" max="1.0" step="0.05" id="fx-vignette-intensity" value="0.5" class="text-input" style="flex: 1;">
              <span id="fx-vignette-intensity-val" style="font-size: 11px; width: 32px;">0.50</span>
            </div>

            <div class="prop-row">
              <span class="prop-label" style="width: 150px;">Curvature</span>
              <input type="range" min="0.1" max="1.5" step="0.1" id="fx-vignette-curvature" value="0.8" class="text-input" style="flex: 1;">
              <span id="fx-vignette-curvature-val" style="font-size: 11px; width: 32px;">0.80</span>
            </div>
          </div>

          <!-- Depth of Field (DoF) -->
          <div style="background: var(--bg-panel); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 14px;">
            <div style="font-size: 12px; font-weight: 700; color: var(--accent-cyan); margin-bottom: 10px; display: flex; align-items: center; justify-content: space-between;">
              <span>📷 Depth of Field (DoF)</span>
              <input type="checkbox" id="fx-dof-toggle" style="cursor: pointer;">
            </div>

            <div class="prop-row" style="margin-bottom: 8px;">
              <span class="prop-label" style="width: 150px;">Focus Distance (m)</span>
              <input type="range" min="1" max="50" step="1" id="fx-dof-focus" value="10" class="text-input" style="flex: 1;">
              <span id="fx-dof-focus-val" style="font-size: 11px; width: 32px;">10m</span>
            </div>

            <div class="prop-row">
              <span class="prop-label" style="width: 150px;">Blur Amount</span>
              <input type="range" min="0.1" max="2.0" step="0.1" id="fx-dof-blur" value="0.5" class="text-input" style="flex: 1;">
              <span id="fx-dof-blur-val" style="font-size: 11px; width: 32px;">0.50</span>
            </div>
          </div>

          <!-- Chromatic Aberration -->
          <div style="background: var(--bg-panel); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 14px;">
            <div style="font-size: 12px; font-weight: 700; color: var(--accent-cyan); margin-bottom: 10px; display: flex; align-items: center; justify-content: space-between;">
              <span>🌈 Chromatic Aberration</span>
              <input type="checkbox" id="fx-chromatic-toggle" style="cursor: pointer;">
            </div>

            <div class="prop-row">
              <span class="prop-label" style="width: 150px;">Color Offset</span>
              <input type="range" min="0.001" max="0.02" step="0.001" id="fx-chromatic-offset" value="0.005" class="text-input" style="flex: 1;">
              <span id="fx-chromatic-offset-val" style="font-size: 11px; width: 40px;">0.005</span>
            </div>
          </div>

          <!-- Screen Space Ambient Occlusion (SSAO) & Motion Blur -->
          <div style="background: var(--bg-panel); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 14px;">
            <div style="font-size: 12px; font-weight: 700; color: var(--accent-cyan); margin-bottom: 10px; display: flex; align-items: center; justify-content: space-between;">
              <span>🌑 Ambient Occlusion (SSAO) & Motion Blur</span>
              <input type="checkbox" id="fx-ssao-toggle" style="cursor: pointer;">
            </div>

            <div class="prop-row" style="margin-bottom: 8px;">
              <span class="prop-label" style="width: 150px;">SSAO Radius</span>
              <input type="range" min="1" max="10" step="0.5" id="fx-ssao-radius" value="4.0" class="text-input" style="flex: 1;">
              <span id="fx-ssao-radius-val" style="font-size: 11px; width: 40px;">4.0</span>
            </div>

            <div class="prop-row">
              <span class="prop-label" style="width: 150px;">Motion Blur Strength</span>
              <input type="range" min="0" max="1" step="0.05" id="fx-motionblur-strength" value="0.3" class="text-input" style="flex: 1;">
              <span id="fx-motionblur-val" style="font-size: 11px; width: 40px;">0.30</span>
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

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) this.close();
    });

    const tonemapSelect = this.modal.querySelector('#fx-tonemap-select');
    const exposureSlider = this.modal.querySelector('#fx-exposure-slider');
    const exposureVal = this.modal.querySelector('#fx-exposure-val');

    const brightnessSlider = this.modal.querySelector('#fx-brightness-slider');
    const brightnessVal = this.modal.querySelector('#fx-brightness-val');
    const contrastSlider = this.modal.querySelector('#fx-contrast-slider');
    const contrastVal = this.modal.querySelector('#fx-contrast-val');
    const saturationSlider = this.modal.querySelector('#fx-saturation-slider');
    const saturationVal = this.modal.querySelector('#fx-saturation-val');

    const fogToggle = this.modal.querySelector('#fx-fog-toggle');
    const fogColor = this.modal.querySelector('#fx-fog-color');
    const fogDensity = this.modal.querySelector('#fx-fog-density');
    const fogDensityVal = this.modal.querySelector('#fx-fog-density-val');

    const bloomToggle = this.modal.querySelector('#fx-bloom-toggle');
    const bloomIntensity = this.modal.querySelector('#fx-bloom-intensity');
    const bloomIntensityVal = this.modal.querySelector('#fx-bloom-intensity-val');
    const bloomThreshold = this.modal.querySelector('#fx-bloom-threshold');
    const bloomThresholdVal = this.modal.querySelector('#fx-bloom-threshold-val');

    const vignetteToggle = this.modal.querySelector('#fx-vignette-toggle');
    const vignetteIntensity = this.modal.querySelector('#fx-vignette-intensity');
    const vignetteIntensityVal = this.modal.querySelector('#fx-vignette-intensity-val');
    const vignetteCurvature = this.modal.querySelector('#fx-vignette-curvature');
    const vignetteCurvatureVal = this.modal.querySelector('#fx-vignette-curvature-val');

    const dofToggle = this.modal.querySelector('#fx-dof-toggle');
    const dofFocus = this.modal.querySelector('#fx-dof-focus');
    const dofFocusVal = this.modal.querySelector('#fx-dof-focus-val');
    const dofBlur = this.modal.querySelector('#fx-dof-blur');
    const dofBlurVal = this.modal.querySelector('#fx-dof-blur-val');

    const chromaticToggle = this.modal.querySelector('#fx-chromatic-toggle');
    const chromaticOffset = this.modal.querySelector('#fx-chromatic-offset');
    const chromaticOffsetVal = this.modal.querySelector('#fx-chromatic-offset-val');

    exposureSlider.addEventListener('input', () => {
      exposureVal.textContent = parseFloat(exposureSlider.value).toFixed(1);
    });

    brightnessSlider.addEventListener('input', () => {
      brightnessVal.textContent = parseFloat(brightnessSlider.value).toFixed(2);
    });

    contrastSlider.addEventListener('input', () => {
      contrastVal.textContent = parseFloat(contrastSlider.value).toFixed(2);
    });

    saturationSlider.addEventListener('input', () => {
      saturationVal.textContent = parseFloat(saturationSlider.value).toFixed(2);
    });

    fogDensity.addEventListener('input', () => {
      fogDensityVal.textContent = parseFloat(fogDensity.value).toFixed(3);
    });

    bloomIntensity.addEventListener('input', () => {
      bloomIntensityVal.textContent = parseFloat(bloomIntensity.value).toFixed(1);
    });

    bloomThreshold.addEventListener('input', () => {
      bloomThresholdVal.textContent = parseFloat(bloomThreshold.value).toFixed(2);
    });

    vignetteIntensity.addEventListener('input', () => {
      vignetteIntensityVal.textContent = parseFloat(vignetteIntensity.value).toFixed(2);
    });

    vignetteCurvature.addEventListener('input', () => {
      vignetteCurvatureVal.textContent = parseFloat(vignetteCurvature.value).toFixed(2);
    });

    dofFocus.addEventListener('input', () => {
      dofFocusVal.textContent = `${dofFocus.value}m`;
    });

    dofBlur.addEventListener('input', () => {
      dofBlurVal.textContent = parseFloat(dofBlur.value).toFixed(2);
    });

    chromaticOffset.addEventListener('input', () => {
      chromaticOffsetVal.textContent = parseFloat(chromaticOffset.value).toFixed(3);
    });

    this.modal.querySelector('#fx-btn-apply').addEventListener('click', () => {
      this.config = {
        toneMapping: tonemapSelect.value,
        exposure: parseFloat(exposureSlider.value),
        colorGrading: {
          brightness: parseFloat(brightnessSlider.value),
          contrast: parseFloat(contrastSlider.value),
          saturation: parseFloat(saturationSlider.value)
        },
        fog: {
          enabled: fogToggle.checked,
          color: fogColor.value,
          density: parseFloat(fogDensity.value)
        },
        bloom: {
          enabled: bloomToggle.checked,
          intensity: parseFloat(bloomIntensity.value),
          threshold: parseFloat(bloomThreshold.value)
        },
        vignette: {
          enabled: vignetteToggle.checked,
          intensity: parseFloat(vignetteIntensity.value),
          curvature: parseFloat(vignetteCurvature.value)
        },
        dof: {
          enabled: dofToggle.checked,
          focusDistance: parseFloat(dofFocus.value),
          blurAmount: parseFloat(dofBlur.value)
        },
        chromaticAberration: {
          enabled: chromaticToggle.checked,
          offset: parseFloat(chromaticOffset.value)
        }
      };

      this.editor.postProcessingConfig = this.config;

      if (this.editor.runtime && this.editor.runtime.app) {
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

        if (typeof this.editor.runtime.setPostProcessingFX === 'function') {
          this.editor.runtime.setPostProcessingFX(this.config);
        }
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
