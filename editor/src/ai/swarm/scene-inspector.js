/**
 * MakuluLinux Game Studio · Scene Inspector & Critic Agent
 * Inspects scene graph against user intent, engine rules, physics soundness, and visual polish.
 * Modeled after AutoGPT's Critic / Evaluation loop.
 */
export class SceneInspector {
  constructor(editor) {
    this.editor = editor;
  }

  /**
   * Run deep inspection on the scene against user goal
   * @param {string} goalPrompt - The original user request
   * @param {Array} executedActions - Actions executed by previous worker agents
   * @returns {Object} { passed: boolean, score: number, checks: [], defects: [], repairPlan: [] }
   */
  inspect(goalPrompt = '', executedActions = []) {
    const app = this.editor.getApp();
    const root = (app && app.root) ? app.root : this.editor.root;
    if (!root) {
      return {
        passed: false,
        score: 0,
        checks: [],
        defects: ['Engine root entity not initialized'],
        repairPlan: []
      };
    }

    const checks = [];
    const defects = [];
    const repairPlan = [];
    let score = 100;
    const promptLower = (goalPrompt || '').toLowerCase();

    const entities = [];
    const collectNodes = (node) => {
      if (node.name !== 'EditorGrid' && node.name !== 'EditorCamera') {
        entities.push(node);
      }
      if (node.children) node.children.forEach(collectNodes);
    };
    root.children.forEach(collectNodes);

    // 1. Minimum Entity Count Verification
    if (entities.length === 0) {
      defects.push({
        id: 'empty_scene',
        severity: 'critical',
        msg: 'Scene has 0 user entities. Goal was not populated.',
        fix: { action: 'spawn_primitive', type: 'box', name: 'Starter_Floor', position: [0, 0, 0], scale: [10, 0.2, 10] }
      });
      score -= 50;
    } else {
      checks.push(`Scene contains ${entities.length} active entity/entities`);
    }

    // 2. Physics & Collider Sanity Check
    entities.forEach(ent => {
      // Zero scale check
      const s = ent.getLocalScale();
      if (s.x === 0 || s.y === 0 || s.z === 0) {
        defects.push({
          id: 'zero_scale',
          severity: 'error',
          entity: ent,
          msg: `Entity "${ent.name}" has zero scale [${s.x}, ${s.y}, ${s.z}].`,
          fix: { action: 'modify_entity', name: ent.name, scale: [Math.max(0.1, s.x), Math.max(0.1, s.y), Math.max(0.1, s.z)] }
        });
        score -= 10;
      }

      // Rigidbody without Collider check
      if (ent.rigidbody && !ent.collision) {
        defects.push({
          id: 'missing_collider',
          severity: 'critical',
          entity: ent,
          msg: `Entity "${ent.name}" has Rigidbody physics but lacks Collision (will fall into the void).`,
          fix: { action: 'add_component', target: ent.name, type: 'collision', properties: { type: 'box' } }
        });
        score -= 15;
      }
    });

    if (!defects.some(d => d.id === 'missing_collider')) {
      checks.push('All physics rigidbodies have matching collision bounds');
    }

    // 3. Lighting Sanity Check
    const lights = entities.filter(e => e.light);
    if (lights.length === 0) {
      defects.push({
        id: 'no_lights',
        severity: 'warning',
        msg: 'Scene has 0 light sources (scene may render dark or unlit).',
        fix: { action: 'create_light', type: 'directional', name: 'SunLight', position: [0, 15, 0], color: [1, 0.95, 0.85], intensity: 2.0 }
      });
      score -= 10;
    } else {
      checks.push(`Lighting verified: ${lights.length} light source(s) active`);

      lights.forEach(l => {
        if (l.light.intensity > 15.0) {
          defects.push({
            id: 'light_blowout',
            severity: 'warning',
            entity: l,
            msg: `Light "${l.name}" intensity (${l.light.intensity}) is excessively bright.`,
            fix: { action: 'create_light', type: l.light.type, name: l.name, color: [l.light.color.r, l.light.color.g, l.light.color.b], intensity: 3.0, range: l.light.range || 10 }
          });
          score -= 5;
        }
      });
    }

    // 4. Intent Verification: Player / Hero requested
    const playerRequested = /player|hero|knight|character|avatar|controllable|wasd/i.test(promptLower);
    if (playerRequested) {
      const hasPlayer = entities.some(e =>
        /player|hero|knight|avatar/i.test(e.name) ||
        (this.editor.behaviors && (this.editor.behaviors.hasBehavior(e, 'wasd') || this.editor.behaviors.hasBehavior(e, 'first_person_controller')))
      );

      if (!hasPlayer) {
        defects.push({
          id: 'missing_player',
          severity: 'error',
          msg: 'User requested a player/character, but no controllable player entity was found.',
          fix: { action: 'spawn_model', url: '/models/character_hero.glb', name: 'Player_Hero', position: [0, 0, 0], scale: [1, 1, 1] }
        });
        score -= 20;
      } else {
        checks.push('Playable character verified in scene hierarchy');
      }
    }

    // 5. Intent Verification: Enemy / Opponent requested
    const enemyRequested = /enemy|goblin|warrior|monster|opponent|guard|boss/i.test(promptLower);
    if (enemyRequested) {
      const hasEnemy = entities.some(e =>
        /enemy|goblin|warrior|monster|guard|boss/i.test(e.name) ||
        (this.editor.behaviors && (this.editor.behaviors.hasBehavior(e, 'enemy_ai') || this.editor.behaviors.hasBehavior(e, 'boss_ai') || this.editor.behaviors.hasBehavior(e, 'patrol')))
      );

      if (!hasEnemy) {
        defects.push({
          id: 'missing_enemy',
          severity: 'warning',
          msg: 'User requested an enemy or guard, but no AI adversary was found.',
          fix: { action: 'spawn_model', url: '/models/character_warrior.glb', name: 'Enemy_Warrior', position: [4, 0, 4], scale: [1, 1, 1] }
        });
        score -= 15;
      } else {
        checks.push('Enemy AI adversary verified in scene hierarchy');
      }
    }

    // 6. Build the repair plan from detected defects
    defects.forEach(d => {
      if (d.fix) repairPlan.push(d.fix);
    });

    score = Math.max(0, Math.min(100, score));
    const passed = defects.length === 0 || (defects.every(d => d.severity === 'warning') && score >= 85);

    return {
      passed,
      score,
      checks,
      defects,
      repairPlan
    };
  }
}
