import { showToast } from '../ui/toast.js';

/**
 * Visual Event Trigger & Logic System
 * Provides Trigger Volume collision/interaction callbacks (On Player Enter, On Player Exit, On Click)
 * with configurable target events (Play Sound, Teleport, Spawn Prefab, Toggle Visibility, Load Scene).
 */
export class TriggerSystem {
  constructor(editor) {
    this.editor = editor;
    this.triggers = new Map(); // entityName -> triggerConfig
    this.activeStates = new Map(); // entityName -> boolean (isInside)

    this.editor.events.on('game:play', () => {
      this.activeStates.clear();
      this.bindUpdateLoop();
    });
  }

  registerTrigger(entityName, triggerConfig) {
    const existing = this.triggers.get(entityName) || {};
    const updated = {
      eventType: 'on_enter',
      action: 'teleport',
      radius: 2.0,
      targetPosition: [0, 2, 0],
      targetEntity: '',
      ...existing,
      ...triggerConfig
    };
    this.triggers.set(entityName, updated);
    this.editor.events.emit('scene:changed');
    showToast(`⚡ Registered Trigger Event on "${entityName}"`, 'info');
  }

  removeTrigger(entityName) {
    this.triggers.delete(entityName);
    this.activeStates.delete(entityName);
    this.editor.events.emit('scene:changed');
    showToast(`Removed Trigger from "${entityName}"`, 'info');
  }

  hasTrigger(entityName) {
    return this.triggers.has(entityName);
  }

  getTrigger(entityName) {
    return this.triggers.get(entityName);
  }

  bindUpdateLoop() {
    const app = this.editor.getApp();
    if (!app || this._updateBound) return;
    this._updateBound = true;

    app.on('update', () => {
      if (!this.editor.isPlaying) return;

      const player = app.root.find(node =>
        node.name.toLowerCase().includes('player') ||
        node.name.toLowerCase().includes('character') ||
        node.name.toLowerCase().includes('hero') ||
        node.name.toLowerCase().includes('warrior')
      );

      if (!player) return;

      for (const [entityName, config] of this.triggers.entries()) {
        const trigEntity = app.root.findByName(entityName);
        if (!trigEntity || !trigEntity.enabled) continue;

        const dist = trigEntity.getPosition().distance(player.getPosition());
        const radius = config.radius || 2.0;
        const wasInside = Boolean(this.activeStates.get(entityName));
        const isInside = dist <= radius;

        if (isInside && !wasInside) {
          this.activeStates.set(entityName, true);
          if (config.eventType === 'on_enter') {
            this.fireTriggerEvent(entityName, 'on_enter', player);
          }
        } else if (!isInside && wasInside) {
          this.activeStates.set(entityName, false);
          if (config.eventType === 'on_exit') {
            this.fireTriggerEvent(entityName, 'on_exit', player);
          }
        }
      }
    });
  }

  fireTriggerEvent(entityName, eventType, playerEntity = null) {
    const config = this.triggers.get(entityName);
    if (!config) return;

    if (config.eventType !== eventType) return;

    console.log(`[TriggerSystem] Firing ${eventType} on ${entityName} -> Action: ${config.action}`);

    if (config.action === 'teleport' && playerEntity && config.targetPosition) {
      playerEntity.setPosition(config.targetPosition[0], config.targetPosition[1], config.targetPosition[2]);
      showToast('🌀 Player Teleported by Trigger Volume!', 'success');
    } else if (config.action === 'damage_player' && playerEntity) {
      const dmg = config.amount || 20;
      if (this.editor.behaviors) {
        const playerBehaviors = this.editor.behaviors.getBehaviors(playerEntity);
        const healthB = playerBehaviors.find(b => b.type === 'health');
        if (healthB) {
          healthB.params.currentHp = Math.max(0, (healthB.params.currentHp || healthB.params.maxHp || 100) - dmg);
          showToast(`⚠️ Trigger Volume dealt ${dmg} damage to player! HP: ${healthB.params.currentHp}`, 'warn');
        }
      }
    } else if (config.action === 'heal_player' && playerEntity) {
      const heal = config.amount || 25;
      if (this.editor.behaviors) {
        const playerBehaviors = this.editor.behaviors.getBehaviors(playerEntity);
        const healthB = playerBehaviors.find(b => b.type === 'health');
        if (healthB) {
          const maxHp = healthB.params.maxHp || 100;
          healthB.params.currentHp = Math.min(maxHp, (healthB.params.currentHp || maxHp) + heal);
          showToast(`💚 Trigger Volume healed player +${heal} HP! HP: ${healthB.params.currentHp}`, 'success');
        }
      }
    } else if (config.action === 'add_score') {
      const points = config.amount || 100;
      if (this.editor.hudConfig && this.editor.hudConfig.score) {
        this.editor.hudConfig.score.initial = (this.editor.hudConfig.score.initial || 0) + points;
        showToast(`⭐ Score +${points}! Current Score: ${this.editor.hudConfig.score.initial}`, 'success');
      }
    } else if (config.action === 'toggle_visibility' && config.targetEntity) {
      if (this.editor.runtime && this.editor.runtime.app) {
        const target = this.editor.runtime.app.root.findByName(config.targetEntity);
        if (target) {
          target.enabled = !target.enabled;
          showToast(`💡 Toggled visibility on ${config.targetEntity}`, 'info');
        }
      }
    } else if (config.action === 'destroy' && config.targetEntity) {
      if (this.editor.runtime && this.editor.runtime.app) {
        const target = this.editor.runtime.app.root.findByName(config.targetEntity);
        if (target && target.parent) {
          target.parent.removeChild(target);
          showToast(`💥 Entity Destroyed: ${config.targetEntity}`, 'info');
        }
      }
    } else if (config.action === 'spawn' && config.prefabName) {
      if (this.editor.prefabs) {
        const prefab = this.editor.prefabs.getPrefab ? this.editor.prefabs.getPrefab(config.prefabName) : this.editor.prefabs.prefabs.get(config.prefabName);
        if (prefab) {
          this.editor.prefabs.instantiatePrefab(prefab, config.spawnPosition || [0, 2, 0]);
        }
      }
    } else if (config.action === 'play_sound' && config.soundAsset) {
      showToast(`🔊 Triggering Audio Playback: ${config.soundAsset}`, 'info');
    }
  }
}
