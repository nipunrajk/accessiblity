import logger from './logger.js';

/**
 * Common data transformation utilities
 * Provides reusable functions for transforming and formatting data
 */

/**
 * Impact weights for severity calculations
 */
const IMPACT_WEIGHTS = {
  critical: 10,
  serious: 7,
  moderate: 4,
  minor: 1,
};

/**
 * Map Axe impact level to numeric score
 * @param {string} impact - Impact level (critical, serious, moderate, minor)
 * @returns {number} Numeric score (0-100)
 */
export function mapImpactToScore(impact) {
  const impactMap = {
    critical: 100,
    serious: 75,
    moderate: 50,
    minor: 25,
  };
  return impactMap[impact] || 50;
}

/**
 * Calculate letter grade from numeric score
 * @param {number} score - Numeric score (0-100)
 * @returns {string} Letter grade (A-F)
 */
export function getGrade(score) {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

/**
 * Calculate weighted score from violations
 * @param {Array} violations - Array of violations with impact levels
 * @param {Array} incomplete - Array of incomplete checks
 * @param {Array} passes - Array of passed checks
 * @returns {number} Calculated score (0-100)
 */
export function calculateWeightedScore(
  violations = [],
  incomplete = [],
  passes = []
) {
  let totalWeight = 0;
  let violationWeight = 0;

  // Count violations
  violations.forEach((violation) => {
    const weight = IMPACT_WEIGHTS[violation.impact] || 1;
    const nodeCount = violation.nodes?.length || 1;
    violationWeight += weight * nodeCount;
    totalWeight += weight * nodeCount;
  });

  // Count incomplete (half weight)
  incomplete.forEach((item) => {
    const weight = (IMPACT_WEIGHTS[item.impact] || 1) * 0.5;
    const nodeCount = item.nodes?.length || 1;
    totalWeight += weight * nodeCount;
  });

  // Count passes
  totalWeight += passes.length;

  // Calculate score
  return totalWeight > 0
    ? Math.round(((totalWeight - violationWeight) / totalWeight) * 100)
    : 100;
}

/**
 * Extract WCAG criteria from tags
 * @param {Array<string>} tags - Array of tags from Axe results
 * @returns {Array<string>} Array of WCAG criteria (e.g., ['1.4.3', '2.4.7'])
 */
export function extractWCAGCriteria(tags) {
  const criteriaPattern = /wcag\d{3,4}/;
  return tags
    .filter((tag) => criteriaPattern.test(tag))
    .map((tag) => {
      // Convert wcag143 to 1.4.3
      const match = tag.match(/wcag(\d)(\d)(\d+)/);
      if (match) {
        return `${match[1]}.${match[2]}.${match[3]}`;
      }
      return tag;
    });
}

/**
 * Extract WCAG level from tags
 * @param {Array<string>} tags - Array of tags from Axe results
 * @returns {string} WCAG level (A, AA, AAA, or Unknown)
 */
export function extractWCAGLevel(tags) {
  if (
    tags.some((tag) => tag.includes('wcag2aaa') || tag.includes('wcag21aaa'))
  ) {
    return 'AAA';
  }
  if (tags.some((tag) => tag.includes('wcag2aa') || tag.includes('wcag21aa'))) {
    return 'AA';
  }
  if (tags.some((tag) => tag.includes('wcag2a') || tag.includes('wcag21a'))) {
    return 'A';
  }
  return 'Unknown';
}

/**
 * Convert Axe violation to common issue format
 * @param {Object} violation - Axe violation object
 * @returns {Object} Formatted issue object
 */
export function convertAxeViolationToIssue(violation) {
  return {
    type: 'accessibility',
    title: violation.help,
    description: violation.description,
    severity: violation.impact,
    impact: mapImpactToScore(violation.impact),
    detectedBy: ['axe-core'],
    wcagCriteria: extractWCAGCriteria(violation.tags),
    wcagLevel: extractWCAGLevel(violation.tags),
    helpUrl: violation.helpUrl,
    nodes: violation.nodes.map((node) => ({
      selector: node.target?.[0] || null,
      html: node.html,
      failureSummary: node.failureSummary,
    })),
    nodeCount: violation.nodes.length,
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
  };
}

/**
 * Convert Axe incomplete check to common issue format
 * @param {Object} item - Axe incomplete check object
 * @returns {Object} Formatted issue object
 */
export function convertAxeIncompleteToIssue(item) {
  return {
    type: 'accessibility',
    title: `${item.help} (Needs Manual Review)`,
    description: item.description,
    severity: 'moderate',
    impact: 50,
    detectedBy: ['axe-core'],
    requiresManualCheck: true,
    wcagCriteria: extractWCAGCriteria(item.tags),
    wcagLevel: extractWCAGLevel(item.tags),
    helpUrl: item.helpUrl,
    nodes: item.nodes.map((node) => ({
      selector: node.target?.[0] || null,
      html: node.html,
      failureSummary: node.failureSummary,
    })),
    nodeCount: item.nodes.length,
    selector: item.nodes[0]?.target?.[0] || null,
    html: item.nodes[0]?.html,
    recommendations: [
      {
        description: `Manual check required: ${item.help}`,
        implementation: item.nodes[0]?.failureSummary,
        learnMore: item.helpUrl,
      },
    ],
  };
}

/**
 * Convert Pa11y issue to common format
 * @param {Object} issue - Pa11y issue object
 * @returns {Object} Formatted issue object
 */
export function convertPa11yIssueToCommon(issue) {
  // Map Pa11y type to severity
  const severityMap = {
    error: 'critical',
    warning: 'serious',
    notice: 'moderate',
  };

  return {
    type: 'accessibility',
    title: issue.message,
    description: issue.message,
    severity: severityMap[issue.type] || 'moderate',
    impact: issue.type === 'error' ? 90 : issue.type === 'warning' ? 70 : 50,
    detectedBy: ['pa11y'],
    wcagCriteria: issue.wcagCriteria ? [issue.wcagCriteria] : [],
    wcagLevel: issue.wcagLevel,
    selector: issue.selector,
    html: issue.context,
    context: issue.context,
    code: issue.code,
    recommendations: [
      {
        description: issue.message,
        implementation: `Fix the issue at: ${issue.selector}`,
      },
    ],
  };
}

/**
 * Convert Keyboard issue to common format
 * @param {Object} issue - Keyboard issue object
 * @returns {Object} Formatted issue object
 */
export function convertKeyboardIssueToCommon(issue) {
  return {
    type: 'accessibility',
    title: issue.message,
    description: issue.details || issue.message,
    severity: issue.severity,
    impact:
      issue.severity === 'critical'
        ? 90
        : issue.severity === 'serious'
        ? 70
        : 50,
    detectedBy: ['keyboard'],
    wcagCriteria: [issue.wcag],
    wcagLevel: 'AA', // Most keyboard issues are Level A or AA
    selector: issue.selector,
    element: issue.element,
    text: issue.text,
    className: issue.className,
    recommendations: [
      {
        description: issue.recommendation,
        implementation: issue.recommendation,
      },
    ],
  };
}

/**
 * Deduplicate issues from multiple sources
 * @param {Array<Object>} issues - Array of issue objects
 * @returns {Array<Object>} Deduplicated array of issues
 */
export function deduplicateIssues(issues) {
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
        mapImpactToScore(issue.severity) > mapImpactToScore(existing.severity)
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
 * Calculate issue summary by severity
 * @param {Array<Object>} issues - Array of issue objects
 * @returns {Object} Summary object with counts by severity
 */
export function calculateIssueSummary(issues) {
  return {
    total: issues.length,
    critical: issues.filter((i) => i.severity === 'critical').length,
    serious: issues.filter((i) => i.severity === 'serious').length,
    moderate: issues.filter((i) => i.severity === 'moderate').length,
    minor: issues.filter((i) => i.severity === 'minor').length,
  };
}

/**
 * Calculate WCAG compliance summary
 * @param {Array<Object>} issues - Array of issue objects with wcagLevel
 * @returns {Object} WCAG compliance summary
 */
export function calculateWCAGCompliance(issues) {
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
      compliantLevel: determineCompliantLevel(levelA, levelAA, levelAAA),
    },
  };
}

