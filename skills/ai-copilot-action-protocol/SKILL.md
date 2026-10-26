---
name: ai-copilot-action-protocol
category: ai-and-combat
tags: [ai-copilot, json-actions, autonomous, ai-executor]
description: "Instruct the AI Copilot to execute scene modifications using the structured json:actions protocol."
---

# AI Copilot Action Protocol Skill

## 🎯 When to Use This Skill
Use this skill whenever interacting with the in-editor AI Copilot to generate or modify scene content.

## 🔑 Key Concepts & Architecture
- Handled by `MakuluAIClient` (`editor/src/ai/ai-client.js`) and `AIExecutor` (`editor/src/ai/ai-executor.js`).
- The AI must wrap actions in a designated markdown code block:
  ```json:actions
  {
    "actions": [
      {
        "action": "<action_type>",
        "<prop1>": <value1>
      }
    ]
  }
  ```
- All actions are validated, wrapped in a atomic Command Bus transaction, and executed sequentially with visual feedback and toasts.
