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

  playCustom(params = {}, volume = 0.5) {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const waveType = params.waveType || 'sine';
      const startFreq = params.startFreq !== undefined ? params.startFreq : 440;
      const endFreq = params.endFreq !== undefined ? params.endFreq : 220;
      const attack = params.attack !== undefined ? params.attack : 0.02;
      const decay = params.decay !== undefined ? params.decay : 0.1;
      const sustain = params.sustain !== undefined ? params.sustain : 0.3;
      const release = params.release !== undefined ? params.release : 0.2;

      const master = ctx.createGain();
      master.gain.setValueAtTime(volume, now);
      master.connect(ctx.destination);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(1.0, now + attack);
      gain.gain.linearRampToValueAtTime(sustain, now + attack + decay);
      gain.gain.exponentialRampToValueAtTime(0.001, now + attack + decay + release);

      if (waveType === 'noise') {
        const dur = attack + decay + release;
        const bufferSize = Math.floor(ctx.sampleRate * Math.max(0.05, dur));
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(startFreq, now);
        filter.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), now + dur);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(master);
        noise.start(now);
      } else {
        const osc = ctx.createOscillator();
        osc.type = waveType;
        osc.frequency.setValueAtTime(Math.max(20, startFreq), now);
        osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), now + attack + decay + release);

        osc.connect(gain);
        gain.connect(master);
        osc.start(now);
        osc.stop(now + attack + decay + release + 0.05);
      }
    } catch (e) {
      console.warn('ProceduralSFXManager playCustom error:', e);
    }
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
      } else if (type === 'footstep' || type === 'footstep_grass') {
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
      } else if (type === 'footstep_stone') {
        const osc = ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.06);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.06);

        osc.connect(gain);
        gain.connect(master);
        osc.start(now);
        osc.stop(now + 0.06);
      } else if (type === 'slash_sword') {
        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.12);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.7, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

        osc.connect(gain);
        gain.connect(master);
        osc.start(now);
        osc.stop(now + 0.12);
      } else if (type === 'shield_block') {
        const osc = ctx.createOscillator();
        osc.type = 'square';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.15);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.8, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

        osc.connect(gain);
        gain.connect(master);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (type === 'reload_gun') {
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
      } else if (type === 'engine_rumble') {
        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(50, now);
        osc.frequency.linearRampToValueAtTime(80, now + 0.4);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

        osc.connect(gain);
        gain.connect(master);
        osc.start(now);
        osc.stop(now + 0.4);
      } else if (type === 'ambient_dungeon') {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(55, now);
        osc.frequency.linearRampToValueAtTime(65, now + 0.6);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);

        osc.connect(gain);
        gain.connect(master);
        osc.start(now);
        osc.stop(now + 0.6);
      } else if (type === 'thunder_bolt') {
        const bufferSize = ctx.sampleRate * 0.5;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, now);
        filter.frequency.linearRampToValueAtTime(60, now + 0.5);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(1.0, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(master);
        noise.start(now);
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
export function generateWAVDataURL(typeOrParams, sampleRate = 22050) {
  let params = {};
  if (typeof typeOrParams === 'object') {
    params = typeOrParams;
  } else {
    params = { preset: typeOrParams };
  }

  const type = params.preset || (typeof typeOrParams === 'string' ? typeOrParams : 'laser');
  const durationMap = {
    laser: 0.15, shoot: 0.15, explosion: 0.35, impact: 0.35, coin: 0.25,
    collect: 0.25, pickup: 0.25, jump: 0.18, boost: 0.18, door: 0.35,
    unlock: 0.35, hurt: 0.2, damage: 0.2, victory: 0.6, win: 0.6,
    footstep: 0.08, footstep_grass: 0.08, footstep_stone: 0.06, slash_sword: 0.12,
    shield_block: 0.15, reload_gun: 0.2, engine_rumble: 0.4, ambient_dungeon: 0.6,
    thunder_bolt: 0.5, teleport: 0.28, powerup: 0.3, shield_hit: 0.15,
    reload: 0.2, magic_spell: 0.3
  };

  const duration = params.duration || (params.attack !== undefined ? (params.attack + (params.decay || 0.1) + (params.release || 0.2)) : null) || durationMap[type] || 0.3;
  const numSamples = Math.floor(sampleRate * duration);
  const samples = new Float32Array(numSamples);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    let sample = 0;

    if (params.waveType) {
      const startFreq = params.startFreq !== undefined ? params.startFreq : 440;
      const endFreq = params.endFreq !== undefined ? params.endFreq : 220;
      const curFreq = startFreq * Math.exp(t * Math.log(Math.max(1, endFreq) / Math.max(1, startFreq)) / Math.max(0.01, duration));
      const phase = (2 * Math.PI * curFreq * t) % (2 * Math.PI);

      let rawWave = 0;
      if (params.waveType === 'sine') rawWave = Math.sin(phase);
      else if (params.waveType === 'square') rawWave = Math.sin(phase) >= 0 ? 0.5 : -0.5;
      else if (params.waveType === 'sawtooth') rawWave = (phase / Math.PI) - 1;
      else if (params.waveType === 'triangle') rawWave = Math.abs((((curFreq * t) % 1) - 0.5) * 4) - 1;
      else if (params.waveType === 'noise') rawWave = Math.random() * 2 - 1;

      let env = 1.0;
      const attack = params.attack || 0.02;
      const decay = params.decay || 0.1;
      const sustain = params.sustain !== undefined ? params.sustain : 0.3;
      if (t < attack) env = t / attack;
      else if (t < attack + decay) env = 1.0 - (1.0 - sustain) * ((t - attack) / decay);
      else env = sustain * Math.max(0, 1 - (t - attack - decay) / Math.max(0.01, duration - attack - decay));

      sample = rawWave * env;
    } else {
      // Preset synthesis formulas
      if (type === 'laser' || type === 'shoot') {
        const freq = 880 * Math.exp(-t * 12);
        sample = ((2 * ((freq * t) % 1)) - 1) * Math.exp(-t * 15) * 0.6;
      } else if (type === 'explosion' || type === 'impact' || type === 'thunder_bolt') {
        const env = Math.exp(-t * (type === 'thunder_bolt' ? 4 : 8));
        sample = (Math.random() * 2 - 1) * env;
      } else if (type === 'coin' || type === 'collect' || type === 'pickup') {
        const freq = t < 0.08 ? 987.77 : 1318.51;
        sample = Math.sin(2 * Math.PI * freq * t) * Math.exp(-t * 8) * 0.5;
      } else if (type === 'jump' || type === 'boost') {
        const freq = 150 + t * 2500;
        sample = (Math.sin(2 * Math.PI * freq * t) >= 0 ? 0.4 : -0.4) * Math.exp(-t * 10);
      } else if (type === 'door' || type === 'unlock') {
        const freq = 220 + t * 600;
        sample = (Math.abs((((freq * t) % 1) - 0.5) * 4) - 1) * Math.exp(-t * 5) * 0.5;
      } else if (type === 'hurt' || type === 'damage') {
        const freq = 180 - t * 400;
        sample = ((2 * ((freq * t) % 1)) - 1) * Math.exp(-t * 12) * 0.7;
      } else if (type === 'victory' || type === 'win') {
        const notes = [523.25, 659.25, 783.99, 1046.50];
        const step = Math.min(3, Math.floor(t / 0.12));
        const freq = notes[step];
        sample = Math.sin(2 * Math.PI * freq * t) * Math.exp(-(t - step * 0.12) * 6) * 0.5;
      } else if (type === 'footstep' || type === 'footstep_grass') {
        const freq = 80 - t * 500;
        sample = Math.sin(2 * Math.PI * Math.max(20, freq) * t) * Math.exp(-t * 25) * 0.4;
      } else if (type === 'footstep_stone') {
        const freq = 180 - t * 1500;
        sample = (Math.abs((((freq * t) % 1) - 0.5) * 4) - 1) * Math.exp(-t * 30) * 0.5;
      } else if (type === 'slash_sword') {
        const freq = 600 - t * 3000;
        sample = ((2 * ((freq * t) % 1)) - 1) * Math.exp(-t * 20) * 0.7;
      } else if (type === 'shield_block') {
        const freq = 300 - t * 1200;
        sample = (Math.sin(2 * Math.PI * Math.max(40, freq) * t) >= 0 ? 0.5 : -0.5) * Math.exp(-t * 15);
      } else if (type === 'reload_gun') {
        const freq = t < 0.09 ? 400 : 700;
        sample = (Math.sin(2 * Math.PI * freq * t) >= 0 ? 0.3 : -0.3) * Math.exp(-t * 10);
      } else if (type === 'engine_rumble' || type === 'ambient_dungeon') {
        const freq = type === 'engine_rumble' ? (50 + t * 75) : (55 + Math.sin(t * 10) * 10);
        sample = Math.sin(2 * Math.PI * freq * t) * Math.exp(-t * 2) * 0.5;
      } else if (type === 'teleport') {
        const freq = 200 + t * 4500;
        sample = Math.sin(2 * Math.PI * freq * t) * Math.exp(-t * 8) * 0.5;
      } else if (type === 'powerup') {
        const notes = [440, 554.37, 659.25, 880];
        const step = Math.min(3, Math.floor(t / 0.06));
        sample = (Math.sin(2 * Math.PI * notes[step] * t) >= 0 ? 0.3 : -0.3) * Math.exp(-(t - step * 0.06) * 12);
      } else if (type === 'shield_hit') {
        const freq = 1200 - t * 5000;
        sample = Math.sin(2 * Math.PI * Math.max(100, freq) * t) * Math.exp(-t * 18) * 0.6;
      } else if (type === 'magic_spell') {
        sample = (Math.sin(2 * Math.PI * 600 * t) + Math.sin(2 * Math.PI * 900 * t) + Math.sin(2 * Math.PI * 1200 * t)) * 0.2 * Math.exp(-t * 6);
      } else {
        sample = Math.sin(2 * Math.PI * 440 * t) * Math.exp(-t * 6) * 0.5;
      }
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
    } else if (type === 'explosion' || type === 'impact' || type === 'thunder_bolt') {
      const dur = type === 'thunder_bolt' ? 0.5 : 0.35;
      const bufferSize = ctx.sampleRate * dur;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
      const noise = ctx.createBufferSource(); noise.buffer = buffer;
      const filter = ctx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.setValueAtTime(1000, now); filter.frequency.linearRampToValueAtTime(80, now + dur);
      const gain = ctx.createGain(); gain.gain.setValueAtTime(1.0, now); gain.gain.exponentialRampToValueAtTime(0.01, now + dur);
      noise.connect(filter); filter.connect(gain); gain.connect(master); noise.start(now);
    } else if (type === 'coin' || type === 'collect' || type === 'pickup') {
      const osc1 = ctx.createOscillator(); const osc2 = ctx.createOscillator();
      osc1.type = 'sine'; osc2.type = 'sine';
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
        const osc = ctx.createOscillator(); osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.1);
        const gain = ctx.createGain(); gain.gain.setValueAtTime(0.5, now + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.1 + 0.3);
        osc.connect(gain); gain.connect(master); osc.start(now + idx * 0.1); osc.stop(now + idx * 0.1 + 0.3);
      });
    } else if (type === 'footstep' || type === 'footstep_grass' || type === 'footstep_stone') {
      const osc = ctx.createOscillator(); osc.type = type === 'footstep_stone' ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(type === 'footstep_stone' ? 180 : 80, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.08);
      const gain = ctx.createGain(); gain.gain.setValueAtTime(0.4, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
      osc.connect(gain); gain.connect(master); osc.start(now); osc.stop(now + 0.08);
    } else if (type === 'slash_sword') {
      const osc = ctx.createOscillator(); osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(600, now); osc.frequency.exponentialRampToValueAtTime(150, now + 0.12);
      const gain = ctx.createGain(); gain.gain.setValueAtTime(0.7, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
      osc.connect(gain); gain.connect(master); osc.start(now); osc.stop(now + 0.12);
    } else if (type === 'shield_block') {
      const osc = ctx.createOscillator(); osc.type = 'square';
      osc.frequency.setValueAtTime(300, now); osc.frequency.exponentialRampToValueAtTime(80, now + 0.15);
      const gain = ctx.createGain(); gain.gain.setValueAtTime(0.8, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      osc.connect(gain); gain.connect(master); osc.start(now); osc.stop(now + 0.15);
    } else if (type === 'reload_gun') {
      const osc1 = ctx.createOscillator(); const osc2 = ctx.createOscillator();
      osc1.type = 'square'; osc2.type = 'square';
      osc1.frequency.setValueAtTime(400, now); osc2.frequency.setValueAtTime(700, now + 0.09);
      const gain = ctx.createGain(); gain.gain.setValueAtTime(0.4, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      osc1.connect(gain); osc2.connect(gain); gain.connect(master);
      osc1.start(now); osc1.stop(now + 0.08); osc2.start(now + 0.09); osc2.stop(now + 0.2);
    } else if (type === 'engine_rumble' || type === 'ambient_dungeon') {
      const osc = ctx.createOscillator(); osc.type = type === 'engine_rumble' ? 'sawtooth' : 'sine';
      osc.frequency.setValueAtTime(50, now); osc.frequency.linearRampToValueAtTime(80, now + 0.4);
      const gain = ctx.createGain(); gain.gain.setValueAtTime(0.5, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
      osc.connect(gain); gain.connect(master); osc.start(now); osc.stop(now + 0.4);
    } else if (type === 'teleport') {
      const osc = ctx.createOscillator(); osc.type = 'sine';
      osc.frequency.setValueAtTime(200, now); osc.frequency.exponentialRampToValueAtTime(1600, now + 0.28);
      const gain = ctx.createGain(); gain.gain.setValueAtTime(0.5, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.28);
      osc.connect(gain); gain.connect(master); osc.start(now); osc.stop(now + 0.28);
    } else if (type === 'powerup') {
      [440, 554.37, 659.25, 880].forEach((freq, idx) => {
        const osc = ctx.createOscillator(); osc.type = 'square';
        osc.frequency.setValueAtTime(freq, now + idx * 0.06);
        const gain = ctx.createGain(); gain.gain.setValueAtTime(0.3, now + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.06 + 0.15);
        osc.connect(gain); gain.connect(master); osc.start(now + idx * 0.06); osc.stop(now + idx * 0.06 + 0.15);
      });
    } else if (type === 'shield_hit') {
      const osc = ctx.createOscillator(); osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, now); osc.frequency.exponentialRampToValueAtTime(400, now + 0.15);
      const gain = ctx.createGain(); gain.gain.setValueAtTime(0.6, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      osc.connect(gain); gain.connect(master); osc.start(now); osc.stop(now + 0.15);
    } else if (type === 'magic_spell') {
      [600, 900, 1200].forEach((freq, idx) => {
        const osc = ctx.createOscillator(); osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now); osc.frequency.exponentialRampToValueAtTime(freq * 1.5, now + 0.3);
        const gain = ctx.createGain(); gain.gain.setValueAtTime(0.25, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.connect(gain); gain.connect(master); osc.start(now); osc.stop(now + 0.3);
      });
    } else {
      const osc = ctx.createOscillator(); osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now); osc.frequency.exponentialRampToValueAtTime(220, now + 0.2);
      const gain = ctx.createGain(); gain.gain.setValueAtTime(0.5, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      osc.connect(gain); gain.connect(master); osc.start(now); osc.stop(now + 0.2);
    }
  } catch(e) {}
};
`;
