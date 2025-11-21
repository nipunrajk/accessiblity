/**
 * AI Provider Service
 * Handles AI provider initialization and communication
 *
 * This service manages the connection to various AI providers (OpenAI, Anthropic, Groq, etc.)
 * and provides a unified interface for invoking AI models.
 *
 * @module services/ai/ai-provider
 */

import logger from '../../utils/logger.js';

/**
 * AI Provider Service Class
 * Manages AI provider initialization and API communication
 */
class AIProviderService {
  /**
   * Creates an instance of AIProviderService
   *
   * @param {Object} config - AI configuration object
   * @param {string} config.provider - Provider name (openai, anthropic, groq, etc.)
   * @param {string} config.apiKey - API key for authentication
   * @param {string} config.model - Model name to use
   * @param {Object} config.providers - Provider configurations
   * @param {number} config.maxTokens - Maximum tokens for responses
   * @param {number} config.temperature - Temperature for response generation
   *
   * @example
   * const aiProvider = new AIProviderService(config.ai);
   * const response = await aiProvider.invoke('Your prompt here');
   */
  constructor(config) {
    this.config = config;
    this.providerConfig = this._getProviderConfig();
    this._logStatus();
  }

  /**
   * Gets the provider configuration
   *
   * @private
   * @returns {Object} Provider configuration with availability status
   */
  _getProviderConfig() {
    const provider = this.config.provider;
    const providerConfig = this.config.providers[provider];

    if (!providerConfig) {
      const errorMsg = `Unknown provider: ${provider}. Available: ${Object.keys(
        this.config.providers
      ).join(', ')}`;
      logger.error(errorMsg);
      return { available: false, error: errorMsg };
    }

    // Use provided model or default
    const finalModel = this.config.model || providerConfig.defaultModel;

    // Check if API key is needed
    const needsApiKey = provider !== 'ollama';
    const available = !needsApiKey || !!this.config.apiKey;

    return {
      provider,
      name: providerConfig.name,
      apiKey: this.config.apiKey,
      model: finalModel,
      baseUrl: providerConfig.baseUrl,
      authHeader: providerConfig.authHeader,
      authPrefix: providerConfig.authPrefix,
      type: providerConfig.type,
      available,
      needsApiKey,
    };
  }

  /**
   * Logs the provider status on initialization
   *
   * @private
   */
  _logStatus() {
    if (this.providerConfig.available) {
      logger.aiProvider(this.providerConfig.name, this.providerConfig.model);
    } else {
      logger.warn(
        `AI not available. ${
          this.providerConfig.error || 'Add AI_API_KEY to .env file.'
        }`
      );
    }
  }

  /**
   * Checks if the AI provider is available
   *
   * @returns {boolean} True if provider is configured and available
   *
   * @example
   * if (aiProvider.isAvailable()) {
   *   const response = await aiProvider.invoke(prompt);
   * }
   */
  isAvailable() {
    return this.providerConfig.available;
  }

  /**
   * Invokes the AI provider with a prompt
   *
   * @param {string} prompt - The prompt to send to the AI
   * @returns {Promise<string>} The AI response content
   * @throws {Error} If provider is not configured or API call fails
   *
   * @example
   * try {
   *   const response = await aiProvider.invoke('Analyze this data...');
   *   console.log(response);
   * } catch (error) {
   *   console.error('AI invocation failed:', error);
   * }
   */
  async invoke(prompt) {
    if (!this.providerConfig.available) {
      throw new Error(
        `AI not configured. ${
          this.providerConfig.error || 'Add AI_API_KEY to .env file.'
        }`
      );
    }

    switch (this.providerConfig.type) {
      case 'openai':
        return await this._invokeOpenAICompatible(prompt);
      case 'anthropic':
        return await this._invokeAnthropic(prompt);
      case 'ollama':
        return await this._invokeOllama(prompt);
      default:
        throw new Error(
          `Unsupported provider type: ${this.providerConfig.type}`
        );
    }
  }

