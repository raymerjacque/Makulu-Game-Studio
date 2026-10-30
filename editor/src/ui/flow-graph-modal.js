import * as pc from 'playcanvas';
import { showToast } from './toast.js';

/**
 * Visual Behavior & Event Flow Graph Studio Modal (Unreal Blueprint / Unity PlayMaker Style)
 * Enables game creators to visually connect logic event nodes, actions, variables, and triggers.
 */
export class FlowGraphModal {
  constructor(editor) {
    this.editor = editor;
    this.isOpen = false;
    this.nodes = [];
    this.connections = [];
    this.selectedNode = null;
    this.currentEntity = null;

    this.render();
  }

  render() {
    if (typeof document === 'undefined') return;

    let modal = document.getElementById('flow-graph-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'flow-graph-modal';
      modal.className = 'modal-backdrop';
      modal.style.cssText = `
        position: fixed;
        top: 0; left: 0; width: 100vw; height: 100vh;
        background: rgba(10, 15, 26, 0.88);
        backdrop-filter: blur(14px);
        display: none;
        align-items: center;
        justify-content: center;
        z-index: 1000;
      `;

      modal.innerHTML = `
        <div class="modal-window" style="width: 1100px; max-width: 95vw; height: 720px; max-height: 92vh; background: var(--bg-panel); border: 1px solid var(--border-highlight); border-radius: 12px; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 0 50px rgba(255,102,0,0.25);">
          <!-- Header -->
          <div style="padding: 12px 18px; background: var(--bg-darker); border-bottom: 1px solid var(--border-subtle); display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 18px;">⚡</span>
              <span style="font-weight: 800; font-size: 14px; color: var(--text-primary);">Visual Behavior & Event Flow Graph Studio</span>
              <span style="font-size: 10px; color: var(--accent-orange); background: rgba(255,102,0,0.15); padding: 2px 8px; border-radius: 100px; border: 1px solid rgba(255,102,0,0.3); font-weight: 700;">BLUEPRINT ENGINE</span>
            </div>
            <button id="btn-close-flow-graph" class="btn btn-icon" style="color: var(--text-muted);">✕</button>
          </div>

          <!-- Main Layout -->
          <div style="flex: 1; display: flex; overflow: hidden;">
            <!-- Node Canvas Area -->
            <div style="flex: 1; display: flex; flex-direction: column; position: relative; background: #080d1a;">
              <!-- Node Palette Bar -->
              <div style="padding: 8px 12px; background: rgba(15,23,42,0.85); border-bottom: 1px solid var(--border-subtle); display: flex; gap: 6px; flex-wrap: wrap; align-items: center;">
                <span style="font-size: 10px; font-weight: 700; color: var(--text-muted); margin-right: 4px;">ADD NODES:</span>
                <button class="btn btn-sm btn-add-flow-node" data-nodetype="event_enter" style="font-size: 10px; gap: 4px; border-color: #34d399; color: #34d399;">⚡ On Enter Trigger</button>
                <button class="btn btn-sm btn-add-flow-node" data-nodetype="event_key" style="font-size: 10px; gap: 4px; border-color: #38bdf8; color: #38bdf8;">⌨️ On Key Press ('E')</button>
                <button class="btn btn-sm btn-add-flow-node" data-nodetype="event_timer" style="font-size: 10px; gap: 4px; border-color: #a855f7; color: #c084fc;">⏱️ On Timer Interval</button>
                <button class="btn btn-sm btn-add-flow-node" data-nodetype="action_sfx" style="font-size: 10px; gap: 4px; border-color: #facc15; color: #facc15;">🔊 Play SFX Sound</button>
                <button class="btn btn-sm btn-add-flow-node" data-nodetype="action_particle" style="font-size: 10px; gap: 4px; border-color: #ff6600; color: #ff6600;">✨ Spawn Particle</button>
                <button class="btn btn-sm btn-add-flow-node" data-nodetype="action_door" style="font-size: 10px; gap: 4px; border-color: #00e5ff; color: #00e5ff;">🚪 Open Door / Lift</button>
                <button class="btn btn-sm btn-add-flow-node" data-nodetype="action_damage" style="font-size: 10px; gap: 4px; border-color: #ef4444; color: #f87171;">⚔️ Damage Entity</button>
                <button class="btn btn-sm btn-add-flow-node" data-nodetype="action_teleport" style="font-size: 10px; gap: 4px; border-color: #c084fc; color: #e9d5ff;">🌀 Teleport</button>
                <button class="btn btn-sm" id="btn-clear-flow-graph" style="font-size: 10px; margin-left: auto; color: #ef4444;">🗑️ Clear Graph</button>
              </div>

              <!-- Canvas Surface -->
              <div id="flow-node-canvas" style="flex: 1; position: relative; overflow: hidden; background-image: radial-gradient(rgba(255,255,255,0.08) 1px, transparent 0); background-size: 20px 20px;">
                <svg id="flow-svg-connections" style="position: absolute; top:0; left:0; width:100%; height:100%; pointer-events:none; z-index:1;"></svg>
              </div>
            </div>

            <!-- Inspector Panel Right -->
            <div style="width: 300px; background: var(--bg-panel); display: flex; flex-direction: column; padding: 14px; gap: 12px; border-left: 1px solid var(--border-subtle); overflow-y: auto;">
              <div style="font-weight: 700; font-size: 12px; color: var(--accent-orange); border-bottom: 1px solid var(--border-subtle); padding-bottom: 6px;">
                ⚙️ Flow Graph Configurator
              </div>

              <div id="flow-target-info" style="font-size: 11px; color: var(--text-secondary); background: var(--bg-darker); padding: 8px 10px; border-radius: 6px; border: 1px solid var(--border-subtle);">
                Target Entity: <span id="flow-target-entity-name" style="color: #34d399; font-weight: 700;">None Selected</span>
              </div>

              <div style="background: var(--bg-darker); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 10px; display: flex; flex-direction: column; gap: 8px;">
                <div style="font-weight: 700; font-size: 11px; color: var(--text-primary);">Graph Metadata</div>
                <div style="display: flex; flex-direction: column; gap: 4px;">
                  <span style="font-size: 10px; color: var(--text-muted);">Graph Title:</span>
                  <input type="text" id="flow-graph-title" class="text-input" value="Custom Logic Flow" style="font-size: 11px;">
                </div>
              </div>

              <!-- Action Buttons -->
              <button class="btn btn-primary" id="btn-apply-flow-graph" style="padding: 10px; font-weight: 700; font-size: 12px; gap: 8px; justify-content: center; background: linear-gradient(135deg, #ff6600, #ff3300); border: none; box-shadow: 0 0 15px rgba(255,102,0,0.4);">
                ⚡ Apply Logic Flow to Selected Entity
              </button>

              <button class="btn" id="btn-export-flow-json" style="padding: 8px; font-size: 11px; justify-content: center;">
                💾 Export Logic Flow JSON
              </button>
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(modal);
    }

    this.bindEvents();
  }

  bindEvents() {
    const modal = document.getElementById('flow-graph-modal');
    if (!modal) return;

    modal.querySelector('#btn-close-flow-graph').addEventListener('click', () => this.close());

    modal.querySelectorAll('.btn-add-flow-node').forEach(btn => {
      btn.addEventListener('click', () => {
        this.addNode(btn.dataset.nodetype);
      });
    });

    modal.querySelector('#btn-clear-flow-graph').addEventListener('click', () => {
      this.clearGraph();
    });

    modal.querySelector('#btn-apply-flow-graph').addEventListener('click', () => {
      const active = this.currentEntity || this.editor.selection.getActive();
      if (active) {
        const title = modal.querySelector('#flow-graph-title').value || 'Custom Flow';
        const flowData = this.exportGraphJSON();

        if (this.editor.behaviors) {
          this.editor.behaviors.attachBehavior(active, 'visual_flow_graph', {
            title,
            nodesCount: this.nodes.length,
            graphData: flowData
          });
        }
        this.editor.events.emit('scene:changed');
        showToast(`⚡ Logic Flow Graph "${title}" attached to "${active.name}"!`, 'success');
      } else {
        showToast('Select an entity in Hierarchy or 3D scene first', 'warn');
      }
    });

    modal.querySelector('#btn-export-flow-json').addEventListener('click', () => {
      const json = JSON.stringify(this.exportGraphJSON(), null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `FlowGraph_${Date.now().toString().slice(-4)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('💾 Visual Flow Graph exported to JSON!', 'success');
    });
  }

