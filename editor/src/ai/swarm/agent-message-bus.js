/**
 * MakuluLinux Game Studio · Agent Message Bus
 * Inter-agent communication hub modeled after AutoGPT agent protocols.
 * Allows autonomous agents to coordinate, exchange messages, and log activity in real-time.
 */
export class AgentMessageBus {
  constructor() {
    this.messages = [];
    this.listeners = new Set();
    this.agentStates = new Map();
  }

  /**
   * Post a message to the team bus
   * @param {Object} message - { from, to, type, content, data }
   */
  postMessage(message) {
    const msg = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
      from: message.from || 'System',
      to: message.to || 'All',
      type: message.type || 'info', // 'plan' | 'task' | 'thought' | 'action' | 'inspection' | 'critique' | 'repair' | 'done'
      content: message.content || '',
      data: message.data || null
    };

    this.messages.push(msg);
    this.notify(msg);
    return msg;
  }

  /**
   * Update the status of an agent
   * @param {string} agentId - e.g. 'director', 'architect', 'qa_inspector'
   * @param {string} status - 'idle' | 'planning' | 'working' | 'inspecting' | 'repairing' | 'completed' | 'error'
   * @param {string} currentTask - Brief summary of current action
   */
  setAgentState(agentId, status, currentTask = '') {
    this.agentStates.set(agentId, {
      status,
      currentTask,
      updatedAt: Date.now()
    });

    this.notify({
      type: 'agent_state_changed',
      agentId,
      status,
      currentTask
    });
  }

  getAgentState(agentId) {
    return this.agentStates.get(agentId) || { status: 'idle', currentTask: '', updatedAt: 0 };
  }

  getAllAgentStates() {
    return Object.fromEntries(this.agentStates);
  }

  /**
   * Subscribe to live agent messages
   */
  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notify(event) {
    for (const cb of this.listeners) {
      try {
        cb(event);
      } catch (err) {
        console.error('AgentMessageBus notification error:', err);
      }
    }
  }

  getHistory() {
    return this.messages;
  }

  clear() {
    this.messages = [];
    this.agentStates.clear();
  }
}
