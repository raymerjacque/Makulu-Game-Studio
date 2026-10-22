import * as pc from 'playcanvas';
import { showToast } from '../ui/toast.js';

/**
 * Simple Mode Plug-and-Play Game Behaviors
 * Enables users to attach interactive movement, physics, and gameplay logic without writing code.
 */
export class BehaviorManager {
  constructor(editor) {
    this.editor = editor;
    this.isPlaying = false;
    this.activeBehaviors = new Map(); // entity -> Array<{ type, params }>
    this.keys = {};
    this._updateBound = false;

    // Track active key presses reliably on window
    window.addEventListener('keydown', (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;
      this.keys[e.key.toLowerCase()] = true;
      if (e.code) this.keys[e.code.toLowerCase()] = true;
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.key.toLowerCase()] = false;
      if (e.code) this.keys[e.code.toLowerCase()] = false;
    });

    window.addEventListener('blur', () => {
      this.keys = {};
    });

    this.editor.events.on('game:play', () => {
      this.isPlaying = true;
      this.editor.isPlaying = true;
      this.keys = {};
      this.bindUpdateLoop();
    });

    this.editor.events.on('game:stop', () => {
      this.isPlaying = false;
      this.editor.isPlaying = false;
      this.keys = {};
    });

    this.editor.events.on('runtime:ready', () => {
      this.bindUpdateLoop();
    });

