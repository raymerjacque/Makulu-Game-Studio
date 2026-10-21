import { showToast } from './toast.js';

/**
 * Visual Animation Timeline & Keyframe Recorder Dock Panel
 */
export class TimelinePanel {
  constructor(editor) {
    this.editor = editor;
    this.isPlaying = false;
    this.currentTime = 0; // seconds
    this.duration = 10;   // total seconds
    this.tracks = new Map(); // entityName -> array of keyframes [{time, pos, rot, scale}]

    this.render();
    this.bindEvents();
  }

  render() {
    this.container = document.createElement('div');
    this.container.id = 'timeline-dock-panel';
    this.container.style.cssText = `
      position: absolute;
      bottom: 22px;
      left: 240px;
      right: 320px;
      height: 140px;
      background: var(--bg-darkest);
      border-top: 1px solid var(--border-subtle);
      display: flex;
      flex-direction: column;
      z-index: 100;
      font-family: var(--font-sans);
      user-select: none;
    `;

    this.container.innerHTML = `
      <!-- Toolbar -->
      <div style="height: 32px; background: var(--bg-darker); border-bottom: 1px solid var(--border-subtle); display: flex; align-items: center; justify-content: space-between; padding: 0 12px; font-size: 11px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <button id="tl-btn-play" class="btn" style="padding: 2px 8px; color: var(--accent-green); font-weight: 700;">▶ Play</button>
          <button id="tl-btn-record" class="btn" style="padding: 2px 8px; color: var(--accent-red); font-weight: 700;">🔴 Add Keyframe</button>
          <span style="color: var(--text-muted); margin-left: 8px;">Time: <strong id="tl-time-disp" style="color: var(--text-primary);">0.0s</strong> / 10.0s</span>
        </div>
        <div style="font-size: 10px; color: var(--accent-orange); font-weight: 600;">🎬 Animation Keyframe Sequencer</div>
      </div>

      <!-- Keyframe Track Area -->
      <div id="tl-track-area" style="flex: 1; background: var(--bg-panel); position: relative; overflow-x: auto; overflow-y: auto; padding: 8px;">
        <div id="tl-time-scrubber" style="position: absolute; top: 0; bottom: 0; left: 0; width: 2px; background: var(--accent-orange); z-index: 10; pointer-events: none;"></div>
        <div id="tl-tracks-list" style="display: flex; flex-direction: column; gap: 6px;"></div>
      </div>
    `;

    document.body.appendChild(this.container);
  }

  bindEvents() {
    const playBtn = this.container.querySelector('#tl-btn-play');
    const recBtn = this.container.querySelector('#tl-btn-record');
    const timeDisp = this.container.querySelector('#tl-time-disp');
    const trackArea = this.container.querySelector('#tl-track-area');
    const scrubber = this.container.querySelector('#tl-time-scrubber');

    playBtn.addEventListener('click', () => {
      this.isPlaying = !this.isPlaying;
      playBtn.textContent = this.isPlaying ? '⏸ Pause' : '▶ Play';
      playBtn.style.color = this.isPlaying ? 'var(--accent-orange)' : 'var(--accent-green)';
    });

    recBtn.addEventListener('click', () => {
      const active = this.editor.selection.getActive();
      if (!active) {
        showToast('Select an entity in Hierarchy to record keyframe', 'warn');
        return;
      }

      if (!this.tracks.has(active.name)) {
        this.tracks.set(active.name, []);
      }

      const keyframes = this.tracks.get(active.name);
      keyframes.push({
        time: this.currentTime,
        pos: active.getPosition().clone(),
        rot: active.getEulerAngles().clone(),
        scale: active.getLocalScale().clone()
      });

      this.updateTrackDisplay();
      showToast(`🔴 Recorded keyframe for ${active.name} at ${this.currentTime.toFixed(1)}s!`, 'success');
    });

    trackArea.addEventListener('click', (e) => {
      const rect = trackArea.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const pct = Math.max(0, Math.min(1, clickX / rect.width));
      this.currentTime = pct * this.duration;
      timeDisp.textContent = `${this.currentTime.toFixed(1)}s`;
      scrubber.style.left = `${pct * 100}%`;
      this.evaluateAnimation();
    });

    // Animation Loop
    let lastTime = performance.now();
    const animLoop = (now) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      if (this.isPlaying) {
        this.currentTime += dt;
        if (this.currentTime > this.duration) this.currentTime = 0;

        timeDisp.textContent = `${this.currentTime.toFixed(1)}s`;
        const pct = (this.currentTime / this.duration) * 100;
        scrubber.style.left = `${pct}%`;

        this.evaluateAnimation();
      }

      requestAnimationFrame(animLoop);
    };
    requestAnimationFrame(animLoop);
  }

  updateTrackDisplay() {
    const list = this.container.querySelector('#tl-tracks-list');
    list.innerHTML = '';

    this.tracks.forEach((keyframes, entityName) => {
      const trackRow = document.createElement('div');
      trackRow.style.cssText = `
        display: flex;
        align-items: center;
        height: 24px;
        background: var(--bg-darker);
        border: 1px solid var(--border-subtle);
        border-radius: 4px;
        padding: 0 8px;
        font-size: 11px;
        position: relative;
      `;

      trackRow.innerHTML = `<span style="width: 120px; font-weight: 600; color: var(--text-primary); text-overflow: ellipsis; overflow: hidden;">${entityName}</span>`;

      const kfContainer = document.createElement('div');
      kfContainer.style.cssText = `flex: 1; position: relative; height: 100%;`;

      keyframes.forEach(kf => {
        const pct = (kf.time / this.duration) * 100;
        const mark = document.createElement('div');
        mark.style.cssText = `
          position: absolute;
          left: ${pct}%;
          top: 4px;
          width: 8px;
          height: 8px;
          background: var(--accent-orange);
          transform: rotate(45deg);
          border-radius: 1px;
        `;
        kfContainer.appendChild(mark);
      });

      trackRow.appendChild(kfContainer);
      list.appendChild(trackRow);
    });
  }

  evaluateAnimation() {
    if (!this.editor.runtime || !this.editor.runtime.app) return;
    const root = this.editor.runtime.app.root;

    this.tracks.forEach((keyframes, entityName) => {
      if (keyframes.length < 2) return;
      const entity = root.findByName(entityName);
      if (!entity) return;

      // Find surrounding keyframes
      let kf1 = keyframes[0];
      let kf2 = keyframes[keyframes.length - 1];

      for (let i = 0; i < keyframes.length - 1; i++) {
        if (this.currentTime >= keyframes[i].time && this.currentTime <= keyframes[i + 1].time) {
          kf1 = keyframes[i];
          kf2 = keyframes[i + 1];
          break;
        }
      }

      const duration = kf2.time - kf1.time;
      const t = duration > 0 ? (this.currentTime - kf1.time) / duration : 0;

      // Lerp position
      const pos = kf1.pos.clone().lerp(kf1.pos, kf2.pos, t);
      entity.setPosition(pos);
    });
  }
}
