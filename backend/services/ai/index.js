/**
 * AI Services Module
 * Exports configured AI service instances
 *
 * This module creates and exports singleton instances of AI services
 * with proper dependency injection.
 *
 * @module services/ai
 */

import { config } from '../../config/index.js';
import AIProviderService from './ai-provider.service.js';
import PromptBuilderService from './prompt-builder.service.js';
import AIAnalysisService from './ai-analysis.service.js';

// Create service instances with dependency injection
const aiProvider = new AIProviderService(config.ai);

const promptBuilder = new PromptBuilderService({
  maxRecommendationsPerIssue: config.ai.maxRecommendationsPerIssue,
});

const aiAnalysisService = new AIAnalysisService(aiProvider, promptBuilder, {
  maxIssuesToProcess: config.ai.maxIssuesToProcess,
  maxRecommendationsPerIssue: config.ai.maxRecommendationsPerIssue,
});

// Export singleton instances
export { aiProvider, promptBuilder, aiAnalysisService };

// Default export for backward compatibility
export default aiAnalysisService;
