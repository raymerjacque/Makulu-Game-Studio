/**
 * Bottom Asset Browser & File Manager
 */
export class AssetsPanel {
  constructor(container, editor, modelStoreModal = null, terrainModal = null, codeEditorModal = null, materialModal = null) {
    this.container = container;
    this.editor = editor;
    this.storeModal = modelStoreModal;
    this.terrainModal = terrainModal;
    this.codeEditor = codeEditorModal;
    this.materialModal = materialModal;
    this.activeFolder = 'all';

    this.assets = [
      { id: '1', name: 'Character_Hero.glb', type: 'models', icon: '🧍', size: '128 KB', url: 'models/character_hero.glb' },
      { id: '2', name: 'Pine_Tree.glb', type: 'models', icon: '🌲', size: '13 KB', url: 'models/pine_tree.glb' },
      { id: '3', name: 'Treasure_Chest.glb', type: 'models', icon: '📦', size: '16 KB', url: 'models/chest.glb' },
      { id: '4', name: 'Default_Grid.png', type: 'textures', icon: '🖼️', size: '128 KB' },
      { id: '5', name: 'PBR_Gold.mat', type: 'materials', icon: '🟡', size: '2 KB' },
      { id: '6', name: 'RotateBehavior.js', type: 'scripts', icon: '📜', size: '1.2 KB' },
      { id: '7', name: 'Ambient_Wind.wav', type: 'audio', icon: '🔊', size: '450 KB' }
    ];

    this.render();
    this.bindEvents();
  }

  render() {
    this.container.innerHTML = `
      <div class="panel-header">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span>Assets & Library</span>
          <span style="font-size: 10px; color: var(--text-muted);">/assets/${this.activeFolder}</span>
        </div>
        <div class="panel-header-actions">
          <button id="btn-open-store" class="btn" style="background: rgba(255,102,0,0.18); border-color: var(--accent-orange); color: var(--accent-orange); font-weight: 600; padding: 2px 8px; font-size: 11px;">📦 3D Store</button>
          <button id="btn-open-terrain" class="btn" style="padding: 2px 8px; font-size: 11px;">🏔️ Terrain</button>
          <button id="btn-open-material" class="btn" style="padding: 2px 8px; font-size: 11px;">🎨 Material</button>
          <button id="btn-import-asset" class="btn" style="padding: 2px 8px; font-size: 11px;">+ Import File</button>
          <button id="btn-create-script" class="btn" style="padding: 2px 8px; font-size: 11px;">+ New Script</button>
          <button id="btn-collapse-assets" class="btn" style="padding: 2px 6px; font-size: 11px;" title="Collapse/Expand">▾</button>
        </div>
      </div>

      <div class="assets-body">
        <!-- Folders Sidebar -->
        <div class="assets-folders">
          <div class="tree-item ${this.activeFolder === 'all' ? 'selected' : ''}" data-folder="all">
            <span class="tree-icon">📁</span>
            <span class="tree-label">All Assets</span>
          </div>
          <div class="tree-item ${this.activeFolder === 'models' ? 'selected' : ''}" data-folder="models">
            <span class="tree-icon">📦</span>
            <span class="tree-label">3D Models</span>
          </div>
          <div class="tree-item ${this.activeFolder === 'textures' ? 'selected' : ''}" data-folder="textures">
            <span class="tree-icon">🖼️</span>
            <span class="tree-label">Textures</span>
          </div>
          <div class="tree-item ${this.activeFolder === 'materials' ? 'selected' : ''}" data-folder="materials">
            <span class="tree-icon">🎨</span>
            <span class="tree-label">Materials</span>
          </div>
          <div class="tree-item ${this.activeFolder === 'scripts' ? 'selected' : ''}" data-folder="scripts">
            <span class="tree-icon">📜</span>
            <span class="tree-label">Scripts</span>
          </div>
          <div class="tree-item ${this.activeFolder === 'audio' ? 'selected' : ''}" data-folder="audio">
            <span class="tree-icon">🔊</span>
            <span class="tree-label">Audio</span>
          </div>
        </div>

        <!-- Asset Grid -->
        <div class="assets-grid" id="assets-grid"></div>
      </div>
    `;

    this.renderAssetCards();
  }

