import * as pc from 'playcanvas';

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
    `;

    if (typeof document !== 'undefined') {
      // Ensure context menus are attached to document.body so they are never clipped by panel overflow
      let addMenu = document.getElementById('add-entity-menu');
      if (!addMenu) {
        addMenu = document.createElement('div');
        addMenu.id = 'add-entity-menu';
        addMenu.className = 'context-menu';
        addMenu.style.display = 'none';
        addMenu.innerHTML = `
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
        `;
        document.body.appendChild(addMenu);
      }

      let itemMenu = document.getElementById('item-context-menu');
      if (!itemMenu) {
        itemMenu = document.createElement('div');
        itemMenu.id = 'item-context-menu';
        itemMenu.className = 'context-menu';
        itemMenu.style.display = 'none';
        itemMenu.innerHTML = `
          <div class="context-menu-item" data-item-action="rename">✏️ Rename</div>
          <div class="context-menu-item" data-item-action="frame">🎯 Frame Entity</div>
          <div class="context-menu-item" data-item-action="group">📁 Group Selected (Ctrl+G)</div>
          <div class="context-menu-item" data-item-action="duplicate">📋 Duplicate</div>
          <div class="context-menu-item" data-item-action="add-child">➕ Add Child Entity</div>
          <div class="context-menu-item" data-item-action="save-prefab">📦 Save as Prefab</div>
          <div class="context-menu-separator"></div>
          <div class="context-menu-item" data-item-action="delete" style="color: #ef4444;">🗑️ Delete</div>
        `;
        document.body.appendChild(itemMenu);
      }
    }

    this.rebuildTree();
  }

  bindEvents() {
    // Search input filter
    const searchInput = this.container.querySelector('#hierarchy-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.filterText = e.target.value.toLowerCase().trim();
        this.rebuildTree();
      });
    }

    // Add Entity Button dropdown
    const addBtn = this.container.querySelector('#hierarchy-add-btn');
    const addMenu = typeof document !== 'undefined' ? document.getElementById('add-entity-menu') : null;

    if (addBtn && addMenu) {
      addBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const rect = addBtn.getBoundingClientRect();
        addMenu.style.top = `${rect.bottom + 4}px`;
        addMenu.style.left = `${rect.left - 40}px`;
        addMenu.style.display = 'block';
      });

      if (typeof window !== 'undefined') {
        window.addEventListener('click', () => {
          addMenu.style.display = 'none';
        });
      }

      addMenu.querySelectorAll('.context-menu-item').forEach(item => {
        item.addEventListener('click', () => {
          const action = item.dataset.action;
          this.handleAddAction(action);
          addMenu.style.display = 'none';
        });
      });
    }

    if (typeof window !== 'undefined') {
      // Keyboard shortcuts (Delete, Ctrl+D duplicate, Ctrl+S export, Ctrl+G group)
      window.addEventListener('keydown', (e) => {
        if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;

        if (e.key === 'Delete') {
          const active = this.editor.selection.getActive();
          if (active) this.editor.deleteEntity(active);
        }

        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
          e.preventDefault();
          const active = this.editor.selection.getActive();
          if (active) this.editor.duplicateEntity(active);
        }

        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'g') {
          e.preventDefault();
          this.groupSelectedEntities();
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
    }

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

    const isRoot = this.editor.getApp() ? node === this.editor.getApp().root : false;

    const nodeMatchesFilter = (n, filter) => {
      if (!filter) return true;
      if (n.name.toLowerCase().includes(filter)) return true;
      if (n.children && n.children.length > 0) {
        return n.children.some(child => nodeMatchesFilter(child, filter));
      }
      return false;
    };

    if (!isRoot) {
      if (!nodeMatchesFilter(node, this.filterText)) {
        return;
      }

      if (typeof document !== 'undefined') {
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
          <span class="tree-label" style="flex: 1; ${node.enabled === false ? 'opacity: 0.5; text-decoration: line-through;' : ''}">${node.name}</span>
          <div class="tree-actions" style="display: flex; align-items: center; gap: 4px;">
            <span class="tree-action-lock" title="${node.locked ? 'Unlock Transform' : 'Lock Transform (Freeze)'}" style="cursor: pointer; font-size: 10px; opacity: 0.8;">${node.locked ? '🔒' : '🔓'}</span>
            <span class="tree-action-vis" title="${node.enabled !== false ? 'Hide' : 'Show'}" style="cursor: pointer; font-size: 11px; opacity: 0.7;">${node.enabled !== false ? '👁️' : '🙈'}</span>
            <span class="tree-action-del" title="Delete" style="color: #ef4444; font-size: 10px; cursor: pointer;">✕</span>
          </div>
        `;

        item.addEventListener('click', (e) => {
          e.stopPropagation();
          this.editor.selection.set(node);
        });

        item.querySelector('.tree-action-lock').addEventListener('click', (e) => {
          e.stopPropagation();
          node.locked = !node.locked;
          this.rebuildTree();
          this.editor.events.emit('scene:changed');
        });

        item.querySelector('.tree-action-vis').addEventListener('click', (e) => {
          e.stopPropagation();
          node.enabled = !node.enabled;
          this.editor.events.emit('scene:changed');
        });

        item.querySelector('.tree-action-del').addEventListener('click', (e) => {
          e.stopPropagation();
          this.editor.deleteEntity(node);
        });

        // Item Right-Click Context Menu
        item.addEventListener('contextmenu', (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.editor.selection.set(node);

          const itemMenu = document.getElementById('item-context-menu');
          if (!itemMenu) return;
          itemMenu.style.top = `${e.clientY}px`;
          itemMenu.style.left = `${e.clientX}px`;
          itemMenu.style.display = 'block';

          const handleItemAction = (itemEv) => {
            itemEv.stopPropagation();
            const action = itemEv.target.dataset.itemAction;
            if (action === 'rename') {
              const newName = prompt('Enter new entity name:', node.name);
              if (newName && newName.trim()) {
                node.name = newName.trim();
                this.editor.events.emit('scene:changed');
              }
            } else if (action === 'frame') {
              if (this.editor.runtime && this.editor.runtime.editorCamera) this.editor.runtime.editorCamera.frameEntity(node);
            } else if (action === 'group') {
              this.groupSelectedEntities();
            } else if (action === 'duplicate') {
              this.editor.duplicateEntity(node);
            } else if (action === 'add-child') {
              this.editor.createEntity({
                name: 'Child Entity',
                parent: node,
                transform: { position: [0, 1, 0] }
              });
            } else if (action === 'save-prefab') {
              if (this.editor.prefabs) {
                this.editor.prefabs.createPrefabFromEntity(node);
              }
            } else if (action === 'delete') {
              this.editor.deleteEntity(node);
            }
            itemMenu.style.display = 'none';
          };

          const closeMenu = () => {
            itemMenu.style.display = 'none';
            if (typeof window !== 'undefined') window.removeEventListener('click', closeMenu);
          };

          itemMenu.querySelectorAll('.context-menu-item').forEach(m => {
            m.onclick = handleItemAction;
          });
          if (typeof window !== 'undefined') setTimeout(() => window.addEventListener('click', closeMenu), 10);
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
            const draggedNode = app ? (app.root.findByGuid(draggedId) || app.root.findByName(draggedId)) : null;
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

  groupSelectedEntities() {
    const active = this.editor.selection.getActive();
    const app = this.editor.getApp();
    if (!active || (app && active === app.root)) return;
    const group = this.editor.createEntity({
      name: 'Entity Group',
      transform: { position: [0, 0, 0] }
    });
    if (active.parent && active.parent !== group) {
      group.addChild(active);
    }
    this.editor.selection.set(group);
    this.editor.events.emit('scene:changed');
  }

  updateSelectionHighlight() {
    const active = this.editor.selection.getActive();
    const items = this.container.querySelectorAll('.tree-item');
    items.forEach(el => {
      const isSelected = active && (el.querySelector('.tree-label')?.textContent === active.name);
      el.classList.toggle('selected', isSelected);
    });
  }
}
