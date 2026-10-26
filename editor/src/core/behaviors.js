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
                  healthB.params.currentHp = Math.max(0, (healthB.params.currentHp || healthB.params.maxHp || 100) - dmg);
                  healthB._invincibleTimer = b.params.cooldown || 1.0;
                  if (typeof showToast === 'function') showToast(`⚠️ Player took ${dmg} damage from ${entity.name}! HP: ${healthB.params.currentHp}`, 'warn');
                  if (healthB.params.currentHp <= 0) {
                    if (typeof showToast === 'function') showToast(`💀 GAME OVER! ${player.name} was defeated.`, 'error');
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
                } else {
                  if (!b._attackTimer) b._attackTimer = 0;
                  b._attackTimer -= dt;
                  if (b._attackTimer <= 0) {
                    b._attackTimer = b.params.attackRate || 1.0;
                    const playerBehaviors = this.getBehaviors(player);
                    const healthB = playerBehaviors.find(hb => hb.type === 'health');
                    if (healthB) {
                      const dmg = b.params.damage || 15;
                      healthB.params.currentHp = Math.max(0, (healthB.params.currentHp || healthB.params.maxHp || 100) - dmg);
                      this.triggerScreenShake(0.4, 0.2);
                      if (typeof showToast === 'function') showToast(`⚔️ Enemy ${entity.name} attacked player for ${dmg} damage! HP: ${healthB.params.currentHp}`, 'warn');
                    }
                  }
                }
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

            if (move.lengthSq() > 0.0001) {
              move.normalize().mulScalar(speed * dt);
              entity.translate(move);
              this.editor.events.emit('entity:transformed', entity);
            }

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
                  healthB.params.currentHp = Math.max(0, (healthB.params.currentHp || 100) - dmg);
                  healthB._invincibleTimer = 1.0;
                  this.triggerScreenShake(0.6, 0.3);
                  proceduralSFX.play('explosion');
                  if (typeof showToast === 'function') showToast(`🔥 Player fell into Lava Hazard! HP: ${healthB.params.currentHp}`, 'error');
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
              } else {
                const dir = targetVec.clone().sub(curPos).normalize().scale(speed * dt);
                entity.translate(dir);
              }
            }
          } else if (b.type === 'dash_boost') {
            if (!b._cooldown) b._cooldown = 0;
            if (b._cooldown > 0) b._cooldown -= dt;
            const boostKey = this.isKeyDown('shift') || this.isKeyDown('lshift');
            if (boostKey && b._cooldown <= 0) {
              b._cooldown = b.params.cooldown || 1.2;
              const force = b.params.force || 25;
              const dir = entity.forward.clone().mulScalar(-force * dt);
              if (entity.rigidbody) {
                entity.rigidbody.applyImpulse(dir.x, 0, dir.z);
              } else {
                entity.translateLocal(0, 0, -force * dt);
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
              const healthB = playerBehaviors.find(hb => hb.type === 'health');
              if (healthB) {
                const maxHp = healthB.params.maxHp || 100;
                const regenAmount = b.params.amount || 5;
                if (healthB.params.currentHp < maxHp) {
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
              const target = app.root.findByName(targetName);
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
                  bullet.setPosition(pos.clone().add(entity.forward.clone().mulScalar(-1.2)));
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
                      const playerBehaviors = this.getBehaviors(player);
                      const healthB = playerBehaviors.find(hb => hb.type === 'health');
                      if (healthB) {
                        healthB.params.currentHp = Math.max(0, (healthB.params.currentHp || 100) - (b.params.damage || 15));
                        this.triggerScreenShake(0.3, 0.15);
                        if (typeof showToast === 'function') showToast(`⚠️ Turret hit player! HP: ${healthB.params.currentHp}`, 'warn');
                      }
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
                  const target = app.root.findByName(targetName);
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
                  const destEnt = app.root.findByName(destName);
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
