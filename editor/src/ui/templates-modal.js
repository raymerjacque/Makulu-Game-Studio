import * as pc from 'playcanvas';
import { showToast } from './toast.js';

/**
 * 1-Click Game Genre Starter Templates Modal
 */
export class TemplatesModal {
  constructor(editor) {
    this.editor = editor;
    this.isOpen = false;
    this.render();
    this.bindEvents();
  }

  render() {
    this.modal = document.createElement('div');
    this.modal.id = 'templates-modal';
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
      <div style="width: 780px; background: var(--bg-darkest); border: 1px solid var(--accent-orange); border-radius: var(--radius-lg); box-shadow: var(--shadow-lg); display: flex; flex-direction: column; overflow: hidden;">
        
        <!-- Header -->
        <div style="height: 48px; background: var(--bg-darker); border-bottom: 1px solid var(--border-subtle); display: flex; align-items: center; justify-content: space-between; padding: 0 18px;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="font-size: 20px;">🎮</div>
            <div>
              <div style="font-weight: 700; font-size: 13px; color: var(--text-primary);">Game Genre Starter Templates</div>
              <div style="font-size: 10px; color: var(--accent-orange); font-weight: 600;">1-Click Ready-to-Play Prototypes</div>
            </div>
          </div>
          <button id="template-btn-close" class="btn" style="padding: 2px 8px; font-size: 12px;">✕</button>
        </div>

        <!-- Grid of Templates -->
        <div style="padding: 20px; display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px;">
          
          <!-- Template 1: FPS Sandbox -->
          <div class="card" style="padding: 16px; display: flex; flex-direction: column; gap: 8px;">
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <span style="font-size: 24px;">🎯</span>
              <span class="badge badge-green">FPS Controller</span>
            </div>
            <h4 style="margin: 0; font-size: 13px;">First-Person Arena</h4>
            <p style="font-size: 11px; color: var(--text-secondary); margin: 0;">
              Enclosed arena with stone pillars, target dummies, directional lighting, and an active WASD player controller.
            </p>
            <button class="btn btn-primary btn-load-template" data-tmpl="fps" style="margin-top: auto; font-size: 11px; padding: 6px;">
              🚀 Load FPS Template
            </button>
          </div>

          <!-- Template 2: 3rd Person Adventure -->
          <div class="card" style="padding: 16px; display: flex; flex-direction: column; gap: 8px;">
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <span style="font-size: 24px;">🗡️</span>
              <span class="badge badge-blue">Adventure</span>
            </div>
            <h4 style="margin: 0; font-size: 13px;">Medieval Courtyard</h4>
            <p style="font-size: 11px; color: var(--text-secondary); margin: 0;">
              Green rolling hills, ancient stone pillars, glowing campfire with light flicker, and treasure chest props.
            </p>
            <button class="btn btn-primary btn-load-template" data-tmpl="adventure" style="margin-top: auto; font-size: 11px; padding: 6px;">
              🚀 Load Adventure Template
            </button>
          </div>

          <!-- Template 3: Cyberpunk Neon Corridor -->
          <div class="card" style="padding: 16px; display: flex; flex-direction: column; gap: 8px;">
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <span style="font-size: 24px;">🌆</span>
              <span class="badge badge-purple">Sci-Fi PBR</span>
            </div>
            <h4 style="margin: 0; font-size: 13px;">Cyberpunk Neon City</h4>
            <p style="font-size: 11px; color: var(--text-secondary); margin: 0;">
              Dark reflective obsidian floor, 4 glowing neon cyan & magenta pillars, spot lights, and a central hovercraft.
            </p>
            <button class="btn btn-primary btn-load-template" data-tmpl="cyber" style="margin-top: auto; font-size: 11px; padding: 6px;">
              🚀 Load Cyberpunk Template
            </button>
          </div>

          <!-- Template 4: Physics Playground -->
          <div class="card" style="padding: 16px; display: flex; flex-direction: column; gap: 8px;">
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <span style="font-size: 24px;">🎳</span>
              <span class="badge badge-orange">Physics Sandbox</span>
            </div>
            <h4 style="margin: 0; font-size: 13px;">Domino & Topple Sandbox</h4>
            <p style="font-size: 11px; color: var(--text-secondary); margin: 0;">
              A row of domino blocks, bowling pins, an inclined launch ramp, and a heavy rolling sphere.
            </p>
            <button class="btn btn-primary btn-load-template" data-tmpl="physics" style="margin-top: auto; font-size: 11px; padding: 6px;">
              🚀 Load Physics Sandbox
            </button>
          </div>

        </div>

      </div>
    `;

    document.body.appendChild(this.modal);
  }

  bindEvents() {
    const closeBtn = this.modal.querySelector('#template-btn-close');
    closeBtn.addEventListener('click', () => this.close());

    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) this.close();
    });

    this.modal.querySelectorAll('.btn-load-template').forEach(btn => {
      btn.addEventListener('click', () => {
        const tmpl = btn.dataset.tmpl;
        this.loadTemplate(tmpl);
        this.close();
      });
    });
  }

  loadTemplate(type) {
    const app = this.editor.getApp();
    if (!app) return;

    // Clear existing user entities (keep camera and grid)
    const toRemove = [];
    app.root.children.forEach(c => {
      if (c.name !== 'EditorGrid' && c.name !== 'EditorCamera') {
        toRemove.push(c);
      }
    });
    toRemove.forEach(c => app.root.removeChild(c));

    if (type === 'fps') {
      // Ground plane
      this.editor.createEntity({
        name: 'Arena Floor',
        transform: { position: [0, 0, 0], scale: [30, 0.2, 30] },
        components: [
          { type: 'render', properties: { type: 'box' } },
          { type: 'collision', properties: { type: 'box' } }
        ]
      });

      // 4 Pillars
      [[-8, -8], [8, -8], [-8, 8], [8, 8]].forEach(([x, z], i) => {
        this.editor.createEntity({
          name: `Pillar_${i + 1}`,
          transform: { position: [x, 2, z], scale: [1.2, 4, 1.2] },
          components: [
            { type: 'render', properties: { type: 'cylinder' } },
            { type: 'collision', properties: { type: 'cylinder' } }
          ]
        });
      });

      // Sun Light
      this.editor.createEntity({
        name: 'Sunlight',
        transform: { position: [0, 10, 0], rotation: [45, 30, 0] },
        components: [
          { type: 'light', properties: { type: 'directional', intensity: 2 } }
        ]
      });

      // Target boxes
      [[-2, 1, -4], [0, 1, -5], [2, 1, -4]].forEach(([x, y, z], i) => {
        this.editor.createEntity({
          name: `Target_Dummy_${i + 1}`,
          transform: { position: [x, y, z], scale: [0.8, 1.6, 0.8] },
          components: [
            { type: 'render', properties: { type: 'box' } }
          ]
        });
      });

      // Player Entity
      const player = this.editor.createEntity({
        name: 'FPS Player Character',
        transform: { position: [0, 1, 4], scale: [0.8, 1.8, 0.8] },
        components: [
          { type: 'render', properties: { type: 'capsule' } }
        ]
      });
      if (this.editor.behaviors) {
        this.editor.behaviors.attachBehavior(player, 'wasd', { speed: 8 });
      }

      showToast('🚀 Loaded FPS Character Sandbox Template!', 'success');

    } else if (type === 'cyber') {
      // Dark ground
      this.editor.createEntity({
        name: 'Cyber Floor',
        transform: { position: [0, 0, 0], scale: [25, 0.2, 25] },
        components: [{ type: 'render', properties: { type: 'box' } }]
      });

      // Neon Cyan Pillars
      [[-5, -4], [-5, 4]].forEach(([x, z], i) => {
        const p = this.editor.createEntity({
          name: `Cyan_Neon_${i + 1}`,
          transform: { position: [x, 2.5, z], scale: [0.6, 5, 0.6] },
          components: [{ type: 'render', properties: { type: 'cylinder' } }]
        });
        this.editor.createEntity({
          name: `Cyan_Light_${i + 1}`,
          transform: { position: [x, 4, z] },
          components: [{ type: 'light', properties: { type: 'point', color: new pc.Color(0, 0.9, 1), intensity: 3, range: 12 } }]
        });
      });

      // Neon Magenta Pillars
      [[5, -4], [5, 4]].forEach(([x, z], i) => {
        const p = this.editor.createEntity({
          name: `Magenta_Neon_${i + 1}`,
          transform: { position: [x, 2.5, z], scale: [0.6, 5, 0.6] },
          components: [{ type: 'render', properties: { type: 'cylinder' } }]
        });
        this.editor.createEntity({
          name: `Magenta_Light_${i + 1}`,
          transform: { position: [x, 4, z] },
          components: [{ type: 'light', properties: { type: 'point', color: new pc.Color(1, 0, 0.8), intensity: 3, range: 12 } }]
        });
      });

      // Central Hover Vehicle
      const car = this.editor.createEntity({
        name: 'Cyber Hovercraft',
        transform: { position: [0, 1.2, 0], scale: [2.2, 0.6, 3.8] },
        components: [{ type: 'render', properties: { type: 'box' } }]
      });
      if (this.editor.behaviors) {
        this.editor.behaviors.attachBehavior(car, 'spin', { speed: 20, axis: 'y' });
      }

      showToast('🚀 Loaded Cyberpunk Neon Template!', 'success');

    } else if (type === 'adventure') {
      // Courtyard with fire
      this.editor.createEntity({
        name: 'Courtyard Grass',
        transform: { position: [0, 0, 0], scale: [35, 0.2, 35] },
        components: [{ type: 'render', properties: { type: 'box' } }]
      });

      // Center Campfire
      this.editor.createEntity({
        name: 'Fire Pit Stones',
        transform: { position: [0, 0.3, 0], scale: [1.8, 0.4, 1.8] },
        components: [{ type: 'render', properties: { type: 'cylinder' } }]
      });

      const torch = this.editor.createEntity({
        name: 'Campfire Flame Light',
        transform: { position: [0, 1.5, 0] },
        components: [
          { type: 'light', properties: { type: 'point', color: new pc.Color(1, 0.55, 0.1), intensity: 4, range: 14 } }
        ]
      });
      if (this.editor.behaviors) {
        this.editor.behaviors.attachBehavior(torch, 'light_flicker', { variance: 0.8 });
      }

      // Treasure Chest
      this.editor.createEntity({
        name: 'Treasure Chest',
        transform: { position: [4, 0.5, 3], scale: [1.2, 0.8, 0.9] },
        components: [{ type: 'render', properties: { type: 'box' } }]
      });

      showToast('🚀 Loaded Medieval Courtyard Adventure Template!', 'success');

    } else if (type === 'physics') {
      // Floor
      this.editor.createEntity({
        name: 'Floor Base',
        transform: { position: [0, 0, 0], scale: [30, 0.2, 30] },
        components: [{ type: 'render', properties: { type: 'box' } }]
      });

      // Row of Domino Blocks
      for (let i = 0; i < 7; i++) {
        this.editor.createEntity({
          name: `Domino_${i + 1}`,
          transform: { position: [0, 1.2, -4 + i * 1.5], scale: [1.4, 2.2, 0.3] },
          components: [
            { type: 'render', properties: { type: 'box' } },
            { type: 'rigidbody', properties: { type: 'dynamic', mass: 1 } },
            { type: 'collision', properties: { type: 'box' } }
          ]
        });
      }

      // Ball
      const ball = this.editor.createEntity({
        name: 'Bowling Sphere',
        transform: { position: [0, 2, -6], scale: [1.5, 1.5, 1.5] },
        components: [
          { type: 'render', properties: { type: 'sphere' } },
          { type: 'rigidbody', properties: { type: 'dynamic', mass: 5 } },
          { type: 'collision', properties: { type: 'sphere' } }
        ]
      });
      if (this.editor.behaviors) {
        this.editor.behaviors.attachBehavior(ball, 'wasd', { speed: 10 });
      }

      showToast('🚀 Loaded Domino & Physics Sandbox Template! Press ▶ Play to test!', 'success');
    }

    this.editor.events.emit('scene:changed');
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
