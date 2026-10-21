import * as pc from 'playcanvas';
import { showToast } from '../ui/toast.js';

/**
 * Makulu AI Scene Auditor & Health Doctor
 * Performs static analysis on the scene graph to detect performance traps, physics bugs, and misconfigurations.
 */
export class SceneAuditor {
  constructor(editor) {
    this.editor = editor;
  }

  audit() {
    const app = this.editor.getApp();
    if (!app || !app.root) return { issues: [], stats: {} };

    const issues = [];
    let totalEntities = 0;
    let totalLights = 0;
    let shadowCasters = 0;
    let dynamicPhysics = 0;

    const checkNode = (node) => {
      if (node.name === 'EditorGrid' || node.name === 'EditorCamera') return;
      totalEntities++;

      // 1. Check for zero scale
      const s = node.getLocalScale();
      if (s.x === 0 || s.y === 0 || s.z === 0) {
        issues.push({
          type: 'error',
          entity: node,
          msg: `Entity "${node.name}" has zero scale along one or more axes.`,
          fix: () => node.setLocalScale(1, 1, 1)
        });
      }

      // 2. Check for Rigidbody without Collision
      if (node.rigidbody && !node.collision) {
        issues.push({
          type: 'error',
          entity: node,
          msg: `Entity "${node.name}" has Rigidbody physics but NO Collision component (will fall through world).`,
          fix: () => node.addComponent('collision', { type: 'box' })
        });
        dynamicPhysics++;
      }

      // 3. Check for light parameters
      if (node.light) {
        totalLights++;
        if (node.light.castShadows) shadowCasters++;

        if (node.light.intensity > 15) {
          issues.push({
            type: 'warn',
            entity: node,
            msg: `Light "${node.name}" intensity (${node.light.intensity}) is excessively bright and may cause blowout.`,
            fix: () => { node.light.intensity = 3; }
          });
        }
      }

      if (node.children) {
        node.children.forEach(checkNode);
      }
    };

    app.root.children.forEach(checkNode);

    // 4. Check for excessive shadow casters
    if (shadowCasters > 4) {
      issues.push({
        type: 'warn',
        entity: null,
        msg: `Scene has ${shadowCasters} shadow-casting lights active, which may degrade performance on mobile/integrated GPUs.`,
        fix: () => {
          let count = 0;
          app.root.find(n => {
            if (n.light && n.light.castShadows) {
              count++;
              if (count > 2) n.light.castShadows = false;
            }
          });
        }
      });
    }

    const stats = {
      totalEntities,
      totalLights,
      shadowCasters,
      dynamicPhysics
    };

    return { issues, stats };
  }

  fixAll(issues) {
    let fixed = 0;
    issues.forEach(iss => {
      if (iss.fix) {
        try {
          iss.fix();
          fixed++;
        } catch (e) {
          console.error('SceneAuditor: Error fixing issue:', e);
        }
      }
    });

    this.editor.events.emit('scene:changed');
    showToast(`✓ AI Doctor fixed ${fixed} scene issue(s)!`, 'success');
    return fixed;
  }
}
