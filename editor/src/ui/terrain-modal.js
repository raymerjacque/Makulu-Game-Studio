import { TerrainGenerator } from '../engine/terrain-generator.js';

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
      <div style="width: 500px; background: var(--bg-darkest); border: 1px solid var(--accent-orange); border-radius: var(--radius-lg); box-shadow: var(--shadow-lg); display: flex; flex-direction: column; overflow: hidden;">
        
        <!-- Header -->
        <div style="height: 44px; background: var(--bg-darker); border-bottom: 1px solid var(--border-subtle); display: flex; align-items: center; justify-content: space-between; padding: 0 16px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 16px;">🏔️</span>
            <span style="font-weight: 700; font-size: 13px; color: var(--text-primary);">Procedural 3D Terrain Generator</span>
          </div>
          <button id="terrain-btn-close" class="btn" style="padding: 2px 8px; font-size: 12px;">✕</button>
        </div>

        <!-- Body Controls -->
        <div style="padding: 20px; display: flex; flex-direction: column; gap: 14px;">
          
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
            <span class="prop-label" style="width: 140px;">Max Mountain Height</span>
            <input type="range" id="terrain-height" min="1" max="15" step="0.5" value="6" class="text-input" style="flex: 1;">
            <span id="terrain-height-val" style="font-size: 11px; width: 32px; text-align: right;">6m</span>
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

          <div style="background: rgba(255,102,0,0.08); border: 1px solid rgba(255,102,0,0.25); border-radius: var(--radius-sm); padding: 10px; font-size: 11px; color: var(--text-secondary); line-height: 1.5;">
            🌿 <strong>Biome Elevation Shading:</strong> Valleys will automatically be colored lush green grass, hills earthy rock, and mountain peaks crisp white snow.
          </div>

          <button id="terrain-btn-generate" class="btn btn-primary" style="padding: 8px; font-size: 12px; margin-top: 6px;">
            ✨ Generate & Place in Scene
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
    subdivs.addEventListener('input', () => subdivsVal.textContent = subdivs.value);

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

    // Generate Button
    const genBtn = this.modal.querySelector('#terrain-btn-generate');
    genBtn.addEventListener('click', () => {
      const size = parseFloat(this.modal.querySelector('#terrain-size').value) || 40;
      const subdivsNum = parseInt(subdivs.value, 10);
      const maxHeightNum = parseFloat(height.value);
      const roughNum = parseFloat(roughness.value);
      const seedNum = parseInt(seedInput.value, 10);

      this.generator.generate({
        name: 'Procedural Terrain',
        width: size,
        depth: size,
        subdivisions: subdivsNum,
        maxHeight: maxHeightNum,
        roughness: roughNum,
        seed: seedNum
      });

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
