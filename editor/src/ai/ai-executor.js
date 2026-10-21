/**
 * AI Action Executor
 * Extracts JSON action commands from AI responses and executes them via the Editor Command Bus.
 */

export class AIExecutor {
  constructor(editor) {
    this.editor = editor;
  }

  parseActions(aiResponseText) {
    const match = aiResponseText.match(/```json:actions([\s\S]*?)```/) ||
                  aiResponseText.match(/```json([\s\S]*?)```/);

    if (!match) return null;

    try {
      const data = JSON.parse(match[1].trim());
      return data.actions || (Array.isArray(data) ? data : [data]);
    } catch (e) {
      console.warn('AIExecutor: Failed to parse action JSON:', e);
      return null;
    }
  }

  async executeActions(actions) {
    if (!actions || !Array.isArray(actions)) return [];

    const executed = [];

    for (const act of actions) {
      try {
        switch (act.action) {
          case 'spawn_primitive': {
            const entity = this.editor.createEntity({
              name: act.name || `AI_${act.type}`,
              transform: {
                position: act.position || [0, 1, 0],
                rotation: act.rotation || [0, 0, 0],
                scale: act.scale || [1, 1, 1]
              },
              components: [
                { type: 'render', properties: { type: act.type } },
                ...(act.components || [])
              ]
            });
            executed.push({ action: act.action, target: entity.name });
            break;
          }

          case 'create_light': {
            const light = this.editor.createEntity({
              name: act.name || 'AI_Light',
              transform: {
                position: act.position || [0, 3, 0]
              },
              components: [
                {
                  type: 'light',
                  properties: {
                    type: act.type || 'point',
                    color: act.color ? new pc.Color(...act.color) : new pc.Color(1, 1, 1),
                    intensity: act.intensity || 2,
                    range: act.range || 10,
                    castShadows: true
                  }
                }
              ]
            });
            executed.push({ action: act.action, target: light.name });
            break;
          }

          case 'generate_script': {
            if (act.name && act.code) {
              this.editor.scripts.set(act.name, act.code);
              executed.push({ action: act.action, script: act.name });
            }
            break;
          }

          case 'modify_entity': {
            let target = null;
            if (act.name === 'selected') {
              target = this.editor.selection.getActive();
            } else {
              target = this.editor.getApp().root.findByName(act.name);
            }

            if (target) {
              if (act.position) target.setPosition(...act.position);
              if (act.scale) target.setLocalScale(...act.scale);
              this.editor.events.emit('entity:transformed', target);
              executed.push({ action: act.action, target: target.name });
            }
            break;
          }

          default:
            console.warn(`AIExecutor: Unknown action "${act.action}"`);
        }
      } catch (err) {
        console.error(`AIExecutor: Error executing action ${act.action}:`, err);
      }
    }

    return executed;
  }
}