  renderAssetCards() {
    const grid = this.container.querySelector('#assets-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const filtered = this.activeFolder === 'all'
      ? this.assets
      : this.assets.filter(a => a.type === this.activeFolder || (this.activeFolder === 'models' && a.type === 'model'));

    filtered.forEach(asset => {
      const card = document.createElement('div');
      card.className = 'asset-card';
      card.draggable = true;
      card.innerHTML = `
        <div class="asset-preview">${asset.icon}</div>
        <div class="asset-title" title="${asset.name}">${asset.name}</div>
        <div style="font-size: 9px; color: var(--text-muted);">${asset.size}</div>
      `;

      // Drag to 3D Viewport
      card.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', JSON.stringify(asset));
      });

      // Double click to open/use
      card.addEventListener('dblclick', () => {
        if (asset.type === 'models' || asset.type === 'model') {
          if (asset.url) {
            this.editor.loadModel(asset.url, {
              name: asset.name.replace(/\.[^/.]+$/, ""),
              scale: [1, 1, 1],
              position: [0, 0, 0]
            });
          } else {
            this.editor.createEntity({
              name: asset.name.replace(/\.[^/.]+$/, ""),
              transform: { position: [0, 1, 0] },
              components: [{ type: 'render', properties: { type: 'box' } }]
            });
          }
        } else if (asset.type === 'scripts') {
          if (this.codeEditor) {
            this.codeEditor.open(asset.name);
          }
        }
      });

      grid.appendChild(card);
    });
  }

  bindEvents() {
    // Folder clicks
    this.container.querySelectorAll('.assets-folders .tree-item').forEach(item => {
      item.addEventListener('click', () => {
        this.container.querySelectorAll('.assets-folders .tree-item').forEach(i => i.classList.remove('selected'));
        item.classList.add('selected');
        this.activeFolder = item.dataset.folder;
        this.renderAssetCards();
      });
    });

    // Open 3D Store
    const storeBtn = this.container.querySelector('#btn-open-store');
    if (storeBtn) {
      storeBtn.addEventListener('click', () => {
        if (this.storeModal) this.storeModal.open();
      });
    }

    // Open Terrain Sculptor
    const terrainBtn = this.container.querySelector('#btn-open-terrain');
    if (terrainBtn) {
      terrainBtn.addEventListener('click', () => {
        if (this.terrainModal) this.terrainModal.open();
      });
    }

    // Open Material Creator Modal
    const matBtn = this.container.querySelector('#btn-open-material');
    if (matBtn) {
      matBtn.addEventListener('click', () => {
        if (this.materialModal) this.materialModal.open();
      });
    }

    // Import file button
    const importBtn = this.container.querySelector('#btn-import-asset');
    importBtn.addEventListener('click', () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.glb,.gltf,.png,.jpg,.jpeg,.webp,.wav,.mp3,.js,.json';
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
          this.addLocalFileAsset(file);
        }
      };
      input.click();
    });

    // Create script button
    const scriptBtn = this.container.querySelector('#btn-create-script');
    scriptBtn.addEventListener('click', () => {
      const name = prompt('Enter new script name:', 'customController.js');
      if (name) {
        this.assets.push({
          id: Date.now().toString(),
          name: name.endsWith('.js') ? name : `${name}.js`,
          type: 'scripts',
          icon: '📜',
          size: '1.0 KB'
        });
        this.renderAssetCards();
      }
    });

    // Collapse toggle
    const collapseBtn = this.container.querySelector('#btn-collapse-assets');
    collapseBtn.addEventListener('click', () => {
      this.container.classList.toggle('collapsed');
      collapseBtn.textContent = this.container.classList.contains('collapsed') ? '▴' : '▾';
    });
  }

  addLocalFileAsset(file) {
    let type = 'other';
    let icon = '📄';
    const ext = file.name.split('.').pop().toLowerCase();

    if (['glb', 'gltf'].includes(ext)) { type = 'models'; icon = '📦'; }
    else if (['png', 'jpg', 'jpeg', 'webp'].includes(ext)) { type = 'textures'; icon = '🖼️'; }
    else if (['wav', 'mp3'].includes(ext)) { type = 'audio'; icon = '🔊'; }
    else if (ext === 'js') { type = 'scripts'; icon = '📜'; }

    const sizeKb = Math.round(file.size / 1024);
    let blobUrl = null;
    if (['glb', 'gltf', 'png', 'jpg', 'jpeg', 'webp', 'wav', 'mp3'].includes(ext)) {
      blobUrl = URL.createObjectURL(file);
    }

    this.assets.push({
      id: Date.now().toString(),
      name: file.name,
      type: type,
      icon: icon,
      size: `${sizeKb} KB`,
      url: blobUrl,
      file: file
    });

    this.renderAssetCards();

    // If it's a 3D model, spawn it into the 3D scene canvas
    if (type === 'models' && blobUrl) {
      this.editor.loadModel(blobUrl, {
        name: file.name.replace(/\.[^/.]+$/, ""),
        scale: [1, 1, 1],
        position: [0, 0, 0]
      });
    }
  }
}
