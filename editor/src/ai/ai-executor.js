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

  findTarget(name) {
    if (!name) return null;
    if (name === 'selected') return this.editor.selection.getActive();
    const app = this.editor.getApp();
    const root = (app && app.root) ? app.root : this.editor.root;
    if (!root) return null;
    if (root.findByName) {
      const found = root.findByName(name);
      if (found) return found;
    }
    if (root.children) {
      const foundChild = root.children.find(c => c.name === name);
      if (foundChild) return foundChild;
    }
    return null;
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
            const target = this.findTarget(act.name);
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
            const target = this.findTarget(act.target);
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
            const target = this.findTarget(act.target);
            if (target && act.type) {
              this.editor.addComponent(target, act.type, act.properties || {});
              executed.push({ action: act.action, target: `${act.type} -> ${target.name}` });
            }
            break;
          }

          case 'delete_entity': {
            const target = this.findTarget(act.target);
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
            const target = this.findTarget(act.target);
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

          case 'configure_hud': {
            if (act.config) {
              this.editor.hudConfig = { ...this.editor.hudConfig, ...act.config };
              this.editor.events.emit('hud:config:changed', this.editor.hudConfig);
              executed.push({ action: act.action, target: '2D HUD Config' });
            }
            break;
          }

          case 'create_material': {
            const target = this.findTarget(act.target);
            if (target) {
              const mat = new pc.StandardMaterial();
              if (act.diffuse) mat.diffuse = new pc.Color(...act.diffuse);
              if (act.metalness !== undefined) { mat.metalness = act.metalness; mat.useMetalness = true; }
              if (act.roughness !== undefined) mat.roughness = act.roughness;
              if (act.emissive) mat.emissive = new pc.Color(...act.emissive);
              if (act.opacity !== undefined) { mat.opacity = act.opacity; if (act.opacity < 1.0) mat.blendType = pc.BLEND_NORMAL; }
              mat.update();
              if (target.render) target.render.material = mat;
              target.material = mat;
              this.editor.events.emit('entity:component:changed', target);
              executed.push({ action: act.action, target: target.name });
            }
            break;
          }

          case 'duplicate_entity': {
            const target = this.findTarget(act.target);
            if (target) {
              const clone = this.editor.duplicateEntity(target);
              executed.push({ action: act.action, target: clone ? clone.name : target.name });
            }
            break;
          }

          case 'reparent_entity': {
            const child = this.findTarget(act.child);
            const parent = act.parent ? this.findTarget(act.parent) : (this.editor.getApp() ? this.editor.getApp().root : this.editor.root);
            if (child && parent) {
              parent.addChild(child);
              this.editor.events.emit('scene:changed');
              executed.push({ action: act.action, target: `${child.name} -> ${parent.name}` });
            }
            break;
          }

          case 'set_postfx': {
            const app = this.editor.getApp();
            if (app) {
              if (act.exposure !== undefined) app.scene.exposure = act.exposure;
              if (act.fog) {
                app.scene.fog = pc.FOG_EXP2;
                if (act.fog.color) app.scene.fogColor = new pc.Color(...act.fog.color);
                if (act.fog.density) app.scene.fogDensity = act.fog.density;
              }
              executed.push({ action: act.action, target: 'PostFX Pipeline' });
            } else {
              executed.push({ action: act.action, target: 'PostFX Pipeline' });
            }
            break;
          }

          case 'add_particle_system': {
            let target = this.findTarget(act.target);
            if (!target) {
              target = this.editor.createEntity({ name: act.name || 'ParticleEmitter', transform: { position: act.position || [0, 1, 0] } });
            }
            this.editor.addComponent(target, 'particlesystem', {
              numParticles: act.numParticles || 80,
              lifetime: act.lifetime || 1.5,
              rate: act.rate || 0.05,
              particleScale: act.particleScale || 0.5,
              colorTint: act.colorTint || [1, 0.4, 0]
            });
            executed.push({ action: act.action, target: target.name });
            break;
          }

          case 'add_sound': {
            let target = this.findTarget(act.target);
            if (!target) {
              target = this.editor.createEntity({ name: act.name || 'AudioEmitter', transform: { position: act.position || [0, 1, 0] } });
            }
            this.editor.addComponent(target, 'sound', {
              assetUrl: act.url || './models/wind.wav',
              volume: act.volume !== undefined ? act.volume : 1,
              pitch: act.pitch !== undefined ? act.pitch : 1,
              loop: act.loop !== false,
              autoPlay: Boolean(act.autoPlay)
            });
            executed.push({ action: act.action, target: target.name });
            break;
          }

          case 'add_joint': {
            const target = this.findTarget(act.target);
            if (target) {
              target.joint = {
                type: act.jointType || 'hinge',
                targetEntity: act.targetEntity || '',
                pivot: act.pivot || [0, 0, 0]
              };
              this.editor.events.emit('entity:component:changed', target);
              executed.push({ action: act.action, target: target.name });
            }
            break;
          }

          case 'clear_scene': {
            const app = this.editor.getApp();
            if (app && app.root) {
              const toRemove = [];
              app.root.children.forEach(c => {
                if (c.name !== 'EditorGrid' && c.name !== 'EditorCamera') {
                  toRemove.push(c);
                }
              });
              toRemove.forEach(c => app.root.removeChild(c));
              this.editor.selection.clear();
              this.editor.events.emit('scene:changed');
              executed.push({ action: act.action, target: 'All Scene Entities' });
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
