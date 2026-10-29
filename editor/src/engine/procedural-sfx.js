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
      } else if (type === 'footstep') {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(80, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.08);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

        osc.connect(gain);
        gain.connect(master);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === 'teleport') {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(1600, now + 0.28);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.28);

        osc.connect(gain);
        gain.connect(master);
        osc.start(now);
        osc.stop(now + 0.28);
      } else if (type === 'powerup') {
        const notes = [440, 554.37, 659.25, 880];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          osc.type = 'square';
          osc.frequency.setValueAtTime(freq, now + idx * 0.06);

          const gain = ctx.createGain();
          gain.gain.setValueAtTime(0.3, now + idx * 0.06);
          gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.06 + 0.15);

          osc.connect(gain);
          gain.connect(master);
          osc.start(now + idx * 0.06);
          osc.stop(now + idx * 0.06 + 0.15);
        });
      } else if (type === 'shield_hit') {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.15);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.6, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

        osc.connect(gain);
        gain.connect(master);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (type === 'reload') {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        osc1.type = 'square';
        osc2.type = 'square';
        osc1.frequency.setValueAtTime(400, now);
        osc2.frequency.setValueAtTime(700, now + 0.09);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(master);
        osc1.start(now); osc1.stop(now + 0.08);
        osc2.start(now + 0.09); osc2.stop(now + 0.2);
      } else if (type === 'magic_spell') {
        [600, 900, 1200].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now);
          osc.frequency.exponentialRampToValueAtTime(freq * 1.5, now + 0.3);

          const gain = ctx.createGain();
          gain.gain.setValueAtTime(0.25, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

          osc.connect(gain);
          gain.connect(master);
          osc.start(now);
          osc.stop(now + 0.3);
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
 * Renders a procedural audio sound effect directly into a standard 16-bit PCM WAV Base64 Data URL.
 * Enables zero-dependency offline audio asset creation and inline standalone bundling.
 */
export function generateWAVDataURL(type, sampleRate = 22050) {
  const durationMap = {
    laser: 0.15,
    shoot: 0.15,
    explosion: 0.35,
    impact: 0.35,
    coin: 0.25,
    collect: 0.25,
    pickup: 0.25,
    jump: 0.18,
    boost: 0.18,
    door: 0.35,
    unlock: 0.35,
    hurt: 0.2,
    damage: 0.2,
    victory: 0.6,
    win: 0.6,
    footstep: 0.08,
    teleport: 0.28,
    powerup: 0.3,
    shield_hit: 0.15,
    reload: 0.2,
    magic_spell: 0.3
  };
  const duration = durationMap[type] || 0.3;
  const numSamples = Math.floor(sampleRate * duration);
  const samples = new Float32Array(numSamples);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    let sample = 0;

    if (type === 'laser' || type === 'shoot') {
      const freq = 880 * Math.exp(-t * 13.8);
      const phase = (2 * Math.PI * freq * t) % (2 * Math.PI);
      const saw = (phase / Math.PI) - 1;
      const gain = Math.max(0, 1 - t / 0.15);
      sample = saw * gain * 0.6;
    } else if (type === 'explosion' || type === 'impact') {
      const noise = Math.random() * 2 - 1;
      const gain = Math.max(0, 1 - t / 0.35);
      const alpha = Math.exp(-t * 10);
      sample = noise * gain * alpha;
    } else if (type === 'coin' || type === 'collect' || type === 'pickup') {
      let freq = 987.77;
      let gain = Math.max(0, 1 - t / 0.25) * 0.5;
      if (t >= 0.08) freq = 1318.51;
      sample = Math.sin(2 * Math.PI * freq * t) * gain;
    } else if (type === 'jump' || type === 'boost') {
      const freq = 150 * Math.exp(t * 7.7);
      const sq = Math.sin(2 * Math.PI * freq * t) >= 0 ? 0.4 : -0.4;
      const gain = Math.max(0, 1 - t / 0.18);
      sample = sq * gain;
    } else if (type === 'door' || type === 'unlock') {
      const freq = 220 + t * 733;
      const tri = Math.abs((((freq * t) % 1) - 0.5) * 4) - 1;
      const gain = Math.max(0, 1 - t / 0.35) * 0.5;
      sample = tri * gain;
    } else if (type === 'hurt' || type === 'damage') {
      const freq = 180 - t * 600;
      const saw = ((((freq * t) % 1) + 1) % 1) * 2 - 1;
      const gain = Math.max(0, 1 - t / 0.2) * 0.8;
      sample = saw * gain;
    } else if (type === 'victory' || type === 'win') {
      const notes = [523.25, 659.25, 783.99, 1046.50];
      const stepIdx = Math.min(3, Math.floor(t / 0.1));
      const freq = notes[stepIdx];
      const noteT = t - stepIdx * 0.1;
      const gain = Math.max(0, 1 - noteT / 0.3) * 0.5;
      const tri = Math.abs((((freq * t) % 1) - 0.5) * 4) - 1;
      sample = tri * gain;
    } else {
      sample = Math.sin(2 * Math.PI * 440 * t) * Math.max(0, 1 - t / duration) * 0.5;
    }

    samples[i] = Math.max(-1, Math.min(1, sample));
  }

  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);

  function writeString(v, offset, str) {
    for (let i = 0; i < str.length; i++) {
      v.setUint8(offset + i, str.charCodeAt(i));
    }
  }

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + numSamples * 2, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, 'data');
  view.setUint32(40, numSamples * 2, true);

  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    offset += 2;
  }

  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = typeof btoa === 'function' ? btoa(binary) : Buffer.from(binary, 'binary').toString('base64');
  return `data:audio/wav;base64,${base64}`;
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
    } else if (type === 'footstep') {
      const osc = ctx.createOscillator(); osc.type = 'sine';
      osc.frequency.setValueAtTime(80, now); osc.frequency.exponentialRampToValueAtTime(30, now + 0.08);
      const gain = ctx.createGain(); gain.gain.setValueAtTime(0.3, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
      osc.connect(gain); gain.connect(master); osc.start(now); osc.stop(now + 0.08);
    } else if (type === 'teleport') {
      const osc = ctx.createOscillator(); osc.type = 'sine';
      osc.frequency.setValueAtTime(200, now); osc.frequency.exponentialRampToValueAtTime(1600, now + 0.28);
      const gain = ctx.createGain(); gain.gain.setValueAtTime(0.5, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.28);
      osc.connect(gain); gain.connect(master); osc.start(now); osc.stop(now + 0.28);
    } else if (type === 'powerup') {
      [440, 554.37, 659.25, 880].forEach((freq, idx) => {
        const osc = ctx.createOscillator(); osc.type = 'square'; osc.frequency.setValueAtTime(freq, now + idx * 0.06);
        const gain = ctx.createGain(); gain.gain.setValueAtTime(0.3, now + idx * 0.06); gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.06 + 0.15);
        osc.connect(gain); gain.connect(master); osc.start(now + idx * 0.06); osc.stop(now + idx * 0.06 + 0.15);
      });
    } else if (type === 'shield_hit') {
      const osc = ctx.createOscillator(); osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, now); osc.frequency.exponentialRampToValueAtTime(400, now + 0.15);
      const gain = ctx.createGain(); gain.gain.setValueAtTime(0.6, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      osc.connect(gain); gain.connect(master); osc.start(now); osc.stop(now + 0.15);
    } else if (type === 'reload') {
      const osc1 = ctx.createOscillator(); const osc2 = ctx.createOscillator(); osc1.type = 'square'; osc2.type = 'square';
      osc1.frequency.setValueAtTime(400, now); osc2.frequency.setValueAtTime(700, now + 0.09);
      const gain = ctx.createGain(); gain.gain.setValueAtTime(0.4, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      osc1.connect(gain); osc2.connect(gain); gain.connect(master);
      osc1.start(now); osc1.stop(now + 0.08); osc2.start(now + 0.09); osc2.stop(now + 0.2);
    } else if (type === 'magic_spell') {
      [600, 900, 1200].forEach((freq, idx) => {
        const osc = ctx.createOscillator(); osc.type = 'sine'; osc.frequency.setValueAtTime(freq, now); osc.frequency.exponentialRampToValueAtTime(freq * 1.5, now + 0.3);
        const gain = ctx.createGain(); gain.gain.setValueAtTime(0.25, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.connect(gain); gain.connect(master); osc.start(now); osc.stop(now + 0.3);
      });
    }
  } catch(e) {}
};
`;
