/**
 * Visual Animation Blend Graph Editor Modal
 * Enables visual creation and state machine transition blending for character skeletal GLB animations.
 */
export class AnimBlendModal {
  constructor(editor) {
    this.editor = editor;
    this.isOpen = false;
    this.targetEntity = null;

    // Default animation state graph data
    this.graph = {
      defaultState: 'Idle',
      parameters: {
        speed: 0,
        isGrounded: true,
        isAttacking: false
      },
      states: [
        { id: 'Idle', name: 'Idle Anim', clip: 'idle.glb', x: 80, y: 120, isDefault: true },
        { id: 'Walk', name: 'Walk Anim', clip: 'walk.glb', x: 320, y: 80, isDefault: false },
        { id: 'Run', name: 'Run Anim', clip: 'run.glb', x: 560, y: 80, isDefault: false },
        { id: 'Jump', name: 'Jump Anim', clip: 'jump.glb', x: 320, y: 260, isDefault: false }
      ],
      transitions: [
        { from: 'Idle', to: 'Walk', condition: 'speed > 0.1', blendTime: 0.2 },
        { from: 'Walk', to: 'Idle', condition: 'speed <= 0.1', blendTime: 0.2 },
        { from: 'Walk', to: 'Run', condition: 'speed > 5.0', blendTime: 0.2 },
        { from: 'Run', to: 'Walk', condition: 'speed <= 5.0', blendTime: 0.2 },
        { from: 'Idle', to: 'Jump', condition: 'isGrounded == false', blendTime: 0.15 },
        { from: 'Walk', to: 'Jump', condition: 'isGrounded == false', blendTime: 0.15 },
        { from: 'Jump', to: 'Idle', condition: 'isGrounded == true', blendTime: 0.2 }
      ]
    };

    this.render();
    this.bindEvents();
  }

  render() {
    if (typeof document === 'undefined') return;
    this.modal = document.createElement('div');
    this.modal.id = 'anim-blend-modal';
    this.modal.style.cssText = `
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(8px);
      z-index: 1000;
      display: none;
      align-items: center;
      justify-content: center;
    `;

    this.modal.innerHTML = `
      <div style="width: 900px; height: 620px; background: var(--bg-darkest); border: 1px solid var(--border-highlight); border-radius: var(--radius-lg); box-shadow: var(--shadow-lg); display: flex; flex-direction: column; overflow: hidden;">

        <!-- Header -->
        <div style="height: 44px; background: var(--bg-darker); border-bottom: 1px solid var(--border-subtle); display: flex; align-items: center; justify-content: space-between; padding: 0 16px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 16px;">🕺</span>
            <span style="font-weight: 700; font-size: 13px; color: var(--text-primary);">Visual Animation Blend Graph</span>
            <span style="font-size: 10px; background: rgba(168, 85, 247, 0.2); color: #c084fc; padding: 2px 8px; border-radius: 4px; font-weight: 600;">Anim State Machine</span>
          </div>

          <div style="display: flex; align-items: center; gap: 8px;">
            <button id="btn-add-anim-state" class="btn" style="font-size: 11px; padding: 4px 8px;">➕ Add State Node</button>
            <button id="btn-add-anim-trans" class="btn" style="font-size: 11px; padding: 4px 8px;">⚡ Add Transition</button>
            <button id="btn-save-anim-graph" class="btn btn-primary" style="font-size: 11px; padding: 4px 12px;">💾 Save & Apply</button>
            <button id="btn-close-anim-modal" class="btn" style="font-size: 11px; padding: 4px 8px;">✕</button>
          </div>
        </div>

        <!-- Main Body Split -->
        <div style="flex: 1; display: flex; overflow: hidden;">
          <!-- Node Canvas View -->
          <div id="anim-canvas-wrap" style="flex: 1; background: #0c0f17; position: relative; overflow: hidden; background-image: radial-gradient(rgba(255,255,255,0.1) 1px, transparent 1px); background-size: 20px 20px;">
            <svg id="anim-canvas-svg" style="width: 100%; height: 100%; position: absolute; top: 0; left: 0; pointer-events: none;"></svg>
            <div id="anim-nodes-container" style="width: 100%; height: 100%; position: relative;"></div>
          </div>

          <!-- Right Sidebar Controller Panel -->
          <div style="width: 260px; background: var(--bg-darker); border-left: 1px solid var(--border-subtle); display: flex; flex-direction: column; padding: 12px; gap: 12px; overflow-y: auto;">
            <div style="font-weight: 700; font-size: 11px; color: var(--text-primary); text-transform: uppercase; letter-spacing: 0.5px;">🎛️ Live Blend Parameters</div>

            <div style="display: flex; flex-direction: column; gap: 8px;">
              <div class="prop-row">
                <span class="prop-label" style="font-size: 11px;">Speed</span>
                <input type="range" min="0" max="10" step="0.1" id="param-speed-slider" value="0" class="text-input">
                <span id="param-speed-val" style="font-size: 10px; color: var(--accent-orange); font-weight: 700; width: 24px;">0</span>
              </div>

              <div class="prop-row">
                <span class="prop-label" style="font-size: 11px;">Is Grounded</span>
                <input type="checkbox" id="param-grounded-check" checked>
              </div>

              <div class="prop-row">
                <span class="prop-label" style="font-size: 11px;">Is Attacking</span>
                <input type="checkbox" id="param-attack-check">
              </div>
            </div>

            <div style="border-top: 1px solid var(--border-subtle); padding-top: 10px;">
              <div style="font-weight: 700; font-size: 11px; color: var(--text-primary); text-transform: uppercase; margin-bottom: 8px;">⚡ Active State</div>
              <div id="anim-active-state-badge" style="background: rgba(16,185,129,0.15); border: 1px solid #10b981; color: #34d399; padding: 8px; border-radius: 6px; font-weight: 700; font-size: 12px; text-align: center;">
                Active: Idle
              </div>
            </div>

            <div style="border-top: 1px solid var(--border-subtle); padding-top: 10px; flex: 1;">
              <div style="font-weight: 700; font-size: 11px; color: var(--text-primary); text-transform: uppercase; margin-bottom: 6px;">📋 Graph Transitions</div>
              <div id="anim-transitions-list" style="display: flex; flex-direction: column; gap: 4px; font-size: 10px; color: var(--text-muted);"></div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div style="height: 30px; background: var(--bg-darker); border-top: 1px solid var(--border-subtle); display: flex; align-items: center; justify-content: space-between; padding: 0 12px; font-size: 11px; color: var(--text-muted);">
          <span>Drag nodes to position | Click state node to set active preview</span>
          <span style="color: var(--accent-purple);">● Anim Blend Engine Active</span>
        </div>

      </div>
    `;

    if (typeof document !== 'undefined' && document.body) {
      document.body.appendChild(this.modal);
    }
  }

