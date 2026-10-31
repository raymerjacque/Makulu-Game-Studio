import * as pc from 'playcanvas';
import { isEditorOnlyNode } from '../engine/editor-only.js';

const copy = value => structuredClone(value);

const projectFields = ['hudConfig', 'postProcessingConfig', 'animGraph', 'textureCompressionSettings', 'audioVolumes', 'shadowResolution', 'clusteredLightingSettings', 'projectName', 'projectId', 'activeSceneName', 'projectAssets'];

/** Disposable scene copies in the current app. This is authoring protection, not a code-security boundary. */
export class PlaySession {
  constructor(editor) { this.editor = editor; this.state = 'idle'; }

  start() {
    const editor = this.editor, app = editor.getApp();
    if (this.state !== 'idle') throw new Error('A play session is already active.');
    if (!app) throw new Error('The scene runtime is not ready.');
    if (editor.sceneResourceStatus && editor.sceneResourceStatus.status !== 'ready') throw new Error('Wait for scene resources or retry missing assets before playing.');
    this.state = 'starting';
    this.app = app;
    this.originals = [...app.root.children].map((node, index) => ({ node, index, enabled: node._enabled }));
    this.selection = editor.selection.getEntities();
    this.timers = new Set();
    this.materials = new Set(); this.materialCopies = new Map(); this.nodes = new Set(); this.destroyed = new WeakSet(); this.watchers = [];
    this.scripts = editor.scripts; this.prefabs = editor.prefabs.prefabs;
    this.assetRecords = editor.assetsPanel?.assets;
    this.savedFields = new Map(projectFields.map(key => [key, editor[key]]));
    this.behaviors = editor.behaviors?.activeBehaviors;
    this.triggerConfigs = editor.triggers.triggers; this.triggerStates = editor.triggers.activeStates;
    this.gravity = app.systems.rigidbody?.gravity?.clone();
    this.atmosphere = editor.runtime.currentAtmosphere;
    this.fogType = app.scene.fog.type;
    const orbit = editor.runtime.editorCamera;
    this.orbit = orbit ? { target: orbit.target.clone(), distance: orbit.distance, pitch: orbit.pitch, yaw: orbit.yaw } : null;
    this.sceneSettings = new Map(['ambientLight', 'fogColor', 'fogDensity', 'fogStart', 'fogEnd', 'exposure', 'toneMapping'].map(key => [key, app.scene[key]?.clone?.() ?? app.scene[key]]));
    this.helperTransforms = this.originals.filter(({ node }) => isEditorOnlyNode(node)).map(({ node }) => ({ node, position: node.getLocalPosition().clone(), rotation: node.getLocalRotation().clone(), scale: node.getLocalScale().clone(), cameraEnabled: node.camera?.enabled }));
    this.stash = new pc.Entity('AuthoringScene'); this.stash.enabled = false;
    // Suppress autosave/dirty events until originals are back, including during teardown.
    editor.isPlaying = true;
    try {
      for (const [key, value] of this.savedFields) if (value !== undefined) editor[key] = copy(value);
      editor.scripts = new Map(this.scripts); editor.prefabs.prefabs = new Map([...this.prefabs].map(([key, value]) => [key, copy(value)]));
      if (editor.assetsPanel) editor.assetsPanel.assets = copy(this.assetRecords);
      editor.triggers.triggers = new Map([...this.triggerConfigs].map(([key, value]) => [key, copy(value)]));
      editor.triggers.activeStates = new Map();
      for (const { node } of this.originals) if (!isEditorOnlyNode(node)) this.stash.addChild(node);
      // Clone the whole graph together so native entity references can remap across top-level objects.
      this.clone = this.stash.clone();
      this.clone.name = 'PlaySession';
      const mapping = new Map();
      const map = (source, target) => {
        mapping.set(source, target);
        for (const key of ['_studioId', '_studioModelInstance', '_modelUrl', '_modelAnimations', '_idleClip', '_walkClip', '_runClip', '_terrainData', 'scriptData', 'locked']) {
          if (source[key] !== undefined) target[key] = copy(source[key]);
        }
        if (source.sound && target.sound) {
          for (const key of ['_studioSlotSources', '_studioSlotAutoPlay', '_studioSlotDurations', 'assetUrl', 'loop', 'autoPlay', 'minDistance']) if (source.sound[key] !== undefined) target.sound[key] = copy(source.sound[key]);
        }
        // Native render clones share materials. Separate mutable colors/uniforms from the authoring scene.
        for (const component of [target.render, target.model]) {
          if (!component) continue;
          const isolate = material => {
            if (!material || this.materials.has(material)) return material;
            if (this.materialCopies.has(material)) return this.materialCopies.get(material);
            const isolated = material.clone(); this.materials.add(isolated); this.materialCopies.set(material, isolated); return isolated;
          };
          if (component.material) component.material = isolate(component.material);
          for (const instance of component.meshInstances || []) instance.material = isolate(instance.material);
        }
        source.children.forEach((child, index) => map(child, target.children[index]));
      };
      map(this.stash, this.clone);
      for (const [source, target] of mapping) {
        if (source._animComp) {
          target._animComp = mapping.get(source._animComp.entity)?.anim;
          if (!target.c.anim) target.anim = target._animComp;
        }
      }
      if (editor.behaviors) editor.behaviors.activeBehaviors = new Map([...this.behaviors].filter(([node]) => mapping.has(node)).map(([node, list]) => [mapping.get(node), copy(list.map(b => ({ type: b.type, params: b.params || {} })))]));
      const watch = node => {
        if (this.nodes.has(node)) return;
        this.nodes.add(node);
        node.once('destroy', () => this.destroyed.add(node));
        const inserted = child => watch(child);
        node.on('childinsert', inserted); this.watchers.push(() => node.off('childinsert', inserted));
        node.children.forEach(watch);
      };
      const inserted = node => watch(node);
      app.root.on('childinsert', inserted); this.watchers.push(() => app.root.off('childinsert', inserted));
      app.root.addChild(this.clone);
      editor.selection.clear();
      this.clone.enabled = true;
      this.state = 'playing';
      editor.events.emit('game:play');
      editor.events.emit('scene:changed');
      return true;
    } catch (error) {
      this.stop();
      throw error;
    }
  }