    if (this.editor.getApp()) {
      this.bindUpdateLoop();
    }
  }

  get attachedBehaviors() {
    return this.activeBehaviors;
  }

  bindUpdateLoop() {
    if (this._updateBound) return;
    const app = this.editor.getApp();
    if (!app) return;
    this._updateBound = true;

    app.on('update', (dt) => {
      if (!this.isPlaying) return;

      for (const [entity, behaviors] of this.activeBehaviors.entries()) {
        if (!entity || !entity.enabled || !entity.parent) continue;

        for (const b of behaviors) {
          if (b.type === 'wasd') {
            const speed = b.params.speed || 8;
            const move = new pc.Vec3();

            // Calculate planar forward and right directions (ignore camera/object tilt)
            const forward = new pc.Vec3(entity.forward.x, 0, entity.forward.z);
            if (forward.lengthSq() > 0.0001) forward.normalize();
            else forward.set(0, 0, -1);

            const right = new pc.Vec3(entity.right.x, 0, entity.right.z);
            if (right.lengthSq() > 0.0001) right.normalize();
            else right.set(1, 0, 0);

            // Check W / Up Arrow / KeyW
            if (this.isKeyDown('w') || this.isKeyDown('arrowup') || this.isKeyDown('keyw')) {
              move.add(forward);
            }
            // Check S / Down Arrow / KeyS
            if (this.isKeyDown('s') || this.isKeyDown('arrowdown') || this.isKeyDown('keys')) {
              move.sub(forward);
            }
            // Check A / Left Arrow / KeyA
            if (this.isKeyDown('a') || this.isKeyDown('arrowleft') || this.isKeyDown('keya')) {
              move.sub(right);
            }
            // Check D / Right Arrow / KeyD
            if (this.isKeyDown('d') || this.isKeyDown('arrowright') || this.isKeyDown('keyd')) {
              move.add(right);
            }

            if (move.lengthSq() > 0.0001) {
              move.normalize().mulScalar(speed * dt);

              if (entity.rigidbody) {
                const curVel = entity.rigidbody.linearVelocity;
                entity.rigidbody.linearVelocity = new pc.Vec3(move.x * 60, curVel.y, move.z * 60);
                entity.rigidbody.teleport(entity.getPosition().clone().add(move));
              } else {
                entity.translate(move);
              }

              this.editor.events.emit('entity:transformed', entity);
            }
          } else if (b.type === 'spin') {
            const speed = b.params.speed || 45;
            const axis = b.params.axis || 'y';
            const s = speed * dt;
            if (axis === 'x') entity.rotate(s, 0, 0);
            else if (axis === 'y') entity.rotate(0, s, 0);
            else if (axis === 'z') entity.rotate(0, 0, s);
          } else if (b.type === 'light_flicker') {
            if (entity.light) {
              const variance = b.params.variance || 0.4;
              const base = b.params.baseIntensity || 2;
              const noise = (Math.random() - 0.5) * variance;
              entity.light.intensity = Math.max(0.1, base + noise);
            }
          } else if (b.type === 'physics_impulse') {
            if (entity.rigidbody && (this.isKeyDown(' ') || this.isKeyDown('space'))) {
              const force = b.params.force || 8;
              entity.rigidbody.applyImpulse(0, force, 0);
            }
          } else if (b.type === 'patrol') {
            const speed = b.params.speed || 3;
            const distance = b.params.distance || 6;
            if (!b.state) {
              b.state = { startX: entity.getPosition().x, dir: 1 };
            }
            const currentX = entity.getPosition().x;
            const delta = currentX - b.state.startX;
            if (delta > distance && b.state.dir > 0) b.state.dir = -1;
            if (delta < -distance && b.state.dir < 0) b.state.dir = 1;

            const moveX = b.state.dir * speed * dt;
            entity.translate(moveX, 0, 0);
          } else if (b.type === 'billboard') {
            const camera = app.root.find(node => node.camera);
            if (camera) {
              entity.lookAt(camera.getPosition());
              entity.rotateLocal(0, 180, 0); // Face front to camera
            }
          } else if (b.type === 'sine_float') {
            const amplitude = b.params.amplitude || 0.5;
            const frequency = b.params.frequency || 2.0;
            if (!b.state) {
              b.state = { initialY: entity.getPosition().y, time: 0 };
            }
            b.state.time += dt * frequency;
            const pos = entity.getPosition();
            entity.setPosition(pos.x, b.state.initialY + Math.sin(b.state.time) * amplitude, pos.z);
          } else if (b.type === 'orbit') {
            const speed = b.params.speed || 1.0;
            const radius = b.params.radius || 5.0;
            if (!b.state) {
              b.state = {
                angle: 0,
                center: b.params.center ? new pc.Vec3(...b.params.center) : new pc.Vec3(0, entity.getPosition().y, 0)
              };
            }
            b.state.angle += dt * speed;
            const x = b.state.center.x + Math.cos(b.state.angle) * radius;
            const z = b.state.center.z + Math.sin(b.state.angle) * radius;
            entity.setPosition(x, entity.getPosition().y, z);
          } else if (b.type === 'camera_follow') {
            const camera = app.root.find(node => node.camera);
            if (camera) {
              const offset = b.params.offset || [0, 4, 8];
              const targetPos = entity.getPosition().clone().add(new pc.Vec3(...offset));
              const curPos = camera.getPosition();
              curPos.lerp(curPos, targetPos, Math.min(1.0, dt * 5.0));
              camera.setPosition(curPos);
              camera.lookAt(entity.getPosition());
            }
          } else if (b.type === 'collectible') {
            const player = app.root.find(node => node.name.toLowerCase().includes('player') || node.name.toLowerCase().includes('character') || node.name.toLowerCase().includes('hero') || node.name.toLowerCase().includes('warrior'));
            if (player) {
              const dist = entity.getPosition().distance(player.getPosition());
              if (dist < (b.params.radius || 1.5)) {
                entity.enabled = false;
                showToast(`✨ Collected item: ${entity.name}!`, 'success');
              }
            }
          } else if (b.type === 'health') {
            if (b.params.currentHp === undefined) b.params.currentHp = b.params.maxHp || 100;
            if (!b._invincibleTimer) b._invincibleTimer = 0;
            if (b._invincibleTimer > 0) b._invincibleTimer -= dt;
          } else if (b.type === 'damage_dealer') {
            const player = app.root.find(node => node.name.toLowerCase().includes('player') || node.name.toLowerCase().includes('character') || node.name.toLowerCase().includes('hero') || node.name.toLowerCase().includes('warrior'));
            if (player) {
              const dist = entity.getPosition().distance(player.getPosition());
              const radius = b.params.radius || 1.8;
              const dmg = b.params.damage || 20;
              if (dist < radius) {
                // Find health behavior on player
                const playerBehaviors = this.getBehaviors(player);
                const healthB = playerBehaviors.find(hb => hb.type === 'health');
                if (healthB && (!healthB._invincibleTimer || healthB._invincibleTimer <= 0)) {
                  healthB.params.currentHp = Math.max(0, (healthB.params.currentHp || healthB.params.maxHp || 100) - dmg);
                  healthB._invincibleTimer = b.params.cooldown || 1.0;
                  showToast(`⚠️ Player took ${dmg} damage from ${entity.name}! HP: ${healthB.params.currentHp}`, 'warn');
                  if (healthB.params.currentHp <= 0) {
                    showToast(`💀 GAME OVER! ${player.name} was defeated.`, 'error');
                  }
                }
              }
            }
          } else if (b.type === 'health_pickup') {
            const player = app.root.find(node => node.name.toLowerCase().includes('player') || node.name.toLowerCase().includes('character') || node.name.toLowerCase().includes('hero') || node.name.toLowerCase().includes('warrior'));
            if (player) {
              const dist = entity.getPosition().distance(player.getPosition());
              const radius = b.params.radius || 1.5;
              const heal = b.params.healAmount || 25;
              if (dist < radius) {
                const playerBehaviors = this.getBehaviors(player);
                const healthB = playerBehaviors.find(hb => hb.type === 'health');
                if (healthB) {
                  const maxHp = healthB.params.maxHp || 100;
                  healthB.params.currentHp = Math.min(maxHp, (healthB.params.currentHp || maxHp) + heal);
                  entity.enabled = false;
                  showToast(`💚 Restored +${heal} HP! Current HP: ${healthB.params.currentHp}`, 'success');
                }
              }
            }
          }
        }
      }
    });
  }

  isKeyDown(key) {
    return Boolean(this.keys[key.toLowerCase()]);
  }

  attachBehavior(entity, behaviorType, params = {}) {
    if (!this.activeBehaviors.has(entity)) {
      this.activeBehaviors.set(entity, []);
    }

    const list = this.activeBehaviors.get(entity);
    // Don't add duplicate behavior of the same type
    const existing = list.find(b => b.type === behaviorType);
    if (existing) {
      existing.params = { ...existing.params, ...params };
    } else {
      list.push({ type: behaviorType, params: { ...params } });
    }

    this.bindUpdateLoop();
    this.editor.events.emit('entity:component:changed', entity);
  }

  removeBehavior(entity, behaviorType) {
    if (!this.activeBehaviors.has(entity)) return;
    const list = this.activeBehaviors.get(entity);
    const filtered = list.filter(b => b.type !== behaviorType);
    if (filtered.length > 0) {
      this.activeBehaviors.set(entity, filtered);
    } else {
      this.activeBehaviors.delete(entity);
    }
    this.editor.events.emit('entity:component:changed', entity);
  }

  hasBehavior(entity, behaviorType) {
    if (!this.activeBehaviors.has(entity)) return false;
    return this.activeBehaviors.get(entity).some(b => b.type === behaviorType);
  }

  getBehaviors(entity) {
    return this.activeBehaviors.get(entity) || [];
  }
}
