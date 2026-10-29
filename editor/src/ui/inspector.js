import * as pc from 'playcanvas';
import { MaterialPreviewRenderer } from './material-preview.js';
import { showToast } from './toast.js';
import { parseScriptAttributes } from '../core/script-attributes.js';

export const BEHAVIOR_CATALOG = [
  { type: 'wasd', icon: '🎮', name: 'WASD Character Controller', defaultParams: { speed: 8 } },
  { type: 'third_person_controller', icon: '🎥', name: 'Third-Person Action Controller', defaultParams: { speed: 8, rotSpeed: 90, cameraDistance: 6, cameraHeight: 2.5 } },
  { type: 'stamina_system', icon: '⚡', name: 'Sprint & Stamina Resource Bar', defaultParams: { maxStamina: 100, currentStamina: 100, drainRate: 25, rechargeRate: 15 } },
  { type: 'damage_flash', icon: '🔴', name: 'Damage Material Flash Feedback', defaultParams: { flashDuration: 0.2 } },
  { type: 'climbable_ladder', icon: '🪜', name: 'Proximity Climbable Ladder / Rope', defaultParams: { climbSpeed: 5, radius: 1.8 } },
  { type: 'slow_motion_zone', icon: '⏱️', name: 'Slow Motion Bullet-Time Zone', defaultParams: { timeScale: 0.3, radius: 6.0 } },
  { type: 'wall_run_controller', icon: '🧗', name: 'Parkour Wall-Running', defaultParams: { speed: 10, jumpForce: 12 } },
  { type: 'grappling_hook', icon: '🪝', name: 'Physics Grappling Hook (\'G\')', defaultParams: { range: 35, pullSpeed: 20 } },
  { type: 'grav_gun_physicshandler', icon: '🧲', name: 'Gravity Gun / Beam (\'E\' / \'F\')', defaultParams: { range: 12, launchForce: 30 } },
  { type: 'inventory_crafting', icon: '🎒', name: 'Item Inventory & Crafting System', defaultParams: { maxSlots: 10 } },
  { type: 'dialogue_system', icon: '💬', name: 'Interactive NPC Dialogue Tree', defaultParams: { npcName: 'Elder Wizard', text: 'Welcome Traveler! Beware of the dark dungeon monsters ahead.' } },
  { type: 'quest_tracker', icon: '📜', name: 'Live HUD Quest Objective Tracker', defaultParams: { questTitle: 'Defeat the Boss', requiredCount: 1 } },
  { type: 'minimap_radar', icon: '🗺️', name: '2D Screen HUD Minimap & Radar', defaultParams: { radarRange: 40 } },
  { type: 'cover_system', icon: '🛡️', name: 'Dynamic Tactical Cover Mechanics', defaultParams: { damageReduction: 0.75 } },
  { type: 'ragdoll_physics', icon: '🦴', name: 'Ragdoll Physics Collapse On Defeat', defaultParams: { jointType: 'ball_and_socket' } },
  { type: 'day_night_weather_cycle', icon: '🌦️', name: 'Dynamic Day-Night Weather Cycle', defaultParams: { cycleSpeed: 0.05, weather: 'snow' } },
  { type: 'spin', icon: '🔄', name: 'Continuous Spin Animation', defaultParams: { speed: 90, axis: 'y' } },
  { type: 'turret_ai', icon: '🎯', name: 'Auto Turret Tracking AI', defaultParams: { range: 20, fireRate: 1.5, damage: 15 } },
  { type: 'pressure_plate', icon: '🔘', name: 'Interactive Pressure Plate', defaultParams: { radius: 1.5 } },
  { type: 'teleport_gateway', icon: '🌀', name: 'Linked Teleport Gateway', defaultParams: { cooldown: 2.0, radius: 1.8 } },
  { type: 'water_volume', icon: '🌊', name: 'Water Buoyancy Volume', defaultParams: { buoyancyForce: 15, extents: [5, 3, 5] } },
  { type: 'flashlight', icon: '🔦', name: 'Toggleable Flashlight (\'L\')', defaultParams: {} },
  { type: 'overhead_healthbar', icon: '🏥', name: 'Overhead 3D Billboard HUD', defaultParams: {} },
  { type: 'ambient_audio', icon: '🎵', name: 'Ambient Background Music', defaultParams: { volume: 0.3 } },
  { type: 'dash_boost', icon: '💨', name: 'Dash Boost Thruster', defaultParams: { force: 25, cooldown: 1.2 } },
  { type: 'health_regen', icon: '💚', name: 'Periodic Health Regeneration', defaultParams: { amount: 5, interval: 2.0 } },
  { type: 'day_night_cycle', icon: '☀️', name: 'Day & Night Sun Rotation', defaultParams: { speed: 0.1 } },
  { type: 'spotlight_flicker', icon: '🔦', name: 'Torch / Spotlight Cone Flicker', defaultParams: { baseOuterAngle: 45, variance: 8 } },
  { type: 'target_lock_on', icon: '🎯', name: 'Target Camera / Entity Lock-On', defaultParams: { targetEntity: 'Enemy' } },
  { type: 'first_person_controller', icon: '👀', name: 'First-Person Controller', defaultParams: { speed: 10, rotSpeed: 90 } },
  { type: 'target_health', icon: '🎯', name: 'Target / Enemy Health & Defeat', defaultParams: { maxHp: 100, currentHp: 100, scoreValue: 100 } },
  { type: 'key_pickup', icon: '🔑', name: 'Key Item Pickup', defaultParams: { keyName: 'Gold Key', radius: 1.8 } },
  { type: 'locked_door', icon: '🔒', name: 'Locked Key Door', defaultParams: { requiredKey: 'Gold Key', radius: 3.5 } },
  { type: 'jetpack', icon: '🚀', name: 'Jetpack & Double Jump', defaultParams: { fuel: 100, maxFuel: 100, thrust: 12 } },
  { type: 'level_portal', icon: '🌀', name: 'Level Transition Portal', defaultParams: { targetScene: 'Level_2', radius: 2.0 } },
  { type: 'enemy_ai', icon: '🤖', name: 'Hostile Enemy Chase AI', defaultParams: { speed: 3.5, detectRadius: 15, damage: 15 } },
  { type: 'projectile_shooter', icon: '🔫', name: 'Projectile Weapon Shooter', defaultParams: { speed: 30, damage: 35, cooldown: 0.3 } },
  { type: 'mouse_look', icon: '👀', name: 'Mouse Look / Rotation Controls', defaultParams: { speed: 90 } },
  { type: 'patrol', icon: '🚶', name: 'Patrol Movement', defaultParams: { speed: 3, distance: 6 } },
  { type: 'moving_platform', icon: '🛗', name: 'Moving Platform / Elevator', defaultParams: { speed: 2.5, distance: 8, axis: 'y' } },
  { type: 'interactive_door', icon: '🚪', name: 'Interactive Proximity Door', defaultParams: { radius: 3.0 } },
  { type: 'enemy_spawner', icon: '👾', name: 'Monster Spawner Portal', defaultParams: { interval: 6.0 } },
  { type: 'weapon_inventory', icon: '🎒', name: 'Weapon Inventory & Ammo HUD', defaultParams: { weaponName: 'Plasma Gun', ammo: 30 } },
  { type: 'health', icon: '❤️', name: 'Health Component (Player HP)', defaultParams: { maxHp: 100, currentHp: 100 } },
  { type: 'lava_hazard', icon: '🔥', name: 'Lava / Acid Hazard Zone', defaultParams: { radius: 2.5, damage: 100 } },
  { type: 'coin_bounce', icon: '🪙', name: 'Coin Spin & Floating Bounce', defaultParams: { speed: 90, amplitude: 0.3 } },
  { type: 'light_color_cycle', icon: '🌈', name: 'RGB Neon Light Cycle', defaultParams: { speed: 1.0 } },
  { type: 'waypoint_patrol', icon: '🗺️', name: 'Multi-Waypoint Path Patrol', defaultParams: { speed: 4.0 } },
  { type: 'audio_trigger', icon: '🔊', name: 'Audio Zone Trigger', defaultParams: { radius: 3.0, sfxType: 'coin' } },
  { type: 'postfx_trigger', icon: '✨', name: 'PostFX Atmosphere Trigger', defaultParams: { radius: 4.0, atmosphere: 'cyberpunk' } },
  { type: 'light_flicker', icon: '💡', name: 'Torch / Flame Light Flicker', defaultParams: { minIntensity: 0.5, maxIntensity: 2.0, speed: 10 } },
  { type: 'physics_impulse', icon: '💥', name: 'Spacebar Physics Jump', defaultParams: { force: 8 } },
  { type: 'sine_float', icon: '🌊', name: 'Sine Wave Floating', defaultParams: { speed: 2, amplitude: 0.5 } },
  { type: 'orbit', icon: '💫', name: 'Orbit Movement', defaultParams: { speed: 45, radius: 4 } },
  { type: 'camera_follow', icon: '🎥', name: 'Camera Follow Target', defaultParams: { offset: [0, 5, 8], speed: 4 } },
  { type: 'billboard', icon: '🎯', name: 'Billboard Facing (Face Camera)', defaultParams: {} },
  { type: 'collectible', icon: '💎', name: 'Collectible Item Pickup', defaultParams: { radius: 1.5, score: 10 } },
  { type: 'damage_dealer', icon: '⚔️', name: 'Damage Dealer Hazard', defaultParams: { radius: 2.0, damage: 20 } },
  { type: 'health_pickup', icon: '💚', name: 'Health Potion Pickup', defaultParams: { radius: 1.5, healAmount: 25 } },
  { type: 'boss_ai', icon: '🐉', name: 'Multi-Phase Boss AI', defaultParams: { maxHp: 500, attackRate: 2.0, damage: 30, enrageThreshold: 0.5 } },
  { type: 'stealth_ai', icon: '🥷', name: 'Guard Stealth Vision Cone AI', defaultParams: { visionRadius: 12, visionAngle: 60, speed: 2.5 } },
  { type: 'vehicle_controller', icon: '🏎️', name: 'Driveable Vehicle / Hovercraft', defaultParams: { topSpeed: 25, accel: 15, steerSpeed: 60 } },
  { type: 'destruction_mesh', icon: '💥', name: 'Breakable Destructible Object', defaultParams: { health: 50, debrisCount: 8 } },
  { type: 'cinematic_cutscene_trigger', icon: '🎬', name: 'Widescreen Cutscene Trigger', defaultParams: { duration: 4.0, radius: 2.5, caption: 'A dark shadow falls upon the realm...' } },
  { type: 'combo_score_counter', icon: '🎯', name: 'Multi-Kill Combo Multiplier', defaultParams: { multiplier: 2, windowTime: 3.0 } },
  { type: 'checkpoint_system', icon: '🚩', name: 'Respawn Checkpoint Pad', defaultParams: { radius: 2.0 } },
  { type: 'weather_emitter', icon: '❄️', name: 'Weather Particle Emitter', defaultParams: { type: 'snow', density: 100 } },
  { type: 'shield_generator', icon: '🛡️', name: 'Energy Shield Component', defaultParams: { maxShield: 50, rechargeRate: 10, rechargeDelay: 3.0 } },
  { type: 'sway_foliage', icon: '🌿', name: 'Procedural Wind Foliage Sway', defaultParams: { speed: 2.5, amplitude: 5.0 } },
  { type: 'spline_follower', icon: '🛤️', name: 'Waypointed Path Spline Motion', defaultParams: { speed: 3.0, loop: true } },
  { type: 'screen_shake_zone', icon: '📳', name: 'Earthquake Hazard Screen Shake Zone', defaultParams: { radius: 5.0, intensity: 0.6 } },
  { type: 'exploding_barrel', icon: '💥', name: 'Exploding Red Barrel Hazard', defaultParams: { blastRadius: 6.0, blastDamage: 80 } },
  { type: 'audio_reverb_zone', icon: '🔊', name: 'Acoustic Spatial Audio Zone', defaultParams: { radius: 8.0, echoFactor: 0.5 } },
  { type: 'gravity_well_attractor', icon: '🌌', name: 'Gravity Well Attractor / Repulser', defaultParams: { radius: 10.0, force: 15.0, mode: 'attract' } },
  { type: 'flashlight_battery', icon: '🔋', name: 'Flashlight Battery & Refill Pickups', defaultParams: { maxBattery: 100, drainRate: 5.0 } },
  { type: 'waypoint_flight_path', icon: '✈️', name: '3D Bezier Flight Path with Banking', defaultParams: { speed: 8.0, bankAngle: 25 } },
  { type: 'weather_rain_snow_toggle', icon: '🌧️', name: 'Dynamic Weather & Surface Wetness', defaultParams: { weatherType: 'rain', intensity: 1.0 } },
  { type: 'destructible_wall_cluster', icon: '🧱', name: 'Destructible Brick Wall Cluster', defaultParams: { rows: 3, cols: 4, brickHealth: 20 } },
  { type: 'inventory_drop_spawner', icon: '🎁', name: 'Defeat Loot Drop Table Spawner', defaultParams: { dropItem: 'Health Potion', dropChance: 1.0 } },
  { type: 'audio_occlusion_zone', icon: '🔇', name: 'Acoustic Sound Occlusion & Muffling', defaultParams: { radius: 6.0, muffling: 0.8 } }
];

