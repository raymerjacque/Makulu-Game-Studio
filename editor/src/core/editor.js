import * as pc from 'playcanvas';
import { CommandBus, Command } from './command-bus.js';
import { SelectionManager } from './selection.js';
import { PrefabSystem } from './prefabs.js';
import { TriggerSystem } from './triggers.js';

/**
 * Simple Event Emitter
 */
class EventEmitter {
  constructor() {
    this.events = {};
  }
  on(event, listener) {
    if (!this.events[event]) this.events[event] = [];
    this.events[event].push(listener);
    return () => this.off(event, listener);
  }
  off(event, listener) {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter(l => l !== listener);
  }
  emit(event, ...args) {
    if (!this.events[event]) return;
    this.events[event].forEach(l => l(...args));
  }
}

/**
 * Central Editor Controller
 */
export class Editor {
  constructor() {
    this.events = new EventEmitter();
    this.commandBus = new CommandBus(this);
    this.selection = new SelectionManager(this);
    this.mode = 'simple'; // 'simple' or 'pro'
    this.runtime = null;
    this.projectName = 'Untitled Project';
    this.activeSceneName = 'Main Scene';
    this.scenes = new Map(); // sceneName -> json string

    // Materials and Assets registry
    this.materials = new Map();
    this.scripts = new Map();

    // Prefab and Trigger Subsystems
    this.prefabs = new PrefabSystem(this);
    this.triggers = new TriggerSystem(this);
    this.assetsPanel = null;
  }

  setRuntime(runtime) {
    this.runtime = runtime;
    this.events.emit('runtime:ready', runtime);
  }

  setEditorMode(mode) {
    this.mode = mode;
    this.events.emit('mode:changed', mode);
  }

  getApp() {
    return this.runtime ? this.runtime.app : null;
  }

  /**
   * Create an entity in the scene (Recorded to Command History)
   */
  createEntity(options = {}) {
    const app = this.getApp();
    if (!app) return null;

    const name = options.name || 'New Entity';
    const parent = options.parent || app.root;
    const entity = new pc.Entity(name);

    // Apply transform if provided
    if (options.transform) {
      if (options.transform.position) {
        entity.setPosition(...options.transform.position);
      }
      if (options.transform.rotation) {
        entity.setEulerAngles(...options.transform.rotation);
      }
      if (options.transform.scale) {
        entity.setLocalScale(...options.transform.scale);
      }
    }

    // Apply components
    if (options.components) {
      options.components.forEach(comp => {
        entity.addComponent(comp.type, comp.properties || {});
        if (comp.type === 'render' && comp.material && entity.render) {
          const matData = comp.material;
          const mat = new pc.StandardMaterial();
          if (matData.diffuse) mat.diffuse = new pc.Color(...matData.diffuse);
          if (matData.metalness !== undefined) {
            mat.metalness = matData.metalness;
            mat.useMetalness = true;
          }
          if (matData.roughness !== undefined) mat.roughness = matData.roughness;
          if (matData.opacity !== undefined) {
            mat.opacity = matData.opacity;
            if (mat.opacity < 1.0) mat.blendType = pc.BLEND_NORMAL;
          }
          mat.update();
          entity.render.material = mat;
        }
      });
    }

    // Attach behaviors if provided
    if (options.behaviors && this.behaviors) {
      options.behaviors.forEach(b => {
        this.behaviors.attachBehavior(entity, b.type, b.properties || b.params || {});
      });
    }

    const command = new Command(
      `Create Entity: ${name}`,
      () => {
        parent.addChild(entity);
        this.selection.set(entity);
        this.events.emit('scene:changed');
        return entity;
      },
      () => {
        if (entity.parent) entity.parent.removeChild(entity);
        if (this.selection.getActive() === entity) this.selection.clear();
        this.events.emit('scene:changed');
      }
    );

    return this.commandBus.execute(command);
  }

  /**
   * Load and spawn an authentic 3D GLB/GLTF model into the scene
   */
  async loadModel(url, options = {}) {
    const app = this.getApp();
    if (!app) return null;

    const name = options.name || '3D Model';
    const position = options.position || [0, 0, 0];
    const scale = options.scale || [1, 1, 1];
    const rotation = options.rotation || [0, 0, 0];

    return new Promise((resolve, reject) => {
      app.assets.loadFromUrl(url, 'container', (err, asset) => {
        if (err) {
          console.error(`Failed to load model from ${url}:`, err);
          return reject(err);
        }

        const modelEntity = asset.resource.instantiateRenderEntity({
          castShadows: true,
          receiveShadows: true
        });

        const rootEntity = new pc.Entity(name);
        rootEntity.setPosition(...position);
        rootEntity.setEulerAngles(...rotation);
        rootEntity.setLocalScale(...scale);
        rootEntity.addChild(modelEntity);

        const command = new Command(
          `Spawn 3D Model: ${name}`,
          () => {
            app.root.addChild(rootEntity);
            this.selection.set(rootEntity);
            this.events.emit('scene:changed');
            if (this.runtime && this.runtime.editorCamera) {
              this.runtime.editorCamera.frameEntity(rootEntity);
            }
            return rootEntity;
          },
          () => {
            if (rootEntity.parent) rootEntity.parent.removeChild(rootEntity);
            if (this.selection.getActive() === rootEntity) this.selection.clear();
            this.events.emit('scene:changed');
          }
        );

        const result = this.commandBus.execute(command);
        resolve(result);
      });
    });
  }

