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
    const assetObj = {
      id: prefabId,
      name: prefabData.name,
      type: 'prefabs',
      icon: '📦',
      size: `${Math.max(1, Math.round(JSON.stringify(prefabData).length / 1024))} KB`,
      prefabData: prefabData
    };

    if (this.editor.assetsPanel) {
      this.editor.assetsPanel.addAsset(assetObj);
    } else if (this.editor.assets && this.editor.assets.addAsset) {
      this.editor.assets.addAsset(assetObj);
    }

    showToast(`📦 Created Prefab Asset "${prefabData.name}"!`, 'success');
    return prefabData;
  }

  getPrefab(nameOrId) {
    if (!nameOrId) return null;
    if (this.prefabs.has(nameOrId)) return this.prefabs.get(nameOrId);
    for (const [id, p] of this.prefabs.entries()) {
      if (p.name === nameOrId || p.name === `${nameOrId}.prefab` || (p.entityData && p.entityData.name === nameOrId)) {
        return p;
      }
    }
    return null;
  }

  instantiate(prefabData, positionOverride = null) {
    return this.instantiatePrefab(prefabData, positionOverride);
  }

  instantiatePrefab(prefabData, positionOverride = null) {
    if (!prefabData || !prefabData.entityData) return null;

    const data = JSON.parse(JSON.stringify(prefabData.entityData));
    if (positionOverride) {
      data.transform = data.transform || {};
      let pos = positionOverride;
      if (positionOverride && positionOverride.position) pos = positionOverride.position;
      if (pos && typeof pos.x === 'number') pos = [pos.x, pos.y, pos.z];
      data.transform.position = Array.isArray(pos) ? pos : [0, 0, 0];
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
      const renderComp = {
        type: 'render',
        properties: { type: entity.render.type || 'box' }
      };
      if (entity.render.material) {
        const mat = entity.render.material;
        renderComp.material = {
          diffuse: mat.diffuse ? [mat.diffuse.r, mat.diffuse.g, mat.diffuse.b] : [1, 1, 1],
          metalness: mat.metalness !== undefined ? mat.metalness : 0.5,
          roughness: mat.roughness !== undefined ? mat.roughness : 0.3,
          opacity: mat.opacity !== undefined ? mat.opacity : 1.0
        };
      }
      data.components.push(renderComp);
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

    if (entity.camera) {
      data.components.push({
        type: 'camera',
        properties: {
          fov: entity.camera.fov,
          nearClip: entity.camera.nearClip,
          farClip: entity.camera.farClip
        }
      });
    }

    if (entity.collision) {
      data.components.push({
        type: 'collision',
        properties: {
          type: entity.collision.type
        }
      });
    }

    if (entity.rigidbody) {
      data.components.push({
        type: 'rigidbody',
        properties: {
          type: entity.rigidbody.type,
          mass: entity.rigidbody.mass
        }
      });
    }

    if (entity.particlesystem) {
      data.components.push({
        type: 'particlesystem',
        properties: {
          numParticles: entity.particlesystem.numParticles,
          lifetime: entity.particlesystem.lifetime
        }
      });
    }

    if (entity.sound) {
      data.components.push({
        type: 'sound',
        properties: {
          volume: entity.sound.volume,
          loop: entity.sound.loop
        }
      });
    }

    if (this.editor.behaviors) {
      const blist = this.editor.behaviors.getBehaviors ? this.editor.behaviors.getBehaviors(entity) : (this.editor.behaviors.activeBehaviors?.get(entity) || []);
      if (blist && blist.length > 0) {
        data.behaviors = blist.map(b => ({
          type: b.type,
          properties: b.params || b.properties || {}
        }));
      }
    }

    return data;
  }
}
