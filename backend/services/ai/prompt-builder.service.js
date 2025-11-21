import { memoize } from '../../utils/memoize.js';

/**
 * Prompt Builder Service
 * Constructs prompts for AI analysis and recommendations
 *
 * This service encapsulates all prompt building logic, making it easy to
 * maintain and update prompt templates without modifying the analysis logic.
 *
 * Prompt building is memoized to avoid redundant string operations for
 * identical inputs, improving performance when analyzing similar content.
 *
 * @module services/ai/prompt-builder
 */

/**
 * Prompt Builder Service Class
 * Creates structured prompts for different AI analysis tasks
 */
class PromptBuilderService {
  /**
   * Creates an instance of PromptBuilderService
   *
   * @param {Object} config - Configuration object
   * @param {number} config.maxRecommendationsPerIssue - Maximum recommendations per issue
   *
   * @example
   * const promptBuilder = new PromptBuilderService({ maxRecommendationsPerIssue: 3 });
   * const prompt = promptBuilder.buildInsightsPrompt(results);
   */
  constructor(config = {}) {
    this.maxRecommendationsPerIssue = config.maxRecommendationsPerIssue || 3;

    // Memoize expensive prompt building operations
    this._buildInsightsPromptMemoized = memoize(
      this._buildInsightsPromptInternal.bind(this),
      { maxSize: 50, ttl: 300000 } // 5 minute TTL
    );

    this._buildIssuePromptMemoized = memoize(
      this._buildIssuePromptInternal.bind(this),
      { maxSize: 100, ttl: 300000 }
    );

    this._buildBatchFixesPromptMemoized = memoize(
      this._buildBatchFixesPromptInternal.bind(this),
      {
        maxSize: 50,
        ttl: 300000,
        keyGenerator: (issues) => JSON.stringify(issues.map((i) => i.title)),
      }
    );
  }

  /**
   * Get memoization statistics for monitoring
   * @returns {Object} Cache statistics for all memoized methods
   */
  getCacheStats() {
    return {
      insights: this._buildInsightsPromptMemoized.stats(),
      issue: this._buildIssuePromptMemoized.stats(),
      batchFixes: this._buildBatchFixesPromptMemoized.stats(),
    };
  }

  /**
   * Clear all prompt caches
   */
  clearCache() {
    this._buildInsightsPromptMemoized.clear();
    this._buildIssuePromptMemoized.clear();
    this._buildBatchFixesPromptMemoized.clear();
  }

  /**
   * Builds a prompt for generating insights from analysis results (memoized)
   *
   * @param {Object} results - Analysis results object
   * @param {Object} results.performance - Performance metrics and score
   * @param {Object} results.accessibility - Accessibility metrics and score
   * @param {Object} results.bestPractices - Best practices metrics and score
   * @param {Object} results.seo - SEO metrics and score
   * @returns {string} Formatted prompt for AI insights generation
   *
   * @example
   * const prompt = promptBuilder.buildInsightsPrompt({
   *   performance: { score: 85, metrics: {...} },
   *   accessibility: { score: 92, metrics: {...} },
   *   bestPractices: { score: 88, metrics: {...} },
   *   seo: { score: 90, metrics: {...} }
   * });
   */
  buildInsightsPrompt(results) {
    return this._buildInsightsPromptMemoized(results);
  }

  /**
   * Internal method for building insights prompt
   * @private
   */
  _buildInsightsPromptInternal(results) {
    return `
You are a web performance expert. Analyze these website metrics and provide insights:

Performance Score: ${Math.round(results.performance.score)}%
Accessibility Score: ${Math.round(results.accessibility.score)}%
Best Practices Score: ${Math.round(results.bestPractices.score)}%
SEO Score: ${Math.round(results.seo.score)}%

Performance Metrics:
- First Contentful Paint: ${
      results.performance.metrics?.fcp?.displayValue || 'N/A'
    }
- Largest Contentful Paint: ${
      results.performance.metrics?.lcp?.displayValue || 'N/A'
    }
- Total Blocking Time: ${
      results.performance.metrics?.tbt?.displayValue || 'N/A'
    }
- Cumulative Layout Shift: ${
      results.performance.metrics?.cls?.displayValue || 'N/A'
    }
- Speed Index: ${results.performance.metrics?.si?.displayValue || 'N/A'}
- Time to Interactive: ${
      results.performance.metrics?.tti?.displayValue || 'N/A'
    }

Please provide a concise analysis in the following format:

1. Overall Assessment (2-3 sentences about the website's performance)
2. Critical Issues (list the top 2-3 most important issues)
3. Key Recommendations (3 specific, actionable steps to improve the scores)

Keep the response clear and actionable, focusing on the most impactful improvements.
`;
  }

  /**
   * Builds a prompt for generating recommendations for a specific issue (memoized)
   *
   * @param {Object} issue - Issue object
   * @param {string} issue.type - Issue type (accessibility, performance, etc.)
   * @param {string} issue.title - Issue title
   * @param {string} issue.description - Issue description
   * @param {number} issue.impact - Impact score
   * @returns {string} Formatted prompt for AI recommendations
   *
   * @example
   * const prompt = promptBuilder.buildIssuePrompt({
   *   type: 'accessibility',
   *   title: 'Images must have alternate text',
   *   description: 'Ensures <img> elements have alternate text...',
   *   impact: 8
   * });
   */
  buildIssuePrompt(issue) {
    return this._buildIssuePromptMemoized(issue);
  }

