import { prepareGame } from '../runtime/prepare-game.js';
import { createPreviewDocument, previewStatus, PREVIEW_SANDBOX } from '../runtime/preview-document.js';

/** Owns the iframe lifetime. Restart always creates a fresh runtime from the captured artifact. */
export class GamePreview {
  constructor(editor, { prepare = prepareGame, timeoutMs = 45000, host = null, onClose = () => {} } = {}) {
    this.editor = editor; this.prepare = prepare; this.timeoutMs = timeoutMs; this.host = host; this.onClose = onClose; this.generation = 0;
  }

  async open() {
    if (this.dialog) { this.closeButton.focus(); return; }
    const generation = ++this.generation;
    this.previousFocus = document.activeElement;
    const dialog = document.createElement(this.host ? 'section' : 'dialog'); this.dialog = dialog;
    dialog.setAttribute('aria-label', 'Game preview');
    dialog.style.cssText = 'width:min(1200px,94vw);height:90vh;max-width:94vw;max-height:94vh;padding:0;border:1px solid #526070;background:#101621;color:#fff;border-radius:12px;overflow:hidden';
    if (this.host) dialog.style.cssText = 'width:100%;height:100%;display:flex;flex-direction:column;overflow:hidden;background:#080b10;color:#fff';
    const bar = document.createElement('div'); bar.style.cssText = 'display:flex;align-items:center;gap:14px;padding:12px 16px;height:48px;box-sizing:border-box;font:14px system-ui';
    const title = document.createElement('strong'); title.textContent = 'Game Preview'; bar.appendChild(title);
    this.status = document.createElement('span'); this.status.setAttribute('role', 'status'); this.status.style.cssText = 'flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap'; bar.appendChild(this.status);
    this.restartButton = document.createElement('button'); this.restartButton.textContent = 'Restart'; this.restartButton.disabled = true; this.restartButton.addEventListener('click', () => this.restart()); bar.appendChild(this.restartButton);
    this.closeButton = document.createElement('button'); this.closeButton.textContent = this.host ? 'Stop' : 'Close'; this.closeButton.addEventListener('click', () => this.close()); bar.appendChild(this.closeButton);
    this.surface = document.createElement('div'); this.surface.style.cssText = 'height:calc(100% - 48px);background:#080b10';
    dialog.append(bar, this.surface); (this.host || document.body).appendChild(dialog);
    dialog.addEventListener('cancel', event => { event.preventDefault(); this.close(); });
    if (!this.host) dialog.showModal(); this.setStatus('Preparing game and assets…');
    try {
      const html = await this.prepare(this.editor);
      if (generation !== this.generation || !this.dialog) return;
      this.html = html; this.restartButton.disabled = false; this.restart();
    } catch (error) {
      if (generation === this.generation && this.dialog) {
        this.removeFrame();
        const detail = typeof error?.message === 'string' ? error.message.slice(0, 300) : 'Check missing or unsupported assets.';
        this.setStatus(`Could not prepare the game. ${detail}`, true);
      }
    }
  }

  setStatus(message, error = false) {
    this.status.textContent = message; this.status.title = message; this.status.setAttribute('role', error ? 'alert' : 'status');
  }

  restart() {
    if (!this.dialog || !this.html) return;
    this.removeFrame();
    this.token = crypto.randomUUID(); this.setStatus('Starting game…');
    const frame = document.createElement('iframe'); this.frame = frame;
    frame.title = 'Playable game preview'; frame.setAttribute('sandbox', PREVIEW_SANDBOX);
    frame.setAttribute('referrerpolicy', 'no-referrer');
    frame.setAttribute('allow', 'fullscreen *; autoplay *');
    frame.allowFullscreen = true;
    frame.style.cssText = 'width:100%;height:100%;border:0;display:block';
    this.listener = event => {
      const status = previewStatus(event, frame.contentWindow, this.token);
      if (!status) return;
      if (status.state === 'running') {
        clearTimeout(this.timer);
        this.setStatus(`Playing · ${status.cameraName || 'Game camera'} · Click the game for controls`);
        if (!this.host) frame.focus();
      } else if (status.state === 'error') {
        this.removeFrame(); this.setStatus('Game failed to start or encountered an error. Restart or close preview.', true);
      } else this.setStatus(status.state === 'loading-assets' ? 'Loading game assets…' : 'Starting game…');
    };
    window.addEventListener('message', this.listener);
    frame.srcdoc = createPreviewDocument(this.html, this.token); this.surface.appendChild(frame);
    this.timer = setTimeout(() => { if (this.frame === frame) { this.removeFrame(); this.setStatus('Game startup timed out. Restart or close preview.', true); } }, this.timeoutMs);
  }

  removeFrame() {
    clearTimeout(this.timer);
    if (this.listener) window.removeEventListener('message', this.listener);
    this.listener = null;
    if (this.frame) { this.frame.remove(); this.frame = null; }
  }

  close() {
    this.generation++; this.removeFrame(); this.html = null;
    if (this.dialog) { this.dialog.close?.(); this.dialog.remove(); this.dialog = null; }
    if (!this.host) this.previousFocus?.focus?.();
    this.onClose();
  }
}
