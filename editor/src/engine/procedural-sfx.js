/**
 * Zero-Dependency Procedural Web Audio SFX Generator
 * Synthesizes retro and modern 3D game sound effects using Web Audio API oscillators and noise buffers.
 * Zero external WAV file assets required!
 */

class ProceduralSFXManager {
  constructor() {
    this.ctx = null;
  }

  getContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  play(type, volume = 0.5) {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const master = ctx.createGain();
      master.gain.setValueAtTime(volume, now);
      master.connect(ctx.destination);

      if (type === 'laser' || type === 'shoot') {
        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(110, now + 0.15);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.6, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

        osc.connect(gain);
        gain.connect(master);
        osc.start(now);
        osc.stop(now + 0.15);

      } else if (type === 'explosion' || type === 'impact') {
        const bufferSize = ctx.sampleRate * 0.35;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1000, now);
        filter.frequency.linearRampToValueAtTime(100, now + 0.35);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(1.0, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(master);
        noise.start(now);

      } else if (type === 'coin' || type === 'collect' || type === 'pickup') {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        osc1.type = 'sine';
        osc2.type = 'sine';

        osc1.frequency.setValueAtTime(987.77, now); // B5
        osc2.frequency.setValueAtTime(1318.51, now + 0.08); // E6

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(master);

        osc1.start(now);
        osc1.stop(now + 0.08);
        osc2.start(now + 0.08);
        osc2.stop(now + 0.25);

      } else if (type === 'jump' || type === 'boost') {
        const osc = ctx.createOscillator();
        osc.type = 'square';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.18);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);

        osc.connect(gain);
        gain.connect(master);
        osc.start(now);
        osc.stop(now + 0.18);

      } else if (type === 'door' || type === 'unlock') {
        const osc = ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.linearRampToValueAtTime(440, now + 0.3);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

        osc.connect(gain);
        gain.connect(master);
        osc.start(now);
        osc.stop(now + 0.35);

      } else if (type === 'hurt' || type === 'damage') {
        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.linearRampToValueAtTime(60, now + 0.2);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.8, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

        osc.connect(gain);
        gain.connect(master);
        osc.start(now);
        osc.stop(now + 0.2);

      } else if (type === 'victory' || type === 'win') {
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + idx * 0.1);

          const gain = ctx.createGain();
          gain.gain.setValueAtTime(0.5, now + idx * 0.1);
          gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.1 + 0.3);

          osc.connect(gain);
          gain.connect(master);
          osc.start(now + idx * 0.1);
          osc.stop(now + idx * 0.1 + 0.3);
        });
      }
    } catch (e) {
      console.warn('ProceduralSFXManager playback error:', e);
    }
  }
}

export const proceduralSFX = new ProceduralSFXManager();

export function playProceduralSFX(type, volume = 0.5) {
  proceduralSFX.play(type, volume);
}

/**
 * Stringified runtime for standalone HTML game compilation
 */
export const PROCEDURAL_SFX_RUNTIME_CODE = `
window.playProceduralSFX = function(type, volume) {
  try {
    if (!window._sfxCtx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) window._sfxCtx = new AudioCtx();
    }
    const ctx = window._sfxCtx;
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();

    const now = ctx.currentTime;
    const master = ctx.createGain();
    master.gain.setValueAtTime(volume || 0.5, now);
    master.connect(ctx.destination);

    if (type === 'laser' || type === 'shoot') {
      const osc = ctx.createOscillator(); osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, now); osc.frequency.exponentialRampToValueAtTime(110, now + 0.15);
      const gain = ctx.createGain(); gain.gain.setValueAtTime(0.6, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      osc.connect(gain); gain.connect(master); osc.start(now); osc.stop(now + 0.15);
    } else if (type === 'explosion' || type === 'impact') {
      const bufferSize = ctx.sampleRate * 0.35;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
      const noise = ctx.createBufferSource(); noise.buffer = buffer;
      const filter = ctx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.setValueAtTime(1000, now); filter.frequency.linearRampToValueAtTime(100, now + 0.35);
      const gain = ctx.createGain(); gain.gain.setValueAtTime(1.0, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
      noise.connect(filter); filter.connect(gain); gain.connect(master); noise.start(now);
    } else if (type === 'coin' || type === 'collect' || type === 'pickup') {
      const osc1 = ctx.createOscillator(); const osc2 = ctx.createOscillator(); osc1.type = 'sine'; osc2.type = 'sine';
      osc1.frequency.setValueAtTime(987.77, now); osc2.frequency.setValueAtTime(1318.51, now + 0.08);
      const gain = ctx.createGain(); gain.gain.setValueAtTime(0.5, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      osc1.connect(gain); osc2.connect(gain); gain.connect(master);
      osc1.start(now); osc1.stop(now + 0.08); osc2.start(now + 0.08); osc2.stop(now + 0.25);
    } else if (type === 'jump' || type === 'boost') {
      const osc = ctx.createOscillator(); osc.type = 'square';
      osc.frequency.setValueAtTime(150, now); osc.frequency.exponentialRampToValueAtTime(600, now + 0.18);
      const gain = ctx.createGain(); gain.gain.setValueAtTime(0.4, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
      osc.connect(gain); gain.connect(master); osc.start(now); osc.stop(now + 0.18);
    } else if (type === 'door' || type === 'unlock') {
      const osc = ctx.createOscillator(); osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, now); osc.frequency.linearRampToValueAtTime(440, now + 0.3);
      const gain = ctx.createGain(); gain.gain.setValueAtTime(0.5, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
      osc.connect(gain); gain.connect(master); osc.start(now); osc.stop(now + 0.35);
    } else if (type === 'hurt' || type === 'damage') {
      const osc = ctx.createOscillator(); osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, now); osc.frequency.linearRampToValueAtTime(60, now + 0.2);
      const gain = ctx.createGain(); gain.gain.setValueAtTime(0.8, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      osc.connect(gain); gain.connect(master); osc.start(now); osc.stop(now + 0.2);
    } else if (type === 'victory' || type === 'win') {
      [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
        const osc = ctx.createOscillator(); osc.type = 'triangle'; osc.frequency.setValueAtTime(freq, now + idx * 0.1);
        const gain = ctx.createGain(); gain.gain.setValueAtTime(0.5, now + idx * 0.1); gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.1 + 0.3);
        osc.connect(gain); gain.connect(master); osc.start(now + idx * 0.1); osc.stop(now + idx * 0.1 + 0.3);
      });
    }
  } catch(e) {}
};
`;