/**
 * Entity & Component Inspector Panel
 * Dynamically switches between Beginner-Friendly Simple Mode and Technical Pro Mode.
 */
export class InspectorPanel {
  constructor(container, editor, codeEditorModal = null, animBlendModal = null) {
    this.container = container;
    this.editor = editor;
    this.codeEditor = codeEditorModal;
    this.animBlendModal = animBlendModal;
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
    const hasEnemyAI = this.editor.behaviors ? this.editor.behaviors.hasBehavior(ent, 'enemy_ai') : false;
    const hasShooter = this.editor.behaviors ? this.editor.behaviors.hasBehavior(ent, 'projectile_shooter') : false;
    const hasMouseLook = this.editor.behaviors ? this.editor.behaviors.hasBehavior(ent, 'mouse_look') : false;
    const hasMovingPlatform = this.editor.behaviors ? this.editor.behaviors.hasBehavior(ent, 'moving_platform') : false;
    const hasInteractiveDoor = this.editor.behaviors ? this.editor.behaviors.hasBehavior(ent, 'interactive_door') : false;
    const hasEnemySpawner = this.editor.behaviors ? this.editor.behaviors.hasBehavior(ent, 'enemy_spawner') : false;
    const hasWeaponInventory = this.editor.behaviors ? this.editor.behaviors.hasBehavior(ent, 'weapon_inventory') : false;
    const hasFirstPerson = this.editor.behaviors ? this.editor.behaviors.hasBehavior(ent, 'first_person_controller') : false;
    const hasTargetHealth = this.editor.behaviors ? this.editor.behaviors.hasBehavior(ent, 'target_health') : false;
    const hasKeyPickup = this.editor.behaviors ? this.editor.behaviors.hasBehavior(ent, 'key_pickup') : false;
    const hasLockedDoor = this.editor.behaviors ? this.editor.behaviors.hasBehavior(ent, 'locked_door') : false;
    const hasJetpack = this.editor.behaviors ? this.editor.behaviors.hasBehavior(ent, 'jetpack') : false;
    const hasLevelPortal = this.editor.behaviors ? this.editor.behaviors.hasBehavior(ent, 'level_portal') : false;
    const hasAudioTrigger = this.editor.behaviors ? this.editor.behaviors.hasBehavior(ent, 'audio_trigger') : false;
    const hasPostfxTrigger = this.editor.behaviors ? this.editor.behaviors.hasBehavior(ent, 'postfx_trigger') : false;
    const hasLavaHazard = this.editor.behaviors ? this.editor.behaviors.hasBehavior(ent, 'lava_hazard') : false;
    const hasCoinBounce = this.editor.behaviors ? this.editor.behaviors.hasBehavior(ent, 'coin_bounce') : false;
    const hasLightCycle = this.editor.behaviors ? this.editor.behaviors.hasBehavior(ent, 'light_color_cycle') : false;
    const hasWaypointPatrol = this.editor.behaviors ? this.editor.behaviors.hasBehavior(ent, 'waypoint_patrol') : false;
    const hasTurretAI = this.editor.behaviors ? this.editor.behaviors.hasBehavior(ent, 'turret_ai') : false;
    const hasPressurePlate = this.editor.behaviors ? this.editor.behaviors.hasBehavior(ent, 'pressure_plate') : false;
    const hasTeleportGateway = this.editor.behaviors ? this.editor.behaviors.hasBehavior(ent, 'teleport_gateway') : false;
    const hasWaterVolume = this.editor.behaviors ? this.editor.behaviors.hasBehavior(ent, 'water_volume') : false;
    const hasFlashlight = this.editor.behaviors ? this.editor.behaviors.hasBehavior(ent, 'flashlight') : false;
    const hasOverheadHealthbar = this.editor.behaviors ? this.editor.behaviors.hasBehavior(ent, 'overhead_healthbar') : false;
    const hasAmbientAudio = this.editor.behaviors ? this.editor.behaviors.hasBehavior(ent, 'ambient_audio') : false;

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

      <!-- Model Size & Scale Slider -->
      <div class="inspector-section" style="border-color: rgba(255, 102, 0, 0.35);">
        <div class="inspector-section-header" style="background: rgba(255, 102, 0, 0.12); color: var(--accent-orange); display: flex; justify-content: space-between; align-items: center;">
          <span>📏 Model Size & Scale</span>
          <span id="simple-scale-display" style="font-family: var(--font-mono); font-size: 11px; font-weight: 700; color: var(--accent-orange);">${(ent.getLocalScale().x).toFixed(2)}x</span>
        </div>
        <div class="inspector-section-content" style="display: flex; flex-direction: column; gap: 8px;">
          <!-- Slider and Stepper Controls -->
          <div style="display: flex; align-items: center; gap: 8px;">
            <button class="btn btn-sm btn-icon" id="btn-scale-step-down" title="Shrink Model (-0.1x)" style="width: 26px; height: 26px; font-size: 11px;">➖</button>
            <input type="range" id="simple-scale-slider" min="0.1" max="5.0" step="0.05" value="${Math.min(5.0, Math.max(0.1, ent.getLocalScale().x))}" style="flex: 1; accent-color: var(--accent-orange); cursor: pointer;">
            <button class="btn btn-sm btn-icon" id="btn-scale-step-up" title="Enlarge Model (+0.1x)" style="width: 26px; height: 26px; font-size: 11px;">➕</button>
            <input type="number" id="simple-scale-number" min="0.01" max="50.0" step="0.1" value="${(ent.getLocalScale().x).toFixed(2)}" class="text-input" style="width: 58px; padding: 3px 6px; text-align: center; font-family: var(--font-mono); font-size: 11px;">
          </div>

          <!-- Quick Presets -->
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px;">
            <button class="btn btn-sm" id="btn-scale-05" style="font-size: 10px; padding: 4px 2px;">0.5x Half</button>
            <button class="btn btn-sm btn-primary" id="btn-scale-10" style="font-size: 10px; padding: 4px 2px;">1.0x Normal</button>
            <button class="btn btn-sm" id="btn-scale-20" style="font-size: 10px; padding: 4px 2px;">2.0x Double</button>
            <button class="btn btn-sm" id="btn-scale-40" style="font-size: 10px; padding: 4px 2px;">4.0x Giant</button>
          </div>

          <!-- Activate Canvas Resize Gizmo Button -->
          <button class="btn btn-sm" id="btn-activate-scale-gizmo" style="border-color: var(--accent-orange); color: var(--accent-orange); background: rgba(255, 102, 0, 0.08); font-weight: 600; gap: 6px; margin-top: 2px;">
            <span>⤢</span>
            <span>Drag Corner Hook Arrows on Canvas (R)</span>
          </button>
        </div>
      </div>

      <!-- Model Direction & Facing (Turn) -->
      <div class="inspector-section" style="border-color: rgba(56, 189, 248, 0.35);">
        <div class="inspector-section-header" style="background: rgba(56, 189, 248, 0.12); color: #38bdf8; display: flex; justify-content: space-between; align-items: center;">
          <span>🔄 Direction & Facing (Turn)</span>
          <span id="simple-rot-display" style="font-family: var(--font-mono); font-size: 11px; font-weight: 700; color: #38bdf8;">${Math.round(((ent.getEulerAngles().y % 360) + 360) % 360)}°</span>
        </div>
        <div class="inspector-section-content" style="display: flex; flex-direction: column; gap: 8px;">
          <!-- Quick Cardinal Directions -->
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px;">
            <button class="btn btn-sm" id="btn-face-forward" title="Face Forward (0° / South)" style="font-size: 10px; padding: 4px 2px;">⬇ 0° Fwd</button>
            <button class="btn btn-sm" id="btn-face-right" title="Face Right (90° / East)" style="font-size: 10px; padding: 4px 2px;">➡ 90° Right</button>
            <button class="btn btn-sm" id="btn-face-back" title="Face Back (180° / North)" style="font-size: 10px; padding: 4px 2px;">⬆ 180° Back</button>
            <button class="btn btn-sm" id="btn-face-left" title="Face Left (270° / West)" style="font-size: 10px; padding: 4px 2px;">⬅ 270° Left</button>
          </div>

          <!-- Slider and Stepper Controls -->
          <div style="display: flex; align-items: center; gap: 8px;">
            <button class="btn btn-sm btn-icon" id="btn-turn-step-left" title="Turn Left (-15°)" style="width: 26px; height: 26px; font-size: 11px;">↶</button>
            <input type="range" id="simple-rot-slider" min="0" max="360" step="5" value="${Math.round(((ent.getEulerAngles().y % 360) + 360) % 360)}" style="flex: 1; accent-color: #38bdf8; cursor: pointer;">
            <button class="btn btn-sm btn-icon" id="btn-turn-step-right" title="Turn Right (+15°)" style="width: 26px; height: 26px; font-size: 11px;">↷</button>
            <input type="number" id="simple-rot-number" min="0" max="360" step="5" value="${Math.round(((ent.getEulerAngles().y % 360) + 360) % 360)}" class="text-input" style="width: 58px; padding: 3px 6px; text-align: center; font-family: var(--font-mono); font-size: 11px;">
          </div>

          <!-- Quick Turn Presets -->
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px;">
            <button class="btn btn-sm" id="btn-turn-ccw-45" style="font-size: 10px; padding: 4px 2px;">↶ Turn -45°</button>
            <button class="btn btn-sm" id="btn-turn-cw-45" style="font-size: 10px; padding: 4px 2px;">↷ Turn +45°</button>
            <button class="btn btn-sm" id="btn-turn-flip-180" style="font-size: 10px; padding: 4px 2px;">↻ Flip 180°</button>
          </div>

          <!-- Activate Canvas Rotate Gizmo Button -->
          <button class="btn btn-sm" id="btn-activate-rot-gizmo" style="border-color: #38bdf8; color: #38bdf8; background: rgba(56, 189, 248, 0.08); font-weight: 600; gap: 6px; margin-top: 2px;">
            <span>↻</span>
            <span>Drag Top Turn Handle on Canvas (E)</span>
          </button>
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
          <!-- Active Behaviors on this Entity -->
          ${(() => {
            const activeB = this.editor.behaviors ? (this.editor.behaviors.getBehaviors(ent) || []) : [];
            if (!activeB.length) return '';
            return `
              <div style="font-size: 10px; font-weight: 700; color: var(--accent-orange); margin-bottom: 2px;">ACTIVE ON OBJECT (${activeB.length}):</div>
              ${activeB.map(b => `
                <div style="display: flex; align-items: center; justify-content: space-between; background: rgba(255,102,0,0.15); border: 1px solid var(--accent-orange); border-radius: 6px; padding: 6px 10px; font-size: 11px;">
                  <span style="color: var(--accent-orange); font-weight: 600;">⚡ ${b.type} Active</span>
                  <button class="btn btn-icon btn-sm btn-simple-remove-b" data-btype="${b.type}" title="Remove ${b.type}" style="color: #ef4444; width: 22px; height: 22px; font-size: 11px; padding: 0;">✕</button>
                </div>
              `).join('')}
              <div style="border-bottom: 1px solid var(--border-subtle); margin: 4px 0;"></div>
            `;
          })()}

          <!-- Add Any Behavior Dropdown -->
          <div style="margin-bottom: 4px;">
            <div style="font-size: 10px; font-weight: 700; color: var(--text-muted); margin-bottom: 4px;">ADD ANY BEHAVIOR:</div>
            <select id="simple-add-behavior-select" class="select-input" style="padding: 6px; font-size: 11px; font-weight: 600; text-align: center; border-color: var(--accent-orange); color: var(--accent-orange); width: 100%;">
              <option value="">+ Add Game Behavior (${BEHAVIOR_CATALOG.length})</option>
              ${BEHAVIOR_CATALOG.map(b => `<option value="${b.type}">${b.icon} ${b.name}</option>`).join('')}
            </select>
          </div>

          <div style="font-size: 10px; font-weight: 700; color: var(--text-muted); margin-top: 4px;">QUICK POPULAR SHORTCUTS:</div>
          ${hasWasd ? `
            <div style="display: flex; align-items: center; justify-content: space-between; background: rgba(16,185,129,0.15); border: 1px solid #10b981; border-radius: 6px; padding: 6px 10px; font-size: 11px;">
              <span style="color: #10b981; font-weight: 600;">🎮 WASD Controller Active</span>
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

          ${hasTurretAI ? `
            <div style="display: flex; align-items: center; justify-content: space-between; background: rgba(239,68,68,0.15); border: 1px solid #ef4444; border-radius: 6px; padding: 6px 10px; font-size: 11px;">
              <span style="color: #f87171; font-weight: 600;">🔫 Auto Turret AI Active</span>
              <button class="btn btn-icon btn-sm" id="remove-turret-ai-behavior" title="Remove Turret AI" style="color: #ef4444; width: 22px; height: 22px; font-size: 11px; padding: 0;">✕</button>
            </div>
          ` : `
            <button class="btn" id="add-turret-ai-behavior" style="justify-content: flex-start; gap: 8px;">
              <span>🎯</span> <span>Add Auto Turret Tracking AI</span>
            </button>
          `}

          ${hasPressurePlate ? `
            <div style="display: flex; align-items: center; justify-content: space-between; background: rgba(234,179,8,0.15); border: 1px solid #eab308; border-radius: 6px; padding: 6px 10px; font-size: 11px;">
              <span style="color: #facc15; font-weight: 600;">🔘 Pressure Plate Active</span>
              <button class="btn btn-icon btn-sm" id="remove-pressure-plate-behavior" title="Remove Pressure Plate" style="color: #ef4444; width: 22px; height: 22px; font-size: 11px; padding: 0;">✕</button>
            </div>
          ` : `
            <button class="btn" id="add-pressure-plate-behavior" style="justify-content: flex-start; gap: 8px;">
              <span>🔘</span> <span>Make Interactive Pressure Plate</span>
            </button>
          `}

          ${hasTeleportGateway ? `
            <div style="display: flex; align-items: center; justify-content: space-between; background: rgba(0,229,255,0.15); border: 1px solid #00e5ff; border-radius: 6px; padding: 6px 10px; font-size: 11px;">
              <span style="color: #00e5ff; font-weight: 600;">🌀 Teleport Gateway Active</span>
              <button class="btn btn-icon btn-sm" id="remove-teleport-gateway-behavior" title="Remove Teleport Gateway" style="color: #ef4444; width: 22px; height: 22px; font-size: 11px; padding: 0;">✕</button>
            </div>
          ` : `
            <button class="btn" id="add-teleport-gateway-behavior" style="justify-content: flex-start; gap: 8px;">
              <span>🌀</span> <span>Add Linked Teleport Gateway</span>
            </button>
          `}

          ${hasWaterVolume ? `
            <div style="display: flex; align-items: center; justify-content: space-between; background: rgba(59,130,246,0.15); border: 1px solid #3b82f6; border-radius: 6px; padding: 6px 10px; font-size: 11px;">
              <span style="color: #60a5fa; font-weight: 600;">🌊 Water Buoyancy Volume Active</span>
              <button class="btn btn-icon btn-sm" id="remove-water-volume-behavior" title="Remove Water Volume" style="color: #ef4444; width: 22px; height: 22px; font-size: 11px; padding: 0;">✕</button>
            </div>
          ` : `
            <button class="btn" id="add-water-volume-behavior" style="justify-content: flex-start; gap: 8px;">
              <span>🌊</span> <span>Make Water Buoyancy Volume</span>
            </button>
          `}

          ${hasFlashlight ? `
            <div style="display: flex; align-items: center; justify-content: space-between; background: rgba(250,204,21,0.15); border: 1px solid #facc15; border-radius: 6px; padding: 6px 10px; font-size: 11px;">
              <span style="color: #fde047; font-weight: 600;">🔦 Flashlight Spotlight Active</span>
              <button class="btn btn-icon btn-sm" id="remove-flashlight-behavior" title="Remove Flashlight" style="color: #ef4444; width: 22px; height: 22px; font-size: 11px; padding: 0;">✕</button>
            </div>
          ` : `
            <button class="btn" id="add-flashlight-behavior" style="justify-content: flex-start; gap: 8px;">
              <span>🔦</span> <span>Attach Toggleable Flashlight ('L')</span>
            </button>
          `}

          ${hasOverheadHealthbar ? `
            <div style="display: flex; align-items: center; justify-content: space-between; background: rgba(34,197,94,0.15); border: 1px solid #22c55e; border-radius: 6px; padding: 6px 10px; font-size: 11px;">
              <span style="color: #4ade80; font-weight: 600;">🏥 Overhead 3D Billboard HUD Active</span>
              <button class="btn btn-icon btn-sm" id="remove-overhead-healthbar-behavior" title="Remove Billboard HUD" style="color: #ef4444; width: 22px; height: 22px; font-size: 11px; padding: 0;">✕</button>
            </div>
          ` : `
            <button class="btn" id="add-overhead-healthbar-behavior" style="justify-content: flex-start; gap: 8px;">
              <span>🏥</span> <span>Add Overhead Billboard Health HUD</span>
            </button>
          `}

          ${hasAmbientAudio ? `
            <div style="display: flex; align-items: center; justify-content: space-between; background: rgba(168,85,247,0.15); border: 1px solid #a855f7; border-radius: 6px; padding: 6px 10px; font-size: 11px;">
              <span style="color: #c084fc; font-weight: 600;">🎵 Ambient Music Emitter Active</span>
              <button class="btn btn-icon btn-sm" id="remove-ambient-audio-behavior" title="Remove Ambient Music" style="color: #ef4444; width: 22px; height: 22px; font-size: 11px; padding: 0;">✕</button>
            </div>
          ` : `
            <button class="btn" id="add-ambient-audio-behavior" style="justify-content: flex-start; gap: 8px;">
              <span>🎵</span> <span>Add Ambient Background Music Emitter</span>
            </button>
          `}

          <button class="btn" id="add-trigger-behavior" style="justify-content: flex-start; gap: 8px;">
            <span>⚡</span> <span>Add Teleport Trigger Volume</span>
          </button>

          <button class="btn" id="add-win-trigger-behavior" style="justify-content: flex-start; gap: 8px;">
            <span>🏆</span> <span>Add Level Victory Trigger Volume</span>
          </button>

          <button class="btn" id="btn-simple-anim-blend" style="justify-content: flex-start; gap: 8px;">
            <span>🕺</span> <span>Visual Animation Blend Graph (States & Transitions)</span>
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

        const applyColorNode = (node) => {
          if (node.render) {
            if (!node.render.material) {
              node.render.material = new pc.StandardMaterial();
            }
            node.render.material.diffuse = new pc.Color(r, g, b);
            node.render.material.update();
          }
          if (node.children) node.children.forEach(applyColorNode);
        };
        applyColorNode(ent);
        this.editor.events.emit('entity:component:changed', ent);
        this.editor.events.emit('scene:changed');
      });
    });

    // Model Size & Scale Slider / Inputs
    const scaleSlider = body.querySelector('#simple-scale-slider');
    const scaleNum = body.querySelector('#simple-scale-number');
    const scaleDisplay = body.querySelector('#simple-scale-display');

    const applyScaleValue = (val) => {
      const scaleVal = Math.max(0.01, Math.min(50.0, parseFloat(val) || 1.0));
      ent.setLocalScale(scaleVal, scaleVal, scaleVal);
      if (scaleSlider) scaleSlider.value = Math.min(5.0, Math.max(0.1, scaleVal));
      if (scaleNum) scaleNum.value = scaleVal.toFixed(2);
      if (scaleDisplay) scaleDisplay.textContent = `${scaleVal.toFixed(2)}x`;
      this.editor.events.emit('entity:transformed', ent);
    };

    if (scaleSlider) {
      scaleSlider.addEventListener('input', (e) => applyScaleValue(e.target.value));
      scaleSlider.addEventListener('change', () => {
        this.editor.commitEntityTransform(ent, { initialScale: ent.getLocalScale() });
      });
    }

    if (scaleNum) {
      scaleNum.addEventListener('change', (e) => {
        applyScaleValue(e.target.value);
        this.editor.commitEntityTransform(ent, { initialScale: ent.getLocalScale() });
      });
    }

    const btnStepDown = body.querySelector('#btn-scale-step-down');
    const btnStepUp = body.querySelector('#btn-scale-step-up');
    if (btnStepDown) {
      btnStepDown.addEventListener('click', () => {
        const cur = ent.getLocalScale().x;
        applyScaleValue(Math.max(0.1, cur - 0.1));
      });
    }
    if (btnStepUp) {
      btnStepUp.addEventListener('click', () => {
        const cur = ent.getLocalScale().x;
        applyScaleValue(cur + 0.1);
      });
    }

    // Quick Size Presets
    const presets = [
      { id: '#btn-scale-05', val: 0.5 },
      { id: '#btn-scale-10', val: 1.0 },
      { id: '#btn-scale-20', val: 2.0 },
      { id: '#btn-scale-40', val: 4.0 }
    ];
    presets.forEach(({ id, val }) => {
      const btn = body.querySelector(id);
      if (btn) btn.addEventListener('click', () => applyScaleValue(val));
    });

    // Activate Canvas Resize Gizmo Button
    const btnActivateGizmo = body.querySelector('#btn-activate-scale-gizmo');
    if (btnActivateGizmo) {
      btnActivateGizmo.addEventListener('click', () => {
        if (this.editor.toolstrip) {
          this.editor.toolstrip.setTransformMode('scale');
        } else if (this.editor.runtime?.gizmoManager) {
          this.editor.runtime.gizmoManager.setMode('scale');
        }
        showToast('⤢ Grab the Corner Hook Arrows on the model to drag-resize!', 'success');
      });
    }

    // Model Direction & Facing (Turn) Controls
    const rotSlider = body.querySelector('#simple-rot-slider');
    const rotNum = body.querySelector('#simple-rot-number');
    const rotDisplay = body.querySelector('#simple-rot-display');

    const applyRotationY = (deg) => {
      let val = parseFloat(deg);
      if (isNaN(val)) val = 0;
      val = ((val % 360) + 360) % 360;

      const initialRot = ent.getEulerAngles().clone();
      const initialPos = ent.getPosition().clone();
      const initialScale = ent.getLocalScale().clone();

      ent.setEulerAngles(initialRot.x, val, initialRot.z);
      this.editor.commitEntityTransform(ent, { initialRot, initialPos, initialScale });
      this.editor.events.emit('entity:transformed', ent);

      if (rotSlider) rotSlider.value = Math.round(val);
      if (rotNum) rotNum.value = Math.round(val);
      if (rotDisplay) rotDisplay.textContent = `${Math.round(val)}°`;
    };

    if (rotSlider) {
      rotSlider.addEventListener('input', (e) => applyRotationY(e.target.value));
    }
    if (rotNum) {
      rotNum.addEventListener('change', (e) => applyRotationY(e.target.value));
    }

    const btnFaceFwd = body.querySelector('#btn-face-forward');
    const btnFaceRight = body.querySelector('#btn-face-right');
    const btnFaceBack = body.querySelector('#btn-face-back');
    const btnFaceLeft = body.querySelector('#btn-face-left');

    if (btnFaceFwd) btnFaceFwd.addEventListener('click', () => applyRotationY(0));
    if (btnFaceRight) btnFaceRight.addEventListener('click', () => applyRotationY(90));
    if (btnFaceBack) btnFaceBack.addEventListener('click', () => applyRotationY(180));
    if (btnFaceLeft) btnFaceLeft.addEventListener('click', () => applyRotationY(270));

    const btnTurnStepLeft = body.querySelector('#btn-turn-step-left');
    const btnTurnStepRight = body.querySelector('#btn-turn-step-right');
    if (btnTurnStepLeft) {
      btnTurnStepLeft.addEventListener('click', () => {
        const cur = ent.getEulerAngles().y;
        applyRotationY(cur - 15);
      });
    }
    if (btnTurnStepRight) {
      btnTurnStepRight.addEventListener('click', () => {
        const cur = ent.getEulerAngles().y;
        applyRotationY(cur + 15);
      });
    }

    const btnTurnCCW45 = body.querySelector('#btn-turn-ccw-45');
    const btnTurnCW45 = body.querySelector('#btn-turn-cw-45');
    const btnTurnFlip180 = body.querySelector('#btn-turn-flip-180');
    if (btnTurnCCW45) btnTurnCCW45.addEventListener('click', () => applyRotationY(ent.getEulerAngles().y - 45));
    if (btnTurnCW45) btnTurnCW45.addEventListener('click', () => applyRotationY(ent.getEulerAngles().y + 45));
    if (btnTurnFlip180) btnTurnFlip180.addEventListener('click', () => applyRotationY(ent.getEulerAngles().y + 180));

    const btnActivateRotGizmo = body.querySelector('#btn-activate-rot-gizmo');
    if (btnActivateRotGizmo) {
      btnActivateRotGizmo.addEventListener('click', () => {
        if (this.editor.toolstrip) {
          this.editor.toolstrip.setTransformMode('rotate');
        } else if (this.editor.runtime?.gizmoManager) {
          this.editor.runtime.gizmoManager.setMode('rotate');
        }
        showToast('↻ Drag the Top Turn Handle on the canvas to rotate the model!', 'success');
      });
    }

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

    // Remove behavior buttons in Simple Mode
    body.querySelectorAll('.btn-simple-remove-b').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const bType = btn.dataset.btype;
        if (this.editor.behaviors) {
          this.editor.behaviors.removeBehavior(ent, bType);
          showToast(`Removed behavior: ${bType}`, 'info');
          this.updateView();
        }
      });
    });

    // Simple Mode Add Any Behavior Dropdown
    const simpleAddSelect = body.querySelector('#simple-add-behavior-select');
    if (simpleAddSelect) {
      simpleAddSelect.addEventListener('change', () => {
        const bType = simpleAddSelect.value;
        if (bType && this.editor.behaviors) {
          const entry = BEHAVIOR_CATALOG.find(b => b.type === bType);
          this.editor.behaviors.attachBehavior(ent, bType, entry ? { ...entry.defaultParams } : {});
          showToast(`Attached behavior: ${bType}`, 'success');
          this.updateView();
        }
      });
    }

    // Simple Mode Handlers for new behaviors
    const addTurretBtn = body.querySelector('#add-turret-ai-behavior');
    if (addTurretBtn) {
      addTurretBtn.addEventListener('click', () => {
        if (this.editor.behaviors) {
          this.editor.behaviors.attachBehavior(ent, 'turret_ai', { range: 20, fireRate: 1.5, damage: 15 });
          showToast(`🎯 Attached Auto Turret AI to ${ent.name}!`, 'success');
          this.updateView();
        }
      });
    }
    const remTurretBtn = body.querySelector('#remove-turret-ai-behavior');
    if (remTurretBtn) {
      remTurretBtn.addEventListener('click', () => {
        if (this.editor.behaviors) {
          this.editor.behaviors.removeBehavior(ent, 'turret_ai');
          showToast(`Removed Turret AI from ${ent.name}.`, 'info');
          this.updateView();
        }
      });
    }

    const addPlateBtn = body.querySelector('#add-pressure-plate-behavior');
    if (addPlateBtn) {
      addPlateBtn.addEventListener('click', () => {
        if (this.editor.behaviors) {
          this.editor.behaviors.attachBehavior(ent, 'pressure_plate', { radius: 1.5 });
          showToast(`🔘 Attached Pressure Plate to ${ent.name}!`, 'success');
          this.updateView();
        }
      });
    }
    const remPlateBtn = body.querySelector('#remove-pressure-plate-behavior');
    if (remPlateBtn) {
      remPlateBtn.addEventListener('click', () => {
        if (this.editor.behaviors) {
          this.editor.behaviors.removeBehavior(ent, 'pressure_plate');
          showToast(`Removed Pressure Plate from ${ent.name}.`, 'info');
          this.updateView();
        }
      });
    }

    const addGatewayBtn = body.querySelector('#add-teleport-gateway-behavior');
    if (addGatewayBtn) {
      addGatewayBtn.addEventListener('click', () => {
        if (this.editor.behaviors) {
          this.editor.behaviors.attachBehavior(ent, 'teleport_gateway', { cooldown: 2.0, radius: 1.8 });
          showToast(`🌀 Attached Teleport Gateway to ${ent.name}!`, 'success');
          this.updateView();
        }
      });
    }
    const remGatewayBtn = body.querySelector('#remove-teleport-gateway-behavior');
    if (remGatewayBtn) {
      remGatewayBtn.addEventListener('click', () => {
        if (this.editor.behaviors) {
          this.editor.behaviors.removeBehavior(ent, 'teleport_gateway');
          showToast(`Removed Teleport Gateway from ${ent.name}.`, 'info');
          this.updateView();
        }
      });
    }

    const addWaterBtn = body.querySelector('#add-water-volume-behavior');
    if (addWaterBtn) {
      addWaterBtn.addEventListener('click', () => {
        if (this.editor.behaviors) {
          this.editor.behaviors.attachBehavior(ent, 'water_volume', { buoyancyForce: 15, extents: [5, 3, 5] });
          showToast(`🌊 Attached Water Buoyancy Volume to ${ent.name}!`, 'success');
          this.updateView();
        }
      });
    }
    const remWaterBtn = body.querySelector('#remove-water-volume-behavior');
    if (remWaterBtn) {
      remWaterBtn.addEventListener('click', () => {
        if (this.editor.behaviors) {
          this.editor.behaviors.removeBehavior(ent, 'water_volume');
          showToast(`Removed Water Volume from ${ent.name}.`, 'info');
          this.updateView();
        }
      });
    }

    const addFlashlightBtn = body.querySelector('#add-flashlight-behavior');
    if (addFlashlightBtn) {
      addFlashlightBtn.addEventListener('click', () => {
        if (this.editor.behaviors) {
          this.editor.behaviors.attachBehavior(ent, 'flashlight', {});
          showToast(`🔦 Attached Flashlight ('L') to ${ent.name}!`, 'success');
          this.updateView();
        }
      });
    }
    const remFlashlightBtn = body.querySelector('#remove-flashlight-behavior');
    if (remFlashlightBtn) {
      remFlashlightBtn.addEventListener('click', () => {
        if (this.editor.behaviors) {
          this.editor.behaviors.removeBehavior(ent, 'flashlight');
          showToast(`Removed Flashlight from ${ent.name}.`, 'info');
          this.updateView();
        }
      });
    }

    const addOverheadBtn = body.querySelector('#add-overhead-healthbar-behavior');
    if (addOverheadBtn) {
      addOverheadBtn.addEventListener('click', () => {
        if (this.editor.behaviors) {
          this.editor.behaviors.attachBehavior(ent, 'overhead_healthbar', {});
          showToast(`🏥 Attached Overhead Health HUD to ${ent.name}!`, 'success');
          this.updateView();
        }
      });
    }
    const remOverheadBtn = body.querySelector('#remove-overhead-healthbar-behavior');
    if (remOverheadBtn) {
      remOverheadBtn.addEventListener('click', () => {
        if (this.editor.behaviors) {
          this.editor.behaviors.removeBehavior(ent, 'overhead_healthbar');
          showToast(`Removed Overhead Health HUD from ${ent.name}.`, 'info');
          this.updateView();
        }
      });
    }

    const addAmbientBtn = body.querySelector('#add-ambient-audio-behavior');
    if (addAmbientBtn) {
      addAmbientBtn.addEventListener('click', () => {
        if (this.editor.behaviors) {
          this.editor.behaviors.attachBehavior(ent, 'ambient_audio', { volume: 0.3 });
          showToast(`🎵 Attached Ambient Music Emitter to ${ent.name}!`, 'success');
          this.updateView();
        }
      });
    }
    const remAmbientBtn = body.querySelector('#remove-ambient-audio-behavior');
    if (remAmbientBtn) {
      remAmbientBtn.addEventListener('click', () => {
        if (this.editor.behaviors) {
          this.editor.behaviors.removeBehavior(ent, 'ambient_audio');
          showToast(`Removed Ambient Music Emitter from ${ent.name}.`, 'info');
          this.updateView();
        }
      });
    }

    const addWasdBtn = body.querySelector('#add-wasd-behavior');
    if (addWasdBtn) {
      addWasdBtn.addEventListener('click', () => {
        if (this.editor.behaviors) {
          this.editor.behaviors.attachBehavior(ent, 'wasd', { speed: 8 });
          showToast(`🎮 Attached WASD Player Controller to ${ent.name}! Press ▶ Play to test!`, 'success');
          this.updateView();
        }
      });
    }
    const remWasdBtn = body.querySelector('#remove-wasd-behavior');
    if (remWasdBtn) {
      remWasdBtn.addEventListener('click', () => {
        if (this.editor.behaviors) {
          this.editor.behaviors.removeBehavior(ent, 'wasd');
          showToast(`Removed WASD Controller from ${ent.name}.`, 'info');
          this.updateView();
        }
      });
    }

    const addSpinBtn = body.querySelector('#add-spin-behavior');
    if (addSpinBtn) {
      addSpinBtn.addEventListener('click', () => {
        if (this.editor.behaviors) {
          this.editor.behaviors.attachBehavior(ent, 'spin', { speed: 90, axis: 'y' });
          showToast(`🔄 Attached Continuous Spin to ${ent.name}!`, 'success');
          this.updateView();
        }
      });
    }
    const remSpinBtn = body.querySelector('#remove-spin-behavior');
    if (remSpinBtn) {
      remSpinBtn.addEventListener('click', () => {
        if (this.editor.behaviors) {
          this.editor.behaviors.removeBehavior(ent, 'spin');
          showToast(`Removed Spin from ${ent.name}.`, 'info');
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
            radius: 2.0,
            targetPosition: [0, 2, 0]
          });
          showToast(`⚡ Teleport Trigger Volume added to ${ent.name}!`, 'success');
          this.updateView();
        }
      });
    }

    const addWinTrigBtn = body.querySelector('#add-win-trigger-behavior');
    if (addWinTrigBtn) {
      addWinTrigBtn.addEventListener('click', () => {
        if (this.editor.triggers) {
          if (!ent.collision) this.editor.addComponent(ent, 'collision', { type: 'box' });
          this.editor.triggers.registerTrigger(ent.name, {
            eventType: 'on_enter',
            action: 'win_level',
            radius: 2.5,
            victoryMessage: 'Congratulations! Level Completed!'
          });
          showToast(`🏆 Level Victory Trigger Volume added to ${ent.name}!`, 'success');
          this.updateView();
        }
      });
    }

    const simpleAnimBlendBtn = body.querySelector('#btn-simple-anim-blend');
    if (simpleAnimBlendBtn) {
      simpleAnimBlendBtn.addEventListener('click', () => {
        if (this.animBlendModal) {
          this.animBlendModal.open(ent);
        } else {
          showToast('Animation Blend Graph Modal not available', 'warn');
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
          <div style="display: flex; justify-content: flex-end; margin-top: -4px;">
            <label style="display: flex; align-items: center; gap: 4px; font-size: 10px; color: var(--text-muted); cursor: pointer;">
              <input type="checkbox" id="pro-uniform-scale-lock" checked style="accent-color: var(--accent-orange); width: 12px; height: 12px;">
              <span>🔗 Uniform Scale (XYZ)</span>
            </label>
          </div>
        </div>
      </div>

      <!-- Components Container -->
      <div id="components-stack" style="display: flex; flex-direction: column; gap: 8px;"></div>

      <!-- Add & Paste Component Buttons -->
      <div style="margin-top: 8px; display: flex; flex-direction: column; gap: 6px;">
        ${this.editor._copiedComponent ? `
          <button id="btn-paste-component" class="btn" style="background: rgba(34, 197, 94, 0.15); border-color: #22c55e; color: #22c55e; font-weight: 700; font-size: 11px; padding: 6px;">
            📋 Paste Component (${this.editor._copiedComponent.type})
          </button>
        ` : ''}
        <select id="add-component-select" class="select-input" style="padding: 6px; font-weight: 600; text-align: center; border-color: var(--accent-orange); color: var(--accent-orange);">
          <option value="">+ Add Component / Behavior</option>
          <optgroup label="Engine Components">
            <option value="render">Render / Mesh</option>
            <option value="light">Light Source</option>
            <option value="camera">Camera</option>
            <option value="collision">Collision Shape</option>
            <option value="rigidbody">Rigidbody Physics</option>
            <option value="joint">⚙️ Physics Joint Constraint</option>
            <option value="particlesystem">Particle Emitter</option>
            <option value="sound">3D Audio / Sound</option>
            <option value="anim">Animation Player</option>
            <option value="script">Script Behavior</option>
            <option value="trigger">Trigger Volume</option>
          </optgroup>
          <optgroup label="Gameplay Behaviors">
            ${BEHAVIOR_CATALOG.map(b => `<option value="b_${b.type}">${b.icon} ${b.name}</option>`).join('')}
          </optgroup>
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
    const updateScale = (e) => {
      const lockUniform = this.container.querySelector('#pro-uniform-scale-lock')?.checked;
      const targetId = e?.target?.id;
      let sx = parseFloat(scaleInputs[0].value) || 1;
      let sy = parseFloat(scaleInputs[1].value) || 1;
      let sz = parseFloat(scaleInputs[2].value) || 1;

      if (lockUniform && targetId) {
        if (targetId === 'scale-x') {
          sy = sx; sz = sx;
          scaleInputs[1].value = (Math.round(sy * 100) / 100).toFixed(2);
          scaleInputs[2].value = (Math.round(sz * 100) / 100).toFixed(2);
        } else if (targetId === 'scale-y') {
          sx = sy; sz = sy;
          scaleInputs[0].value = (Math.round(sx * 100) / 100).toFixed(2);
          scaleInputs[2].value = (Math.round(sz * 100) / 100).toFixed(2);
        } else if (targetId === 'scale-z') {
          sx = sz; sy = sz;
          scaleInputs[0].value = (Math.round(sx * 100) / 100).toFixed(2);
          scaleInputs[1].value = (Math.round(sy * 100) / 100).toFixed(2);
        }
      }

      ent.setLocalScale(sx, sy, sz);
      this.editor.events.emit('entity:transformed', ent);
    };

    posInputs.forEach(inp => inp.addEventListener('input', updatePos));
    rotInputs.forEach(inp => inp.addEventListener('input', updateRot));
    scaleInputs.forEach(inp => inp.addEventListener('input', (e) => updateScale(e)));

    // Paste Component Button
    const pasteBtn = this.container.querySelector('#btn-paste-component');
    if (pasteBtn && this.editor._copiedComponent) {
      pasteBtn.addEventListener('click', () => {
        const copied = this.editor._copiedComponent;
        if (copied && ent) {
          if (copied.type.startsWith('b_')) {
            const bType = copied.type.replace('b_', '');
            if (this.editor.behaviors) {
              this.editor.behaviors.attachBehavior(ent, bType, { ...(copied.props || {}) });
            }
          } else {
            this.editor.addComponent(ent, copied.type, { ...(copied.props || {}) });
          }
          showToast(`📋 Pasted ${copied.type} component onto ${ent.name}!`, 'success');
          this.updateView();
        }
      });
    }

    // Add Component Select
    const compSelect = this.container.querySelector('#add-component-select');
    if (compSelect) {
      compSelect.addEventListener('change', () => {
        const type = compSelect.value;
        if (!type) return;

        if (type.startsWith('b_')) {
          const bType = type.replace('b_', '');
          if (this.editor.behaviors) {
            const entry = BEHAVIOR_CATALOG.find(b => b.type === bType);
            this.editor.behaviors.attachBehavior(ent, bType, entry ? { ...entry.defaultParams } : {});
            showToast(`Attached behavior: ${bType}`, 'success');
            this.updateView();
          }
          compSelect.value = '';
          return;
        }

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
          <div style="display: flex; gap: 4px; align-items: center;">
            <button class="btn btn-copy-comp" data-comp="render" style="padding: 1px 6px; font-size: 10px;" title="Copy Component Settings">📋</button>
            <button class="btn btn-remove-comp" data-comp="render" style="padding: 1px 6px; font-size: 10px; color: #ef4444;">✕</button>
          </div>
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
      const copyBtn = card.querySelector('.btn-copy-comp');
      if (copyBtn) {
        copyBtn.addEventListener('click', () => {
          this.editor._copiedComponent = { type: 'render', props: { type: ent.render.type, castShadows: ent.render.castShadows } };
          showToast('📋 Copied Render component!', 'info');
          this.updateView();
        });
      }
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

            const applyMatNode = (node) => {
              if (node.render) {
                if (!node.render.material) {
                  node.render.material = new pc.StandardMaterial();
                }
                node.render.material.diffuse = new pc.Color(r, g, b);
                node.render.material.metalness = metalness;
                node.render.material.roughness = roughness;
                node.render.material.update();
              }
              if (node.children) node.children.forEach(applyMatNode);
            };
            applyMatNode(ent);
            this.editor.events.emit('entity:component:changed', ent);
            this.editor.events.emit('scene:changed');
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
          <div style="display: flex; gap: 4px; align-items: center;">
            <button class="btn btn-copy-comp" data-comp="light" style="padding: 1px 6px; font-size: 10px;" title="Copy Component Settings">📋</button>
            <button class="btn btn-remove-comp" data-comp="light" style="padding: 1px 6px; font-size: 10px; color: #ef4444;">✕</button>
          </div>
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
      const copyBtn = card.querySelector('.btn-copy-comp');
      if (copyBtn) {
        copyBtn.addEventListener('click', () => {
          this.editor._copiedComponent = { type: 'light', props: { type: ent.light.type, intensity: ent.light.intensity, range: ent.light.range } };
          showToast('📋 Copied Light component!', 'info');
          this.updateView();
        });
      }
      card.querySelector('.btn-remove-comp').addEventListener('click', () => {
        this.editor.removeComponent(ent, 'light');
      });
      stack.appendChild(card);
    }

    // Physics Joint Constraint Card
    if (ent.joint || ent.c?.joint) {
      ent.joint = ent.joint || { type: 'hinge', targetEntity: '', pivot: [0, 0, 0], axis: [0, 1, 0] };
      const card = document.createElement('div');
      card.className = 'inspector-section';
      card.style.borderColor = 'var(--accent-gold)';
      card.innerHTML = `
        <div class="inspector-section-header" style="background: rgba(234, 179, 8, 0.15); color: #facc15;">
          <span>⚙️ Physics Joint Constraint</span>
          <button class="btn btn-remove-comp" data-comp="joint" style="padding: 1px 6px; font-size: 10px; color: #ef4444;">✕</button>
        </div>
        <div class="inspector-section-content" style="display: flex; flex-direction: column; gap: 8px;">
          <div class="prop-row">
            <span class="prop-label">Joint Type</span>
            <select class="select-input" id="joint-type-select">
              <option value="hinge" ${ent.joint.type === 'hinge' ? 'selected' : ''}>Hinge (Door / Wheel)</option>
              <option value="point_to_point" ${ent.joint.type === 'point_to_point' ? 'selected' : ''}>Point-to-Point (Rope / Chain)</option>
              <option value="slider" ${ent.joint.type === 'slider' ? 'selected' : ''}>Slider (Piston / Rail)</option>
              <option value="ball_and_socket" ${ent.joint.type === 'ball_and_socket' ? 'selected' : ''}>Ball & Socket (Ragdoll Limb)</option>
            </select>
          </div>
          <div class="prop-row">
            <span class="prop-label">Target Body</span>
            <input type="text" class="text-input" id="joint-target-entity" value="${ent.joint.targetEntity || ''}" placeholder="Connected Entity Name">
          </div>
          <div class="prop-row">
            <span class="prop-label">Pivot Offset</span>
            <div class="vec3-group">
              <div class="vec3-item x"><span class="vec3-prefix">X</span><input type="number" step="0.1" id="joint-pivot-x" class="vec3-input" value="${ent.joint.pivot ? ent.joint.pivot[0] : 0}"></div>
              <div class="vec3-item y"><span class="vec3-prefix">Y</span><input type="number" step="0.1" id="joint-pivot-y" class="vec3-input" value="${ent.joint.pivot ? ent.joint.pivot[1] : 0}"></div>
              <div class="vec3-item z"><span class="vec3-prefix">Z</span><input type="number" step="0.1" id="joint-pivot-z" class="vec3-input" value="${ent.joint.pivot ? ent.joint.pivot[2] : 0}"></div>
            </div>
          </div>
        </div>
      `;

      card.querySelector('#joint-type-select').addEventListener('change', (e) => {
        ent.joint.type = e.target.value;
        this.editor.events.emit('scene:changed');
      });

      card.querySelector('#joint-target-entity').addEventListener('change', (e) => {
        ent.joint.targetEntity = e.target.value;
        this.editor.events.emit('scene:changed');
      });

      const updatePivot = () => {
        const x = parseFloat(card.querySelector('#joint-pivot-x').value) || 0;
        const y = parseFloat(card.querySelector('#joint-pivot-y').value) || 0;
        const z = parseFloat(card.querySelector('#joint-pivot-z').value) || 0;
        ent.joint.pivot = [x, y, z];
        this.editor.events.emit('scene:changed');
      };

      ['joint-pivot-x', 'joint-pivot-y', 'joint-pivot-z'].forEach(id => {
        card.querySelector(`#${id}`).addEventListener('input', updatePivot);
      });

