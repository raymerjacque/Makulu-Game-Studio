import * as pc from 'playcanvas';
import { Command } from '../core/command-bus.js';
import { showToast } from '../ui/toast.js';
import { generateTerrainData, applyTerrainMesh } from './terrain-data.js';

/** Generates a persistable final height grid and a real terrain mesh. */
export class TerrainGenerator {
  constructor(editor) { this.editor = editor; }

  generate(options = {}) {
    const app = this.editor.getApp();
    if (!app?.graphicsDevice) throw new Error('Terrain generation requires an initialized graphics device.');
    const data = generateTerrainData(options);
    const entity = new pc.Entity(options.name || 'Procedural Terrain');
    try {
      applyTerrainMesh(pc, app, entity, data);
      entity.addComponent('collision', { type: 'mesh', model: entity._terrainCollisionModel });
      entity.addComponent('rigidbody', { type: 'static', friction: 0.8, restitution: 0 });
      const root = app.root;
      // Register the complete entity as one undoable operation.
      const command = new Command('Create terrain', () => {
        root.addChild(entity); this.editor.selection.set(entity); this.editor.events.emit('scene:changed'); return entity;
      }, () => { entity.parent?.removeChild(entity); this.editor.selection.clear(); this.editor.events.emit('scene:changed'); });
      this.editor.commandBus.execute(command);
      showToast(`Generated terrain "${entity.name}" (${data.width} × ${data.depth}m).`, 'success');
      return entity;
    } catch (error) { entity.destroy(); throw error; }
  }
}
