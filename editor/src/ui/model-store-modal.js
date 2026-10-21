import { MODEL_CATALOG } from '../store/model-store.js';

/**
 * Free 3D Model Store & Asset Library Modal
 */
export class ModelStoreModal {
  constructor(editor) {
    this.editor = editor;
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
      background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(10px);
      z-index: 1000;
      display: none;
      align-items: center;
      justify-content: center;
    `;

    this.modal.innerHTML = `
      <div style="width: 860px; height: 620px; background: var(--bg-darkest); border: 1px solid var(--accent-orange); border-radius: var(--radius-lg); box-shadow: 0 16px 48px rgba(0,0,0,0.7), 0 0 24px var(--accent-orange-glow); display: flex; flex-direction: column; overflow: hidden;">
        
        <!-- Header -->
        <div style="height: 48px; background: var(--bg-darker); border-bottom: 1px solid var(--border-subtle); display: flex; align-items: center; justify-content: space-between; padding: 0 18px;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="width: 28px; height: 28px; background: linear-gradient(135deg, #ff6600, #ff3300); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 15px; color: #fff;">📦</div>
            <div>
              <div style="font-weight: 700; font-size: 13px; color: var(--text-primary);">Makulu 3D Asset Store</div>
              <div style="font-size: 10px; color: var(--accent-orange); font-weight: 600;">100% Free CC0 Royalty-Free 3D Models</div>
            </div>
          </div>

          <div style="display: flex; align-items: center; gap: 12px;">
            <input type="text" id="store-search" class="text-input" placeholder="Search 3D models..." style="width: 180px; height: 28px; font-size: 11px;">
            <button id="store-btn-close" class="btn" style="padding: 2px 8px; font-size: 12px;">✕</button>
          </div>
        </div>

        <!-- Category Tabs -->
        <div style="height: 38px; background: var(--bg-dark); border-bottom: 1px solid var(--border-subtle); display: flex; align-items: center; padding: 0 16px; gap: 6px; overflow-x: auto;">
          <button class="btn category-tab active" data-cat="all" style="padding: 3px 10px; font-size: 11px;">All Models</button>
          <button class="btn category-tab" data-cat="characters" style="padding: 3px 10px; font-size: 11px;">🦊 Characters</button>
          <button class="btn category-tab" data-cat="nature" style="padding: 3px 10px; font-size: 11px;">🌲 Nature</button>
          <button class="btn category-tab" data-cat="props" style="padding: 3px 10px; font-size: 11px;">💎 Props & Items</button>
          <button class="btn category-tab" data-cat="vehicles" style="padding: 3px 10px; font-size: 11px;">🏎️ Vehicles</button>
          <button class="btn category-tab" data-cat="architecture" style="padding: 3px 10px; font-size: 11px;">🏰 Architecture</button>
        </div>

        <!-- Models Grid -->
        <div id="store-models-grid" style="flex: 1; overflow-y: auto; padding: 18px; display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 14px; align-content: flex-start;">
        </div>

        <!-- Footer -->
        <div style="height: 34px; background: var(--bg-darker); border-top: 1px solid var(--border-subtle); display: flex; align-items: center; justify-content: space-between; padding: 0 16px; font-size: 11px; color: var(--text-muted);">
          <span>Assets licensed under CC0 / Public Domain (Commercial & Non-commercial ready)</span>
          <span id="store-count-badge" style="color: var(--text-primary); font-weight: 600;">11 Models Available</span>
        </div>

      </div>
    `;

    document.body.appendChild(this.modal);
    this.renderCatalog();
  }

  bindEvents() {
    const closeBtn = this.modal.querySelector('#store-btn-close');
    closeBtn.addEventListener('click', () => this.close());

    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) this.close();
    });

    // Category Tabs
    const tabs = this.modal.querySelectorAll('.category-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.activeCategory = tab.dataset.cat;
        this.renderCatalog();
      });
    });

    // Search
    const searchInput = this.modal.querySelector('#store-search');
    searchInput.addEventListener('input', (e) => {
      this.searchQuery = e.target.value.toLowerCase().trim();
      this.renderCatalog();
    });
  }

  renderCatalog() {
    const grid = this.modal.querySelector('#store-models-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const filtered = MODEL_CATALOG.filter(m => {
      const matchCat = this.activeCategory === 'all' || m.category === this.activeCategory;
      const matchSearch = !this.searchQuery || m.name.toLowerCase().includes(this.searchQuery) || m.author.toLowerCase().includes(this.searchQuery);
      return matchCat && matchSearch;
    });

    this.modal.querySelector('#store-count-badge').textContent = `${filtered.length} Models Available`;

    filtered.forEach(model => {
      const card = document.createElement('div');
      card.className = 'card';
      card.style.cssText = `
        padding: 14px;
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        gap: 8px;
        background: var(--bg-panel);
        border: 1px solid var(--border-subtle);
      `;

      card.innerHTML = `
        <div style="font-size: 40px; margin: 4px 0;">${model.icon}</div>
        <div style="font-weight: 700; font-size: 12px; color: var(--text-primary);">${model.name}</div>
        <div style="display: flex; gap: 4px;">
          <span class="badge badge-green" style="font-size: 9px;">${model.polyCount}</span>
          <span class="badge badge-blue" style="font-size: 9px;">${model.author}</span>
        </div>
        <button class="btn btn-primary btn-import-model" style="width: 100%; margin-top: 6px; font-size: 11px; padding: 5px;">
          ⬇️ Spawn in Scene
        </button>
      `;

      card.querySelector('.btn-import-model').addEventListener('click', () => {
        this.spawnModel(model);
        this.close();
      });

      grid.appendChild(card);
    });
  }

  spawnModel(model) {
    if (model.primitiveBackup) {
      // Spawn low-poly primitive compound representation
      const ent = this.editor.createEntity({
        name: model.name,
        transform: {
          position: [0, (model.primitiveBackup.scale[1] || 1) / 2, 0],
          scale: model.primitiveBackup.scale
        },
        components: [
          { type: 'render', properties: { type: model.primitiveBackup.type } },
          { type: 'collision', properties: { type: model.primitiveBackup.type === 'cone' ? 'box' : model.primitiveBackup.type } }
        ]
      });

      // Frame camera to it
      if (this.editor.runtime) {
        this.editor.runtime.editorCamera.frameEntity(ent);
      }
    }
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
