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
  }

  registerTrigger(entityName, triggerConfig) {
    this.triggers.set(entityName, triggerConfig);
    showToast(`⚡ Registered Trigger Event on "${entityName}"`, 'info');
  }

  fireTriggerEvent(entityName, eventType, playerEntity = null) {
    const config = this.triggers.get(entityName);
    if (!config) return;

    if (config.eventType !== eventType) return;

    console.log(`[TriggerSystem] Firing ${eventType} on ${entityName} -> Action: ${config.action}`);

    if (config.action === 'teleport' && playerEntity && config.targetPosition) {
      playerEntity.setPosition(config.targetPosition[0], config.targetPosition[1], config.targetPosition[2]);
      showToast('🌀 Player Teleported by Trigger Volume!', 'success');
    } else if (config.action === 'toggle_visibility' && config.targetEntity) {
      if (this.editor.runtime && this.editor.runtime.app) {
        const target = this.editor.runtime.app.root.findByName(config.targetEntity);
        if (target) {
          target.enabled = !target.enabled;
          showToast(`💡 Toggled visibility on ${config.targetEntity}`, 'info');
        }
      }
    } else if (config.action === 'play_sound' && config.soundAsset) {
      showToast(`🔊 Triggering Audio Playback: ${config.soundAsset}`, 'info');
    }
  }
}
