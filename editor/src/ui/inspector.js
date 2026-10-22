import * as pc from 'playcanvas';
import { MaterialPreviewRenderer } from './material-preview.js';
import { showToast } from './toast.js';

/**
 * Entity & Component Inspector Panel
 * Dynamically switches between Beginner-Friendly Simple Mode and Technical Pro Mode.
 */
export class InspectorPanel {
  constructor(container, editor, codeEditorModal = null) {
    this.container = container;
    this.editor = editor;
    this.codeEditor = codeEditorModal;
    this.currentEntity = null;
    this.matPreview = null;

    this.render();
    this.bindEvents();
  }

  render() {
    this.container.innerHTML = `
      <div class="panel-header">
        <span>Inspector</span>
        <div class="panel-header-actions" id="inspector-actions"></div>
      </div>
      <div class="inspector-body" id="inspector-content">
        <div style="padding: 24px 12px; text-align: center; color: var(--text-muted); font-size: 12px;">
          Select an entity from Hierarchy or click one in the 3D Viewport to inspect properties.
        </div>
      </div>
    `;
  }

  bindEvents() {
    this.editor.selection.subscribe((selected, active) => {
      this.currentEntity = active;
      this.updateView();
    });

    this.editor.events.on('entity:transformed', (entity) => {
      if (this.currentEntity === entity) {
        this.syncTransformInputs();
      }
    });

    this.editor.events.on('entity:component:changed', (entity) => {
      if (this.currentEntity === entity) {
        this.updateView();
      }
    });

    this.editor.events.on('mode:changed', () => {
      this.updateView();
    });
  }

  updateView() {
    if (this.matPreview) {
      this.matPreview.destroy();
      this.matPreview = null;
    }

    const body = this.container.querySelector('#inspector-content');
    if (!this.currentEntity) {
      body.innerHTML = `
        <div style="padding: 30px 16px; text-align: center; color: var(--text-muted); font-size: 12px;">
          <div style="font-size: 24px; margin-bottom: 8px;">🎯</div>
          <div>No entity selected.</div>
          <div style="font-size: 11px; margin-top: 4px;">Click an object in the 3D scene or choose one from the Hierarchy.</div>
        </div>
      `;
      return;
    }

    const ent = this.currentEntity;
    const isSimple = this.editor.mode === 'simple';

    if (isSimple) {
      this.renderSimpleModeView(body, ent);
    } else {
      this.renderProModeView(body, ent);
    }
  }

