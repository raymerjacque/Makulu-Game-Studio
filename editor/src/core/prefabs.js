import { showToast } from '../ui/toast.js';

/**
 * Prefab & Entity Template System
 * Enables saving entity trees into reusable prefab assets and instantiating them into scenes.
 */
export class PrefabSystem {
  constructor(editor) {
    this.editor = editor;
    this.prefabs = new Map(); // prefabId -> json definition
  }

  createPrefabFromEntity(entity) {
    if (!entity) {
      showToast('No entity selected to create prefab', 'warn');
      return null;
    }

    const prefabData = {
      name: `${entity.name}.prefab`,
      type: 'prefab',
      createdAt: new Date().toISOString(),
      entityData: this.serializeEntity(entity)
    };

    const prefabId = `prefab_${Date.now()}`;
    this.prefabs.set(prefabId, prefabData);

    // Register asset into Assets Panel
    if (this.editor.assets) {
      this.editor.assets.addAsset({
        id: prefabId,
        name: prefabData.name,
        type: 'prefabs',
        size: JSON.stringify(prefabData).length,
        prefabData: prefabData
      });
    }

    showToast(`📦 Created Prefab Asset "${prefabData.name}"!`, 'success');
    return prefabData;
  }

  instantiatePrefab(prefabData, positionOverride = null) {
    if (!prefabData || !prefabData.entityData) return null;

    const data = JSON.parse(JSON.stringify(prefabData.entityData));
    if (positionOverride) {
      data.transform = data.transform || {};
      data.transform.position = positionOverride;
    }

    const createdEntity = this.editor.createEntity(data);
    showToast(`✨ Instantiated Prefab "${data.name}" into Scene!`, 'success');
    return createdEntity;
  }

  serializeEntity(entity) {
    const data = {
      name: entity.name,
      transform: {
        position: [entity.getPosition().x, entity.getPosition().y, entity.getPosition().z],
        rotation: [entity.getEulerAngles().x, entity.getEulerAngles().y, entity.getEulerAngles().z],
        scale: [entity.getLocalScale().x, entity.getLocalScale().y, entity.getLocalScale().z]
      },
      components: []
    };

    if (entity.render) {
      data.components.push({
        type: 'render',
        properties: { type: entity.render.type || 'box' }
      });
    }

    if (entity.light) {
      data.components.push({
        type: 'light',
        properties: {
          type: entity.light.type,
          color: [entity.light.color.r, entity.light.color.g, entity.light.color.b],
          intensity: entity.light.intensity,
          range: entity.light.range
        }
      });
    }

    return data;
  }
}