  /**
   * Internal method for building issue prompt
   * @private
   */
  _buildIssuePromptInternal(issue) {
    return `
You are a web performance and accessibility expert. Generate specific recommendations for the following issue:

Issue Type: ${issue.type}
Issue Title: ${issue.title}
Description: ${issue.description}
Impact Score: ${issue.impact}

For Accessibility Issues, provide recommendations based on the specific violation:
- For missing alt attributes: Suggest appropriate alt text based on image context and purpose
- For color contrast: Provide specific color values that meet WCAG guidelines
- For keyboard navigation: Suggest proper tabindex and focus management
- For ARIA labels: Recommend appropriate ARIA attributes and roles
- For form controls: Suggest proper label associations and form structure
- For heading hierarchy: Recommend proper heading structure
- For link text: Suggest descriptive link text improvements
- For multimedia: Recommend proper captions and transcripts
- For dynamic content: Suggest proper live regions and updates
- For touch targets: Recommend proper sizing and spacing

Please provide ${this.maxRecommendationsPerIssue} specific, actionable recommendations in this format:
1. [Title of Recommendation]
   - Issue Detection: [How to identify affected elements]
   - Implementation: [Step-by-step technical implementation]
   - Code Example: [If applicable, provide a code snippet]
   - Validation: [How to verify the fix]
   - Expected Impact: [Specific improvement in accessibility]

For code examples, include:
- Proper HTML structure
- Required ARIA attributes
- Event handlers if needed
- CSS modifications if required
- JavaScript snippets if dynamic functionality is needed

Keep recommendations technical, specific, and focused on WCAG 2.1 compliance.
`;
  }

  /**
   * Builds a prompt for generating fixes for multiple issues (memoized)
   *
   * @param {Array<Object>} issues - Array of issue objects
   * @returns {string} Formatted prompt for batch fix generation
   *
   * @example
   * const prompt = promptBuilder.buildBatchFixesPrompt([
   *   { type: 'accessibility', title: 'Missing alt text', ... },
   *   { type: 'performance', title: 'Unoptimized images', ... }
   * ]);
   */
  buildBatchFixesPrompt(issues) {
    return this._buildBatchFixesPromptMemoized(issues);
  }

  /**
   * Internal method for building batch fixes prompt
   * @private
   */
  _buildBatchFixesPromptInternal(issues) {
    const issuesList = issues
      .map(
        (issue, index) => `
${index + 1}. ${issue.title}
   Type: ${issue.type}
   Description: ${issue.description}
   Impact: ${issue.impact}
`
      )
      .join('\n');

    return `
You are a web performance and accessibility expert. Generate specific recommendations for the following issues:

${issuesList}

For each issue, provide ${this.maxRecommendationsPerIssue} specific, actionable recommendations.
Focus on the most impactful fixes that address the root cause of each issue.

Format your response as a structured list with clear implementation steps and code examples where applicable.
`;
  }

  /**
   * Builds a prompt for analyzing a specific metric
   *
   * @param {string} metricName - Name of the metric (e.g., 'LCP', 'FCP')
   * @param {number} value - Metric value
   * @param {string} unit - Unit of measurement
   * @returns {string} Formatted prompt for metric analysis
   *
   * @example
   * const prompt = promptBuilder.buildMetricAnalysisPrompt('LCP', 3.5, 'seconds');
   */
  buildMetricAnalysisPrompt(metricName, value, unit) {
    return `
You are a web performance expert. Analyze the following metric:

Metric: ${metricName}
Value: ${value} ${unit}

Provide:
1. Assessment of whether this value is good, needs improvement, or poor
2. Specific reasons why this metric might have this value
3. Top 3 actionable recommendations to improve this metric

Keep the response concise and technical.
`;
  }

  /**
   * Builds a prompt for comparing before/after analysis results
   *
   * @param {Object} before - Before analysis results
   * @param {Object} after - After analysis results
   * @returns {string} Formatted prompt for comparison analysis
   *
   * @example
   * const prompt = promptBuilder.buildComparisonPrompt(beforeResults, afterResults);
   */
  buildComparisonPrompt(before, after) {
    return `
You are a web performance expert. Compare these before and after analysis results:

BEFORE:
- Performance: ${Math.round(before.performance.score)}%
- Accessibility: ${Math.round(before.accessibility.score)}%
- Best Practices: ${Math.round(before.bestPractices.score)}%
- SEO: ${Math.round(before.seo.score)}%

AFTER:
- Performance: ${Math.round(after.performance.score)}%
- Accessibility: ${Math.round(after.accessibility.score)}%
- Best Practices: ${Math.round(after.bestPractices.score)}%
- SEO: ${Math.round(after.seo.score)}%

Provide:
1. Summary of improvements or regressions
2. Most significant changes
3. Recommendations for further optimization

Keep the response concise and actionable.
`;
  }
}

export default PromptBuilderService;
