import { CloudPublisher } from '../cloud/publisher.js';
import { showToast } from './toast.js';

/**
 * 1-Click Cloud Web Publisher & Game Exporter Modal
 */
export class PublishModal {
  constructor(editor) {
    this.editor = editor;
    this.publisher = new CloudPublisher(editor);
    this.isOpen = false;
    this.render();
    this.bindEvents();
  }

  render() {
    this.modal = document.createElement('div');
    this.modal.id = 'publish-modal';
    this.modal.style.cssText = `
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(10px);
      z-index: 1000;
      display: none;
      align-items: center;
      justify-content: center;
    `;

    this.modal.innerHTML = `
      <div style="width: 580px; background: var(--bg-darkest); border: 1px solid var(--accent-orange); border-radius: var(--radius-lg); box-shadow: 0 16px 48px rgba(0,0,0,0.8), 0 0 24px var(--accent-orange-glow); display: flex; flex-direction: column; overflow: hidden;">
        
        <!-- Header -->
        <div style="height: 48px; background: var(--bg-darker); border-bottom: 1px solid var(--border-subtle); display: flex; align-items: center; justify-content: space-between; padding: 0 18px;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="font-size: 20px;">🚀</div>
            <div>
              <div style="font-weight: 700; font-size: 13px; color: var(--text-primary);">Publish & Export Game</div>
              <div style="font-size: 10px; color: var(--accent-orange); font-weight: 600;">Makulu Cloud & Standalone HTML5</div>
            </div>
          </div>
          <button id="publish-btn-close" class="btn" style="padding: 2px 8px; font-size: 12px;">✕</button>
        </div>

        <!-- Form Body -->
        <div id="publish-form-view" style="padding: 20px; display: flex; flex-direction: column; gap: 14px;">
          
          <div class="prop-row">
            <span class="prop-label" style="width: 120px;">Game Title</span>
            <input type="text" id="pub-game-title" class="text-input" value="${this.editor.projectName || 'My 3D Game'}">
          </div>

          <div class="prop-row">
            <span class="prop-label" style="width: 120px;">Creator Name</span>
            <input type="text" id="pub-creator" class="text-input" value="MakuluLinux Creator">
          </div>

          <div style="background: rgba(255,102,0,0.06); border: 1px solid rgba(255,102,0,0.25); border-radius: var(--radius-md); padding: 12px; display: flex; flex-direction: column; gap: 6px; font-size: 11px; color: var(--text-secondary); line-height: 1.5;">
            <div>📦 <strong>Standalone HTML5 Bundle:</strong> Produces a zero-install, single-file game you can share, double-click to play anywhere offline, or host on itch.io.</div>
            <div>☁️ <strong>Makulu Cloud Hosting:</strong> Deploys to your web server for instant sharing with players on PC and mobile.</div>
          </div>

          <!-- Buttons -->
          <div style="display: flex; gap: 10px; margin-top: 6px;">
            <button id="btn-download-bundle" class="btn" style="flex: 1; padding: 10px; font-weight: 600; font-size: 12px;">
              💾 Download HTML5 (.html)
            </button>
            <button id="btn-cloud-publish" class="btn btn-primary" style="flex: 1; padding: 10px; font-weight: 700; font-size: 12px;">
              🚀 Publish to Cloud
            </button>
          </div>
        </div>

        <!-- Success Result View -->
        <div id="publish-success-view" style="padding: 28px 20px; display: none; flex-direction: column; align-items: center; text-align: center; gap: 12px;">
          <div style="font-size: 42px;">🎉</div>
          <div style="font-weight: 800; font-size: 16px; color: var(--text-primary);">Your Game is Live!</div>
          <div style="font-size: 11px; color: var(--text-secondary); max-width: 400px;">
            The game has been compiled and is ready to play in any modern desktop or mobile browser.
          </div>

          <div style="width: 100%; background: var(--bg-input); border: 1px solid var(--accent-orange); border-radius: var(--radius-md); padding: 10px 14px; display: flex; align-items: center; justify-content: space-between; gap: 8px;">
            <span id="pub-live-url" style="font-family: var(--font-mono); font-size: 11px; color: var(--accent-orange); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;"></span>
            <button id="btn-copy-url" class="btn btn-primary" style="font-size: 10px; padding: 4px 10px;">📋 Copy</button>
          </div>

          <div style="display: flex; gap: 10px; margin-top: 8px; width: 100%;">
            <button id="btn-play-live-game" class="btn btn-primary" style="flex: 1; padding: 8px; font-size: 12px;">
              ▶ Open & Play in New Tab
            </button>
            <button id="btn-publish-another" class="btn" style="padding: 8px 16px; font-size: 12px;">
              Done
            </button>
          </div>
        </div>

      </div>
    `;

    document.body.appendChild(this.modal);
  }

  bindEvents() {
    const closeBtn = this.modal.querySelector('#publish-btn-close');
    closeBtn.addEventListener('click', () => this.close());

    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) this.close();
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) this.close();
    });

    // Download standalone HTML5 game
    const downloadBtn = this.modal.querySelector('#btn-download-bundle');
    downloadBtn.addEventListener('click', () => {
      const title = this.modal.querySelector('#pub-game-title').value.trim() || 'MyGame';
      const author = this.modal.querySelector('#pub-creator').value.trim();
      const filename = `${title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.html`;
      this.publisher.downloadHTML(filename);
      showToast(`✓ Downloaded standalone game "${filename}"!`, 'success');
      this.close();
    });

    // Publish to cloud
    const cloudBtn = this.modal.querySelector('#btn-cloud-publish');
    cloudBtn.addEventListener('click', async () => {
      cloudBtn.textContent = '⏳ Compiling & Deploying...';
      cloudBtn.disabled = true;

      const title = this.modal.querySelector('#pub-game-title').value.trim() || 'My Game';
      const author = this.modal.querySelector('#pub-creator').value.trim();

      try {
        const result = await this.publisher.publish({ title, author });

        // Show success screen
        this.modal.querySelector('#publish-form-view').style.display = 'none';
        const successView = this.modal.querySelector('#publish-success-view');
        successView.style.display = 'flex';

        const urlSpan = this.modal.querySelector('#pub-live-url');
        urlSpan.textContent = result.publicUrl;

        // Open in new tab
        const playBtn = this.modal.querySelector('#btn-play-live-game');
        playBtn.onclick = () => {
          window.open(result.localPlayUrl, '_blank');
        };

        // Copy url
        const copyBtn = this.modal.querySelector('#btn-copy-url');
        copyBtn.onclick = () => {
          navigator.clipboard.writeText(result.publicUrl);
          showToast('✓ Game URL copied to clipboard!', 'success');
        };

        // Done button
        this.modal.querySelector('#btn-publish-another').onclick = () => {
          this.close();
        };

        showToast('🚀 Game published successfully!', 'success');
      } catch (err) {
        showToast(`⚠️ Publish Error: ${err.message}`, 'warn');
      } finally {
        cloudBtn.textContent = '🚀 Publish to Cloud';
        cloudBtn.disabled = false;
      }
    });
  }

  open() {
    this.modal.querySelector('#publish-form-view').style.display = 'flex';
    this.modal.querySelector('#publish-success-view').style.display = 'none';
    this.modal.style.display = 'flex';
    this.isOpen = true;
  }

  close() {
    this.modal.style.display = 'none';
    this.isOpen = false;
  }
}