      card.querySelector('.btn-remove-comp').addEventListener('click', () => {
        delete ent.joint;
        this.editor.removeComponent(ent, 'joint');
        this.updateView();
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
      const lin = ent.rigidbody.linearFactor || new pc.Vec3(1, 1, 1);
      const ang = ent.rigidbody.angularFactor || new pc.Vec3(1, 1, 1);

      const card = document.createElement('div');
      card.className = 'inspector-section';
      card.innerHTML = `
        <div class="inspector-section-header">
          <span>⚙️ Rigidbody Physics</span>
          <div style="display: flex; gap: 4px; align-items: center;">
            <button class="btn btn-copy-comp" data-comp="rigidbody" style="padding: 1px 6px; font-size: 10px;" title="Copy Component Settings">📋</button>
            <button class="btn btn-remove-comp" data-comp="rigidbody" style="padding: 1px 6px; font-size: 10px; color: #ef4444;">✕</button>
          </div>
        </div>
        <div class="inspector-section-content" style="display: flex; flex-direction: column; gap: 6px;">
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

          <!-- Physics Axis Constraints Locking -->
          <div style="border-top: 1px solid var(--border-subtle); padding-top: 6px; margin-top: 2px;">
            <div style="font-weight: 700; font-size: 10px; color: var(--accent-orange); margin-bottom: 4px;">🔒 Lock Linear Motion Factor</div>
            <div style="display: flex; gap: 8px; font-size: 11px;">
              <label><input type="checkbox" id="rb-lock-pos-x" ${lin.x === 0 ? 'checked' : ''}> Freeze X</label>
              <label><input type="checkbox" id="rb-lock-pos-y" ${lin.y === 0 ? 'checked' : ''}> Freeze Y</label>
              <label><input type="checkbox" id="rb-lock-pos-z" ${lin.z === 0 ? 'checked' : ''}> Freeze Z</label>
            </div>
          </div>

          <div style="border-top: 1px solid var(--border-subtle); padding-top: 6px;">
            <div style="font-weight: 700; font-size: 10px; color: var(--accent-orange); margin-bottom: 4px;">🔒 Lock Angular Rotation Factor</div>
            <div style="display: flex; gap: 8px; font-size: 11px;">
              <label><input type="checkbox" id="rb-lock-rot-x" ${ang.x === 0 ? 'checked' : ''}> Freeze Pitch (X)</label>
              <label><input type="checkbox" id="rb-lock-rot-y" ${ang.y === 0 ? 'checked' : ''}> Freeze Yaw (Y)</label>
              <label><input type="checkbox" id="rb-lock-rot-z" ${ang.z === 0 ? 'checked' : ''}> Freeze Roll (Z)</label>
            </div>
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

      const updateFactors = () => {
        const lx = card.querySelector('#rb-lock-pos-x').checked ? 0 : 1;
        const ly = card.querySelector('#rb-lock-pos-y').checked ? 0 : 1;
        const lz = card.querySelector('#rb-lock-pos-z').checked ? 0 : 1;
        const ax = card.querySelector('#rb-lock-rot-x').checked ? 0 : 1;
        const ay = card.querySelector('#rb-lock-rot-y').checked ? 0 : 1;
        const az = card.querySelector('#rb-lock-rot-z').checked ? 0 : 1;

        ent.rigidbody.linearFactor = new pc.Vec3(lx, ly, lz);
        ent.rigidbody.angularFactor = new pc.Vec3(ax, ay, az);
        this.editor.events.emit('scene:changed');
      };

      ['rb-lock-pos-x', 'rb-lock-pos-y', 'rb-lock-pos-z', 'rb-lock-rot-x', 'rb-lock-rot-y', 'rb-lock-rot-z'].forEach(id => {
        card.querySelector(`#${id}`).addEventListener('change', updateFactors);
      });

