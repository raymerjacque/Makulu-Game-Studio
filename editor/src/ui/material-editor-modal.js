import * as pc from 'playcanvas';
import { MaterialPreviewRenderer } from './material-preview.js';
import { showToast } from './toast.js';

/**
 * PBR Material Creator & Shader Editor Modal
 */
export class MaterialEditorModal {
  constructor(editor) {
    this.editor = editor;
    this.isOpen = false;
    this.matPreview = null;
    this.currentMaterialProps = {
      name: 'PBR_Custom_Material',
      diffuse: [0.9, 0.4, 0.1],
      metalness: 0.5,
      roughness: 0.3,
      emissive: [0, 0, 0],
      opacity: 1.0
    };

    this.render();
    this.bindEvents();
  }

  render() {
    this.modal = document.createElement('div');
    this.modal.id = 'material-editor-modal';
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
      <div style="width: 720px; background: var(--bg-darkest); border: 1px solid var(--accent-orange); border-radius: var(--radius-lg); box-shadow: 0 20px 60px rgba(0,0,0,0.8), 0 0 30px rgba(255,102,0,0.25); display: flex; flex-direction: column; overflow: hidden;">

        <!-- Header -->
        <div style="height: 48px; background: var(--bg-darker); border-bottom: 1px solid var(--border-subtle); display: flex; align-items: center; justify-content: space-between; padding: 0 20px; flex-shrink: 0;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="font-size: 20px;">🎨</div>
            <div>
              <div style="font-weight: 700; font-size: 14px; color: var(--text-primary);">PBR Material & Shader Creator</div>
              <div style="font-size: 11px; color: var(--accent-orange); font-weight: 600;">Physical Metalness / Roughness Shading</div>
            </div>
          </div>
          <button id="mat-btn-close" class="btn" style="padding: 4px 10px; font-size: 13px; border-radius: 6px;">✕</button>
        </div>

        <!-- Body (2-Column: Left 3D Sphere Preview, Right Sliders) -->
        <div style="display: flex; flex: 1; padding: 20px; gap: 20px; overflow-y: auto;">

          <!-- Left Orbiting Sphere Preview -->
          <div style="width: 220px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; background: var(--bg-panel); border: 1px solid var(--border-subtle); border-radius: 12px; padding: 16px;">
            <canvas id="mat-creator-preview-canvas" width="180" height="180" style="width: 180px; height: 180px; border-radius: 50%; border: 2px solid var(--border-highlight); background: #000; box-shadow: 0 0 20px rgba(0,0,0,0.8);"></canvas>
            <div style="font-size: 11px; color: var(--text-muted); text-align: center;">Real-time 3D PBR Preview</div>
          </div>

          <!-- Right Shader Properties Form -->
          <div style="flex: 1; display: flex; flex-direction: column; gap: 14px;">

            <div class="prop-row">
              <span class="prop-label" style="width: 120px;">Material Name</span>
              <input type="text" id="mat-name-input" class="text-input" value="PBR_Custom_Material">
            </div>

            <div class="prop-row">
              <span class="prop-label" style="width: 120px;">Diffuse Color</span>
              <input type="color" id="mat-color-picker" value="#e6661a" style="background: none; border: none; width: 48px; height: 28px; cursor: pointer;">
            </div>

            <div class="prop-row">
              <span class="prop-label" style="width: 120px;">Metallic</span>
              <input type="range" min="0" max="1" step="0.05" id="mat-metalness-slider" value="0.5" class="text-input" style="flex: 1;">
              <span id="mat-metal-val" style="font-size: 11px; width: 32px;">0.50</span>
            </div>

            <div class="prop-row">
              <span class="prop-label" style="width: 120px;">Roughness</span>
              <input type="range" min="0" max="1" step="0.05" id="mat-roughness-slider" value="0.3" class="text-input" style="flex: 1;">
              <span id="mat-rough-val" style="font-size: 11px; width: 32px;">0.30</span>
            </div>

            <div class="prop-row">
              <span class="prop-label" style="width: 120px;">Emissive Glow</span>
              <input type="color" id="mat-emissive-picker" value="#000000" style="background: none; border: none; width: 48px; height: 28px; cursor: pointer;">
            </div>

            <div class="prop-row">
              <span class="prop-label" style="width: 120px;">Opacity</span>
              <input type="range" min="0.1" max="1.0" step="0.05" id="mat-opacity-slider" value="1.0" class="text-input" style="flex: 1;">
              <span id="mat-opacity-val" style="font-size: 11px; width: 32px;">1.00</span>
            </div>

            <!-- Action Buttons -->
            <div style="display: flex; gap: 10px; margin-top: auto;">
              <button id="btn-apply-mat-entity" class="btn" style="flex: 1; padding: 8px; font-weight: 600; font-size: 11.5px; background: rgba(0,229,255,0.15); border-color: #00e5ff; color: #00e5ff;">
                🎯 Apply to Selected Object
              </button>
              <button id="btn-save-mat-asset" class="btn btn-primary" style="flex: 1; padding: 8px; font-weight: 700; font-size: 11.5px;">
                💾 Save as Asset
              </button>
            </div>

          </div>

        </div>

      </div>
    `;

    document.body.appendChild(this.modal);
  }

  bindEvents() {
    const closeBtn = this.modal.querySelector('#mat-btn-close');
    closeBtn.addEventListener('click', () => this.close());

    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) this.close();
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) this.close();
    });

    const diffusePick = this.modal.querySelector('#mat-color-picker');
    const metalSlide = this.modal.querySelector('#mat-metalness-slider');
    const metalVal = this.modal.querySelector('#mat-metal-val');
    const roughSlide = this.modal.querySelector('#mat-roughness-slider');
    const roughVal = this.modal.querySelector('#mat-rough-val');
    const emissivePick = this.modal.querySelector('#mat-emissive-picker');
    const opacitySlide = this.modal.querySelector('#mat-opacity-slider');
    const opacityVal = this.modal.querySelector('#mat-opacity-val');

    const updatePreview = () => {
      const hex = diffusePick.value;
      const r = parseInt(hex.slice(1, 3), 16) / 255;
      const g = parseInt(hex.slice(3, 5), 16) / 255;
      const b = parseInt(hex.slice(5, 7), 16) / 255;

      const metalness = parseFloat(metalSlide.value);
      const roughness = parseFloat(roughSlide.value);
      const opacity = parseFloat(opacitySlide.value);

      metalVal.textContent = metalness.toFixed(2);
      roughVal.textContent = roughness.toFixed(2);
      opacityVal.textContent = opacity.toFixed(2);

      this.currentMaterialProps = {
        name: this.modal.querySelector('#mat-name-input').value.trim() || 'PBR_Material',
        diffuse: [r, g, b],
        metalness,
        roughness,
        opacity
      };

      if (this.matPreview) {
        this.matPreview.updateMaterial(this.currentMaterialProps);
      }
    };

    diffusePick.addEventListener('input', updatePreview);
    metalSlide.addEventListener('input', updatePreview);
    roughSlide.addEventListener('input', updatePreview);
    emissivePick.addEventListener('input', updatePreview);
    opacitySlide.addEventListener('input', updatePreview);

    // Apply to selected object
    const applyBtn = this.modal.querySelector('#btn-apply-mat-entity');
    applyBtn.addEventListener('click', () => {
      const active = this.editor.selection.getActive();
      if (!active) {
        showToast('Select a 3D entity first to apply material', 'warn');
        return;
      }

      if (active.render) {
        const mat = new pc.StandardMaterial();
        mat.diffuse = new pc.Color(...this.currentMaterialProps.diffuse);
        mat.metalness = this.currentMaterialProps.metalness;
        mat.useMetalness = true;
        mat.roughness = this.currentMaterialProps.roughness;
        mat.opacity = this.currentMaterialProps.opacity;
        if (mat.opacity < 1.0) mat.blendType = pc.BLEND_NORMAL;
        mat.update();

        active.render.material = mat;
        showToast(`✨ Applied "${this.currentMaterialProps.name}" to ${active.name}!`, 'success');
        this.close();
      } else {
        showToast('Selected entity has no Render mesh component', 'warn');
      }
    });

    // Save as Asset
    const saveAssetBtn = this.modal.querySelector('#btn-save-mat-asset');
    saveAssetBtn.addEventListener('click', () => {
      this.editor.materials.set(this.currentMaterialProps.name, this.currentMaterialProps);
      if (this.editor.assetsPanel) {
        this.editor.assetsPanel.addAsset({
          id: Date.now().toString(),
          name: `${this.currentMaterialProps.name}.mat`,
          type: 'materials',
          icon: '🎨',
          size: '2.0 KB',
          materialData: this.currentMaterialProps
        });
      }
      showToast(`💾 Saved PBR Material "${this.currentMaterialProps.name}" to Project Library!`, 'success');
      this.close();
    });
  }

  open() {
    this.modal.style.display = 'flex';
    this.isOpen = true;

    setTimeout(() => {
      const canvas = this.modal.querySelector('#mat-creator-preview-canvas');
      if (canvas && !this.matPreview) {
        this.matPreview = new MaterialPreviewRenderer(canvas);
      }
    }, 50);
  }

  close() {
    this.modal.style.display = 'none';
    this.isOpen = false;
  }
}
