// =============================================================================
// 🤖 AI CONFIGURATION - Simple & Clean
// =============================================================================
//
// Add to .env:
// VITE_AI_PROVIDER=openai
// VITE_AI_API_KEY=your_key
// VITE_AI_MODEL=gpt-3.5-turbo (optional)

const PROVIDERS = {
  openai: {
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-3.5-turbo',
  },
  openrouter: {
    name: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    defaultModel: 'x-ai/grok-4-fast:free',
  },
  anthropic: {
    name: 'Anthropic',
    baseUrl: 'https://api.anthropic.com/v1',
    defaultModel: 'claude-3-haiku-20240307',
  },
  groq: {
    name: 'Groq',
    baseUrl: 'https://api.groq.com/openai/v1',
    defaultModel: 'mixtral-8x7b-32768',
  },
  ollama: {
    name: 'Ollama',
    baseUrl: 'http://localhost:11434',
    defaultModel: 'llama2',
  },
};

// Get current AI configuration
const getConfig = () => {
  const provider = import.meta.env.VITE_AI_PROVIDER || 'openrouter';
  const apiKey = import.meta.env.VITE_AI_API_KEY || '';
  const model = import.meta.env.VITE_AI_MODEL || '';

  const config = PROVIDERS[provider];
  if (!config) {
    return {
      available: false,
      error: `Unknown provider: ${provider}. Available: ${Object.keys(
        PROVIDERS
      ).join(', ')}`,
    };
  }

  const needsKey = provider !== 'ollama';
  const available = !needsKey || !!apiKey;

  return {
    provider,
    name: config.name,
    apiKey,
    model: model || config.defaultModel,
    baseUrl: config.baseUrl,
    available,
    needsKey,
  };
};

// Main exports
export const getActiveAIProvider = () => {
  const config = getConfig();
  if (!config.available) {
    console.warn(`🤖 ${config.error || 'AI not configured'}`);
    return null;
  }
  return config;
};

export const isAIAvailable = () => getConfig().available;

export const getAIStatus = () => {
  const config = getConfig();

  if (!config.available) {
    return {
      available: false,
      message: config.error || 'Add VITE_AI_API_KEY to .env',
      provider: config.provider,
    };
  }

  return {
    available: true,
    message: `✅ ${config.name} (${config.model})`,
    provider: config.provider,
    model: config.model,
  };
};

export default { getActiveAIProvider, isAIAvailable, getAIStatus };
