import { validateSoundData } from '../engine/sound-data.js';
import { validateTerrainData } from '../engine/terrain-data.js';

/** Version 1 is an editable JSON document, not yet a self-contained asset archive. */
export const PROJECT_FORMAT = 'makulu-game-studio-project';
export const PROJECT_VERSION = 1;
export const newDocumentId = () => globalThis.crypto?.randomUUID?.() || `studio-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const requireValue = (condition, message) => { if (!condition) throw new Error(message); };
const vector = value => Array.isArray(value) && value.length === 3 && [0, 1, 2].every(index => Number.isFinite(value[index]));

/** Reject dangerous object keys, non-JSON values, excessive nesting, and non-finite numbers. */
function validateJSON(value, depth = 0) {
  requireValue(depth <= 64, 'Project data is nested too deeply.');
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return;
  if (typeof value === 'number') { requireValue(Number.isFinite(value), 'Project contains a non-finite number.'); return; }
  requireValue(typeof value === 'object', 'Project contains a non-JSON value.');
  for (const [key, child] of Object.entries(value)) {
    requireValue(!['__proto__', 'prototype', 'constructor'].includes(key), 'Project contains an unsafe object key.');
    validateJSON(child, depth + 1);
  }
}

export function validateSceneData(scene) {
  validateJSON(scene);
  requireValue(record(scene) && record(scene.root) && Array.isArray(scene.root.children), 'Scene must contain a root and children.');
  for (const key of ['hud', 'postProcessing', 'textureCompression', 'animGraph', 'triggers']) {
    if (scene[key] != null) requireValue(record(scene[key]), `Invalid scene ${key}.`);
  }
  if (scene.gravity !== undefined) requireValue(vector(scene.gravity), 'Invalid gravity vector.');
  if (scene.triggers) requireValue(Object.values(scene.triggers).every(record), 'Invalid trigger configuration.');
  if (scene.sceneFormatVersion !== undefined) requireValue(scene.sceneFormatVersion === 1, 'Unsupported scene format version.');
  const ids = new Set();
  let count = 0;
  function node(item, depth = 0) {
    requireValue(++count <= 100000 && depth <= 48, 'Scene hierarchy exceeds the supported limits.');
    requireValue(record(item) && typeof item.name === 'string', 'Scene entity must have a name.');
    for (const key of ['position', 'rotation', 'scale', 'localPosition', 'localRotation']) {
      if (item[key] !== undefined) requireValue(vector(item[key]), `Invalid ${key} on entity ${item.name}.`);
    }
    if (item.id !== undefined) {
      requireValue(typeof item.id === 'string' && item.id.length > 0 && !ids.has(item.id), 'Scene contains invalid or duplicate entity IDs.');
      ids.add(item.id);
    }
    if (item.terrain !== undefined) validateTerrainData(item.terrain);
    if (item.tags !== undefined) requireValue(Array.isArray(item.tags) && item.tags.every(tag => typeof tag === 'string'), 'Invalid entity tags.');
    if (item.modelUrl !== undefined) requireValue(typeof item.modelUrl === 'string', 'Invalid model reference.');
    if (item.scriptData !== undefined) requireValue(record(item.scriptData), 'Invalid script attributes.');
    if (item.components !== undefined) {
      requireValue(record(item.components) && Object.values(item.components).every(record), 'Invalid component document.');
      if (item.components.sound) validateSoundData(item.components.sound);
      if (item.components.collision?.halfExtents !== undefined) requireValue(vector(item.components.collision.halfExtents), 'Invalid collision extents.');
      for (const field of ['linearFactor', 'angularFactor']) if (item.components.rigidbody?.[field] !== undefined) requireValue(vector(item.components.rigidbody[field]), `Invalid rigidbody ${field}.`);
    }
    if (item.behaviors !== undefined) requireValue(Array.isArray(item.behaviors) && item.behaviors.every(b => record(b) && typeof b.type === 'string'), 'Invalid behavior configuration.');
    if (item.children !== undefined) {
      requireValue(Array.isArray(item.children), 'Invalid entity children.');
      item.children.forEach(child => node(child, depth + 1));
    }
  }
  scene.root.children.forEach(item => node(item));
  if (scene.scripts !== undefined) validateScripts(scene.scripts);
  return scene;
}

function validateScripts(scripts) {
  requireValue(record(scripts) && Object.values(scripts).every(code => typeof code === 'string'), 'Script registry must map names to source text.');
}

/** Parse and validate every scene before allowing a project to replace the open document. */
export function parseProjectDocument(input) {
  requireValue(typeof input !== 'string' || input.length <= 128 * 1024 * 1024, 'Project exceeds the 128 MiB JSON limit.');
  const parsed = typeof input === 'string' ? JSON.parse(input) : input;
  validateJSON(parsed);
  let project = parsed;
  if (!record(parsed) || parsed.format !== PROJECT_FORMAT) {
    requireValue(record(parsed) && parsed.format === undefined && parsed.schemaVersion === undefined, 'Unsupported project format.');
    validateSceneData(parsed);
    const id = newDocumentId();
    project = {
      format: PROJECT_FORMAT, schemaVersion: PROJECT_VERSION, id: newDocumentId(),
      name: parsed.project || 'Imported Project', activeSceneId: id,
      scenes: [{ id, name: parsed.scene || 'Main Scene', data: parsed }],
      scripts: parsed.scripts || {}, assets: [], prefabs: [], settings: {},
      migration: { source: 'legacy-scene-json' }
    };
  }
  requireValue(project.schemaVersion === PROJECT_VERSION, `Unsupported project version: ${project.schemaVersion}.`);
  requireValue(typeof project.id === 'string' && project.id.length > 0 && typeof project.name === 'string', 'Project identity is invalid.');
  requireValue(Array.isArray(project.scenes) && project.scenes.length > 0, 'Project must contain at least one scene.');
  const ids = new Set(), names = new Set();
  for (const scene of project.scenes) {
    requireValue(record(scene) && typeof scene.id === 'string' && scene.id.length > 0 && typeof scene.name === 'string' && scene.name.trim().length > 0, 'Invalid scene identity.');
    requireValue(!ids.has(scene.id) && !names.has(scene.name), 'Duplicate scene ID or name.');
    ids.add(scene.id); names.add(scene.name);
    validateSceneData(scene.data);
  }
  requireValue(ids.has(project.activeSceneId), 'Active scene does not exist.');
  validateScripts(project.scripts);
  requireValue(Array.isArray(project.assets) && project.assets.every(a => record(a) && typeof a.id === 'string' && typeof a.name === 'string' && typeof a.type === 'string'), 'Invalid asset registry.');
  requireValue(new Set(project.assets.map(a => a.id)).size === project.assets.length, 'Duplicate asset IDs.');
  requireValue(Array.isArray(project.prefabs) && project.prefabs.every(p => record(p) && typeof p.id === 'string' && record(p.data)), 'Invalid prefab registry.');
  requireValue(new Set(project.prefabs.map(p => p.id)).size === project.prefabs.length, 'Duplicate prefab IDs.');
  requireValue(record(project.settings), 'Invalid project settings.');
  // Detach from caller-owned objects before the editor adopts the document.
  return JSON.parse(JSON.stringify(project));
}

const assetFields = ['id', 'name', 'type', 'icon', 'size', 'url', 'base64Data', 'materialData', 'prefabData', 'data', 'license', 'licenseUrl', 'author', 'sourcePage', 'attribution', 'packId', 'tags', 'style', 'animations'];
export function serializeAssetRegistry(assets) {
  return assets.map(asset => {
    const result = {};
    for (const key of assetFields) if (asset[key] !== undefined) result[key] = asset[key];
    result.id = String(asset.id);
    if (asset.url?.startsWith('blob:')) {
      requireValue(typeof asset.base64Data === 'string' && asset.base64Data.startsWith('data:'), `Asset ${asset.name} is still importing; wait before saving.`);
      result.url = asset.base64Data;
    }
    return result;
  });
}

/** Resolve known local-import aliases without fetching or claiming to package remote dependencies. */
export function resolvePortableReferences(value, assets = []) {
  const aliases = new Map(assets.filter(asset => asset.sourceUrl && asset.base64Data).map(asset => [asset.sourceUrl, asset.base64Data]));
  const fields = new Set(['modelUrl', 'assetUrl', 'diffuseMapUrl', 'normalMapUrl', 'roughnessMapUrl', 'emissiveMapUrl', 'url']);
  const visit = item => {
    if (!item || typeof item !== 'object') return;
    for (const [key, child] of Object.entries(item)) {
      if (fields.has(key) && typeof child === 'string') {
        if (aliases.has(child)) item[key] = aliases.get(child);
        else if (child.startsWith('blob:')) throw new Error('A temporary asset reference is not ready to save. Finish importing it first.');
      } else visit(child);
    }
  };
  visit(value);
  return value;
}
