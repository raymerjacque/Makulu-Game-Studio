import { MakuluAIClient } from '../ai/ai-client.js';
import { AIExecutor } from '../ai/ai-executor.js';
import { SceneAuditor } from '../ai/scene-auditor.js';
import { aiSettings } from '../ai/ai-settings.js';
import { AgentTeam } from '../ai/swarm/agent-team.js';
import { AgentSwarmView } from './agent-swarm-view.js';

/**
 * Makulu AI Copilot UI Dock with AutoGPT Agent Swarm Team
 */
export class AIAssistantUI {
  constructor(editor, settingsModal = null) {
    this.editor = editor;
    this.client = new MakuluAIClient(editor);
    this.executor = new AIExecutor(editor);
    this.auditor = new SceneAuditor(editor);
    this.team = new AgentTeam(editor, this.client, this.executor);
    this.settingsModal = settingsModal;
    this.isMinimized = false;
    this.isOpen = true;
    this.thinkingElement = null;
    this.viewportPill = null;

    this.render();
    this.bindEvents();
    this.bindSwarmMessages();
  }

  setSettingsModal(modal) {
    this.settingsModal = modal;
  }

  render() {
    const active = aiSettings.getActiveProvider();
    this.panel = document.createElement('div');
    this.panel.id = 'ai-copilot-panel';
    this.panel.innerHTML = `
      <div class="ai-header" id="ai-header">
        <div class="ai-header-title">
          <div class="ai-pulse-dot"></div>
          <span>Makulu AI Copilot</span>
          <span id="ai-active-model-tag" style="font-size: 10px; color: var(--accent-orange); font-family: var(--font-mono);">[${active.name}: ${active.model}]</span>
          <span id="ai-busy-badge" class="ai-header-busy-badge" style="display: none;">
            <span class="ai-busy-spinner-small"></span>
            <span>WORKING</span>
          </span>
        </div>
        <div style="display: flex; align-items: center; gap: 4px;">
          <button id="ai-btn-settings" class="btn" title="AI Settings & Providers (OpenAI, Gemini, Claude, Groq, etc.)" style="padding: 1px 6px; font-size: 11px;">⚙️</button>
          <button id="ai-btn-min" class="btn" style="padding: 1px 6px; font-size: 10px;">_</button>
          <button id="ai-btn-close" class="btn" style="padding: 1px 6px; font-size: 10px;">✕</button>
        </div>
      </div>

      <div class="ai-chat-body" id="ai-chat-body">
        <div class="ai-message assistant">
          <div class="ai-bubble">
            👋 Greetings! I am your <strong>MakuluLinux Game Studio AI Co-Creator</strong>.
            I can generate 3D levels, configure lighting, create materials, write PlayCanvas game scripts, and inspect scene performance.
            <div style="margin-top: 6px; font-size: 11px; color: var(--text-secondary);">
              Try one of the quick actions below, or ask me to build anything!
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Action Chips -->
      <div class="ai-shortcuts">
        <div class="ai-chip" id="ai-chip-audit" style="background: rgba(16,185,129,0.18); border-color: var(--accent-green); color: var(--accent-green); font-weight: 700;">🩺 Audit Scene Health</div>
        <div class="ai-chip" data-prompt="Build a medieval arena with 6 pillars and a center fire light">🏰 Castle Arena</div>
        <div class="ai-chip" data-prompt="Create 4 glowing neon cyber pillars with point lights">💡 Neon Pillars</div>
        <div class="ai-chip" data-prompt="Generate a smooth WASD player movement script">🎮 WASD Controller</div>
        <div class="ai-chip" data-prompt="Add a low-poly terrain ground with 5 random boulders">🏔️ Boulder Field</div>
      </div>

      <!-- Input Bar -->
      <div class="ai-input-bar">
        <input type="text" id="ai-text-input" class="ai-input" placeholder="Ask AI to create or modify anything..." />
        <button id="ai-btn-send" class="btn btn-primary" style="padding: 6px 12px; font-size: 11px;">Send</button>
      </div>
    `;

    document.body.appendChild(this.panel);

    const chatBodyEl = this.panel.querySelector('#ai-chat-body');
    if (chatBodyEl && chatBodyEl.parentElement) {
      this.swarmView = new AgentSwarmView(chatBodyEl.parentElement, this.team);
      chatBodyEl.parentElement.insertBefore(this.swarmView.element, chatBodyEl);
    }
  }

