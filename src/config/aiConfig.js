// AI Configuration
// Add your API keys here to enable AI-powered analysis

const AI_CONFIG = {
  // OpenAI Configuration
  openai: {
    apiKey: import.meta.env.VITE_OPENAI_API_KEY || '', // Add your OpenAI API key
    model: 'gpt-3.5-turbo', // or 'gpt-4'
    enabled: false, // Set to true to enable
  },

  // Anthropic Claude Configuration
  anthropic: {
    apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY || '', // Add your Anthropic API key
    model: 'claude-3-haiku-20240307', // or 'claude-3-sonnet-20240229'
    enabled: false, // Set to true to enable
  },

  // OpenRouter Configuration (Free models available)
  openrouter: {
    apiKey: import.meta.env.VITE_OPENROUTER_API_KEY || '', // Add your OpenRouter API key here
    model: 'x-ai/grok-4-fast:free', // Reliable free model (fallback while testing Grok)
    enabled: true, // Set to true to enable
    baseUrl: 'https://openrouter.ai/api/v1',
    // Available free models (try these one by one):
    // 'google/gemma-7b-it:free' - Google Gemma 7B (most reliable)
    // 'mistralai/mistral-7b-instruct:free' - Mistral 7B
    // 'openchat/openchat-7b:free' - OpenChat 7B
    // 'x-ai/grok-beta:free' - xAI Grok Beta (try this for Grok)
    // 'x-ai/grok-2-mini:free' - xAI Grok 2 Mini (alternative)
    // 'nousresearch/hermes-3-llama-3.1-405b:free' - Hermes 3 (if available)
    // Note: Check https://openrouter.ai/models for current free models
  },

  // Google Gemini Configuration
  google: {
    apiKey: import.meta.env.VITE_GOOGLE_API_KEY || '', // Add your Google API key
    model: 'gemini-pro',
    enabled: false, // Set to true to enable
  },

  // Groq Configuration (Fast inference)
  groq: {
    apiKey: import.meta.env.VITE_GROQ_API_KEY || '', // Add your Groq API key
    model: 'mixtral-8x7b-32768',
    enabled: false, // Set to true to enable
  },

  // Ollama Configuration (Local models)
  ollama: {
    baseUrl: import.meta.env.VITE_OLLAMA_URL || 'http://localhost:11434', // Ollama server URL
    model: 'llama2', // or 'mistral', 'codellama'
    enabled: false, // Set to true if you have Ollama running locally
  },
};

// Quick Setup Examples:
//
// 1. Enable xAI Grok 4 Fast (Recommended - Free & Fast):
//    - Get API key from https://openrouter.ai/keys
//    - Set VITE_OPENROUTER_API_KEY in .env file OR add directly above
//    - Model 'x-ai/grok-4-fast:free' is already selected (already enabled by default)
//
// 2. Enable OpenAI:
//    - Get API key from https://platform.openai.com/api-keys
//    - Set VITE_OPENAI_API_KEY in .env file OR add directly above
//    - Set openai.enabled = true
//
// 3. Enable free OpenRouter models (no API key needed):
//    - Just set openrouter.enabled = true (already enabled by default)
//    - Works without API key but limited rate limits
//
// 4. Enable Anthropic Claude:
//    - Get API key from https://console.anthropic.com/
//    - Set VITE_ANTHROPIC_API_KEY in .env file OR add directly above
//    - Set anthropic.enabled = true
//
// 5. Use local Ollama:
//    - Install Ollama: https://ollama.ai/
//    - Run: ollama pull llama2
//    - Set ollama.enabled = true

// Get the first enabled AI provider
export const getActiveAIProvider = () => {
  const providers = Object.entries(AI_CONFIG);

  for (const [name, config] of providers) {
    if (config.enabled) {
      // Check if provider has required credentials
      if (name === 'openrouter') {
        // For OpenRouter, return config if it's a free model OR has API key
        if (config.model.includes(':free') || config.apiKey) {
          return { name, ...config };
        }
      }
      if (config.apiKey || name === 'ollama') {
        return { name, ...config };
      }
    }
  }

  return null; // No AI provider available
};

// Fallback models for OpenRouter if primary fails
export const getOpenRouterFallbacks = () => [
  'google/gemma-7b-it:free',
  'mistralai/mistral-7b-instruct:free',
  'openchat/openchat-7b:free',
  'x-ai/grok-beta:free',
  'x-ai/grok-2-mini:free',
];

// Check if any AI provider is available
export const isAIAvailable = () => {
  return getActiveAIProvider() !== null;
};

// Get AI status for debugging
export const getAIStatus = () => {
  const activeProvider = getActiveAIProvider();

  if (!activeProvider) {
    return {
      available: false,
      message: 'No AI provider configured. Check src/config/aiConfig.js',
      suggestions: [
        'Enable openrouter for free models (no API key needed)',
        'Add OpenAI API key for GPT models',
        'Add Anthropic API key for Claude models',
        'Install Ollama for local models',
      ],
    };
  }

  return {
    available: true,
    provider: activeProvider.name,
    model: activeProvider.model,
    message: `AI enabled with ${activeProvider.name} (${activeProvider.model})`,
  };
};

export default AI_CONFIG;
