import { aiSettings } from './ai-settings.js';

/**
 * Universal AI Engine Client
 * Supports MakuluLinux AI, OpenAI, Google Gemini, Anthropic Claude,
 * Kimi (Moonshot), MiniMax/Mimo, Mistral, Groq, OpenRouter, and Local LLMs.
 */
export class MakuluAIClient {
  constructor(editor) {
    this.editor = editor;
    this.history = [];
    this.settings = aiSettings;
  }

  getActiveConfig() {
    return this.settings.getActiveProvider();
  }

  getSystemPrompt() {
    return `You are the MakuluLinux Game Studio Autonomous AI Co-Creator.
You assist game developers using the PlayCanvas 3D WebGL/WebGPU engine.
You have direct execution access to modify the 3D scene, spawn entities, configure lights, cameras, physics, and write PlayCanvas JavaScript scripts.

Whenever the user asks you to create, modify, add, or generate something in the 3D scene or write scripts, you MUST provide a friendly explanation AND output a JSON block wrapped in \`\`\`json:actions ... \`\`\` with the exact action list.

Supported action types:
1. "spawn_primitive":
   - "type": "box" | "sphere" | "capsule" | "cylinder" | "cone" | "plane"
   - "name": string
   - "position": [x, y, z]
   - "rotation": [x, y, z] (optional)
   - "scale": [x, y, z] (optional)
   - "components": array of components (e.g. [{"type": "rigidbody", "properties": {"type": "dynamic"}}])

2. "create_light":
   - "type": "directional" | "point" | "spot"
   - "name": string
   - "position": [x, y, z]
   - "color": [r, g, b] (0 to 1)
   - "intensity": number
   - "range": number

3. "generate_script":
   - "name": string (e.g. "rotate.js", "playerController.js")
   - "code": string (valid PlayCanvas script using pc.createScript)
   - "attachTo": string (optional entity name to attach to)

4. "modify_entity":
   - "name": string (target entity name or "selected")
   - "position": [x, y, z] (optional)
   - "scale": [x, y, z] (optional)

Example format:
Here is your castle courtyard with pillars and lighting:
\`\`\`json:actions
{
  "actions": [
    {
      "action": "spawn_primitive",
      "type": "cylinder",
      "name": "Pillar_1",
      "position": [-3, 1.5, -3],
      "scale": [0.6, 3, 0.6]
    },
    {
      "action": "spawn_primitive",
      "type": "cylinder",
      "name": "Pillar_2",
      "position": [3, 1.5, -3],
      "scale": [0.6, 3, 0.6]
    },
    {
      "action": "create_light",
      "type": "point",
      "name": "Courtyard_Fire",
      "position": [0, 1.5, 0],
      "color": [1.0, 0.5, 0.1],
      "intensity": 3.0,
      "range": 10
    }
  ]
}
\`\`\`
Always keep the scene balanced, aesthetically pleasing, and technically sound.`;
  }

  async sendMessage(userMessage, onChunk = null) {
    this.history.push({ role: 'user', content: userMessage });

    const config = this.getActiveConfig();
    const systemPrompt = this.getSystemPrompt();

    try {
      if (config.id === 'claude') {
        // Anthropic Claude Messages API
        const messages = this.history.slice(-8).map(m => ({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: m.content
        }));

        const response = await fetch(config.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': config.apiKey,
            'anthropic-version': '2023-06-01',
            'dangerously-allow-browser': 'true'
          },
          body: JSON.stringify({
            model: config.model,
            system: systemPrompt,
            messages: messages,
            max_tokens: 2048,
            temperature: 0.7
          })
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`Claude API HTTP ${response.status}: ${errText}`);
        }

        const data = await response.json();
        const content = data.content && data.content[0] ? data.content[0].text : '';
        this.history.push({ role: 'assistant', content: content });
        return content;
      } else {
        // Standard OpenAI-compatible API (OpenAI, Gemini, Mistral, Groq, Moonshot, OpenRouter, Makulu, Local)
        const messages = [
          { role: 'system', content: systemPrompt },
          ...this.history.slice(-8)
        ];

        const headers = {
          'Content-Type': 'application/json'
        };
        if (config.apiKey) {
          headers['Authorization'] = `Bearer ${config.apiKey}`;
        }

        const response = await fetch(config.endpoint, {
          method: 'POST',
          headers: headers,
          body: JSON.stringify({
            model: config.model,
            messages: messages,
            temperature: 0.7,
            max_tokens: 2048
          })
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`${config.name} HTTP ${response.status}: ${errText}`);
        }

        const data = await response.json();
        const content = data.choices && data.choices[0] && data.choices[0].message
          ? data.choices[0].message.content
          : '';

        this.history.push({ role: 'assistant', content: content });
        return content;
      }
    } catch (err) {
      console.error(`AI Client (${config.name}) Request failed:`, err);
      throw err;
    }
  }
}
