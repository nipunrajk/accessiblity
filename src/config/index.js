/**
 * Centralized Frontend Configuration Module
 * Aggregates all configuration from various config files
 */

import apiConfig from './api.config.js';

/**
 * AI Provider Configuration
 */
export const aiConfig = {
  // Current Provider Settings
  provider: import.meta.env.VITE_AI_PROVIDER || 'openrouter',
  apiKey: import.meta.env.VITE_AI_API_KEY || '',
  model: import.meta.env.VITE_AI_MODEL || '',

  // Provider Configurations
  providers: {
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
  },
};

/**
 * Score Configuration
 */
export const scoreConfig = {
  thresholds: {
    excellent: 90,
    good: 50,
    poor: 0,
  },
  colors: {
    excellent: '#22c55e', // green-500
    good: '#f59e0b', // amber-500
    poor: '#ef4444', // red-500
  },
};

/**
 * Issue Configuration
 */
export const issueConfig = {
  categories: {
    performance: 'performance',
    accessibility: 'accessibility',
    bestPractices: 'best-practices',
    seo: 'seo',
  },
  impactLevels: {
    critical: 'critical',
    high: 'high',
    medium: 'medium',
    low: 'low',
  },
  impactThresholds: {
    performance: {
      critical: 25,
      high: 15,
      medium: 8,
    },
    accessibility: {
      critical: 15,
      high: 10,
      medium: 5,
    },
    'best-practices': {
      critical: 20,
      high: 12,
      medium: 6,
    },
    seo: {
      critical: 18,
      high: 10,
      medium: 5,
    },
  },
};

/**
 * Storage Configuration
 */
export const storageConfig = {
  prefix: 'fastfix_',
  keys: {
    analysisResults: 'analysis_results',
    aiAnalysis: 'ai_analysis',
    aiFixes: 'ai_fixes',
    scanStats: 'scan_stats',
    scannedElements: 'scanned_elements',
    elementIssues: 'element_issues',
    websiteUrl: 'website_url',
  },
};

/**
 * Supabase Configuration
 */
export const supabaseConfig = {
  url: import.meta.env.VITE_SUPABASE_URL || '',
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
};

/**
 * Performance Metrics Configuration
 */
export const metricsConfig = {
  performance: [
    { key: 'fcp', label: 'First Contentful Paint' },
    { key: 'lcp', label: 'Largest Contentful Paint' },
    { key: 'tbt', label: 'Total Blocking Time' },
    { key: 'cls', label: 'Cumulative Layout Shift' },
    { key: 'si', label: 'Speed Index' },
    { key: 'tti', label: 'Time to Interactive' },
  ],
};

/**
 * Error Messages Configuration
 */
export const errorMessages = {
  networkError: 'Network error. Please check your connection and try again.',
  aiUnavailable: 'AI service is currently unavailable. Please try again later.',
  analysisFailed:
    'Website analysis failed. Please check the URL and try again.',
  invalidUrl: 'Please enter a valid website URL.',
  githubConfigMissing:
    'GitHub configuration is missing. Please set up your GitHub integration.',
  unexpectedError: 'An unexpected error occurred. Please try again.',
};

/**
 * Main configuration object
 */
export const config = {
  api: apiConfig,
  ai: aiConfig,
  score: scoreConfig,
  issue: issueConfig,
  storage: storageConfig,
  metrics: metricsConfig,
  errors: errorMessages,
  supabase: supabaseConfig,
};

/**
 * Gets the current AI provider configuration
 * @returns {Object|null} Provider configuration or null if not available
 */
export function getAIProviderConfig() {
  const providerConfig = aiConfig.providers[aiConfig.provider];
  if (!providerConfig) {
    return {
      available: false,
      error: `Unknown provider: ${aiConfig.provider}. Available: ${Object.keys(
        aiConfig.providers
      ).join(', ')}`,
    };
  }

  const needsKey = aiConfig.provider !== 'ollama';
  const available = !needsKey || !!aiConfig.apiKey;

  return {
    provider: aiConfig.provider,
    name: providerConfig.name,
    apiKey: aiConfig.apiKey,
    model: aiConfig.model || providerConfig.defaultModel,
    baseUrl: providerConfig.baseUrl,
    available,
    needsKey,
  };
}

/**
 * Checks if AI is available
 * @returns {boolean} True if AI is configured and available
 */
export function isAIAvailable() {
  const config = getAIProviderConfig();
  return config.available;
}

/**
 * Gets AI status information
 * @returns {Object} Status information
 */
export function getAIStatus() {
  const config = getAIProviderConfig();

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
}

export default config;
