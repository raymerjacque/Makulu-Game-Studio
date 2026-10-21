import * as pc from 'playcanvas';

/**
 * Simple Mode Plug-and-Play Game Behaviors
 * Enables novice users to attach interactive movement, physics, and gameplay logic without code.
 */
export class BehaviorManager {
  constructor(editor) {
    this.editor = editor;
    this.activeBehaviors = new Map(); // entityGuid -> [behaviors]
    this.initLoop();
  }

  initLoop() {
    this.editor.events.on('game:play', () => {
      this.isPlaying = true;
    });

    this.editor.events.on('game:stop', () => {
      this.isPlaying = false;
    });
  }

  attachBehavior(entity, behaviorType, params = {}) {
    const guid = entity.getGuid ? entity.getGuid() : entity.name;
    if (!this.activeBehaviors.has(guid)) {
      this.activeBehaviors.set(guid, []);
    }

    const behavior = {
      type: behaviorType,
      params: { ...params }
    };

    this.activeBehaviors.get(guid).push(behavior);

    // Attach runtime update to the entity
    const app = this.editor.getApp();
    if (!app) return;

    if (behaviorType === 'spin') {
      const speed = params.speed || 45;
      const axis = params.axis || 'y';
      app.on('update', (dt) => {
        if (!entity.enabled || !entity.parent) return;
        const s = speed * dt;
        if (axis === 'x') entity.rotate(s, 0, 0);
        else if (axis === 'y') entity.rotate(0, s, 0);
        else if (axis === 'z') entity.rotate(0, 0, s);
      });
    } else if (behaviorType === 'wasd') {
      const speed = params.speed || 8;
      app.on('update', (dt) => {
        if (!this.isPlaying || !entity.enabled) return;
        const move = new pc.Vec3();
        if (app.keyboard.isPressed(pc.KEY_W)) move.add(entity.forward);
        if (app.keyboard.isPressed(pc.KEY_S)) move.sub(entity.forward);
        if (app.keyboard.isPressed(pc.KEY_A)) move.sub(entity.right);
        if (app.keyboard.isPressed(pc.KEY_D)) move.add(entity.right);

        if (move.lengthSq() > 0) {
          move.normalize().mulScalar(speed * dt);
          entity.translate(move);
        }
      });
    } else if (behaviorType === 'light_flicker') {
      const variance = params.variance || 0.4;
      const base = entity.light ? entity.light.intensity : 2;
      app.on('update', () => {
        if (!entity.light || !entity.enabled) return;
        const noise = (Math.random() - 0.5) * variance;
        entity.light.intensity = Math.max(0.1, base + noise);
      });
    } else if (behaviorType === 'physics_impulse') {
      const force = params.force || 8;
      app.on('update', (dt) => {
        if (!this.isPlaying || !entity.rigidbody || !entity.enabled) return;
        if (app.keyboard.wasPressed(pc.KEY_SPACE)) {
          entity.rigidbody.applyImpulse(0, force, 0);
        }
      });
    }

    this.editor.events.emit('entity:component:changed', entity);
  }

  getBehaviors(entity) {
    const guid = entity.getGuid ? entity.getGuid() : entity.name;
    return this.activeBehaviors.get(guid) || [];
  }
}
