/**
 * AI Analysis Service
 * Handles AI-powered analysis and recommendations generation
 *
 * This service orchestrates AI analysis by using the AI provider for communication
 * and the prompt builder for constructing prompts. It handles insights generation,
 * fix recommendations, and error handling.
 *
 * @module services/ai/ai-analysis
 */

import logger from '../../utils/logger.js';

/**
 * AI Analysis Service Class
 * Generates insights and recommendations using AI
 */
class AIAnalysisService {
  /**
   * Creates an instance of AIAnalysisService
   *
   * @param {Object} aiProvider - AI provider service instance
   * @param {Object} promptBuilder - Prompt builder service instance
   * @param {Object} config - Configuration object
   * @param {number} config.maxIssuesToProcess - Maximum issues to process
   * @param {number} config.maxRecommendationsPerIssue - Maximum recommendations per issue
   *
   * @example
   * const aiAnalysis = new AIAnalysisService(aiProvider, promptBuilder, {
   *   maxIssuesToProcess: 5,
   *   maxRecommendationsPerIssue: 3
   * });
   */
  constructor(aiProvider, promptBuilder, config = {}) {
    this.aiProvider = aiProvider;
    this.promptBuilder = promptBuilder;
    this.maxIssuesToProcess = config.maxIssuesToProcess || 5;
    this.maxRecommendationsPerIssue = config.maxRecommendationsPerIssue || 3;
  }

  /**
   * Generates AI insights from analysis results
   *
   * @param {Object} results - Analysis results object
   * @param {Object} results.performance - Performance metrics and score
   * @param {Object} results.accessibility - Accessibility metrics and score
   * @param {Object} results.bestPractices - Best practices metrics and score
   * @param {Object} results.seo - SEO metrics and score
   * @returns {Promise<string|null>} AI-generated insights or null if unavailable
   *
   * @example
   * try {
   *   const insights = await aiAnalysis.generateInsights(results);
   *   if (insights) {
   *     console.log('AI Insights:', insights);
   *   }
   * } catch (error) {
   *   console.error('Failed to generate insights:', error);
   * }
   */
  async generateInsights(results) {
    if (!this.aiProvider.isAvailable()) {
      logger.warn('AI provider not available for insights generation');
      return null;
    }

    const prompt = this.promptBuilder.buildInsightsPrompt(results);

    try {
      logger.debug('Generating AI insights');
      const insights = await this.aiProvider.invoke(prompt);
      logger.success('AI insights generated');
      return insights;
    } catch (error) {
      logger.error('Failed to generate AI insights', error);
      throw new Error(`AI insights generation failed: ${error.message}`);
    }
  }

  /**
   * Generates AI fixes for multiple issues
   *
   * @param {Array<Object>} issues - Array of issue objects
   * @param {string} issues[].type - Issue type
   * @param {string} issues[].title - Issue title
   * @param {string} issues[].description - Issue description
   * @param {number} issues[].impact - Impact score
   * @returns {Promise<Object|null>} Object with issue titles as keys and recommendations as values, or null
   *
   * @example
   * const suggestions = await aiAnalysis.generateFixes([
   *   { type: 'accessibility', title: 'Missing alt text', description: '...', impact: 8 },
   *   { type: 'performance', title: 'Unoptimized images', description: '...', impact: 7 }
   * ]);
   *
   * if (suggestions) {
   *   Object.entries(suggestions).forEach(([title, recommendations]) => {
   *     console.log(`${title}:`, recommendations);
   *   });
   * }
   */
  async generateFixes(issues) {
    if (!this.aiProvider.isAvailable() || !Array.isArray(issues)) {
      logger.warn('AI provider not available or invalid issues array');
      return null;
    }

    const suggestions = {};
    const uniqueIssues = this._getUniqueIssues(issues);
    const limitedIssues = uniqueIssues.slice(0, this.maxIssuesToProcess);

    logger.debug('Generating AI fixes', {
      totalIssues: issues.length,
      uniqueIssues: uniqueIssues.length,
      processing: limitedIssues.length,
    });

    for (const issue of limitedIssues) {
      try {
        const recommendations = await this.getIssueRecommendations(issue);
        suggestions[issue.title] = recommendations;
      } catch (error) {
        logger.error(`Failed to get recommendations for ${issue.title}`, error);
        suggestions[issue.title] = this._getErrorRecommendation();
      }
    }

    const hasResults = Object.keys(suggestions).length > 0;
    if (hasResults) {
      logger.success('AI fixes generated', {
        issueCount: Object.keys(suggestions).length,
      });
    }

    return hasResults ? suggestions : null;
  }

