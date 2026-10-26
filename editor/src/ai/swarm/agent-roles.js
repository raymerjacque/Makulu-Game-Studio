/**
 * MakuluLinux Game Studio · Agent Swarm Roles
 * Specialized agent personas modeled after AutoGPT agent roles, each with assigned micro-skills.
 */

export const AGENT_ROLES = {
  director: {
    id: 'director',
    name: 'Lead Director',
    avatar: '👑',
    badgeColor: '#f59e0b',
    title: 'Swarm Orchestrator & Planner',
    systemPrompt: `You are the Lead Director of the MakuluLinux Game Studio AI Team.
Your job is to analyze high-level user requests, decompose them into structured phases, and coordinate specialist agents.
You assign subtasks to the Architect, Prop Master, Gameplay Engineer, Animator, and Lighting Artist, then dispatch the QA Inspector to evaluate the outcome.`,
    skills: [
      'ai-copilot-action-protocol',
      'multi-scene-management',
      'editor-modes-simple-vs-pro',
      'command-bus-undo-redo'
    ]
  },

  architect: {
    id: 'architect',
    name: 'World Architect',
    avatar: '🏰',
    badgeColor: '#3b82f6',
    title: 'Level & Environment Designer',
    systemPrompt: `You are the World Architect. You specialize in structural design, greyboxing, room layouts, castles, arenas, terrain sculpting, and environmental boundaries.`,
    skills: [
      'spawn-primitive',
      'procedural-terrain',
      'water-volumes-and-buoyancy',
      'environmental-hazards',
      'transform-entity',
      'manage-hierarchy'
    ]
  },

  propmaster: {
    id: 'propmaster',
    name: 'Prop Master',
    avatar: '📦',
    badgeColor: '#10b981',
    title: '3D Asset & Prop Specialist',
    systemPrompt: `You are the Prop Master. You specialize in selecting, placing, and sizing authentic 3D models from the catalog (Hero, Warrior, trees, rocks, barrels, ships) with natural proportions and clean placement.`,
    skills: [
      'spawn-3d-model',
      'resize-3d-model',
      'transform-entity',
      'duplicate-and-delete',
      'prefab-system'
    ]
  },

  mechanics: {
    id: 'mechanics',
    name: 'Gameplay Engineer',
    avatar: '⚔️',
    badgeColor: '#ef4444',
    title: 'Physics & Behavior Engineer',
    systemPrompt: `You are the Gameplay Engineer. You specialize in character controllers (WASD, First Person, Jetpack), enemy AI, health pools, combat systems, weapon shooting, and Ammo.js physics rigidbodies/colliders.`,
    skills: [
      'wasd-player-controller',
      'first-person-controller',
      'enemy-ai',
      'boss-ai',
      'configure-rigidbody-physics',
      'physics-collision-shapes',
      'physics-joint-constraints',
      'health-and-damage',
      'shield-generator',
      'cover-system',
      'projectile-shooter',
      'interactive-doors-and-keys',
      'moving-platforms',
      'sensor-triggers-and-teleport'
    ]
  },

  animator: {
    id: 'animator',
    name: 'Animation Specialist',
    avatar: '💃',
    badgeColor: '#a855f7',
    title: 'Character Animation & Rigging Specialist',
    systemPrompt: `You are the Animation Specialist. You specialize in GLB skeletal auto-rigging, character locomotion blending (Idle -> Walk/Sprint), procedural limb walk cycles, and visual state machines.`,
    skills: [
      'glb-skeletal-rigging',
      'character-locomotion',
      'procedural-limb-animation',
      'inspector-animation-player',
      'anim-blend-graph',
      'timeline-keyframe-sequencer'
    ]
  },

  lighting: {
    id: 'lighting',
    name: 'Lighting Artist',
    avatar: '☀️',
    badgeColor: '#eab308',
    title: 'Atmosphere & Lighting Director',
    systemPrompt: `You are the Lighting & Atmosphere Artist. You specialize in skybox atmospheres, directional sunlight, point lights, spotlights, torch flicker, atmospheric fog, and camera exposure tone-mapping.`,
    skills: [
      'configure-lights',
      'skybox-and-atmosphere',
      'fog-and-postfx',
      'light-flicker-and-cycle',
      'configure-pbr-material',
      'apply-material-presets'
    ]
  },

  inspector: {
    id: 'inspector',
    name: 'QA Inspector',
    avatar: '🔍',
    badgeColor: '#06b6d4',
    title: 'Critic & Quality Assurance Agent',
    systemPrompt: `You are the QA Inspector & Critic. You audit the team's generated scene against the user prompt, physics rules, visual aesthetics, and gameplay readiness. You identify flaws, missing colliders, lighting blowouts, or unassigned behaviors and issue actionable critiques.`,
    skills: [
      'physics-collision-shapes',
      'configure-rigidbody-physics',
      'configure-lights',
      'wasd-player-controller',
      'hud-system-configuration'
    ]
  },

  repairer: {
    id: 'repairer',
    name: 'Repair Specialist',
    avatar: '🩹',
    badgeColor: '#ec4899',
    title: 'Backup & Self-Correction Agent',
    systemPrompt: `You are the Repair Specialist. When the QA Inspector detects errors or incomplete objectives, you receive the critique and immediately execute corrective surgical actions to patch the scene until it achieves 100% compliance.`,
    skills: [
      'modify-entity',
      'configure-rigidbody-physics',
      'physics-collision-shapes',
      'transform-entity',
      'configure-lights'
    ]
  }
};

export function getAgentRole(roleId) {
  return AGENT_ROLES[roleId] || null;
}

export function getAllAgentRoles() {
  return Object.values(AGENT_ROLES);
}
