import { aiSettings, DEFAULT_AI_PROVIDERS } from '../ai/ai-settings.js';
import { showToast } from './toast.js';

/**
 * AI Provider & API Settings Modal
 */
export class AISettingsModal {
  constructor(editor) {
    this.editor = editor;
    this.settings = aiSettings;
    this.selectedProviderId = this.settings.activeProviderId;
    this.isOpen = false;
    this.showKey = false;
    this.render();
    this.bindEvents();
  }

  render() {
    this.modal = document.createElement('div');
    this.modal.id = 'ai-settings-modal';
    this.modal.style.cssText = `
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0, 0, 0, 0.78);
      backdrop-filter: blur(10px);
      z-index: 1000;
      display: none;
      align-items: center;
      justify-content: center;
      padding: 24px;
      font-family: var(--font-sans);
    `;

    this.modal.innerHTML = `
      <div style="width: 900px; max-width: 95vw; height: 82vh; max-height: 760px; background: var(--bg-darkest); border: 1px solid var(--accent-orange); border-radius: var(--radius-lg); box-shadow: 0 20px 60px rgba(0,0,0,0.8), 0 0 35px rgba(255,102,0,0.25); display: flex; flex-direction: column; overflow: hidden;">
        
        <!-- Header -->
        <div style="height: 54px; background: var(--bg-darker); border-bottom: 1px solid var(--border-subtle); display: flex; align-items: center; justify-content: space-between; padding: 0 22px; flex-shrink: 0;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="width: 32px; height: 32px; border-radius: 8px; background: rgba(255, 102, 0, 0.2); border: 1px solid var(--accent-orange); display: flex; align-items: center; justify-content: center; font-size: 18px; color: var(--accent-orange);">
              🤖
            </div>
            <div>
              <div style="font-weight: 700; font-size: 15px; color: var(--text-primary); letter-spacing: -0.2px;">
                AI Studio Settings & Provider Setup
              </div>
              <div style="font-size: 11px; color: var(--text-secondary);">
                Configure custom API keys for OpenAI, Gemini, Claude, Groq, Kimi, Mistral, OpenRouter & Local LLMs
              </div>
            </div>
          </div>
          <button id="ai-settings-btn-close" class="btn" style="padding: 4px 10px; font-size: 14px; border-radius: 6px;">✕</button>
        </div>

        <!-- Body Layout -->
        <div style="flex: 1; display: flex; overflow: hidden;">
          
          <!-- Left Provider List -->
          <div style="width: 270px; background: var(--bg-darker); border-right: 1px solid var(--border-subtle); display: flex; flex-direction: column; flex-shrink: 0;">
            <div style="padding: 12px 14px; border-bottom: 1px solid var(--border-subtle); font-size: 11px; font-weight: 700; color: var(--accent-orange); text-transform: uppercase; letter-spacing: 0.5px;">
              Supported Providers
            </div>
            <div id="ai-provider-list" style="flex: 1; overflow-y: auto; padding: 8px;">
              <!-- Rendered dynamically -->
            </div>
            <div style="padding: 12px; border-top: 1px solid var(--border-subtle); font-size: 11px; color: var(--text-muted); text-align: center;">
              Active: <b id="ai-footer-active-name" style="color: var(--accent-orange);">MakuluLinux AI</b>
            </div>
          </div>

          <!-- Right Provider Configuration Panel -->
          <div id="ai-provider-detail" style="flex: 1; display: flex; flex-direction: column; overflow-y: auto; padding: 28px 32px; background: var(--bg-darkest); color: var(--text-primary);">
            <!-- Rendered dynamically -->
          </div>

        </div>

      </div>
    `;

    document.body.appendChild(this.modal);
    this.renderProviderList();
    this.renderDetail();
  }

