/**
 * AI Provider Configuration
 * Settings for AI providers and models
 */

export const aiConfig = {
  // Current Provider Settings
  provider: process.env.AI_PROVIDER || "openrouter",
  apiKey: process.env.AI_API_KEY || "",
  model: process.env.AI_MODEL || "",

  // Known free vision-capable chat models. If a screenshot would be sent to the
  // AI but the configured model is NOT in this list, the image is dropped and
  // the request falls back to text-only. This makes the "model does not support
  // image input" error impossible for the end user. Models are matched by
  // substring (case-insensitive) so "gemma-4-26b" matches the OpenRouter id.
  visionModels: [
    "gemma-4",
    "nemotron-nano-12b",
    "nemotron-3-nano-omni",
    "llama-3.2-11b-vision",
    "llama-4-scout",
    "pixtral",
    "vision",
  ],

  // AI Request Settings
  maxTokens: 2000,
  temperature: 0.7,
  maxIssuesToProcess: 5,
  maxRecommendationsPerIssue: 3,

  // Timeout Settings
  analysisTimeout: 30000, // 30 seconds
  fixesTimeout: 20000, // 20 seconds

  // Provider Configurations
  providers: {
    // OpenAI - Direct API
    openai: {
      name: "OpenAI",
      baseUrl: "https://api.openai.com/v1",
      authHeader: "Authorization",
      authPrefix: "Bearer",
      defaultModel: "gpt-3.5-turbo",
      type: "openai",
    },

    // OpenRouter - Access to multiple models including free ones
    openrouter: {
      name: "OpenRouter",
      baseUrl: "https://openrouter.ai/api/v1",
      authHeader: "Authorization",
      authPrefix: "Bearer",
      defaultModel: "google/gemma-4-26b-a4b-it:free",
      type: "openai", // Uses OpenAI-compatible API
    },

    // Anthropic - Direct API
    anthropic: {
      name: "Anthropic",
      baseUrl: "https://api.anthropic.com/v1",
      authHeader: "x-api-key",
      authPrefix: "",
      defaultModel: "claude-3-haiku-20240307",
      type: "anthropic",
    },

    // Groq - Fast inference
    groq: {
      name: "Groq",
      baseUrl: "https://api.groq.com/openai/v1",
      authHeader: "Authorization",
      authPrefix: "Bearer",
      defaultModel: "mixtral-8x7b-32768",
      type: "openai", // Uses OpenAI-compatible API
    },

    // Ollama - Local models
    ollama: {
      name: "Ollama",
      baseUrl: "http://localhost:11434",
      authHeader: null, // No auth needed
      authPrefix: "",
      defaultModel: "llama2",
      type: "ollama",
    },
  },
};

export default aiConfig;