  /**
   * Invokes OpenAI-compatible API (OpenAI, Groq, OpenRouter)
   *
   * @private
   * @param {string} prompt - The prompt to send
   * @returns {Promise<string>} The AI response content
   * @throws {Error} If API call fails
   */
  async _invokeOpenAICompatible(prompt) {
    const headers = {
      'Content-Type': 'application/json',
    };

    // Add auth header if needed
    if (this.providerConfig.authHeader && this.providerConfig.apiKey) {
      const authValue = this.providerConfig.authPrefix
        ? `${this.providerConfig.authPrefix} ${this.providerConfig.apiKey}`
        : this.providerConfig.apiKey;
      headers[this.providerConfig.authHeader] = authValue;
    }

    logger.debug(`Calling ${this.providerConfig.name} API`, {
      model: this.providerConfig.model,
    });

    const response = await fetch(
      `${this.providerConfig.baseUrl}/chat/completions`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: this.providerConfig.model,
          messages: [{ role: 'user', content: prompt }],
          temperature: this.config.temperature,
          max_tokens: this.config.maxTokens,
        }),
      }
    );

    if (!response.ok) {
      const errorBody = await response.text();
      logger.error(`${this.providerConfig.name} API error`, null, {
        status: response.status,
        statusText: response.statusText,
        errorBody,
      });
      throw new Error(
        `${this.providerConfig.name} API error: ${response.statusText} - ${errorBody}`
      );
    }

    const data = await response.json();
    logger.debug(`${this.providerConfig.name} API response received`);
    return data.choices[0]?.message?.content || '';
  }

  /**
   * Invokes Anthropic API (Claude)
   *
   * @private
   * @param {string} prompt - The prompt to send
   * @returns {Promise<string>} The AI response content
   * @throws {Error} If API call fails
   */
  async _invokeAnthropic(prompt) {
    logger.debug(`Calling ${this.providerConfig.name} API`, {
      model: this.providerConfig.model,
    });

    const response = await fetch(`${this.providerConfig.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'x-api-key': this.providerConfig.apiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.providerConfig.model,
        max_tokens: this.config.maxTokens,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      logger.error(`${this.providerConfig.name} API error`, null, {
        status: response.status,
        statusText: response.statusText,
        errorBody,
      });
      throw new Error(
        `${this.providerConfig.name} API error: ${response.statusText} - ${errorBody}`
      );
    }

    const data = await response.json();
    logger.debug(`${this.providerConfig.name} API response received`);
    return data.content[0]?.text || '';
  }

  /**
   * Invokes Ollama API (local models)
   *
   * @private
   * @param {string} prompt - The prompt to send
   * @returns {Promise<string>} The AI response content
   * @throws {Error} If API call fails
   */
  async _invokeOllama(prompt) {
    logger.debug(`Calling ${this.providerConfig.name} API`, {
      model: this.providerConfig.model,
    });

    const response = await fetch(
      `${this.providerConfig.baseUrl}/api/generate`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.providerConfig.model,
          prompt: prompt,
          stream: false,
        }),
      }
    );

    if (!response.ok) {
      const errorBody = await response.text();
      logger.error(`${this.providerConfig.name} API error`, null, {
        status: response.status,
        statusText: response.statusText,
        errorBody,
      });
      throw new Error(
        `${this.providerConfig.name} API error: ${response.statusText} - ${errorBody}`
      );
    }

    const data = await response.json();
    logger.debug(`${this.providerConfig.name} API response received`);
    return data.response || '';
  }

  /**
   * Gets the current provider name
   *
   * @returns {string} Provider name
   */
  getProviderName() {
    return this.providerConfig.name;
  }

  /**
   * Gets the current model name
   *
   * @returns {string} Model name
   */
  getModelName() {
    return this.providerConfig.model;
  }
}

export default AIProviderService;