  /**
   * Delete selected or given entity
   */
  deleteEntity(entity = null) {
    const target = entity || this.selection.getActive();
    if (!target || target === this.getApp().root) return;

    const parent = target.parent;
    const command = new Command(
      `Delete Entity: ${target.name}`,
      () => {
        if (target.parent) target.parent.removeChild(target);
        if (this.selection.getActive() === target) this.selection.clear();
        this.events.emit('scene:changed');
      },
      () => {
        if (parent) parent.addChild(target);
        this.selection.set(target);
        this.events.emit('scene:changed');
      }
    );

    this.commandBus.execute(command);
  }

  /**
   * Duplicate active entity with all components, materials, and attached behaviors (Recorded to Command History)
   */
  duplicateEntity(entity = null) {
    const target = entity || this.selection.getActive();
    const app = this.getApp();
    if (!target || !app || target === app.root) return null;

    const clone = target.clone();
    clone.name = `${target.name} (Copy)`;
    const pos = target.getPosition().clone().add(new pc.Vec3(1, 0, 0));
    clone.setPosition(pos);

    const parent = target.parent || app.root;

    // Duplicate attached behaviors
    if (this.behaviors && this.behaviors.getBehaviors) {
      const behaviors = this.behaviors.getBehaviors(target);
      behaviors.forEach(b => {
        this.behaviors.attachBehavior(clone, b.type, { ...(b.params || b.properties || {}) });
      });
    }

    const command = new Command(
      `Duplicate Entity: ${target.name}`,
      () => {
        parent.addChild(clone);
        this.selection.set(clone);
        this.events.emit('scene:changed');
        this.events.emit('entity:created', clone);
        return clone;
      },
      () => {
        if (clone.parent) clone.parent.removeChild(clone);
        if (this.selection.getActive() === clone) this.selection.clear();
        this.events.emit('scene:changed');
      }
    );

    return this.commandBus.execute(command);
  }

  /**
   * Commit a transform change from Gizmo to CommandBus
   */
  commitEntityTransform(entity, initial) {
    if (!initial) return;
    const finalPos = entity.getPosition().clone();
    const finalRot = entity.getEulerAngles().clone();
    const finalScale = entity.getLocalScale().clone();

    // Only record if actually moved
    if (finalPos.equals(initial.initialPos) && 
        finalRot.equals(initial.initialRot) && 
        finalScale.equals(initial.initialScale)) {
      return;
    }

    const command = new Command(
      `Transform ${entity.name}`,
      () => {
        entity.setPosition(finalPos);
        entity.setEulerAngles(finalRot);
        entity.setLocalScale(finalScale);
        this.events.emit('entity:transformed', entity);
      },
      () => {
        entity.setPosition(initial.initialPos);
        entity.setEulerAngles(initial.initialRot);
        entity.setLocalScale(initial.initialScale);
        this.events.emit('entity:transformed', entity);
      }
    );

    this.commandBus.undoStack.push(command);
    this.commandBus.redoStack = [];
    this.commandBus.notify('execute', command);
  }

  /**
   * Set Transform directly from Inspector
   */
  setEntityPosition(entity, x, y, z) {
    const oldPos = entity.getPosition().clone();
    entity.setPosition(x, y, z);
    this.events.emit('entity:transformed', entity);
  }

  setEntityRotation(entity, x, y, z) {
    const oldRot = entity.getEulerAngles().clone();
    entity.setEulerAngles(x, y, z);
    this.events.emit('entity:transformed', entity);
  }

  setEntityScale(entity, x, y, z) {
    const oldScale = entity.getLocalScale().clone();
    entity.setLocalScale(x, y, z);
    this.events.emit('entity:transformed', entity);
  }

  /**
   * Add a Component
   */
  addComponent(entity, type, props = {}) {
    if (entity.c && entity.c[type]) return; // already exists

    const command = new Command(
      `Add Component: ${type}`,
      () => {
        entity.addComponent(type, props);
        this.events.emit('entity:component:changed', entity);
      },
      () => {
        entity.removeComponent(type);
        this.events.emit('entity:component:changed', entity);
      }
    );

    this.commandBus.execute(command);
  }

