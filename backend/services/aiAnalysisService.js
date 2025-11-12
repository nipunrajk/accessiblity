/**
 * AI Analysis Service
 * Centralized service for AI-powered analysis and recommendations
 */

import aiProvider from './aiProvider.js';
import { AI } from '../constants/index.js';
import logger from '../utils/logger.js';

class AIAnalysisService {
  /**
   * Generate AI insights from analysis results
   */
  async generateInsights(results) {
    if (!aiProvider.isAvailable()) {
      logger.warn('AI provider not available for insights generation');
      return null;
    }

    const prompt = this._buildInsightsPrompt(results);

    try {
      logger.debug('Generating AI insights');
      const insights = await aiProvider.invoke(prompt);
      logger.success('AI insights generated');
      return insights;
    } catch (error) {
      logger.error('Failed to generate AI insights', error);
      return null;
    }
  }

  /**
   * Generate AI fixes for multiple issues
   */
  async generateFixes(issues) {
    if (!aiProvider.isAvailable() || !Array.isArray(issues)) {
      logger.warn('AI provider not available or invalid issues array');
      return null;
    }

    const suggestions = {};
    const uniqueIssues = this._getUniqueIssues(issues);
    const limitedIssues = uniqueIssues.slice(0, AI.MAX_ISSUES_TO_PROCESS);

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
   * Get AI recommendations for a single issue
   */
  async getIssueRecommendations(issue) {
    const prompt = this._buildIssuePrompt(issue);
    const content = await aiProvider.invoke(prompt);

    if (!content) {
      throw new Error('No content in AI response');
    }

    return this._parseRecommendations(content);
  }

  /**
   * Build prompt for insights generation
   * @private
   */
  _buildInsightsPrompt(results) {
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
   * Build prompt for issue recommendations
   * @private
   */
  _buildIssuePrompt(issue) {
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

Please provide ${AI.MAX_RECOMMENDATIONS_PER_ISSUE} specific, actionable recommendations in this format:
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
   * Parse AI recommendations from response
   * @private
   */
  _parseRecommendations(content) {
    const recommendations = [];
    const sections = content.split(/\d+\.\s+/).filter(Boolean);

    for (const section of sections.slice(0, AI.MAX_RECOMMENDATIONS_PER_ISSUE)) {
      const parsed = this._parseRecommendationSection(section);
      if (parsed) {
        recommendations.push(parsed);
      }
    }

    return recommendations;
  }

  /**
   * Parse a single recommendation section
   * @private
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
   * Extract code block from lines
   * @private
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
   * Get unique issues by title
   * @private
   */
  _getUniqueIssues(issues) {
    return issues.filter(
      (issue, index, self) =>
        index === self.findIndex((i) => i.title === issue.title)
    );
  }

  /**
   * Get error recommendation when AI fails
   * @private
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
}

// Export singleton instance
export default new AIAnalysisService();
