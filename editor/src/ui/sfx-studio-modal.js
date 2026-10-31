import { showToast } from './toast.js';
import { playProceduralSFX, generateWAVDataURL, proceduralSFX } from '../engine/procedural-sfx.js';

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

    // Custom Synthesizer Parameters
    this.customParams = {
      waveType: 'sine',
      startFreq: 440,
      endFreq: 220,
      attack: 0.02,
      decay: 0.1,
      sustain: 0.3,
      release: 0.2
    };

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
      <div style="width: 620px; background: var(--bg-darkest); border: 1px solid #a855f7; border-radius: var(--radius-lg); box-shadow: 0 20px 60px rgba(0,0,0,0.8), 0 0 30px rgba(168,85,247,0.25); display: flex; flex-direction: column; overflow: hidden;">

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
        <div style="padding: 20px; display: flex; flex-direction: column; gap: 16px; overflow-y: auto; max-height: 540px;">

          <!-- Waveform Canvas Visualizer -->
          <div style="background: #0d0614; border: 1px solid rgba(168,85,247,0.3); border-radius: 8px; padding: 10px; text-align: center;">
            <div style="font-size: 10px; color: #c084fc; font-weight: 700; margin-bottom: 4px; text-transform: uppercase;">Real-Time Audio Waveform Visualizer</div>
            <canvas id="sfx-waveform-canvas" width="560" height="60" style="width: 100%; height: 60px; background: #000; border-radius: 6px; border: 1px solid var(--border-subtle);"></canvas>
          </div>

          <!-- Preset Sound Type Selection -->
          <div style="background: var(--bg-panel); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 14px;">
            <div style="font-size: 12px; font-weight: 700; color: #c084fc; margin-bottom: 10px;">🎵 Preset Sound Effect Categories</div>

            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;" id="sfx-preset-grid">
              <button class="btn sfx-type-btn active" data-type="laser" style="justify-content: flex-start; gap: 6px; padding: 6px 8px; font-size: 11px;">🔫 Laser / Shoot</button>
              <button class="btn sfx-type-btn" data-type="explosion" style="justify-content: flex-start; gap: 6px; padding: 6px 8px; font-size: 11px;">💥 Explosion</button>
              <button class="btn sfx-type-btn" data-type="coin" style="justify-content: flex-start; gap: 6px; padding: 6px 8px; font-size: 11px;">🪙 Coin / Pickup</button>
              <button class="btn sfx-type-btn" data-type="jump" style="justify-content: flex-start; gap: 6px; padding: 6px 8px; font-size: 11px;">🚀 Jump / Impulse</button>
              <button class="btn sfx-type-btn" data-type="door" style="justify-content: flex-start; gap: 6px; padding: 6px 8px; font-size: 11px;">🔓 Door Unlock</button>
              <button class="btn sfx-type-btn" data-type="hurt" style="justify-content: flex-start; gap: 6px; padding: 6px 8px; font-size: 11px;">💔 Hurt / Damage</button>
              <button class="btn sfx-type-btn" data-type="victory" style="justify-content: flex-start; gap: 6px; padding: 6px 8px; font-size: 11px;">🏆 Victory Fanfare</button>
              <button class="btn sfx-type-btn" data-type="boost" style="justify-content: flex-start; gap: 6px; padding: 6px 8px; font-size: 11px;">💨 Dash Boost</button>
              <button class="btn sfx-type-btn" data-type="footstep_grass" style="justify-content: flex-start; gap: 6px; padding: 6px 8px; font-size: 11px;">🌿 Footstep Grass</button>
              <button class="btn sfx-type-btn" data-type="footstep_stone" style="justify-content: flex-start; gap: 6px; padding: 6px 8px; font-size: 11px;">🪨 Footstep Stone</button>
              <button class="btn sfx-type-btn" data-type="slash_sword" style="justify-content: flex-start; gap: 6px; padding: 6px 8px; font-size: 11px;">⚔️ Sword Slash</button>
              <button class="btn sfx-type-btn" data-type="shield_block" style="justify-content: flex-start; gap: 6px; padding: 6px 8px; font-size: 11px;">🛡️ Shield Block</button>
              <button class="btn sfx-type-btn" data-type="reload_gun" style="justify-content: flex-start; gap: 6px; padding: 6px 8px; font-size: 11px;">🔫 Reload Lock</button>
              <button class="btn sfx-type-btn" data-type="engine_rumble" style="justify-content: flex-start; gap: 6px; padding: 6px 8px; font-size: 11px;">🏎️ Engine Rumble</button>
              <button class="btn sfx-type-btn" data-type="ambient_dungeon" style="justify-content: flex-start; gap: 6px; padding: 6px 8px; font-size: 11px;">🏰 Dungeon Drone</button>
              <button class="btn sfx-type-btn" data-type="thunder_bolt" style="justify-content: flex-start; gap: 6px; padding: 6px 8px; font-size: 11px;">⚡ Thunder Strike</button>
              <button class="btn sfx-type-btn" data-type="teleport" style="justify-content: flex-start; gap: 6px; padding: 6px 8px; font-size: 11px;">🌀 Teleport Warp</button>
              <button class="btn sfx-type-btn" data-type="magic_spell" style="justify-content: flex-start; gap: 6px; padding: 6px 8px; font-size: 11px;">✨ Arcane Spell</button>
              <button class="btn sfx-type-btn" data-type="whoosh" style="justify-content: flex-start; gap: 6px; padding: 6px 8px; font-size: 11px;">💨 Air Whoosh</button>
              <button class="btn sfx-type-btn" data-type="laser_heavy" style="justify-content: flex-start; gap: 6px; padding: 6px 8px; font-size: 11px;">💥 Heavy Laser</button>
              <button class="btn sfx-type-btn" data-type="magic_portal" style="justify-content: flex-start; gap: 6px; padding: 6px 8px; font-size: 11px;">🌌 Magic Portal</button>
              <button class="btn sfx-type-btn" data-type="equip_item" style="justify-content: flex-start; gap: 6px; padding: 6px 8px; font-size: 11px;">🎒 Equip Item</button>
              <button class="btn sfx-type-btn" data-type="heartbeat_low_hp" style="justify-content: flex-start; gap: 6px; padding: 6px 8px; font-size: 11px;">❤️ Low HP Heartbeat</button>
              <button class="btn sfx-type-btn" data-type="ui_click" style="justify-content: flex-start; gap: 6px; padding: 6px 8px; font-size: 11px;">🔘 Tactile Click</button>
              <button class="btn sfx-type-btn" data-type="jump_pad" style="justify-content: flex-start; gap: 6px; padding: 6px 8px; font-size: 11px;">🚀 Jump Pad Boing</button>
              <button class="btn sfx-type-btn" data-type="alarm_siren" style="justify-content: flex-start; gap: 6px; padding: 6px 8px; font-size: 11px;">🚨 Alarm Siren</button>
              <button class="btn sfx-type-btn" data-type="countdown_beep" style="justify-content: flex-start; gap: 6px; padding: 6px 8px; font-size: 11px;">⏱️ Countdown Beep</button>
              <button class="btn sfx-type-btn" data-type="missile_launch" style="justify-content: flex-start; gap: 6px; padding: 6px 8px; font-size: 11px;">🚀 Missile Launch</button>
              <button class="btn sfx-type-btn" data-type="vending_dispense" style="justify-content: flex-start; gap: 6px; padding: 6px 8px; font-size: 11px;">🥫 Vending Drop</button>
            </div>
          </div>

          <!-- Custom ADSR & Waveform Synthesizer -->
          <div style="background: var(--bg-panel); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 14px;">
            <div style="font-size: 12px; font-weight: 700; color: #c084fc; margin-bottom: 10px;">🎹 Custom ADSR Envelope & Oscillator Synth</div>

            <div class="prop-row" style="margin-bottom: 8px;">
              <span class="prop-label" style="width: 140px;">Waveform Type</span>
              <select id="sfx-wave-type" class="text-input" style="flex: 1;">
                <option value="sine">Sine Wave</option>
                <option value="square">Square Wave (8-Bit Retro)</option>
                <option value="sawtooth">Sawtooth Wave</option>
                <option value="triangle">Triangle Wave</option>
                <option value="noise">Filtered Noise Burst</option>
              </select>
            </div>

            <div class="prop-row" style="margin-bottom: 8px;">
              <span class="prop-label" style="width: 140px;">Start / End Freq (Hz)</span>
              <div style="display: flex; gap: 8px; flex: 1;">
                <input type="number" id="sfx-start-freq" class="text-input" value="880" style="width: 50%;">
                <input type="number" id="sfx-end-freq" class="text-input" value="110" style="width: 50%;">
              </div>
            </div>

            <div class="prop-row" style="margin-bottom: 8px;">
              <span class="prop-label" style="width: 140px;">Attack / Decay (s)</span>
              <div style="display: flex; gap: 8px; flex: 1;">
                <input type="number" step="0.01" id="sfx-attack" class="text-input" value="0.02" style="width: 50%;">
                <input type="number" step="0.01" id="sfx-decay" class="text-input" value="0.10" style="width: 50%;">
              </div>
            </div>

            <div class="prop-row">
              <span class="prop-label" style="width: 140px;">Sustain / Release</span>
              <div style="display: flex; gap: 8px; flex: 1;">
                <input type="number" step="0.05" id="sfx-sustain" class="text-input" value="0.30" style="width: 50%;">
                <input type="number" step="0.01" id="sfx-release" class="text-input" value="0.20" style="width: 50%;">
              </div>
            </div>
          </div>

          <!-- Volume Controls -->
          <div style="background: var(--bg-panel); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 14px;">
            <div style="font-size: 12px; font-weight: 700; color: #c084fc; margin-bottom: 10px;">🎛️ Audio Master Output</div>

            <div class="prop-row">
              <span class="prop-label" style="width: 140px;">Master Volume</span>
              <input type="range" min="0.1" max="1.0" step="0.05" id="sfx-volume-slider" value="0.5" class="text-input" style="flex: 1;">
              <span id="sfx-volume-val" style="font-size: 11px; width: 32px;">0.50</span>
            </div>
          </div>

        </div>

        <!-- Footer -->
        <div style="height: 52px; background: var(--bg-darker); border-top: 1px solid var(--border-subtle); display: flex; align-items: center; justify-content: space-between; padding: 0 20px;">
          <div style="display: flex; gap: 8px;">
            <button id="sfx-btn-preview" class="btn" style="padding: 8px 14px; font-weight: 700; border-color: #a855f7; color: #c084fc;">
              ▶ Test Preset
            </button>
            <button id="sfx-btn-preview-custom" class="btn" style="padding: 8px 14px; font-weight: 700; border-color: #38bdf8; color: #38bdf8;">
              🎹 Test Custom Synth
            </button>
          </div>
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
        this.drawWaveformVisual();
      });
    });

    const readCustomInputs = () => {
      this.customParams = {
        waveType: this.modal.querySelector('#sfx-wave-type').value,
        startFreq: parseFloat(this.modal.querySelector('#sfx-start-freq').value) || 440,
        endFreq: parseFloat(this.modal.querySelector('#sfx-end-freq').value) || 220,
        attack: parseFloat(this.modal.querySelector('#sfx-attack').value) || 0.02,
        decay: parseFloat(this.modal.querySelector('#sfx-decay').value) || 0.1,
        sustain: parseFloat(this.modal.querySelector('#sfx-sustain').value) || 0.3,
        release: parseFloat(this.modal.querySelector('#sfx-release').value) || 0.2
      };
    };

    this.modal.querySelector('#sfx-btn-preview').addEventListener('click', () => {
      playProceduralSFX(this.sfxType, this.volume);
      this.drawWaveformVisual();
    });

    this.modal.querySelector('#sfx-btn-preview-custom').addEventListener('click', () => {
      readCustomInputs();
      proceduralSFX.playCustom(this.customParams, this.volume);
      this.drawWaveformVisual();
    });

    this.modal.querySelector('#sfx-btn-export-asset').addEventListener('click', () => {
      if (this.editor.assetsPanel) {
        readCustomInputs();
        const assetName = `SFX_CUSTOM_${Date.now().toString().slice(-4)}.wav`;
        const dataUrl = generateWAVDataURL(this.customParams);
        this.editor.assetsPanel.addAsset({
          id: Date.now().toString(),
          name: assetName,
          type: 'audio',
          icon: '🔊',
          size: '14 KB',
          url: dataUrl,
          base64Data: dataUrl
        });
        showToast(`🔊 Added "${assetName}" to Assets Panel!`, 'success');
        this.close();
      }
    });
  }

  drawWaveformVisual() {
    const canvas = this.modal.querySelector('#sfx-waveform-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#0f051d';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.beginPath();
    ctx.strokeStyle = '#c084fc';
    ctx.lineWidth = 2;

    const midY = canvas.height / 2;
    ctx.moveTo(0, midY);

    for (let x = 0; x < canvas.width; x += 4) {
      const t = x / canvas.width;
      const y = midY + Math.sin(t * Math.PI * 16) * (1 - t) * (midY - 8);
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  open() {
    this.modal.style.display = 'flex';
    this.isOpen = true;
    setTimeout(() => this.drawWaveformVisual(), 50);
  }

  close() {
    this.modal.style.display = 'none';
    this.isOpen = false;
  }
}
