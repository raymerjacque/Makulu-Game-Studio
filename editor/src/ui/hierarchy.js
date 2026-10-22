/**
 * Scene Graph Hierarchy Panel
 */
export class HierarchyPanel {
  constructor(container, editor) {
    this.container = container;
    this.editor = editor;
    this.filterText = '';
    this.render();
    this.bindEvents();
  }

  render() {
    this.container.innerHTML = `
      <div class="panel-header">
        <span>Hierarchy</span>
        <div class="panel-header-actions">
          <button id="hierarchy-add-btn" class="btn" style="padding: 2px 8px; font-size: 11px;">+ Add</button>
        </div>
      </div>

      <div class="search-input-wrap">
        <span class="search-icon">🔍</span>
        <input type="text" id="hierarchy-search" class="search-input" placeholder="Search entities..." />
      </div>

      <div class="tree-container" id="hierarchy-tree"></div>

      <!-- Add Entity Context Menu -->
      <div id="add-entity-menu" class="context-menu" style="display: none;">
        <div class="context-menu-item" data-action="primitive:box">📦 Box</div>
        <div class="context-menu-item" data-action="primitive:sphere">⚪ Sphere</div>
        <div class="context-menu-item" data-action="primitive:capsule">💊 Capsule</div>
        <div class="context-menu-item" data-action="primitive:cylinder">🥫 Cylinder</div>
        <div class="context-menu-item" data-action="primitive:cone">▲ Cone</div>
        <div class="context-menu-item" data-action="primitive:plane">▭ Plane (Ground)</div>
        <div class="context-menu-separator"></div>
        <div class="context-menu-item" data-action="light:directional">☀️ Directional Light</div>
        <div class="context-menu-item" data-action="light:point">💡 Point Light</div>
        <div class="context-menu-item" data-action="light:spot">🔦 Spot Light</div>
        <div class="context-menu-separator"></div>
        <div class="context-menu-item" data-action="camera:persp">🎥 Camera</div>
        <div class="context-menu-item" data-action="empty">📁 Empty Group</div>
      </div>
    `;

    this.rebuildTree();
  }

