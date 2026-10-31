import { serializeSoundComponent, queueSoundSlots, validateSoundData } from '../engine/sound-data.js';
import * as pc from 'playcanvas';
import { CommandBus, Command } from './command-bus.js';
import { SelectionManager } from './selection.js';
import { PrefabSystem } from './prefabs.js';
import { TriggerSystem } from './triggers.js';
import { applyTerrainMesh } from '../engine/terrain-data.js';
import { ResourceLoadSession } from '../project/resource-load-session.js';
import { PROJECT_FORMAT, PROJECT_VERSION, newDocumentId, parseProjectDocument, validateSceneData, serializeAssetRegistry, resolvePortableReferences } from '../project/project-document.js';

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
    this.root = new pc.Entity('Root');
    this.projectName = 'Untitled Project';
    this.projectId = newDocumentId();
    this.sceneIds = new Map([['Main Scene', newDocumentId()]]);
    this.projectAssets = [];
    this.lastProjectError = null;
    this.activeSceneName = 'Main Scene';
    this.scenes = new Map([[this.activeSceneName, null]]); // sceneName -> json string

    // Materials and Assets registry
    this.materials = new Map();
    this.scripts = new Map();

    // Prefab and Trigger Subsystems
    this.prefabs = new PrefabSystem(this);
    this.triggers = new TriggerSystem(this);
    this.assetsPanel = null;

    // Default 2D Screen UI HUD Configuration
    this.hudConfig = {
      health: { enabled: true, label: 'HP', max: 100, color: '#ef4444' },
      stamina: { enabled: true, label: 'STAMINA', max: 100, color: '#eab308' },
      score: { enabled: true, label: 'Score:', initial: 0 },
      crosshair: { enabled: true, style: 'dot' },
      gameOver: { enabled: true, title: 'GAME OVER', message: 'Your health reached 0. Press Restart to try again.' },
      victory: { enabled: true, title: '🏆 VICTORY!', message: 'Congratulations! You completed the level!' },
      keys: { enabled: true },
      jetpack: { enabled: true }
    };
    this.defaultHudConfig = JSON.parse(JSON.stringify(this.hudConfig));
    this.events.on('game:play', () => this.playSceneAudio());
    this.events.on('game:stop', () => this.getApp()?.root.forEach(node => node.sound?.stop?.()));
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

    const name = options.name || 'New Entity';
    const parent = options.parent || (app ? app.root : this.root);
    const entity = new pc.Entity(name);

    entity.locked = Boolean(options.locked);
    entity.tags.add(...(options.tags || []));

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
        try {
          entity.addComponent(comp.type, comp.properties || {});
        } catch (e) {
          entity[comp.type] = comp.properties || { enabled: true };
        }
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
        if (parent) parent.addChild(entity);
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
    const name = options.name || '3D Model';
    const position = options.position || [0, 0, 0];
    const scale = options.scale || [1, 1, 1];
    const rotation = options.rotation || [0, 0, 0];

    if (!app || !app.assets) {
      const rootEntity = this.createEntity({
        name,
        transform: { position, rotation, scale }
      });
      rootEntity._modelUrl = url;
      return rootEntity;
    }

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
        rootEntity._modelUrl = url;
        rootEntity.setPosition(...position);
        rootEntity.setEulerAngles(...rotation);
        rootEntity.setLocalScale(...scale);
        modelEntity._studioModelInstance = true;
        rootEntity.addChild(modelEntity);

        // Auto-configure skeletal animations if present in GLB container
        if (asset.resource && asset.resource.animations && asset.resource.animations.length > 0) {
          this.setupModelAnimations(rootEntity, modelEntity, asset.resource.animations);
        }

        const command = new Command(
          `Spawn 3D Model: ${name}`,
          () => {
            app.root.addChild(rootEntity);
            this.selection.set(rootEntity);
            this.events.emit('scene:changed');
            this.events.emit('entity:created', rootEntity);
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
   * Auto-rig skeletal animations from GLB container asset onto model entity
   * Creates an AnimStateGraph, assigns all tracks, and maps Idle/Walk/Run locomotion
   */
  setupModelAnimations(rootEntity, modelEntity, animations) {
    if (!animations || animations.length === 0) return null;

    try {
      const animNames = animations.map(a => a.name);
      rootEntity._modelAnimations = animNames;

      // Detect standard character movement and idle animation tracks
      const idleClip = animNames.find(n => /idle|stand|survey|breath/i.test(n)) || animNames[0];
      const walkClip = animNames.find(n => /walk|stride/i.test(n)) || animNames.find(n => /move|run|sprint/i.test(n)) || animNames[0];
      const runClip = animNames.find(n => /sprint|run|fast/i.test(n)) || walkClip;

      rootEntity._idleClip = idleClip;
      rootEntity._walkClip = walkClip;
      rootEntity._runClip = runClip;

      if (typeof pc !== 'undefined' && pc.AnimStateGraph) {
        const states = [
          { name: 'START', speed: 1 },
          ...animNames.map(name => ({
            name: name,
            speed: 1,
            loop: true,
            defaultState: (name === idleClip)
          }))
        ];

        const transitions = [
          { from: 'START', to: idleClip }
        ];

        const stateGraph = new pc.AnimStateGraph({
          layers: [{
            name: 'Base',
            states: states,
            transitions: transitions
          }],
          parameters: {
            speed: { name: 'speed', type: 'FLOAT', value: 0 }
          }
        });

        modelEntity.addComponent('anim', {
          activate: true,
          speed: 1.0
        });

        modelEntity.anim.loadStateGraph(stateGraph);

        animations.forEach(animAsset => {
          if (animAsset && animAsset.resource) {
            modelEntity.anim.assignAnimation(animAsset.name, animAsset.resource);
          }
        });

        rootEntity._animComp = modelEntity.anim;
        rootEntity.anim = modelEntity.anim;

        // Auto-play default idle animation so characters are alive immediately
        if (modelEntity.anim && modelEntity.anim.baseLayer) {
          modelEntity.anim.baseLayer.play(idleClip);
        }
      }
      return modelEntity.anim || null;
    } catch (e) {
      console.warn('Could not auto-configure skeletal animation:', e);
      return null;
    }
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
    if (!target) return null;
    const app = this.getApp();
    const root = app ? app.root : this.root;
    if (target === root) return null;

    let clone;
    try {
      clone = target.clone();
      clone.name = `${target.name} (Copy)`;
    } catch (e) {
      throw new Error('Entity could not be duplicated without losing component data.');
    }
    if (target._modelUrl) {
      clone._modelUrl = target._modelUrl;
    }
    const copyResourceMetadata = (source, copy) => {
      if (source._studioModelInstance) copy._studioModelInstance = true;
      if (source._modelUrl) copy._modelUrl = source._modelUrl;
      if (source._terrainData) {
        const material = copy.render?.material?.clone();
        if (copy.collision) copy.removeComponent('collision');
        if (copy.render) copy.removeComponent('render');
        applyTerrainMesh(pc, app, copy, source._terrainData);
        if (material) { copy.render.material = material; copy.once('destroy', () => material.destroy()); }
        if (source.collision) copy.addComponent('collision', { type: 'mesh', model: copy._terrainCollisionModel });
      }
      if (source.sound && copy.sound) {
        for (const field of ['_studioSlotSources', '_studioSlotAutoPlay', '_studioSlotDurations']) if (source.sound[field]) copy.sound[field] = JSON.parse(JSON.stringify(source.sound[field]));
        for (const field of ['assetUrl', 'loop', 'autoPlay', 'minDistance']) if (source.sound[field] !== undefined) copy.sound[field] = source.sound[field];
      }
      source.children.forEach((child, index) => { if (copy.children[index]) copyResourceMetadata(child, copy.children[index]); });
    };
    copyResourceMetadata(target, clone);
    const pos = target.getPosition().clone().add(new pc.Vec3(1, 0, 0));
    clone.setPosition(pos);

    const parent = target.parent || root;

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

    const initialPos = initial.initialPos || finalPos.clone();
    const initialRot = initial.initialRot || finalRot.clone();
    const initialScale = initial.initialScale || finalScale.clone();

    // Only record if actually moved or scaled
    if (finalPos.equals(initialPos) && 
        finalRot.equals(initialRot) && 
        finalScale.equals(initialScale)) {
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
        entity.setPosition(initialPos);
        entity.setEulerAngles(initialRot);
        entity.setLocalScale(initialScale);
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
    if (!entity) return;
    if (entity.c && entity.c[type]) return; // already exists

    const command = new Command(
      `Add Component: ${type}`,
      () => {
        try {
          entity.addComponent(type, props);
        } catch (e) {
          entity[type] = props || { enabled: true };
        }
        this.events.emit('entity:component:changed', entity);
      },
      () => {
        try {
          entity.removeComponent(type);
        } catch (e) {
          delete entity[type];
        }
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

  /** Editable project document; exported games continue using the scene API. */
  exportProjectJSON() {
    if (this.isPlaying) throw new Error('Stop the play session before saving the editable project.');
    const active = JSON.parse(this.exportSceneJSON());
    const snapshots = new Map(this.scenes);
    snapshots.set(this.activeSceneName, JSON.stringify(active));
    const assets = serializeAssetRegistry(this.assetsPanel?.assets || this.projectAssets);
    const scripts = Object.fromEntries(this.scripts);
    const scenes = [...snapshots].map(([name, snapshot]) => {
      const data = typeof snapshot === 'string' ? JSON.parse(snapshot) : snapshot;
      if (!data) throw new Error(`Scene ${name} has no saved content.`);
      data.scene = name;
      delete data.scripts; // Script source belongs to the authoritative project-wide registry.
      if (!this.sceneIds.has(name)) this.sceneIds.set(name, newDocumentId());
      return { id: this.sceneIds.get(name), name, data };
    });
    const settings = {};
    for (const key of ['shadowResolution', 'clusteredLightingSettings', 'audioVolumes', 'textureCompressionSettings']) {
      if (this[key] !== undefined) settings[key] = this[key];
    }
    const document = {
      format: PROJECT_FORMAT, schemaVersion: PROJECT_VERSION, id: this.projectId,
      name: this.projectName, engineVersion: pc.version,
      activeSceneId: this.sceneIds.get(this.activeSceneName), scenes, scripts, assets,
      prefabs: [...this.prefabs.prefabs].map(([id, data]) => ({ id, data })), settings
    };
    resolvePortableReferences(document, this.assetsPanel?.assets || this.projectAssets);
    return JSON.stringify(parseProjectDocument(document), null, 2);
  }

  /** Validate every scene before replacing the current project. Does not execute imported scripts. */
  loadProjectJSON(input, { assetTimeoutMs = 30000 } = {}) {
    try {
      if (this.isPlaying) throw new Error('Stop the play session before opening a project.');
      const document = parseProjectDocument(input);
      const active = document.scenes.find(scene => scene.id === document.activeSceneId);
      if (!this.loadSceneJSON(active.data, { assetTimeoutMs })) throw new Error(this.lastProjectError || 'Could not restore the active scene.');
      this.projectId = document.id;
      this.projectName = document.name;
      this.activeSceneName = active.name;
      this.scenes = new Map(document.scenes.map(scene => [scene.name, JSON.stringify({ ...scene.data, scene: scene.name })]));
      this.sceneIds = new Map(document.scenes.map(scene => [scene.name, scene.id]));
      this.scripts = new Map(Object.entries(document.scripts));
      this.projectAssets = document.assets;
      this.prefabs.prefabs = new Map(document.prefabs.map(prefab => [prefab.id, prefab.data]));
      for (const key of ['shadowResolution', 'clusteredLightingSettings', 'audioVolumes', 'textureCompressionSettings']) {
        this[key] = document.settings[key] ?? (key === 'textureCompressionSettings' ? active.data.textureCompression : undefined);
      }
      if (this.assetsPanel) {
        this.assetsPanel.assets = document.assets;
        this.assetsPanel.renderAssetCards();
      }
      this.commandBus.clear();
      this.lastProjectError = null;
      this.events.emit('scene:list:changed', [...this.scenes.keys()]);
      this.events.emit('project:loaded', document);
      return true;
    } catch (err) {
      this.lastProjectError = err.message;
      this.events.emit('project:load:error', err.message);
      return false;
    }
  }

  /** Wait for the active scene's registered model/texture requests, with truthful failure/cancel status. */
  async openProjectJSON(input, options = {}) {
    if (!this.loadProjectJSON(input, options)) {
      return { status: 'invalid', dataLoaded: false, message: this.lastProjectError };
    }
    const session = this.sceneResourceSession;
    const report = await session.done;
    // A later open/switch supersedes this operation even if its requests already settled.
    if (session !== this.sceneResourceSession) return { ...report, status: 'cancelled', dataLoaded: true };
    this.lastProjectError = report.status === 'failed' ? `${report.failures.length} scene resource(s) could not be loaded.` : null;
    this.events.emit('project:resources:settled', report);
    return { ...report, dataLoaded: true };
  }

  async retrySceneResources(options = {}) {
    if (this.isPlaying) return { status: 'invalid', message: 'Stop play before retrying scene resources.' };
    if (!this.loadSceneJSON(this.exportSceneJSON(), { ...options, restoreScripts: false, restoreProjectName: false })) {
      return { status: 'invalid', message: this.lastProjectError };
    }
    this.commandBus.clear();
    const session = this.sceneResourceSession;
    const report = await session.done;
    return session === this.sceneResourceSession ? report : { ...report, status: 'cancelled' };
  }

  async configureSound(entity, data, { assetTimeoutMs = 30000 } = {}) {
    validateSoundData(data);
    if (this.isPlaying || this.sceneResourceStatus?.status === 'loading') throw new Error('Stop play and wait for current resources before configuring sound.');
    if (!entity.sound) this.addComponent(entity, 'sound', {});
    const sound = entity.sound;
    for (const field of ['volume', 'pitch', 'positional', 'maxDistance', 'rollOffFactor', 'distanceModel']) if (data[field] !== undefined) sound[field] = data[field];
    sound.refDistance = data.minDistance ?? data.refDistance ?? sound.refDistance;
    sound.minDistance = sound.refDistance;
    const session = new ResourceLoadSession({ timeoutMs: assetTimeoutMs, onChange: report => {
      if (this.sceneResourceSession === session) { this.sceneResourceStatus = report; this.events.emit('scene:resources', report); }
    } });
    entity._studioId ||= newDocumentId();
    // Configuring one source must not erase failures for other scene resources.
    for (const failure of this.sceneResourceStatus?.failures || []) {
      if (failure.entityId === entity._studioId && failure.kind.startsWith('audio:')) continue;
      if (failure.entityId && !this.getApp()?.root.findOne(node => node._studioId === failure.entityId)) continue;
      session.add(failure, done => done('retained-failure'), () => {});
    }
    queueSoundSlots(entity, data, this.getApp(), session);
    this.sceneResourceSession?.cancel(); this.sceneResourceSession = session;
    this.events.emit('entity:component:changed', entity);
    return session.start();
  }

  playSceneAudio() {
    const app = this.getApp();
    if (!app || this.sceneResourceStatus?.status === 'loading' || this.sceneResourceStatus?.status === 'failed') return;
    const camera = app.root.findOne(node => node.camera?.enabled);
    if (camera && !app.root.findOne(node => node.audiolistener) && app.systems?.audiolistener) camera.addComponent('audiolistener');
    app.root.forEach(node => {
      if (!node.enabled || !node.sound?.enabled) return;
      for (const slot of Object.values(node.sound.slots || {})) {
        if (node.sound._studioSlotAutoPlay?.[slot.name] || slot.autoPlay) node.sound.play(slot.name);
      }
    });
  }

  /**
   * Save Scene to JSON
   */
  exportSceneJSON() {
    const app = this.getApp();

    const serializeNode = (node) => {
      if (!node) return { children: [] };
      const data = {
        name: node.name,
        enabled: node.enabled,
        locked: Boolean(node.locked),
        tags: node.tags?.list ? node.tags.list() : Array.from(node.tags || []),
        id: node._studioId || (node._studioId = newDocumentId()),
        localPosition: [node.getLocalPosition().x, node.getLocalPosition().y, node.getLocalPosition().z],
        localRotation: [node.getLocalEulerAngles().x, node.getLocalEulerAngles().y, node.getLocalEulerAngles().z],
        position: [node.getPosition().x, node.getPosition().y, node.getPosition().z],
        rotation: [node.getEulerAngles().x, node.getEulerAngles().y, node.getEulerAngles().z],
        scale: [node.getLocalScale().x, node.getLocalScale().y, node.getLocalScale().z],
        components: {},
        children: []
      };

      if (node._terrainData) data.terrain = node._terrainData;
      if (node.scriptData) data.scriptData = node.scriptData;

      if (node._modelUrl) {
        data.modelUrl = node._modelUrl;
      }

      if (node.render) {
        data.components.render = {
          type: node.render.type,
          castShadows: node.render.castShadows !== false
        };
        if (node.render.material) {
          const mat = node.render.material;
          data.components.render.material = {
            diffuse: mat.diffuse ? [mat.diffuse.r, mat.diffuse.g, mat.diffuse.b] : [1, 1, 1],
            emissive: mat.emissive ? [mat.emissive.r, mat.emissive.g, mat.emissive.b] : [0, 0, 0],
            metalness: mat.metalness !== undefined ? mat.metalness : 0.5,
            roughness: mat.roughness !== undefined ? mat.roughness : 0.3,
            gloss: mat.gloss, glossInvert: Boolean(mat.glossInvert), diffuseMapVertexColor: Boolean(mat.diffuseMapVertexColor),
            opacity: mat.opacity !== undefined ? mat.opacity : 1.0,
            diffuseMapUrl: mat._diffuseMapUrl || null,
            normalMapUrl: mat._normalMapUrl || null,
            roughnessMapUrl: mat._roughnessMapUrl || null,
            emissiveMapUrl: mat._emissiveMapUrl || null
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
          height: node.collision.height ?? 2,
          halfExtents: node.collision.halfExtents ? [node.collision.halfExtents.x, node.collision.halfExtents.y, node.collision.halfExtents.z] : [0.5, 0.5, 0.5],
          group: node.collision.group !== undefined ? node.collision.group : 1,
          mask: node.collision.mask !== undefined ? node.collision.mask : 65535
        };
      }
      if (node.rigidbody) {
        data.components.rigidbody = {
          type: node.rigidbody.type || 'static',
          mass: node.rigidbody.mass ?? 1,
          restitution: node.rigidbody.restitution !== undefined ? node.rigidbody.restitution : 0.5,
          friction: node.rigidbody.friction !== undefined ? node.rigidbody.friction : 0.5,
          group: node.rigidbody.group !== undefined ? node.rigidbody.group : 1,
          mask: node.rigidbody.mask !== undefined ? node.rigidbody.mask : 65535,
          linearFactor: node.rigidbody.linearFactor ? [node.rigidbody.linearFactor.x, node.rigidbody.linearFactor.y, node.rigidbody.linearFactor.z] : [1, 1, 1],
          angularFactor: node.rigidbody.angularFactor ? [node.rigidbody.angularFactor.x, node.rigidbody.angularFactor.y, node.rigidbody.angularFactor.z] : [1, 1, 1]
        };
      }
      if (node.joint) {
        data.components.joint = {
          type: node.joint.type || 'hinge',
          targetEntity: node.joint.targetEntity || '',
          pivot: node.joint.pivot || [0, 0, 0],
          axis: node.joint.axis || [0, 1, 0]
        };
      }
      if (node.animGraph) {
        data.animGraph = node.animGraph;
      }
      if (node.particlesystem) {
        data.components.particlesystem = {
          numParticles: node.particlesystem.numParticles || 60,
          lifetime: node.particlesystem.lifetime || 1.5,
          rate: node.particlesystem.rate || 0.05,
          particleScale: node.particlesystem.particleScale || 0.5,
          colorTint: node.particlesystem.colorTint || [1, 0.4, 0]
        };
      }
      if (node.sound) {
        data.components.sound = serializeSoundComponent(node.sound, app?.assets);
      }
      if (node.script) {
        data.components.script = {
          enabled: true,
          attributes: node.scriptData || {}
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
        if (child.name !== 'EditorGrid' && child.name !== 'EditorCamera' && !child._studioModelInstance) {
          data.children.push(serializeNode(child));
        }
      });

      return data;
    };

    // Serialize triggers
    const triggersData = {};
    if (this.triggers && this.triggers.triggers) {
      for (const [entityName, config] of this.triggers.triggers.entries()) {
        triggersData[entityName] = config;
      }
    }

    // Serialize scripts
    const scriptsData = {};
    if (this.scripts) {
      for (const [name, code] of this.scripts.entries()) {
        scriptsData[name] = code;
      }
    }

    const rootNode = app ? app.root : this.root;
    const sceneData = {
      sceneFormatVersion: 1,
      project: this.projectName,
      scene: this.activeSceneName,
      atmosphere: this.runtime ? this.runtime.currentAtmosphere || 'day' : 'day',
      postProcessing: this.postProcessingConfig || null,
      gravity: (app && app.systems && app.systems.rigidbody && app.systems.rigidbody.gravity) ? [app.systems.rigidbody.gravity.x, app.systems.rigidbody.gravity.y, app.systems.rigidbody.gravity.z] : [0, -9.8, 0],
      textureCompression: this.textureCompressionSettings || { targetFormat: 'auto', qualityLevel: 'normal', maxAnisotropy: 4, generateMipmaps: true },
      animGraph: this.animGraph || null,
      hud: this.hudConfig,
      triggers: triggersData,
      scripts: scriptsData,
      root: serializeNode(rootNode)
    };

    return JSON.stringify(sceneData, null, 2);
  }

  /**
   * Import and Deserialize Scene JSON
   */
  loadSceneJSON(jsonData, { restoreScripts = true, restoreProjectName = true, assetTimeoutMs = 30000 } = {}) {
    const staging = new pc.Entity('SceneImportStaging');
    let session;
    try {
      const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
      validateSceneData(data);
      session = new ResourceLoadSession({ timeoutMs: assetTimeoutMs, onChange: report => {
        if (session === this.sceneResourceSession) {
          this.sceneResourceStatus = report;
          this.events.emit('scene:resources', report);
        }
      } });
      const app = this.getApp();
      const appRoot = app ? app.root : this.root;
      if (!appRoot) return true;

      const buildNode = (nodeData, parent) => {
        const ent = new pc.Entity(nodeData.name);
        ent.locked = Boolean(nodeData.locked);
        ent._studioId = nodeData.id || newDocumentId();
        ent.tags.add(...(nodeData.tags || []));
        parent.addChild(ent);
        if (nodeData.localPosition) ent.setLocalPosition(...nodeData.localPosition);
        else if (nodeData.position) ent.setPosition(...nodeData.position);
        if (nodeData.localRotation) ent.setLocalEulerAngles(...nodeData.localRotation);
        else if (nodeData.rotation) ent.setEulerAngles(...nodeData.rotation);
        if (nodeData.scriptData) ent.scriptData = nodeData.scriptData;
        if (nodeData.scale) ent.setLocalScale(...nodeData.scale);
        ent.enabled = nodeData.enabled !== false;

        if (nodeData.terrain) applyTerrainMesh(pc, app, ent, nodeData.terrain);

        if (nodeData.modelUrl) {
          ent._modelUrl = nodeData.modelUrl;
          session.add({ entityId: ent._studioId, entityName: ent.name, kind: 'model' },
            done => {
              if (!app?.assets) { done('no-asset-loader'); return; }
              app.assets.loadFromUrl(nodeData.modelUrl, 'container', done);
            },
            resource => {
              const modelEntity = resource.instantiateRenderEntity({ castShadows: true, receiveShadows: true });
              modelEntity._studioModelInstance = true;
              ent.addChild(modelEntity);
              if (resource.animations?.length) this.setupModelAnimations(ent, modelEntity, resource.animations);
            });
        }

        if (nodeData.components) {
          if (nodeData.components.render) {
            if (!nodeData.terrain) ent.addComponent('render', {
              type: nodeData.components.render.type || 'box',
              castShadows: nodeData.components.render.castShadows !== false
            });
            if (nodeData.components.render.material) {
              const matData = nodeData.components.render.material;
              const mat = new pc.StandardMaterial();
              if (nodeData.terrain) mat.diffuseMapVertexColor = true;
              if (matData.diffuse) mat.diffuse = new pc.Color(...matData.diffuse);
              if (matData.emissive) mat.emissive = new pc.Color(...matData.emissive);
              if (matData.metalness !== undefined) {
                mat.metalness = matData.metalness;
                mat.useMetalness = true;
              }
              if (matData.roughness !== undefined) mat.roughness = matData.roughness;
              if (matData.gloss !== undefined) mat.gloss = matData.gloss;
              if (matData.glossInvert !== undefined) mat.glossInvert = matData.glossInvert;
              if (matData.diffuseMapVertexColor !== undefined) mat.diffuseMapVertexColor = matData.diffuseMapVertexColor;
              if (matData.opacity !== undefined) {
                mat.opacity = matData.opacity;
                if (mat.opacity < 1.0) mat.blendType = pc.BLEND_NORMAL;
              }
              for (const [field, property] of [['diffuseMapUrl', 'diffuseMap'], ['normalMapUrl', 'normalMap'], ['roughnessMapUrl', 'glossMap'], ['emissiveMapUrl', 'emissiveMap']]) {
                if (!matData[field]) continue;
                mat[`_${field}`] = matData[field];
                session.add({ entityId: ent._studioId, entityName: ent.name, kind: field },
                  done => {
                    if (!app?.assets) { done('no-asset-loader'); return; }
                    app.assets.loadFromUrl(matData[field], 'texture', done);
                  },
                  texture => {
                    mat[property] = texture;
                    if (field === 'roughnessMapUrl') { mat.glossInvert = true; mat.gloss = 1; }
                    mat.update();
                  });
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
              ...(nodeData.terrain && col.type === 'mesh' ? { model: ent._terrainCollisionModel } : {}),
              radius: col.radius || 0.5,
              height: col.height ?? 2,
              halfExtents: col.halfExtents ? new pc.Vec3(...col.halfExtents) : new pc.Vec3(0.5, 0.5, 0.5)
            });
            if (col.group !== undefined) ent.collision.group = col.group;
            if (col.mask !== undefined) ent.collision.mask = col.mask;
          }
          if (nodeData.components.rigidbody) {
            const rb = nodeData.components.rigidbody;
            ent.addComponent('rigidbody', {
              type: rb.type || 'static',
              mass: rb.mass ?? 1,
              restitution: rb.restitution ?? 0.5,
              friction: rb.friction ?? 0.5,
              linearFactor: rb.linearFactor ? new pc.Vec3(...rb.linearFactor) : new pc.Vec3(1, 1, 1),
              angularFactor: rb.angularFactor ? new pc.Vec3(...rb.angularFactor) : new pc.Vec3(1, 1, 1)
            });
            if (rb.group !== undefined) ent.rigidbody.group = rb.group;
            if (rb.mask !== undefined) ent.rigidbody.mask = rb.mask;
          }
          if (nodeData.animGraph) {
            ent.animGraph = nodeData.animGraph;
          }
          if (nodeData.components.joint) {
            ent.joint = nodeData.components.joint;
            try {
              ent.addComponent('joint');
            } catch (e) {
              // Virtual component handled in runtime helpers
            }
          }
          if (nodeData.components.particlesystem) {
            const ps = nodeData.components.particlesystem;
            const pScale = ps.particleScale !== undefined ? ps.particleScale : 0.5;
            ent.addComponent('particlesystem', {
              numParticles: ps.numParticles || 60,
              lifetime: ps.lifetime || 1.5,
              rate: ps.rate || 0.05,
              scaleGraph: new pc.Curve([0, pScale]),
              colorGraph: ps.colorTint ? new pc.CurveSet([[0, ps.colorTint[0]], [0, ps.colorTint[1]], [0, ps.colorTint[2]]]) : null
            });
            if (ent.particlesystem) {
              ent.particlesystem.particleScale = pScale;
              if (ps.colorTint) ent.particlesystem.colorTint = ps.colorTint;
            }
          }
          if (nodeData.components.sound) {
            const snd = nodeData.components.sound;
            ent.addComponent('sound', {
              enabled: snd.enabled !== false, positional: snd.positional !== false,
              refDistance: snd.minDistance ?? snd.refDistance ?? 1, rollOffFactor: snd.rollOffFactor ?? 1, distanceModel: snd.distanceModel || 'linear',
              volume: snd.volume !== undefined ? snd.volume : 1,
              pitch: snd.pitch !== undefined ? snd.pitch : 1,
              loop: snd.loop !== false,
              minDistance: snd.minDistance !== undefined ? snd.minDistance : 1,
              maxDistance: snd.maxDistance !== undefined ? snd.maxDistance : 15,
              autoPlay: false
            });
            queueSoundSlots(ent, snd, app, session);
          }
          if (nodeData.components.script) {
            ent.addComponent('script');
            if (nodeData.components.script.attributes) {
              ent.scriptData = nodeData.components.script.attributes;
            }
          }
        }

        if (nodeData.behaviors && this.behaviors) {
          nodeData.behaviors.forEach(b => {
            this.behaviors.attachBehavior(ent, b.type, b.properties || b.params || {});
          });
        }

        if (nodeData.children) {
          nodeData.children.forEach(childData => buildNode(childData, ent));
        }

        return ent;
      };

      if (data.root && data.root.children) {
        data.root.children.forEach(childData => buildNode(childData, staging));
      }

      // Commit only after the complete hierarchy has been constructed successfully.
      this.sceneResourceSession?.cancel();
      this.sceneResourceSession = session;
      const toRemove = appRoot.children.filter(c => c.name !== 'EditorGrid' && c.name !== 'EditorCamera');
      const forgetBehaviors = node => {
        this.behaviors?.activeBehaviors?.delete(node);
        node.children.forEach(forgetBehaviors);
      };
      toRemove.forEach(node => { forgetBehaviors(node); node.destroy(); });
      [...staging.children].forEach(node => appRoot.addChild(node));
      staging.destroy();
      if (restoreProjectName && data.project) this.projectName = data.project;
      if (data.scene) this.activeSceneName = data.scene;
      this.hudConfig = data.hud || JSON.parse(JSON.stringify(this.defaultHudConfig));
      this.postProcessingConfig = data.postProcessing || null;
      this.textureCompressionSettings = data.textureCompression || { targetFormat: 'auto', qualityLevel: 'normal', maxAnisotropy: 4, generateMipmaps: true };
      this.animGraph = data.animGraph || null;
      appRoot._studioId = data.root.id || newDocumentId();

      if (restoreScripts) this.scripts = new Map(Object.entries(data.scripts || {}));
      this.lastProjectError = null;

      // Restore atmosphere
      if (data.atmosphere && this.runtime && this.runtime.setAtmosphere) {
        this.runtime.setAtmosphere(data.atmosphere);
      }

      // Restore gravity
      if (data.gravity && app && app.systems && app.systems.rigidbody) {
        app.systems.rigidbody.gravity.set(...data.gravity);
      }

      // Restore triggers
      if (this.triggers) {
        this.triggers.triggers.clear();
        this.triggers.activeStates.clear();
        if (data.triggers) {
          for (const [entityName, config] of Object.entries(data.triggers)) {
            this.triggers.registerTrigger(entityName, config);
          }
        }
      }

      this.selection.clear();
      session.start();
      this.events.emit('scene:changed');
      return true;
    } catch (err) {
      session?.cancel();
      const discard = node => { this.behaviors?.activeBehaviors?.delete(node); node.children.forEach(discard); };
      discard(staging);
      staging.destroy();
      this.lastProjectError = err.message;
      console.error('Editor: Failed to load scene JSON:', err.message);
      return false;
    }
  }

  /**
   * Switch between multi-scenes, automatically saving current state and restoring target scene
   */
  switchScene(sceneName) {
    if (!sceneName || sceneName === this.activeSceneName) return;
    const outgoing = this.exportSceneJSON();
    const destination = this.scenes.get(sceneName) || JSON.stringify({
      sceneFormatVersion: 1, project: this.projectName, scene: sceneName,
      root: { name: 'Root', children: [] }, scripts: Object.fromEntries(this.scripts)
    });
    const compression = this.textureCompressionSettings;
    if (!this.loadSceneJSON(destination, { restoreScripts: false, restoreProjectName: false })) return false;
    if (compression !== undefined) this.textureCompressionSettings = compression;
    // The snapshot may contain an old name after a rename or duplication.
    const outgoingName = JSON.parse(outgoing).scene;
    this.scenes.set(outgoingName, outgoing);
    this.activeSceneName = sceneName;
    if (!this.sceneIds.has(sceneName)) this.sceneIds.set(sceneName, newDocumentId());
    this.scenes.set(sceneName, this.exportSceneJSON());
    this.commandBus.clear();
    this.events.emit('scene:list:changed', [...this.scenes.keys()]);
    return true;
  }

  /**
   * Delete scene by name
   */
  deleteScene(sceneName) {
    if (!sceneName || this.scenes.size <= 1 || !this.scenes.has(sceneName)) return false;
    if (this.activeSceneName === sceneName) {
      const nextScene = [...this.scenes.keys()].find(name => name !== sceneName);
      const snapshot = this.scenes.get(nextScene);
      const compression = this.textureCompressionSettings;
      if (!snapshot || !this.loadSceneJSON(snapshot, { restoreScripts: false, restoreProjectName: false })) return false;
      if (compression !== undefined) this.textureCompressionSettings = compression;
      this.activeSceneName = nextScene;
      this.commandBus.clear();
    }
    this.scenes.delete(sceneName);
    this.sceneIds.delete(sceneName);
    this.events.emit('scene:list:changed', [...this.scenes.keys()]);
    return true;
  }

  /**
   * Rename scene
   */
  renameScene(oldName, newName) {
    if (!oldName || !newName || oldName === newName) return false;
    if (!this.scenes.has(oldName) || this.scenes.has(newName)) return false;

    const data = this.scenes.get(oldName);
    this.scenes.delete(oldName);
    this.scenes.set(newName, data);
    const id = this.sceneIds.get(oldName) || newDocumentId();
    this.sceneIds.delete(oldName);
    this.sceneIds.set(newName, id);

    if (this.activeSceneName === oldName) {
      this.activeSceneName = newName;
    }

    this.events.emit('scene:list:changed', Array.from(this.scenes.keys()));
    return true;
  }

  /**
   * Duplicate scene
   */
  duplicateScene(sceneName) {
    const target = sceneName || this.activeSceneName;
    if (!this.scenes.has(target)) return null;
    const json = (target === this.activeSceneName) ? this.exportSceneJSON() : (this.scenes.get(target) || '{}');
    let newName = `${target}_Copy`;
    let suffix = 2;
    while (this.scenes.has(newName)) newName = `${target}_Copy_${suffix++}`;

    this.scenes.set(newName, json);
    if (!this.switchScene(newName)) {
      this.scenes.delete(newName);
      this.sceneIds.delete(newName);
      return null;
    }
    return newName;
  }
}