  bindSwarmMessages() {
    const chatBody = this.panel.querySelector('#ai-chat-body');
    this.team.messageBus.subscribe((msg) => {
      if (!msg.content || msg.type === 'agent_state_changed') return;

      // Update active thinking status and HUD pill
      if (msg.type === 'plan') {
        this.updateThinkingStatus(msg.from, 'Decomposing task into specialist blueprints...');
      } else if (msg.type === 'task') {
        const cleanContent = msg.content.replace(/\*+/g, '').replace(/&mdash;/g, '-');
        this.updateThinkingStatus(msg.from, cleanContent);
      } else if (msg.type === 'action') {
        this.updateThinkingStatus(msg.from, 'Constructing entities and applying components...');
      } else if (msg.type === 'inspection') {
        this.updateThinkingStatus('QA Inspector', 'Auditing physics collision, lighting & scale...');
      } else if (msg.type === 'critique') {
        this.updateThinkingStatus('QA Inspector', 'Identified defects; initiating repair loop...');
      } else if (msg.type === 'repair') {
        this.updateThinkingStatus('Repair Specialist', 'Applying surgical fixes to scene...');
      }

      const card = document.createElement('div');
      card.className = 'ai-message assistant';

      let borderColor = 'rgba(255, 255, 255, 0.15)';
      let badgeBg = 'rgba(100, 116, 139, 0.2)';
      if (msg.type === 'plan') { borderColor = '#f59e0b'; badgeBg = 'rgba(245, 158, 11, 0.15)'; }
      else if (msg.type === 'task') { borderColor = '#3b82f6'; badgeBg = 'rgba(59, 130, 246, 0.15)'; }
      else if (msg.type === 'inspection') { borderColor = '#06b6d4'; badgeBg = 'rgba(6, 182, 212, 0.15)'; }
      else if (msg.type === 'critique') { borderColor = '#f59e0b'; badgeBg = 'rgba(245, 158, 11, 0.15)'; }
      else if (msg.type === 'repair') { borderColor = '#ec4899'; badgeBg = 'rgba(236, 72, 153, 0.15)'; }
      else if (msg.type === 'done') { borderColor = '#10b981'; badgeBg = 'rgba(16, 185, 129, 0.15)'; }

      card.innerHTML = `
        <div class="ai-bubble" style="border-left: 3px solid ${borderColor};">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
            <span style="font-size: 11px; font-weight: 700; color: #f1f5f9; background: ${badgeBg}; padding: 1px 6px; border-radius: 4px;">
              ${this.escapeHTML(msg.from)}
            </span>
            <span style="font-size: 9.5px; color: var(--text-muted); font-family: var(--font-mono); text-transform: uppercase;">
              ${msg.type}
            </span>
          </div>
          <div style="font-size: 11.5px; line-height: 1.45; color: var(--text-secondary);">
            ${msg.content.replace(/\n/g, '<br>')}
          </div>
        </div>
      `;

      // Keep the animated thinking indicator pinned at the bottom while agents talk
      if (this.thinkingElement && this.thinkingElement.parentElement === chatBody) {
        chatBody.insertBefore(card, this.thinkingElement);
      } else {
        chatBody.appendChild(card);
      }
      chatBody.scrollTop = chatBody.scrollHeight;
    });
  }

