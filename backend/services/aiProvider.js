import dotenv from 'dotenv';
import logger from '../utils/logger.js';

dotenv.config();

// =============================================================================
// 🤖 BACKEND AI PROVIDER - Production Ready!
// =============================================================================
//
// Just add these 3 lines to your .env file:
// AI_PROVIDER=openai
// AI_API_KEY=your_api_key_here
// AI_MODEL=gpt-3.5-turbo

class AIProvider {
  constructor() {
    // Provider configurations - easy to add new ones
    this.providers = {
      // OpenAI - Direct API
      openai: {
        name: 'OpenAI',
        baseUrl: 'https://api.openai.com/v1',
        authHeader: 'Authorization',
        authPrefix: 'Bearer',
        defaultModel: 'gpt-3.5-turbo',
        type: 'openai',
      },

      // OpenRouter - Access to multiple models including free ones
      openrouter: {
        name: 'OpenRouter',
        baseUrl: 'https://openrouter.ai/api/v1',
        authHeader: 'Authorization',
        authPrefix: 'Bearer',
        defaultModel: 'x-ai/grok-4-fast:free',
        type: 'openai', // Uses OpenAI-compatible API
      },

      // Anthropic - Direct API
      anthropic: {
        name: 'Anthropic',
        baseUrl: 'https://api.anthropic.com/v1',
        authHeader: 'x-api-key',
        authPrefix: '',
        defaultModel: 'claude-3-haiku-20240307',
        type: 'anthropic',
      },

      // Groq - Fast inference
      groq: {
        name: 'Groq',
        baseUrl: 'https://api.groq.com/openai/v1',
        authHeader: 'Authorization',
        authPrefix: 'Bearer',
        defaultModel: 'mixtral-8x7b-32768',
        type: 'openai', // Uses OpenAI-compatible API
      },

      // Ollama - Local models
      ollama: {
        name: 'Ollama',
        baseUrl: 'http://localhost:11434',
        authHeader: null, // No auth needed
        authPrefix: '',
        defaultModel: 'llama2',
        type: 'ollama',
      },

      // Easy to add new providers for future free APIs
      // Example:
      // newprovider: {
      //   name: 'New Provider',
      //   baseUrl: 'https://api.newprovider.com/v1',
      //   authHeader: 'Authorization',
      //   authPrefix: 'Bearer',
      //   defaultModel: 'new-model-name',
      //   type: 'openai', // or 'anthropic' or 'custom'
      // },
    };

    this.config = this.getConfig();
    this.logStatus();
  }

  getConfig() {
    const provider = process.env.AI_PROVIDER || 'openrouter'; // Default to OpenRouter for free models
    const apiKey = process.env.AI_API_KEY || '';
    const model = process.env.AI_MODEL || '';

    // Get provider configuration
    const providerConfig = this.providers[provider];

    if (!providerConfig) {
      const errorMsg = `Unknown provider: ${provider}. Available: ${Object.keys(
        this.providers
      ).join(', ')}`;
      logger.error(errorMsg);
      return { available: false, error: errorMsg };
    }

    // Use provided model or default
    const finalModel = model || providerConfig.defaultModel;

    // Check if API key is needed
    const needsApiKey = provider !== 'ollama';
    const available = !needsApiKey || !!apiKey;

    return {
      provider,
      name: providerConfig.name,
      apiKey,
      model: finalModel,
      baseUrl: providerConfig.baseUrl,
      authHeader: providerConfig.authHeader,
      authPrefix: providerConfig.authPrefix,
      type: providerConfig.type,
      available,
      needsApiKey,
    };
  }

  logStatus() {
    if (this.config.available) {
      logger.aiProvider(this.config.name, this.config.model);
    } else {
      logger.warn(
        `AI not available. ${
          this.config.error || 'Add AI_API_KEY to .env file.'
        }`
      );
    }
  }

  isAvailable() {
    return this.config.available;
  }

  async invoke(prompt) {
    if (!this.config.available) {
      throw new Error(
        `AI not configured. ${
          this.config.error || 'Add AI_API_KEY to .env file.'
        }`
      );
    }

    switch (this.config.type) {
      case 'openai':
        return await this.invokeOpenAICompatible(prompt);
      case 'anthropic':
        return await this.invokeAnthropic(prompt);
      case 'ollama':
        return await this.invokeOllama(prompt);
      default:
        throw new Error(`Unsupported provider type: ${this.config.type}`);
    }
  }

  async invokeOpenAICompatible(prompt) {
    const headers = {
      'Content-Type': 'application/json',
    };

    // Add auth header if needed
    if (this.config.authHeader && this.config.apiKey) {
      const authValue = this.config.authPrefix
        ? `${this.config.authPrefix} ${this.config.apiKey}`
        : this.config.apiKey;
      headers[this.config.authHeader] = authValue;
    }

    logger.debug(`Calling ${this.config.name} API`, {
      model: this.config.model,
    });

    const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: this.config.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      logger.error(`${this.config.name} API error`, null, {
        status: response.status,
        statusText: response.statusText,
        errorBody,
      });
      throw new Error(
        `${this.config.name} API error: ${response.statusText} - ${errorBody}`
      );
    }

    const data = await response.json();
    logger.debug(`${this.config.name} API response received`);
    return data.choices[0]?.message?.content || '';
  }

  async invokeAnthropic(prompt) {
    const response = await fetch(`${this.config.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'x-api-key': this.config.apiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.config.model,
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.content[0]?.text || '';
  }

  async invokeOllama(prompt) {
    const response = await fetch(`${this.config.baseUrl}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.config.model,
        prompt: prompt,
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.response || '';
  }
}

// Create a function that returns a new instance when called
// This ensures environment variables are loaded when the instance is created
const createAIProvider = () => new AIProvider();

// Export a singleton that gets created on first access
let instance = null;

const getAIProvider = () => {
  if (!instance) {
    instance = createAIProvider();
  }
  return instance;
};

export default {
  isAvailable() {
    return getAIProvider().isAvailable();
  },

  async invoke(prompt) {
    return await getAIProvider().invoke(prompt);
  },
};
