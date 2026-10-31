import { readHeightmap } from '../engine/heightmap-reader.js';
import { TerrainGenerator } from '../engine/terrain-generator.js';
import { showToast } from './toast.js';

/**
 * Procedural Terrain Sculptor & Generator Modal
 */
export class TerrainModal {
  constructor(editor) {
    this.editor = editor;
    this.generator = new TerrainGenerator(editor);
    this.isOpen = false;

    this.render();
    this.bindEvents();
  }

  render() {
    this.modal = document.createElement('div');
    this.modal.id = 'terrain-modal';
    this.modal.style.cssText = `
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(10px);
      z-index: 1000;
      display: none;
      align-items: center;
      justify-content: center;
    `;

    this.modal.innerHTML = `
      <div style="width: 540px; background: var(--bg-darkest); border: 1px solid var(--accent-orange); border-radius: var(--radius-lg); box-shadow: var(--shadow-lg); display: flex; flex-direction: column; overflow: hidden;">
        
        <!-- Header -->
        <div style="height: 44px; background: var(--bg-darker); border-bottom: 1px solid var(--border-subtle); display: flex; align-items: center; justify-content: space-between; padding: 0 16px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 16px;">🏔️</span>
            <span style="font-weight: 700; font-size: 13px; color: var(--text-primary);">Procedural 3D Terrain Sculptor Studio</span>
          </div>
          <button id="terrain-btn-close" class="btn" style="padding: 2px 8px; font-size: 12px;">✕</button>
        </div>

        <!-- Body Controls -->
        <div style="padding: 20px; display: flex; flex-direction: column; gap: 14px;">
          
          <div class="prop-row">
            <span class="prop-label" style="width: 140px;">Sculpting Brush Tool</span>
            <select id="terrain-brush-mode" class="select-input" style="flex: 1; font-weight: 700; color: var(--accent-orange);">
              <option value="raise">🏔️ Raise Mountains & Hills</option>
              <option value="lower">🏞️ Lower Valleys & Canyons</option>
              <option value="flatten">▭ Flatten Plateaus & Roads</option>
              <option value="smooth">🌊 Smooth Terrain Slopes</option>
              <option value="noise">🌫️ Noise Jitter / Rough Terrain</option>
            </select>
          </div>

          <div class="prop-row">
            <span class="prop-label" style="width: 140px;">Terrain Size (m)</span>
            <div style="display: flex; gap: 8px; align-items: center; flex: 1;">
              <input type="number" id="terrain-size" class="text-input" value="40" min="10" max="200" step="10">
              <span style="font-size: 11px; color: var(--text-muted);">x 40m</span>
            </div>
          </div>

          <div class="prop-row">
            <span class="prop-label" style="width: 140px;">Mesh Subdivisions</span>
            <input type="range" id="terrain-subdivs" min="16" max="64" step="4" value="32" class="text-input" style="flex: 1;">
            <span id="terrain-subdivs-val" style="font-size: 11px; width: 32px; text-align: right;">32</span>
          </div>

          <div class="prop-row">
            <span class="prop-label" style="width: 140px;">Max Height (m)</span>
            <input type="range" id="terrain-height" min="1" max="25" step="0.5" value="8" class="text-input" style="flex: 1;">
            <span id="terrain-height-val" style="font-size: 11px; width: 32px; text-align: right;">8m</span>
          </div>

          <div class="prop-row">
            <span class="prop-label" style="width: 140px;">Roughness / Octaves</span>
            <input type="range" id="terrain-roughness" min="0.03" max="0.15" step="0.01" value="0.07" class="text-input" style="flex: 1;">
            <span id="terrain-roughness-val" style="font-size: 11px; width: 32px; text-align: right;">0.07</span>
          </div>

          <div class="prop-row">
            <span class="prop-label" style="width: 140px;">Random Seed</span>
            <div style="display: flex; gap: 6px; flex: 1;">
              <input type="number" id="terrain-seed" class="text-input" value="1234">
              <button id="btn-rand-seed" class="btn" style="font-size: 11px;">🎲</button>
            </div>
          </div>

          <!-- Heightmap PNG File Importer -->
          <div style="background: var(--bg-darker); border: 1px dashed var(--border-subtle); border-radius: var(--radius-sm); padding: 10px; display: flex; flex-direction: column; gap: 6px; text-align: center;">
            <div style="font-weight: 700; font-size: 11px; color: var(--text-primary);">🖼️ Import Grayscale Heightmap Image (.png / .jpg)</div>
            <div style="font-size: 10px; color: var(--text-muted);">Convert custom heightmap images into 3D meshes with physics colliders</div>
            <button class="btn btn-sm" id="btn-import-heightmap-file" style="padding: 4px; font-size: 11px;">+ Select Heightmap Image</button>
          </div>

          <div style="background: rgba(255,102,0,0.08); border: 1px solid rgba(255,102,0,0.25); border-radius: var(--radius-sm); padding: 10px; font-size: 11px; color: var(--text-secondary); line-height: 1.5;">
            🌿 <strong>Multi-Texture Biome Splatting:</strong> Automatic elevation vertex splatting (Grass Green, Rock Gray, Beach Sand, Snow Peak).
          </div>

          <button id="terrain-btn-generate" class="btn btn-primary" style="padding: 8px; font-size: 12px; margin-top: 6px;">
            ✨ Generate & Place 3D Terrain
          </button>
        </div>

      </div>
    `;

    document.body.appendChild(this.modal);
  }