      const copyBtn = card.querySelector('.btn-copy-comp');
      if (copyBtn) {
        copyBtn.addEventListener('click', () => {
          this.editor._copiedComponent = { type: 'rigidbody', props: { type: ent.rigidbody.type, mass: ent.rigidbody.mass, restitution: ent.rigidbody.restitution, friction: ent.rigidbody.friction } };
          showToast('📋 Copied Rigidbody component!', 'info');
          this.updateView();
        });
      }
      card.querySelector('.btn-remove-comp').addEventListener('click', () => {
        this.editor.removeComponent(ent, 'rigidbody');
      });
      stack.appendChild(card);
    }

    // Animation Player Component Card (checks root & child entities for anim/animation components)
    let animComp = ent.anim || ent.animation || ent._animComp;
    let animTarget = ent;
    if (!animComp) {
      animTarget = ent.findComponent ? (ent.findComponent('anim') ? ent : ent.findOne(e => e.anim || e.animation || e._animComp)) : null;
      if (animTarget) animComp = animTarget.anim || animTarget.animation || animTarget._animComp;
    }

    if (animComp) {
      const card = document.createElement('div');
      card.className = 'inspector-section';

      // Gather available clip names
      let clipNames = ent._modelAnimations || animTarget._modelAnimations || [];
      if (clipNames.length === 0 && animComp.baseLayer && animComp.baseLayer._controller && animComp.baseLayer._controller._states) {
        clipNames = Object.keys(animComp.baseLayer._controller._states).filter(s => s !== 'START');
      }

      const activeState = (animComp.baseLayer && animComp.baseLayer.activeState) || ent._idleClip || 'idle';
      const clipOptions = clipNames.length > 0
        ? clipNames.map(name => `<option value="${name}" ${name === activeState ? 'selected' : ''}>${name}</option>`).join('')
        : `<option value="default">Default Clip</option>`;

      const idleClipName = ent._idleClip || 'idle';
      const walkClipName = ent._walkClip || 'walk';

      card.innerHTML = `
        <div class="inspector-section-header">
          <span>💃 Skeletal Animation Player</span>
          <button class="btn btn-remove-comp" data-comp="anim" style="padding: 1px 6px; font-size: 10px; color: #ef4444;">✕</button>
        </div>
        <div class="inspector-section-content" style="display: flex; flex-direction: column; gap: 8px;">
          <div style="font-size: 11px; color: var(--text-secondary); display: flex; justify-content: space-between; align-items: center;">
            <span>Current Clip:</span>
            <span id="anim-active-clip-badge" style="color: #34d399; font-weight: 600; background: rgba(52, 211, 153, 0.12); padding: 2px 8px; border-radius: 4px; border: 1px solid rgba(52, 211, 153, 0.25);">${activeState}</span>
          </div>
          <div class="prop-row">
            <span class="prop-label">Clip</span>
            <select class="text-input" id="anim-clip-select" style="font-size: 11px;">
              ${clipOptions}
            </select>
          </div>
          <div style="display: flex; gap: 6px;">
            <button class="btn btn-primary" id="btn-anim-play" style="flex: 1; font-size: 11px;">▶ Play Clip</button>
            <button class="btn" id="btn-anim-pause" style="flex: 1; font-size: 11px;">⏸ Pause</button>
          </div>
          <button class="btn" id="btn-open-anim-blend-modal" style="font-size: 11px; color: #c084fc; border-color: #a855f7;">
            🕺 Edit Animation Blend Graph
          </button>
          <div class="prop-row">
            <span class="prop-label">Speed</span>
            <input type="range" min="0.1" max="2.5" step="0.1" class="text-input" id="anim-speed" value="${animComp.speed !== undefined ? animComp.speed : 1.0}">
          </div>
          <div style="font-size: 10.5px; color: #94a3b8; background: rgba(59, 130, 246, 0.08); padding: 6px 8px; border-radius: 4px; border-left: 2px solid #3b82f6; line-height: 1.4;">
            🏃 <b>Auto-Locomotion:</b> Automatically plays <code>${walkClipName}</code> when moving with WASD or Enemy AI, and returns to <code>${idleClipName}</code> when standing still.
          </div>
        </div>
      `;

      const clipSelect = card.querySelector('#anim-clip-select');
      const badge = card.querySelector('#anim-active-clip-badge');

      clipSelect.addEventListener('change', (e) => {
        const selectedClip = e.target.value;
        if (animComp.baseLayer) {
          try {
            animComp.baseLayer.transition(selectedClip, 0.15);
          } catch(err) {
            try { animComp.baseLayer.play(selectedClip); } catch(e2) {}
          }
          if (badge) badge.textContent = selectedClip;
        } else if (animComp.play) {
          animComp.play(selectedClip);
          if (badge) badge.textContent = selectedClip;
        }
      });

      card.querySelector('#btn-anim-play').addEventListener('click', () => {
        const selectedClip = clipSelect.value;
        if (animComp.baseLayer) {
          try {
            animComp.baseLayer.transition(selectedClip, 0.1);
          } catch(err) {
            try { animComp.baseLayer.play(selectedClip); } catch(e2) {}
          }
          if (badge) badge.textContent = selectedClip;
        } else if (animComp.play) {
          animComp.play(selectedClip);
          if (badge) badge.textContent = selectedClip;
        } else if (animComp.playing !== undefined) {
          animComp.playing = true;
        }
        showToast(`▶ Playing "${selectedClip}" on ${animTarget.name}`, 'info');
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

      card.querySelector('#btn-open-anim-blend-modal').addEventListener('click', () => {
        if (this.animBlendModal) this.animBlendModal.open(animTarget);
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
            <input type="range" min="0" max="1" step="0.05" class="text-input" id="sound-volume" value="${ent.sound.volume !== undefined ? ent.sound.volume : 1}">
          </div>
          <div class="prop-row">
            <span class="prop-label">Pitch</span>
            <input type="range" min="0.5" max="2" step="0.1" class="text-input" id="sound-pitch" value="${ent.sound.pitch !== undefined ? ent.sound.pitch : 1}">
          </div>
          <div class="prop-row">
            <span class="prop-label">Min Atten Distance</span>
            <input type="number" min="0.1" step="0.5" class="text-input" id="sound-min-dist" value="${ent.sound.minDistance !== undefined ? ent.sound.minDistance : 1.0}">
          </div>
          <div class="prop-row">
            <span class="prop-label">Max Atten Distance</span>
            <input type="number" min="1" step="1" class="text-input" id="sound-max-dist" value="${ent.sound.maxDistance !== undefined ? ent.sound.maxDistance : 15.0}">
          </div>
          <div class="prop-row">
            <span class="prop-label">Loop Playback</span>
            <input type="checkbox" id="sound-loop" ${ent.sound.loop !== false ? 'checked' : ''}>
          </div>
          <div class="prop-row">
            <span class="prop-label">Auto Play On Start</span>
            <input type="checkbox" id="sound-autoplay" ${ent.sound.autoPlay ? 'checked' : ''}>
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

      card.querySelector('#sound-min-dist').addEventListener('change', (e) => {
        ent.sound.minDistance = parseFloat(e.target.value);
      });

      card.querySelector('#sound-max-dist').addEventListener('change', (e) => {
        ent.sound.maxDistance = parseFloat(e.target.value);
      });

      card.querySelector('#sound-loop').addEventListener('change', (e) => {
        ent.sound.loop = e.target.checked;
      });

      card.querySelector('#sound-autoplay').addEventListener('change', (e) => {
        ent.sound.autoPlay = e.target.checked;
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
      const ps = ent.particlesystem;
      const curColor = ps.colorTint ? `#${Math.round(ps.colorTint[0]*255).toString(16).padStart(2,'0')}${Math.round(ps.colorTint[1]*255).toString(16).padStart(2,'0')}${Math.round(ps.colorTint[2]*255).toString(16).padStart(2,'0')}` : '#ff6600';

      const card = document.createElement('div');
      card.className = 'inspector-section';
      card.innerHTML = `
        <div class="inspector-section-header">
          <span>✨ Particle System Emitter</span>
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
              <option value="rain">🌧️ Rain / Water Drop</option>
              <option value="explosion">💥 Explosion Burst</option>
            </select>
          </div>
          <div class="prop-row">
            <span class="prop-label">Particle Count</span>
            <input type="range" min="10" max="300" step="5" class="text-input" id="particle-num" value="${ps.numParticles || 60}">
          </div>
          <div class="prop-row">
            <span class="prop-label">Lifetime (s)</span>
            <input type="range" min="0.1" max="6" step="0.1" class="text-input" id="particle-lifetime" value="${ps.lifetime || 1.5}">
          </div>
          <div class="prop-row">
            <span class="prop-label">Color Tint</span>
            <input type="color" id="particle-color-tint" value="${curColor}" style="background: none; border: none; width: 40px; height: 24px; cursor: pointer;">
          </div>
          <div class="prop-row">
            <span class="prop-label">Emission Rate</span>
            <input type="range" min="0.01" max="0.5" step="0.01" class="text-input" id="particle-rate" value="${ps.rate || 0.05}">
          </div>
          <div class="prop-row">
            <span class="prop-label">Initial Scale</span>
            <input type="range" min="0.05" max="3.0" step="0.05" class="text-input" id="particle-scale" value="${ps.particleScale || 0.5}">
          </div>
        </div>
      `;

      card.querySelector('#particle-preset-select').addEventListener('change', (e) => {
        const preset = e.target.value;
        if (ent.particlesystem) {
          if (preset === 'fire') {
            ps.numParticles = 80; ps.lifetime = 1.2; ps.colorTint = [1, 0.4, 0]; ps.particleScale = 0.6;
          } else if (preset === 'smoke') {
            ps.numParticles = 40; ps.lifetime = 2.5; ps.colorTint = [0.4, 0.4, 0.4]; ps.particleScale = 1.2;
          } else if (preset === 'sparks') {
            ps.numParticles = 120; ps.lifetime = 0.6; ps.colorTint = [1, 0.9, 0.2]; ps.particleScale = 0.2;
          } else if (preset === 'magic') {
            ps.numParticles = 100; ps.lifetime = 1.8; ps.colorTint = [0.7, 0.2, 1]; ps.particleScale = 0.4;
          } else if (preset === 'rain') {
            ps.numParticles = 200; ps.lifetime = 2.0; ps.colorTint = [0.2, 0.6, 1]; ps.particleScale = 0.15;
          } else if (preset === 'explosion') {
            ps.numParticles = 150; ps.lifetime = 0.8; ps.colorTint = [1, 0.2, 0]; ps.particleScale = 0.8;
          }
          if (ps.particleScale !== undefined) ps.scaleGraph = new pc.Curve([0, ps.particleScale]);
          if (ps.colorTint) ps.colorGraph = new pc.CurveSet([[0, ps.colorTint[0]], [0, ps.colorTint[1]], [0, ps.colorTint[2]]]);
          const numInput = card.querySelector('#particle-num');
          const lifeInput = card.querySelector('#particle-lifetime');
          const scaleInput = card.querySelector('#particle-scale');
          if (numInput) numInput.value = ps.numParticles;
          if (lifeInput) lifeInput.value = ps.lifetime;
          if (scaleInput) scaleInput.value = ps.particleScale;
          if (ps.rebuild) ps.rebuild();
          showToast(`✨ Applied particle preset: ${preset}`, 'info');
        }
      });

      card.querySelector('#particle-num').addEventListener('input', (e) => {
        ps.numParticles = parseInt(e.target.value, 10);
        if (ps.rebuild) ps.rebuild();
      });

      card.querySelector('#particle-lifetime').addEventListener('input', (e) => {
        ps.lifetime = parseFloat(e.target.value);
        if (ps.rebuild) ps.rebuild();
      });

      card.querySelector('#particle-color-tint').addEventListener('input', (e) => {
        const hex = e.target.value;
        const r = parseInt(hex.slice(1, 3), 16) / 255;
        const g = parseInt(hex.slice(3, 5), 16) / 255;
        const b = parseInt(hex.slice(5, 7), 16) / 255;
        ps.colorTint = [r, g, b];
        ps.colorGraph = new pc.CurveSet([[0, r], [0, g], [0, b]]);
        if (ps.rebuild) ps.rebuild();
      });

      card.querySelector('#particle-rate').addEventListener('input', (e) => {
        ps.rate = parseFloat(e.target.value);
        if (ps.rebuild) ps.rebuild();
      });

      card.querySelector('#particle-scale').addEventListener('input', (e) => {
        ps.particleScale = parseFloat(e.target.value);
        ps.scaleGraph = new pc.Curve([0, ps.particleScale]);
        if (ps.rebuild) ps.rebuild();
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

      ent.scriptData = ent.scriptData || {};

      let scriptSectionsHTML = '';
      if (this.editor.scripts && this.editor.scripts.size > 0) {
        for (const [scriptName, scriptCode] of this.editor.scripts.entries()) {
          const parsedAttrs = parseScriptAttributes(scriptCode);
          ent.scriptData[scriptName] = ent.scriptData[scriptName] || {};

          let attrRows = '';
          if (parsedAttrs.length > 0) {
            attrRows = parsedAttrs.map(attr => {
              const currentVal = ent.scriptData[scriptName][attr.name] !== undefined ? ent.scriptData[scriptName][attr.name] : attr.default;

              if (attr.type === 'boolean') {
                return `
                  <div class="prop-row">
                    <span class="prop-label">${attr.title}</span>
                    <input type="checkbox" class="script-attr-input" data-script="${scriptName}" data-attr="${attr.name}" data-type="boolean" ${currentVal ? 'checked' : ''}>
                  </div>
                `;
              } else if (attr.type === 'number' || attr.type === 'float') {
                return `
                  <div class="prop-row">
                    <span class="prop-label">${attr.title}</span>
                    <input type="number" step="${attr.step || '0.1'}" ${attr.min !== undefined ? `min="${attr.min}"` : ''} ${attr.max !== undefined ? `max="${attr.max}"` : ''} class="text-input script-attr-input" data-script="${scriptName}" data-attr="${attr.name}" data-type="number" value="${currentVal !== undefined ? currentVal : 0}">
                  </div>
                `;
              } else if (attr.type === 'rgb' || attr.type === 'color') {
                let hexVal = '#ffffff';
                if (Array.isArray(currentVal) && currentVal.length >= 3) {
                  hexVal = `#${Math.round((currentVal[0] <= 1 ? currentVal[0] * 255 : currentVal[0])).toString(16).padStart(2, '0')}${Math.round((currentVal[1] <= 1 ? currentVal[1] * 255 : currentVal[1])).toString(16).padStart(2, '0')}${Math.round((currentVal[2] <= 1 ? currentVal[2] * 255 : currentVal[2])).toString(16).padStart(2, '0')}`;
                } else if (typeof currentVal === 'string' && currentVal.startsWith('#')) {
                  hexVal = currentVal;
                }
                return `
                  <div class="prop-row">
                    <span class="prop-label">${attr.title}</span>
                    <input type="color" class="script-attr-input" data-script="${scriptName}" data-attr="${attr.name}" data-type="color" value="${hexVal}" style="background: none; border: none; width: 40px; height: 24px; cursor: pointer;">
                  </div>
                `;
              } else {
                return `
                  <div class="prop-row">
                    <span class="prop-label">${attr.title}</span>
                    <input type="text" class="text-input script-attr-input" data-script="${scriptName}" data-attr="${attr.name}" data-type="string" value="${currentVal !== undefined ? currentVal : ''}">
                  </div>
                `;
              }
            }).join('');
          } else {
            attrRows = '<div style="font-size: 10px; color: var(--text-muted); font-style: italic;">No Script.attributes declared</div>';
          }

          scriptSectionsHTML += `
            <div style="background: var(--bg-darker); border: 1px solid var(--border-subtle); border-radius: 6px; padding: 8px; margin-top: 6px;">
              <div style="display: flex; justify-content: space-between; align-items: center; font-weight: 700; font-size: 11px; color: var(--accent-orange); margin-bottom: 6px;">
                <span>📜 ${scriptName}</span>
                <button class="btn btn-sm btn-open-script-code" data-script="${scriptName}" style="font-size: 10px; padding: 2px 6px;">📝 Edit</button>
              </div>
              ${attrRows}
            </div>
          `;
        }
      } else {
        scriptSectionsHTML = `<div style="font-size: 11px; color: var(--text-muted);">No script files registered. Open Script Code Studio to create one.</div>`;
      }

      card.innerHTML = `
        <div class="inspector-section-header">
          <span>📜 Script Behavior</span>
          <button class="btn btn-remove-comp" data-comp="script" style="padding: 1px 6px; font-size: 10px; color: #ef4444;">✕</button>
        </div>
        <div class="inspector-section-content" style="display: flex; flex-direction: column; gap: 6px;">
          ${scriptSectionsHTML}
          <button class="btn btn-primary" id="btn-open-code-script" style="font-size: 11px; padding: 4px; margin-top: 4px;">
            ➕ Open Script Code Studio
          </button>
        </div>
      `;

      card.querySelectorAll('.btn-open-script-code').forEach(btn => {
        btn.addEventListener('click', () => {
          if (this.codeEditor) this.codeEditor.open(btn.dataset.script);
        });
      });

      card.querySelector('#btn-open-code-script').addEventListener('click', () => {
        if (this.codeEditor) this.codeEditor.open('customScript.js');
      });

      card.querySelectorAll('.script-attr-input').forEach(input => {
        const updateAttr = () => {
          const sName = input.dataset.script;
          const aName = input.dataset.attr;
          const aType = input.dataset.type;

          if (!ent.scriptData[sName]) ent.scriptData[sName] = {};

          if (aType === 'boolean') {
            ent.scriptData[sName][aName] = input.checked;
          } else if (aType === 'number') {
            ent.scriptData[sName][aName] = parseFloat(input.value) || 0;
          } else if (aType === 'color') {
            const hex = input.value;
            const r = parseInt(hex.slice(1, 3), 16) / 255;
            const g = parseInt(hex.slice(3, 5), 16) / 255;
            const b = parseInt(hex.slice(5, 7), 16) / 255;
            ent.scriptData[sName][aName] = [r, g, b];
          } else {
            ent.scriptData[sName][aName] = input.value;
          }
          this.editor.events.emit('scene:changed');
        };

        input.addEventListener('input', updateAttr);
        input.addEventListener('change', updateAttr);
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
              <option value="damage_player" ${trigConfig.action === 'damage_player' ? 'selected' : ''}>⚔️ Damage Player</option>
              <option value="heal_player" ${trigConfig.action === 'heal_player' ? 'selected' : ''}>💚 Heal Player</option>
              <option value="add_score" ${trigConfig.action === 'add_score' ? 'selected' : ''}>⭐ Add Score</option>
              <option value="toggle_visibility" ${trigConfig.action === 'toggle_visibility' ? 'selected' : ''}>💡 Toggle Visibility</option>
              <option value="destroy" ${trigConfig.action === 'destroy' ? 'selected' : ''}>💥 Destroy Target Entity</option>
              <option value="win_level" ${trigConfig.action === 'win_level' ? 'selected' : ''}>🏆 Level Victory</option>
              <option value="play_sound" ${trigConfig.action === 'play_sound' ? 'selected' : ''}>🔊 Play Sound</option>
            </select>
          </div>

          <div class="prop-row">
            <span class="prop-label">Trigger Radius (m)</span>
            <input type="range" min="0.5" max="10" step="0.5" class="text-input" id="trig-radius-slider" value="${trigConfig.radius || 2.0}">
          </div>

          <div class="prop-row" id="trig-amount-row" style="display: ${['damage_player', 'heal_player', 'add_score'].includes(trigConfig.action) ? 'flex' : 'none'};">
            <span class="prop-label">Amount</span>
            <input type="number" class="text-input" id="trig-amount-input" value="${trigConfig.amount !== undefined ? trigConfig.amount : 20}">
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
      const amountRow = card.querySelector('#trig-amount-row');

      actionSelect.addEventListener('change', (e) => {
        const act = e.target.value;
        trigConfig.action = act;
        targetEntityRow.style.display = ['toggle_visibility', 'destroy'].includes(act) ? 'flex' : 'none';
        targetPosRow.style.display = act === 'teleport' ? 'flex' : 'none';
        if (amountRow) amountRow.style.display = ['damage_player', 'heal_player', 'add_score'].includes(act) ? 'flex' : 'none';
      });

      const amountInput = card.querySelector('#trig-amount-input');
      if (amountInput) {
        amountInput.addEventListener('input', (e) => {
          trigConfig.amount = parseFloat(e.target.value) || 0;
        });
      }

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

    // Active Behaviors Stack Cards
    if (this.editor.behaviors) {
      const behaviors = this.editor.behaviors.getBehaviors(ent);
      if (behaviors && behaviors.length > 0) {
        behaviors.forEach(b => {
          const card = document.createElement('div');
          card.className = 'inspector-section';
          card.style.borderColor = 'var(--accent-orange)';
          const paramRows = Object.entries(b.params || {}).map(([key, val]) => `
            <div class="prop-row">
              <span class="prop-label">${key}</span>
              <input type="${typeof val === 'number' ? 'number' : 'text'}" class="text-input behavior-param-input" data-param="${key}" value="${typeof val === 'object' && val !== null ? JSON.stringify(val) : val}">
            </div>
          `).join('');

          card.innerHTML = `
            <div class="inspector-section-header" style="background: rgba(255, 102, 0, 0.12); color: var(--accent-orange);">
              <span>⚡ Behavior: ${b.type}</span>
              <button class="btn btn-remove-behavior" style="padding: 1px 6px; font-size: 10px; color: #ef4444;">✕</button>
            </div>
            <div class="inspector-section-content" style="display: flex; flex-direction: column; gap: 6px;">
              ${paramRows || '<div style="font-size: 10px; color: var(--text-muted);">No adjustable parameters</div>'}
            </div>
          `;

          card.querySelector('.btn-remove-behavior').addEventListener('click', () => {
            this.editor.behaviors.removeBehavior(ent, b.type);
            this.updateView();
          });

          card.querySelectorAll('.behavior-param-input').forEach(inp => {
            inp.addEventListener('input', (e) => {
              const k = inp.dataset.param;
              if (typeof b.params[k] === 'number') {
                b.params[k] = parseFloat(e.target.value) || 0;
              } else if (Array.isArray(b.params[k]) || (typeof e.target.value === 'string' && (e.target.value.trim().startsWith('[') || e.target.value.trim().startsWith('{')))) {
                try {
                  b.params[k] = JSON.parse(e.target.value);
                } catch (err) {
                  b.params[k] = e.target.value;
                }
              } else {
                b.params[k] = e.target.value;
              }
            });
          });

          stack.appendChild(card);
        });
      }
    }
  }
}
