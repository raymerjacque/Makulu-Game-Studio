/**
 * Editor Console & Diagnostic Logs Drawer
 * Captures logs, warnings, errors, and provides 1-click AI Debugging.
 */
export class ConsoleDrawer {
  constructor(container, editor, aiUI) {
    this.container = container;
    this.editor = editor;
    this.aiUI = aiUI;
    this.logs = [];
    this.isOpen = false;

    this.render();
    this.bindEvents();
    this.hookConsole();
  }

  render() {
    this.drawer = document.createElement('div');
    this.drawer.id = 'editor-console-drawer';
    this.drawer.style.cssText = `
      position: absolute;
      bottom: 0;
      left: 44px;
      right: 320px;
      height: 180px;
      background: rgba(14, 18, 24, 0.96);
      backdrop-filter: blur(12px);
      border-top: 1px solid var(--border-highlight);
      display: none;
      flex-direction: column;
      z-index: 80;
      box-shadow: 0 -8px 24px rgba(0, 0, 0, 0.5);
    `;

    this.drawer.innerHTML = `
      <div style="height: 32px; background: var(--bg-darker); border-bottom: 1px solid var(--border-subtle); display: flex; align-items: center; justify-content: space-between; padding: 0 12px; font-size: 11px; font-weight: 700;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span>📋 Console & Diagnostics</span>
          <span id="log-count-badge" style="background: rgba(255,255,255,0.08); padding: 1px 6px; border-radius: 4px; font-size: 10px; color: var(--text-muted);">0 items</span>
        </div>
        <div style="display: flex; align-items: center; gap: 6px;">
          <button id="btn-clear-console" class="btn" style="padding: 1px 6px; font-size: 10px;">Clear</button>
          <button id="btn-close-console" class="btn" style="padding: 1px 6px; font-size: 10px;">✕</button>
        </div>
      </div>

      <div id="console-logs-list" style="flex: 1; overflow-y: auto; padding: 8px; font-family: var(--font-mono); font-size: 11px; display: flex; flex-direction: column; gap: 4px;">
        <div style="color: var(--text-muted); padding: 6px;">Console ready. Logs, warnings, and runtime events will appear here.</div>
      </div>
    `;

    document.getElementById('center-stage').appendChild(this.drawer);
  }

  bindEvents() {
    const closeBtn = this.drawer.querySelector('#btn-close-console');
    closeBtn.addEventListener('click', () => this.toggle(false));

    const clearBtn = this.drawer.querySelector('#btn-clear-console');
    clearBtn.addEventListener('click', () => {
      this.logs = [];
      const list = this.drawer.querySelector('#console-logs-list');
      list.innerHTML = `<div style="color: var(--text-muted); padding: 6px;">Console cleared.</div>`;
      this.updateCountBadge();
    });

    // Toggle Console on shortcut or event
    this.editor.events.on('console:toggle', () => {
      this.toggle(!this.isOpen);
    });
  }

  hookConsole() {
    const origLog = console.log;
    const origWarn = console.warn;
    const origError = console.error;

    console.log = (...args) => {
      origLog(...args);
      this.addLog('info', args.join(' '));
    };

    console.warn = (...args) => {
      origWarn(...args);
      this.addLog('warn', args.join(' '));
    };

    console.error = (...args) => {
      origError(...args);
      this.addLog('error', args.join(' '));
    };
  }

  addLog(type, message) {
    if (!message || typeof message !== 'string') return;
    // Skip noisy internal vite messages
    if (message.includes('[vite]') || message.includes('HMR')) return;

    const time = new Date().toLocaleTimeString();
    const entry = { type, message, time };
    this.logs.push(entry);

    const list = this.drawer.querySelector('#console-logs-list');
    if (!list) return;

    const row = document.createElement('div');
    row.style.cssText = `
      display: flex;
      align-items: flex-start;
      gap: 8px;
      padding: 3px 6px;
      border-radius: 4px;
      background: ${type === 'error' ? 'rgba(239, 68, 68, 0.12)' : (type === 'warn' ? 'rgba(234, 179, 8, 0.1)' : 'transparent')};
      border-left: 3px solid ${type === 'error' ? '#ef4444' : (type === 'warn' ? '#eab308' : '#3b82f6')};
    `;

    const icon = type === 'error' ? '🔴' : (type === 'warn' ? '🟡' : '🔵');

    let aiFixBtn = '';
    if (type === 'error') {
      aiFixBtn = `<button class="btn btn-ai-fix" style="font-size: 9px; padding: 1px 6px; background: rgba(255,102,0,0.2); border-color: var(--accent-orange); color: var(--accent-orange); margin-left: auto;">✨ Ask AI to Fix</button>`;
    }

    row.innerHTML = `
      <span style="font-size: 9px; color: var(--text-muted);">${time}</span>
      <span>${icon}</span>
      <span style="flex: 1; color: ${type === 'error' ? '#fca5a5' : (type === 'warn' ? '#fde047' : '#e2e8f0')}; word-break: break-all;">${this.escapeHTML(message)}</span>
      ${aiFixBtn}
    `;

    const fixBtn = row.querySelector('.btn-ai-fix');
    if (fixBtn) {
      fixBtn.addEventListener('click', () => {
        if (this.aiUI) {
          this.aiUI.sendUserPrompt(`I encountered this runtime error in my scene or script: "${message}". Please analyze the cause and provide an automatic fix.`);
        }
      });
    }

    list.appendChild(row);
    list.scrollTop = list.scrollHeight;
    this.updateCountBadge();
  }

  updateCountBadge() {
    const badge = this.drawer.querySelector('#log-count-badge');
    if (badge) {
      const errCount = this.logs.filter(l => l.type === 'error').length;
      badge.textContent = `${this.logs.length} items ${errCount > 0 ? `(${errCount} errors)` : ''}`;
      badge.style.color = errCount > 0 ? '#ef4444' : 'var(--text-muted)';
    }
  }

  toggle(open) {
    this.isOpen = open;
    this.drawer.style.display = this.isOpen ? 'flex' : 'none';
  }

  escapeHTML(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
}