  renderProviderList() {
    const list = this.modal.querySelector('#ai-provider-list');
    const providers = Object.values(this.settings.providers);

    list.innerHTML = providers.map(p => {
      const isSelected = p.id === this.selectedProviderId;
      const isActive = p.id === this.settings.activeProviderId;
      const hasKey = Boolean(p.apiKey && p.apiKey.trim().length > 0);

      return `
        <div class="ai-provider-item ${isSelected ? 'selected' : ''}" data-id="${p.id}" style="
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          margin-bottom: 4px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.15s ease;
          background: ${isSelected ? 'rgba(255,102,0,0.18)' : 'transparent'};
          border: 1px solid ${isSelected ? 'var(--accent-orange)' : 'transparent'};
        ">
          <span style="font-size: 18px;">${p.icon}</span>
          <div style="flex: 1; min-width: 0;">
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <span style="font-size: 12px; font-weight: 600; color: ${isSelected ? '#fff' : 'var(--text-primary)'}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                ${p.name}
              </span>
              ${isActive ? '<span class="badge badge-green" style="font-size: 9px; padding: 1px 5px;">ACTIVE</span>' : ''}
            </div>
            <div style="display: flex; align-items: center; gap: 6px; margin-top: 2px;">
              <span style="font-size: 10px; color: var(--text-secondary);">${p.badge}</span>
              ${hasKey ? '<span style="font-size: 10px;" title="API Key Saved">🔑</span>' : ''}
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Update footer label
    const activeP = this.settings.getActiveProvider();
    const footerLabel = this.modal.querySelector('#ai-footer-active-name');
    if (footerLabel) footerLabel.textContent = `${activeP.name} [${activeP.model}]`;

    // Click events
    list.querySelectorAll('.ai-provider-item').forEach(el => {
      el.addEventListener('click', () => {
        this.selectedProviderId = el.dataset.id;
        this.renderProviderList();
        this.renderDetail();
      });
    });
  }

  renderDetail() {
    const detail = this.modal.querySelector('#ai-provider-detail');
    const p = this.settings.providers[this.selectedProviderId];
    if (!p) return;

    const isActive = p.id === this.settings.activeProviderId;
    const isBuiltIn = p.id === 'makulu';

    detail.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="font-size: 32px;">${p.icon}</div>
          <div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <h2 style="margin: 0; font-size: 18px; color: #fff;">${p.name}</h2>
              <span class="badge ${isActive ? 'badge-green' : 'badge-orange'}" style="font-size: 11px;">${p.badge}</span>
            </div>
            <div style="font-size: 12px; color: var(--text-secondary); margin-top: 2px;">${p.notes}</div>
          </div>
        </div>

        <button id="btn-set-active-provider" class="btn ${isActive ? 'btn-primary' : ''}" style="
          padding: 6px 14px;
          font-size: 12px;
          font-weight: 700;
          background: ${isActive ? 'var(--accent-green)' : 'rgba(255,102,0,0.2)'};
          border-color: ${isActive ? 'var(--accent-green)' : 'var(--accent-orange)'};
          color: ${isActive ? '#fff' : 'var(--accent-orange)'};
        ">
          ${isActive ? '✓ Active Studio Engine' : '★ Set as Active'}
        </button>
      </div>

      <div style="height: 1px; background: var(--border-subtle); margin-bottom: 20px;"></div>

      ${p.id === 'makulu' ? (
        this.settings.isSystemAuthDetected && this.settings.systemAuth ? `
          <div style="background: rgba(16, 185, 129, 0.12); border: 1px solid #10b981; border-radius: 6px; padding: 10px 14px; margin-bottom: 16px; font-size: 12px; color: #10b981; display: flex; align-items: center; justify-content: space-between;">
            <div>
              <b>🟢 MakuluLinux AI-OS Detected:</b> Credentials automatically loaded from <code>~/.config/ai_terminal/electra_auth.json</code> (@${this.settings.systemAuth.username} · ${this.settings.systemAuth.tier} Tier)
            </div>
            <span class="badge badge-green" style="font-size: 10px;">AUTO-LOADED</span>
          </div>
        ` : `
          <div style="background: rgba(255, 102, 0, 0.12); border: 1px solid var(--accent-orange); border-radius: 6px; padding: 10px 14px; margin-bottom: 16px; font-size: 12px; color: var(--accent-orange);">
            <b>⚪ No System Key Detected:</b> If you are on MakuluLinux, make sure you are logged into AI Terminal. Otherwise, please enter your Electra API key below, or switch to OpenAI, Gemini, Claude, or Groq.
          </div>
        `
      ) : ''}

      <!-- Settings Form -->
      <div style="display: flex; flex-direction: column; gap: 18px;">
        
        <!-- API Key Input -->
        <div>
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
            <label style="font-size: 12.5px; font-weight: 600; color: var(--text-primary);">API Key</label>
            ${p.keyUrl ? `<a href="${p.keyUrl}" target="_blank" style="font-size: 11px; color: var(--accent-orange); text-decoration: underline;">Get ${p.name} API Key ↗</a>` : ''}
          </div>
          <div style="display: flex; gap: 8px;">
            <input type="${this.showKey ? 'text' : 'password'}" id="input-provider-key" value="${p.apiKey || ''}" placeholder="${p.id === 'makulu' ? 'Enter your Electra AI API Key...' : 'Enter your ' + p.name + ' API Key...'}" style="
              flex: 1;
              background: var(--bg-panel);
              border: 1px solid var(--border-subtle);
              border-radius: 6px;
              padding: 8px 12px;
              font-size: 12px;
              color: var(--text-primary);
              font-family: var(--font-mono);
              outline: none;
            " />
            <button id="btn-toggle-show-key" class="btn" title="Toggle visibility" style="padding: 6px 12px; font-size: 12px;">
              ${this.showKey ? '🙈 Hide' : '👁️ Show'}
            </button>
          </div>
          <div style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">
            Your keys are stored exclusively in your local browser storage and never sent anywhere else.
          </div>
        </div>

        <!-- Model Selection -->
        <div>
          <label style="display: block; font-size: 12.5px; font-weight: 600; color: var(--text-primary); margin-bottom: 6px;">Active Model</label>
          <div style="display: flex; gap: 8px;">
            <select id="select-provider-model" class="select-input" style="flex: 1; height: 36px; padding: 6px 10px; font-size: 12px;">
              ${p.availableModels.map(m => `
                <option value="${m}" ${m === p.model ? 'selected' : ''}>${m}</option>
              `).join('')}
            </select>
            <input type="text" id="input-custom-model" placeholder="Or type custom model ID..." style="
              width: 220px;
              background: var(--bg-panel);
              border: 1px solid var(--border-subtle);
              border-radius: 6px;
              padding: 6px 10px;
              font-size: 12px;
              color: var(--text-primary);
              font-family: var(--font-mono);
              outline: none;
            " />
          </div>
        </div>

        <!-- API Endpoint (Advanced) -->
        <div>
          <label style="display: block; font-size: 12.5px; font-weight: 600; color: var(--text-primary); margin-bottom: 6px;">
            API Endpoint URL <span style="font-size: 11px; font-weight: 400; color: var(--text-muted);">(Advanced / Custom Proxies)</span>
          </label>
          <div style="display: flex; gap: 8px;">
            <input type="text" id="input-provider-endpoint" value="${p.endpoint}" style="
              flex: 1;
              background: var(--bg-panel);
              border: 1px solid var(--border-subtle);
              border-radius: 6px;
              padding: 8px 12px;
              font-size: 12px;
              color: var(--text-primary);
              font-family: var(--font-mono);
              outline: none;
            " />
            <button id="btn-reset-endpoint" class="btn" title="Reset to default endpoint" style="padding: 6px 10px; font-size: 11px;">Reset</button>
          </div>
        </div>

        <!-- Connection Test & Status Output -->
        <div style="background: var(--bg-panel); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 14px; margin-top: 6px;">
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <div>
              <div style="font-weight: 600; font-size: 12.5px; color: var(--text-primary);">Test Provider Connection</div>
              <div style="font-size: 11px; color: var(--text-secondary);">Verify that your API key and endpoint are working properly.</div>
            </div>
            <button id="btn-test-connection" class="btn" style="padding: 6px 14px; font-size: 12px; background: rgba(0, 229, 255, 0.15); border-color: #00e5ff; color: #00e5ff; font-weight: 600;">
              🧪 Test Connection
            </button>
          </div>
          <div id="ai-test-result" style="margin-top: 10px; display: none; font-size: 12px; padding: 8px 12px; border-radius: 6px;"></div>
        </div>

        <!-- Save Button -->
        <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 14px;">
          <button id="btn-save-ai-settings" class="btn btn-primary" style="padding: 8px 20px; font-size: 12.5px; font-weight: 700;">
            💾 Save Settings
          </button>
        </div>

      </div>
    `;

    this.bindDetailEvents(p);
  }

  bindDetailEvents(p) {
    const detail = this.modal.querySelector('#ai-provider-detail');

    // Toggle password view
    const toggleBtn = detail.querySelector('#btn-toggle-show-key');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        this.showKey = !this.showKey;
        const keyInput = detail.querySelector('#input-provider-key');
        keyInput.type = this.showKey ? 'text' : 'password';
        toggleBtn.innerHTML = this.showKey ? '🙈 Hide' : '👁️ Show';
      });
    }

