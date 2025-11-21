/**
 * Centralized Configuration Module
 * Aggregates all configuration from various config files
 */

import appConfig from './app.config.js';
import aiConfig from './ai.config.js';

/**
 * Main configuration object
 * @typedef {Object} Config
 * @property {Object} app - Application configuration
 * @property {Object} ai - AI provider configuration
 */
export const config = {
  app: appConfig,
  ai: aiConfig,
};

/**
 * Validates required configuration values
 * @throws {Error} If required configuration is missing or invalid
 */
export function validateConfig() {
  const errors = [];

  // Validate server configuration
  if (!config.app.server.port) {
    errors.push('Server port is not configured');
  }

  // Validate port is a valid number
  const port = parseInt(config.app.server.port);
  if (isNaN(port) || port < 1 || port > 65535) {
    errors.push(`Invalid port number: ${config.app.server.port}`);
  }

  // Validate AI provider if configured
  if (config.ai.provider) {
    const providerConfig = config.ai.providers[config.ai.provider];
    if (!providerConfig) {
      errors.push(
        `Unknown AI provider: ${
          config.ai.provider
        }. Available providers: ${Object.keys(config.ai.providers).join(', ')}`
      );
    }

    // Check if API key is required but missing
    const needsApiKey = config.ai.provider !== 'ollama';
    if (needsApiKey && !config.ai.apiKey) {
      console.warn(
        `⚠️  AI provider "${config.ai.provider}" requires an API key but AI_API_KEY is not set. AI features will be unavailable.`
      );
    }
  }

  // Validate analysis configuration
  if (config.app.analysis.maxPages < 1) {
    errors.push('Max pages to scan must be at least 1');
  }

  if (errors.length > 0) {
    throw new Error(
      `Configuration validation failed:\n${errors
        .map((e) => `  - ${e}`)
        .join('\n')}`
    );
  }

  return true;
}

/**
 * Gets the current AI provider configuration
 * @returns {Object|null} Provider configuration or null if not available
 */
export function getAIProviderConfig() {
  const providerConfig = config.ai.providers[config.ai.provider];
  if (!providerConfig) {
    return null;
  }

  const needsApiKey = config.ai.provider !== 'ollama';
  const available = !needsApiKey || !!config.ai.apiKey;

  return {
    provider: config.ai.provider,
    name: providerConfig.name,
    apiKey: config.ai.apiKey,
    model: config.ai.model || providerConfig.defaultModel,
    baseUrl: providerConfig.baseUrl,
    authHeader: providerConfig.authHeader,
    authPrefix: providerConfig.authPrefix,
    type: providerConfig.type,
    available,
    needsApiKey,
  };
}

export default config;
