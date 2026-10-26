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
1. "spawn_primitive": { "type": "box"|"sphere"|"capsule"|"cylinder"|"cone"|"plane", "name": string, "position": [x,y,z], "scale": [x,y,z] }
2. "create_light": { "type": "directional"|"point"|"spot", "name": string, "position": [x,y,z], "color": [r,g,b], "intensity": number, "range": number }
3. "attach_behavior": { "target": string|"selected", "behavior": "wasd"|"spin"|"enemy_ai"|"projectile_shooter"|"boss_ai"|"stealth_ai"|"vehicle_controller"|"destruction_mesh"|"cinematic_cutscene_trigger"|"combo_score_counter"|"checkpoint_system"|"weather_emitter"|"shield_generator"|"health"|"collectible"|"turret_ai"|"interactive_door"|"moving_platform"|"teleport_gateway"|"lava_hazard"|"flashlight"|"coin_bounce"|"audio_trigger"|"postfx_trigger", "properties": {} }
4. "create_material": { "target": string|"selected", "diffuse": [r,g,b], "metalness": number, "roughness": number, "emissive": [r,g,b] }
5. "set_sky_atmosphere": { "preset": "day"|"sunset"|"cyberpunk"|"foggy"|"night" }
6. "set_postfx": { "exposure": number, "fog": { "color": [r,g,b], "density": number } }
7. "add_particle_system": { "target": string, "name": string, "position": [x,y,z], "numParticles": number, "colorTint": [r,g,b] }
8. "add_sound": { "target": string, "url": string, "volume": number, "autoPlay": boolean }
9. "add_component": { "target": string, "type": "rigidbody"|"collision"|"camera"|"light"|"render", "properties": {} }
10. "register_trigger": { "target": string, "eventType": "on_enter"|"on_exit", "triggerAction": "teleport"|"damage_player"|"heal_player"|"add_score"|"win_level", "targetPosition": [x,y,z] }
11. "spawn_model": { "url": string, "name": string, "position": [x,y,z], "scale": [x,y,z] }
12. "create_terrain": { "name": string, "width": number, "depth": number, "maxHeight": number }
13. "duplicate_entity": { "target": string|"selected" }
14. "modify_entity": { "name": string|"selected", "position": [x,y,z], "rotation": [x,y,z], "scale": [x,y,z] }
15. "delete_entity": { "target": string|"selected" }
16. "clear_scene": {}
17. "configure_hud": { "config": { "health": {"enabled": true}, "score": {"enabled": true}, "crosshair": {"enabled": true} } }
18. "generate_script": { "name": string, "code": string }

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