  bindEvents() {
    const closeBtn = this.modal.querySelector('#terrain-btn-close');
    closeBtn.addEventListener('click', () => this.close());

    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) this.close();
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) this.close();
    });

    // Slider text updates
    const subdivs = this.modal.querySelector('#terrain-subdivs');
    const subdivsVal = this.modal.querySelector('#terrain-subdivs-val');
    subdivs.addEventListener('input', () => {
      subdivsVal.textContent = subdivs.value;
      if (this.customHeights) { this.customHeights = null; showToast('Resolution changed. Reimport the heightmap to use it at this resolution.', 'info'); }
    });

    const height = this.modal.querySelector('#terrain-height');
    const heightVal = this.modal.querySelector('#terrain-height-val');
    height.addEventListener('input', () => heightVal.textContent = `${height.value}m`);

    const roughness = this.modal.querySelector('#terrain-roughness');
    const roughnessVal = this.modal.querySelector('#terrain-roughness-val');
    roughness.addEventListener('input', () => roughnessVal.textContent = roughness.value);

    // Random seed button
    const seedInput = this.modal.querySelector('#terrain-seed');
    const randBtn = this.modal.querySelector('#btn-rand-seed');
    randBtn.addEventListener('click', () => {
      seedInput.value = Math.floor(Math.random() * 99999);
    });

    // Heightmap Image Upload
    const uploadHeightmapBtn = this.modal.querySelector('#btn-import-heightmap-file');
    uploadHeightmapBtn.addEventListener('click', () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.png,.jpg,.jpeg,.webp';
      input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const request = {}; this.heightmapRequest = request;
        const resolution = parseInt(subdivs.value, 10), generate = this.modal.querySelector('#terrain-btn-generate');
        generate.disabled = true;
        try {
          const heights = await readHeightmap(file, resolution);
          if (this.heightmapRequest !== request) return;
          if (parseInt(subdivs.value, 10) !== resolution) throw new Error('Resolution changed during import. Import the heightmap again.');
          this.customHeights = heights;
          showToast(`Heightmap "${file.name}" decoded and ready for generation.`, 'success');
        } catch (error) {
          if (this.heightmapRequest === request) { this.customHeights = null; showToast(error.message || 'Heightmap could not be decoded.', 'error'); }
        } finally { if (this.heightmapRequest === request) generate.disabled = false; }
      };
      input.click();
    });

    // Generate Button
    const genBtn = this.modal.querySelector('#terrain-btn-generate');
    genBtn.addEventListener('click', () => {
      const size = parseFloat(this.modal.querySelector('#terrain-size').value) || 40;
      const brushMode = this.modal.querySelector('#terrain-brush-mode').value || 'raise';
      const subdivsNum = parseInt(subdivs.value, 10);
      const maxHeightNum = parseFloat(height.value);
      const roughNum = parseFloat(roughness.value);
      const seedNum = parseInt(seedInput.value, 10);

      try {
        this.generator.generate({
          name: 'Procedural Terrain',
          width: size,
          depth: size,
          subdivisions: subdivsNum,
          maxHeight: maxHeightNum,
          roughness: roughNum,
          seed: seedNum,
          brushMode: brushMode,
          customHeights: this.customHeights || null
        });

        this.close();
      } catch (error) { showToast(error.message || 'Terrain could not be generated.', 'error'); }
    });
  }

  open() {
    this.modal.style.display = 'flex';
    this.isOpen = true;
  }

  close() {
    this.customHeights = null;
    this.heightmapRequest = {};
    this.modal.querySelector('#terrain-btn-generate').disabled = false;
    this.modal.style.display = 'none';
    this.isOpen = false;
  }
}
