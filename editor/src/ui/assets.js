import * as pc from 'playcanvas';
import { showToast } from './toast.js';

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
    this.editor.assetsPanel = this;
    this.activeFolder = 'all';
    this.assetFilterText = '';

    this.assets = [
      { id: '1', name: 'Character_Hero.glb', type: 'models', icon: '🧙‍♂️', size: '131 KB', url: './models/character_hero.glb' },
      { id: '2', name: 'Character_Enemy_Warrior.glb', type: 'models', icon: '⚔️', size: '127 KB', url: './models/character_warrior.glb' },
      { id: '3', name: 'Pine_Tree.glb', type: 'models', icon: '🌲', size: '17 KB', url: './models/pine_tree.glb' },
      { id: '4', name: 'Treasure_Chest.glb', type: 'models', icon: '💎', size: '35 KB', url: './models/chest.glb' },
      { id: '5', name: 'Default_Grid.png', type: 'textures', icon: '🖼️', size: '128 KB' },
      { id: '6', name: 'PBR_Gold.mat', type: 'materials', icon: '🟡', size: '2 KB' },
      { id: '7', name: 'RotateBehavior.js', type: 'scripts', icon: '📜', size: '1.2 KB' },
      { id: '8', name: 'Ambient_Wind.wav', type: 'audio', icon: '🔊', size: '450 KB' }
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
        <div style="display: flex; align-items: center; gap: 6px; flex: 1; max-width: 220px; margin: 0 10px;">
          <input type="text" id="assets-search-input" class="search-input" style="height: 22px; font-size: 11px; padding: 2px 8px;" placeholder="Search assets..." />
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
          <div class="tree-item ${this.activeFolder === 'prefabs' ? 'selected' : ''}" data-folder="prefabs">
            <span class="tree-icon">📦</span>
            <span class="tree-label">Prefabs</span>
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

    // Ensure context menu for assets is attached to document.body
    let assetMenu = document.getElementById('asset-context-menu');
    if (!assetMenu) {
      assetMenu = document.createElement('div');
      assetMenu.id = 'asset-context-menu';
      assetMenu.className = 'context-menu';
      assetMenu.style.display = 'none';
      assetMenu.innerHTML = `
        <div class="context-menu-item" data-asset-action="rename">✏️ Rename Asset</div>
        <div class="context-menu-item" data-asset-action="duplicate">📋 Duplicate Asset</div>
        <div class="context-menu-separator"></div>
        <div class="context-menu-item" data-asset-action="delete" style="color: #ef4444;">🗑️ Delete Asset</div>
      `;
      document.body.appendChild(assetMenu);
    }

    this.renderAssetCards();
  }

  renderAssetCards() {
    const grid = this.container.querySelector('#assets-grid');
    if (!grid) return;
    grid.innerHTML = '';

    let filtered = this.activeFolder === 'all'
      ? this.assets
      : this.assets.filter(a => a.type === this.activeFolder || (this.activeFolder === 'models' && a.type === 'model'));

    if (this.assetFilterText) {
      filtered = filtered.filter(a => a.name.toLowerCase().includes(this.assetFilterText));
    }

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

      // Context menu right click
      card.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        e.stopPropagation();

        const assetMenu = document.getElementById('asset-context-menu');
        if (!assetMenu) return;

        assetMenu.style.top = `${e.clientY}px`;
        assetMenu.style.left = `${e.clientX}px`;
        assetMenu.style.display = 'block';

        const handleAction = (evt) => {
          evt.stopPropagation();
          const act = evt.target.dataset.assetAction;
          if (act === 'rename') {
            const newName = prompt('Enter new asset name:', asset.name);
            if (newName && newName.trim()) {
              asset.name = newName.trim();
              this.renderAssetCards();
              showToast(`Renamed asset to "${asset.name}"`, 'info');
            }
          } else if (act === 'duplicate') {
            const dup = { ...asset, id: Date.now().toString(), name: `Copy_of_${asset.name}` };
            this.assets.push(dup);
            this.renderAssetCards();
            showToast(`Duplicated asset "${asset.name}"`, 'success');
          } else if (act === 'delete') {
            this.assets = this.assets.filter(a => a.id !== asset.id);
            this.renderAssetCards();
            showToast(`Deleted asset "${asset.name}"`, 'info');
          }
          assetMenu.style.display = 'none';
        };

        const closeAssetMenu = () => {
          assetMenu.style.display = 'none';
          window.removeEventListener('click', closeAssetMenu);
        };

        assetMenu.querySelectorAll('.context-menu-item').forEach(m => {
          m.onclick = handleAction;
        });
        setTimeout(() => window.addEventListener('click', closeAssetMenu), 10);
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
        } else if (asset.type === 'prefabs' && (asset.prefabData || asset.data)) {
          if (this.editor.prefabs) {
            this.editor.prefabs.instantiatePrefab(asset.prefabData || asset.data);
          }
        } else if (asset.type === 'materials' && asset.materialData) {
          const selected = this.editor.selection.getActive();
          if (selected && selected.render) {
            const matProps = asset.materialData;
            const mat = new pc.StandardMaterial();
            if (matProps.diffuse) mat.diffuse = new pc.Color(...matProps.diffuse);
            if (matProps.metalness !== undefined) {
              mat.metalness = matProps.metalness;
              mat.useMetalness = true;
            }
            if (matProps.roughness !== undefined) mat.roughness = matProps.roughness;
            if (matProps.opacity !== undefined) {
              mat.opacity = matProps.opacity;
              if (mat.opacity < 1.0) mat.blendType = pc.BLEND_NORMAL;
            }
            mat.update();
            selected.render.material = mat;
            this.editor.events.emit('entity:component:changed', selected);
            showToast(`🎨 Applied "${asset.name}" to ${selected.name}!`, 'success');
          } else {
            showToast(`Select an entity with a 3D Render mesh to apply "${asset.name}"`, 'info');
          }
        } else if (asset.type === 'scripts') {
          if (this.codeEditor) {
            this.codeEditor.open(asset.name);
          }
        } else if (asset.type === 'audio') {
          if (asset.url) {
            const audio = new Audio(asset.url);
            audio.play().then(() => {
              showToast(`🔊 Previewing audio: "${asset.name}"`, 'info');
            }).catch(err => {
              showToast(`Could not play audio preview: ${err.message}`, 'warn');
            });
          } else {
            showToast(`🔊 Audio file: ${asset.name}`, 'info');
          }
        } else if (asset.type === 'textures') {
          const selected = this.editor.selection.getActive();
          if (selected && selected.render && selected.render.material) {
            if (asset.url) {
              const app = this.editor.getApp();
              if (app) {
                app.assets.loadFromUrl(asset.url, 'texture', (err, texAsset) => {
                  if (!err && texAsset && texAsset.resource) {
                    selected.render.material.diffuseMap = texAsset.resource;
                    selected.render.material.update();
                    this.editor.events.emit('entity:component:changed', selected);
                    showToast(`🖼️ Applied texture "${asset.name}" to ${selected.name}!`, 'success');
                  } else {
                    showToast(`Failed to load texture map "${asset.name}"`, 'error');
                  }
                });
              }
            } else {
              showToast(`Selected texture map: ${asset.name}. Import a image file to apply as material diffuse texture.`, 'info');
            }
          } else {
            showToast(`Select an entity with a 3D Render mesh to apply texture map "${asset.name}"`, 'info');
          }
        }
      });

      grid.appendChild(card);
    });
  }

  bindEvents() {
    // Search input
    const searchInp = this.container.querySelector('#assets-search-input');
    if (searchInp) {
      searchInp.addEventListener('input', (e) => {
        this.assetFilterText = e.target.value.toLowerCase().trim();
        this.renderAssetCards();
      });
    }

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
    if (['glb', 'gltf', 'png', 'jpg', 'jpeg', 'webp', 'wav', 'mp3', 'ogg'].includes(ext)) {
      blobUrl = URL.createObjectURL(file);
    }

    const assetObj = {
      id: Date.now().toString(),
      name: file.name,
      type: type,
      icon: icon,
      size: `${sizeKb} KB`,
      url: blobUrl,
      file: file,
      base64Data: null
    };

    // Convert file to Base64 for 100% portable offline inlining in compiled HTML
    const reader = new FileReader();
    reader.onload = (e) => {
      assetObj.base64Data = e.target.result;
      if (assetObj.url) assetObj.url = e.target.result;
    };
    reader.readAsDataURL(file);

    this.assets.push(assetObj);
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

  addAsset(asset) {
    this.assets.push(asset);
    this.renderAssetCards();
  }
}