  open(targetEntity = null) {
    this.currentEntity = targetEntity || this.editor.selection.getActive();
    this.isOpen = true;

    const modal = document.getElementById('flow-graph-modal');
    if (modal) {
      modal.style.display = 'flex';
      const targetNameEl = modal.querySelector('#flow-target-entity-name');
      if (targetNameEl) {
        targetNameEl.textContent = this.currentEntity ? this.currentEntity.name : 'None Selected';
      }
      if (this.nodes.length === 0) {
        this.setupDefaultGraph();
      }
    }
  }

  close() {
    this.isOpen = false;
    const modal = document.getElementById('flow-graph-modal');
    if (modal) modal.style.display = 'none';
  }

  setupDefaultGraph() {
    this.addNode('event_enter', 60, 100, { radius: 2.5 });
    this.addNode('action_sfx', 420, 80, { sfxType: 'victory' });
    this.addNode('action_door', 420, 260, { targetName: 'DungeonDoor' });
  }

  clearGraph() {
    this.nodes = [];
    if (typeof document !== 'undefined') {
      const canvas = document.getElementById('flow-node-canvas');
      if (canvas) {
        canvas.querySelectorAll('.flow-node').forEach(el => el.remove());
      }
      const svg = document.getElementById('flow-svg-connections');
      if (svg) svg.innerHTML = '';
    }
  }