  /**
   * Gets AI recommendations for a single issue
   *
   * @param {Object} issue - Issue object
   * @param {string} issue.type - Issue type
   * @param {string} issue.title - Issue title
   * @param {string} issue.description - Issue description
   * @param {number} issue.impact - Impact score
   * @returns {Promise<Array<Object>>} Array of recommendation objects
   * @throws {Error} If AI response is empty or invalid
   *
   * @example
   * const recommendations = await aiAnalysis.getIssueRecommendations({
   *   type: 'accessibility',
   *   title: 'Missing alt text',
   *   description: 'Images must have alternate text',
   *   impact: 8
   * });
   */
  async getIssueRecommendations(issue) {
    const prompt = this.promptBuilder.buildIssuePrompt(issue);
    const content = await this.aiProvider.invoke(prompt);

    if (!content) {
      throw new Error('No content in AI response');
    }

    return this._parseRecommendations(content);
  }

  /**
   * Parses AI recommendations from response content
   *
   * @private
   * @param {string} content - AI response content
   * @returns {Array<Object>} Array of parsed recommendation objects
   */
  _parseRecommendations(content) {
    const recommendations = [];
    const sections = content.split(/\d+\.\s+/).filter(Boolean);

    for (const section of sections.slice(0, this.maxRecommendationsPerIssue)) {
      const parsed = this._parseRecommendationSection(section);
      if (parsed) {
        recommendations.push(parsed);
      }
    }

    return recommendations;
  }

  /**
   * Parses a single recommendation section
   *
   * @private
   * @param {string} section - Section text to parse
   * @returns {Object|null} Parsed recommendation object or null if invalid
   */
  _parseRecommendationSection(section) {
    const lines = section
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length === 0) return null;

    const title = lines[0];
    let implementation = '';
    let codeExample = '';
    let expectedImpact = '';

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];

      if (line.includes('Implementation:')) {
        implementation = line.replace('- Implementation:', '').trim();
      } else if (line.includes('Code Example:')) {
        codeExample = this._extractCodeBlock(lines, i);
      } else if (line.includes('Expected Impact:')) {
        expectedImpact = line.replace('- Expected Impact:', '').trim();
      }
    }

    return {
      description: title,
      implementation,
      codeExample,
      expectedImpact,
      selector: null,
      snippet: codeExample || null,
    };
  }

  /**
   * Extracts code block from lines array
   *
   * @private
   * @param {Array<string>} lines - Array of text lines
   * @param {number} startIndex - Starting index for code block
   * @returns {string} Extracted code block
   */
  _extractCodeBlock(lines, startIndex) {
    let codeBlock = '';
    let i = startIndex + 1;

    if (i < lines.length && lines[i].includes('```')) {
      i++; // Skip opening ```
      while (i < lines.length && !lines[i].includes('```')) {
        codeBlock += lines[i] + '\n';
        i++;
      }
    }

    return codeBlock.trim();
  }

  /**
   * Gets unique issues by title
   *
   * @private
   * @param {Array<Object>} issues - Array of issue objects
   * @returns {Array<Object>} Array of unique issues
   */
  _getUniqueIssues(issues) {
    return issues.filter(
      (issue, index, self) =>
        index === self.findIndex((i) => i.title === issue.title)
    );
  }

  /**
   * Gets error recommendation when AI fails
   *
   * @private
   * @returns {Array<Object>} Array with single error recommendation
   */
  _getErrorRecommendation() {
    return [
      {
        description: 'Failed to generate AI recommendations for this issue',
        implementation: 'Please check the issue manually or try again later',
        codeExample: '',
        expectedImpact: 'Manual review required',
        selector: null,
        snippet: null,
      },
    ];
  }

  /**
   * Checks if AI provider is available
   *
   * @returns {boolean} True if AI provider is available
   */
  isAvailable() {
    return this.aiProvider.isAvailable();
  }
}

export default AIAnalysisService;
