import logger from '../utils/logger.js';
import { getAIProviderConfig } from '../config/index.js';

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
    this.config = this.getConfig();
    this.logStatus();
  }

  getConfig() {
    // Get configuration from centralized config module
    const providerConfig = getAIProviderConfig();

    if (!providerConfig) {
      const errorMsg = 'AI provider configuration not available';
      logger.error(errorMsg);
      return { available: false, error: errorMsg };
    }

    return providerConfig;
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