  addNode(type, x = 120, y = 120, extraProps = {}) {
    const id = `flownode_${Date.now()}_${Math.floor(Math.random()*1000)}`;
    const nodeObj = { id, type, x, y, props: { ...extraProps } };
    this.nodes.push(nodeObj);

    if (typeof document === 'undefined') return;

    const canvas = document.getElementById('flow-node-canvas');
    if (!canvas) return;

    const el = document.createElement('div');
    el.className = 'flow-node';
    el.id = id;
    el.style.cssText = `
      position: absolute;
      left: ${x}px; top: ${y}px;
      width: 200px;
      background: rgba(15, 23, 42, 0.95);
      border: 1px solid var(--border-highlight);
      border-radius: 8px;
      box-shadow: 0 4px 18px rgba(0,0,0,0.6);
      z-index: 10;
      color: #fff;
      font-size: 11px;
      user-select: none;
    `;

    const titleMap = {
      event_enter: '⚡ On Enter Proximity',
      event_key: '⌨️ On Key Press (\'E\')',
      event_timer: '⏱️ On Timer Interval',
      action_sfx: '🔊 Play SFX Sound',
      action_particle: '✨ Spawn Particle Burst',
      action_door: '🚪 Open / Slide Door',
      action_damage: '⚔️ Damage Player/Enemy',
      action_teleport: '🌀 Teleport Entity'
    };

    const colorMap = {
      event_enter: '#34d399',
      event_key: '#38bdf8',
      event_timer: '#c084fc',
      action_sfx: '#facc15',
      action_particle: '#ff6600',
      action_door: '#00e5ff',
      action_damage: '#f87171',
      action_teleport: '#e9d5ff'
    };

    const headerColor = colorMap[type] || '#ff6600';

    el.innerHTML = `
      <div style="padding: 6px 10px; background: rgba(255,255,255,0.06); border-bottom: 1px solid var(--border-subtle); border-radius: 8px 8px 0 0; font-weight: 700; color: ${headerColor}; display: flex; justify-content: space-between; align-items: center;">
        <span>${titleMap[type] || type}</span>
        <span class="btn-flow-del" style="cursor:pointer; color:#ef4444; font-size:10px;">✕</span>
      </div>
      <div style="padding: 10px; display: flex; flex-direction: column; gap: 6px;">
        ${type === 'event_enter' ? `
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span>Radius (m):</span>
            <input type="number" value="${extraProps.radius || 2.5}" step="0.5" class="text-input" style="width: 55px; padding: 2px 4px; font-size: 10px;">
          </div>
        ` : ''}
        ${type === 'action_sfx' ? `
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span>SFX Preset:</span>
            <select class="select-input" style="width: 100px; padding: 2px; font-size: 10px;">
              <option value="victory">Victory</option>
              <option value="coin">Coin</option>
              <option value="laser">Laser</option>
              <option value="explosion">Explosion</option>
              <option value="door">Door</option>
            </select>
          </div>
        ` : ''}
        ${type === 'action_door' ? `
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span>Door Entity:</span>
            <input type="text" value="${extraProps.targetName || 'Door'}" class="text-input" style="width: 90px; padding: 2px 4px; font-size: 10px;">
          </div>
        ` : ''}
        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:4px; font-size:9px; color:var(--text-muted);">
          <span>● Out Exec</span>
          <span>● In Exec</span>
        </div>
      </div>
    `;

    // Make node draggable
    let isDragging = false;
    let startX = 0, startY = 0;

    const header = el.firstElementChild;
    header.addEventListener('mousedown', (e) => {
      isDragging = true;
      startX = e.clientX - nodeObj.x;
      startY = e.clientY - nodeObj.y;
      el.style.zIndex = 20;
    });

    window.addEventListener('mousemove', (e) => {
      if (isDragging) {
        nodeObj.x = e.clientX - startX;
        nodeObj.y = e.clientY - startY;
        el.style.left = `${nodeObj.x}px`;
        el.style.top = `${nodeObj.y}px`;
      }
    });

    window.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        el.style.zIndex = 10;
      }
    });

    const delBtn = el.querySelector('.btn-flow-del');
    if (delBtn) {
      delBtn.addEventListener('click', () => {
        this.nodes = this.nodes.filter(n => n.id !== id);
        el.remove();
      });
    }

    canvas.appendChild(el);
  }

  exportGraphJSON() {
    return {
      nodes: this.nodes.map(n => ({ id: n.id, type: n.type, x: n.x, y: n.y, props: n.props }))
    };
  }
}
