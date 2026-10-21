import { MakuluAIClient } from '../ai/ai-client.js';
import { AIExecutor } from '../ai/ai-executor.js';
import { SceneAuditor } from '../ai/scene-auditor.js';
import { aiSettings } from '../ai/ai-settings.js';

/**
 * Makulu AI Copilot UI Dock
 */
export class AIAssistantUI {
  constructor(editor, settingsModal = null) {
    this.editor = editor;
    this.client = new MakuluAIClient(editor);
    this.executor = new AIExecutor(editor);
    this.auditor = new SceneAuditor(editor);
    this.settingsModal = settingsModal;
    this.isMinimized = false;
    this.isOpen = true;

    this.render();
    this.bindEvents();
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

    // Add thinking placeholder
    const assistantMsg = document.createElement('div');
    assistantMsg.className = 'ai-message assistant';
    assistantMsg.innerHTML = `
      <div class="ai-bubble">
        <span style="display: inline-flex; align-items: center; gap: 6px;">
          <span class="ai-pulse-dot" style="width: 6px; height: 6px;"></span>
          Co-Creator is generating...
        </span>
      </div>
    `;
    chatBody.appendChild(assistantMsg);
    chatBody.scrollTop = chatBody.scrollHeight;

    try {
      const response = await this.client.sendMessage(promptText);
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

      assistantMsg.innerHTML = `
        <div class="ai-bubble">
          ${cleanText ? cleanText.replace(/\n/g, '<br>') : 'I have created the requested scene setup!'}
          ${actionCardHTML}
        </div>
      `;
    } catch (err) {
      assistantMsg.innerHTML = `
        <div class="ai-bubble" style="border-color: #ef4444; color: #fca5a5;">
          ⚠️ AI Request Error: ${err.message}. Please check your connection to the MakuluLinux AI server.
        </div>
      `;
    }

    chatBody.scrollTop = chatBody.scrollHeight;
  }

  escapeHTML(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
}
