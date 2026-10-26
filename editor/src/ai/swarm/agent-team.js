import { AgentMessageBus } from './agent-message-bus.js';
import { AGENT_ROLES } from './agent-roles.js';
import { SceneInspector } from './scene-inspector.js';

/**
 * MakuluLinux Game Studio · Agent Swarm Team
 * Orchestrates a team of autonomous AI specialists working in a chain of thought,
 * execution, inspection, and self-repair (modeled after AutoGPT).
 */
export class AgentTeam {
  constructor(editor, client = null, executor = null) {
    this.editor = editor;
    this.client = client;
    this.executor = executor;
    this.messageBus = new AgentMessageBus();
    this.inspector = new SceneInspector(editor);
    this.isRunning = false;
  }

  /**
   * Execute a user goal using the collaborative multi-agent swarm
   * @param {string} goalPrompt - User's natural language request
   * @param {Object} options - { maxRepairRounds: 2, useLLM: boolean }
   */
  async executeTeamTask(goalPrompt, options = {}) {
    if (this.isRunning) {
      console.warn('AgentTeam: A task is already in progress.');
      return null;
    }

    this.isRunning = true;
    const maxRepairRounds = options.maxRepairRounds !== undefined ? options.maxRepairRounds : 2;
    const promptText = (goalPrompt || '').trim();

    const teamRun = {
      id: `swarm_${Date.now()}`,
      goal: promptText,
      startTime: Date.now(),
      steps: [],
      executedActions: [],
      inspection: null,
      repairs: [],
      finalStatus: 'in_progress'
    };

    try {
      // =========================================================================
      // PHASE 1: 👑 Lead Director Analysis & Task Decomposition
      // =========================================================================
      this.messageBus.setAgentState('director', 'planning', 'Decomposing user goal into specialist tasks');
      this.messageBus.postMessage({
        from: AGENT_ROLES.director.name,
        type: 'plan',
        content: `🎯 Received Goal: "${promptText}". Initializing team execution pipeline with Architect, Prop Master, Mechanics, Lighting, and QA Inspector.`
      });

      const subtasks = this.decomposeGoal(promptText);
      teamRun.steps.push({ phase: 'plan', subtasks });

      // =========================================================================
      // PHASE 2: 👷 Specialist Worker Execution Chain
      // =========================================================================
      const allWorkerActions = [];

      for (const task of subtasks) {
        const agent = AGENT_ROLES[task.agentId] || AGENT_ROLES.architect;
        this.messageBus.setAgentState(agent.id, 'working', task.description);
        this.messageBus.postMessage({
          from: agent.name,
          type: 'task',
          content: `${agent.avatar} **${agent.name}**: Starting task &mdash; ${task.description}...`
        });

        // Determine actions for this specialist task
        let actions = task.actions || [];
        if (actions.length === 0 && this.client && options.useLLM) {
          try {
            const agentPrompt = `${agent.systemPrompt}\n\nTask: ${task.description}\nContext: Goal is "${promptText}". Return json:actions.`;
            const resp = await this.client.sendMessage(agentPrompt);
            if (this.executor) {
              actions = this.executor.parseActions(resp) || [];
            }
          } catch (err) {
            console.warn(`AgentTeam: Error during ${agent.name} LLM query:`, err);
          }
        }

        // Execute actions through the executor
        if (actions.length > 0 && this.executor) {
          const executed = await this.executor.executeActions(actions);
          allWorkerActions.push(...executed);
          teamRun.executedActions.push(...executed);

          this.messageBus.postMessage({
            from: agent.name,
            type: 'action',
            content: `✓ Completed: Executed ${executed.length} action(s).`,
            data: executed
          });
        }

        this.messageBus.setAgentState(agent.id, 'completed', 'Task finished');
      }

      // =========================================================================
      // PHASE 3: 🔍 QA Inspector Audit & Evaluation
      // =========================================================================
      this.messageBus.setAgentState('inspector', 'inspecting', 'Auditing scene for compliance and physics bugs');
      this.messageBus.postMessage({
        from: AGENT_ROLES.inspector.name,
        type: 'inspection',
        content: `🔍 **QA Inspector**: Auditing scene against user intent, physics bounds, and lighting integrity...`
      });

      let inspection = this.inspector.inspect(promptText, teamRun.executedActions);
      teamRun.inspection = inspection;

      if (inspection.passed) {
        this.messageBus.postMessage({
          from: AGENT_ROLES.inspector.name,
          type: 'inspection',
          content: `🟢 **QA Verified (Score: ${inspection.score}/100)**: All checks passed cleanly!\n${inspection.checks.map(c => `• ✓ ${c}`).join('\n')}`
        });
      } else {
        this.messageBus.postMessage({
          from: AGENT_ROLES.inspector.name,
          type: 'critique',
          content: `⚠️ **QA Critique (Score: ${inspection.score}/100)**: Detected ${inspection.defects.length} issue(s) needing attention:\n${inspection.defects.map(d => `• ⚠️ ${d.msg}`).join('\n')}`,
          data: inspection.defects
        });
      }

      // =========================================================================
      // PHASE 4: 🩹 Self-Correction & Backup Repair Agent
      // =========================================================================
      let repairRound = 0;
      while (!inspection.passed && inspection.repairPlan.length > 0 && repairRound < maxRepairRounds) {
        repairRound++;
        this.messageBus.setAgentState('repairer', 'repairing', `Applying repair cycle ${repairRound}`);
        this.messageBus.postMessage({
          from: AGENT_ROLES.repairer.name,
          type: 'repair',
          content: `🩹 **Repair Specialist**: Applying ${inspection.repairPlan.length} surgical correction(s) to resolve QA critique...`
        });

        if (this.executor) {
          const repaired = await this.executor.executeActions(inspection.repairPlan);
          teamRun.repairs.push(...repaired);
          teamRun.executedActions.push(...repaired);

          this.messageBus.postMessage({
            from: AGENT_ROLES.repairer.name,
            type: 'repair',
            content: `✓ Applied fixes:\n${repaired.map(r => `• Fixed ${r.action}: ${r.target || 'Entity'}`).join('\n')}`
          });
        }

        // Re-inspect to confirm fix
        inspection = this.inspector.inspect(promptText, teamRun.executedActions);
        teamRun.inspection = inspection;
        this.messageBus.setAgentState('repairer', 'completed', 'Corrections applied');
      }

      // =========================================================================
      // PHASE 5: 👑 Lead Director Mission Summary
      // =========================================================================
      this.messageBus.setAgentState('director', 'completed', 'Mission finished');
      teamRun.finalStatus = (inspection.passed || inspection.score >= 80) ? 'success' : 'completed_with_warnings';
      teamRun.endTime = Date.now();

      this.messageBus.postMessage({
        from: AGENT_ROLES.director.name,
        type: 'done',
        content: `🎉 **Mission Accomplished!** Team finalized the scene with **${teamRun.executedActions.length} total action(s)** and QA score of **${inspection.score}/100**.\n${teamRun.repairs.length > 0 ? `• Auto-repaired ${teamRun.repairs.length} issues.` : '• Zero repairs needed on initial generation.'}`
      });

      return teamRun;
    } catch (err) {
      console.error('AgentTeam: Fatal error during task execution:', err);
      this.messageBus.postMessage({
        from: AGENT_ROLES.director.name,
        type: 'error',
        content: `❌ Mission failed due to error: ${err.message}`
      });
      teamRun.finalStatus = 'error';
      return teamRun;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Decomposes user goal into specialist agent assignments
   * @param {string} prompt - Raw user prompt
   */
  decomposeGoal(prompt) {
    const p = prompt.toLowerCase();
    const tasks = [];

    // 1. World Architect task
    if (/castle|arena|room|corridor|platform|terrain|mountain|island|ground|floor|wall|pillar|world/i.test(p) || p.length > 0) {
      const actions = [];
      if (/castle|arena/i.test(p)) {
        actions.push({ action: 'build_architecture', type: 'arena', position: [0, 0, 0], width: 14, depth: 14, height: 4 });
      } else if (/terrain|mountain|island/i.test(p)) {
        actions.push({ action: 'create_terrain', name: 'Main_Terrain', width: 24, depth: 24, maxHeight: 4 });
      } else {
        actions.push({ action: 'spawn_primitive', type: 'box', name: 'Ground_Platform', position: [0, 0, 0], scale: [16, 0.4, 16] });
      }
      tasks.push({
        agentId: 'architect',
        description: 'Construct structural floor, walls, and layout geometry',
        actions
      });
    }

    // 2. Prop Master task
    if (/tree|forest|rock|boulder|barrel|chest|ship|cannon|bridge|prop/i.test(p)) {
      const actions = [];
      if (/tree|forest/i.test(p)) {
        actions.push({ action: 'spawn_model', url: '/models/oak_tree.glb', name: 'Oak_Tree_1', position: [-4, 0, -4], scale: [1.2, 1.2, 1.2] });
        actions.push({ action: 'spawn_model', url: '/models/pine_tree.glb', name: 'Pine_Tree_2', position: [5, 0, -3], scale: [1.4, 1.4, 1.4] });
      }
      if (/rock|boulder/i.test(p)) {
        actions.push({ action: 'spawn_model', url: '/models/boulder.glb', name: 'Boulder_1', position: [-3, 0, 4], scale: [1.5, 1.5, 1.5] });
      }
      if (/chest|treasure/i.test(p)) {
        actions.push({ action: 'spawn_model', url: '/models/chest.glb', name: 'Treasure_Chest', position: [0, 0.2, 5], scale: [1, 1, 1] });
      }
      tasks.push({
        agentId: 'propmaster',
        description: 'Place 3D props and environment models with natural scale',
        actions
      });
    }

    // 3. Gameplay Engineer task
    const actions = [];
    if (/player|hero|knight|character|avatar|controllable|wasd/i.test(p) || p.includes('game') || p.includes('play')) {
      actions.push({
        action: 'spawn_model',
        url: '/models/character_hero.glb',
        name: 'Player_Hero',
        position: [0, 0, 0],
        scale: [1, 1, 1]
      });
      actions.push({
        action: 'attach_behavior',
        target: 'Player_Hero',
        behavior: 'wasd',
        properties: { speed: 8.0 }
      });
    }

    if (/enemy|goblin|warrior|monster|guard|boss/i.test(p)) {
      actions.push({
        action: 'spawn_model',
        url: '/models/character_warrior.glb',
        name: 'Enemy_Guard',
        position: [4, 0, 4],
        scale: [1, 1, 1]
      });
      actions.push({
        action: 'attach_behavior',
        target: 'Enemy_Guard',
        behavior: 'enemy_ai',
        properties: { speed: 3.5, detectRadius: 15, damage: 15 }
      });
    }

    if (actions.length > 0) {
      tasks.push({
        agentId: 'mechanics',
        description: 'Configure character controllers, behaviors, combat mechanics, and physics',
        actions
      });
    }

    // 4. Lighting & Atmosphere Artist task
    const lightActions = [];
    if (/sunset/i.test(p)) {
      lightActions.push({ action: 'set_sky_atmosphere', preset: 'sunset' });
    } else if (/cyberpunk|neon/i.test(p)) {
      lightActions.push({ action: 'set_sky_atmosphere', preset: 'cyberpunk' });
    } else if (/night/i.test(p)) {
      lightActions.push({ action: 'set_sky_atmosphere', preset: 'night' });
    } else {
      lightActions.push({ action: 'set_sky_atmosphere', preset: 'day' });
    }

    lightActions.push({
      action: 'create_light',
      type: 'directional',
      name: 'Sun_Light',
      position: [0, 20, 0],
      color: [1.0, 0.95, 0.85],
      intensity: 2.0
    });

    if (/torch|fire|lantern|lamp/i.test(p)) {
      lightActions.push({
        action: 'create_light',
        type: 'point',
        name: 'Torch_Flame',
        position: [0, 2.5, 0],
        color: [1.0, 0.6, 0.2],
        intensity: 3.5,
        range: 12.0
      });
      lightActions.push({
        action: 'attach_behavior',
        target: 'Torch_Flame',
        behavior: 'light_flicker',
        properties: { baseIntensity: 3.0, variance: 0.8 }
      });
    }

    tasks.push({
      agentId: 'lighting',
      description: 'Set skybox atmosphere, lighting moods, and postfx tones',
      actions: lightActions
    });

    return tasks;
  }
}
