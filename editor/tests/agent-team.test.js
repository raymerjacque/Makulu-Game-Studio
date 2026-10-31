import test from 'node:test';
import assert from 'node:assert/strict';
import { AgentMessageBus } from '../src/ai/swarm/agent-message-bus.js';
import { AGENT_ROLES, getAgentRole, getAllAgentRoles } from '../src/ai/swarm/agent-roles.js';
import { SceneInspector } from '../src/ai/swarm/scene-inspector.js';
import { AgentTeam } from '../src/ai/swarm/agent-team.js';
import { Editor } from '../src/core/editor.js';
import { AIExecutor } from '../src/ai/ai-executor.js';

test('AgentMessageBus broadcasts messages and tracks agent states', () => {
  const bus = new AgentMessageBus();
  const received = [];

  const unsubscribe = bus.subscribe((evt) => {
    received.push(evt);
  });

  bus.setAgentState('director', 'planning', 'Decomposing task');
  assert.equal(bus.getAgentState('director').status, 'planning');

  bus.postMessage({
    from: 'Director',
    type: 'plan',
    content: 'Plan initiated'
  });

  assert.equal(received.length, 2); // 1 state change + 1 message
  assert.equal(bus.getHistory().length, 1);
  assert.equal(bus.getHistory()[0].from, 'Director');

  unsubscribe();
  bus.postMessage({ from: 'Architect', content: 'Wall placed' });
  assert.equal(received.length, 2, 'Unsubscribed listener does not receive new events');
});

test('Agent Roles define all 8 AutoGPT specialists with assigned micro-skills', () => {
  const roles = getAllAgentRoles();
  assert.equal(roles.length, 8, 'Expected 8 specialist agent roles');

  const roleIds = roles.map(r => r.id);
  assert.ok(roleIds.includes('director'));
  assert.ok(roleIds.includes('architect'));
  assert.ok(roleIds.includes('propmaster'));
  assert.ok(roleIds.includes('mechanics'));
  assert.ok(roleIds.includes('animator'));
  assert.ok(roleIds.includes('lighting'));
  assert.ok(roleIds.includes('inspector'));
  assert.ok(roleIds.includes('repairer'));

  // Verify skills are mapped
  for (const r of roles) {
    assert.ok(r.skills && r.skills.length > 0, `Agent ${r.name} must have assigned skills`);
    assert.ok(r.avatar, `Agent ${r.name} must have an avatar`);
    assert.ok(r.systemPrompt, `Agent ${r.name} must have a system prompt`);
  }

  assert.equal(getAgentRole('director').name, 'Lead Director');
  assert.equal(getAgentRole('inspector').name, 'QA Inspector');
  assert.equal(getAgentRole('repairer').name, 'Repair Specialist');
});

test('SceneInspector detects defects and generates repair actions', () => {
  const editor = new Editor();
  const inspector = new SceneInspector(editor);

  // Initial empty scene inspection
  const report1 = inspector.inspect('Build a castle arena with player hero', []);
  assert.equal(report1.passed, false);
  assert.ok(report1.score < 100);
  assert.ok(report1.defects.length > 0);
  assert.ok(report1.repairPlan.length > 0);

  // Create entity with physics bug: Rigidbody without Collider
  const bugEntity = editor.createEntity({ name: 'BuggyBox' });
  editor.addComponent(bugEntity, 'rigidbody', { type: 'dynamic' });

  const report2 = inspector.inspect('Test scene', []);
  const colliderDefect = report2.defects.find(d => d.id === 'missing_collider');
  assert.ok(colliderDefect, 'Inspector caught Rigidbody without Collider');
  assert.equal(colliderDefect.fix.action, 'add_component');
  assert.equal(colliderDefect.fix.type, 'collision');
});

test('AgentTeam reports an unavailable runtime instead of certifying a headless placeholder scene', async () => {
  const editor = new Editor();
  const executor = new AIExecutor(editor);
  const team = new AgentTeam(editor, null, executor);

  const goal = 'Build a castle arena with a hero player character, trees, torches, and an enemy guard';
  const result = await team.executeTeamTask(goal, { maxRepairRounds: 2, useLLM: false });

  assert.ok(result);
  assert.equal(result.finalStatus, 'error');
  assert.ok(team.messageBus.getHistory().some(message => message.type === 'error' && /(runtime|asset loader) is unavailable/.test(message.content)));

  // Verify inter-agent messages in bus history
  const history = team.messageBus.getHistory();
  assert.ok(history.length >= 5, 'Message bus contains team dialogue');

  const senders = history.map(m => m.from);
  assert.ok(senders.includes('Lead Director'), 'Director spoke on the bus');
  assert.ok(senders.includes('World Architect'), 'Architect spoke on the bus');
  assert.ok(!result.inspection, 'Missing runtime must not receive a gameplay inspection certificate');
});
