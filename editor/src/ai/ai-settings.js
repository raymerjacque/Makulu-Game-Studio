/**
 * AI Provider Settings Manager
 * Handles multi-provider API configurations, model selections, and persistent localStorage state.
 * Automatically detects MakuluLinux AI-OS system credentials (~/.config/ai_terminal/electra_auth.json).
 */

const STORAGE_KEY = 'makululinux_ai_settings_v1';

export const DEFAULT_AI_PROVIDERS = {
  makulu: {
    id: 'makulu',
    name: 'Electra AI (MakuluLinux)',
    badge: 'Auto-Detect / Key',
    icon: '🐧',
    endpoint: 'https://makululinux.us:2007/v1/chat/completions',
    apiKey: '', // Empty by default - auto-detected or user entered
    model: 'electra-nano',
    availableModels: ['electra-nano', 'electra'],
    keyUrl: 'https://makululinux.org',
    notes: 'Native Electra AI cluster. Auto-detects key from MakuluLinux AI-OS or enter your key.'
  },
  openai: {
    id: 'openai',
    name: 'OpenAI',
    badge: 'Industry Standard',
    icon: '⚡',
    endpoint: 'https://api.openai.com/v1/chat/completions',
    apiKey: '',
    model: 'gpt-4o-mini',
    availableModels: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'o3-mini', 'o1-mini'],
    keyUrl: 'https://platform.openai.com/api-keys',
    notes: 'Requires an OpenAI API key. High performance and reasoning capabilities.'
  },
  gemini: {
    id: 'gemini',
    name: 'Google Gemini',
    badge: 'Generous Free Tier',
    icon: '✨',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
    apiKey: '',
    model: 'gemini-1.5-flash',
    availableModels: ['gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-2.5-pro-exp'],
    keyUrl: 'https://aistudio.google.com/app/apikey',
    notes: 'Fast response times and generous free tier from Google AI Studio.'
  },
  claude: {
    id: 'claude',
    name: 'Anthropic Claude',
    badge: 'Top Tier Coding',
    icon: '🧠',
    endpoint: 'https://api.anthropic.com/v1/messages',
    apiKey: '',
    model: 'claude-3-5-sonnet-20241022',
    availableModels: ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022', 'claude-3-opus-20240229'],
    keyUrl: 'https://console.anthropic.com/settings/keys',
    notes: 'Renowned for nuanced code generation and structured reasoning.'
  },
  kimi: {
    id: 'kimi',
    name: 'Kimi (Moonshot AI)',
    badge: 'Long Context',
    icon: '🌙',
    endpoint: 'https://api.moonshot.cn/v1/chat/completions',
    apiKey: '',
    model: 'moonshot-v1-8k',
    availableModels: ['moonshot-v1-8k', 'moonshot-v1-32k', 'moonshot-v1-128k'],
    keyUrl: 'https://platform.moonshot.cn/console/api-keys',
    notes: 'Ultra-long context windows and fast inference.'
  },
  mimo: {
    id: 'mimo',
    name: 'MiniMax / Mimo',
    badge: 'Multi-lingual',
    icon: '🔮',
    endpoint: 'https://api.minimaxi.chat/v1/chat/completions',
    apiKey: '',
    model: 'MiniMax-Text-01',
    availableModels: ['MiniMax-Text-01', 'abab6.5s-chat', 'abab6.5-chat'],
    keyUrl: 'https://api.minimax.chat',
    notes: 'Advanced multilingual intelligence and high speed.'
  },
  mistral: {
    id: 'mistral',
    name: 'Mistral AI',
    badge: 'European Open Model',
    icon: '🌪️',
    endpoint: 'https://api.mistral.ai/v1/chat/completions',
    apiKey: '',
    model: 'mistral-small-latest',
    availableModels: ['mistral-large-latest', 'mistral-small-latest', 'codestral-latest'],
    keyUrl: 'https://console.mistral.ai/api-keys',
    notes: 'Efficient French AI frontier models including Codestral for game code.'
  },
  groq: {
    id: 'groq',
    name: 'Groq Cloud',
    badge: 'Ultra Fast (LPU)',
    icon: '⚡',
    endpoint: 'https://api.groq.com/openai/v1/chat/completions',
    apiKey: '',
    model: 'llama-3.3-70b-versatile',
    availableModels: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'deepseek-r1-distill-llama-70b'],
    keyUrl: 'https://console.groq.com/keys',
    notes: 'Blazing fast inference on LPU chips with near-instant responses.'
  },
  openrouter: {
    id: 'openrouter',
    name: 'OpenRouter',
    badge: 'Multi-Model Aggregator',
    icon: '🌐',
    endpoint: 'https://openrouter.ai/api/v1/chat/completions',
    apiKey: '',
    model: 'openrouter/auto',
    availableModels: [
      'openrouter/auto',
      'anthropic/claude-3.5-sonnet',
      'deepseek/deepseek-chat',
      'meta-llama/llama-3.3-70b-instruct',
      'google/gemini-2.0-flash-exp:free'
    ],
    keyUrl: 'https://openrouter.ai/keys',
    notes: 'One key to access Claude, DeepSeek, Llama, and hundreds of models.'
  },
  custom: {
    id: 'custom',
    name: 'Custom / Local AI (Ollama)',
    badge: 'Self-Hosted / Offline',
    icon: '💻',
    endpoint: 'http://localhost:11434/v1/chat/completions',
    apiKey: 'ollama',
    model: 'llama3.2',
    availableModels: ['llama3.2', 'deepseek-coder', 'qwen2.5-coder', 'custom'],
    keyUrl: 'https://ollama.com',
    notes: 'Point to any local OpenAI-compatible inference server (Ollama, LM Studio, vLLM).'
  }
};

