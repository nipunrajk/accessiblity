import logger from '../../utils/logger.js';
import {
  calculateWeightedScore,
  getGrade,
  convertAxeViolationToIssue,
  convertAxeIncompleteToIssue,
  convertPa11yIssueToCommon,
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
   * Merge Lighthouse, Axe, and Pa11y results
   * @param {Object} lighthouseResults - Lighthouse analysis results
   * @param {Object} axeResults - Axe-Core analysis results
   * @param {Object} pa11yResults - Pa11y analysis results
   * @returns {Object} Merged results
   */
  mergeResults(lighthouseResults, axeResults, pa11yResults = null) {
    logger.info('Merging Lighthouse, Axe-Core, and Pa11y results');

    const merged = {
      url: lighthouseResults.url || axeResults.url,
      timestamp: new Date().toISOString(),

      // Combined scores
      scores: this.calculateCombinedScores(
        lighthouseResults,
        axeResults,
        pa11yResults
      ),

      // Accessibility results
      accessibility: this.mergeAccessibilityResults(
        lighthouseResults.accessibility,
        axeResults,
        pa11yResults
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
        pa11y: pa11yResults
          ? {
              version: pa11yResults.version,
              runner: pa11yResults.runner,
            }
          : null,
      },
    };

    logger.success('Results merged successfully', {
      totalIssues: merged.accessibility.issues.length,
      lighthouseIssues: lighthouseResults.accessibility?.issues?.length || 0,
      axeViolations: axeResults.violations?.length || 0,
      pa11yIssues: pa11yResults?.issues?.length || 0,
    });

    return merged;
  }

  /**
   * Calculate combined scores
   * @private
   */
  calculateCombinedScores(lighthouseResults, axeResults, pa11yResults = null) {
    const lighthouseScore = lighthouseResults.accessibility?.score || 0;

    // Calculate Axe score (0-100)
    const axeScore = this.calculateAxeScore(axeResults);

    // Calculate Pa11y score if available
    const pa11yScore = pa11yResults?.score?.score || 0;

    // Combined score (weighted average)
    let combinedScore;
    if (pa11yResults) {
      // 40% Lighthouse, 40% Axe, 20% Pa11y
      combinedScore = Math.round(
        lighthouseScore * 0.4 + axeScore * 0.4 + pa11yScore * 0.2
      );
    } else {
      // 50% Lighthouse, 50% Axe
      combinedScore = Math.round(lighthouseScore * 0.5 + axeScore * 0.5);
    }

    return {
      lighthouse: Math.round(lighthouseScore),
      axe: Math.round(axeScore),
      pa11y: pa11yResults ? Math.round(pa11yScore) : null,
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
  mergeAccessibilityResults(
    lighthouseAccessibility,
    axeResults,
    pa11yResults = null
  ) {
    const lighthouseIssues = lighthouseAccessibility?.issues || [];
    const axeViolations = axeResults.violations || [];
    const axeIncomplete = axeResults.incomplete || [];
    const pa11yIssues = pa11yResults?.issues || [];

    // Convert Axe violations to common format
    const axeIssues = axeViolations.map(convertAxeViolationToIssue);
    const incompleteIssues = axeIncomplete.map(convertAxeIncompleteToIssue);

    // Convert Pa11y issues to common format
    const pa11yFormattedIssues = pa11yIssues.map(convertPa11yIssueToCommon);

    // Deduplicate issues from all sources
    const allIssues = [
      ...lighthouseIssues,
      ...axeIssues,
      ...incompleteIssues,
      ...pa11yFormattedIssues,
    ];
    const uniqueIssues = deduplicateIssues(allIssues);

    return {
      score: this.calculateCombinedScores(
        { accessibility: lighthouseAccessibility },
        axeResults,
        pa11yResults
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
          pa11y: uniqueIssues.filter((i) => i.detectedBy?.includes('pa11y'))
            .length,
          keyboard: uniqueIssues.filter((i) =>
            i.detectedBy?.includes('keyboard')
          ).length,
          multiple: uniqueIssues.filter((i) => i.detectedBy?.length > 1).length,
        },
      },
      wcagCompliance: calculateWCAGCompliance(uniqueIssues),
      violations: axeResults.violations,
      incomplete: axeResults.incomplete,
      passes: axeResults.passes,
    };
  }
}

export default new ResultsMerger();
