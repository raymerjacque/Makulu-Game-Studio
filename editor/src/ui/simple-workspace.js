import { GamePreview } from './game-preview.js';
import { Editor } from '../core/editor.js';
import { showToast } from './toast.js';

/** A layout over the same editor/chat/project. Mode changes never convert project data. */
export class SimpleWorkspace {
  constructor(editor, ai, { shell = document.getElementById('app-shell'), topbar = document.getElementById('top-bar') } = {}) {
    this.editor = editor; this.ai = ai; this.topbar = topbar; editor.simpleWorkspace = this;
    this.chatParent = ai.panel.parentElement; this.chatSibling = ai.panel.nextSibling;
    this.root = document.createElement('section'); this.root.id = 'simple-workspace';
    this.root.innerHTML = `
      <header class="simple-header">
        <div class="simple-identity"><strong>Makulu Game Studio</strong><span>Simple</span></div>
        <div class="simple-project"><span id="simple-project-name"></span><small id="simple-save-state" role="status">New project</small></div>
        <nav aria-label="Project controls">
          <button class="btn" id="simple-new">New</button>
          <button class="btn" data-file-action="menu-action-import">Open</button>
          <button class="btn" data-file-action="menu-action-export">Save</button>
          <button class="btn" data-file-action="menu-action-recovery">Recover</button>
          <button class="btn btn-primary" data-file-action="menu-action-export-html">Export game</button>
          <button class="btn" id="simple-undo">Undo</button><button class="btn" id="simple-redo">Redo</button>
          <button class="btn" id="simple-settings">AI settings</button>
          <button class="btn" id="simple-pro">Open in Pro ↗</button>
        </nav>
      </header>
      <div class="simple-content">
        <section class="simple-conversation" aria-label="Game conversation">
          <div class="simple-section-title"><strong>Create your game</strong><span>Describe it. Try it. Refine it.</span></div>
          <div id="simple-chat-host"></div>
          <p class="simple-note">AI changes need playtesting. Automatic completion and verification are still being built.</p>
        </section>
        <section class="simple-game" aria-label="Game preview">
          <div class="simple-preview-heading"><strong>Your game</strong><span id="simple-build-state" role="status">Ready to create</span><button class="btn btn-primary" id="simple-refresh">Preview latest changes</button></div>
          <div id="simple-preview-host"></div>
          <div class="simple-preview-empty" id="simple-preview-empty"><span>✦</span><h2>Start with an idea.</h2><p>Describe a game in the chat. Your playable preview will appear here after the AI responds, or when you choose Preview latest changes.</p></div>
        </section>
      </div>`;
    shell.appendChild(this.root);
    this.preview = new GamePreview(editor, { host: this.root.querySelector('#simple-preview-host'), onClose: () => this.showEmpty() });
    this.root.querySelectorAll('[data-file-action]').forEach(button => button.addEventListener('click', () => {
      if (ai.isBusy && ['menu-action-import', 'menu-action-recovery'].includes(button.dataset.fileAction)) return;
      if (['menu-action-import', 'menu-action-recovery'].includes(button.dataset.fileAction)) { this.preview.close(); this.showEmpty(); }
      topbar.querySelector(`#${button.dataset.fileAction}`)?.click();
    }));
    const updateHistory = () => {
      this.root.querySelector('#simple-undo').disabled = Boolean(ai.isBusy) || !editor.commandBus.canUndo();
      this.root.querySelector('#simple-redo').disabled = Boolean(ai.isBusy) || !editor.commandBus.canRedo();
    };
    editor.commandBus.subscribe(updateHistory); updateHistory();
    for (const action of ['undo', 'redo']) this.root.querySelector(`#simple-${action}`).addEventListener('click', () => {
      if (ai.isBusy) return;
      try { editor.commandBus[action](); this.preview.close(); this.showEmpty(); } catch { showToast('The change could not be reversed. Restore a recovery snapshot if needed.', 'error'); }
    });
    editor.events.on('ai:edit:result', info => {
      this.root.querySelector('.simple-note').textContent = info.undoable ? 'This action batch can be reversed with Undo. Preview to test gameplay.' : 'Advanced legacy actions were used. Whole-batch Undo is unavailable for this response.';
    });
    this.root.querySelector('#simple-new').addEventListener('click', () => { void this.newProject(); });
    this.root.querySelector('#simple-pro').addEventListener('click', () => editor.setEditorMode('pro'));
    this.root.querySelector('#simple-settings').addEventListener('click', () => ai.settingsModal?.open());
    this.root.querySelector('#simple-refresh').addEventListener('click', () => { void this.refresh(); });
    editor.events.on('mode:changed', mode => this.setMode(mode));
    editor.events.on('project:save-state', state => {
      this.root.querySelector('#simple-save-state').textContent = state.recovery === 'error' ? 'Recovery unavailable · Save a file' : state.dirty ? 'Unsaved changes' : state.source === 'downloaded' ? 'No changes since download' : state.source === 'opened' ? 'No changes since open' : 'New project';
      this.updateName();
    });
    editor.events.on('ai:request:state', ({ busy }) => {
      updateHistory();
      this.root.querySelector('#simple-build-state').textContent = busy ? 'AI is working…' : 'Response finished · preview to test';
      for (const selector of ['#simple-new', '[data-file-action="menu-action-import"]', '[data-file-action="menu-action-recovery"]', '#simple-refresh']) this.root.querySelector(selector).disabled = busy;
      if (busy) { this.root.querySelector('.simple-note').textContent = 'AI changes need playtesting. Automatic completion and verification are still being built.'; this.preview.close(); this.showEmpty(); }
    });
    editor.events.on('ai:resources:state', report => {
      if (report.status === 'loading') this.root.querySelector('#simple-build-state').textContent = `Loading assets · ${report.loaded}/${report.total}`;
      else if (report.status === 'ready') this.root.querySelector('#simple-build-state').textContent = 'Assets ready · applying changes';
    });
    editor.events.on('ai:request:settled', () => { if (this.active) void this.refresh(); });
    this.chatProjectId = editor.projectId;
    editor.events.on('project:loaded', () => {
      this.preview.close(); this.showEmpty(); this.updateName();
      if (editor.projectId !== this.chatProjectId && !ai.isBusy) {
        ai.client.history = [];
        const chat = ai.panel.querySelector('#ai-chat-body'); chat.replaceChildren();
        const welcome = document.createElement('p'); welcome.className = 'ai-message assistant';
        welcome.textContent = 'Describe the game you want to create, or the next change to this project.'; chat.appendChild(welcome);
      }
      this.chatProjectId = editor.projectId;
    });
    editor.events.on('scene:changed', () => {
      if (this.active && this.preview.dialog && !this.editor.isPlaying) this.root.querySelector('#simple-build-state').textContent = 'Project changed · refresh preview';
    });
    window.addEventListener('keydown', event => {
      if (this.active && (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault(); this.topbar.querySelector('#menu-action-export')?.click();
      }
    });
    try {
      const preferred = localStorage.getItem('makulu_studio_workspace_mode');
      if (preferred === 'simple' || preferred === 'pro') editor.setEditorMode(preferred);
    } catch {}
    this.setMode(editor.mode);
  }

  updateName() { this.root.querySelector('#simple-project-name').textContent = this.editor.projectName; }
  showEmpty() {
    const empty = this.root.querySelector('#simple-preview-empty'); empty.hidden = false;
    const content = this.editor.getApp()?.root.findOne(node => !node._studioEditorOnly && (node.render || node._modelUrl));
    empty.querySelector('h2').textContent = this.ai.isBusy ? 'Working on your request…' : content ? 'Ready to try your game?' : 'Start with an idea.';
    empty.querySelector('p').textContent = this.ai.isBusy ? 'The preview will refresh after the AI responds.' : content ? 'Choose Preview latest changes to play the current project. Describe what you want to improve in the chat.' : 'Describe a game in the chat. Your playable preview will appear here after the AI responds, or when you choose Preview latest changes.';
  }

  async refresh() {
    if (!this.active || this.ai.isBusy) return;
    this.preview.close(); this.root.querySelector('#simple-preview-empty').hidden = true;
    this.root.querySelector('#simple-build-state').textContent = 'Preview of the current project · gameplay not verified';
    await this.preview.open();
  }

  async newProject() {
    if (this.ai.isBusy || this.newBusy) return;
    this.newBusy = true;
    try {
      if (this.editor.persistence && !await this.editor.persistence.protectBeforeReplace()) throw new Error('Save your current project before starting another.');
      const fresh = new Editor().exportProjectJSON();
      const result = await this.editor.openProjectJSON(fresh);
      if (result.status !== 'ready') throw new Error('The new project could not be opened.');
      this.preview.close(); this.showEmpty(); this.updateName();
    } catch (error) { showToast(error.message, 'error'); }
    finally { this.newBusy = false; }
  }

  setMode(mode) {
    if (this.active === (mode === 'simple')) { this.updateName(); return; }
    if (mode === 'simple' && this.editor.isPlaying) this.editor.stopPlay();
    this.active = mode === 'simple';
    try { localStorage.setItem('makulu_studio_workspace_mode', mode); } catch {}
    document.body.dataset.studioMode = mode;
    this.root.hidden = !this.active;
    if (this.active) {
      this.savedPanelState = { display: this.ai.panel.style.display, minimized: this.ai.panel.classList.contains('minimized'), isOpen: this.ai.isOpen };
      this.root.querySelector('#simple-chat-host').appendChild(this.ai.panel);
      this.ai.panel.style.display = 'flex'; this.ai.panel.classList.remove('minimized');
      this.ai.isOpen = true; this.ai.isMinimized = false;
    } else {
      this.preview.close(); this.showEmpty();
      if (this.chatSibling?.parentElement === this.chatParent) this.chatParent.insertBefore(this.ai.panel, this.chatSibling);
      else this.chatParent.appendChild(this.ai.panel);
      if (this.savedPanelState) {
        this.ai.panel.style.display = this.savedPanelState.display;
        this.ai.panel.classList.toggle('minimized', this.savedPanelState.minimized);
        this.ai.isOpen = this.savedPanelState.isOpen; this.ai.isMinimized = this.savedPanelState.minimized;
      }
      window.dispatchEvent(new Event('resize'));
    }
    this.topbar.querySelectorAll('.mode-btn').forEach(button => button.classList.toggle('active', button.dataset.mode === mode));
    this.updateName();
    if (!this.preview.dialog) this.showEmpty();
  }
}
