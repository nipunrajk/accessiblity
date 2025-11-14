import logger from '../../utils/logger.js';

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
      grade: this.getGrade(combinedScore),
    };
  }

  /**
   * Calculate Axe score from results
   * @private
   */
  calculateAxeScore(axeResults) {
    const { violations = [], incomplete = [], passes = [] } = axeResults;

    // Weight by impact
    const impactWeights = {
      critical: 10,
      serious: 7,
      moderate: 4,
      minor: 1,
    };

    let totalWeight = 0;
    let violationWeight = 0;

    // Count violations
    violations.forEach((violation) => {
      const weight = impactWeights[violation.impact] || 1;
      const nodeCount = violation.nodes?.length || 1;
      violationWeight += weight * nodeCount;
      totalWeight += weight * nodeCount;
    });

    // Count incomplete (half weight)
    incomplete.forEach((item) => {
      const weight = (impactWeights[item.impact] || 1) * 0.5;
      const nodeCount = item.nodes?.length || 1;
      totalWeight += weight * nodeCount;
    });

    // Count passes
    totalWeight += passes.length;

    // Calculate score
    return totalWeight > 0
      ? ((totalWeight - violationWeight) / totalWeight) * 100
      : 100;
  }

  /**
   * Get letter grade from score
   * @private
   */
  getGrade(score) {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
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
    const axeIssues = this.convertAxeViolationsToIssues(axeViolations);
    const incompleteIssues = this.convertAxeIncompleteToIssues(axeIncomplete);

    // Deduplicate issues
    const allIssues = [...lighthouseIssues, ...axeIssues, ...incompleteIssues];
    const uniqueIssues = this.deduplicateIssues(allIssues);

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
      wcagCompliance: this.calculateWCAGCompliance(uniqueIssues),
    };
  }

  /**
   * Convert Axe violations to common issue format
   * @private
   */
  convertAxeViolationsToIssues(violations) {
    // Keep violations grouped by rule ID instead of creating separate issues per node
    return violations.map((violation) => ({
      type: 'accessibility',
      title: violation.help,
      description: violation.description,
      severity: violation.impact, // critical, serious, moderate, minor
      impact: this.mapImpactToScore(violation.impact),
      detectedBy: ['axe-core'],
      wcagCriteria: this.extractWCAGCriteria(violation.tags),
      wcagLevel: this.extractWCAGLevel(violation.tags),
      helpUrl: violation.helpUrl,
      // Include all affected nodes
      nodes: violation.nodes.map((node) => ({
        selector: node.target?.[0] || null,
        html: node.html,
        failureSummary: node.failureSummary,
      })),
      nodeCount: violation.nodes.length,
      // Keep first node's selector for backward compatibility
      selector: violation.nodes[0]?.target?.[0] || null,
      html: violation.nodes[0]?.html,
      failureSummary: violation.nodes[0]?.failureSummary,
      recommendations: [
        {
          description: violation.help,
          implementation: violation.nodes[0]?.failureSummary,
          learnMore: violation.helpUrl,
        },
      ],
    }));
  }

  /**
   * Convert Axe incomplete to common issue format
   * @private
   */
  convertAxeIncompleteToIssues(incomplete) {
    // Keep incomplete items grouped by rule ID instead of creating separate issues per node
    return incomplete.map((item) => ({
      type: 'accessibility',
      title: `${item.help} (Needs Manual Review)`,
      description: item.description,
      severity: 'moderate',
      impact: 50,
      detectedBy: ['axe-core'],
      requiresManualCheck: true,
      wcagCriteria: this.extractWCAGCriteria(item.tags),
      wcagLevel: this.extractWCAGLevel(item.tags),
      helpUrl: item.helpUrl,
      // Include all affected nodes
      nodes: item.nodes.map((node) => ({
        selector: node.target?.[0] || null,
        html: node.html,
        failureSummary: node.failureSummary,
      })),
      nodeCount: item.nodes.length,
      // Keep first node's selector for backward compatibility
      selector: item.nodes[0]?.target?.[0] || null,
      html: item.nodes[0]?.html,
      recommendations: [
        {
          description: `Manual check required: ${item.help}`,
          implementation: item.nodes[0]?.failureSummary,
          learnMore: item.helpUrl,
        },
      ],
    }));
  }

  /**
   * Map Axe impact to numeric score
   * @private
   */
  mapImpactToScore(impact) {
    const impactMap = {
      critical: 100,
      serious: 75,
      moderate: 50,
      minor: 25,
    };
    return impactMap[impact] || 50;
  }

  /**
   * Extract WCAG criteria from tags
   * @private
   */
  extractWCAGCriteria(tags) {
    const criteriaPattern = /wcag\d{3,4}/;
    return tags
      .filter((tag) => criteriaPattern.test(tag))
      .map((tag) => {
        const match = tag.match(/wcag(\d)(\d)(\d+)/);
        if (match) {
          return `${match[1]}.${match[2]}.${match[3]}`;
        }
        return tag;
      });
  }

  /**
   * Extract WCAG level from tags
   * @private
   */
  extractWCAGLevel(tags) {
    if (
      tags.some((tag) => tag.includes('wcag2aaa') || tag.includes('wcag21aaa'))
    ) {
      return 'AAA';
    }
    if (
      tags.some((tag) => tag.includes('wcag2aa') || tag.includes('wcag21aa'))
    ) {
      return 'AA';
    }
    if (tags.some((tag) => tag.includes('wcag2a') || tag.includes('wcag21a'))) {
      return 'A';
    }
    return 'Unknown';
  }

  /**
   * Deduplicate issues from multiple sources
   * @private
   */
  deduplicateIssues(issues) {
    const issueMap = new Map();

    issues.forEach((issue) => {
      // Create unique key based on title and selector
      const key = `${issue.title}-${issue.selector || 'no-selector'}`;

      if (issueMap.has(key)) {
        // Merge detectedBy arrays
        const existing = issueMap.get(key);
        existing.detectedBy = [
          ...new Set([...existing.detectedBy, ...issue.detectedBy]),
        ];

        // Keep higher severity
        if (
          this.mapImpactToScore(issue.severity) >
          this.mapImpactToScore(existing.severity)
        ) {
          existing.severity = issue.severity;
          existing.impact = issue.impact;
        }
      } else {
        issueMap.set(key, { ...issue });
      }
    });

    return Array.from(issueMap.values());
  }

  /**
   * Calculate WCAG compliance summary
   * @private
   */
  calculateWCAGCompliance(issues) {
    const levelA = issues.filter((i) => i.wcagLevel === 'A');
    const levelAA = issues.filter((i) => i.wcagLevel === 'AA');
    const levelAAA = issues.filter((i) => i.wcagLevel === 'AAA');

    return {
      A: {
        violations: levelA.length,
        compliant: levelA.length === 0,
      },
      AA: {
        violations: levelAA.length,
        compliant: levelAA.length === 0,
      },
      AAA: {
        violations: levelAAA.length,
        compliant: levelAAA.length === 0,
      },
      overall: {
        compliantLevel: this.determineCompliantLevel(levelA, levelAA, levelAAA),
      },
    };
  }

  /**
   * Determine overall WCAG compliance level
   * @private
   */
  determineCompliantLevel(levelA, levelAA, levelAAA) {
    if (levelA.length === 0 && levelAA.length === 0 && levelAAA.length === 0) {
      return 'AAA';
    }
    if (levelA.length === 0 && levelAA.length === 0) {
      return 'AA';
    }
    if (levelA.length === 0) {
      return 'A';
    }
    return 'Non-compliant';
  }
}

export default new ResultsMerger();
