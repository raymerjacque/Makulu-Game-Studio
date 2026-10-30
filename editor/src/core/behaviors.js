import * as pc from 'playcanvas';
import { showToast } from '../ui/toast.js';
import { proceduralSFX } from '../engine/procedural-sfx.js';

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
    this._shakeTimer = 0;
    this._shakeIntensity = 0;

    // Track active key presses reliably on window
    if (typeof window !== 'undefined') {
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
    }

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

  triggerScreenShake(intensity = 0.4, duration = 0.25) {
    this._shakeIntensity = intensity;
    this._shakeTimer = duration;
  }

  bindUpdateLoop() {
    if (this._updateBound) return;
    const app = this.editor.getApp();
    if (!app) return;
    this._updateBound = true;

    app.on('update', (dt) => {
      if (!this.isPlaying) return;

      // Screen Shake Evaluation
      if (this._shakeTimer > 0) {
        this._shakeTimer -= dt;
        const cam = app.root.find(node => node.camera);
        if (cam) {
          const offsetX = (Math.random() - 0.5) * this._shakeIntensity;
          const offsetY = (Math.random() - 0.5) * this._shakeIntensity;
          cam.translateLocal(offsetX, offsetY, 0);
        }
      }

      for (const [entity, behaviors] of this.activeBehaviors.entries()) {
        if (!entity || !entity.enabled || !entity.parent) continue;

        for (const b of behaviors) {
          if (b.type === 'wasd') {
            const speed = b.params.speed || 8;
            const move = new pc.Vec3();

            // Calculate planar forward and right directions
            const forward = new pc.Vec3(entity.forward.x, 0, entity.forward.z);
            if (forward.lengthSq() > 0.0001) forward.normalize();
            else forward.set(0, 0, -1);

            const right = new pc.Vec3(entity.right.x, 0, entity.right.z);
            if (right.lengthSq() > 0.0001) right.normalize();
            else right.set(1, 0, 0);

            if (this.isKeyDown('w') || this.isKeyDown('arrowup') || this.isKeyDown('keyw')) {
              move.add(forward);
            }
            if (this.isKeyDown('s') || this.isKeyDown('arrowdown') || this.isKeyDown('keys')) {
              move.sub(forward);
            }
            if (this.isKeyDown('a') || this.isKeyDown('arrowleft') || this.isKeyDown('keya')) {
              move.sub(right);
            }
            if (this.isKeyDown('d') || this.isKeyDown('arrowright') || this.isKeyDown('keyd')) {
              move.add(right);
            }

            const isMoving = move.lengthSq() > 0.0001;
            if (isMoving) {
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
            this.updateLocomotion(entity, speed, isMoving, dt);
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
            this.updateLocomotion(entity, speed, true, dt);
          } else if (b.type === 'moving_platform') {
            const speed = b.params.speed || 2.5;
            const distance = b.params.distance || 8;
            const axis = b.params.axis || 'y';
            if (!b.state) b.state = { startPos: entity.getPosition().clone(), dir: 1 };
            const curPos = entity.getPosition();
            if (axis === 'y') {
              const d = curPos.y - b.state.startPos.y;
              if (d > distance && b.state.dir > 0) b.state.dir = -1;
              if (d < 0 && b.state.dir < 0) b.state.dir = 1;
              entity.translate(0, b.state.dir * speed * dt, 0);
            } else if (axis === 'z') {
              const d = curPos.z - b.state.startPos.z;
              if (d > distance && b.state.dir > 0) b.state.dir = -1;
              if (d < -distance && b.state.dir < 0) b.state.dir = 1;
              entity.translate(0, 0, b.state.dir * speed * dt);
            } else {
              const d = curPos.x - b.state.startPos.x;
              if (d > distance && b.state.dir > 0) b.state.dir = -1;
              if (d < -distance && b.state.dir < 0) b.state.dir = 1;
              entity.translate(b.state.dir * speed * dt, 0, 0);
            }
          } else if (b.type === 'interactive_door') {
            const player = app.root.find(node => node.name.toLowerCase().includes('player') || node.name.toLowerCase().includes('character') || node.name.toLowerCase().includes('hero') || node.name.toLowerCase().includes('warrior'));
            if (player) {
              const entPos = entity.getPosition();
              const plyPos = player.getPosition();
              const distXZ = Math.hypot(entPos.x - plyPos.x, entPos.z - plyPos.z);
              const radius = b.params.radius || 3.0;

              if (!b.state) b.state = { isOpen: false, startY: entPos.y };
              if (distXZ <= radius && !b.state.isOpen) {
                b.state.isOpen = true;
                entity.translate(0, 3, 0);
                proceduralSFX.play('door');
                if (typeof showToast === 'function') showToast(`🚪 Interactive Door Opened for ${player.name}!`, 'info');
              } else if (distXZ > radius && b.state.isOpen) {
                b.state.isOpen = false;
                entity.setPosition(entPos.x, b.state.startY, entPos.z);
                if (typeof showToast === 'function') showToast(`🚪 Interactive Door Closed.`, 'info');
              }
            }
          } else if (b.type === 'enemy_spawner') {
            if (!b._timer) b._timer = 0;
            b._timer -= dt;
            if (b._timer <= 0) {
              b._timer = b.params.interval || 6.0;
              const enemy = new pc.Entity(`Spawned_Enemy_${Date.now()}`);
              enemy.setPosition(entity.getPosition().clone().add(new pc.Vec3(0, 1, 0)));
              enemy.setLocalScale(0.9, 1.8, 0.9);

              const mat = new pc.StandardMaterial();
              mat.diffuse = new pc.Color(0.9, 0.1, 0.1);
              mat.update();

              enemy.addComponent('render', { type: 'capsule', material: mat });
              this.attachBehavior(enemy, 'enemy_ai', { speed: 3, damage: 10 });
              app.root.addChild(enemy);
              if (typeof showToast === 'function') showToast(`👾 Enemy Spawner spawned new enemy AI!`, 'warn');
            }
          } else if (b.type === 'weapon_inventory') {
            if (b.params.ammo === undefined) b.params.ammo = b.params.maxAmmo || 30;
          } else if (b.type === 'billboard') {
            const camera = app.root.find(node => node.camera);
            if (camera) {
              entity.lookAt(camera.getPosition());
              entity.rotateLocal(0, 180, 0);
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
                proceduralSFX.play('coin');
                if (typeof showToast === 'function') showToast(`✨ Collected item: ${entity.name}!`, 'success');
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
                const playerBehaviors = this.getBehaviors(player);
                const healthB = playerBehaviors.find(hb => hb.type === 'health');
                if (healthB && (!healthB._invincibleTimer || healthB._invincibleTimer <= 0)) {
                  healthB._invincibleTimer = b.params.cooldown || 1.0;
                  this.applyDamage(player, dmg, entity.name);
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
                  if (typeof showToast === 'function') showToast(`💚 Restored +${heal} HP! Current HP: ${healthB.params.currentHp}`, 'success');
                }
              }
            }
          } else if (b.type === 'enemy_ai') {
            const player = app.root.find(node => node.name.toLowerCase().includes('player') || node.name.toLowerCase().includes('character') || node.name.toLowerCase().includes('hero') || node.name.toLowerCase().includes('warrior'));
            if (player) {
              const speed = b.params.speed || 3.5;
              const detectRadius = b.params.detectRadius || 15;
              const attackRadius = b.params.attackRadius || 1.8;
              const pos = entity.getPosition();
              const targetPos = player.getPosition();
              const dist = pos.distance(targetPos);

              if (dist <= detectRadius) {
                const lookPos = new pc.Vec3(targetPos.x, pos.y, targetPos.z);
                entity.lookAt(lookPos);

                if (dist > attackRadius) {
                  const dir = lookPos.sub(pos).normalize().mulScalar(speed * dt);
                  entity.translate(dir);
                  this.updateLocomotion(entity, speed, true, dt);
                } else {
                  this.updateLocomotion(entity, speed, false, dt);
                  if (!b._attackTimer) b._attackTimer = 0;
                  b._attackTimer -= dt;
                  if (b._attackTimer <= 0) {
                    b._attackTimer = b.params.attackRate || 1.0;
                    const dmg = b.params.damage || 15;
                    this.applyDamage(player, dmg, `Enemy ${entity.name}`);
                    this.triggerScreenShake(0.4, 0.2);
                  }
                }
              } else {
                this.updateLocomotion(entity, speed, false, dt);
              }
            }
          } else if (b.type === 'projectile_shooter') {
            if (!b._cooldown) b._cooldown = 0;
            if (b._cooldown > 0) b._cooldown -= dt;

            const isTriggered = this.isKeyDown('f') || this.isKeyDown('keyf') || this.isKeyDown('e') || this.isKeyDown('space');
            if (isTriggered && b._cooldown <= 0) {
              proceduralSFX.play('laser');
              // Deduct ammo if weapon inventory is attached
              const playerBehaviors = this.getBehaviors(entity);
              const inv = playerBehaviors.find(wb => wb.type === 'weapon_inventory');
              if (inv && inv.params && typeof inv.params.ammo === 'number') {
                if (inv.params.ammo <= 0) return;
                inv.params.ammo--;
              }

              b._cooldown = b.params.cooldown || 0.3;

              const bullet = new pc.Entity(`Bullet_${Date.now()}`);
              bullet.setPosition(entity.getPosition().clone().add(entity.forward.clone().mulScalar(1.2)));
              bullet.setEulerAngles(entity.getEulerAngles());
              bullet.setLocalScale(0.2, 0.2, 0.4);

              const mat = new pc.StandardMaterial();
              mat.diffuse = new pc.Color(1, 0.2, 0);
              mat.emissive = new pc.Color(1, 0.5, 0);
              mat.update();

              bullet.addComponent('render', { type: 'sphere', material: mat });
              app.root.addChild(bullet);

              const bulletSpeed = b.params.speed || 30;
              let lifetime = b.params.lifetime || 2.0;

              const updateBullet = (bdt) => {
                lifetime -= bdt;
                if (lifetime <= 0 || !bullet.parent) {
                  app.off('update', updateBullet);
                  if (bullet.parent) bullet.destroy();
                  return;
                }

                bullet.translateLocal(0, 0, -bulletSpeed * bdt);

                app.root.forEach(other => {
                  if (other !== bullet && other !== entity && other.enabled && other.parent) {
                    if (other.name.toLowerCase().includes('enemy') || other.name.toLowerCase().includes('monster') || other.name.toLowerCase().includes('target') || other.name.toLowerCase().includes('dummy')) {
                      const d = bullet.getPosition().distance(other.getPosition());
                      if (d < 1.5) {
                        const otherBehaviors = this.getBehaviors(other);
                        const targetB = otherBehaviors.find(tb => tb.type === 'target_health');
                        if (targetB) {
                          targetB.params.currentHp = Math.max(0, (targetB.params.currentHp || targetB.params.maxHp || 100) - (b.params.damage || 35));
                          if (targetB.params.currentHp <= 0) {
                            other.enabled = false;
                            this.triggerScreenShake(0.5, 0.25);
                            proceduralSFX.play('explosion');
                            if (typeof showToast === 'function') showToast(`💥 Defeated target ${other.name}!`, 'success');
                          } else {
                            this.triggerScreenShake(0.2, 0.1);
                            proceduralSFX.play('hurt');
                            if (typeof showToast === 'function') showToast(`🎯 Hit ${other.name}! HP: ${targetB.params.currentHp}`, 'info');
                          }
                        } else {
                          other.enabled = false;
                          this.triggerScreenShake(0.3, 0.15);
                          proceduralSFX.play('explosion');
                          if (typeof showToast === 'function') showToast(`💥 Bullet hit ${other.name}!`, 'success');
                        }
                        lifetime = 0;
                      }
                    }
                  }
                });
              };
              app.on('update', updateBullet);
            }
          } else if (b.type === 'first_person_controller') {
            const speed = b.params.speed || 10;
            const rotSpeed = b.params.rotSpeed || 90;
            const move = new pc.Vec3();

            const forward = new pc.Vec3(entity.forward.x, 0, entity.forward.z);
            if (forward.lengthSq() > 0.0001) forward.normalize();
            const right = new pc.Vec3(entity.right.x, 0, entity.right.z);
            if (right.lengthSq() > 0.0001) right.normalize();

            if (this.isKeyDown('w') || this.isKeyDown('arrowup')) move.add(forward);
            if (this.isKeyDown('s') || this.isKeyDown('arrowdown')) move.sub(forward);
            if (this.isKeyDown('a')) move.sub(right);
            if (this.isKeyDown('d')) move.add(right);

            if (this.isKeyDown('q') || this.isKeyDown('arrowleft')) entity.rotate(0, rotSpeed * dt, 0);
            if (this.isKeyDown('e') || this.isKeyDown('arrowright')) entity.rotate(0, -rotSpeed * dt, 0);

            const isMoving = move.lengthSq() > 0.0001;
            if (isMoving) {
              move.normalize().mulScalar(speed * dt);
              entity.translate(move);
              this.editor.events.emit('entity:transformed', entity);
            }
            this.updateLocomotion(entity, speed, isMoving, dt);

            // Lock main camera to entity head
            const camera = app.root.find(node => node.camera);
            if (camera) {
              camera.setPosition(entity.getPosition().clone().add(new pc.Vec3(0, 1.6, 0)));
              camera.setEulerAngles(entity.getEulerAngles());
            }
          } else if (b.type === 'target_health') {
            if (b.params.currentHp === undefined) b.params.currentHp = b.params.maxHp || 100;
            if (b.params.currentHp <= 0 && entity.enabled) {
              entity.enabled = false;
              proceduralSFX.play('explosion');
              this.triggerScreenShake(0.5, 0.25);
              if (typeof showToast === 'function') showToast(`💥 Defeated target ${entity.name}! +${b.params.scoreValue || 100} PTS`, 'success');
            }
          } else if (b.type === 'key_pickup') {
            const player = app.root.find(node => node.name.toLowerCase().includes('player') || node.name.toLowerCase().includes('character') || node.name.toLowerCase().includes('hero') || node.name.toLowerCase().includes('warrior'));
            if (player) {
              const dist = entity.getPosition().distance(player.getPosition());
              const radius = b.params.radius || 1.8;
              if (dist < radius) {
                entity.enabled = false;
                if (!player._collectedKeys) player._collectedKeys = new Set();
                const keyName = b.params.keyName || 'Gold Key';
                player._collectedKeys.add(keyName);
                proceduralSFX.play('coin');
                if (typeof showToast === 'function') showToast(`🔑 Picked up key: "${keyName}"!`, 'success');
              }
            }
          } else if (b.type === 'locked_door') {
            const player = app.root.find(node => node.name.toLowerCase().includes('player') || node.name.toLowerCase().includes('character') || node.name.toLowerCase().includes('hero') || node.name.toLowerCase().includes('warrior'));
            if (player) {
              const entPos = entity.getPosition();
              const plyPos = player.getPosition();
              const distXZ = Math.hypot(entPos.x - plyPos.x, entPos.z - plyPos.z);
              const radius = b.params.radius || 3.5;
              const reqKey = b.params.requiredKey || 'Gold Key';

              if (!b.state) b.state = { isOpen: false, startY: entPos.y };
              const hasKey = Boolean(player._collectedKeys && player._collectedKeys.has(reqKey));

              if (distXZ <= radius && !b.state.isOpen) {
                if (hasKey) {
                  b.state.isOpen = true;
                  entity.translate(0, 3.5, 0);
                  proceduralSFX.play('door');
                  if (typeof showToast === 'function') showToast(`🔓 Unlocked door using "${reqKey}"!`, 'success');
                } else {
                  if (!b._lockNoticeTimer || b._lockNoticeTimer <= 0) {
                    b._lockNoticeTimer = 2.0;
                    if (typeof showToast === 'function') showToast(`🔒 Door Locked! Requires "${reqKey}".`, 'warn');
                  }
                }
              } else if (distXZ > radius && b.state.isOpen) {
                b.state.isOpen = false;
                entity.setPosition(entPos.x, b.state.startY, entPos.z);
              }

              if (b._lockNoticeTimer > 0) b._lockNoticeTimer -= dt;
            }
          } else if (b.type === 'jetpack') {
            if (b.params.fuel === undefined) b.params.fuel = b.params.maxFuel || 100;
            const thrustKey = this.isKeyDown('shift') || this.isKeyDown('space') || this.isKeyDown(' ');
            if (thrustKey && b.params.fuel > 0) {
              b.params.fuel = Math.max(0, b.params.fuel - dt * 35);
              const thrust = b.params.thrust || 12;
              if (entity.rigidbody) {
                entity.rigidbody.applyImpulse(0, thrust * dt, 0);
              } else {
                entity.translate(0, thrust * dt * 0.5, 0);
              }
              proceduralSFX.play('boost', 0.2);
            } else {
              b.params.fuel = Math.min(b.params.maxFuel || 100, b.params.fuel + dt * 20);
            }
          } else if (b.type === 'level_portal') {
            const player = app.root.find(node => node.name.toLowerCase().includes('player') || node.name.toLowerCase().includes('character') || node.name.toLowerCase().includes('hero') || node.name.toLowerCase().includes('warrior'));
            if (player) {
              const dist = entity.getPosition().distance(player.getPosition());
              const radius = b.params.radius || 2.0;
              if (dist < radius) {
                const targetScene = b.params.targetScene || 'Level_2';
                proceduralSFX.play('victory');
                if (typeof showToast === 'function') showToast(`🌀 Portal Activated! Switching to scene "${targetScene}"...`, 'success');
                if (this.editor && this.editor.scenes && this.editor.scenes.has(targetScene)) {
                  this.editor.switchScene(targetScene);
                }
              }
            }
          } else if (b.type === 'audio_trigger') {
            const player = app.root.find(node => node.name.toLowerCase().includes('player') || node.name.toLowerCase().includes('character') || node.name.toLowerCase().includes('hero') || node.name.toLowerCase().includes('warrior'));
            if (player) {
              const dist = entity.getPosition().distance(player.getPosition());
              const radius = b.params.radius || 3.0;
              if (!b.state) b.state = { triggered: false };
              if (dist < radius && !b.state.triggered) {
                b.state.triggered = true;
                const sfxType = b.params.sfxType || 'coin';
                proceduralSFX.play(sfxType);
                if (typeof showToast === 'function') showToast(`🔊 Audio Trigger sound played: ${sfxType}`, 'info');
              } else if (dist >= radius && b.state.triggered) {
                b.state.triggered = false;
              }
            }
          } else if (b.type === 'postfx_trigger') {
            const player = app.root.find(node => node.name.toLowerCase().includes('player') || node.name.toLowerCase().includes('character') || node.name.toLowerCase().includes('hero') || node.name.toLowerCase().includes('warrior'));
            if (player) {
              const dist = entity.getPosition().distance(player.getPosition());
              const radius = b.params.radius || 4.0;
              if (!b.state) b.state = { active: false };
              if (dist < radius && !b.state.active) {
                b.state.active = true;
                if (this.editor.runtime) {
                  this.editor.runtime.setAtmosphere(b.params.atmosphere || 'cyberpunk');
                }
                if (typeof showToast === 'function') showToast(`✨ PostFX Trigger activated: ${b.params.atmosphere || 'cyberpunk'} atmosphere`, 'info');
              } else if (dist >= radius && b.state.active) {
                b.state.active = false;
              }
            }
          } else if (b.type === 'mouse_look') {
            const rotSpeed = b.params.speed || 90;
            if (this.isKeyDown('arrowleft') || this.isKeyDown('q')) entity.rotate(0, rotSpeed * dt, 0);
            if (this.isKeyDown('arrowright') || this.isKeyDown('e')) entity.rotate(0, -rotSpeed * dt, 0);
          } else if (b.type === 'lava_hazard') {
            const player = app.root.find(node => node.name.toLowerCase().includes('player') || node.name.toLowerCase().includes('character') || node.name.toLowerCase().includes('hero') || node.name.toLowerCase().includes('warrior'));
            if (player) {
              const dist = entity.getPosition().distance(player.getPosition());
              const radius = b.params.radius || 2.5;
              const dmg = b.params.damage || 100;
              if (dist < radius) {
                const playerBehaviors = this.getBehaviors(player);
                const healthB = playerBehaviors.find(hb => hb.type === 'health');
                if (healthB && (!healthB._invincibleTimer || healthB._invincibleTimer <= 0)) {
                  healthB._invincibleTimer = 1.0;
                  this.triggerScreenShake(0.6, 0.3);
                  proceduralSFX.play('explosion');
                  this.applyDamage(player, dmg, 'Lava Hazard');
                }
              }
            }
          } else if (b.type === 'coin_bounce') {
            const speed = b.params.speed || 90;
            const amp = b.params.amplitude || 0.3;
            if (!b.state) b.state = { startY: entity.getPosition().y, time: 0 };
            b.state.time += dt * 3.0;
            entity.rotate(0, speed * dt, 0);
            const pos = entity.getPosition();
            entity.setPosition(pos.x, b.state.startY + Math.sin(b.state.time) * amp, pos.z);
          } else if (b.type === 'light_color_cycle') {
            if (entity.light) {
              const speed = b.params.speed || 1.0;
              if (!b.state) b.state = { time: 0 };
              b.state.time += dt * speed;
              const r = (Math.sin(b.state.time) + 1) / 2;
              const g = (Math.sin(b.state.time + 2.094) + 1) / 2;
              const bColor = (Math.sin(b.state.time + 4.188) + 1) / 2;
              entity.light.color = new pc.Color(r, g, bColor);
            }
          } else if (b.type === 'waypoint_patrol') {
            let waypoints = b.params.waypoints || [[-5, 0, 0], [5, 0, 0], [0, 0, 5]];
            if (typeof waypoints === 'string') {
              try { waypoints = JSON.parse(waypoints); } catch (e) { waypoints = [[-5, 0, 0], [5, 0, 0], [0, 0, 5]]; }
            }
            if (!Array.isArray(waypoints) || waypoints.length === 0) waypoints = [[-5, 0, 0], [5, 0, 0], [0, 0, 5]];
            const speed = b.params.speed || 4.0;
            if (!b.state) b.state = { index: 0 };
            const targetCoord = waypoints[b.state.index % waypoints.length];
            if (targetCoord && targetCoord.length >= 3) {
              const targetVec = new pc.Vec3(targetCoord[0], targetCoord[1], targetCoord[2]);
              const curPos = entity.getPosition();
              const dist = curPos.distance(targetVec);

              if (dist < 0.5) {
                b.state.index++;
                this.updateLocomotion(entity, speed, false, dt);
              } else {
                const dir = targetVec.clone().sub(curPos).normalize().scale(speed * dt);
                entity.translate(dir);
                this.updateLocomotion(entity, speed, true, dt);
              }
            }
          } else if (b.type === 'dash_boost') {
            if (!b._cooldown) b._cooldown = 0;
            if (b._cooldown > 0) b._cooldown -= dt;
            const boostKey = this.isKeyDown('shift') || this.isKeyDown('lshift');
            if (boostKey && b._cooldown <= 0) {
              b._cooldown = b.params.cooldown || 1.2;
              const force = b.params.force || 25;
              const forwardDir = new pc.Vec3(entity.forward.x, 0, entity.forward.z);
              if (forwardDir.lengthSq() > 0.0001) forwardDir.normalize();
              else forwardDir.set(0, 0, -1);
              if (entity.rigidbody) {
                entity.rigidbody.applyImpulse(forwardDir.x * force, 0, forwardDir.z * force);
              } else {
                entity.translate(forwardDir.x * (force * 0.15), 0, forwardDir.z * (force * 0.15));
              }
              proceduralSFX.play('boost', 0.25);
              if (typeof showToast === 'function') showToast(`💨 Dash Boost Thruster!`, 'info');
            }
          } else if (b.type === 'health_regen') {
            if (!b._regenTimer) b._regenTimer = 0;
            b._regenTimer -= dt;
            if (b._regenTimer <= 0) {
              b._regenTimer = b.params.interval || 2.0;
              const playerBehaviors = this.getBehaviors(entity);
              const healthB = playerBehaviors.find(hb => hb.type === 'health' || hb.type === 'target_health');
              if (healthB) {
                const maxHp = healthB.params.maxHp || 100;
                const regenAmount = b.params.amount || 5;
                if ((healthB.params.currentHp || maxHp) < maxHp) {
                  healthB.params.currentHp = Math.min(maxHp, (healthB.params.currentHp || maxHp) + regenAmount);
                  if (typeof showToast === 'function') showToast(`💚 Regenerated +${regenAmount} HP (${healthB.params.currentHp}/${maxHp})`, 'success');
                }
              }
            }
          } else if (b.type === 'day_night_cycle') {
            const speed = b.params.speed || 0.1;
            entity.rotate(speed * dt * 15, 0, 0);
          } else if (b.type === 'spotlight_flicker') {
            if (entity.light && entity.light.type === 'spot') {
              const baseAngle = b.params.baseOuterAngle || 45;
              const variance = b.params.variance || 8;
              entity.light.outerConeAngle = Math.max(10, baseAngle + (Math.random() - 0.5) * variance);
            }
          } else if (b.type === 'target_lock_on') {
            const targetName = b.params.targetEntity;
            if (targetName) {
              const target = app.root.findByName(targetName) || app.root.find(e => e.name && e.name.toLowerCase().includes(targetName.toLowerCase()));
              if (target && target.enabled) {
                entity.lookAt(target.getPosition());
              }
            }
          } else if (b.type === 'turret_ai') {
            const player = app.root.find(node => node.name.toLowerCase().includes('player') || node.name.toLowerCase().includes('character') || node.name.toLowerCase().includes('hero') || node.name.toLowerCase().includes('warrior'));
            if (player) {
              const range = b.params.range || 20;
              const fireRate = b.params.fireRate || 1.5;
              const pos = entity.getPosition();
              const plyPos = player.getPosition();
              const dist = pos.distance(plyPos);
              if (dist <= range) {
                entity.lookAt(plyPos);
                if (!b._fireTimer) b._fireTimer = 0;
                b._fireTimer -= dt;
                if (b._fireTimer <= 0) {
                  b._fireTimer = fireRate;
                  proceduralSFX.play('laser');
                  const bullet = new pc.Entity(`TurretBullet_${Date.now()}`);
                  bullet.setPosition(pos.clone().add(entity.forward.clone().mulScalar(1.2)));
                  bullet.setEulerAngles(entity.getEulerAngles());
                  bullet.setLocalScale(0.2, 0.2, 0.4);
                  const mat = new pc.StandardMaterial();
                  mat.diffuse = new pc.Color(1, 0, 0.5);
                  mat.emissive = new pc.Color(1, 0, 0.5);
                  mat.update();
                  bullet.addComponent('render', { type: 'sphere', material: mat });
                  app.root.addChild(bullet);
                  let lifetime = 2.0;
                  const bulletSpeed = b.params.bulletSpeed || 25;
                  const updateTB = (bdt) => {
                    lifetime -= bdt;
                    if (lifetime <= 0 || !bullet.parent) {
                      app.off('update', updateTB);
                      if (bullet.parent) bullet.destroy();
                      return;
                    }
                    bullet.translateLocal(0, 0, -bulletSpeed * bdt);
                    if (player && player.enabled && bullet.getPosition().distance(player.getPosition()) < 1.5) {
                      this.applyDamage(player, b.params.damage || 15, `Turret ${entity.name}`);
                      this.triggerScreenShake(0.3, 0.15);
                      lifetime = 0;
                    }
                  };
                  app.on('update', updateTB);
                }
              }
            }
          } else if (b.type === 'pressure_plate') {
            const player = app.root.find(node => node.name.toLowerCase().includes('player') || node.name.toLowerCase().includes('character') || node.name.toLowerCase().includes('hero') || node.name.toLowerCase().includes('warrior'));
            if (player) {
              const dist = entity.getPosition().distance(player.getPosition());
              const radius = b.params.radius || 1.5;
              if (!b.state) b.state = { pressed: false };
              if (dist < radius && !b.state.pressed) {
                b.state.pressed = true;
                proceduralSFX.play('door');
                const targetName = b.params.targetEntity;
                if (targetName) {
                  const target = app.root.findByName(targetName) || app.root.find(e => e.name && e.name.toLowerCase().includes(targetName.toLowerCase()));
                  if (target) {
                    target.enabled = !target.enabled;
                    if (typeof showToast === 'function') showToast(`🔘 Pressure Plate toggled ${target.name}!`, 'success');
                  }
                } else if (typeof showToast === 'function') {
                  showToast(`🔘 Pressure Plate Stepped On!`, 'info');
                }
              } else if (dist >= radius && b.state.pressed) {
                b.state.pressed = false;
              }
            }
          } else if (b.type === 'teleport_gateway') {
            const player = app.root.find(node => node.name.toLowerCase().includes('player') || node.name.toLowerCase().includes('character') || node.name.toLowerCase().includes('hero') || node.name.toLowerCase().includes('warrior'));
            if (player) {
              if (!b._teleportCd) b._teleportCd = 0;
              if (b._teleportCd > 0) b._teleportCd -= dt;
              const dist = entity.getPosition().distance(player.getPosition());
              const radius = b.params.radius || 1.8;
              if (dist < radius && b._teleportCd <= 0) {
                b._teleportCd = b.params.cooldown || 2.0;
                const destName = b.params.destinationEntity;
                let destPos = new pc.Vec3(0, 2, 0);
                if (destName) {
                  const destEnt = app.root.findByName(destName) || app.root.find(e => e.name && e.name.toLowerCase().includes(destName.toLowerCase()));
                  if (destEnt) destPos = destEnt.getPosition().clone().add(new pc.Vec3(0, 1, 0));
                } else if (b.params.targetPosition) {
                  destPos = new pc.Vec3(...b.params.targetPosition);
                }
                if (player.rigidbody) {
                  player.rigidbody.teleport(destPos);
                } else {
                  player.setPosition(destPos);
                }
                proceduralSFX.play('victory');
                if (typeof showToast === 'function') showToast(`🌀 Teleported to Gateway Destination!`, 'success');
              }
            }
          } else if (b.type === 'water_volume') {
            const entPos = entity.getPosition();
            const extents = b.params.extents || [5, 3, 5];
            const halfX = extents[0] / 2;
            const halfY = extents[1] / 2;
            const halfZ = extents[2] / 2;
            app.root.forEach(other => {
              if (other !== entity && other.enabled && other.rigidbody && other.rigidbody.type === 'dynamic') {
                const oPos = other.getPosition();
                if (Math.abs(oPos.x - entPos.x) <= halfX && Math.abs(oPos.z - entPos.z) <= halfZ && oPos.y <= entPos.y + halfY) {
                  const buoyancy = b.params.buoyancyForce || 15;
                  other.rigidbody.applyForce(0, buoyancy * dt * 60, 0);
                }
              }
            });
          } else if (b.type === 'flashlight') {
            const toggleKey = this.isKeyDown('l') || this.isKeyDown('keyl');
            if (!b._keyWasDown) b._keyWasDown = false;
            if (toggleKey && !b._keyWasDown) {
              if (entity.light) {
                entity.light.enabled = !entity.light.enabled;
                proceduralSFX.play('coin');
                if (typeof showToast === 'function') showToast(`🔦 Flashlight Toggled (${entity.light.enabled ? 'ON' : 'OFF'})`, 'info');
              }
            }
            b._keyWasDown = toggleKey;
          } else if (b.type === 'overhead_healthbar') {
            const camera = app.root.find(node => node.camera);
            if (camera) {
              const ePos = entity.getPosition();
              const cPos = camera.getPosition();
              const targetLook = new pc.Vec3(cPos.x, ePos.y, cPos.z);
              entity.lookAt(targetLook);
              entity.rotateLocal(0, 180, 0);
            }
          } else if (b.type === 'ambient_audio') {
            if (!b.state) b.state = { playing: false };
            if (!b.state.playing) {
              b.state.playing = true;
              proceduralSFX.play('victory', b.params.volume || 0.3);
            }
          } else if (b.type === 'boss_ai') {
            if (b.params.currentHp === undefined) b.params.currentHp = b.params.maxHp || 500;
            const player = app.root.find(node => node.name.toLowerCase().includes('player') || node.name.toLowerCase().includes('character') || node.name.toLowerCase().includes('hero') || node.name.toLowerCase().includes('warrior'));
            if (player && b.params.currentHp > 0) {
              const pos = entity.getPosition();
              const plyPos = player.getPosition();
              const dist = pos.distance(plyPos);
              const isEnraged = (b.params.currentHp / (b.params.maxHp || 500)) <= (b.params.enrageThreshold || 0.5);

              entity.lookAt(new pc.Vec3(plyPos.x, pos.y, plyPos.z));

              // Boss advances toward player if outside melee range
              if (dist > 3.5 && dist <= 25) {
                const bSpeed = (b.params.speed || 3.0) * (isEnraged ? 1.5 : 1.0);
                entity.translateLocal(0, 0, -bSpeed * dt);
              }

              if (!b._attackTimer) b._attackTimer = 0;
              b._attackTimer -= dt;
              if (b._attackTimer <= 0 && dist <= 4.0) {
                b._attackTimer = isEnraged ? (b.params.attackRate || 2.0) * 0.5 : (b.params.attackRate || 2.0);
                proceduralSFX.play('explosion');
                this.triggerScreenShake(0.6, 0.3);
                const dmg = isEnraged ? (b.params.damage || 30) * 1.5 : (b.params.damage || 30);
                this.applyDamage(player, dmg, `Boss ${entity.name}${isEnraged ? ' (ENRAGED)' : ''}`);
              }
            } else if (b.params.currentHp <= 0 && entity.enabled) {
              entity.enabled = false;
              proceduralSFX.play('victory');
              if (typeof showToast === 'function') showToast(`🏆 BOSS DEFEATED! ${entity.name} fell in combat!`, 'success');
            }
          } else if (b.type === 'stealth_ai') {
            const player = app.root.find(node => node.name.toLowerCase().includes('player') || node.name.toLowerCase().includes('character') || node.name.toLowerCase().includes('hero') || node.name.toLowerCase().includes('warrior'));
            if (player) {
              const pos = entity.getPosition();
              const plyPos = player.getPosition();
              const dist = pos.distance(plyPos);
              const visionRadius = b.params.visionRadius || 12;

              if (dist <= visionRadius) {
                const toPlayer = plyPos.clone().sub(pos).normalize();
                const forward = entity.forward.clone().normalize();
                const angle = Math.acos(Math.max(-1, Math.min(1, forward.dot(toPlayer)))) * (180 / Math.PI);
                const visionAngle = b.params.visionAngle || 60;

                if (angle <= visionAngle / 2) {
                  entity.lookAt(new pc.Vec3(plyPos.x, pos.y, plyPos.z));
                  entity.translateLocal(0, 0, -(b.params.speed || 2.5) * dt);

                  if (!b._attackTimer) b._attackTimer = 0;
                  b._attackTimer -= dt;
                  if (dist < 1.8 && b._attackTimer <= 0) {
                    b._attackTimer = 1.0;
                    this.applyDamage(player, b.params.damage || 25, `Guard ${entity.name}`);
                  }
                }
              }
            }
          } else if (b.type === 'vehicle_controller') {
            const topSpeed = b.params.topSpeed || 25;
            const accel = b.params.accel || 15;
            const steerSpeed = b.params.steerSpeed || 60;

            if (!b.state) b.state = { speed: 0 };

            if (this.isKeyDown('w') || this.isKeyDown('arrowup')) {
              b.state.speed = Math.min(topSpeed, b.state.speed + accel * dt);
            } else if (this.isKeyDown('s') || this.isKeyDown('arrowdown')) {
              b.state.speed = Math.max(-topSpeed * 0.4, b.state.speed - accel * dt);
            } else {
              b.state.speed *= Math.pow(0.1, dt);
            }

            if (Math.abs(b.state.speed) > 0.1) {
              const dir = b.state.speed > 0 ? 1 : -1;
              if (this.isKeyDown('a') || this.isKeyDown('arrowleft')) entity.rotate(0, steerSpeed * dt * dir, 0);
              if (this.isKeyDown('d') || this.isKeyDown('arrowright')) entity.rotate(0, -steerSpeed * dt * dir, 0);
            }

            entity.translateLocal(0, 0, -b.state.speed * dt);

            const camera = app.root.find(node => node.camera);
            if (camera) {
              const camTarget = entity.getPosition().clone().sub(entity.forward.clone().mulScalar(8)).add(new pc.Vec3(0, 4, 0));
              const currentPos = camera.getPosition();
              camera.setPosition(currentPos.clone().lerp(currentPos, camTarget, Math.min(1, dt * 5)));
              camera.lookAt(entity.getPosition());
            }
          } else if (b.type === 'destruction_mesh') {
            if (b.params.health === undefined) b.params.health = b.params.maxHealth || 50;
            if (b.params.health <= 0 && entity.enabled) {
              entity.enabled = false;
              proceduralSFX.play('explosion');
              this.triggerScreenShake(0.5, 0.2);

              const debrisCount = b.params.debrisCount || 6;
              const pos = entity.getPosition();
              for (let i = 0; i < debrisCount; i++) {
                const chunk = new pc.Entity(`Debris_${i}`);
                const chunkOffset = new pc.Vec3((Math.random()-0.5)*1.5, Math.random()*1.5, (Math.random()-0.5)*1.5);
                chunk.setPosition(pos.clone().add(chunkOffset));
                chunk.setLocalScale(0.3, 0.3, 0.3);
                const mat = new pc.StandardMaterial();
                mat.diffuse = new pc.Color(0.8, 0.4, 0.1);
                mat.update();
                chunk.addComponent('render', { type: 'box', material: mat });
                app.root.addChild(chunk);
                setTimeout(() => {
                  try { chunk.destroy(); } catch (e) {}
                }, 3000);
              }
              if (typeof showToast === 'function') showToast(`💥 ${entity.name} shattered into debris!`, 'info');
            }
          } else if (b.type === 'cinematic_cutscene_trigger') {
            const player = app.root.find(node => node.name.toLowerCase().includes('player') || node.name.toLowerCase().includes('character') || node.name.toLowerCase().includes('hero') || node.name.toLowerCase().includes('warrior'));
            if (player) {
              const dist = entity.getPosition().distance(player.getPosition());
              const radius = b.params.radius || 2.5;
              if (!b.state) b.state = { played: false };
              if (dist < radius && !b.state.played) {
                b.state.played = true;
                this.triggerScreenShake(0.3, 0.3);
                proceduralSFX.play('victory');
                if (typeof showToast === 'function') showToast(`🎬 CUTSCENE: ${b.params.caption || 'A dark shadow falls upon the realm...'}`, 'info');
              }
            }
          } else if (b.type === 'combo_score_counter') {
            if (!b.state) b.state = { hits: 0, timer: 0 };
            if (b.state.timer > 0) {
              b.state.timer -= dt;
              if (b.state.timer <= 0) {
                b.state.hits = 0;
                b.state.timer = 0;
              }
            }
          } else if (b.type === 'checkpoint_system') {
            const player = app.root.find(node => node.name.toLowerCase().includes('player') || node.name.toLowerCase().includes('character') || node.name.toLowerCase().includes('hero') || node.name.toLowerCase().includes('warrior'));
            if (player) {
              const dist = entity.getPosition().distance(player.getPosition());
              const radius = b.params.radius || 2.0;
              if (dist < radius) {
                player._respawnCheckpoint = entity.getPosition().clone().add(new pc.Vec3(0, 1, 0));
                if (!b.state) b.state = { active: false };
                if (!b.state.active) {
                  b.state.active = true;
                  proceduralSFX.play('coin');
                  if (typeof showToast === 'function') showToast(`🚩 Checkpoint activated at ${entity.name}!`, 'success');
                }
              }
            }
          } else if (b.type === 'weather_emitter') {
            if (!b._weatherTimer) b._weatherTimer = 0;
            b._weatherTimer -= dt;
            if (b._weatherTimer <= 0) {
              b._weatherTimer = 0.08;
              const drop = new pc.Entity('WeatherParticle');
              const pos = entity.getPosition();
              const isSnow = (b.params.type || 'snow').toLowerCase() === 'snow';
              drop.setPosition(pos.x + (Math.random() - 0.5) * 30, pos.y + 12, pos.z + (Math.random() - 0.5) * 30);
              drop.setLocalScale(isSnow ? 0.12 : 0.04, isSnow ? 0.12 : 0.3, isSnow ? 0.12 : 0.04);
              const mat = new pc.StandardMaterial();
              mat.diffuse = isSnow ? new pc.Color(0.9, 0.95, 1.0) : new pc.Color(0.4, 0.6, 0.9);
              mat.opacity = 0.7;
              mat.blendType = pc.BLEND_NORMAL;
              mat.update();
              drop.addComponent('render', { type: isSnow ? 'sphere' : 'cylinder', material: mat });
              app.root.addChild(drop);

              let dropLife = 1.8;
              const dropSpeed = isSnow ? 3.5 : 16.0;
              const updateDrop = (ddt) => {
                dropLife -= ddt;
                drop.translate(0, -dropSpeed * ddt, 0);
                if (dropLife <= 0) {
                  app.off('update', updateDrop);
                  try { drop.destroy(); } catch (e) {}
                }
              };
              app.on('update', updateDrop);
            }
          } else if (b.type === 'shield_generator') {
            if (b.params.currentShield === undefined) b.params.currentShield = b.params.maxShield || 50;
            if (!b._rechargeTimer) b._rechargeTimer = 0;
            if (b._rechargeTimer > 0) {
              b._rechargeTimer -= dt;
            } else if (b.params.currentShield < (b.params.maxShield || 50)) {
              b.params.currentShield = Math.min(b.params.maxShield || 50, b.params.currentShield + (b.params.rechargeRate || 10) * dt);
            }
          } else if (b.type === 'sway_foliage') {
            const speed = b.params.speed || 2.5;
            const amplitude = b.params.amplitude || 5.0;
            if (!b._state) b._state = { time: 0, baseRot: entity.getEulerAngles().clone() };
            b._state.time += dt * speed;
            entity.setEulerAngles(b._state.baseRot.x + Math.sin(b._state.time) * amplitude, b._state.baseRot.y, b._state.baseRot.z + Math.cos(b._state.time * 0.8) * (amplitude * 0.5));
          } else if (b.type === 'spline_follower') {
            const speed = b.params.speed || 3.0;
            if (!b._state) b._state = { progress: 0 };
            b._state.progress += dt * speed * 0.1;
            entity.translateLocal(0, 0, -speed * dt);
          } else if (b.type === 'screen_shake_zone') {
            const player = this.findPlayerEntity();
            if (player) {
              const dist = entity.getPosition().distance(player.getPosition());
              const radius = b.params.radius || 5.0;
              if (dist < radius) {
                if (typeof window.triggerScreenShake === 'function') {
                  window.triggerScreenShake(b.params.intensity || 0.6, 0.1);
                }
              }
            }
          } else if (b.type === 'exploding_barrel') {
            const player = this.findPlayerEntity();
            if (player) {
              const dist = entity.getPosition().distance(player.getPosition());
              if (dist < 1.8 && entity.enabled) {
                entity.enabled = false;
                proceduralSFX.play('explosion');
                if (typeof window.triggerScreenShake === 'function') window.triggerScreenShake(0.8, 0.4);
                const playerB = this.getBehaviors(player) || [];
                const healthB = playerB.find(hb => hb.type === 'health');
                if (healthB) {
                  const dmg = b.params.blastDamage || 80;
                  healthB.params.currentHp = Math.max(0, (healthB.params.currentHp || 100) - dmg);
                }
              }
            }
          } else if (b.type === 'audio_reverb_zone') {
            const player = this.findPlayerEntity();
            if (player) {
              const dist = entity.getPosition().distance(player.getPosition());
              const radius = b.params.radius || 8.0;
              b._playerInZone = dist <= radius;
            }
          } else if (b.type === 'wall_run_controller') {
            if (this.isKeyDown('w') || this.isKeyDown('arrowup')) {
              if (!b._state) b._state = { wallRunning: false };
              entity.translateLocal(0, (b.params.climbRate || 0.5) * dt, -(b.params.speed || 10) * dt * 0.4);
              if (this.isKeyDown(' ') || this.isKeyDown('space')) {
                if (entity.rigidbody) entity.rigidbody.applyImpulse(0, b.params.jumpForce || 12, 0);
                else entity.translate(0, 2, 0);
                proceduralSFX.play('jump');
              }
            }
          } else if (b.type === 'grappling_hook') {
            const gKey = this.isKeyDown('g') || this.isKeyDown('keyg');
            if (gKey) {
              if (!b._state) b._state = { active: false, targetPos: null };
              if (!b._state.active) {
                b._state.active = true;
                const fwd = entity.forward.clone().normalize().mulScalar(b.params.range || 35);
                b._state.targetPos = entity.getPosition().clone().add(fwd);
                proceduralSFX.play('laser');
                if (typeof showToast === 'function') showToast(`🪝 Grappling Hook Latched! Pulling...`, 'info');
              }
              if (b._state.targetPos) {
                const curPos = entity.getPosition();
                const dir = b._state.targetPos.clone().sub(curPos);
                if (dir.lengthSq() > 0.5) {
                  dir.normalize().mulScalar((b.params.pullSpeed || 20) * dt);
                  if (entity.rigidbody) {
                    entity.rigidbody.teleport(curPos.clone().add(dir));
                    entity.rigidbody.linearVelocity = pc.Vec3.ZERO;
                  } else {
                    entity.translate(dir);
                  }
                }
              }
            } else {
              if (b._state) b._state.active = false;
            }
          } else if (b.type === 'grav_gun_physicshandler') {
            const grabKey = this.isKeyDown('e') || this.isKeyDown('keye');
            const launchKey = this.isKeyDown('f') || this.isKeyDown('keyf');
            if (!b._state) b._state = { heldEntity: null };

            if (grabKey && !b._state.heldEntity && !b._grabCooldown) {
              b._grabCooldown = 0.3;
              app.root.forEach(other => {
                if (other !== entity && other.rigidbody && other.enabled) {
                  if (entity.getPosition().distance(other.getPosition()) < (b.params.range || 12)) {
                    b._state.heldEntity = other;
                    proceduralSFX.play('boost');
                    if (typeof showToast === 'function') showToast(`🧲 Gravity Gun grabbed ${other.name}!`, 'info');
                  }
                }
              });
            } else if (grabKey && b._state.heldEntity && !b._grabCooldown) {
              b._grabCooldown = 0.3;
              if (typeof showToast === 'function') showToast(`🧲 Gravity Gun released ${b._state.heldEntity.name}.`, 'info');
              b._state.heldEntity = null;
            }
            if (b._grabCooldown > 0) b._grabCooldown -= dt;

            if (b._state.heldEntity) {
              const holdPos = entity.getPosition().clone().add(entity.forward.clone().mulScalar(3.0)).add(new pc.Vec3(0, 0.5, 0));
              if (b._state.heldEntity.rigidbody) {
                b._state.heldEntity.rigidbody.teleport(holdPos);
                b._state.heldEntity.rigidbody.linearVelocity = pc.Vec3.ZERO;
              } else {
                b._state.heldEntity.setPosition(holdPos);
              }

              if (launchKey) {
                const launchVec = entity.forward.clone().normalize().mulScalar(b.params.launchForce || 30);
                if (b._state.heldEntity.rigidbody) {
                  b._state.heldEntity.rigidbody.applyImpulse(launchVec.x, launchVec.y, launchVec.z);
                }
                proceduralSFX.play('explosion');
                this.triggerScreenShake(0.4, 0.2);
                if (typeof showToast === 'function') showToast(`🚀 Launched ${b._state.heldEntity.name}!`, 'success');
                b._state.heldEntity = null;
              }
            }
          } else if (b.type === 'inventory_crafting') {
            if (!b._state) b._state = { items: ['Wood', 'Iron Ore'], recipes: [{ req: ['Wood', 'Iron Ore'], result: 'Iron Sword' }] };
            const craftKey = this.isKeyDown('c') || this.isKeyDown('keyc');
            if (craftKey && !b._keyCd) {
              b._keyCd = true;
              proceduralSFX.play('coin');
              if (typeof showToast === 'function') showToast(`🎒 Crafting: Synthesized Iron Sword from materials!`, 'success');
            }
            if (!craftKey) b._keyCd = false;
          } else if (b.type === 'dialogue_system') {
            const player = app.root.find(node => node.name.toLowerCase().includes('player') || node.name.toLowerCase().includes('character') || node.name.toLowerCase().includes('hero') || node.name.toLowerCase().includes('warrior'));
            if (player) {
              const dist = entity.getPosition().distance(player.getPosition());
              const radius = b.params.radius || 3.0;
              if (!b._state) b._state = { active: false };
              if (dist <= radius && !b._state.active) {
                b._state.active = true;
                proceduralSFX.play('door');
                if (typeof showToast === 'function') showToast(`💬 [${b.params.npcName || 'NPC'}]: "${b.params.text || 'Greetings!'}"`, 'info');
              } else if (dist > radius && b._state.active) {
                b._state.active = false;
              }
            }
          } else if (b.type === 'quest_tracker') {
            if (b.params.currentCount === undefined) b.params.currentCount = 0;
            if (!b._state) b._state = { completed: false };
            if (b.params.currentCount >= (b.params.requiredCount || 1) && !b._state.completed) {
              b._state.completed = true;
              proceduralSFX.play('victory');
              if (typeof showToast === 'function') showToast(`📜 QUEST COMPLETE: ${b.params.questTitle || 'Objective Achieved'}!`, 'success');
            }
          } else if (b.type === 'minimap_radar') {
            if (!b._state) b._state = { blips: [] };
          } else if (b.type === 'cover_system') {
            const inCoverKey = this.isKeyDown('c') || this.isKeyDown('shift');
            b._inCover = Boolean(inCoverKey);
          } else if (b.type === 'ragdoll_physics') {
            // Evaluated upon defeat
          } else if (b.type === 'third_person_controller') {
            const speed = b.params.speed || 8;
            const rotSpeed = b.params.rotSpeed || 90;
            const camDist = b.params.cameraDistance || 6;
            const camHeight = b.params.cameraHeight || 2.5;

            const move = new pc.Vec3();
            const forward = new pc.Vec3(entity.forward.x, 0, entity.forward.z);
            if (forward.lengthSq() > 0.0001) forward.normalize();
            const right = new pc.Vec3(entity.right.x, 0, entity.right.z);
            if (right.lengthSq() > 0.0001) right.normalize();

            let speedMult = 1.0;
            const staminaB = this.getBehaviors(entity).find(sb => sb.type === 'stamina_system');
            if (staminaB && staminaB._isSprinting) {
              speedMult = 1.6;
            }

            if (this.isKeyDown('w') || this.isKeyDown('arrowup')) move.add(forward);
            if (this.isKeyDown('s') || this.isKeyDown('arrowdown')) move.sub(forward);

            if (this.isKeyDown('a') || this.isKeyDown('arrowleft')) entity.rotate(0, rotSpeed * dt, 0);
            if (this.isKeyDown('d') || this.isKeyDown('arrowright')) entity.rotate(0, -rotSpeed * dt, 0);

            const isMoving = move.lengthSq() > 0.0001;
            if (isMoving) {
              move.normalize().mulScalar(speed * speedMult * dt);
              entity.translate(move);
              this.editor.events.emit('entity:transformed', entity);
            }
            this.updateLocomotion(entity, speed * speedMult, isMoving, dt);

            const camera = app.root.find(node => node.camera);
            if (camera) {
              const targetCamPos = entity.getPosition().clone().sub(entity.forward.clone().mulScalar(camDist)).add(new pc.Vec3(0, camHeight, 0));
              const curCamPos = camera.getPosition();
              curCamPos.lerp(curCamPos, targetCamPos, Math.min(1.0, dt * 6.0));
              camera.setPosition(curCamPos);
              camera.lookAt(entity.getPosition().clone().add(new pc.Vec3(0, 1.2, 0)));
            }
          } else if (b.type === 'stamina_system') {
            if (b.params.currentStamina === undefined) b.params.currentStamina = b.params.maxStamina || 100;
            const maxStamina = b.params.maxStamina || 100;
            const shiftKey = this.isKeyDown('shift') || this.isKeyDown('lshift');
            const isMoving = Boolean(this.isKeyDown('w') || this.isKeyDown('s') || this.isKeyDown('a') || this.isKeyDown('d') || this.isKeyDown('arrowup') || this.isKeyDown('arrowdown'));

            if (shiftKey && isMoving && b.params.currentStamina > 0) {
              b._isSprinting = true;
              b.params.currentStamina = Math.max(0, b.params.currentStamina - (b.params.drainRate || 25) * dt);
            } else {
              b._isSprinting = false;
              b.params.currentStamina = Math.min(maxStamina, b.params.currentStamina + (b.params.rechargeRate || 15) * dt);
            }

            const fill = typeof document !== 'undefined' ? document.getElementById('hud-stamina-fill') : null;
            if (fill) fill.style.width = Math.max(0, Math.min(100, (b.params.currentStamina / maxStamina) * 100)) + '%';
          } else if (b.type === 'damage_flash') {
            if (b._flashTimer && b._flashTimer > 0) {
              b._flashTimer -= dt;
              if (b._flashTimer <= 0 && entity.render && entity.render.material) {
                if (b._origEmissive) entity.render.material.emissive = b._origEmissive;
                else entity.render.material.emissive = new pc.Color(0, 0, 0);
                entity.render.material.update();
              }
            }
          } else if (b.type === 'climbable_ladder') {
            const player = app.root.find(node => node.name.toLowerCase().includes('player') || node.name.toLowerCase().includes('character') || node.name.toLowerCase().includes('hero') || node.name.toLowerCase().includes('warrior'));
            if (player) {
              const dist = entity.getPosition().distance(player.getPosition());
              const radius = b.params.radius || 1.8;
              if (dist <= radius) {
                const climbSpeed = b.params.climbSpeed || 5.0;
                if (this.isKeyDown('w') || this.isKeyDown('arrowup')) {
                  player.translate(0, climbSpeed * dt, 0);
                  if (player.rigidbody) player.rigidbody.linearVelocity = pc.Vec3.ZERO;
                } else if (this.isKeyDown('s') || this.isKeyDown('arrowdown')) {
                  player.translate(0, -climbSpeed * dt, 0);
                  if (player.rigidbody) player.rigidbody.linearVelocity = pc.Vec3.ZERO;
                }
              }
            }
          } else if (b.type === 'slow_motion_zone') {
            const player = app.root.find(node => node.name.toLowerCase().includes('player') || node.name.toLowerCase().includes('character') || node.name.toLowerCase().includes('hero') || node.name.toLowerCase().includes('warrior'));
            if (player) {
              const dist = entity.getPosition().distance(player.getPosition());
              const radius = b.params.radius || 6.0;
              if (dist <= radius) {
                dt = dt * (b.params.timeScale !== undefined ? b.params.timeScale : 0.3);
              }
            }
          } else if (b.type === 'day_night_weather_cycle') {
            const speed = b.params.cycleSpeed || 0.05;
            entity.rotate(speed * dt * 20, 0, 0);
          } else if (b.type === 'gravity_well_attractor') {
            const radius = b.params.radius || 10.0;
            const force = b.params.force || 15.0;
            const isAttract = (b.params.mode || 'attract') === 'attract';
            const pos = entity.getPosition();

            app.root.forEach(other => {
              if (other !== entity && other.enabled && other.parent) {
                const dist = pos.distance(other.getPosition());
                if (dist <= radius && dist > 0.1) {
                  const dir = isAttract ? pos.clone().sub(other.getPosition()).normalize() : other.getPosition().clone().sub(pos).normalize();
                  if (other.rigidbody) {
                    other.rigidbody.applyForce(dir.x * force * dt * 60, dir.y * force * dt * 60, dir.z * force * dt * 60);
                  } else if (other.translate) {
                    other.translate(dir.x * force * dt * 0.1, dir.y * force * dt * 0.1, dir.z * force * dt * 0.1);
                  }
                }
              }
            });
          } else if (b.type === 'flashlight_battery') {
            if (b.params.battery === undefined) b.params.battery = b.params.maxBattery || 100;
            if (entity.light && entity.light.enabled) {
              b.params.battery = Math.max(0, b.params.battery - (b.params.drainRate || 5.0) * dt);
              if (b.params.battery <= 0) {
                entity.light.enabled = false;
                if (typeof showToast === 'function') showToast(`🔋 Flashlight battery depleted! Find a battery refill pickup.`, 'warn');
              }
            }
          } else if (b.type === 'waypoint_flight_path') {
            const speed = b.params.speed || 8.0;
            const bank = b.params.bankAngle || 25;
            if (!b.state) b.state = { angle: 0 };
            b.state.angle += dt * (speed * 0.1);
            const bankRot = Math.sin(b.state.angle) * bank;
            entity.rotate(0, speed * dt * 10, bankRot * dt);
            entity.translateLocal(0, Math.sin(b.state.angle * 2) * 0.5 * dt, -speed * dt);
          } else if (b.type === 'weather_rain_snow_toggle') {
            if (!b.state) b.state = { active: true };
          } else if (b.type === 'destructible_wall_cluster') {
            if (!b.state) b.state = { initialized: true };
          } else if (b.type === 'inventory_drop_spawner') {
            if (!b.state) b.state = { dropped: false };
          } else if (b.type === 'audio_occlusion_zone') {
            const player = app.root.find(node => node.name.toLowerCase().includes('player') || node.name.toLowerCase().includes('character') || node.name.toLowerCase().includes('hero') || node.name.toLowerCase().includes('warrior'));
            if (player) {
              const dist = entity.getPosition().distance(player.getPosition());
              const radius = b.params.radius || 6.0;
              b._playerInZone = dist <= radius;
              b._occlusionFactor = b._playerInZone ? (b.params.muffling || 0.8) : 0.0;
            }
          } else if (b.type === 'footstep_audio') {
            if (!b._stepTimer) b._stepTimer = 0;
            const isMoving = Boolean(this.isKeyDown('w') || this.isKeyDown('s') || this.isKeyDown('a') || this.isKeyDown('d') || this.isKeyDown('arrowup') || this.isKeyDown('arrowdown'));
            if (isMoving) {
              b._stepTimer -= dt;
              if (b._stepTimer <= 0) {
                b._stepTimer = b.params.interval || 0.35;
                proceduralSFX.play(b.params.sfxType || 'footstep', 0.25);
              }
            }
          } else if (b.type === 'floating_nametag') {
            const camera = app.root.find(node => node.camera);
            if (camera) {
              const offset = b.params.heightOffset !== undefined ? b.params.heightOffset : 2.2;
              const pos = entity.getPosition().clone().add(new pc.Vec3(0, offset, 0));
              b._nametagPos = pos;
            }
          } else if (b.type === 'respawn_kill_plane') {
            const minY = b.params.minY !== undefined ? b.params.minY : -20;
            if (entity.getPosition().y < minY) {
              proceduralSFX.play('explosion');
              this.triggerScreenShake(0.6, 0.3);
              const respawnPos = entity._respawnCheckpoint || new pc.Vec3(0, 2, 0);
              if (entity.rigidbody) {
                entity.rigidbody.teleport(respawnPos);
                entity.rigidbody.linearVelocity = pc.Vec3.ZERO;
              } else {
                entity.setPosition(respawnPos);
              }
              const healthB = this.getBehaviors(entity).find(hb => hb.type === 'health');
              if (healthB) {
                healthB.params.currentHp = healthB.params.maxHp || 100;
              }
              if (typeof showToast === 'function') showToast(`⚠️ Fell Out of Bounds! Respawned at origin.`, 'warn');
            }
          } else if (b.type === 'item_magnet') {
            const magnetPos = entity.getPosition();
            const radius = b.params.pullRadius || 8.0;
            const speed = b.params.pullSpeed || 12.0;

            app.root.forEach(other => {
              if (other !== entity && other.enabled && other.parent) {
                const otherB = this.getBehaviors(other);
                if (otherB.some(ob => ob.type === 'collectible' || ob.type === 'key_pickup' || ob.type === 'health_pickup')) {
                  const dist = magnetPos.distance(other.getPosition());
                  if (dist <= radius && dist > 0.1) {
                    const dir = magnetPos.clone().sub(other.getPosition()).normalize().mulScalar(speed * dt);
                    other.translate(dir);
                  }
                }
              }
            });
          } else if (b.type === 'turret_laser_sight') {
            const player = app.root.find(node => node.name.toLowerCase().includes('player') || node.name.toLowerCase().includes('character') || node.name.toLowerCase().includes('hero') || node.name.toLowerCase().includes('warrior'));
            if (player) {
              const dist = entity.getPosition().distance(player.getPosition());
              if (dist < (b.params.beamLength || 25.0)) {
                entity.lookAt(player.getPosition());
              }
            }
          } else if (b.type === 'breakable_crate_loot') {
            if (b.params.health === undefined) b.params.health = b.params.maxHealth || 30;
            if (b.params.health <= 0 && entity.enabled) {
              entity.enabled = false;
              proceduralSFX.play('explosion');
              this.triggerScreenShake(0.4, 0.2);

              const loot = new pc.Entity(`Loot_${Date.now()}`);
              loot.setPosition(entity.getPosition().clone().add(new pc.Vec3(0, 0.5, 0)));
              loot.setLocalScale(0.4, 0.4, 0.4);

              const mat = new pc.StandardMaterial();
              mat.diffuse = new pc.Color(0.1, 0.9, 0.2);
              mat.emissive = new pc.Color(0.1, 0.8, 0.2);
              mat.update();

              loot.addComponent('render', { type: 'sphere', material: mat });
              this.attachBehavior(loot, 'health_pickup', { healAmount: 30 });
              app.root.addChild(loot);

              if (typeof showToast === 'function') showToast(`📦 Shattered ${entity.name}! Dropped ${b.params.lootItem || 'Health Potion'}!`, 'success');
            }
          } else if (b.type === 'rotating_skybox_sun') {
            const speed = b.params.cycleSpeed || 0.05;
            entity.rotate(speed * dt * 20, 0, 0);
          } else if (b.type === 'minimap_blip') {
            b._blipColor = b.params.blipColor || '#34d399';
            b._worldPos = entity.getPosition();
          } else if (b.type === 'damage_number_popup') {
            if (b._popupTimer && b._popupTimer > 0) {
              b._popupTimer -= dt;
            }
          } else if (b.type === 'combo_kill_announcer') {
            if (!b._state) b._state = { killStreak: 0, comboTimer: 0 };
            if (b._state.comboTimer > 0) {
              b._state.comboTimer -= dt;
              if (b._state.comboTimer <= 0) {
                b._state.killStreak = 0;
              }
            }
          } else if (b.type === 'grappling_rope_physics') {
            const player = this.findPlayerEntity();
            if (player) {
              const maxDist = b.params.maxDistance || 25;
              const dist = entity.getPosition().distance(player.getPosition());
              if (dist > maxDist) {
                const tension = b.params.tension || 15.0;
                const dir = entity.getPosition().clone().sub(player.getPosition()).normalize();
                if (player.rigidbody) {
                  player.rigidbody.applyForce(dir.x * tension * dt * 60, dir.y * tension * dt * 60, dir.z * tension * dt * 60);
                } else {
                  player.translate(dir.x * tension * dt * 0.1, dir.y * tension * dt * 0.1, dir.z * tension * dt * 0.1);
                }
              }
            }
          } else if (b.type === 'portal_teleport_pair') {
            const player = this.findPlayerEntity();
            if (player) {
              if (!b._teleportCd) b._teleportCd = 0;
              if (b._teleportCd > 0) b._teleportCd -= dt;
              const dist = entity.getPosition().distance(player.getPosition());
              if (dist < 1.8 && b._teleportCd <= 0) {
                b._teleportCd = b.params.cooldown || 1.5;
                const pairedName = b.params.pairedEntity || 'Portal_B';
                const app = this.editor.getApp();
                const targetPortal = app ? app.root.findByName(pairedName) : null;
                if (targetPortal) {
                  const destPos = targetPortal.getPosition().clone().add(targetPortal.forward.clone().mulScalar(2.0));
                  if (player.rigidbody) player.rigidbody.teleport(destPos);
                  else player.setPosition(destPos);
                  proceduralSFX.play('teleport');
                  if (typeof showToast === 'function') showToast(`🌀 Spatial Warp to ${pairedName}!`, 'info');
                }
              }
            }
          } else if (b.type === 'tactical_time_dilation') {
            const triggerKey = (b.params.triggerKey || 't').toLowerCase();
            if (this.isKeyDown(triggerKey)) {
              if (!b._activeTimer) {
                b._activeTimer = b.params.duration || 3.0;
                proceduralSFX.play('powerup');
                if (typeof showToast === 'function') showToast(`⌛ Bullet-Time Matrix Dilation Activated!`, 'success');
              }
            }
            if (b._activeTimer && b._activeTimer > 0) {
              b._activeTimer -= dt;
            }
          } else if (b.type === 'dynamic_weather_storm') {
            if (!b._flashTimer) b._flashTimer = 0;
            b._flashTimer -= dt;
            if (b._flashTimer <= 0) {
              b._flashTimer = b.params.flashInterval || 8.0;
              proceduralSFX.play('explosion');
              this.triggerScreenShake(0.7, 0.35);
              if (typeof showToast === 'function') showToast(`⛈️ Lightning Flash & Thunder Strike!`, 'info');
            }
          } else if (b.type === 'loot_box_gacha') {
            if (b.params.health === undefined) b.params.health = 20;
            if (b.params.health <= 0 && entity.enabled) {
              entity.enabled = false;
              proceduralSFX.play('victory');
              this.triggerScreenShake(0.4, 0.2);
              if (typeof showToast === 'function') showToast(`🎁 Mystery Loot Box Unlocked! Items Dropped!`, 'success');
            }
          } else if (b.type === 'magnetic_shield') {
            const pos = entity.getPosition();
            const radius = b.params.radius || 3.0;
            const force = b.params.reflectForce || 20.0;
            const app = this.editor.getApp();
            if (app) {
              app.root.forEach(other => {
                if (other !== entity && other.enabled && (other.name.toLowerCase().includes('bullet') || other.name.toLowerCase().includes('projectile'))) {
                  const dist = pos.distance(other.getPosition());
                  if (dist <= radius) {
                    const reflectDir = other.getPosition().clone().sub(pos).normalize();
                    if (other.rigidbody) {
                      other.rigidbody.applyForce(reflectDir.x * force, reflectDir.y * force, reflectDir.z * force);
                    } else {
                      other.translate(reflectDir.x * dt * force, reflectDir.y * dt * force, reflectDir.z * dt * force);
                    }
                  }
                }
              });
            }
          } else if (b.type === 'combo_hit_counter_hud') {
            if (!b._comboTimer) b._comboTimer = 0;
            if (b._comboTimer > 0) b._comboTimer -= dt;
          } else if (b.type === 'climbable_ledge_parkour') {
            const player = this.findPlayerEntity();
            if (player) {
              const dist = entity.getPosition().distance(player.getPosition());
              if (dist <= (b.params.reachRadius || 1.5) && (this.isKeyDown('w') || this.isKeyDown('arrowup'))) {
                const climbSpeed = b.params.climbSpeed || 4.0;
                player.translate(0, climbSpeed * dt, 0);
                if (player.rigidbody) player.rigidbody.linearVelocity = pc.Vec3.ZERO;
              }
            }
          } else if (b.type === 'orbiting_drone_companion') {
            const player = this.findPlayerEntity();
            if (player) {
              if (!b._angle) b._angle = 0;
              b._angle += dt * 2.0;
              const radius = b.params.orbitRadius || 3.0;
              const pPos = player.getPosition();
              entity.setPosition(pPos.x + Math.cos(b._angle) * radius, pPos.y + 1.8, pPos.z + Math.sin(b._angle) * radius);
            }
          } else if (b.type === 'directional_damage_indicator') {
            if (!b._fadeTimer) b._fadeTimer = 0;
            if (b._fadeTimer > 0) b._fadeTimer -= dt;
          } else if (b.type === 'navmesh_agent') {
            const player = this.findPlayerEntity();
            if (player) {
              const speed = b.params.speed || 4.0;
              const stopDist = b.params.stoppingDistance || 1.2;
              const pos = entity.getPosition();
              const targetPos = player.getPosition();
              const dist = pos.distance(targetPos);
              if (dist > stopDist && dist < 30.0) {
                const lookTarget = new pc.Vec3(targetPos.x, pos.y, targetPos.z);
                entity.lookAt(lookTarget);
                entity.translateLocal(0, 0, -speed * dt);
                this.updateLocomotion(entity, speed, true, dt);
              } else {
                this.updateLocomotion(entity, speed, false, dt);
              }
            }
          } else if (b.type === 'telekinesis_gravity_lift') {
            const liftKey = this.isKeyDown('f') || this.isKeyDown('keyf');
            if (liftKey) {
              const pos = entity.getPosition();
              const range = b.params.range || 15;
              const liftForce = b.params.liftForce || 25.0;
              app.root.forEach(other => {
                if (other !== entity && other.enabled && other.parent) {
                  if (pos.distance(other.getPosition()) <= range) {
                    if (other.rigidbody) {
                      other.rigidbody.applyForce(0, liftForce * dt * 60, 0);
                    } else if (other.translate) {
                      other.translate(0, liftForce * dt * 0.1, 0);
                    }
                  }
                }
              });
              proceduralSFX.play('powerup', 0.1);
            }
          } else if (b.type === 'procedural_ik_footing') {
            const pos = entity.getPosition();
            const rayLen = b.params.rayLength || 1.5;
            if (app.systems && app.systems.rigidbody) {
              const rayEnd = pos.clone().sub(new pc.Vec3(0, rayLen, 0));
              const res = app.systems.rigidbody.raycastFirst(pos, rayEnd);
              if (res) {
                const targetY = res.point.y + 0.1;
                entity.setPosition(pos.x, Math.max(pos.y, targetY), pos.z);
              }
            }
          } else if (b.type === 'time_rewind_effect') {
            if (!b._history) b._history = [];
            const isRewinding = this.isKeyDown('r') || this.isKeyDown('keyr');
            if (isRewinding) {
              if (b._history.length > 0) {
                const prev = b._history.pop();
                if (entity.rigidbody) {
                  entity.rigidbody.teleport(prev.pos);
                  entity.rigidbody.linearVelocity = pc.Vec3.ZERO;
                } else {
                  entity.setPosition(prev.pos);
                }
                entity.setEulerAngles(prev.rot);
                proceduralSFX.play('teleport', 0.15);
              }
            } else {
              const maxFrames = Math.round((b.params.recordSeconds || 5.0) * 60);
              b._history.push({
                pos: entity.getPosition().clone(),
                rot: entity.getEulerAngles().clone()
              });
              if (b._history.length > maxFrames) b._history.shift();
            }
          } else if (b.type === 'procedural_dungeon_room_spawner') {
            if (!b._state) b._state = { spawned: false };
            if (!b._state.spawned) {
              b._state.spawned = true;
              const w = b.params.roomWidth || 12;
              const l = b.params.roomLength || 12;
              const pos = entity.getPosition();
              const floor = new pc.Entity('Dungeon_Floor');
              floor.setPosition(pos);
              floor.setLocalScale(w, 0.2, l);
              const mat = new pc.StandardMaterial();
              mat.diffuse = new pc.Color(0.2, 0.2, 0.25);
              mat.update();
              floor.addComponent('render', { type: 'box', material: mat });
              floor.addComponent('collision', { type: 'box' });
              floor.addComponent('rigidbody', { type: 'static' });
              app.root.addChild(floor);
            }
          } else if (b.type === 'magnetic_grapple_tether') {
            const player = this.findPlayerEntity();
            if (player) {
              const pos = entity.getPosition();
              const plyPos = player.getPosition();
              const dist = pos.distance(plyPos);
              if (dist <= (b.params.radius || 10.0) && dist > 1.0) {
                const pullSpeed = b.params.pullSpeed || 18.0;
                const dir = pos.clone().sub(plyPos).normalize().mulScalar(pullSpeed * dt);
                if (player.rigidbody) {
                  player.rigidbody.applyForce(dir.x * 60, dir.y * 60, dir.z * 60);
                } else {
                  player.translate(dir);
                }
              }
            }
          } else if (b.type === 'surface_climbing_spider') {
            const isClimbing = this.isKeyDown('w') || this.isKeyDown('s') || this.isKeyDown('a') || this.isKeyDown('d');
            if (isClimbing) {
              const speed = b.params.climbSpeed || 6.0;
              if (this.isKeyDown('w')) entity.translateLocal(0, speed * dt, 0);
              if (this.isKeyDown('s')) entity.translateLocal(0, -speed * dt, 0);
              if (entity.rigidbody) entity.rigidbody.linearVelocity = pc.Vec3.ZERO;
            }
          } else if (b.type === 'stealth_invisibility_cloak') {
            const cloakKey = this.isKeyDown('x') || this.isKeyDown('keyx');
            if (!b._cooldown) b._cooldown = 0;
            if (b._cooldown > 0) b._cooldown -= dt;
            if (cloakKey && b._cooldown <= 0) {
              b._cooldown = b.params.cooldown || 12.0;
              b._duration = b.params.duration || 6.0;
              if (entity.render && entity.render.material) {
                entity.render.material.opacity = 0.25;
                entity.render.material.blendType = pc.BLEND_NORMAL;
                entity.render.material.update();
              }
              proceduralSFX.play('powerup');
              if (typeof showToast === 'function') showToast(`🥷 Stealth Invisibility Cloak Active!`, 'success');
            }
            if (b._duration && b._duration > 0) {
              b._duration -= dt;
              if (b._duration <= 0 && entity.render && entity.render.material) {
                entity.render.material.opacity = 1.0;
                entity.render.material.update();
                if (typeof showToast === 'function') showToast(`🥷 Cloak Expired! Transparency restored.`, 'info');
              }
            }
          } else if (b.type === 'thermal_night_vision_toggle') {
            const nvKey = this.isKeyDown('v') || this.isKeyDown('keyv');
            if (!b._keyWasDown) b._keyWasDown = false;
            if (nvKey && !b._keyWasDown) {
              b._nvActive = !b._nvActive;
              app.scene.ambientLight = b._nvActive ? new pc.Color(0.1, 0.9, 0.2) : new pc.Color(0.25, 0.25, 0.28);
              proceduralSFX.play('coin');
              if (typeof showToast === 'function') showToast(`🕶️ Thermal Night Vision ${b._nvActive ? 'ENABLED' : 'DISABLED'}`, 'info');
            }
            b._keyWasDown = nvKey;
          } else if (b.type === 'weapon_recoil_camera_kick') {
            if (!b._recoilTimer) b._recoilTimer = 0;
            if (b._recoilTimer > 0) {
              b._recoilTimer -= dt;
              const cam = app.root.find(c => c.camera);
              if (cam) {
                cam.rotateLocal(-(b.params.recoilAngle || 3.5) * dt * 10, 0, 0);
              }
            }
          }
        }
      }
    });
  }

  findPlayerEntity() {
    const app = this.editor.getApp();
    if (!app) return null;
    return app.root.find(node => node.name.toLowerCase().includes('player') || node.name.toLowerCase().includes('character') || node.name.toLowerCase().includes('hero') || node.name.toLowerCase().includes('warrior'));
  }

  isKeyDown(key) {
    return Boolean(this.keys[key.toLowerCase()]);
  }

  attachBehavior(entity, behaviorType, params = {}) {
    if (!this.activeBehaviors.has(entity)) {
      this.activeBehaviors.set(entity, []);
    }

    const list = this.activeBehaviors.get(entity);
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

  applyDamage(entity, amount, sourceName = 'Hazard') {
    if (!entity) return;
    const behaviors = this.getBehaviors(entity);
    let remaining = amount;

    // Check tactical cover system
    const coverB = behaviors.find(b => b.type === 'cover_system');
    if (coverB && coverB._inCover) {
      const reduction = coverB.params.damageReduction !== undefined ? coverB.params.damageReduction : 0.75;
      remaining = Math.round(remaining * (1.0 - reduction));
      if (typeof showToast === 'function') showToast(`🛡️ In Cover! Damage reduced by ${Math.round(reduction * 100)}%!`, 'info');
    }

    // Check energy shield
    const shieldB = behaviors.find(b => b.type === 'shield_generator');
    if (shieldB) {
      if (shieldB.params.currentShield === undefined) shieldB.params.currentShield = shieldB.params.maxShield || 50;
      shieldB._rechargeTimer = shieldB.params.rechargeDelay || 3.0;
      if (shieldB.params.currentShield > 0) {
        if (shieldB.params.currentShield >= remaining) {
          shieldB.params.currentShield -= remaining;
          remaining = 0;
          if (typeof showToast === 'function') showToast(`🛡️ Shield absorbed ${amount} damage! (${Math.round(shieldB.params.currentShield)}/${shieldB.params.maxShield || 50})`, 'info');
        } else {
          remaining -= shieldB.params.currentShield;
          shieldB.params.currentShield = 0;
          if (typeof showToast === 'function') showToast(`🛡️ Shield depleted! Excess ${remaining} DMG dealt to health!`, 'warn');
        }
      }
    }

    if (remaining > 0) {
      // Check damage_flash behavior
      const flashB = behaviors.find(b => b.type === 'damage_flash');
      if (flashB && entity.render && entity.render.material) {
        flashB._flashTimer = flashB.params.flashDuration || 0.2;
        if (!flashB._origEmissive) {
          flashB._origEmissive = entity.render.material.emissive ? entity.render.material.emissive.clone() : new pc.Color(0, 0, 0);
        }
        entity.render.material.emissive = new pc.Color(1, 0, 0);
        entity.render.material.update();
      }

      const healthB = behaviors.find(b => b.type === 'health' || b.type === 'target_health');
      if (healthB) {
        const maxHp = healthB.params.maxHp || 100;
        healthB.params.currentHp = Math.max(0, (healthB.params.currentHp !== undefined ? healthB.params.currentHp : maxHp) - remaining);
        if (typeof showToast === 'function') showToast(`💥 ${entity.name} took ${remaining} damage from ${sourceName}! HP: ${healthB.params.currentHp}`, 'warn');

        if (healthB.params.currentHp <= 0) {
          const ragdollB = behaviors.find(b => b.type === 'ragdoll_physics');
          if (ragdollB && entity.rigidbody) {
            entity.rigidbody.angularFactor = new pc.Vec3(1, 1, 1);
            entity.rigidbody.linearFactor = new pc.Vec3(1, 1, 1);
            entity.rigidbody.applyImpulse((Math.random() - 0.5) * 5, 2, (Math.random() - 0.5) * 5);
          }
          if (entity._respawnCheckpoint) {
            entity.setPosition(entity._respawnCheckpoint);
            healthB.params.currentHp = maxHp;
            if (shieldB) shieldB.params.currentShield = shieldB.params.maxShield || 50;
            if (typeof showToast === 'function') showToast(`🚩 Respawned at checkpoint!`, 'success');
          } else {
            if (typeof showToast === 'function') showToast(`💀 GAME OVER! ${entity.name} was defeated.`, 'error');
          }
        }
      }
    }
  }

  /**
   * Evaluates locomotion and drives either skeletal AnimComponent or procedural limb swing.
   * Seamlessly transitions between Idle and Walk/Run when entities move with WASD, AI, or Patrol.
   */
  updateLocomotion(entity, speed = 8, isMoving = false, dt = 0.016) {
    if (!entity) return;

    // 1. Skeletal AnimComponent Playback & Blending
    const animComp = entity._animComp || (entity.findComponent ? entity.findComponent('anim') : null) || entity.anim;
    if (animComp && animComp.baseLayer) {
      const activeState = animComp.baseLayer.activeState;
      const walkClip = entity._walkClip || 'walk';
      const runClip = entity._runClip || 'run';
      const idleClip = entity._idleClip || 'idle';

      if (isMoving) {
        // High speed movement triggers run clip if available
        const targetClip = (speed > 7.0 && entity._modelAnimations && entity._modelAnimations.includes(runClip)) ? runClip : walkClip;
        if (activeState !== targetClip) {
          try {
            animComp.baseLayer.transition(targetClip, 0.15);
          } catch (e) {
            try { animComp.baseLayer.play(targetClip); } catch (err) {}
          }
        }
        if (typeof animComp.setFloat === 'function') animComp.setFloat('speed', speed);
      } else {
        if (activeState !== idleClip) {
          try {
            animComp.baseLayer.transition(idleClip, 0.2);
          } catch (e) {
            try { animComp.baseLayer.play(idleClip); } catch (err) {}
          }
        }
        if (typeof animComp.setFloat === 'function') animComp.setFloat('speed', 0);
      }
      return;
    }

    // 2. Procedural Character Limb Locomotion (for blocky / modular models with limbs)
    entity._locoPhase = (entity._locoPhase || 0) + (isMoving ? dt * speed * 2.5 : 0);
    const leftLeg = entity.findByName ? (entity.findByName('leg-left') || entity.findByName('LeftLeg') || entity.findByName('Leg_L')) : null;
    const rightLeg = entity.findByName ? (entity.findByName('leg-right') || entity.findByName('RightLeg') || entity.findByName('Leg_R')) : null;
    const leftArm = entity.findByName ? (entity.findByName('arm-left') || entity.findByName('LeftArm') || entity.findByName('Arm_L')) : null;
    const rightArm = entity.findByName ? (entity.findByName('arm-right') || entity.findByName('RightArm') || entity.findByName('Arm_R')) : null;

    if (leftLeg || rightLeg || leftArm || rightArm) {
      if (isMoving) {
        const legAngle = Math.sin(entity._locoPhase) * 26; // degrees
        const armAngle = -legAngle * 0.7;
        if (leftLeg) leftLeg.setLocalEulerAngles(legAngle, 0, 0);
        if (rightLeg) rightLeg.setLocalEulerAngles(-legAngle, 0, 0);
        if (leftArm) leftArm.setLocalEulerAngles(armAngle, 0, 0);
        if (rightArm) rightArm.setLocalEulerAngles(-armAngle, 0, 0);
      } else {
        if (leftLeg) leftLeg.setLocalEulerAngles(0, 0, 0);
        if (rightLeg) rightLeg.setLocalEulerAngles(0, 0, 0);
        if (leftArm) leftArm.setLocalEulerAngles(0, 0, 0);
        if (rightArm) rightArm.setLocalEulerAngles(0, 0, 0);
      }
    }
  }
}
