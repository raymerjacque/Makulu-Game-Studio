import knownIds from './action-ids.json' with { type: 'json' };
import behaviorIds from './behavior-ids.json' with { type: 'json' };

export const TRANSACTIONAL_ACTIONS = new Set(['spawn_primitive', 'create_light', 'modify_entity', 'delete_entity', 'create_material', 'generate_script', 'attach_behavior', 'set_sky_atmosphere', 'set_physics_gravity', 'configure_hud', 'set_hud_config']);
const known = new Set(knownIds), behaviors = new Set(behaviorIds);
const primitives = new Set(['box', 'sphere', 'capsule', 'cylinder', 'cone', 'plane']);
const fail = message => { throw new Error(message); };
const object = value => value && !Array.isArray(value) && typeof value === 'object';
const number = (value, min = -1e6, max = 1e6) => Number.isFinite(value) && value >= min && value <= max;
const vector = value => Array.isArray(value) && value.length === 3 && value.every(n => number(n));
const name = value => typeof value === 'string' && value.trim().length > 0 && value.length <= 160;
const fields = {
  spawn_primitive: ['type', 'name', 'position', 'rotation', 'scale', 'components'],
  create_light: ['type', 'name', 'position', 'rotation', 'color', 'intensity', 'range', 'castShadows'],
  modify_entity: ['name', 'targetId', 'position', 'rotation', 'scale'],
  delete_entity: ['target', 'targetId'], create_material: ['target', 'targetId', 'diffuse', 'emissive', 'metalness', 'roughness', 'opacity'],
  generate_script: ['name', 'code'], attach_behavior: ['target', 'targetId', 'behavior', 'properties'],
  set_sky_atmosphere: ['preset'], set_physics_gravity: ['gravity'], configure_hud: ['config'], set_hud_config: ['config']
};

function jsonValue(value, depth = 0) {
  if (depth > 24) fail('AI action data is nested too deeply.');
  if (value === null || typeof value === 'boolean' || typeof value === 'string') return;
  if (typeof value === 'number' && Number.isFinite(value)) return;
  if (Array.isArray(value)) { value.forEach(item => jsonValue(item, depth + 1)); return; }
  if (!object(value) || ![Object.prototype, null].includes(Object.getPrototypeOf(value))) fail('AI actions must contain plain JSON values.');
  for (const [key, item] of Object.entries(value)) {
    if (['__proto__', 'prototype', 'constructor'].includes(key)) fail('Unsafe key in AI action data.');
    jsonValue(item, depth + 1);
  }
}

function component(component) {
  if (!object(component) || Object.keys(component).some(key => !['type', 'properties'].includes(key))) fail('Invalid primitive component.');
  const properties = component.properties || {};
  const allowed = {
    collision: ['type', 'enabled', 'halfExtents', 'radius', 'height', 'axis'],
    rigidbody: ['type', 'enabled', 'mass', 'friction', 'restitution', 'linearDamping', 'angularDamping', 'linearFactor', 'angularFactor']
  };
  if (!allowed[component.type] || !object(properties) || Object.keys(properties).some(key => !allowed[component.type].includes(key))) fail('Primitive components support validated collision/rigidbody fields only.');
  for (const [key, value] of Object.entries(properties)) {
    if (key === 'type') {
      const choices = component.type === 'collision' ? ['box', 'sphere', 'capsule', 'cylinder', 'cone'] : ['static', 'dynamic', 'kinematic'];
      if (!choices.includes(value)) fail('Unsupported physics component type.');
    } else if (key === 'enabled') { if (typeof value !== 'boolean') fail('Component enabled must be boolean.'); }
    else if (['halfExtents', 'linearFactor', 'angularFactor'].includes(key)) { if (!vector(value) || value.some(n => n < 0)) fail('Invalid component vector.'); }
    else if (!number(value, 0, key === 'axis' ? 2 : ['restitution', 'linearDamping', 'angularDamping'].includes(key) ? 1 : 1e6) || key === 'axis' && !Number.isInteger(value) || ['radius', 'height'].includes(key) && value === 0) fail('Invalid physics component number.');
  }
}