  bindEvents() {
    if (!this.modal) return;
    this.modal.querySelector('#btn-close-anim-modal').addEventListener('click', () => this.close());
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) this.close();
    });

    // Parameter inputs
    const speedSlider = this.modal.querySelector('#param-speed-slider');
    const speedVal = this.modal.querySelector('#param-speed-val');
    const groundedCheck = this.modal.querySelector('#param-grounded-check');
    const attackCheck = this.modal.querySelector('#param-attack-check');

    const updateParams = () => {
      this.graph.parameters.speed = parseFloat(speedSlider.value);
      speedVal.textContent = speedSlider.value;
      this.graph.parameters.isGrounded = groundedCheck.checked;
      this.graph.parameters.isAttacking = attackCheck.checked;
      this.evaluateTransitions();
    };

    speedSlider.addEventListener('input', updateParams);
    groundedCheck.addEventListener('change', updateParams);
    attackCheck.addEventListener('change', updateParams);

    // Add state node
    this.modal.querySelector('#btn-add-anim-state').addEventListener('click', () => {
      const name = prompt('Enter name for new Animation State Node:', 'Attack');
      if (name) {
        this.graph.states.push({
          id: name,
          name: `${name} Anim`,
          clip: `${name.toLowerCase()}.glb`,
          x: 200 + Math.random() * 200,
          y: 150 + Math.random() * 150,
          isDefault: false
        });
        this.renderNodes();
      }
    });

    // Add transition
    this.modal.querySelector('#btn-add-anim-trans').addEventListener('click', () => {
      const from = prompt('From state name (e.g. Idle, Walk):', 'Idle');
      const to = prompt('To state name (e.g. Jump, Attack):', 'Attack');
      const cond = prompt('Condition (e.g. isAttacking == true, speed > 2.0):', 'isAttacking == true');

      if (from && to && cond) {
        this.graph.transitions.push({
          from,
          to,
          condition: cond,
          blendTime: 0.2
        });
        this.renderNodes();
      }
    });

    // Save graph
    this.modal.querySelector('#btn-save-anim-graph').addEventListener('click', () => {
      if (this.targetEntity) {
        this.targetEntity.animGraph = JSON.parse(JSON.stringify(this.graph));
      }
      this.editor.animGraph = JSON.parse(JSON.stringify(this.graph));
      this.editor.events.emit('scene:changed');
      this.close();
    });
  }

  evaluateTransitions() {
    let active = this.graph.defaultState || 'Idle';
    const params = this.graph.parameters;

    for (const t of this.graph.transitions) {
      if (t.from === active) {
        let match = false;
        if (t.condition.includes('isGrounded == false') && !params.isGrounded) match = true;
        if (t.condition.includes('isGrounded == true') && params.isGrounded) match = true;
        if (t.condition.includes('isAttacking == true') && params.isAttacking) match = true;
        if (t.condition.includes('speed >') && params.speed > parseFloat(t.condition.split('>')[1])) match = true;
        if (t.condition.includes('speed <=') && params.speed <= parseFloat(t.condition.split('<=')[1])) match = true;

        if (match) {
          active = t.to;
        }
      }
    }

    this.activeState = active;
    if (this.modal) {
      const badge = this.modal.querySelector('#anim-active-state-badge');
      if (badge) {
        badge.textContent = `Active State: ${active}`;
      }
    }
  }

  renderNodes() {
    const container = this.modal.querySelector('#anim-nodes-container');
    const svg = this.modal.querySelector('#anim-canvas-svg');
    const transList = this.modal.querySelector('#anim-transitions-list');

    if (!container || !svg) return;

    container.innerHTML = '';
    svg.innerHTML = '';
    transList.innerHTML = '';

    // Render State Nodes
    this.graph.states.forEach(state => {
      const nodeEl = document.createElement('div');
      nodeEl.style.cssText = `
        position: absolute;
        left: ${state.x}px;
        top: ${state.y}px;
        width: 140px;
        background: ${state.isDefault ? 'rgba(168, 85, 247, 0.25)' : 'var(--bg-darker)'};
        border: 1px solid ${state.isDefault ? '#a855f7' : 'var(--border-highlight)'};
        border-radius: 8px;
        padding: 8px 10px;
        color: #fff;
        font-size: 11px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.5);
        cursor: move;
        user-select: none;
      `;

      nodeEl.innerHTML = `
        <div style="font-weight: 700; color: ${state.isDefault ? '#c084fc' : 'var(--accent-cyan)'}; display: flex; justify-content: space-between;">
          <span>${state.id}</span>
          ${state.isDefault ? '<span style="font-size: 9px; background: #a855f7; color: #fff; padding: 1px 4px; border-radius: 3px;">DEFAULT</span>' : ''}
        </div>
        <div style="font-size: 10px; color: var(--text-muted); margin-top: 4px;">Clip: ${state.clip}</div>
      `;

      // Drag node
      nodeEl.addEventListener('mousedown', (e) => {
        let isDragging = true;
        const startX = e.clientX - state.x;
        const startY = e.clientY - state.y;
        e.stopPropagation();

        const onMouseMove = (moveEvt) => {
          if (!isDragging) return;
          state.x = Math.max(10, moveEvt.clientX - startX);
          state.y = Math.max(10, moveEvt.clientY - startY);
          nodeEl.style.left = `${state.x}px`;
          nodeEl.style.top = `${state.y}px`;
          this.renderLines();
        };

        const onMouseUp = () => {
          isDragging = false;
          window.removeEventListener('mousemove', onMouseMove);
          window.removeEventListener('mouseup', onMouseUp);
        };

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
      });

      container.appendChild(nodeEl);
    });

    // Render Transitions in list
    this.graph.transitions.forEach(t => {
      const row = document.createElement('div');
      row.style.cssText = 'background: rgba(255,255,255,0.05); padding: 4px 6px; border-radius: 4px; display: flex; align-items: center; justify-content: space-between;';
      row.innerHTML = `
        <span><strong>${t.from}</strong> ➔ <strong>${t.to}</strong></span>
        <span style="color: var(--accent-orange);">${t.condition}</span>
      `;
      transList.appendChild(row);
    });

    this.renderLines();
    this.evaluateTransitions();
  }

  renderLines() {
    const svg = this.modal.querySelector('#anim-canvas-svg');
    if (!svg) return;
    svg.innerHTML = '';

    this.graph.transitions.forEach(t => {
      const fromState = this.graph.states.find(s => s.id === t.from);
      const toState = this.graph.states.find(s => s.id === t.to);

      if (fromState && toState) {
        const x1 = fromState.x + 70;
        const y1 = fromState.y + 20;
        const x2 = toState.x + 70;
        const y2 = toState.y + 20;

        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', x1);
        line.setAttribute('y1', y1);
        line.setAttribute('x2', x2);
        line.setAttribute('y2', y2);
        line.setAttribute('stroke', '#a855f7');
        line.setAttribute('stroke-width', '2');
        line.setAttribute('stroke-dasharray', '4');

        svg.appendChild(line);
      }
    });
  }

  open(targetEntity = null) {
    this.targetEntity = targetEntity;
    if (targetEntity && targetEntity.animGraph) {
      this.graph = JSON.parse(JSON.stringify(targetEntity.animGraph));
    }
    this.modal.style.display = 'flex';
    this.isOpen = true;
    this.renderNodes();
  }

  close() {
    this.modal.style.display = 'none';
    this.isOpen = false;
  }
}
