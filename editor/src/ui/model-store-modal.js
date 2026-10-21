import { MODEL_CATALOG, FREE_MODEL_RESOURCES } from '../store/model-store.js';
import { showToast } from './toast.js';

/**
 * Free 3D Model Store & Asset Library Modal
 */
export class ModelStoreModal {
  constructor(editor) {
    this.editor = editor;
    this.activeView = 'library'; // 'library', 'resources', 'upload'
    this.activeCategory = 'all';
    this.searchQuery = '';
    this.isOpen = false;

    this.render();
    this.bindEvents();
  }

  render() {
    this.modal = document.createElement('div');
    this.modal.id = 'model-store-modal';
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
      <div style="width: 940px; max-width: 95vw; height: 84vh; max-height: 800px; background: var(--bg-darkest); border: 1px solid var(--accent-orange); border-radius: var(--radius-lg); box-shadow: 0 16px 48px rgba(0,0,0,0.8), 0 0 30px var(--accent-orange-glow); display: flex; flex-direction: column; overflow: hidden;">
        
        <!-- Header -->
        <div style="height: 54px; background: var(--bg-darker); border-bottom: 1px solid var(--border-subtle); display: flex; align-items: center; justify-content: space-between; padding: 0 20px; flex-shrink: 0;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="width: 32px; height: 32px; background: linear-gradient(135deg, #ff6600, #ff3300); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 18px; color: #fff;">📦</div>
            <div>
              <div style="font-weight: 700; font-size: 14px; color: var(--text-primary);">Makulu 3D Model & Mesh Center</div>
              <div style="font-size: 11px; color: var(--accent-orange); font-weight: 600;">Authentic 3D GLB Models · CC0 Free Library · Model Repository Links</div>
            </div>
          </div>

          <div style="display: flex; align-items: center; gap: 12px;">
            <input type="text" id="store-search" class="text-input" placeholder="🔍 Search 3D models..." style="width: 200px; height: 30px; font-size: 12px; padding: 4px 10px;">
            <button id="store-btn-close" class="btn" style="padding: 4px 10px; font-size: 13px; border-radius: 6px;">✕</button>
          </div>
        </div>

        <!-- Main View Switcher Tabs -->
        <div style="height: 42px; background: var(--bg-dark); border-bottom: 1px solid var(--border-subtle); display: flex; align-items: center; justify-content: space-between; padding: 0 16px; flex-shrink: 0;">
          <div style="display: flex; gap: 8px;">
            <button class="btn view-tab active" data-view="library" style="font-size: 12px; font-weight: 600; padding: 5px 14px;">
              📦 3D Model Library (${MODEL_CATALOG.length})
            </button>
            <button class="btn view-tab" data-view="resources" style="font-size: 12px; font-weight: 600; padding: 5px 14px;">
              🌐 Free 3D Model Websites
            </button>
            <button class="btn view-tab" data-view="upload" style="font-size: 12px; font-weight: 600; padding: 5px 14px; background: rgba(0,229,255,0.15); border-color: #00e5ff; color: #00e5ff;">
              📥 Import Custom Model (.glb / .gltf)
            </button>
          </div>

          <!-- Category Sub-filter (for library view) -->
          <div id="store-subcategories" style="display: flex; gap: 4px; overflow-x: auto;">
            <button class="btn category-tab active" data-cat="all" style="padding: 2px 8px; font-size: 11px;">All</button>
            <button class="btn category-tab" data-cat="characters" style="padding: 2px 8px; font-size: 11px;">🧙 Characters</button>
            <button class="btn category-tab" data-cat="nature" style="padding: 2px 8px; font-size: 11px;">🌲 Nature</button>
            <button class="btn category-tab" data-cat="props" style="padding: 2px 8px; font-size: 11px;">💎 Props</button>
            <button class="btn category-tab" data-cat="architecture" style="padding: 2px 8px; font-size: 11px;">🏛️ Architecture</button>
            <button class="btn category-tab" data-cat="vehicles" style="padding: 2px 8px; font-size: 11px;">⛵ Vehicles</button>
          </div>
        </div>

        <!-- Content Area -->
        <div id="store-content-area" style="flex: 1; overflow-y: auto; padding: 20px;">
          <!-- Rendered dynamically -->
        </div>

        <!-- Footer -->
        <div style="height: 38px; background: var(--bg-darker); border-top: 1px solid var(--border-subtle); display: flex; align-items: center; justify-content: space-between; padding: 0 18px; font-size: 11.5px; color: var(--text-muted); flex-shrink: 0;">
          <span>Models licensed under CC0 / Public Domain (Commercial & Non-commercial ready)</span>
          <span id="store-count-badge" style="color: var(--accent-orange); font-weight: 700;">${MODEL_CATALOG.length} Authentic 3D Models Loaded</span>
        </div>

      </div>
    `;

    document.body.appendChild(this.modal);
    this.renderActiveView();
  }

  renderActiveView() {
    const content = this.modal.querySelector('#store-content-area');
    const subcats = this.modal.querySelector('#store-subcategories');

    if (this.activeView === 'library') {
      subcats.style.display = 'flex';
      this.renderLibrary(content);
    } else if (this.activeView === 'resources') {
      subcats.style.display = 'none';
      this.renderResources(content);
    } else if (this.activeView === 'upload') {
      subcats.style.display = 'none';
      this.renderUploadDropzone(content);
    }
  }

  renderLibrary(container) {
    let filtered = MODEL_CATALOG.filter(m => {
      const matchCat = this.activeCategory === 'all' || m.category === this.activeCategory;
      const matchSearch = !this.searchQuery || m.name.toLowerCase().includes(this.searchQuery) || m.author.toLowerCase().includes(this.searchQuery);
      return matchCat && matchSearch;
    });

    if (filtered.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 60px 20px; color: var(--text-muted);">
          <div style="font-size: 40px; margin-bottom: 8px;">🔍</div>
          <div style="font-size: 15px; color: var(--text-primary); font-weight: 600;">No matching 3D models found</div>
          <div style="font-size: 12px; margin-top: 4px;">Try searching for "tree", "warrior", "chest", or browse other categories.</div>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 14px; align-content: flex-start;">
        ${filtered.map(model => `
          <div class="card" style="padding: 14px; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 8px; background: var(--bg-panel); border: 1px solid var(--border-subtle); border-radius: 8px; transition: transform 0.15s ease, border-color 0.15s ease;">
            <div style="font-size: 40px; margin: 4px 0;">${model.icon}</div>
            <div style="font-weight: 700; font-size: 12.5px; color: var(--text-primary);">${model.name}</div>
            <div style="display: flex; gap: 4px;">
              <span class="badge badge-green" style="font-size: 9px;">${model.polyCount}</span>
              <span class="badge badge-blue" style="font-size: 9px;">${model.author}</span>
            </div>
            <div style="font-size: 10px; color: var(--text-muted); font-family: var(--font-mono);">
              ${model.url ? model.url.split('/').pop() : 'compound.glb'}
            </div>
            <button class="btn btn-primary btn-spawn-model" data-id="${model.id}" style="width: 100%; margin-top: 6px; font-size: 11px; padding: 6px; font-weight: 600;">
              ⬇️ Spawn in 3D Scene
            </button>
          </div>
        `).join('')}
      </div>
    `;

    container.querySelectorAll('.btn-spawn-model').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const model = MODEL_CATALOG.find(m => m.id === id);
        if (model) {
          this.spawnModel(model);
        }
      });
    });
  }

  renderResources(container) {
    container.innerHTML = `
      <div style="margin-bottom: 18px;">
        <h3 style="margin: 0 0 6px 0; color: #fff; font-size: 16px;">🌐 Where to Find Thousands of Free 3D Models</h3>
        <p style="margin: 0; font-size: 12.5px; color: var(--text-secondary); line-height: 1.6;">
          These websites offer millions of free, high-quality 3D models with Creative Commons / Public Domain licenses. Download any <code>.glb</code> or <code>.gltf</code> file and drag it straight into the studio!
        </p>
      </div>

      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px;">
        ${FREE_MODEL_RESOURCES.map(res => `
          <div class="card" style="padding: 16px; background: var(--bg-panel); border: 1px solid var(--border-subtle); border-radius: 8px; display: flex; flex-direction: column; gap: 8px;">
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 26px;">${res.icon}</span>
                <span style="font-weight: 700; font-size: 14px; color: #fff;">${res.name}</span>
              </div>
              <a href="${res.url}" target="_blank" class="btn" style="padding: 4px 10px; font-size: 11px; background: rgba(255,102,0,0.18); border-color: var(--accent-orange); color: var(--accent-orange); font-weight: 600; text-decoration: none;">
                Visit Site ↗
              </a>
            </div>
            <p style="font-size: 12px; color: var(--text-secondary); margin: 0; line-height: 1.5;">${res.desc}</p>
            <div style="display: flex; gap: 6px; margin-top: auto; flex-wrap: wrap;">
              ${res.tags.map(tag => `<span class="badge" style="font-size: 9px; background: var(--bg-darkest); color: var(--text-secondary);">${tag}</span>`).join('')}
            </div>
          </div>
        `).join('')}
      </div>

      <div style="background: rgba(0,229,255,0.1); border-left: 3px solid #00e5ff; padding: 14px; border-radius: 0 6px 6px 0; margin-top: 18px;">
        <div style="font-weight: 700; color: #00e5ff; font-size: 12.5px; margin-bottom: 4px;">💡 Recommended Format: GLB (glTF Binary)</div>
        <div style="font-size: 12px; color: var(--text-primary); line-height: 1.6;">
          When downloading models, always choose <b>.glb</b> (glTF Binary) whenever available. GLB files bundle all geometry, textures, and materials into a single file with zero missing texture links!
        </div>
      </div>
    `;
  }

  renderUploadDropzone(container) {
    container.innerHTML = `
      <div style="max-width: 650px; margin: 30px auto; text-align: center;">
        <div style="font-size: 44px; margin-bottom: 12px;">📥</div>
        <h3 style="margin: 0 0 8px 0; color: #fff; font-size: 18px;">Import Custom 3D Model</h3>
        <p style="font-size: 13px; color: var(--text-secondary); margin: 0 0 24px 0; line-height: 1.6;">
          Select or drag and drop any <b>.glb</b> or <b>.gltf</b> 3D model file from your computer. It will be loaded directly into your 3D viewport canvas!
        </p>

        <!-- Dropzone Box -->
        <div id="store-dropzone" style="
          border: 2px dashed var(--accent-orange);
          border-radius: 12px;
          padding: 40px 24px;
          background: rgba(255, 102, 0, 0.05);
          cursor: pointer;
          transition: all 0.2s ease;
        ">
          <div style="font-size: 32px; margin-bottom: 10px;">📂</div>
          <div style="font-size: 14px; font-weight: 700; color: var(--text-primary); margin-bottom: 6px;">
            Click to Browse or Drag & Drop 3D File Here
          </div>
          <div style="font-size: 12px; color: var(--text-muted);">
            Supports .glb, .gltf files (Characters, Buildings, Props, Terrain meshes)
          </div>
          <input type="file" id="store-file-input" accept=".glb,.gltf" style="display: none;" />
        </div>

        <div style="margin-top: 20px; font-size: 12px; color: var(--text-secondary);">
          Downloaded a pack from Kenney or Poly Pizza? Simply select any <code>.glb</code> file above!
        </div>
      </div>
    `;

    const dropzone = container.querySelector('#store-dropzone');
    const fileInput = container.querySelector('#store-file-input');

    dropzone.addEventListener('click', () => fileInput.click());

    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.style.background = 'rgba(255, 102, 0, 0.15)';
      dropzone.style.borderColor = '#ff3300';
    });

    dropzone.addEventListener('dragleave', () => {
      dropzone.style.background = 'rgba(255, 102, 0, 0.05)';
      dropzone.style.borderColor = 'var(--accent-orange)';
    });

    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.style.background = 'rgba(255, 102, 0, 0.05)';
      dropzone.style.borderColor = 'var(--accent-orange)';
      const file = e.dataTransfer.files[0];
      if (file) this.handleCustomFile(file);
    });

    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) this.handleCustomFile(file);
    });
  }

  async handleCustomFile(file) {
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['glb', 'gltf'].includes(ext)) {
      showToast('Please select a .glb or .gltf 3D file', 'error');
      return;
    }

    try {
      showToast(`Loading 3D model ${file.name}...`, 'info');
      const blobUrl = URL.createObjectURL(file);
      const cleanName = file.name.replace(/\.[^/.]+$/, "");
      await this.editor.loadModel(blobUrl, {
        name: cleanName,
        position: [0, 0, 0],
        scale: [1, 1, 1]
      });
      showToast(`✨ Loaded authentic 3D model: ${cleanName}!`, 'success');
      this.close();
    } catch (err) {
      console.error(err);
      showToast(`Failed to load ${file.name}: ${err.message}`, 'error');
    }
  }

  async spawnModel(model) {
    try {
      showToast(`Spawning ${model.name}...`, 'info');
      await this.editor.loadModel(model.url, {
        name: model.name,
        position: [0, 0, 0],
        scale: model.scale || [1, 1, 1]
      });
      showToast(`✨ Spawned authentic 3D model: ${model.name}!`, 'success');
      this.close();
    } catch (err) {
      console.error('Failed to spawn model:', err);
      showToast(`Could not load model: ${err.message}`, 'error');
    }
  }

  bindEvents() {
    const closeBtn = this.modal.querySelector('#store-btn-close');
    closeBtn.addEventListener('click', () => this.close());

    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) this.close();
    });

    // View Tabs (Library vs Resources vs Upload)
    const viewTabs = this.modal.querySelectorAll('.view-tab');
    viewTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        viewTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.activeView = tab.dataset.view;
        this.renderActiveView();
      });
    });

    // Subcategory Tabs (for library view)
    const catTabs = this.modal.querySelectorAll('.category-tab');
    catTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        catTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.activeCategory = tab.dataset.cat;
        if (this.activeView === 'library') {
          const content = this.modal.querySelector('#store-content-area');
          this.renderLibrary(content);
        }
      });
    });

    // Search input
    const searchInput = this.modal.querySelector('#store-search');
    searchInput.addEventListener('input', (e) => {
      this.searchQuery = e.target.value.toLowerCase().trim();
      if (this.activeView === 'library') {
        const content = this.modal.querySelector('#store-content-area');
        this.renderLibrary(content);
      }
    });

    // Escape key
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });
  }

  open() {
    this.renderActiveView();
    this.modal.style.display = 'flex';
    this.isOpen = true;
  }

  close() {
    this.modal.style.display = 'none';
    this.isOpen = false;
  }
}
