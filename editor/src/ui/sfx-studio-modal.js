import { showToast } from './toast.js';
import { playProceduralSFX, generateWAVDataURL } from '../engine/procedural-sfx.js';

/**
 * Procedural Audio Synth Studio Modal
 * Synthesizes 8-bit, retro, combat, atmospheric, and AAA game sound effects on the fly
 * and allows users to export them directly as WAV files to the Assets Panel.
 */
export class SFXStudioModal {
  constructor(editor) {
    this.editor = editor;
    this.isOpen = false;
    this.sfxType = 'laser';
    this.volume = 0.5;

    this.render();
    this.bindEvents();
  }

  render() {
    if (typeof document === 'undefined') return;
    this.modal = document.createElement('div');
    this.modal.id = 'sfx-studio-modal';
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
      <div style="width: 580px; background: var(--bg-darkest); border: 1px solid #a855f7; border-radius: var(--radius-lg); box-shadow: 0 20px 60px rgba(0,0,0,0.8), 0 0 30px rgba(168,85,247,0.25); display: flex; flex-direction: column; overflow: hidden;">

        <!-- Header -->
        <div style="height: 48px; background: var(--bg-darker); border-bottom: 1px solid var(--border-subtle); display: flex; align-items: center; justify-content: space-between; padding: 0 20px;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="font-size: 20px;">🔊</div>
            <div>
              <div style="font-weight: 700; font-size: 14px; color: var(--text-primary);">Procedural Audio Synthesizer Studio</div>
              <div style="font-size: 11px; color: #c084fc; font-weight: 600;">Zero-Dependency Realtime Web Audio Generator</div>
            </div>
          </div>
          <button id="sfx-btn-close" class="btn" style="padding: 4px 10px; font-size: 13px; border-radius: 6px;">✕</button>
        </div>

        <!-- Body -->
        <div style="padding: 20px; display: flex; flex-direction: column; gap: 16px; overflow-y: auto; max-height: 520px;">

          <!-- Preset Sound Type Selection -->
          <div style="background: var(--bg-panel); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 14px;">
            <div style="font-size: 12px; font-weight: 700; color: #c084fc; margin-bottom: 10px;">🎵 Sound Effect Preset Type</div>

            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;" id="sfx-preset-grid">
              <button class="btn sfx-type-btn active" data-type="laser" style="justify-content: flex-start; gap: 6px; padding: 8px;">🔫 Laser / Shoot</button>
              <button class="btn sfx-type-btn" data-type="explosion" style="justify-content: flex-start; gap: 6px; padding: 8px;">💥 Explosion</button>
              <button class="btn sfx-type-btn" data-type="coin" style="justify-content: flex-start; gap: 6px; padding: 8px;">🪙 Coin / Pickup</button>
              <button class="btn sfx-type-btn" data-type="jump" style="justify-content: flex-start; gap: 6px; padding: 8px;">🚀 Jump / Impulse</button>
              <button class="btn sfx-type-btn" data-type="door" style="justify-content: flex-start; gap: 6px; padding: 8px;">🔓 Door Unlock</button>
              <button class="btn sfx-type-btn" data-type="hurt" style="justify-content: flex-start; gap: 6px; padding: 8px;">💔 Hurt / Damage</button>
              <button class="btn sfx-type-btn" data-type="victory" style="justify-content: flex-start; gap: 6px; padding: 8px;">🏆 Victory Fanfare</button>
              <button class="btn sfx-type-btn" data-type="boost" style="justify-content: flex-start; gap: 6px; padding: 8px;">💨 Dash Boost</button>
            </div>
          </div>

          <!-- Volume Controls -->
          <div style="background: var(--bg-panel); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 14px;">
            <div style="font-size: 12px; font-weight: 700; color: #c084fc; margin-bottom: 10px;">🎛️ Audio Controls</div>

            <div class="prop-row">
              <span class="prop-label" style="width: 120px;">Master Volume</span>
              <input type="range" min="0.1" max="1.0" step="0.05" id="sfx-volume-slider" value="0.5" class="text-input" style="flex: 1;">
              <span id="sfx-volume-val" style="font-size: 11px; width: 32px;">0.50</span>
            </div>
          </div>

        </div>

        <!-- Footer -->
        <div style="height: 52px; background: var(--bg-darker); border-top: 1px solid var(--border-subtle); display: flex; align-items: center; justify-content: space-between; padding: 0 20px;">
          <button id="sfx-btn-preview" class="btn" style="padding: 8px 16px; font-weight: 700; border-color: #a855f7; color: #c084fc;">
            ▶ Test / Play Sound
          </button>
          <button id="sfx-btn-export-asset" class="btn btn-primary" style="padding: 8px 18px; font-weight: 700; background: #a855f7; border: none;">
            📦 Add to Assets Panel
          </button>
        </div>

      </div>
    `;

    document.body.appendChild(this.modal);
  }

  bindEvents() {
    if (!this.modal) return;
    this.modal.querySelector('#sfx-btn-close').addEventListener('click', () => this.close());

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) this.close();
    });

    const volSlider = this.modal.querySelector('#sfx-volume-slider');
    const volVal = this.modal.querySelector('#sfx-volume-val');

    volSlider.addEventListener('input', () => {
      this.volume = parseFloat(volSlider.value);
      volVal.textContent = this.volume.toFixed(2);
    });

    this.modal.querySelectorAll('.sfx-type-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.modal.querySelectorAll('.sfx-type-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.sfxType = btn.dataset.type;
        playProceduralSFX(this.sfxType, this.volume);
      });
    });

    this.modal.querySelector('#sfx-btn-preview').addEventListener('click', () => {
      playProceduralSFX(this.sfxType, this.volume);
    });

    this.modal.querySelector('#sfx-btn-export-asset').addEventListener('click', () => {
      if (this.editor.assetsPanel) {
        const assetName = `SFX_${this.sfxType.toUpperCase()}_${Date.now().toString().slice(-4)}.wav`;
        const dataUrl = generateWAVDataURL(this.sfxType);
        this.editor.assetsPanel.addAsset({
          id: Date.now().toString(),
          name: assetName,
          type: 'audio',
          icon: '🔊',
          size: '12 KB',
          url: dataUrl,
          base64Data: dataUrl
        });
        showToast(`🔊 Added "${assetName}" to Assets Panel with live WAV Data URL!`, 'success');
        this.close();
      }
    });
  }

  open() {
    this.modal.style.display = 'flex';
    this.isOpen = true;
  }

  close() {
    this.modal.style.display = 'none';
    this.isOpen = false;
  }
}
