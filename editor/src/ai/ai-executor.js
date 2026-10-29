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

          case 'build_architecture': {
            const type = (act.type || 'room').toLowerCase();
            const pos = act.position || [0, 0, 0];
            const w = act.width || 12;
            const d = act.depth || 12;
            const h = act.height || 4;

            const group = this.editor.createEntity({
              name: `Arch_${type}_${Date.now()}`,
              transform: { position: pos }
            });

            const wallMat = new pc.StandardMaterial();
            wallMat.diffuse = new pc.Color(0.2, 0.22, 0.26);
            wallMat.update();

            const floorMat = new pc.StandardMaterial();
            floorMat.diffuse = new pc.Color(0.12, 0.14, 0.18);
            floorMat.update();

            // Floor slab
            const floor = this.editor.createEntity({
              name: `${type}_Floor`,
              parent: group,
              transform: { position: [0, 0.1, 0], scale: [w, 0.2, d] },
              components: [{ type: 'render', properties: { type: 'box', material: floorMat } }, { type: 'collision', properties: { type: 'box' } }]
            });

            if (type === 'room' || type === 'arena') {
              // 4 Walls
              const halfW = w / 2;
              const halfD = d / 2;
              const halfH = h / 2;

              this.editor.createEntity({
                name: 'Wall_North', parent: group,
                transform: { position: [0, halfH, -halfD], scale: [w, h, 0.4] },
                components: [{ type: 'render', properties: { type: 'box', material: wallMat } }, { type: 'collision', properties: { type: 'box' } }]
              });
              this.editor.createEntity({
                name: 'Wall_South', parent: group,
                transform: { position: [0, halfH, halfD], scale: [w, h, 0.4] },
                components: [{ type: 'render', properties: { type: 'box', material: wallMat } }, { type: 'collision', properties: { type: 'box' } }]
              });
              this.editor.createEntity({
                name: 'Wall_East', parent: group,
                transform: { position: [halfW, halfH, 0], scale: [0.4, h, d] },
                components: [{ type: 'render', properties: { type: 'box', material: wallMat } }, { type: 'collision', properties: { type: 'box' } }]
              });
              this.editor.createEntity({
                name: 'Wall_West', parent: group,
                transform: { position: [-halfW, halfH, 0], scale: [0.4, h, d] },
                components: [{ type: 'render', properties: { type: 'box', material: wallMat } }, { type: 'collision', properties: { type: 'box' } }]
              });
            } else if (type === 'staircase') {
              const steps = 8;
              const stepHeight = h / steps;
              const stepDepth = d / steps;
              for (let i = 0; i < steps; i++) {
                this.editor.createEntity({
                  name: `Step_${i+1}`, parent: group,
                  transform: { position: [0, (i + 0.5) * stepHeight, (i - steps/2) * stepDepth], scale: [w, stepHeight, stepDepth] },
                  components: [{ type: 'render', properties: { type: 'box', material: wallMat } }, { type: 'collision', properties: { type: 'box' } }]
                });
              }
            } else if (type === 'tower') {
              // Cylinder tower with entrance
              this.editor.createEntity({
                name: 'Tower_Body', parent: group,
                transform: { position: [0, h / 2, 0], scale: [w, h, w] },
                components: [{ type: 'render', properties: { type: 'cylinder', material: wallMat } }, { type: 'collision', properties: { type: 'cylinder' } }]
              });
            }

            executed.push({ action: act.action, target: group.name });
            break;
          }

          case 'apply_material_preset': {
            const target = this.findTarget(act.target);
            const preset = (act.preset || 'gold').toLowerCase();
            if (target) {
              const mat = new pc.StandardMaterial();
              if (preset === 'gold') {
                mat.diffuse = new pc.Color(1, 0.8, 0.1);
                mat.metalness = 0.9; mat.useMetalness = true; mat.roughness = 0.2;
              } else if (preset === 'neon') {
                mat.diffuse = new pc.Color(0, 0.9, 1);
                mat.emissive = new pc.Color(0, 0.9, 1);
              } else if (preset === 'lava') {
                mat.diffuse = new pc.Color(1, 0.2, 0);
                mat.emissive = new pc.Color(0.9, 0.3, 0);
              } else if (preset === 'water') {
                mat.diffuse = new pc.Color(0.1, 0.5, 0.9);
                mat.opacity = 0.6; mat.blendType = pc.BLEND_NORMAL;
              } else if (preset === 'stone') {
                mat.diffuse = new pc.Color(0.4, 0.42, 0.45);
                mat.roughness = 0.8;
              } else if (preset === 'wood') {
                mat.diffuse = new pc.Color(0.55, 0.35, 0.15);
                mat.roughness = 0.6;
              }
              mat.update();
              if (target.render) target.render.material = mat;
              target.material = mat;
              this.editor.events.emit('entity:component:changed', target);
              executed.push({ action: act.action, target: `${preset} -> ${target.name}` });
            }
            break;
          }

          case 'create_water_volume': {
            const pos = act.position || [0, 0, 0];
            const ext = act.extents || [10, 2, 10];
            const mat = new pc.StandardMaterial();
            mat.diffuse = new pc.Color(0.1, 0.6, 0.9);
            mat.opacity = 0.65;
            mat.blendType = pc.BLEND_NORMAL;
            mat.update();

            const water = this.editor.createEntity({
              name: act.name || 'Water_Volume',
              transform: { position: pos, scale: ext },
              components: [{ type: 'render', properties: { type: 'box', material: mat } }]
            });
            if (this.editor.behaviors) {
              this.editor.behaviors.attachBehavior(water, 'water_volume', { buoyancyForce: act.buoyancyForce || 15, extents: ext });
            }
            executed.push({ action: act.action, target: water.name });
            break;
          }

          case 'create_hazard_zone': {
            const pos = act.position || [0, 0.1, 0];
            const radius = act.radius || 3.0;
            const mat = new pc.StandardMaterial();
            mat.diffuse = new pc.Color(0.9, 0.1, 0.1);
            mat.emissive = new pc.Color(0.8, 0.2, 0);
            mat.opacity = 0.7;
            mat.blendType = pc.BLEND_NORMAL;
            mat.update();

            const hazard = this.editor.createEntity({
              name: act.name || 'Lava_Hazard_Zone',
              transform: { position: pos, scale: [radius * 2, 0.2, radius * 2] },
              components: [{ type: 'render', properties: { type: 'cylinder', material: mat } }]
            });
            if (this.editor.behaviors) {
              this.editor.behaviors.attachBehavior(hazard, 'lava_hazard', { radius: radius, damage: act.damage || 100 });
            }
            executed.push({ action: act.action, target: hazard.name });
            break;
          }

          case 'create_scene': {
            if (act.name) {
              this.editor.switchScene(act.name);
              executed.push({ action: act.action, target: act.name });
            }
            break;
          }

          case 'switch_scene': {
            if (act.name) {
              this.editor.switchScene(act.name);
              executed.push({ action: act.action, target: act.name });
            }
            break;
          }

          case 'select_entity': {
            const target = this.findTarget(act.target);
            if (target) {
              this.editor.selection.set(target);
              executed.push({ action: act.action, target: target.name });
            }
            break;
          }

          case 'frame_entity': {
            const target = this.findTarget(act.target);
            if (target && this.editor.runtime && this.editor.runtime.editorCamera) {
              this.editor.selection.set(target);
              this.editor.runtime.editorCamera.frameEntity(target);
              executed.push({ action: act.action, target: target.name });
            }
            break;
          }

          case 'configure_anim_blend': {
            const target = this.findTarget(act.target);
            if (target) {
              target.animGraph = {
                defaultState: act.defaultState || 'Idle',
                states: act.states || [{ id: 'Idle', name: 'Idle' }, { id: 'Run', name: 'Run' }],
                transitions: act.transitions || [{ from: 'Idle', to: 'Run', condition: 'speed > 0.1' }, { from: 'Run', to: 'Idle', condition: 'speed <= 0.1' }]
              };
              executed.push({ action: act.action, target: target.name });
            }
            break;
          }

          case 'audit_scene': {
            if (this.editor.auditor || this.editor.sceneAuditor) {
              const auditor = this.editor.auditor || this.editor.sceneAuditor;
              const { issues } = auditor.audit();
              if (act.autoFix) auditor.fixAll(issues);
              executed.push({ action: act.action, target: `Audited ${issues.length} issues` });
            } else {
              executed.push({ action: act.action, target: 'Audit Completed' });
            }
            break;
          }

          case 'consult_skill': {
            executed.push({ action: act.action, target: act.skill || 'Skillbook' });
            break;
          }

          case 'capture_screenshot': {
            const canvas = typeof document !== 'undefined' ? document.getElementById('viewport-canvas') : null;
            if (canvas) {
              const dataUrl = canvas.toDataURL('image/png');
              if (this.editor.assetsPanel) {
                this.editor.assetsPanel.addAsset({
                  id: Date.now().toString(),
                  name: act.name || `AI_Snapshot_${Date.now().toString().slice(-4)}.png`,
                  type: 'textures',
                  icon: '🖼️',
                  size: '180 KB',
                  url: dataUrl,
                  base64Data: dataUrl
                });
              }
            }
            executed.push({ action: act.action, target: act.name || 'Viewport Snapshot' });
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
