import { AGENT_ROLES, getAllAgentRoles } from '../ai/swarm/agent-roles.js';

/**
 * MakuluLinux Game Studio · Agent Swarm UI View
 * Real-time visualization of agent collaboration, message flow, inspection scorecards, and auto-repairs.
 */
export class AgentSwarmView {
  constructor(container, agentTeam) {
    this.container = container;
    this.team = agentTeam;
    this.bus = agentTeam.messageBus;
    this.isTeamModeActive = true;

    this.render();
    this.bindBusEvents();
  }

  render() {
    this.element = document.createElement('div');
    this.element.className = 'agent-swarm-container';
    this.element.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 6px;
      padding: 8px 10px;
      background: rgba(15, 23, 42, 0.7);
      border-bottom: 1px solid var(--border-subtle);
    `;

    const roles = getAllAgentRoles();

    this.element.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between; font-size: 11px;">
        <div style="display: flex; align-items: center; gap: 6px;">
          <span style="font-weight: 700; color: #f59e0b; display: flex; align-items: center; gap: 4px;">
            🤖 AI Agent Team
          </span>
          <span style="font-size: 10px; color: var(--text-muted);">(AutoGPT Swarm)</span>
        </div>
        <div style="display: flex; align-items: center; gap: 6px;">
          <button id="btn-toggle-swarm-roster" class="btn" style="font-size: 10px; padding: 2px 6px;">
            👥 Roster (${roles.length})
          </button>
          <label style="display: flex; align-items: center; gap: 4px; cursor: pointer; font-size: 10px; color: var(--text-secondary);">
            <input type="checkbox" id="chk-swarm-mode" checked style="accent-color: var(--accent-orange);" />
            <span>Team Mode</span>
          </label>
        </div>
      </div>

      <!-- Real-time Agent Avatars Row -->
      <div id="swarm-agents-row" style="display: flex; gap: 5px; overflow-x: auto; padding-bottom: 2px;">
        ${roles.map(r => `
          <div class="swarm-avatar-pill" id="agent-pill-${r.id}" title="${r.name} - ${r.title}" style="display: flex; align-items: center; gap: 4px; padding: 2px 7px; background: rgba(30, 41, 59, 0.8); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; font-size: 10px; white-space: nowrap; transition: all 0.2s ease;">
            <span>${r.avatar}</span>
            <span style="color: var(--text-primary); font-weight: 500;">${r.name.split(' ')[0]}</span>
            <span class="agent-status-dot" style="width: 5px; height: 5px; border-radius: 50%; background: #64748b;"></span>
          </div>
        `).join('')}
      </div>
    `;

    this.container.prepend(this.element);

    const chk = this.element.querySelector('#chk-swarm-mode');
    chk.addEventListener('change', (e) => {
      this.isTeamModeActive = e.target.checked;
    });

    const rosterBtn = this.element.querySelector('#btn-toggle-swarm-roster');
    rosterBtn.addEventListener('click', () => {
      this.showRosterModal();
    });
  }

  bindBusEvents() {
    this.bus.subscribe((event) => {
      if (event.type === 'agent_state_changed') {
        const pill = this.element.querySelector(`#agent-pill-${event.agentId}`);
        if (pill) {
          const dot = pill.querySelector('.agent-status-dot');
          if (dot) {
            if (event.status === 'working' || event.status === 'planning') {
              dot.style.background = '#f59e0b';
              dot.style.boxShadow = '0 0 6px #f59e0b';
              pill.style.borderColor = '#f59e0b';
            } else if (event.status === 'inspecting') {
              dot.style.background = '#06b6d4';
              dot.style.boxShadow = '0 0 6px #06b6d4';
              pill.style.borderColor = '#06b6d4';
            } else if (event.status === 'repairing') {
              dot.style.background = '#ec4899';
              dot.style.boxShadow = '0 0 6px #ec4899';
              pill.style.borderColor = '#ec4899';
            } else if (event.status === 'completed') {
              dot.style.background = '#10b981';
              dot.style.boxShadow = 'none';
              pill.style.borderColor = 'rgba(16, 185, 129, 0.4)';
            } else {
              dot.style.background = '#64748b';
              dot.style.boxShadow = 'none';
              pill.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            }
          }
        }
      }
    });
  }

  showRosterModal() {
    const existing = document.getElementById('swarm-roster-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'swarm-roster-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(6px);
      z-index: 2000;
      display: flex;
      align-items: center;
      justify-content: center;
    `;

    const roles = getAllAgentRoles();

    modal.innerHTML = `
      <div style="width: 720px; max-height: 80vh; background: var(--bg-darkest); border: 1px solid var(--border-highlight); border-radius: var(--radius-lg); box-shadow: var(--shadow-lg); display: flex; flex-direction: column; overflow: hidden;">
        <div style="height: 44px; background: var(--bg-darker); border-bottom: 1px solid var(--border-subtle); display: flex; align-items: center; justify-content: space-between; padding: 0 16px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 16px;">🤖</span>
            <span style="font-weight: 700; font-size: 13px; color: var(--text-primary);">Makulu AI Swarm · Specialist Agent Roster</span>
          </div>
          <button id="btn-close-roster" class="btn" style="padding: 2px 8px; font-size: 11px;">✕</button>
        </div>
        <div style="flex: 1; overflow-y: auto; padding: 16px; display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          ${roles.map(r => `
            <div style="background: rgba(30, 41, 59, 0.5); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 8px; padding: 12px; display: flex; flex-direction: column; gap: 6px;">
              <div style="display: flex; align-items: center; justify-content: space-between;">
                <div style="display: flex; align-items: center; gap: 6px;">
                  <span style="font-size: 18px;">${r.avatar}</span>
                  <div>
                    <div style="font-weight: 700; font-size: 12px; color: ${r.badgeColor};">${r.name}</div>
                    <div style="font-size: 10px; color: var(--text-muted);">${r.title}</div>
                  </div>
                </div>
              </div>
              <div style="font-size: 11px; color: var(--text-secondary); line-height: 1.4;">
                ${r.systemPrompt}
              </div>
              <div style="font-size: 10px; color: #94a3b8; margin-top: 4px;">
                <strong>Assigned Skills:</strong>
                <div style="display: flex; flex-wrap: wrap; gap: 4px; margin-top: 4px;">
                  ${r.skills.map(s => `<span style="background: rgba(255,255,255,0.06); padding: 1px 6px; border-radius: 4px; font-family: var(--font-mono); font-size: 9.5px;">${s}</span>`).join('')}
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    modal.querySelector('#btn-close-roster').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });
  }
}