    // Reset Endpoint
    const resetEndpointBtn = detail.querySelector('#btn-reset-endpoint');
    if (resetEndpointBtn) {
      resetEndpointBtn.addEventListener('click', () => {
        const endpointInput = detail.querySelector('#input-provider-endpoint');
        if (DEFAULT_AI_PROVIDERS[p.id]) {
          endpointInput.value = DEFAULT_AI_PROVIDERS[p.id].endpoint;
        }
      });
    }

    // Set Active Provider Button
    const setActiveBtn = detail.querySelector('#btn-set-active-provider');
    if (setActiveBtn) {
      setActiveBtn.addEventListener('click', () => {
        this.applyFormChanges(p);
        this.settings.setActiveProvider(p.id);
        this.renderProviderList();
        this.renderDetail();
        showToast(`⚡ ${p.name} set as active AI Copilot engine!`, 'success');
      });
    }

    // Test Connection
    const testBtn = detail.querySelector('#btn-test-connection');
    const resultBox = detail.querySelector('#ai-test-result');
    if (testBtn) {
      testBtn.addEventListener('click', async () => {
        this.applyFormChanges(p);
        testBtn.disabled = true;
        testBtn.textContent = '⏳ Testing...';
        resultBox.style.display = 'block';
        resultBox.style.background = 'rgba(0, 229, 255, 0.1)';
        resultBox.style.border = '1px solid #00e5ff';
        resultBox.style.color = '#00e5ff';
        resultBox.textContent = `Pinging ${p.name} with model ${p.model}...`;

        try {
          const res = await this.settings.testConnection(p.id);
          resultBox.style.background = 'rgba(16, 185, 129, 0.15)';
          resultBox.style.border = '1px solid #10b981';
          resultBox.style.color = '#10b981';
          resultBox.innerHTML = `✅ <b>Connection Successful!</b> Latency: ${res.latency}ms · Model: <code>${res.model}</code>`;
          showToast(`✓ Connected to ${p.name}!`, 'success');
        } catch (err) {
          resultBox.style.background = 'rgba(239, 68, 68, 0.15)';
          resultBox.style.border = '1px solid #ef4444';
          resultBox.style.color = '#f87171';
          resultBox.innerHTML = `❌ <b>Connection Failed:</b> ${err.message}`;
          showToast(`Connection failed: ${err.message}`, 'error');
        } finally {
          testBtn.disabled = false;
          testBtn.textContent = '🧪 Test Connection';
        }
      });
    }