  /**
   * Remove a Component
   */
  removeComponent(entity, type) {
    if (!entity.c || !entity.c[type]) return;

    const savedProps = { ...entity[type] };
    const command = new Command(
      `Remove Component: ${type}`,
      () => {
        entity.removeComponent(type);
        this.events.emit('entity:component:changed', entity);
      },
      () => {
        entity.addComponent(type, savedProps);
        this.events.emit('entity:component:changed', entity);
      }
    );

    this.commandBus.execute(command);
  }

  /**
   * Save Scene to JSON
   */
  exportSceneJSON() {
    const app = this.getApp();
    if (!app) return '{}';

    const serializeNode = (node) => {
      const data = {
        name: node.name,
        enabled: node.enabled,
        position: [node.getPosition().x, node.getPosition().y, node.getPosition().z],
        rotation: [node.getEulerAngles().x, node.getEulerAngles().y, node.getEulerAngles().z],
        scale: [node.getLocalScale().x, node.getLocalScale().y, node.getLocalScale().z],
        components: {},
        children: []
      };

      if (node.render) {
        data.components.render = {
          type: node.render.type,
          castShadows: node.render.castShadows !== false
        };
        if (node.render.material) {
          const mat = node.render.material;
          data.components.render.material = {
            diffuse: mat.diffuse ? [mat.diffuse.r, mat.diffuse.g, mat.diffuse.b] : [1, 1, 1],
            metalness: mat.metalness !== undefined ? mat.metalness : 0.5,
            roughness: mat.roughness !== undefined ? mat.roughness : 0.3,
            opacity: mat.opacity !== undefined ? mat.opacity : 1.0
          };
        }
      }
      if (node.light) {
        data.components.light = {
          type: node.light.type,
          color: [node.light.color.r, node.light.color.g, node.light.color.b],
          intensity: node.light.intensity,
          range: node.light.range,
          castShadows: node.light.castShadows !== false
        };
      }
      if (node.camera) {
        data.components.camera = {
          fov: node.camera.fov,
          nearClip: node.camera.nearClip,
          farClip: node.camera.farClip
        };
      }
      if (node.collision) {
        data.components.collision = {
          type: node.collision.type || 'box',
          radius: node.collision.radius || 0.5,
          height: node.collision.height || 2
        };
      }
      if (node.rigidbody) {
        data.components.rigidbody = {
          type: node.rigidbody.type || 'static',
          mass: node.rigidbody.mass || 1,
          restitution: node.rigidbody.restitution || 0.5,
          friction: node.rigidbody.friction || 0.5
        };
      }
      if (node.particlesystem) {
        data.components.particlesystem = {
          numParticles: node.particlesystem.numParticles || 60,
          lifetime: node.particlesystem.lifetime || 1.5
        };
      }
      if (node.sound) {
        data.components.sound = {
          volume: node.sound.volume || 1,
          pitch: node.sound.pitch || 1,
          loop: node.sound.loop !== false
        };
      }
      if (node.script) {
        data.components.script = {
          enabled: true
        };
      }

      // Check for attached behaviors
      if (this.behaviors) {
        const blist = this.behaviors.getBehaviors ? this.behaviors.getBehaviors(node) : (this.behaviors.activeBehaviors?.get(node) || []);
        if (blist && blist.length > 0) {
          data.behaviors = blist.map(b => ({
            type: b.type,
            properties: b.params || b.properties || {}
          }));
        }
      }

      node.children.forEach(child => {
        if (child.name !== 'EditorGrid' && child.name !== 'EditorCamera') {
          data.children.push(serializeNode(child));
        }
      });

      return data;
    };

    const sceneData = {
      project: this.projectName,
      scene: this.activeSceneName,
      root: serializeNode(app.root)
    };

    return JSON.stringify(sceneData, null, 2);
  }