export class AISettingsManager {
  constructor() {
    this.activeProviderId = 'makulu';
    this.providers = JSON.parse(JSON.stringify(DEFAULT_AI_PROVIDERS));
    this.systemAuth = null;
    this.isSystemAuthDetected = false;
    this.listeners = [];
    this.load();
    this.detectSystemAuth();
  }

  load() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.activeProviderId && this.providers[parsed.activeProviderId]) {
          this.activeProviderId = parsed.activeProviderId;
        }
        if (parsed.providers) {
          for (const key of Object.keys(parsed.providers)) {
            if (this.providers[key]) {
              // Load user-customized keys and preferences
              this.providers[key].apiKey = parsed.providers[key].apiKey || this.providers[key].apiKey;
              this.providers[key].model = parsed.providers[key].model || this.providers[key].model;
              this.providers[key].endpoint = parsed.providers[key].endpoint || this.providers[key].endpoint;
            }
          }
        }
      }
    } catch (err) {
      console.warn('AISettingsManager: Failed to load stored settings:', err);
    }
  }

  /**
   * Auto-detect MakuluLinux OS Electra authentication (~/.config/ai_terminal/electra_auth.json)
   */
  async detectSystemAuth() {
    let auth = null;

    // 1. Check Electron desktop IPC bridge
    if (typeof window !== 'undefined' && window.makuluDesktop && typeof window.makuluDesktop.getElectraAuth === 'function') {
      try {
        auth = await window.makuluDesktop.getElectraAuth();
      } catch (err) {
        console.warn('System Electra authentication is unavailable.');
      }
    }

    // Browser users configure their own provider in AI Settings.
    // Never expose operating-system credentials through an HTTP endpoint.

    if (auth && auth.apiKey) {
      this.systemAuth = auth;
      this.isSystemAuthDetected = true;
      // If user hasn't explicitly entered a different key, use system key
      if (!this.providers.makulu.apiKey) {
        this.providers.makulu.apiKey = auth.apiKey;
      }
      this.providers.makulu.badge = `OS Detected (${auth.tier})`;
      this.providers.makulu.notes = `Auto-detected from MakuluLinux AI-OS (~/.config/ai_terminal/electra_auth.json for @${auth.username}).`;
      this.notify();
    } else {
      if (!this.providers.makulu.apiKey) {
        this.providers.makulu.badge = 'Key Required';
        this.providers.makulu.notes = 'Enter your Electra AI key below or switch to OpenAI, Gemini, Claude, Groq in settings.';
      }
    }
  }

  save() {
    try {
      const payload = {
        activeProviderId: this.activeProviderId,
        providers: this.providers
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      this.notify();
    } catch (err) {
      console.error('AISettingsManager: Failed to persist settings:', err);
    }
  }

  getActiveProvider() {
    return this.providers[this.activeProviderId] || this.providers.makulu;
  }

  setActiveProvider(providerId) {
    if (this.providers[providerId]) {
      this.activeProviderId = providerId;
      this.save();
    }
  }

  updateProvider(providerId, updates) {
    if (this.providers[providerId]) {
      Object.assign(this.providers[providerId], updates);
      this.save();
    }
  }

  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  notify() {
    const active = this.getActiveProvider();
    for (const listener of this.listeners) {
      try {
        listener(active, this);
      } catch (s) {
        console.error(s);
      }
    }
  }

  /**
   * Test connection to a provider
   */
  async testConnection(providerId) {
    const p = this.providers[providerId];
    if (!p) throw new Error('Unknown provider');
    
    if (!p.apiKey && providerId !== 'custom') {
      if (providerId === 'makulu') {
        throw new Error('No Electra AI key detected. If you are on MakuluLinux, ensure ~/.config/ai_terminal/electra_auth.json is present, or enter your Electra key in the API Key box.');
      }
      throw new Error(`API key required for ${p.name}. Please enter your key in settings.`);
    }

    const startTime = performance.now();

    if (providerId === 'claude') {
      // Anthropic /v1/messages
      const res = await fetch(p.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': p.apiKey,
          'anthropic-version': '2023-06-01',
          'dangerously-allow-browser': 'true'
        },
        body: JSON.stringify({
          model: p.model,
          max_tokens: 16,
          messages: [{ role: 'user', content: 'Respond with the single word: OK' }]
        })
      });

      const elapsed = Math.round(performance.now() - startTime);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status}: ${text}`);
      }
      return { ok: true, latency: elapsed, provider: p.name, model: p.model };
    } else {
      // Standard OpenAI-compatible format (OpenAI, Gemini, Mistral, Groq, Moonshot, OpenRouter, Makulu)
      const headers = {
        'Content-Type': 'application/json'
      };
      if (p.apiKey) {
        headers['Authorization'] = `Bearer ${p.apiKey}`;
      }

      const res = await fetch(p.endpoint, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          model: p.model,
          messages: [{ role: 'user', content: 'Ping' }],
          max_tokens: 10
        })
      });

      const elapsed = Math.round(performance.now() - startTime);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status}: ${text}`);
      }
      return { ok: true, latency: elapsed, provider: p.name, model: p.model };
    }
  }
}

// Global Singleton
export const aiSettings = new AISettingsManager();