export function validateActionBatch(input) {
  if (!Array.isArray(input) || input.length > 100) fail('AI edits require an array of at most 100 actions.');
  jsonValue(input);
  if (JSON.stringify(input).length > 1024 * 1024) fail('AI action batch exceeds the size limit.');
  const actions = structuredClone(input);
  for (let index = 0; index < actions.length; index++) {
    const action = actions[index];
    if (!object(action) || !Object.hasOwn(action, 'action') || !known.has(action.action)) fail(`Unsupported AI action at index ${index}.`);
    if (!TRANSACTIONAL_ACTIONS.has(action.action)) continue; // Legacy fields are not yet a typed tool contract.
    const allowed = new Set(['action', ...fields[action.action]]);
    if (Object.keys(action).some(key => !allowed.has(key))) fail(`Unsupported field in ${action.action}.`);
    for (const key of ['position', 'rotation', 'scale', 'gravity', 'diffuse', 'emissive', 'color']) {
      if (action[key] !== undefined && !vector(action[key])) fail(`${action.action}.${key} must be three finite numbers.`);
    }
    if (action.scale?.some(n => Math.abs(n) < 1e-6)) fail('Entity scale must be nonzero.');
    for (const key of ['diffuse', 'emissive', 'color']) if (action[key]?.some(n => n < 0 || n > 1)) fail('Colors must be in the range 0 to 1.');
    for (const key of ['name', 'target', 'targetId']) if (action[key] !== undefined && !name(action[key])) fail('Entity/script references must be nonempty strings.');
    if (['modify_entity', 'delete_entity', 'create_material', 'attach_behavior'].includes(action.action) && !name(action.targetId || (action.action === 'modify_entity' ? action.name : action.target))) fail(`${action.action} needs a target reference.`);
    if (action.action === 'modify_entity' && !['position', 'rotation', 'scale'].some(key => action[key] !== undefined)) fail('modify_entity needs at least one transform field.');
    if (action.action === 'spawn_primitive') {
      if (!primitives.has(action.type)) fail('Unsupported primitive type.');
      if (action.components !== undefined) {
        if (!Array.isArray(action.components) || action.components.length > 2) fail('Invalid primitive components.');
        const types = new Set(); for (const entry of action.components) { component(entry); if (types.has(entry.type)) fail('Duplicate primitive component.'); types.add(entry.type); }
        if (types.has('rigidbody') && !types.has('collision')) fail('A rigidbody needs a collision shape.');
      }
    }
    if (action.action === 'create_light') {
      if (action.type !== undefined && !['point', 'spot', 'directional'].includes(action.type)) fail('Unsupported light type.');
      if (action.castShadows !== undefined && typeof action.castShadows !== 'boolean') fail('castShadows must be boolean.');
    }
    for (const key of ['intensity', 'range']) if (action[key] !== undefined && !number(action[key], 0)) fail('Light values must be nonnegative finite numbers.');
    for (const key of ['metalness', 'roughness', 'opacity']) if (action[key] !== undefined && !number(action[key], 0, 1)) fail('Material values must be between 0 and 1.');
    if (action.action === 'create_material' && !['diffuse', 'emissive', 'metalness', 'roughness', 'opacity'].some(key => action[key] !== undefined)) fail('create_material needs material fields.');
    if (action.action === 'generate_script' && (['__proto__', 'prototype', 'constructor'].includes(action.name) || !name(action.name) || typeof action.code !== 'string' || action.code.length > 100000)) fail('Script name/source is invalid or too large.');
    if (action.action === 'attach_behavior') {
      if (!behaviors.has(action.behavior) || (action.properties !== undefined && !object(action.properties))) fail('Unknown behavior or invalid behavior parameters.');
      // Parameter semantics for the full behavior catalog still need individual capability contracts.
    }
    if (action.action === 'set_sky_atmosphere' && !['day', 'sunset', 'cyberpunk', 'foggy', 'night'].includes(action.preset)) fail('Unsupported atmosphere preset.');
    if (action.action === 'set_physics_gravity' && !vector(action.gravity)) fail('Gravity needs three finite numbers.');
    if (['configure_hud', 'set_hud_config'].includes(action.action)) {
      if (!object(action.config)) fail('HUD config must be an object.');
      const sections = { health: ['enabled', 'label', 'max', 'color'], stamina: ['enabled', 'label', 'max', 'color'], score: ['enabled', 'label', 'initial'], crosshair: ['enabled', 'style'], gameOver: ['enabled', 'title', 'message'], victory: ['enabled', 'title', 'message'], keys: ['enabled'], jetpack: ['enabled'] };
      for (const [section, config] of Object.entries(action.config)) {
        if (!sections[section] || !object(config)) fail('Unsupported HUD section.');
        for (const [key, value] of Object.entries(config)) {
          if (!sections[section].includes(key)) fail('Unsupported HUD field.');
          if (key === 'enabled' ? typeof value !== 'boolean' : ['max', 'initial'].includes(key) ? !number(value, 0) : typeof value !== 'string' || value.length > 2000) fail('Invalid HUD field value.');
        }
      }
    }
  }
  return actions;
}