  /**
   * Import and Deserialize Scene JSON
   */
  loadSceneJSON(jsonData) {
    const app = this.getApp();
    if (!app || !app.root) return false;

    try {
      const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
      if (data.project) this.projectName = data.project;
      if (data.scene) this.activeSceneName = data.scene;

      // Clear existing user entities (keep EditorGrid and EditorCamera)
      const toRemove = [];
      app.root.children.forEach(c => {
        if (c.name !== 'EditorGrid' && c.name !== 'EditorCamera') {
          toRemove.push(c);
        }
      });
      toRemove.forEach(c => app.root.removeChild(c));

      const buildNode = (nodeData, parent) => {
        const ent = new pc.Entity(nodeData.name);
        if (nodeData.position) ent.setPosition(...nodeData.position);
        if (nodeData.rotation) ent.setEulerAngles(...nodeData.rotation);
        if (nodeData.scale) ent.setLocalScale(...nodeData.scale);
        ent.enabled = nodeData.enabled !== false;

        if (nodeData.components) {
          if (nodeData.components.render) {
            ent.addComponent('render', {
              type: nodeData.components.render.type || 'box',
              castShadows: nodeData.components.render.castShadows !== false
            });
            if (nodeData.components.render.material) {
              const matData = nodeData.components.render.material;
              const mat = new pc.StandardMaterial();
              if (matData.diffuse) mat.diffuse = new pc.Color(...matData.diffuse);
              if (matData.metalness !== undefined) {
                mat.metalness = matData.metalness;
                mat.useMetalness = true;
              }
              if (matData.roughness !== undefined) mat.roughness = matData.roughness;
              if (matData.opacity !== undefined) {
                mat.opacity = matData.opacity;
                if (mat.opacity < 1.0) mat.blendType = pc.BLEND_NORMAL;
              }
              mat.update();
              ent.render.material = mat;
            }
          }
          if (nodeData.components.light) {
            const l = nodeData.components.light;
            ent.addComponent('light', {
              type: l.type || 'point',
              color: l.color ? new pc.Color(...l.color) : new pc.Color(1, 1, 1),
              intensity: l.intensity !== undefined ? l.intensity : 2,
              range: l.range !== undefined ? l.range : 10,
              castShadows: l.castShadows !== false
            });
          }
          if (nodeData.components.camera) {
            ent.addComponent('camera', {
              fov: nodeData.components.camera.fov || 60,
              nearClip: nodeData.components.camera.nearClip || 0.1,
              farClip: nodeData.components.camera.farClip || 1000
            });
          }
          if (nodeData.components.collision) {
            const col = nodeData.components.collision;
            ent.addComponent('collision', {
              type: col.type || 'box',
              radius: col.radius || 0.5,
              height: col.height || 2
            });
          }
          if (nodeData.components.rigidbody) {
            const rb = nodeData.components.rigidbody;
            ent.addComponent('rigidbody', {
              type: rb.type || 'static',
              mass: rb.mass || 1,
              restitution: rb.restitution || 0.5,
              friction: rb.friction || 0.5
            });
          }
          if (nodeData.components.particlesystem) {
            ent.addComponent('particlesystem', {
              numParticles: nodeData.components.particlesystem.numParticles || 60,
              lifetime: nodeData.components.particlesystem.lifetime || 1.5
            });
          }
          if (nodeData.components.sound) {
            ent.addComponent('sound', {
              volume: nodeData.components.sound.volume !== undefined ? nodeData.components.sound.volume : 1,
              pitch: nodeData.components.sound.pitch !== undefined ? nodeData.components.sound.pitch : 1,
              loop: nodeData.components.sound.loop !== false
            });
          }
          if (nodeData.components.script) {
            ent.addComponent('script');
          }
        }

        if (nodeData.behaviors && this.behaviors) {
          nodeData.behaviors.forEach(b => {
            this.behaviors.attachBehavior(ent, b.type, b.properties || b.params || {});
          });
        }

        parent.addChild(ent);

        if (nodeData.children) {
          nodeData.children.forEach(childData => buildNode(childData, ent));
        }

        return ent;
      };

      if (data.root && data.root.children) {
        data.root.children.forEach(childData => buildNode(childData, app.root));
      }

      this.selection.clear();
      this.events.emit('scene:changed');
      return true;
    } catch (err) {
      console.error('Editor: Failed to load scene JSON:', err);
      return false;
    }
  }

  /**
   * Switch between multi-scenes, automatically saving current state and restoring target scene
   */
  switchScene(sceneName) {
    if (!sceneName || sceneName === this.activeSceneName) return;

    // 1. Snapshot and store the outgoing scene state
    const currentSceneJSON = this.saveSceneJSON();
    this.scenes.set(this.activeSceneName, currentSceneJSON);

    // 2. Load target scene if previously stored
    if (this.scenes.has(sceneName)) {
      this.loadSceneJSON(this.scenes.get(sceneName));
      this.activeSceneName = sceneName;
    } else {
      // Create new clean scene
      this.activeSceneName = sceneName;
      const app = this.getApp();
      if (app && app.root) {
        const toRemove = [];
        app.root.children.forEach(c => {
          if (c.name !== 'EditorGrid' && c.name !== 'EditorCamera') {
            toRemove.push(c);
          }
        });
        toRemove.forEach(c => app.root.removeChild(c));
        this.selection.clear();
        this.events.emit('scene:changed');
      }
      this.scenes.set(sceneName, this.saveSceneJSON());
    }
  }
}