/**
 * Determine overall WCAG compliance level
 * @param {Array} levelA - Level A violations
 * @param {Array} levelAA - Level AA violations
 * @param {Array} levelAAA - Level AAA violations
 * @returns {string} Compliance level
 */
function determineCompliantLevel(levelA, levelAA, levelAAA) {
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

/**
 * Parse Axe node to common format
 * @param {Object} node - Axe node object
 * @returns {Object} Formatted node object
 */
export function parseAxeNode(node) {
  return {
    html: node.html,
    target: node.target,
    failureSummary: node.failureSummary,
    impact: node.impact,
    any: node.any?.map((check) => ({
      id: check.id,
      message: check.message,
      data: check.data,
    })),
    all: node.all?.map((check) => ({
      id: check.id,
      message: check.message,
      data: check.data,
    })),
    none: node.none?.map((check) => ({
      id: check.id,
      message: check.message,
      data: check.data,
    })),
  };
}

/**
 * Categorize violations by WCAG principle
 * @param {Array<Object>} violations - Array of violations with wcagCriteria
 * @returns {Object} Violations grouped by principle
 */
export function categorizeByPrinciple(violations) {
  const principles = {
    perceivable: [],
    operable: [],
    understandable: [],
    robust: [],
    other: [],
  };

  violations.forEach((violation) => {
    const criteria = violation.wcagCriteria?.[0];
    if (!criteria) {
      principles.other.push(violation);
      return;
    }

    const principle = criteria.split('.')[0];
    switch (principle) {
      case '1':
        principles.perceivable.push(violation);
        break;
      case '2':
        principles.operable.push(violation);
        break;
      case '3':
        principles.understandable.push(violation);
        break;
      case '4':
        principles.robust.push(violation);
        break;
      default:
        principles.other.push(violation);
    }
  });

  return principles;
}

/**
 * Categorize violations by impact
 * @param {Array<Object>} violations - Array of violations
 * @returns {Object} Violations grouped by impact
 */
export function categorizeByImpact(violations) {
  return {
    critical: violations.filter((v) => v.impact === 'critical'),
    serious: violations.filter((v) => v.impact === 'serious'),
    moderate: violations.filter((v) => v.impact === 'moderate'),
    minor: violations.filter((v) => v.impact === 'minor'),
  };
}

export default {
  mapImpactToScore,
  getGrade,
  calculateWeightedScore,
  extractWCAGCriteria,
  extractWCAGLevel,
  convertAxeViolationToIssue,
  convertAxeIncompleteToIssue,
  deduplicateIssues,
  calculateIssueSummary,
  calculateWCAGCompliance,
  parseAxeNode,
  categorizeByPrinciple,
  categorizeByImpact,
};
