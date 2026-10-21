import * as pc from 'playcanvas';
import { CommandBus, Command } from './command-bus.js';
import { SelectionManager } from './selection.js';

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

    // Materials and Assets registry
    this.materials = new Map();
    this.scripts = new Map();
  }

  setRuntime(runtime) {
    this.runtime = runtime;
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
   * Duplicate active entity
   */
  duplicateEntity(entity = null) {
    const target = entity || this.selection.getActive();
    if (!target || target === this.getApp().root) return null;

    const clone = target.clone();
    clone.name = `${target.name} (Copy)`;
    const pos = target.getPosition().clone().add(new pc.Vec3(1, 0, 0));
    clone.setPosition(pos);

    return this.createEntity({
      name: clone.name,
      parent: target.parent
    });
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
        data.components.render = { type: node.render.type };
      }
      if (node.light) {
        data.components.light = {
          type: node.light.type,
          color: [node.light.color.r, node.light.color.g, node.light.color.b],
          intensity: node.light.intensity,
          range: node.light.range
        };
      }
      if (node.camera) {
        data.components.camera = {
          fov: node.camera.fov,
          nearClip: node.camera.nearClip,
          farClip: node.camera.farClip
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
          loop: node.sound.loop !== false
        };
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
            ent.addComponent('render', { type: nodeData.components.render.type || 'box' });
          }
          if (nodeData.components.light) {
            const l = nodeData.components.light;
            ent.addComponent('light', {
              type: l.type || 'point',
              color: l.color ? new pc.Color(...l.color) : new pc.Color(1, 1, 1),
              intensity: l.intensity || 2,
              range: l.range || 10,
              castShadows: true
            });
          }
          if (nodeData.components.camera) {
            ent.addComponent('camera', {
              fov: nodeData.components.camera.fov || 60,
              nearClip: nodeData.components.camera.nearClip || 0.1,
              farClip: nodeData.components.camera.farClip || 1000
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
              volume: nodeData.components.sound.volume || 1,
              loop: nodeData.components.sound.loop !== false
            });
          }
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
}
