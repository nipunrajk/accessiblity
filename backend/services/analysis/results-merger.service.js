import logger from '../../utils/logger.js';
import {
  calculateWeightedScore,
  getGrade,
  convertAxeViolationToIssue,
  convertAxeIncompleteToIssue,
  deduplicateIssues,
  calculateWCAGCompliance,
} from '../../utils/transformers.js';

/**
 * Results Merger
 * Combines Lighthouse and Axe-Core results into unified report
 * Handles deduplication and score calculation
 */
class ResultsMerger {
  /**
   * Merge Lighthouse and Axe results
   * @param {Object} lighthouseResults - Lighthouse analysis results
   * @param {Object} axeResults - Axe-Core analysis results
   * @returns {Object} Merged results
   */
  mergeResults(lighthouseResults, axeResults) {
    logger.info('Merging Lighthouse and Axe-Core results');

    const merged = {
      url: lighthouseResults.url || axeResults.url,
      timestamp: new Date().toISOString(),

      // Combined scores
      scores: this.calculateCombinedScores(lighthouseResults, axeResults),

      // Accessibility results
      accessibility: this.mergeAccessibilityResults(
        lighthouseResults.accessibility,
        axeResults
      ),

      // Keep other Lighthouse categories
      performance: lighthouseResults.performance,
      bestPractices: lighthouseResults.bestPractices,
      seo: lighthouseResults.seo,

      // Tool-specific details
      toolDetails: {
        lighthouse: {
          version: lighthouseResults.version,
          fetchTime: lighthouseResults.fetchTime,
        },
        axe: {
          version: axeResults.testEngine?.version,
          testRunner: axeResults.testRunner,
        },
      },
    };

    logger.success('Results merged successfully', {
      totalIssues: merged.accessibility.issues.length,
      lighthouseIssues: lighthouseResults.accessibility?.issues?.length || 0,
      axeViolations: axeResults.violations?.length || 0,
    });

    return merged;
  }

  /**
   * Calculate combined scores
   * @private
   */
  calculateCombinedScores(lighthouseResults, axeResults) {
    const lighthouseScore = lighthouseResults.accessibility?.score || 0;

    // Calculate Axe score (0-100)
    const axeScore = this.calculateAxeScore(axeResults);

    // Combined score (weighted average: 50% Lighthouse, 50% Axe)
    const combinedScore = Math.round(lighthouseScore * 0.5 + axeScore * 0.5);

    return {
      lighthouse: Math.round(lighthouseScore),
      axe: Math.round(axeScore),
      combined: combinedScore,
      grade: getGrade(combinedScore),
    };
  }

  /**
   * Calculate Axe score from results
   * @private
   */
  calculateAxeScore(axeResults) {
    const { violations = [], incomplete = [], passes = [] } = axeResults;
    return calculateWeightedScore(violations, incomplete, passes);
  }

  /**
   * Merge accessibility results
   * @private
   */
  mergeAccessibilityResults(lighthouseAccessibility, axeResults) {
    const lighthouseIssues = lighthouseAccessibility?.issues || [];
    const axeViolations = axeResults.violations || [];
    const axeIncomplete = axeResults.incomplete || [];

    // Convert Axe violations to common format
    const axeIssues = axeViolations.map(convertAxeViolationToIssue);
    const incompleteIssues = axeIncomplete.map(convertAxeIncompleteToIssue);

    // Deduplicate issues
    const allIssues = [...lighthouseIssues, ...axeIssues, ...incompleteIssues];
    const uniqueIssues = deduplicateIssues(allIssues);

    return {
      score: this.calculateCombinedScores(
        { accessibility: lighthouseAccessibility },
        axeResults
      ).combined,
      issues: uniqueIssues,
      summary: {
        total: uniqueIssues.length,
        critical: uniqueIssues.filter((i) => i.severity === 'critical').length,
        serious: uniqueIssues.filter((i) => i.severity === 'serious').length,
        moderate: uniqueIssues.filter((i) => i.severity === 'moderate').length,
        minor: uniqueIssues.filter((i) => i.severity === 'minor').length,
        bySource: {
          lighthouse: uniqueIssues.filter((i) =>
            i.detectedBy?.includes('lighthouse')
          ).length,
          axe: uniqueIssues.filter((i) => i.detectedBy?.includes('axe-core'))
            .length,
          both: uniqueIssues.filter(
            (i) =>
              i.detectedBy?.includes('lighthouse') &&
              i.detectedBy?.includes('axe-core')
          ).length,
        },
      },
      wcagCompliance: calculateWCAGCompliance(uniqueIssues),
    };
  }
}

export default new ResultsMerger();
