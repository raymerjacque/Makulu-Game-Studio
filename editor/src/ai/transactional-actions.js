import { MATERIAL_MAPS } from './prepared-resources.js';
import * as pc from 'playcanvas';
import { Command } from '../core/command-bus.js';
import { isEditorOnlyNode } from '../engine/editor-only.js';
import { newDocumentId } from '../project/project-document.js';

/** Synchronous, explicitly journaled edits. Async assets and legacy composite tools are separate. */
export function applyTransactionalActions(editor, actions, resources) {
  const app = editor.getApp(), root = app?.root || editor.root;
  const initialSelection = editor.selection.getActive();
  const emit = () => editor.events.emit('scene:changed');
  const componentChanged = node => { editor.events.emit('entity:component:changed', node); emit(); };
  const run = (label, execute, undo, dispose) => {
    const command = new Command(label, execute, undo); command.dispose = dispose;
    return editor.commandBus.execute(command);
  };
  const target = action => {
    const reference = action.targetId || (action.action === 'modify_entity' ? action.name : action.target);
    const matches = [];
    root.forEach(node => {
      if (node === root) return;
      for (let ancestor = node; ancestor && ancestor !== root; ancestor = ancestor.parent) if (isEditorOnlyNode(ancestor)) return;
      if (action.targetId ? node._studioId === reference : reference === 'selected' ? node === initialSelection : node.name === reference) matches.push(node);
    });
    if (matches.length !== 1) throw new Error(matches.length ? 'Target name is ambiguous; use its stable targetId.' : 'Target entity was not found.');
    return matches[0];
  };
  const create = action => {
    if (!app?.systems || (action.action === 'create_light' ? !app.systems.light : !app.systems.render)) throw new Error('This action needs the initialized scene runtime.');
    const base = action.name || (action.action === 'create_light' ? 'AI_Light' : action.action === 'spawn_model' ? 'AI_3D_Model' : `AI_${action.type}`);
    let name = base, suffix = 2;
    while (root.findByName(name)) { if (action.name) throw new Error('An entity with that name already exists.'); name = `${base}_${suffix++}`; }
    if (isEditorOnlyNode({ name })) throw new Error('This name is reserved for the editor.');
    const entity = new pc.Entity(name, app); entity._studioId = newDocumentId();
    let initialized = false;
    run(`Create ${name}`, () => {
      if (!initialized) {
        entity.setLocalPosition(...(action.position || [0, action.action === 'create_light' ? 3 : 1, 0]));
        entity.setLocalEulerAngles(...(action.rotation || [0, 0, 0])); entity.setLocalScale(...(action.scale || [1, 1, 1]));
        if (action.action === 'create_light') entity.addComponent('light', { type: action.type || 'point', color: new pc.Color(...(action.color || [1, 1, 1])), intensity: action.intensity ?? 2, range: action.range ?? 10, castShadows: action.castShadows ?? true });
        else if (action.action === 'spawn_model') {
          const asset = resources.get('container', action.url);
          const model = asset.resource.instantiateRenderEntity({ castShadows: true, receiveShadows: true });
          model._studioModelInstance = true; entity.addChild(model); entity._modelUrl = action.url;
          if (asset.resource.animations?.length && !editor.setupModelAnimations(entity, model, asset.resource.animations)) throw new Error('Model animation initialization failed.');
        } else {
          entity.addComponent('render', { type: action.type });
          for (const component of [...(action.components || [])].sort((a, b) => (a.type === 'collision' ? -1 : 1) - (b.type === 'collision' ? -1 : 1))) {
            if (!app.systems[component.type]) throw new Error('Required component system is unavailable.');
            if (component.type === 'rigidbody' && !app.systems.rigidbody.physicsWorld) throw new Error('Physics backend is not initialized.');
            const properties = structuredClone(component.properties || {});
            for (const key of ['halfExtents', 'linearFactor', 'angularFactor']) if (properties[key]) properties[key] = new pc.Vec3(...properties[key]);
            entity.addComponent(component.type, properties);
          }
        }
        initialized = true;
      }
      root.addChild(entity); entity.enabled = true; editor.selection.set(entity); emit(); return entity;
    }, () => { entity.enabled = false; entity.remove(); editor.selection.remove(entity); emit(); }, () => entity.destroy());
    return entity;
  };
  const executed = [];
  for (const action of actions) {
    let label;
    switch (action.action) {
      case 'spawn_primitive': case 'create_light': case 'spawn_model': label = create(action).name; break;
      case 'modify_entity': {
        const node = target(action), position = node.getLocalPosition().clone(), rotation = node.getLocalRotation().clone(), scale = node.getLocalScale().clone();
        run(`Transform ${node.name}`, () => { if (action.position) node.setPosition(...action.position); if (action.rotation) node.setEulerAngles(...action.rotation); if (action.scale) node.setLocalScale(...action.scale); editor.events.emit('entity:transformed', node); }, () => { node.setLocalPosition(position); node.setLocalRotation(rotation); node.setLocalScale(scale); editor.events.emit('entity:transformed', node); });
        label = node.name; break;
      }
      case 'delete_entity': {
        const node = target(action), parent = node.parent, index = parent.children.indexOf(node), enabled = node._enabled;
        run(`Delete ${node.name}`, () => { node.enabled = false; node.remove(); editor.selection.getEntities().forEach(selected => { if (selected === node || selected.isDescendantOf(node)) editor.selection.remove(selected); }); emit(); }, () => { parent.insertChild(node, index); node.enabled = enabled; emit(); });
        label = node.name; break;
      }
      case 'create_material': {
        const node = target(action); if (!node.render) throw new Error('Material target has no render component.');
        const previous = node.render.material, instances = (node.render.meshInstances || []).map(instance => [instance, instance.material]), material = new pc.StandardMaterial();
        let journalOwnsMaterial = false;
        try {
          if (action.diffuse) material.diffuse.set(...action.diffuse);
          if (action.emissive) material.emissive.set(...action.emissive);
          if (action.metalness !== undefined) { material.metalness = action.metalness; material.useMetalness = true; }
          if (action.roughness !== undefined) { material.gloss = 1 - action.roughness; material.roughness = action.roughness; }
          if (action.opacity !== undefined) { material.opacity = action.opacity; if (action.opacity < 1) material.blendType = pc.BLEND_NORMAL; }
          for (const [field, property] of MATERIAL_MAPS) if (action[field]) {
            material[property] = resources.get('texture', action[field]).resource;
            material['_' + field] = action[field];
            if (field === 'roughnessMapUrl') { material.glossInvert = true; material.gloss = 1; }
          }
          material.update();
          journalOwnsMaterial = true;
          run(`Material ${node.name}`, () => { node.render.material = material; instances.forEach(([instance]) => { instance.material = material; }); componentChanged(node); }, () => { node.render.material = previous; instances.forEach(([instance, old]) => { instance.material = old; }); componentChanged(node); }, () => material.destroy());
        } catch (error) { if (!journalOwnsMaterial) material.destroy(); throw error; }
        label = node.name; break;
      }
      case 'attach_behavior': {
        const node = target(action), manager = editor.behaviors; if (!manager) throw new Error('Behavior manager is unavailable.');
        const existed = manager.activeBehaviors.has(node), previous = manager.activeBehaviors.get(node);
        const next = structuredClone((previous || []).map(b => ({ type: b.type, params: b.params || {} })));
        const old = next.find(b => b.type === action.behavior);
        if (old) old.params = { ...old.params, ...action.properties }; else next.push({ type: action.behavior, params: action.properties || {} });
        run(`Behavior ${node.name}`, () => { manager.activeBehaviors.set(node, structuredClone(next)); manager.bindUpdateLoop(); componentChanged(node); }, () => { if (existed) manager.activeBehaviors.set(node, previous); else manager.activeBehaviors.delete(node); componentChanged(node); });
        label = node.name; break;
      }
      case 'generate_script': {
        const existed = editor.scripts.has(action.name), previous = editor.scripts.get(action.name);
        run(`Script ${action.name}`, () => { editor.scripts.set(action.name, action.code); emit(); }, () => { if (existed) editor.scripts.set(action.name, previous); else editor.scripts.delete(action.name); emit(); });
        label = action.name; break;
      }
      case 'configure_hud': case 'set_hud_config': {
        const previous = editor.hudConfig, next = { ...previous, ...Object.fromEntries(Object.entries(action.config).map(([section, config]) => [section, { ...previous[section], ...structuredClone(config) }])) };
        run('Configure HUD', () => { editor.hudConfig = structuredClone(next); editor.events.emit('hud:config:changed', editor.hudConfig); emit(); }, () => { editor.hudConfig = previous; editor.events.emit('hud:config:changed', previous); emit(); });
        label = 'HUD'; break;
      }
      case 'set_physics_gravity': {
        const gravity = app?.systems?.rigidbody?.gravity; if (!gravity) throw new Error('Physics system is unavailable.');
        const previous = gravity.clone(); run('Set gravity', () => { gravity.set(...action.gravity); emit(); }, () => { gravity.copy(previous); emit(); }); label = 'Gravity'; break;
      }
      case 'set_sky_atmosphere': {
        if (!editor.runtime?.setAtmosphere) throw new Error('Atmosphere runtime is unavailable.');
        const scene = app.scene, preset = editor.runtime.currentAtmosphere;
        const previous = { ambientLight: scene.ambientLight.clone(), color: scene.fog.color.clone(), type: scene.fog.type, density: scene.fog.density, start: scene.fog.start, end: scene.fog.end };
        run('Set atmosphere', () => { editor.runtime.setAtmosphere(action.preset); emit(); }, () => { scene.ambientLight.copy(previous.ambientLight); scene.fog.color.copy(previous.color); Object.assign(scene.fog, { type: previous.type, density: previous.density, start: previous.start, end: previous.end }); editor.runtime.currentAtmosphere = preset; emit(); }); label = action.preset; break;
      }
      default: throw new Error('Action has no transactional implementation.');
    }
    executed.push({ action: action.action, target: label });
  }
  return executed;
}
