import * as pc from 'playcanvas';
import { TerrainGenerator } from '../engine/terrain-generator.js';

/**
 * AI Action Executor
 * Extracts JSON action commands from AI responses and executes them via the Editor Command Bus.
 */

export class AIExecutor {
  constructor(editor) {
    this.editor = editor;
  }

  parseActions(aiResponseText) {
    const match = aiResponseText.match(/```json:actions([\s\S]*?)```/) ||
                  aiResponseText.match(/```json([\s\S]*?)```/);

    if (!match) return null;

    try {
      const data = JSON.parse(match[1].trim());
      return data.actions || (Array.isArray(data) ? data : [data]);
    } catch (e) {
      console.warn('AIExecutor: Failed to parse action JSON:', e);
      return null;
    }
  }

  async executeActions(actions) {
    if (!actions || !Array.isArray(actions)) return [];

    const executed = [];

    for (const act of actions) {
      try {
        switch (act.action) {
          case 'spawn_primitive': {
            const entity = this.editor.createEntity({
              name: act.name || `AI_${act.type}`,
              transform: {
                position: act.position || [0, 1, 0],
                rotation: act.rotation || [0, 0, 0],
                scale: act.scale || [1, 1, 1]
              },
              components: [
                { type: 'render', properties: { type: act.type } },
                ...(act.components || [])
              ]
            });
            executed.push({ action: act.action, target: entity.name });
            break;
          }

          case 'create_light': {
            const light = this.editor.createEntity({
              name: act.name || 'AI_Light',
              transform: {
                position: act.position || [0, 3, 0]
              },
              components: [
                {
                  type: 'light',
                  properties: {
                    type: act.type || 'point',
                    color: act.color ? new pc.Color(...act.color) : new pc.Color(1, 1, 1),
                    intensity: act.intensity || 2,
                    range: act.range || 10,
                    castShadows: true
                  }
                }
              ]
            });
            executed.push({ action: act.action, target: light.name });
            break;
          }

          case 'generate_script': {
            if (act.name && act.code) {
              this.editor.scripts.set(act.name, act.code);
              executed.push({ action: act.action, script: act.name });
            }
            break;
          }

          case 'modify_entity': {
            let target = null;
            if (act.name === 'selected') {
              target = this.editor.selection.getActive();
            } else if (this.editor.getApp() && this.editor.getApp().root) {
              target = this.editor.getApp().root.findByName(act.name);
            }

            if (target) {
              if (act.position) target.setPosition(...act.position);
              if (act.rotation) target.setEulerAngles(...act.rotation);
              if (act.scale) target.setLocalScale(...act.scale);
              this.editor.events.emit('entity:transformed', target);
              executed.push({ action: act.action, target: target.name });
            }
            break;
          }

          case 'attach_behavior': {
            let target = act.target === 'selected' ? this.editor.selection.getActive() : null;
            if (!target && act.target && this.editor.getApp() && this.editor.getApp().root) {
              target = this.editor.getApp().root.findByName(act.target);
            }
            if (target && this.editor.behaviors && act.behavior) {
              this.editor.behaviors.attachBehavior(target, act.behavior, act.properties || {});
              executed.push({ action: act.action, target: `${act.behavior} -> ${target.name}` });
            }
            break;
          }

          case 'set_sky_atmosphere': {
            if (this.editor.runtime && act.preset) {
              this.editor.runtime.setAtmosphere(act.preset);
              executed.push({ action: act.action, target: act.preset });
            }
            break;
          }

          case 'add_component': {
            let target = act.target === 'selected' ? this.editor.selection.getActive() : null;
            if (!target && act.target && this.editor.getApp() && this.editor.getApp().root) {
              target = this.editor.getApp().root.findByName(act.target);
            }
            if (target && act.type) {
              this.editor.addComponent(target, act.type, act.properties || {});
              executed.push({ action: act.action, target: `${act.type} -> ${target.name}` });
            }
            break;
          }

          case 'delete_entity': {
            let target = act.target === 'selected' ? this.editor.selection.getActive() : null;
            if (!target && act.target && this.editor.getApp() && this.editor.getApp().root) {
              target = this.editor.getApp().root.findByName(act.target);
            }
            if (target) {
              this.editor.deleteEntity(target);
              executed.push({ action: act.action, target: target.name });
            }
            break;
          }

          case 'spawn_model': {
            if (act.url) {
              const result = await this.editor.loadModel(act.url, {
                name: act.name || 'AI_3D_Model',
                position: act.position || [0, 0, 0],
                scale: act.scale || [1, 1, 1],
                rotation: act.rotation || [0, 0, 0]
              });
              executed.push({ action: act.action, target: act.name || 'AI_3D_Model' });
            }
            break;
          }

          case 'create_terrain': {
            const gen = new TerrainGenerator(this.editor);
            gen.generate({
              name: act.name || 'Procedural Terrain',
              width: act.width || 40,
              depth: act.depth || 40,
              maxHeight: act.maxHeight || 6,
              roughness: act.roughness || 0.07,
              seed: act.seed || 1234
            });
            executed.push({ action: act.action, target: act.name || 'Procedural Terrain' });
            break;
          }

          case 'register_trigger': {
            const trigName = act.target || act.name;
            if (trigName && this.editor.triggers) {
              this.editor.triggers.registerTrigger(trigName, act.config || {
                eventType: act.eventType || 'on_enter',
                action: act.triggerAction || 'teleport',
                targetPosition: act.targetPosition || [0, 2, 0],
                targetEntity: act.targetEntity || ''
              });
              executed.push({ action: act.action, target: trigName });
            }
            break;
          }

          case 'create_prefab': {
            let target = act.target === 'selected' ? this.editor.selection.getActive() : null;
            if (!target && act.target && this.editor.getApp() && this.editor.getApp().root) {
              target = this.editor.getApp().root.findByName(act.target);
            }
            if (target && this.editor.prefabs) {
              this.editor.prefabs.createPrefabFromEntity(target);
              executed.push({ action: act.action, target: target.name });
            }
            break;
          }

          case 'set_physics_gravity': {
            const app = this.editor.getApp();
            if (app && app.systems && app.systems.rigidbody && act.gravity) {
              app.systems.rigidbody.gravity.set(...act.gravity);
              executed.push({ action: act.action, target: `Gravity: ${act.gravity.join(',')}` });
            }
            break;
          }

          default:
            console.warn(`AIExecutor: Unknown action "${act.action}"`);
        }
      } catch (err) {
        console.error(`AIExecutor: Error executing action ${act.action}:`, err);
      }
    }

    return executed;
  }
}