  bindEvents() {
    // Open AI Settings Modal
    const settingsBtn = this.panel.querySelector('#ai-btn-settings');
    if (settingsBtn) {
      settingsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.settingsModal) this.settingsModal.open();
      });
    }

    // Subscribe to AI settings changes to update model tag live
    aiSettings.subscribe((active) => {
      const tag = this.panel.querySelector('#ai-active-model-tag');
      if (tag) tag.textContent = `[${active.name}: ${active.model}]`;
    });

    // Header minimize/restore
    const minBtn = this.panel.querySelector('#ai-btn-min');
    minBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.isMinimized = !this.isMinimized;
      this.panel.classList.toggle('minimized', this.isMinimized);
      minBtn.textContent = this.isMinimized ? '□' : '_';
    });

    // Close button
    const closeBtn = this.panel.querySelector('#ai-btn-close');
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.panel.style.display = 'none';
      this.isOpen = false;
    });

    // Toggle event from Toolstrip or shortcuts
    this.editor.events.on('ai:toggle', () => {
      this.isOpen = !this.isOpen;
      this.panel.style.display = this.isOpen ? 'flex' : 'none';
      if (this.isOpen && this.isMinimized) {
        this.isMinimized = false;
        this.panel.classList.remove('minimized');
        minBtn.textContent = '_';
      }
    });

    // Scene Audit Chip
    const auditChip = this.panel.querySelector('#ai-chip-audit');
    if (auditChip) {
      auditChip.addEventListener('click', () => {
        this.runSceneAudit();
      });
    }

    // Quick Action Chips
    this.panel.querySelectorAll('.ai-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const prompt = chip.dataset.prompt;
        this.sendUserPrompt(prompt);
      });
    });

    // Input submission
    const input = this.panel.querySelector('#ai-text-input');
    const sendBtn = this.panel.querySelector('#ai-btn-send');

    const submit = () => {
      const text = input.value.trim();
      if (!text) return;
      input.value = '';
      this.sendUserPrompt(text);
    };

    sendBtn.addEventListener('click', submit);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') submit();
    });
  }

  runSceneAudit() {
    const { issues, stats } = this.auditor.audit();
    const chatBody = this.panel.querySelector('#ai-chat-body');

    const msg = document.createElement('div');
    msg.className = 'ai-message assistant';

    let issuesHTML = '';
    if (issues.length === 0) {
      issuesHTML = `<div style="color: var(--accent-green); font-size: 11px; margin-top: 6px;">✓ No performance bottlenecks or physics bugs detected. Scene health: 100%!</div>`;
    } else {
      issuesHTML = `
        <div style="display: flex; flex-direction: column; gap: 4px; margin-top: 8px;">
          ${issues.map(iss => `
            <div style="font-size: 11px; color: ${iss.type === 'error' ? '#fca5a5' : '#fde047'};">
              ${iss.type === 'error' ? '🔴' : '🟡'} ${iss.msg}
            </div>
          `).join('')}
          <button id="btn-fix-all-audit" class="btn btn-primary" style="margin-top: 6px; font-size: 11px; padding: 4px 8px;">
            🩹 1-Click Auto-Fix All Issues
          </button>
        </div>
      `;
    }

    msg.innerHTML = `
      <div class="ai-bubble">
        <strong>🩺 AI Scene Health & Performance Audit</strong>
        <div style="font-size: 11px; color: var(--text-secondary); margin-top: 4px;">
          Entities: <strong>${stats.totalEntities}</strong> | Lights: <strong>${stats.totalLights}</strong> (${stats.shadowCasters} shadows)
        </div>
        ${issuesHTML}
      </div>
    `;

    const fixBtn = msg.querySelector('#btn-fix-all-audit');
    if (fixBtn) {
      fixBtn.addEventListener('click', () => {
        this.auditor.fixAll(issues);
        fixBtn.textContent = '✓ Issues Fixed!';
        fixBtn.disabled = true;
      });
    }

    chatBody.appendChild(msg);
    chatBody.scrollTop = chatBody.scrollHeight;
  }

  async sendUserPrompt(promptText) {
    // Ensure open
    this.panel.style.display = 'flex';
    this.isOpen = true;
    if (this.isMinimized) {
      this.isMinimized = false;
      this.panel.classList.remove('minimized');
    }

    const chatBody = this.panel.querySelector('#ai-chat-body');

    // Add user message
    const userMsg = document.createElement('div');
    userMsg.className = 'ai-message user';
    userMsg.innerHTML = `<div class="ai-bubble">${this.escapeHTML(promptText)}</div>`;
    chatBody.appendChild(userMsg);
    chatBody.scrollTop = chatBody.scrollHeight;

    // AI Team Swarm Mode execution
    if (this.swarmView && this.swarmView.isTeamModeActive) {
      this.showThinkingIndicator('AI Team Swarm Active', '👑 Lead Director planning multi-agent execution...');
      try {
        await this.team.executeTeamTask(promptText, { maxRepairRounds: 2, useLLM: true });
      } catch (err) {
        const errMsg = document.createElement('div');
        errMsg.className = 'ai-message assistant';
        errMsg.innerHTML = `
          <div class="ai-bubble" style="border-color: #ef4444; color: #fca5a5;">
            ⚠️ AI Swarm Error: ${err.message}.
          </div>
        `;
        chatBody.appendChild(errMsg);
      } finally {
        this.hideThinkingIndicator();
      }
      chatBody.scrollTop = chatBody.scrollHeight;
      return;
    }

    // Fallback: Single Copilot Direct Mode
    this.showThinkingIndicator('AI Co-Creator Generating...', 'Analyzing scene and formulating actions...');

    try {
      const response = await this.client.sendMessage(promptText);
      this.updateThinkingStatus('AI Executor', 'Executing scene actions...');
      const actions = this.executor.parseActions(response);

      let actionCardHTML = '';
      if (actions && actions.length > 0) {
        // Execute actions on the scene
        const executed = await this.executor.executeActions(actions);
        actionCardHTML = `
          <div class="ai-action-card">
            <div class="ai-action-header">⚡ Executed ${executed.length} Scene Action(s)</div>
            <div class="ai-action-preview">${executed.map(e => `✓ ${e.action}: ${e.target || e.script}`).join('\n')}</div>
          </div>
        `;
      }

      // Format response text (strip the raw action json from display for clean UX)
      const cleanText = response.replace(/```json:actions[\s\S]*?```/g, '').trim();

      const assistantMsg = document.createElement('div');
      assistantMsg.className = 'ai-message assistant';
      assistantMsg.innerHTML = `
        <div class="ai-bubble">
          ${cleanText ? cleanText.replace(/\n/g, '<br>') : 'I have created the requested scene setup!'}
          ${actionCardHTML}
        </div>
      `;
      chatBody.appendChild(assistantMsg);
    } catch (err) {
      const errMsg = document.createElement('div');
      errMsg.className = 'ai-message assistant';
      errMsg.innerHTML = `
        <div class="ai-bubble" style="border-color: #ef4444; color: #fca5a5;">
          ⚠️ AI Request Error: ${err.message}. Please check your connection to the MakuluLinux AI server.
        </div>
      `;
      chatBody.appendChild(errMsg);
    } finally {
      this.hideThinkingIndicator();
    }

    chatBody.scrollTop = chatBody.scrollHeight;
  }

  /**
   * Display high-visibility animated thinking / busy indicator
   */
  showThinkingIndicator(title = 'AI is Thinking...', statusText = 'Analyzing request and preparing scene actions...') {
    this.hideThinkingIndicator();

    const chatBody = this.panel.querySelector('#ai-chat-body');
    if (!chatBody) return;

    this.thinkingElement = document.createElement('div');
    this.thinkingElement.className = 'ai-message assistant ai-thinking-wrapper';
    this.thinkingElement.innerHTML = `
      <div class="ai-bubble ai-thinking-card">
        <div class="ai-thinking-header">
          <div class="ai-thinking-spinner"></div>
          <div class="ai-thinking-title">
            <span class="ai-thinking-title-text">${this.escapeHTML(title)}</span>
            <div class="ai-wave-dots">
              <span class="ai-wave-dot"></span>
              <span class="ai-wave-dot"></span>
              <span class="ai-wave-dot"></span>
            </div>
          </div>
        </div>
        <div class="ai-thinking-status">
          <div class="ai-thinking-main-text">
            <span class="ai-thinking-agent-icon">⚡</span>
            <span class="ai-thinking-status-label">${this.escapeHTML(statusText)}</span>
          </div>
          <div class="ai-thinking-subtext">Executing multi-step generative pipeline</div>
        </div>
        <div class="ai-shimmer-container">
          <div class="ai-shimmer-bar"></div>
        </div>
      </div>
    `;

    chatBody.appendChild(this.thinkingElement);
    chatBody.scrollTop = chatBody.scrollHeight;

    this.setHeaderBusy(true);
    this.setTopBarBusy(true, title);
    this.showViewportHUDPill(title, statusText);
  }

  /**
   * Update text in thinking indicator in real-time
   */
  updateThinkingStatus(agentName, statusText) {
    if (this.thinkingElement) {
      const label = this.thinkingElement.querySelector('.ai-thinking-status-label');
      const subtext = this.thinkingElement.querySelector('.ai-thinking-subtext');
      const icon = this.thinkingElement.querySelector('.ai-thinking-agent-icon');
      if (label) label.textContent = statusText;
      if (subtext) subtext.textContent = `Active specialist: ${agentName}`;
      if (icon) icon.textContent = '⚙️';
    }

    this.updateViewportHUDPill(agentName, statusText);
    this.setTopBarBusy(true, `${agentName} working...`);
  }

  /**
   * Hide thinking indicator and reset busy indicators
   */
  hideThinkingIndicator() {
    if (this.thinkingElement && this.thinkingElement.parentElement) {
      this.thinkingElement.parentElement.removeChild(this.thinkingElement);
    }
    this.thinkingElement = null;

    this.setHeaderBusy(false);
    this.setTopBarBusy(false);
    this.hideViewportHUDPill();
  }

  /**
   * Header busy badge
   */
  setHeaderBusy(isBusy) {
    const badge = this.panel ? this.panel.querySelector('#ai-busy-badge') : null;
    if (badge) {
      badge.style.display = isBusy ? 'inline-flex' : 'none';
    }
  }

  /**
   * TopBar Quick Prompt busy state
   */
  setTopBarBusy(isBusy, status = 'AI is busy...') {
    const wrap = document.querySelector('.quick-prompt-wrap');
    const input = document.querySelector('#top-quick-prompt');
    const icon = document.querySelector('.quick-prompt-icon');
    if (!wrap || !input) return;

    if (isBusy) {
      wrap.classList.add('is-busy');
      input.disabled = true;
      if (!input.hasAttribute('data-orig-placeholder')) {
        input.setAttribute('data-orig-placeholder', input.placeholder || 'Ask AI Copilot...');
      }
      input.placeholder = `⚡ ${status}`;
      if (icon) icon.classList.add('spin-anim');
    } else {
      wrap.classList.remove('is-busy');
      input.disabled = false;
      const orig = input.getAttribute('data-orig-placeholder') || 'Ask AI Copilot...';
      input.placeholder = orig;
      if (icon) icon.classList.remove('spin-anim');
    }
  }

  /**
   * Floating Viewport HUD Pill
   */
  showViewportHUDPill(title, statusText) {
    this.hideViewportHUDPill();
    const vp = document.getElementById('viewport-container');
    if (!vp) return;

    this.viewportPill = document.createElement('div');
    this.viewportPill.className = 'viewport-ai-activity-pill';
    this.viewportPill.innerHTML = `
      <div class="ai-thinking-spinner" style="width: 14px; height: 14px; border-width: 2px;"></div>
      <div style="display: flex; flex-direction: column; gap: 1px;">
        <span style="font-size: 11px; font-weight: 700; color: #f59e0b;">${this.escapeHTML(title)}</span>
        <span class="viewport-ai-status-sub" style="font-size: 10px; color: #94a3b8; font-weight: 400;">${this.escapeHTML(statusText)}</span>
      </div>
    `;
    vp.appendChild(this.viewportPill);
  }

  updateViewportHUDPill(agentName, statusText) {
    if (!this.viewportPill) return;
    const sub = this.viewportPill.querySelector('.viewport-ai-status-sub');
    if (sub) {
      sub.textContent = `${agentName}: ${statusText}`;
    }
  }

  hideViewportHUDPill() {
    if (this.viewportPill && this.viewportPill.parentElement) {
      const pill = this.viewportPill;
      pill.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      pill.style.opacity = '0';
      pill.style.transform = 'translate(-50%, -10px)';
      setTimeout(() => {
        if (pill.parentElement) pill.parentElement.removeChild(pill);
      }, 300);
    }
    this.viewportPill = null;
  }

  escapeHTML(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
}
