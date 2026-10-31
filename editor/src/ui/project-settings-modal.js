import * as pc from 'playcanvas';
import { showToast } from './toast.js';

/**
 * Global Project & Physics Settings Modal
 */
export class ProjectSettingsModal {
  constructor(editor) {
    this.editor = editor;
    this.isOpen = false;
    this.gravity = [0, -9.8, 0];
    this.render();
    this.bindEvents();
  }

  render() {
    this.modal = document.createElement('div');
    this.modal.id = 'project-settings-modal';
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
      <div style="width: 580px; background: var(--bg-darkest); border: 1px solid var(--accent-orange); border-radius: var(--radius-lg); box-shadow: 0 20px 60px rgba(0,0,0,0.8), 0 0 30px rgba(255,102,0,0.25); display: flex; flex-direction: column; overflow: hidden;">

        <!-- Header -->
        <div style="height: 48px; background: var(--bg-darker); border-bottom: 1px solid var(--border-subtle); display: flex; align-items: center; justify-content: space-between; padding: 0 20px; flex-shrink: 0;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="font-size: 20px;">⚙️</div>
            <div>
              <div style="font-weight: 700; font-size: 14px; color: var(--text-primary);">Project & Physics Engine Settings</div>
              <div style="font-size: 11px; color: var(--accent-orange); font-weight: 600;">Global Physics Gravity, Shadows & Tone Mapping</div>
            </div>
          </div>
          <button id="proj-btn-close" class="btn" style="padding: 4px 10px; font-size: 13px; border-radius: 6px;">✕</button>
        </div>

        <!-- Body Form -->
        <div style="padding: 20px; display: flex; flex-direction: column; gap: 14px;">

          <div class="prop-row">
            <span class="prop-label" style="width: 140px;">Project Title</span>
            <input type="text" id="proj-title-input" class="text-input" value="${this.editor.projectName || 'My 3D Game'}">
          </div>

          <div class="prop-row">
            <span class="prop-label" style="width: 140px;">Physics Gravity Y</span>
            <div style="display: flex; gap: 8px; align-items: center; flex: 1;">
              <input type="number" step="0.5" id="proj-gravity-y" class="text-input" value="-9.8">
              <span style="font-size: 11px; color: var(--text-muted);">m/s² (Earth = -9.8, Moon = -1.6)</span>
            </div>
          </div>

          <div class="prop-row">
            <span class="prop-label" style="width: 140px;">Tone Mapping</span>
            <select class="select-input" id="proj-tonemap-select" style="flex: 1;">
              <option value="aces">ACES Filmic (Recommended)</option>
              <option value="linear">Linear Standard</option>
              <option value="filmic">Filmic High Contrast</option>
            </select>
          </div>

          <div class="prop-row">
            <span class="prop-label" style="width: 140px;">Shadow Map Resolution</span>
            <select class="select-input" id="proj-shadow-resolution" style="flex: 1;">
              <option value="1024">Medium (1024x1024)</option>
              <option value="2048">High Crisp (2048x2048)</option>
              <option value="512">Low Mobile (512x512)</option>
            </select>
          </div>

          <!-- PlayCanvas Clustered Lighting Pipeline -->
          <div style="border-top: 1px solid var(--border-subtle); padding-top: 10px; margin-top: 4px;">
            <div style="font-weight: 700; font-size: 11px; color: var(--accent-orange); margin-bottom: 8px;">💡 PlayCanvas Clustered Lighting & Shadow Atlas</div>

            <div class="prop-row" style="margin-bottom: 6px;">
              <span class="prop-label" style="width: 140px;">Clustered Lighting</span>
              <label class="toggle-switch">
                <input type="checkbox" id="proj-clustered-lighting" checked>
                <span class="toggle-slider"></span>
              </label>
            </div>

            <div class="prop-row" style="margin-bottom: 6px;">
              <span class="prop-label" style="width: 140px;">Shadow Atlas Size</span>
              <select class="select-input" id="proj-shadow-atlas-size" style="flex: 1;">
                <option value="2048">2048 x 2048 (Balanced)</option>
                <option value="4096">4096 x 4096 (Ultra AAA)</option>
                <option value="1024">1024 x 1024 (Performance)</option>
              </select>
            </div>

            <div class="prop-row" style="margin-bottom: 6px;">
              <span class="prop-label" style="width: 140px;">Max Clustered Lights</span>
              <input type="number" id="proj-max-clustered-lights" min="16" max="256" step="16" class="text-input" value="64" style="flex: 1;">
            </div>
          </div>

          <div style="border-top: 1px solid var(--border-subtle); padding-top: 10px; margin-top: 4px;">
            <div style="font-weight: 700; font-size: 11px; color: var(--accent-orange); margin-bottom: 8px;">🔊 Global Audio Mixer Bus Volumes</div>

            <div class="prop-row" style="margin-bottom: 6px;">
              <span class="prop-label" style="width: 140px;">Master Volume</span>
              <input type="range" min="0" max="1" step="0.05" id="proj-audio-master" value="${this.editor.audioVolumes?.master !== undefined ? this.editor.audioVolumes.master : 1.0}" style="flex: 1; accent-color: var(--accent-orange);">
            </div>

            <div class="prop-row" style="margin-bottom: 6px;">
              <span class="prop-label" style="width: 140px;">Music Volume</span>
              <input type="range" min="0" max="1" step="0.05" id="proj-audio-music" value="${this.editor.audioVolumes?.music !== undefined ? this.editor.audioVolumes.music : 0.8}" style="flex: 1; accent-color: var(--accent-orange);">
            </div>

            <div class="prop-row" style="margin-bottom: 6px;">
              <span class="prop-label" style="width: 140px;">SFX Volume</span>
              <input type="range" min="0" max="1" step="0.05" id="proj-audio-sfx" value="${this.editor.audioVolumes?.sfx !== undefined ? this.editor.audioVolumes.sfx : 1.0}" style="flex: 1; accent-color: var(--accent-orange);">
            </div>
          </div>

          <div style="border-top: 1px solid var(--border-subtle); padding-top: 10px; margin-top: 4px;">
            <div style="font-weight: 700; font-size: 11px; color: var(--accent-orange); margin-bottom: 8px;">🖼️ Basis Universal & KTX2 Texture Compression Pipeline</div>

            <div class="prop-row" style="margin-bottom: 8px;">
              <span class="prop-label" style="width: 140px;">Transcode Target</span>
              <select class="select-input" id="proj-texture-target" style="flex: 1;">
                <option value="auto">Auto (Hardware Best Fit)</option>
                <option value="astc">ASTC (Mobile / High Fidelity)</option>
                <option value="dxt">DXT / BC1 / BC3 (Desktop PCs)</option>
                <option value="etc2">ETC2 (Android Standard)</option>
                <option value="bc7">BC7 (AAA High Detail)</option>
                <option value="uncompressed">RGBA Uncompressed</option>
              </select>
            </div>

            <div class="prop-row" style="margin-bottom: 8px;">
              <span class="prop-label" style="width: 140px;">Compression Quality</span>
              <select class="select-input" id="proj-texture-quality" style="flex: 1;">
                <option value="normal">Normal (Balanced Speed & VRAM)</option>
                <option value="fast">Fast (Sub-second Transcode)</option>
                <option value="high">High Quality (Production)</option>
                <option value="max">Maximum (AAA Perfection)</option>
              </select>
            </div>

            <div class="prop-row" style="margin-bottom: 8px;">
              <span class="prop-label" style="width: 140px;">Anisotropic Filter</span>
              <select class="select-input" id="proj-texture-aniso" style="flex: 1;">
                <option value="4">4x Balanced</option>
                <option value="8">8x High Detail</option>
                <option value="16">16x Max Sharpness</option>
                <option value="1">1x Off</option>
              </select>
            </div>

            <div class="prop-row">
              <span class="prop-label" style="width: 140px;">Generate Mipmaps</span>
              <input type="checkbox" id="proj-texture-mipmaps" checked>
            </div>
          </div>

          <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 10px;">
            <button id="btn-save-project-settings" class="btn btn-primary" style="padding: 8px 18px; font-size: 12px; font-weight: 700;">
              💾 Apply Project Settings
            </button>
          </div>

        </div>

      </div>
    `;

    document.body.appendChild(this.modal);
  }

  bindEvents() {
    const closeBtn = this.modal.querySelector('#proj-btn-close');
    closeBtn.addEventListener('click', () => this.close());

    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) this.close();
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) this.close();
    });

    const saveBtn = this.modal.querySelector('#btn-save-project-settings');
    saveBtn.addEventListener('click', () => {
      const title = this.modal.querySelector('#proj-title-input').value.trim();
      const gravityY = parseFloat(this.modal.querySelector('#proj-gravity-y').value) || -9.8;
      const tonemap = this.modal.querySelector('#proj-tonemap-select').value;
        const shadowRes = parseInt(this.modal.querySelector('#proj-shadow-resolution').value, 10) || 1024;

        const texTarget = this.modal.querySelector('#proj-texture-target').value;
        const texQuality = this.modal.querySelector('#proj-texture-quality').value;
        const texAniso = parseInt(this.modal.querySelector('#proj-texture-aniso').value, 10);
        const texMipmaps = this.modal.querySelector('#proj-texture-mipmaps').checked;

        const masterVol = parseFloat(this.modal.querySelector('#proj-audio-master').value) || 1.0;
        const musicVol = parseFloat(this.modal.querySelector('#proj-audio-music').value) || 0.8;
        const sfxVol = parseFloat(this.modal.querySelector('#proj-audio-sfx').value) || 1.0;

        const clustered = this.modal.querySelector('#proj-clustered-lighting')?.checked ?? true;
        const atlasSize = parseInt(this.modal.querySelector('#proj-shadow-atlas-size')?.value, 10) || 2048;
        const maxLights = parseInt(this.modal.querySelector('#proj-max-clustered-lights')?.value, 10) || 64;

        if (title) this.editor.projectName = title;

        this.editor.shadowResolution = shadowRes;
        this.editor.clusteredLightingSettings = {
          enabled: clustered,
          shadowAtlasResolution: atlasSize,
          maxLights: maxLights
        };
        this.editor.events.emit('project:content:changed');
        this.editor.audioVolumes = { master: masterVol, music: musicVol, sfx: sfxVol };
        this.editor.textureCompressionSettings = {
          targetFormat: texTarget,
          qualityLevel: texQuality,
          maxAnisotropy: texAniso,
          generateMipmaps: texMipmaps
        };

        const app = this.editor.getApp();
        if (app) {
          if (app.systems && app.systems.rigidbody) {
            app.systems.rigidbody.gravity.set(0, gravityY, 0);
          }
          if (app.scene && app.scene.lighting) {
            app.scene.lighting.shadowAtlasResolution = atlasSize;
            app.scene.lighting.maxLightsPerCell = maxLights;
          }
          if (app.scene) {
            if (tonemap === 'aces') app.scene.toneMapping = pc.TONEMAP_ACES;
            else if (tonemap === 'linear') app.scene.toneMapping = pc.TONEMAP_LINEAR;
            else if (tonemap === 'filmic') app.scene.toneMapping = pc.TONEMAP_FILMIC;
          }

          // Apply shadow resolution across all lights in the scene
          app.root.forEach(entity => {
            if (entity.light) {
              entity.light.shadowResolution = shadowRes;
            }
          });
        }

        showToast(`⚙️ Updated Project, Physics & Shadow Settings!`, 'success');
        this.close();
      });
  }

  open() {
    if (this.editor && this.modal) {
      const titleInput = this.modal.querySelector('#proj-title-input');
      if (titleInput && this.editor.projectName) titleInput.value = this.editor.projectName;

      const app = this.editor.getApp();
      if (app && app.systems && app.systems.rigidbody) {
        const gravInput = this.modal.querySelector('#proj-gravity-y');
        if (gravInput) gravInput.value = app.systems.rigidbody.gravity.y;
      }

      if (this.editor.textureCompressionSettings) {
        const s = this.editor.textureCompressionSettings;
        const targetSelect = this.modal.querySelector('#proj-texture-target');
        if (targetSelect && s.targetFormat) targetSelect.value = s.targetFormat;
        const qualSelect = this.modal.querySelector('#proj-texture-quality');
        if (qualSelect && s.qualityLevel) qualSelect.value = s.qualityLevel;
        const anisoSelect = this.modal.querySelector('#proj-texture-aniso');
        if (anisoSelect && s.maxAnisotropy) anisoSelect.value = s.maxAnisotropy;
        const mipmapsCheck = this.modal.querySelector('#proj-texture-mipmaps');
        if (mipmapsCheck && s.generateMipmaps !== undefined) mipmapsCheck.checked = s.generateMipmaps;
      }
    }
    this.modal.style.display = 'flex';
    this.isOpen = true;
  }

  close() {
    this.modal.style.display = 'none';
    this.isOpen = false;
  }
}