    // Save Settings
    const saveBtn = detail.querySelector('#btn-save-ai-settings');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        this.applyFormChanges(p);
        this.settings.save();
        this.renderProviderList();
        showToast(`💾 Settings saved for ${p.name}!`, 'success');
      });
    }
  }

  applyFormChanges(p) {
    const detail = this.modal.querySelector('#ai-provider-detail');
    const keyInput = detail.querySelector('#input-provider-key');
    const modelSelect = detail.querySelector('#select-provider-model');
    const customModelInput = detail.querySelector('#input-custom-model');
    const endpointInput = detail.querySelector('#input-provider-endpoint');

    const model = customModelInput.value.trim() || modelSelect.value;
    const apiKey = keyInput.value.trim();
    const endpoint = endpointInput.value.trim();

    this.settings.updateProvider(p.id, {
      apiKey,
      model,
      endpoint
    });
  }

  bindEvents() {
    const closeBtn = this.modal.querySelector('#ai-settings-btn-close');
    closeBtn.addEventListener('click', () => this.close());

    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) this.close();
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });
  }

  open(providerId = null) {
    if (providerId && this.settings.providers[providerId]) {
      this.selectedProviderId = providerId;
    } else {
      this.selectedProviderId = this.settings.activeProviderId;
    }
    this.renderProviderList();
    this.renderDetail();
    this.modal.style.display = 'flex';
    this.isOpen = true;
  }

  close() {
    this.modal.style.display = 'none';
    this.isOpen = false;
  }
}