  bindEvents() {
    // Search input filter
    const searchInput = this.container.querySelector('#hierarchy-search');
    searchInput.addEventListener('input', (e) => {
      this.filterText = e.target.value.toLowerCase().trim();
      this.rebuildTree();
    });

    // Add Entity Button dropdown
    const addBtn = this.container.querySelector('#hierarchy-add-btn');
    const addMenu = this.container.querySelector('#add-entity-menu');

    addBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const rect = addBtn.getBoundingClientRect();
      addMenu.style.top = `${rect.bottom + 4}px`;
      addMenu.style.left = `${rect.left - 40}px`;
      addMenu.style.display = 'block';
    });

    window.addEventListener('click', () => {
      addMenu.style.display = 'none';
    });

    addMenu.querySelectorAll('.context-menu-item').forEach(item => {
      item.addEventListener('click', () => {
        const action = item.dataset.action;
        this.handleAddAction(action);
        addMenu.style.display = 'none';
      });
    });

    // Keyboard shortcuts (Delete, Ctrl+D duplicate, Ctrl+S export)
    window.addEventListener('keydown', (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;

      if (e.key === 'Delete') {
        const active = this.editor.selection.getActive();
        if (active) this.editor.deleteEntity(active);
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        const active = this.editor.selection.getActive();
        if (active) this.editor.duplicateEntity(active);
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        const json = this.editor.exportSceneJSON();
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.editor.projectName.replace(/\s+/g, '_')}_scene.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
    });

    // Subscribe to scene and selection changes
    this.editor.events.on('scene:changed', () => this.rebuildTree());
    this.editor.selection.subscribe(() => this.updateSelectionHighlight());
  }

  handleAddAction(action) {
    if (action.startsWith('primitive:')) {
      const type = action.split(':')[1];
      const capType = type.charAt(0).toUpperCase() + type.slice(1);
      this.editor.createEntity({
        name: `${capType}`,
        transform: { position: [0, 1, 0], scale: [1, 1, 1] },
        components: [
          { type: 'render', properties: { type: type } }
        ]
      });
    } else if (action.startsWith('light:')) {
      const type = action.split(':')[1];
      if (type === 'spot') {
        // Spot light with fixture and oriented down toward ground
        const ent = this.editor.createEntity({
          name: 'Spot Light',
          transform: { position: [0, 5, 0], rotation: [-90, 0, 0] },
          components: [
            {
              type: 'light',
              properties: {
                type: 'spot',
                color: new pc.Color(1, 0.95, 0.8),
                intensity: 4,
                range: 15,
                innerConeAngle: 25,
                outerConeAngle: 45,
                castShadows: true
              }
            },
            {
              type: 'render',
              properties: { type: 'cone' }
            }
          ]
        });
        // Scale helper fixture to be small
        if (ent) ent.setLocalScale(0.4, 0.6, 0.4);
      } else if (type === 'point') {
        // Glowing bulb fixture
        const ent = this.editor.createEntity({
          name: 'Point Light',
          transform: { position: [0, 3, 0] },
          components: [
            {
              type: 'light',
              properties: {
                type: 'point',
                color: new pc.Color(1, 0.7, 0.2),
                intensity: 3,
                range: 10,
                castShadows: true
              }
            },
            {
              type: 'render',
              properties: { type: 'sphere' }
            }
          ]
        });
        if (ent) ent.setLocalScale(0.35, 0.35, 0.35);
      } else {
        // Directional Sun
        const ent = this.editor.createEntity({
          name: 'Directional Sun',
          transform: { position: [0, 8, 0], rotation: [50, 40, 0] },
          components: [
            {
              type: 'light',
              properties: {
                type: 'directional',
                color: new pc.Color(1, 0.98, 0.9),
                intensity: 2,
                castShadows: true
              }
            },
            {
              type: 'render',
              properties: { type: 'cylinder' }
            }
          ]
        });
        if (ent) ent.setLocalScale(0.5, 0.1, 0.5);
      }
    } else if (action === 'camera:persp') {
      const ent = this.editor.createEntity({
        name: 'Game Camera',
        transform: { position: [0, 3, 6], rotation: [-15, 0, 0] },
        components: [
          { type: 'camera', properties: { fov: 60, clearColor: new pc.Color(0.1, 0.1, 0.1) } },
          { type: 'render', properties: { type: 'box' } }
        ]
      });
      if (ent) ent.setLocalScale(0.4, 0.3, 0.6);
    } else if (action === 'empty') {
      this.editor.createEntity({
        name: 'Empty Entity'
      });
    }
  }

  rebuildTree() {
    const tree = this.container.querySelector('#hierarchy-tree');
    if (!tree) return;
    tree.innerHTML = '';

    const app = this.editor.getApp();
    if (!app || !app.root) return;

    this.renderNode(app.root, tree, 0);
    this.updateSelectionHighlight();
  }

  renderNode(node, container, depth) {
    // Skip internal editor entities
    const lower = node.name.toLowerCase();
    if (
      lower === 'editorgrid' ||
      lower === 'editorcamera' ||
      lower === 'gizmoroot' ||
      lower === 'selectionoutline' ||
      lower === 'componentvisualhelpers' ||
      lower.startsWith('gizmo')
    ) return;

    const isRoot = node === this.editor.getApp().root;

    if (!isRoot) {
      if (this.filterText && !node.name.toLowerCase().includes(this.filterText)) {
        // filter check
      } else {
        const item = document.createElement('div');
        item.className = 'tree-item';
        item.dataset.entityId = node.getGuid ? node.getGuid() : node.name;
        item.style.paddingLeft = `${depth * 14 + 8}px`;

        // Icon based on components
        let icon = '📦';
        if (node.light) icon = '💡';
        else if (node.camera) icon = '🎥';
        else if (node.children.length > 0 && !node.render) icon = '📁';

        item.innerHTML = `
          <span class="tree-icon">${icon}</span>
          <span class="tree-label">${node.name}</span>
          <div class="tree-actions">
            <span class="tree-action-del" title="Delete" style="color: #ef4444; font-size: 10px;">✕</span>
          </div>
        `;

        item.addEventListener('click', (e) => {
          e.stopPropagation();
          this.editor.selection.set(node);
        });

        item.querySelector('.tree-action-del').addEventListener('click', (e) => {
          e.stopPropagation();
          this.editor.deleteEntity(node);
        });

        // Double click to frame
        item.addEventListener('dblclick', () => {
          if (this.editor.runtime) {
            this.editor.runtime.editorCamera.frameEntity(node);
          }
        });

        // Drag & drop reparenting
        item.draggable = true;
        item.addEventListener('dragstart', (e) => {
          e.dataTransfer.setData('text/entity-id', node.getGuid ? node.getGuid() : node.name);
        });

        item.addEventListener('dragover', (e) => {
          e.preventDefault();
          item.style.background = 'rgba(255,102,0,0.2)';
        });

        item.addEventListener('dragleave', () => {
          item.style.background = '';
        });

        item.addEventListener('drop', (e) => {
          e.preventDefault();
          item.style.background = '';
          const draggedId = e.dataTransfer.getData('text/entity-id');
          if (draggedId && draggedId !== (node.getGuid ? node.getGuid() : node.name)) {
            const app = this.editor.getApp();
            const draggedNode = app.root.findByGuid(draggedId) || app.root.findByName(draggedId);
            if (draggedNode && draggedNode !== node) {
              node.addChild(draggedNode);
              this.editor.events.emit('scene:changed');
            }
          }
        });

        container.appendChild(item);
      }
    }

    if (node.children) {
      node.children.forEach(child => {
        this.renderNode(child, container, isRoot ? 0 : depth + 1);
      });
    }
  }

  updateSelectionHighlight() {
    const active = this.editor.selection.getActive();
    const items = this.container.querySelectorAll('.tree-item');
    items.forEach(el => {
      const isSelected = active && (el.querySelector('.tree-label').textContent === active.name);
      el.classList.toggle('selected', isSelected);
    });
  }
}