  /* ========================================================================= */
  /* 🌱 SIMPLE / NOVICE MODE VIEW                                              */
  /* ========================================================================= */
  renderSimpleModeView(body, ent) {
    const hasWasd = this.editor.behaviors ? this.editor.behaviors.hasBehavior(ent, 'wasd') : false;
    const hasSpin = this.editor.behaviors ? this.editor.behaviors.hasBehavior(ent, 'spin') : false;
    const hasFlicker = this.editor.behaviors ? this.editor.behaviors.hasBehavior(ent, 'light_flicker') : false;
    const hasPatrol = this.editor.behaviors ? this.editor.behaviors.hasBehavior(ent, 'patrol') : false;
    const hasImpulse = this.editor.behaviors ? this.editor.behaviors.hasBehavior(ent, 'physics_impulse') : false;
    const hasSine = this.editor.behaviors ? this.editor.behaviors.hasBehavior(ent, 'sine_float') : false;
    const hasOrbit = this.editor.behaviors ? this.editor.behaviors.hasBehavior(ent, 'orbit') : false;
    const hasCamFollow = this.editor.behaviors ? this.editor.behaviors.hasBehavior(ent, 'camera_follow') : false;
    const hasBillboard = this.editor.behaviors ? this.editor.behaviors.hasBehavior(ent, 'billboard') : false;
    const hasCollectible = this.editor.behaviors ? this.editor.behaviors.hasBehavior(ent, 'collectible') : false;
    const hasHealth = this.editor.behaviors ? this.editor.behaviors.hasBehavior(ent, 'health') : false;
    const hasDamage = this.editor.behaviors ? this.editor.behaviors.hasBehavior(ent, 'damage_dealer') : false;
    const hasHealthPickup = this.editor.behaviors ? this.editor.behaviors.hasBehavior(ent, 'health_pickup') : false;
    const hasTrigger = this.editor.triggers ? this.editor.triggers.hasTrigger(ent.name) : false;

    body.innerHTML = `
      <!-- Mode Banner -->
      <div style="background: rgba(16, 185, 129, 0.12); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: var(--radius-md); padding: 8px 10px; display: flex; align-items: center; justify-content: space-between;">
        <span style="color: var(--accent-green); font-weight: 700; font-size: 11px;">🌱 SIMPLE MODE ACTIVE</span>
        <label class="toggle-switch">
          <input type="checkbox" id="entity-enabled" ${ent.enabled ? 'checked' : ''}>
          <span class="toggle-slider"></span>
        </label>
      </div>

      <!-- Entity Name -->
      <div class="inspector-section">
        <div class="inspector-section-header"><span>Object Name</span></div>
        <div class="inspector-section-content">
          <input type="text" id="entity-name-input" class="text-input" value="${ent.name}">
        </div>
      </div>

      <!-- 1-Click Quick Color Swatches -->
      <div class="inspector-section">
        <div class="inspector-section-header"><span>🎨 Quick Appearance Color</span></div>
        <div class="inspector-section-content">
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px;" id="simple-color-swatches">
            <button class="btn" data-color="#ff6600" style="background: #ff6600; height: 28px; border: none;"></button>
            <button class="btn" data-color="#ef4444" style="background: #ef4444; height: 28px; border: none;"></button>
            <button class="btn" data-color="#3b82f6" style="background: #3b82f6; height: 28px; border: none;"></button>
            <button class="btn" data-color="#10b981" style="background: #10b981; height: 28px; border: none;"></button>
            <button class="btn" data-color="#eab308" style="background: #eab308; height: 28px; border: none;"></button>
            <button class="btn" data-color="#a855f7" style="background: #a855f7; height: 28px; border: none;"></button>
            <button class="btn" data-color="#ffffff" style="background: #ffffff; height: 28px; border: none;"></button>
            <button class="btn" data-color="#1e293b" style="background: #1e293b; height: 28px; border: none;"></button>
          </div>
        </div>
      </div>

      <!-- Quick Size Buttons -->
      <div class="inspector-section">
        <div class="inspector-section-header"><span>📏 Object Size</span></div>
        <div class="inspector-section-content" style="display: flex; gap: 6px;">
          <button class="btn" id="btn-size-sm" style="flex: 1;">⚪ Small</button>
          <button class="btn" id="btn-size-md" style="flex: 1;">📦 Medium</button>
          <button class="btn" id="btn-size-lg" style="flex: 1;">🏢 Large</button>
        </div>
      </div>

      <!-- Quick Nudge Placement -->
      <div class="inspector-section">
        <div class="inspector-section-header"><span>🕹️ Easy Placement</span></div>
        <div class="inspector-section-content" style="display: flex; flex-direction: column; gap: 6px;">
          <div style="display: flex; gap: 6px;">
            <button class="btn" id="nudge-up" style="flex: 1;">⬆ Lift Higher (+1m)</button>
            <button class="btn" id="nudge-down" style="flex: 1;">⬇ Lower Ground (-1m)</button>
          </div>
          <div style="display: flex; gap: 6px;">
            <button class="btn" id="nudge-left" style="flex: 1;">⬅ Move Left</button>
            <button class="btn" id="nudge-right" style="flex: 1;">➡ Move Right</button>
          </div>
          <button class="btn btn-primary" id="btn-center-origin" style="font-size: 11px;">🎯 Center at Origin (0, 0, 0)</button>
        </div>
      </div>

      <!-- Plug-and-Play No-Code Behaviors -->
      <div class="inspector-section" style="border-color: var(--accent-orange);">
        <div class="inspector-section-header" style="background: rgba(255,102,0,0.15); color: var(--accent-orange);">
          <span>⚡ No-Code Game Behaviors</span>
        </div>
        <div class="inspector-section-content" style="display: flex; flex-direction: column; gap: 8px;">
          ${hasWasd ? `
            <div style="display: flex; align-items: center; justify-content: space-between; background: rgba(16,185,129,0.15); border: 1px solid #10b981; border-radius: 6px; padding: 6px 10px; font-size: 11px;">
              <span style="color: #10b981; font-weight: 600;">🎮 WASD Controller Active (WASD/Arrows)</span>
              <button class="btn btn-icon btn-sm" id="remove-wasd-behavior" title="Remove Controller" style="color: #ef4444; width: 22px; height: 22px; font-size: 11px; padding: 0;">✕</button>
            </div>
          ` : `
            <button class="btn" id="add-wasd-behavior" style="justify-content: flex-start; gap: 8px;">
              <span>🎮</span> <span>Make Player WASD Controlled</span>
            </button>
          `}

          ${hasSpin ? `
            <div style="display: flex; align-items: center; justify-content: space-between; background: rgba(59,130,246,0.15); border: 1px solid #3b82f6; border-radius: 6px; padding: 6px 10px; font-size: 11px;">
              <span style="color: #60a5fa; font-weight: 600;">🔄 Continuous Spin Active</span>
              <button class="btn btn-icon btn-sm" id="remove-spin-behavior" title="Remove Spin" style="color: #ef4444; width: 22px; height: 22px; font-size: 11px; padding: 0;">✕</button>
            </div>
          ` : `
            <button class="btn" id="add-spin-behavior" style="justify-content: flex-start; gap: 8px;">
              <span>🔄</span> <span>Add Continuous Spin</span>
            </button>
          `}

          ${hasFlicker ? `
            <div style="display: flex; align-items: center; justify-content: space-between; background: rgba(234,179,8,0.15); border: 1px solid #eab308; border-radius: 6px; padding: 6px 10px; font-size: 11px;">
              <span style="color: #facc15; font-weight: 600;">💡 Flame/Light Flicker Active</span>
              <button class="btn btn-icon btn-sm" id="remove-flicker-behavior" title="Remove Flicker" style="color: #ef4444; width: 22px; height: 22px; font-size: 11px; padding: 0;">✕</button>
            </div>
          ` : `
            <button class="btn" id="add-flicker-behavior" style="justify-content: flex-start; gap: 8px;">
              <span>💡</span> <span>Add Flame/Light Flicker</span>
            </button>
          `}

          ${hasPatrol ? `
            <div style="display: flex; align-items: center; justify-content: space-between; background: rgba(168,85,247,0.15); border: 1px solid #a855f7; border-radius: 6px; padding: 6px 10px; font-size: 11px;">
              <span style="color: #c084fc; font-weight: 600;">🚶 Patrol Movement Active</span>
              <button class="btn btn-icon btn-sm" id="remove-patrol-behavior" title="Remove Patrol" style="color: #ef4444; width: 22px; height: 22px; font-size: 11px; padding: 0;">✕</button>
            </div>
          ` : `
            <button class="btn" id="add-patrol-behavior" style="justify-content: flex-start; gap: 8px;">
              <span>🚶</span> <span>Add Patrol Back-and-Forth Movement</span>
            </button>
          `}

          ${hasImpulse ? `
            <div style="display: flex; align-items: center; justify-content: space-between; background: rgba(168,85,247,0.15); border: 1px solid #a855f7; border-radius: 6px; padding: 6px 10px; font-size: 11px;">
              <span style="color: #c084fc; font-weight: 600;">💥 Spacebar Jump Active</span>
              <button class="btn btn-icon btn-sm" id="remove-impulse-behavior" title="Remove Jump" style="color: #ef4444; width: 22px; height: 22px; font-size: 11px; padding: 0;">✕</button>
            </div>
          ` : `
            <button class="btn" id="add-impulse-behavior" style="justify-content: flex-start; gap: 8px;">
              <span>💥</span> <span>Add Spacebar Physics Jump</span>
            </button>
          `}

          ${hasSine ? `
            <div style="display: flex; align-items: center; justify-content: space-between; background: rgba(0,229,255,0.15); border: 1px solid #00e5ff; border-radius: 6px; padding: 6px 10px; font-size: 11px;">
              <span style="color: #00e5ff; font-weight: 600;">🌊 Sine Wave Floating Active</span>
              <button class="btn btn-icon btn-sm" id="remove-sine-behavior" title="Remove Floating" style="color: #ef4444; width: 22px; height: 22px; font-size: 11px; padding: 0;">✕</button>
            </div>
          ` : `
            <button class="btn" id="add-sine-behavior" style="justify-content: flex-start; gap: 8px;">
              <span>🌊</span> <span>Add Sine Wave Floating</span>
            </button>
          `}

          ${hasOrbit ? `
            <div style="display: flex; align-items: center; justify-content: space-between; background: rgba(234,179,8,0.15); border: 1px solid #eab308; border-radius: 6px; padding: 6px 10px; font-size: 11px;">
              <span style="color: #facc15; font-weight: 600;">💫 Orbit Movement Active</span>
              <button class="btn btn-icon btn-sm" id="remove-orbit-behavior" title="Remove Orbit" style="color: #ef4444; width: 22px; height: 22px; font-size: 11px; padding: 0;">✕</button>
            </div>
          ` : `
            <button class="btn" id="add-orbit-behavior" style="justify-content: flex-start; gap: 8px;">
              <span>💫</span> <span>Add Orbit Movement</span>
            </button>
          `}

          ${hasCamFollow ? `
            <div style="display: flex; align-items: center; justify-content: space-between; background: rgba(34,197,94,0.15); border: 1px solid #22c55e; border-radius: 6px; padding: 6px 10px; font-size: 11px;">
              <span style="color: #4ade80; font-weight: 600;">🎥 Camera Follow Target Active</span>
              <button class="btn btn-icon btn-sm" id="remove-camfollow-behavior" title="Remove Follow" style="color: #ef4444; width: 22px; height: 22px; font-size: 11px; padding: 0;">✕</button>
            </div>
          ` : `
            <button class="btn" id="add-camfollow-behavior" style="justify-content: flex-start; gap: 8px;">
              <span>🎥</span> <span>Set Camera Follow Target</span>
            </button>
          `}

          ${hasBillboard ? `
            <div style="display: flex; align-items: center; justify-content: space-between; background: rgba(236,72,153,0.15); border: 1px solid #ec4899; border-radius: 6px; padding: 6px 10px; font-size: 11px;">
              <span style="color: #f472b6; font-weight: 600;">🎯 Billboard Facing Active</span>
              <button class="btn btn-icon btn-sm" id="remove-billboard-behavior" title="Remove Billboard" style="color: #ef4444; width: 22px; height: 22px; font-size: 11px; padding: 0;">✕</button>
            </div>
          ` : `
            <button class="btn" id="add-billboard-behavior" style="justify-content: flex-start; gap: 8px;">
              <span>🎯</span> <span>Make Billboard (Face Camera)</span>
            </button>
          `}

          ${hasCollectible ? `
            <div style="display: flex; align-items: center; justify-content: space-between; background: rgba(251,146,60,0.15); border: 1px solid #fb923c; border-radius: 6px; padding: 6px 10px; font-size: 11px;">
              <span style="color: #fb923c; font-weight: 600;">💎 Collectible Item Pickup Active</span>
              <button class="btn btn-icon btn-sm" id="remove-collectible-behavior" title="Remove Collectible" style="color: #ef4444; width: 22px; height: 22px; font-size: 11px; padding: 0;">✕</button>
            </div>
          ` : `
            <button class="btn" id="add-collectible-behavior" style="justify-content: flex-start; gap: 8px;">
              <span>💎</span> <span>Make Collectible Item Pickup</span>
            </button>
          `}

          ${hasHealth ? `
            <div style="display: flex; align-items: center; justify-content: space-between; background: rgba(239,68,68,0.15); border: 1px solid #ef4444; border-radius: 6px; padding: 6px 10px; font-size: 11px;">
              <span style="color: #f87171; font-weight: 600;">❤️ Health Component Active</span>
              <button class="btn btn-icon btn-sm" id="remove-health-behavior" title="Remove Health" style="color: #ef4444; width: 22px; height: 22px; font-size: 11px; padding: 0;">✕</button>
            </div>
          ` : `
            <button class="btn" id="add-health-behavior" style="justify-content: flex-start; gap: 8px;">
              <span>❤️</span> <span>Add Health Component (100 HP)</span>
            </button>
          `}

          ${hasDamage ? `
            <div style="display: flex; align-items: center; justify-content: space-between; background: rgba(239,68,68,0.15); border: 1px solid #ef4444; border-radius: 6px; padding: 6px 10px; font-size: 11px;">
              <span style="color: #ef4444; font-weight: 600;">⚔️ Damage Dealer Hazard Active</span>
              <button class="btn btn-icon btn-sm" id="remove-damage-behavior" title="Remove Damage" style="color: #ef4444; width: 22px; height: 22px; font-size: 11px; padding: 0;">✕</button>
            </div>
          ` : `
            <button class="btn" id="add-damage-behavior" style="justify-content: flex-start; gap: 8px;">
              <span>⚔️</span> <span>Make Damage Dealer Hazard</span>
            </button>
          `}

          ${hasHealthPickup ? `
            <div style="display: flex; align-items: center; justify-content: space-between; background: rgba(34,197,94,0.15); border: 1px solid #22c55e; border-radius: 6px; padding: 6px 10px; font-size: 11px;">
              <span style="color: #4ade80; font-weight: 600;">💚 Health Potion Pickup Active</span>
              <button class="btn btn-icon btn-sm" id="remove-hp-pickup-behavior" title="Remove Health Pickup" style="color: #ef4444; width: 22px; height: 22px; font-size: 11px; padding: 0;">✕</button>
            </div>
          ` : `
            <button class="btn" id="add-hp-pickup-behavior" style="justify-content: flex-start; gap: 8px;">
              <span>💚</span> <span>Make Health Potion (+25 HP Pickup)</span>
            </button>
          `}

          <button class="btn" id="add-trigger-behavior" style="justify-content: flex-start; gap: 8px;">
            <span>⚡</span> <span>Add Teleport Trigger Volume</span>
          </button>
        </div>
      </div>
    `;

    // Bind Simple Mode actions
    body.querySelector('#entity-enabled').addEventListener('change', (e) => {
      ent.enabled = e.target.checked;
    });

    body.querySelector('#entity-name-input').addEventListener('change', (e) => {
      ent.name = e.target.value;
      this.editor.events.emit('scene:changed');
    });

    // Swatches
    body.querySelectorAll('#simple-color-swatches .btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const hex = btn.dataset.color;
        const r = parseInt(hex.slice(1, 3), 16) / 255;
        const g = parseInt(hex.slice(3, 5), 16) / 255;
        const b = parseInt(hex.slice(5, 7), 16) / 255;

        if (ent.render) {
          if (!ent.render.material) {
            ent.render.material = new pc.StandardMaterial();
          }
          ent.render.material.diffuse = new pc.Color(r, g, b);
          ent.render.material.update();
        }
      });
    });

    // Size
    body.querySelector('#btn-size-sm').addEventListener('click', () => {
      ent.setLocalScale(0.5, 0.5, 0.5);
      this.editor.events.emit('entity:transformed', ent);
    });
    body.querySelector('#btn-size-md').addEventListener('click', () => {
      ent.setLocalScale(1.0, 1.0, 1.0);
      this.editor.events.emit('entity:transformed', ent);
    });
    body.querySelector('#btn-size-lg').addEventListener('click', () => {
      ent.setLocalScale(2.5, 2.5, 2.5);
      this.editor.events.emit('entity:transformed', ent);
    });

    // Nudge
    body.querySelector('#nudge-up').addEventListener('click', () => {
      ent.translate(0, 1, 0);
      this.editor.events.emit('entity:transformed', ent);
    });
    body.querySelector('#nudge-down').addEventListener('click', () => {
      ent.translate(0, -1, 0);
      this.editor.events.emit('entity:transformed', ent);
    });
    body.querySelector('#nudge-left').addEventListener('click', () => {
      ent.translate(-1, 0, 0);
      this.editor.events.emit('entity:transformed', ent);
    });
    body.querySelector('#nudge-right').addEventListener('click', () => {
      ent.translate(1, 0, 0);
      this.editor.events.emit('entity:transformed', ent);
    });
    body.querySelector('#btn-center-origin').addEventListener('click', () => {
      ent.setPosition(0, ent.getLocalScale().y / 2, 0);
      ent.setEulerAngles(0, 0, 0);
      this.editor.events.emit('entity:transformed', ent);
    });

    // Behaviors
    const addSpinBtn = body.querySelector('#add-spin-behavior');
    if (addSpinBtn) {
      addSpinBtn.addEventListener('click', () => {
        if (this.editor.behaviors) {
          this.editor.behaviors.attachBehavior(ent, 'spin', { speed: 45, axis: 'y' });
          showToast(`🔄 Attached Continuous Spin to ${ent.name}!`, 'success');
          this.inspect(ent);
        }
      });
    }

    // Health Behavior
    const addHealthBtn = body.querySelector('#add-health-behavior');
    if (addHealthBtn) {
      addHealthBtn.addEventListener('click', () => {
        if (this.editor.behaviors) {
          this.editor.behaviors.attachBehavior(ent, 'health', { maxHp: 100, currentHp: 100 });
          showToast(`❤️ Attached Health Component (100 HP) to ${ent.name}!`, 'success');
          this.updateView();
        }
      });
    }
    const remHealthBtn = body.querySelector('#remove-health-behavior');
    if (remHealthBtn) {
      remHealthBtn.addEventListener('click', () => {
        if (this.editor.behaviors) {
          this.editor.behaviors.removeBehavior(ent, 'health');
          showToast(`Removed Health Component from ${ent.name}.`, 'info');
          this.updateView();
        }
      });
    }

    // Damage Dealer Behavior
    const addDamageBtn = body.querySelector('#add-damage-behavior');
    if (addDamageBtn) {
      addDamageBtn.addEventListener('click', () => {
        if (this.editor.behaviors) {
          this.editor.behaviors.attachBehavior(ent, 'damage_dealer', { damage: 20, radius: 1.8 });
          showToast(`⚔️ Set ${ent.name} as Damage Dealer Hazard (20 Damage)!`, 'success');
          this.updateView();
        }
      });
    }
    const remDamageBtn = body.querySelector('#remove-damage-behavior');
    if (remDamageBtn) {
      remDamageBtn.addEventListener('click', () => {
        if (this.editor.behaviors) {
          this.editor.behaviors.removeBehavior(ent, 'damage_dealer');
          showToast(`Removed Damage Dealer Hazard from ${ent.name}.`, 'info');
          this.updateView();
        }
      });
    }

    // Health Pickup Behavior
    const addHpPickupBtn = body.querySelector('#add-hp-pickup-behavior');
    if (addHpPickupBtn) {
      addHpPickupBtn.addEventListener('click', () => {
        if (this.editor.behaviors) {
          this.editor.behaviors.attachBehavior(ent, 'health_pickup', { healAmount: 25, radius: 1.5 });
          showToast(`💚 Set ${ent.name} as Health Potion Pickup (+25 HP)!`, 'success');
          this.updateView();
        }
      });
    }
    const remHpPickupBtn = body.querySelector('#remove-hp-pickup-behavior');
    if (remHpPickupBtn) {
      remHpPickupBtn.addEventListener('click', () => {
        if (this.editor.behaviors) {
          this.editor.behaviors.removeBehavior(ent, 'health_pickup');
          showToast(`Removed Health Pickup from ${ent.name}.`, 'info');
          this.updateView();
        }
      });
    }
    const remSpinBtn = body.querySelector('#remove-spin-behavior');
    if (remSpinBtn) {
      remSpinBtn.addEventListener('click', () => {
        if (this.editor.behaviors) {
          this.editor.behaviors.removeBehavior(ent, 'spin');
          showToast(`Removed Spin Behavior from ${ent.name}.`, 'info');
          this.inspect(ent);
        }
      });
    }

    const addWasdBtn = body.querySelector('#add-wasd-behavior');
    if (addWasdBtn) {
      addWasdBtn.addEventListener('click', () => {
        if (this.editor.behaviors) {
          this.editor.behaviors.attachBehavior(ent, 'wasd', { speed: 8 });
          showToast(`🎮 Attached WASD Player Controller to ${ent.name}! Press ▶ Play to test!`, 'success');
          this.inspect(ent);
        }
      });
    }
    const remWasdBtn = body.querySelector('#remove-wasd-behavior');
    if (remWasdBtn) {
      remWasdBtn.addEventListener('click', () => {
        if (this.editor.behaviors) {
          this.editor.behaviors.removeBehavior(ent, 'wasd');
          showToast(`Removed WASD Controller from ${ent.name}.`, 'info');
          this.inspect(ent);
        }
      });
    }

    const addFlickerBtn = body.querySelector('#add-flicker-behavior');
    if (addFlickerBtn) {
      addFlickerBtn.addEventListener('click', () => {
        if (this.editor.behaviors) {
          this.editor.behaviors.attachBehavior(ent, 'light_flicker', { variance: 0.5 });
          showToast(`💡 Attached Light Flicker Behavior to ${ent.name}!`, 'success');
          this.updateView();
        }
      });
    }
    const remFlickerBtn = body.querySelector('#remove-flicker-behavior');
    if (remFlickerBtn) {
      remFlickerBtn.addEventListener('click', () => {
        if (this.editor.behaviors) {
          this.editor.behaviors.removeBehavior(ent, 'light_flicker');
          showToast(`Removed Light Flicker from ${ent.name}.`, 'info');
          this.updateView();
        }
      });
    }

    const addPatrolBtn = body.querySelector('#add-patrol-behavior');
    if (addPatrolBtn) {
      addPatrolBtn.addEventListener('click', () => {
        if (this.editor.behaviors) {
          this.editor.behaviors.attachBehavior(ent, 'patrol', { speed: 3, distance: 6 });
          showToast(`🚶 Attached Patrol Behavior to ${ent.name}!`, 'success');
          this.updateView();
        }
      });
    }
    const remPatrolBtn = body.querySelector('#remove-patrol-behavior');
    if (remPatrolBtn) {
      remPatrolBtn.addEventListener('click', () => {
        if (this.editor.behaviors) {
          this.editor.behaviors.removeBehavior(ent, 'patrol');
          showToast(`Removed Patrol Behavior from ${ent.name}.`, 'info');
          this.updateView();
        }
      });
    }

    const addImpulseBtn = body.querySelector('#add-impulse-behavior');
    if (addImpulseBtn) {
      addImpulseBtn.addEventListener('click', () => {
        if (this.editor.behaviors) {
          if (!ent.rigidbody) this.editor.addComponent(ent, 'rigidbody', { type: 'dynamic' });
          if (!ent.collision) this.editor.addComponent(ent, 'collision', { type: 'box' });
          this.editor.behaviors.attachBehavior(ent, 'physics_impulse', { force: 8 });
          showToast(`💥 Attached Physics Jump to ${ent.name}! Press Spacebar during ▶ Play to jump!`, 'success');
          this.updateView();
        }
      });
    }
    const remImpulseBtn = body.querySelector('#remove-impulse-behavior');
    if (remImpulseBtn) {
      remImpulseBtn.addEventListener('click', () => {
        if (this.editor.behaviors) {
          this.editor.behaviors.removeBehavior(ent, 'physics_impulse');
          showToast(`Removed Physics Jump from ${ent.name}.`, 'info');
          this.updateView();
        }
      });
    }

    // Sine Wave Floating
    const addSineBtn = body.querySelector('#add-sine-behavior');
    if (addSineBtn) {
      addSineBtn.addEventListener('click', () => {
        if (this.editor.behaviors) {
          this.editor.behaviors.attachBehavior(ent, 'sine_float', { amplitude: 0.5, frequency: 2.0 });
          showToast(`🌊 Attached Sine Wave Floating to ${ent.name}!`, 'success');
          this.updateView();
        }
      });
    }
    const remSineBtn = body.querySelector('#remove-sine-behavior');
    if (remSineBtn) {
      remSineBtn.addEventListener('click', () => {
        if (this.editor.behaviors) {
          this.editor.behaviors.removeBehavior(ent, 'sine_float');
          showToast(`Removed Sine Floating from ${ent.name}.`, 'info');
          this.updateView();
        }
      });
    }

    // Orbit Movement
    const addOrbitBtn = body.querySelector('#add-orbit-behavior');
    if (addOrbitBtn) {
      addOrbitBtn.addEventListener('click', () => {
        if (this.editor.behaviors) {
          this.editor.behaviors.attachBehavior(ent, 'orbit', { speed: 1.0, radius: 5.0 });
          showToast(`💫 Attached Orbit Movement to ${ent.name}!`, 'success');
          this.updateView();
        }
      });
    }
    const remOrbitBtn = body.querySelector('#remove-orbit-behavior');
    if (remOrbitBtn) {
      remOrbitBtn.addEventListener('click', () => {
        if (this.editor.behaviors) {
          this.editor.behaviors.removeBehavior(ent, 'orbit');
          showToast(`Removed Orbit Movement from ${ent.name}.`, 'info');
          this.updateView();
        }
      });
    }

    // Camera Follow Target
    const addCamFollowBtn = body.querySelector('#add-camfollow-behavior');
    if (addCamFollowBtn) {
      addCamFollowBtn.addEventListener('click', () => {
        if (this.editor.behaviors) {
          this.editor.behaviors.attachBehavior(ent, 'camera_follow', { offset: [0, 4, 8] });
          showToast(`🎥 Set ${ent.name} as Camera Follow Target!`, 'success');
          this.updateView();
        }
      });
    }
    const remCamFollowBtn = body.querySelector('#remove-camfollow-behavior');
    if (remCamFollowBtn) {
      remCamFollowBtn.addEventListener('click', () => {
        if (this.editor.behaviors) {
          this.editor.behaviors.removeBehavior(ent, 'camera_follow');
          showToast(`Removed Camera Follow from ${ent.name}.`, 'info');
          this.updateView();
        }
      });
    }

    // Billboard Camera Facing
    const addBillboardBtn = body.querySelector('#add-billboard-behavior');
    if (addBillboardBtn) {
      addBillboardBtn.addEventListener('click', () => {
        if (this.editor.behaviors) {
          this.editor.behaviors.attachBehavior(ent, 'billboard', {});
          showToast(`🎯 Attached Billboard facing to ${ent.name}!`, 'success');
          this.updateView();
        }
      });
    }
    const remBillboardBtn = body.querySelector('#remove-billboard-behavior');
    if (remBillboardBtn) {
      remBillboardBtn.addEventListener('click', () => {
        if (this.editor.behaviors) {
          this.editor.behaviors.removeBehavior(ent, 'billboard');
          showToast(`Removed Billboard from ${ent.name}.`, 'info');
          this.updateView();
        }
      });
    }

    // Collectible Item Pickup
    const addCollectibleBtn = body.querySelector('#add-collectible-behavior');
    if (addCollectibleBtn) {
      addCollectibleBtn.addEventListener('click', () => {
        if (this.editor.behaviors) {
          this.editor.behaviors.attachBehavior(ent, 'collectible', { radius: 1.5 });
          showToast(`💎 Set ${ent.name} as Collectible Item Pickup!`, 'success');
          this.updateView();
        }
      });
    }
    const remCollectibleBtn = body.querySelector('#remove-collectible-behavior');
    if (remCollectibleBtn) {
      remCollectibleBtn.addEventListener('click', () => {
        if (this.editor.behaviors) {
          this.editor.behaviors.removeBehavior(ent, 'collectible');
          showToast(`Removed Collectible Pickup from ${ent.name}.`, 'info');
          this.updateView();
        }
      });
    }

    const addTrigBtn = body.querySelector('#add-trigger-behavior');
    if (addTrigBtn) {
      addTrigBtn.addEventListener('click', () => {
        if (this.editor.triggers) {
          if (!ent.collision) this.editor.addComponent(ent, 'collision', { type: 'box' });
          this.editor.triggers.registerTrigger(ent.name, {
            eventType: 'on_enter',
            action: 'teleport',
            targetPosition: [0, 2, 0]
          });
          showToast(`⚡ Teleport Trigger registered on ${ent.name}!`, 'success');
          this.updateView();
        }
      });
    }
  }

  /* ========================================================================= */
  /* ⚡ PRO / ADVANCED MODE VIEW                                               */
  /* ========================================================================= */
  renderProModeView(body, ent) {
    body.innerHTML = `
      <!-- Mode Banner -->
      <div style="background: rgba(255, 102, 0, 0.12); border: 1px solid rgba(255, 102, 0, 0.3); border-radius: var(--radius-md); padding: 8px 10px; display: flex; align-items: center; justify-content: space-between;">
        <span style="color: var(--accent-orange); font-weight: 700; font-size: 11px;">⚡ PRO ECS MODE ACTIVE</span>
        <label class="toggle-switch">
          <input type="checkbox" id="entity-enabled" ${ent.enabled ? 'checked' : ''}>
          <span class="toggle-slider"></span>
        </label>
      </div>

      <!-- Entity General -->
      <div class="inspector-section">
        <div class="inspector-section-header">
          <span>Entity Info</span>
          <button id="btn-save-as-prefab" class="btn" style="padding: 1px 8px; font-size: 10px; color: var(--accent-orange); border-color: var(--accent-orange);" title="Save entity hierarchy as a reusable Prefab asset">📦 Save Prefab</button>
        </div>
        <div class="inspector-section-content">
          <div class="prop-row">
            <span class="prop-label">Name</span>
            <div class="prop-control">
              <input type="text" id="entity-name-input" class="text-input" value="${ent.name}">
            </div>
          </div>
        </div>
      </div>

      <!-- Transform -->
      <div class="inspector-section">
        <div class="inspector-section-header">
          <span>Transform</span>
          <button id="btn-reset-transform" class="btn" style="padding: 1px 6px; font-size: 10px;">Reset</button>
        </div>
        <div class="inspector-section-content">
          <!-- Position -->
          <div class="prop-row">
            <span class="prop-label">Position</span>
            <div class="vec3-group">
              <div class="vec3-item x"><span class="vec3-prefix">X</span><input type="number" step="0.1" id="pos-x" class="vec3-input"></div>
              <div class="vec3-item y"><span class="vec3-prefix">Y</span><input type="number" step="0.1" id="pos-y" class="vec3-input"></div>
              <div class="vec3-item z"><span class="vec3-prefix">Z</span><input type="number" step="0.1" id="pos-z" class="vec3-input"></div>
            </div>
          </div>

          <!-- Rotation -->
          <div class="prop-row">
            <span class="prop-label">Rotation</span>
            <div class="vec3-group">
              <div class="vec3-item x"><span class="vec3-prefix">X</span><input type="number" step="1" id="rot-x" class="vec3-input"></div>
              <div class="vec3-item y"><span class="vec3-prefix">Y</span><input type="number" step="1" id="rot-y" class="vec3-input"></div>
              <div class="vec3-item z"><span class="vec3-prefix">Z</span><input type="number" step="1" id="rot-z" class="vec3-input"></div>
            </div>
          </div>

          <!-- Scale -->
          <div class="prop-row">
            <span class="prop-label">Scale</span>
            <div class="vec3-group">
              <div class="vec3-item x"><span class="vec3-prefix">X</span><input type="number" step="0.1" id="scale-x" class="vec3-input"></div>
              <div class="vec3-item y"><span class="vec3-prefix">Y</span><input type="number" step="0.1" id="scale-y" class="vec3-input"></div>
              <div class="vec3-item z"><span class="vec3-prefix">Z</span><input type="number" step="0.1" id="scale-z" class="vec3-input"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Components Container -->
      <div id="components-stack" style="display: flex; flex-direction: column; gap: 8px;"></div>

      <!-- Add Component Dropdown -->
      <div style="margin-top: 8px;">
        <select id="add-component-select" class="select-input" style="padding: 6px; font-weight: 600; text-align: center; border-color: var(--accent-orange); color: var(--accent-orange);">
          <option value="">+ Add Component</option>
          <option value="render">Render / Mesh</option>
          <option value="light">Light Source</option>
          <option value="camera">Camera</option>
          <option value="collision">Collision Shape</option>
          <option value="rigidbody">Rigidbody Physics</option>
          <option value="particlesystem">Particle Emitter</option>
          <option value="sound">3D Audio / Sound</option>
          <option value="anim">Animation Player</option>
          <option value="script">Script Behavior</option>
          <option value="trigger">Trigger Volume</option>
        </select>
      </div>
    `;

    this.bindEntityInputs();
    this.renderComponents();
    this.syncTransformInputs();
  }

  bindEntityInputs() {
    const ent = this.currentEntity;
    if (!ent) return;

    // Enabled toggle
    const enabledInput = this.container.querySelector('#entity-enabled');
    if (enabledInput) {
      enabledInput.addEventListener('change', () => {
        ent.enabled = enabledInput.checked;
      });
    }

    // Name input
    const nameInput = this.container.querySelector('#entity-name-input');
    if (nameInput) {
      nameInput.addEventListener('change', () => {
        ent.name = nameInput.value;
        this.editor.events.emit('scene:changed');
      });
    }

    // Save as Prefab
    const savePrefabBtn = this.container.querySelector('#btn-save-as-prefab');
    if (savePrefabBtn) {
      savePrefabBtn.addEventListener('click', () => {
        if (this.editor.prefabs) {
          this.editor.prefabs.createPrefabFromEntity(ent);
        }
      });
    }

    // Reset transform
    const btnReset = this.container.querySelector('#btn-reset-transform');
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        ent.setPosition(0, 0, 0);
        ent.setEulerAngles(0, 0, 0);
        ent.setLocalScale(1, 1, 1);
        this.syncTransformInputs();
        this.editor.events.emit('entity:transformed', ent);
      });
    }

    // Transform inputs
    const posInputs = ['pos-x', 'pos-y', 'pos-z'].map(id => this.container.querySelector(`#${id}`)).filter(Boolean);
    const rotInputs = ['rot-x', 'rot-y', 'rot-z'].map(id => this.container.querySelector(`#${id}`)).filter(Boolean);
    const scaleInputs = ['scale-x', 'scale-y', 'scale-z'].map(id => this.container.querySelector(`#${id}`)).filter(Boolean);

    const updatePos = () => {
      ent.setPosition(parseFloat(posInputs[0].value) || 0, parseFloat(posInputs[1].value) || 0, parseFloat(posInputs[2].value) || 0);
      this.editor.events.emit('entity:transformed', ent);
    };
    const updateRot = () => {
      ent.setEulerAngles(parseFloat(rotInputs[0].value) || 0, parseFloat(rotInputs[1].value) || 0, parseFloat(rotInputs[2].value) || 0);
      this.editor.events.emit('entity:transformed', ent);
    };
    const updateScale = () => {
      ent.setLocalScale(parseFloat(scaleInputs[0].value) || 1, parseFloat(scaleInputs[1].value) || 1, parseFloat(scaleInputs[2].value) || 1);
      this.editor.events.emit('entity:transformed', ent);
    };

    posInputs.forEach(inp => inp.addEventListener('input', updatePos));
    rotInputs.forEach(inp => inp.addEventListener('input', updateRot));
    scaleInputs.forEach(inp => inp.addEventListener('input', updateScale));

    // Add Component Select
    const compSelect = this.container.querySelector('#add-component-select');
    if (compSelect) {
      compSelect.addEventListener('change', () => {
        const type = compSelect.value;
        if (type === 'trigger') {
          if (this.editor.triggers) {
            if (!ent.collision) this.editor.addComponent(ent, 'collision', { type: 'box' });
            this.editor.triggers.registerTrigger(ent.name, {
              eventType: 'on_enter',
              action: 'teleport',
              radius: 2.0,
              targetPosition: [0, 2, 0]
            });
            showToast(`⚡ Trigger Volume added to ${ent.name}!`, 'success');
            this.updateView();
          }
          compSelect.value = '';
          return;
        }
        if (type) {
          this.editor.addComponent(ent, type);
          compSelect.value = '';
        }
      });
    }
  }

  syncTransformInputs() {
    const ent = this.currentEntity;
    if (!ent) return;

    const pos = ent.getPosition();
    const rot = ent.getEulerAngles();
    const scale = ent.getLocalScale();

    const setVal = (id, val) => {
      const el = this.container.querySelector(`#${id}`);
      if (el && document.activeElement !== el) {
        el.value = (Math.round(val * 100) / 100).toFixed(2);
      }
    };

    setVal('pos-x', pos.x); setVal('pos-y', pos.y); setVal('pos-z', pos.z);
    setVal('rot-x', rot.x); setVal('rot-y', rot.y); setVal('rot-z', rot.z);
    setVal('scale-x', scale.x); setVal('scale-y', scale.y); setVal('scale-z', scale.z);
  }

  renderComponents() {
    const ent = this.currentEntity;
    const stack = this.container.querySelector('#components-stack');
    if (!ent || !stack) return;

    stack.innerHTML = '';

    // Render Component Card & Material Preview
    if (ent.render) {
      const card = document.createElement('div');
      card.className = 'inspector-section';
      card.innerHTML = `
        <div class="inspector-section-header">
          <span>📦 Render (Mesh)</span>
          <button class="btn btn-remove-comp" data-comp="render" style="padding: 1px 6px; font-size: 10px; color: #ef4444;">✕</button>
        </div>
        <div class="inspector-section-content">
          <div class="prop-row">
            <span class="prop-label">Type</span>
            <select class="select-input" id="render-type-select">
              ${['box', 'sphere', 'capsule', 'cylinder', 'cone', 'plane'].map(t => `<option value="${t}" ${ent.render.type === t ? 'selected' : ''}>${t}</option>`).join('')}
            </select>
          </div>
          <div class="prop-row">
            <span class="prop-label">Cast Shadows</span>
            <input type="checkbox" id="render-cast-shadows" ${ent.render.castShadows ? 'checked' : ''}>
          </div>

          <!-- PBR Material Preview -->
          <div style="margin-top: 8px; border-top: 1px solid var(--border-subtle); padding-top: 8px;">
            <div style="display: flex; gap: 10px; align-items: center; margin-bottom: 8px;">
              <canvas id="mat-preview-canvas" width="64" height="64" style="width: 64px; height: 64px; border-radius: 8px; border: 1px solid var(--border-highlight); background: #000; flex-shrink: 0;"></canvas>
              <div>
                <div style="font-weight: 600; font-size: 11px; color: var(--text-primary);">PBR Material</div>
                <div style="font-size: 10px; color: var(--text-muted);">Physical Shading</div>
              </div>
            </div>

            <div class="prop-row">
              <span class="prop-label">Diffuse Color</span>
              <input type="color" id="mat-diffuse-color" value="#ff9900" style="background: none; border: none; width: 40px; height: 24px; cursor: pointer;">
            </div>

            <div class="prop-row">
              <span class="prop-label">Metalness</span>
              <input type="range" min="0" max="1" step="0.05" id="mat-metalness" value="0.5" class="text-input">
            </div>

            <div class="prop-row">
              <span class="prop-label">Roughness</span>
              <input type="range" min="0" max="1" step="0.05" id="mat-roughness" value="0.3" class="text-input">
            </div>
          </div>
        </div>
      `;

      card.querySelector('#render-type-select').addEventListener('change', (e) => {
        ent.render.type = e.target.value;
      });
      card.querySelector('#render-cast-shadows').addEventListener('change', (e) => {
        ent.render.castShadows = e.target.checked;
      });
      card.querySelector('.btn-remove-comp').addEventListener('click', () => {
        this.editor.removeComponent(ent, 'render');
      });

      stack.appendChild(card);

      setTimeout(() => {
        const previewCanvas = card.querySelector('#mat-preview-canvas');
        if (previewCanvas) {
          this.matPreview = new MaterialPreviewRenderer(previewCanvas);
          const diffuseInp = card.querySelector('#mat-diffuse-color');
          const metalInp = card.querySelector('#mat-metalness');
          const roughInp = card.querySelector('#mat-roughness');

          const updateMat = () => {
            const hex = diffuseInp.value;
            const r = parseInt(hex.slice(1, 3), 16) / 255;
            const g = parseInt(hex.slice(3, 5), 16) / 255;
            const b = parseInt(hex.slice(5, 7), 16) / 255;

            const metalness = parseFloat(metalInp.value);
            const roughness = parseFloat(roughInp.value);

            if (this.matPreview) {
              this.matPreview.updateMaterial({ diffuse: [r, g, b], metalness, roughness });
            }

            if (ent.render && ent.render.material) {
              ent.render.material.diffuse = new pc.Color(r, g, b);
              ent.render.material.metalness = metalness;
              ent.render.material.roughness = roughness;
              ent.render.material.update();
            }
          };

          diffuseInp.addEventListener('input', updateMat);
          metalInp.addEventListener('input', updateMat);
          roughInp.addEventListener('input', updateMat);
        }
      }, 50);
    }

    // Light Component Card
    if (ent.light) {
      const curColorHex = ent.light.color ? `#${Math.round(ent.light.color.r * 255).toString(16).padStart(2, '0')}${Math.round(ent.light.color.g * 255).toString(16).padStart(2, '0')}${Math.round(ent.light.color.b * 255).toString(16).padStart(2, '0')}` : '#ffffff';

      const card = document.createElement('div');
      card.className = 'inspector-section';
      card.innerHTML = `
        <div class="inspector-section-header">
          <span>💡 Light</span>
          <button class="btn btn-remove-comp" data-comp="light" style="padding: 1px 6px; font-size: 10px; color: #ef4444;">✕</button>
        </div>
        <div class="inspector-section-content">
          <div class="prop-row">
            <span class="prop-label">Type</span>
            <select class="select-input" id="light-type-select">
              <option value="point" ${ent.light.type === 'point' ? 'selected' : ''}>Point</option>
              <option value="directional" ${ent.light.type === 'directional' ? 'selected' : ''}>Directional</option>
              <option value="spot" ${ent.light.type === 'spot' ? 'selected' : ''}>Spot</option>
            </select>
          </div>
          <div class="prop-row">
            <span class="prop-label">Color</span>
            <input type="color" id="light-color-picker" value="${curColorHex}" style="background: none; border: none; width: 40px; height: 24px; cursor: pointer;">
          </div>
          <div class="prop-row">
            <span class="prop-label">Intensity</span>
            <input type="range" min="0" max="10" step="0.1" class="text-input" id="light-intensity" value="${ent.light.intensity}">
          </div>
          <div class="prop-row">
            <span class="prop-label">Range</span>
            <input type="number" min="0.1" max="100" class="text-input" id="light-range" value="${ent.light.range}">
          </div>
        </div>
      `;
      card.querySelector('#light-type-select').addEventListener('change', (e) => {
        ent.light.type = e.target.value;
      });
      card.querySelector('#light-color-picker').addEventListener('input', (e) => {
        const hex = e.target.value;
        const r = parseInt(hex.slice(1, 3), 16) / 255;
        const g = parseInt(hex.slice(3, 5), 16) / 255;
        const b = parseInt(hex.slice(5, 7), 16) / 255;
        ent.light.color = new pc.Color(r, g, b);
      });
      card.querySelector('#light-intensity').addEventListener('input', (e) => {
        ent.light.intensity = parseFloat(e.target.value);
      });
      card.querySelector('#light-range').addEventListener('input', (e) => {
        ent.light.range = parseFloat(e.target.value);
      });
      card.querySelector('.btn-remove-comp').addEventListener('click', () => {
        this.editor.removeComponent(ent, 'light');
      });
      stack.appendChild(card);
    }

    // Camera Component Card
    if (ent.camera) {
      const card = document.createElement('div');
      card.className = 'inspector-section';
      card.innerHTML = `
        <div class="inspector-section-header">
          <span>🎥 Camera</span>
          <button class="btn btn-remove-comp" data-comp="camera" style="padding: 1px 6px; font-size: 10px; color: #ef4444;">✕</button>
        </div>
        <div class="inspector-section-content">
          <div class="prop-row">
            <span class="prop-label">FOV</span>
            <input type="range" min="30" max="120" step="1" class="text-input" id="cam-fov" value="${ent.camera.fov || 60}">
          </div>
          <div class="prop-row">
            <span class="prop-label">Near Clip</span>
            <input type="number" step="0.01" min="0.01" class="text-input" id="cam-near" value="${ent.camera.nearClip || 0.1}">
          </div>
          <div class="prop-row">
            <span class="prop-label">Far Clip</span>
            <input type="number" step="10" min="10" class="text-input" id="cam-far" value="${ent.camera.farClip || 1000}">
          </div>
        </div>
      `;
      card.querySelector('#cam-fov').addEventListener('input', (e) => {
        ent.camera.fov = parseFloat(e.target.value);
      });
      card.querySelector('#cam-near').addEventListener('change', (e) => {
        ent.camera.nearClip = parseFloat(e.target.value);
      });
      card.querySelector('#cam-far').addEventListener('change', (e) => {
        ent.camera.farClip = parseFloat(e.target.value);
      });
      card.querySelector('.btn-remove-comp').addEventListener('click', () => {
        this.editor.removeComponent(ent, 'camera');
      });
      stack.appendChild(card);
    }

    // Collision Component Card
    if (ent.collision) {
      const card = document.createElement('div');
      card.className = 'inspector-section';
      card.innerHTML = `
        <div class="inspector-section-header">
          <span>🎯 Collision</span>
          <button class="btn btn-remove-comp" data-comp="collision" style="padding: 1px 6px; font-size: 10px; color: #ef4444;">✕</button>
        </div>
        <div class="inspector-section-content">
          <div class="prop-row">
            <span class="prop-label">Shape</span>
            <select class="select-input" id="collision-type-select">
              <option value="box" ${ent.collision.type === 'box' ? 'selected' : ''}>Box</option>
              <option value="sphere" ${ent.collision.type === 'sphere' ? 'selected' : ''}>Sphere</option>
              <option value="capsule" ${ent.collision.type === 'capsule' ? 'selected' : ''}>Capsule</option>
              <option value="cylinder" ${ent.collision.type === 'cylinder' ? 'selected' : ''}>Cylinder</option>
              <option value="mesh" ${ent.collision.type === 'mesh' ? 'selected' : ''}>Mesh</option>
            </select>
          </div>
        </div>
      `;
      card.querySelector('#collision-type-select').addEventListener('change', (e) => {
        ent.collision.type = e.target.value;
      });
      card.querySelector('.btn-remove-comp').addEventListener('click', () => {
        this.editor.removeComponent(ent, 'collision');
      });
      stack.appendChild(card);
    }

    // Rigidbody Physics Card
    if (ent.rigidbody) {
      const card = document.createElement('div');
      card.className = 'inspector-section';
      card.innerHTML = `
        <div class="inspector-section-header">
          <span>⚙️ Rigidbody Physics</span>
          <button class="btn btn-remove-comp" data-comp="rigidbody" style="padding: 1px 6px; font-size: 10px; color: #ef4444;">✕</button>
        </div>
        <div class="inspector-section-content">
          <div class="prop-row">
            <span class="prop-label">Body Type</span>
            <select class="select-input" id="rigidbody-type-select">
              <option value="static" ${ent.rigidbody.type === 'static' ? 'selected' : ''}>Static</option>
              <option value="dynamic" ${ent.rigidbody.type === 'dynamic' ? 'selected' : ''}>Dynamic</option>
              <option value="kinematic" ${ent.rigidbody.type === 'kinematic' ? 'selected' : ''}>Kinematic</option>
            </select>
          </div>
          <div class="prop-row">
            <span class="prop-label">Mass (kg)</span>
            <input type="number" min="0.1" step="0.5" class="text-input" id="rigidbody-mass" value="${ent.rigidbody.mass || 1}">
          </div>
          <div class="prop-row">
            <span class="prop-label">Restitution (Bounciness)</span>
            <input type="range" min="0" max="1" step="0.05" class="text-input" id="rigidbody-restitution" value="${ent.rigidbody.restitution !== undefined ? ent.rigidbody.restitution : 0.5}">
          </div>
          <div class="prop-row">
            <span class="prop-label">Friction</span>
            <input type="range" min="0" max="1" step="0.05" class="text-input" id="rigidbody-friction" value="${ent.rigidbody.friction !== undefined ? ent.rigidbody.friction : 0.5}">
          </div>
        </div>
      `;
      card.querySelector('#rigidbody-type-select').addEventListener('change', (e) => {
        ent.rigidbody.type = e.target.value;
      });
      card.querySelector('#rigidbody-mass').addEventListener('change', (e) => {
        ent.rigidbody.mass = parseFloat(e.target.value);
      });
      card.querySelector('#rigidbody-restitution').addEventListener('input', (e) => {
        ent.rigidbody.restitution = parseFloat(e.target.value);
      });
      card.querySelector('#rigidbody-friction').addEventListener('input', (e) => {
        ent.rigidbody.friction = parseFloat(e.target.value);
      });
      card.querySelector('.btn-remove-comp').addEventListener('click', () => {
        this.editor.removeComponent(ent, 'rigidbody');
      });
      stack.appendChild(card);
    }

    // Animation Player Component Card (checks root & child entities for anim/animation components)
    let animComp = ent.anim || ent.animation;
    let animTarget = ent;
    if (!animComp) {
      animTarget = ent.findComponent ? (ent.findComponent('anim') ? ent : ent.findOne(e => e.anim || e.animation)) : null;
      if (animTarget) animComp = animTarget.anim || animTarget.animation;
    }

    if (animComp) {
      const card = document.createElement('div');
      card.className = 'inspector-section';
      card.innerHTML = `
        <div class="inspector-section-header">
          <span>💃 Skeletal Animation Player</span>
          <button class="btn btn-remove-comp" data-comp="anim" style="padding: 1px 6px; font-size: 10px; color: #ef4444;">✕</button>
        </div>
        <div class="inspector-section-content" style="display: flex; flex-direction: column; gap: 8px;">
          <div style="display: flex; gap: 6px;">
            <button class="btn btn-primary" id="btn-anim-play" style="flex: 1; font-size: 11px;">▶ Play</button>
            <button class="btn" id="btn-anim-pause" style="flex: 1; font-size: 11px;">⏸ Pause</button>
          </div>
          <div class="prop-row">
            <span class="prop-label">Speed</span>
            <input type="range" min="0.1" max="2.0" step="0.1" class="text-input" id="anim-speed" value="${animComp.speed !== undefined ? animComp.speed : 1.0}">
          </div>
        </div>
      `;

      card.querySelector('#btn-anim-play').addEventListener('click', () => {
        if (animComp) {
          if (animComp.playing === false || !animComp.playing) {
            if (animComp.play) animComp.play();
            else if (animComp.playing !== undefined) animComp.playing = true;
          }
          showToast(`▶ Animation playing on ${animTarget.name}`, 'info');
        }
      });

      card.querySelector('#btn-anim-pause').addEventListener('click', () => {
        if (animComp) {
          if (animComp.pause) animComp.pause();
          else if (animComp.playing !== undefined) animComp.playing = false;
          showToast(`⏸ Animation paused on ${animTarget.name}`, 'info');
        }
      });

      card.querySelector('#anim-speed').addEventListener('input', (e) => {
        const speed = parseFloat(e.target.value);
        if (animComp) animComp.speed = speed;
      });

      card.querySelector('.btn-remove-comp').addEventListener('click', () => {
        this.editor.removeComponent(animTarget, 'anim');
      });

      stack.appendChild(card);
    }

    // Sound / Audio Component Card
    if (ent.sound) {
      const card = document.createElement('div');
      card.className = 'inspector-section';
      card.innerHTML = `
        <div class="inspector-section-header">
          <span>🔊 3D Positional Audio</span>
          <button class="btn btn-remove-comp" data-comp="sound" style="padding: 1px 6px; font-size: 10px; color: #ef4444;">✕</button>
        </div>
        <div class="inspector-section-content" style="display: flex; flex-direction: column; gap: 8px;">
          <div class="prop-row">
            <span class="prop-label">Audio File</span>
            <input type="text" class="text-input" id="sound-url-input" value="${ent.sound.assetUrl || './models/wind.wav'}" placeholder="./path/to/sound.wav">
          </div>
          <div class="prop-row">
            <span class="prop-label">Volume</span>
            <input type="range" min="0" max="1" step="0.05" class="text-input" id="sound-volume" value="${ent.sound.volume || 1}">
          </div>
          <div class="prop-row">
            <span class="prop-label">Pitch</span>
            <input type="range" min="0.5" max="2" step="0.1" class="text-input" id="sound-pitch" value="${ent.sound.pitch || 1}">
          </div>
          <div class="prop-row">
            <span class="prop-label">Loop</span>
            <input type="checkbox" id="sound-loop" ${ent.sound.loop !== false ? 'checked' : ''}>
          </div>
          <button class="btn btn-primary" id="btn-preview-audio" style="font-size: 11px; padding: 4px;">
            ▶ Test Audio Playback
          </button>
        </div>
      `;

      card.querySelector('#sound-url-input').addEventListener('change', (e) => {
        ent.sound.assetUrl = e.target.value;
      });

      card.querySelector('#sound-volume').addEventListener('input', (e) => {
        ent.sound.volume = parseFloat(e.target.value);
      });

      card.querySelector('#sound-pitch').addEventListener('input', (e) => {
        ent.sound.pitch = parseFloat(e.target.value);
      });

      card.querySelector('#sound-loop').addEventListener('change', (e) => {
        ent.sound.loop = e.target.checked;
      });

      card.querySelector('#btn-preview-audio').addEventListener('click', () => {
        const url = card.querySelector('#sound-url-input').value.trim();
        if (url) {
          const audio = new Audio(url);
          audio.volume = ent.sound.volume || 1;
          audio.playbackRate = ent.sound.pitch || 1;
          audio.play().then(() => {
            showToast(`🔊 Playing preview for ${ent.name}!`, 'info');
          }).catch(err => {
            showToast(`Could not play audio file: ${err.message}`, 'warn');
          });
        }
      });

      card.querySelector('.btn-remove-comp').addEventListener('click', () => {
        this.editor.removeComponent(ent, 'sound');
      });

      stack.appendChild(card);
    }

    // Particle System Emitter Component Card
    if (ent.particlesystem) {
      const card = document.createElement('div');
      card.className = 'inspector-section';
      card.innerHTML = `
        <div class="inspector-section-header">
          <span>✨ Particle System</span>
          <button class="btn btn-remove-comp" data-comp="particlesystem" style="padding: 1px 6px; font-size: 10px; color: #ef4444;">✕</button>
        </div>
        <div class="inspector-section-content" style="display: flex; flex-direction: column; gap: 8px;">
          <div class="prop-row">
            <span class="prop-label">Preset</span>
            <select class="select-input" id="particle-preset-select">
              <option value="fire">🔥 Fire / Flame</option>
              <option value="smoke">💨 Smoke Puff</option>
              <option value="sparks">⚡ Electric Sparks</option>
              <option value="magic">✨ Magic Dust</option>
            </select>
          </div>
          <div class="prop-row">
            <span class="prop-label">Particle Count</span>
            <input type="range" min="10" max="200" step="5" class="text-input" id="particle-num" value="${ent.particlesystem.numParticles || 60}">
          </div>
          <div class="prop-row">
            <span class="prop-label">Lifetime (s)</span>
            <input type="range" min="0.2" max="5" step="0.1" class="text-input" id="particle-lifetime" value="${ent.particlesystem.lifetime || 1.5}">
          </div>
        </div>
      `;

      card.querySelector('#particle-preset-select').addEventListener('change', (e) => {
        const preset = e.target.value;
        if (ent.particlesystem) {
          if (preset === 'fire') {
            ent.particlesystem.numParticles = 80;
            ent.particlesystem.lifetime = 1.2;
          } else if (preset === 'smoke') {
            ent.particlesystem.numParticles = 40;
            ent.particlesystem.lifetime = 2.5;
          } else if (preset === 'sparks') {
            ent.particlesystem.numParticles = 120;
            ent.particlesystem.lifetime = 0.6;
          } else if (preset === 'magic') {
            ent.particlesystem.numParticles = 100;
            ent.particlesystem.lifetime = 1.8;
          }
          const numInput = card.querySelector('#particle-num');
          const lifeInput = card.querySelector('#particle-lifetime');
          if (numInput) numInput.value = ent.particlesystem.numParticles;
          if (lifeInput) lifeInput.value = ent.particlesystem.lifetime;
          if (ent.particlesystem.rebuild) ent.particlesystem.rebuild();
          showToast(`✨ Applied particle preset: ${preset}`, 'info');
        }
      });

      card.querySelector('#particle-num').addEventListener('input', (e) => {
        ent.particlesystem.numParticles = parseInt(e.target.value, 10);
        if (ent.particlesystem.rebuild) ent.particlesystem.rebuild();
      });

      card.querySelector('#particle-lifetime').addEventListener('input', (e) => {
        ent.particlesystem.lifetime = parseFloat(e.target.value);
        if (ent.particlesystem.rebuild) ent.particlesystem.rebuild();
      });

      card.querySelector('.btn-remove-comp').addEventListener('click', () => {
        this.editor.removeComponent(ent, 'particlesystem');
      });

      stack.appendChild(card);
    }

    // Script Behavior Component Card
    if (ent.script) {
      const card = document.createElement('div');
      card.className = 'inspector-section';
      card.innerHTML = `
        <div class="inspector-section-header">
          <span>📜 Script Behavior</span>
          <button class="btn btn-remove-comp" data-comp="script" style="padding: 1px 6px; font-size: 10px; color: #ef4444;">✕</button>
        </div>
        <div class="inspector-section-content" style="display: flex; flex-direction: column; gap: 6px;">
          <button class="btn btn-primary" id="btn-open-code-script" style="font-size: 11px; padding: 4px;">
            📝 Edit Attached Script
          </button>
        </div>
      `;
      card.querySelector('#btn-open-code-script').addEventListener('click', () => {
        if (this.codeEditor) {
          this.codeEditor.open('customScript.js');
        }
      });
      card.querySelector('.btn-remove-comp').addEventListener('click', () => {
        this.editor.removeComponent(ent, 'script');
      });
      stack.appendChild(card);
    }

    // Trigger Volume Logic Card
    if (this.editor.triggers && this.editor.triggers.hasTrigger(ent.name)) {
      const trigConfig = this.editor.triggers.getTrigger(ent.name);
      const card = document.createElement('div');
      card.className = 'inspector-section';
      card.style.borderColor = 'var(--accent-cyan)';
      card.innerHTML = `
        <div class="inspector-section-header" style="background: rgba(0, 229, 255, 0.15); color: #00e5ff;">
          <span>⚡ Interactive Trigger Volume</span>
          <button class="btn btn-remove-trig" style="padding: 1px 6px; font-size: 10px; color: #ef4444;">✕</button>
        </div>
        <div class="inspector-section-content" style="display: flex; flex-direction: column; gap: 8px;">
          <div class="prop-row">
            <span class="prop-label">Event Type</span>
            <select class="select-input" id="trig-event-select">
              <option value="on_enter" ${trigConfig.eventType === 'on_enter' ? 'selected' : ''}>On Player Enter</option>
              <option value="on_exit" ${trigConfig.eventType === 'on_exit' ? 'selected' : ''}>On Player Exit</option>
            </select>
          </div>

          <div class="prop-row">
            <span class="prop-label">Action</span>
            <select class="select-input" id="trig-action-select">
              <option value="teleport" ${trigConfig.action === 'teleport' ? 'selected' : ''}>🌀 Teleport Player</option>
              <option value="toggle_visibility" ${trigConfig.action === 'toggle_visibility' ? 'selected' : ''}>💡 Toggle Visibility</option>
              <option value="destroy" ${trigConfig.action === 'destroy' ? 'selected' : ''}>💥 Destroy Target Entity</option>
              <option value="play_sound" ${trigConfig.action === 'play_sound' ? 'selected' : ''}>🔊 Play Sound</option>
            </select>
          </div>

          <div class="prop-row">
            <span class="prop-label">Trigger Radius (m)</span>
            <input type="range" min="0.5" max="10" step="0.5" class="text-input" id="trig-radius-slider" value="${trigConfig.radius || 2.0}">
          </div>

          <div class="prop-row" id="trig-target-entity-row" style="display: ${['toggle_visibility', 'destroy'].includes(trigConfig.action) ? 'flex' : 'none'};">
            <span class="prop-label">Target Entity</span>
            <input type="text" class="text-input" id="trig-target-entity-input" value="${trigConfig.targetEntity || ''}" placeholder="Entity Name">
          </div>

          <div class="prop-row" id="trig-target-pos-row" style="display: ${trigConfig.action === 'teleport' ? 'flex' : 'none'};">
            <span class="prop-label">Teleport Pos</span>
            <div class="vec3-group">
              <div class="vec3-item x"><span class="vec3-prefix">X</span><input type="number" step="0.5" id="trig-pos-x" class="vec3-input" value="${trigConfig.targetPosition ? trigConfig.targetPosition[0] : 0}"></div>
              <div class="vec3-item y"><span class="vec3-prefix">Y</span><input type="number" step="0.5" id="trig-pos-y" class="vec3-input" value="${trigConfig.targetPosition ? trigConfig.targetPosition[1] : 2}"></div>
              <div class="vec3-item z"><span class="vec3-prefix">Z</span><input type="number" step="0.5" id="trig-pos-z" class="vec3-input" value="${trigConfig.targetPosition ? trigConfig.targetPosition[2] : 0}"></div>
            </div>
          </div>
        </div>
      `;

      const actionSelect = card.querySelector('#trig-action-select');
      const targetEntityRow = card.querySelector('#trig-target-entity-row');
      const targetPosRow = card.querySelector('#trig-target-pos-row');

      actionSelect.addEventListener('change', (e) => {
        const act = e.target.value;
        trigConfig.action = act;
        targetEntityRow.style.display = ['toggle_visibility', 'destroy'].includes(act) ? 'flex' : 'none';
        targetPosRow.style.display = act === 'teleport' ? 'flex' : 'none';
      });

      card.querySelector('#trig-event-select').addEventListener('change', (e) => {
        trigConfig.eventType = e.target.value;
      });

      card.querySelector('#trig-radius-slider').addEventListener('input', (e) => {
        trigConfig.radius = parseFloat(e.target.value);
      });

      card.querySelector('#trig-target-entity-input').addEventListener('change', (e) => {
        trigConfig.targetEntity = e.target.value;
      });

      const updatePos = () => {
        const x = parseFloat(card.querySelector('#trig-pos-x').value) || 0;
        const y = parseFloat(card.querySelector('#trig-pos-y').value) || 2;
        const z = parseFloat(card.querySelector('#trig-pos-z').value) || 0;
        trigConfig.targetPosition = [x, y, z];
      };

      ['trig-pos-x', 'trig-pos-y', 'trig-pos-z'].forEach(id => {
        card.querySelector(`#${id}`).addEventListener('input', updatePos);
      });

      card.querySelector('.btn-remove-trig').addEventListener('click', () => {
        this.editor.triggers.removeTrigger(ent.name);
        this.updateView();
      });

      stack.appendChild(card);
    }
  }
}