  defer(callback, delay) {
    if (this.state !== 'playing') return null;
    const timer = setTimeout(() => { this.timers.delete(timer); if (this.state === 'playing') callback(); }, delay);
    this.timers.add(timer); return timer;
  }

  stop() {
    if (this.state === 'idle' || this.state === 'stopping') return false;
    const editor = this.editor;
    this.state = 'stopping';
    for (const timer of this.timers) clearTimeout(timer);
    this.timers.clear();
    // An individual subscriber failure must not prevent scene restoration.
    let failure;
    try { editor.events.emit('game:stop'); } catch (error) { failure = error; }
    if (this.app.systems.rigidbody) this.app.systems.rigidbody.timeScale = 0;
    this.watchers.forEach(dispose => dispose());
    // Include removed/reparented runtime objects, not just those still under the preview root.
    if (this.clone) this.nodes.add(this.clone);
    const clean = action => { try { action(); } catch (error) { failure ||= error; } };
    for (const node of this.nodes) if (!this.destroyed.has(node)) clean(() => node.destroy());
    for (const material of this.materials) clean(() => material.destroy());
    for (const { node, index, enabled } of this.originals) {
      if (!isEditorOnlyNode(node)) this.app.root.insertChild(node, index);
      node.enabled = enabled;
    }
    this.stash.destroy();
    for (const [key, value] of this.savedFields) editor[key] = value;
    if (editor.behaviors) {
      editor.behaviors.activeBehaviors = this.behaviors;
      editor.behaviors.isPlaying = false; editor.behaviors.keys = {};
      editor.behaviors._shakeTimer = 0; editor.behaviors._shakeIntensity = 0;
    }
    editor.scripts = this.scripts; editor.prefabs.prefabs = this.prefabs;
    if (editor.assetsPanel) editor.assetsPanel.assets = this.assetRecords;
    editor.triggers.triggers = this.triggerConfigs; editor.triggers.activeStates = this.triggerStates;
    if (this.gravity) this.app.systems.rigidbody.gravity.copy(this.gravity);
    for (const [key, value] of this.sceneSettings) this.app.scene[key] = value;
    this.app.scene.fog.type = this.fogType;
    editor.runtime.currentAtmosphere = this.atmosphere;
    for (const { node, position, rotation, scale, cameraEnabled } of this.helperTransforms) {
      node.setLocalPosition(position); node.setLocalRotation(rotation); node.setLocalScale(scale);
      if (node.camera) node.camera.enabled = cameraEnabled;
    }
    if (this.orbit) {
      const orbit = editor.runtime.editorCamera;
      orbit.target.copy(this.orbit.target); orbit.distance = this.orbit.distance; orbit.pitch = this.orbit.pitch; orbit.yaw = this.orbit.yaw;
    }
    clean(() => editor.selection.clear());
    this.selection.forEach(node => clean(() => editor.selection.add(node)));
    clean(() => editor.events.emit('scene:changed'));
    editor.isPlaying = false; this.state = 'idle';
    this.watchers = []; this.nodes.clear(); this.materials.clear(); this.materialCopies.clear(); this.clone = null; this.stash = null;
    clean(() => editor.runtime.gizmoManager?.updateGizmoVisibility());
    clean(() => editor.events.emit('game:restored'));
    if (failure) throw failure;
    return true;
  }
}
