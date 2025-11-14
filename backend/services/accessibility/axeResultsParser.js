import logger from '../../utils/logger.js';

/**
 * Axe Results Parser
 * Formats and enhances Axe-Core results for frontend consumption
 */
class AxeResultsParser {
  /**
   * Parse violations into structured format
   * @param {Array} violations - Axe violations
   * @returns {Array} Formatted violations
   */
  parseViolations(violations) {
    // Group violations by rule ID to avoid duplicates
    const groupedViolations = violations.reduce((acc, violation) => {
      if (!acc[violation.id]) {
        acc[violation.id] = {
          id: violation.id,
          impact: violation.impact, // critical, serious, moderate, minor
          description: violation.description,
          help: violation.help,
          helpUrl: violation.helpUrl,
          tags: violation.tags,
          wcagLevel: this.extractWCAGLevel(violation.tags),
          wcagCriteria: this.extractWCAGCriteria(violation.tags),
          nodes: violation.nodes.map((node) => this.parseNode(node)),
          nodeCount: violation.nodes.length,
        };
      } else {
        // Merge nodes from duplicate violations
        const additionalNodes = violation.nodes.map((node) =>
          this.parseNode(node)
        );
        acc[violation.id].nodes = [
          ...acc[violation.id].nodes,
          ...additionalNodes,
        ];
        acc[violation.id].nodeCount += violation.nodes.length;
      }
      return acc;
    }, {});

    return Object.values(groupedViolations);
  }

  /**
   * Parse incomplete checks
   * @param {Array} incomplete - Axe incomplete checks
   * @returns {Array} Formatted incomplete checks
   */
  parseIncomplete(incomplete) {
    return incomplete.map((item) => ({
      id: item.id,
      impact: item.impact,
      description: item.description,
      help: item.help,
      helpUrl: item.helpUrl,
      tags: item.tags,
      wcagLevel: this.extractWCAGLevel(item.tags),
      nodes: item.nodes.map((node) => this.parseNode(node)),
      nodeCount: item.nodes.length,
      requiresManualCheck: true,
    }));
  }

  /**
   * Parse individual node
   * @param {Object} node - Axe node
   * @returns {Object} Formatted node
   */
  parseNode(node) {
    return {
      html: node.html,
      target: node.target,
      failureSummary: node.failureSummary,
      impact: node.impact,
      // Extract specific failure details
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
   * Extract WCAG level from tags
   * @param {Array} tags - Axe tags
   * @returns {string} WCAG level (A, AA, AAA)
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
   * Extract WCAG criteria from tags
   * @param {Array} tags - Axe tags
   * @returns {Array} WCAG criteria (e.g., ['1.4.3', '2.4.7'])
   */
  extractWCAGCriteria(tags) {
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
   * Categorize violations by WCAG principle
   * @param {Array} violations - Parsed violations
   * @returns {Object} Violations grouped by principle
   */
  categorizeByPrinciple(violations) {
    const principles = {
      perceivable: [],
      operable: [],
      understandable: [],
      robust: [],
      other: [],
    };

    violations.forEach((violation) => {
      const criteria = violation.wcagCriteria[0];
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
   * @param {Array} violations - Parsed violations
   * @returns {Object} Violations grouped by impact
   */
  categorizeByImpact(violations) {
    return {
      critical: violations.filter((v) => v.impact === 'critical'),
      serious: violations.filter((v) => v.impact === 'serious'),
      moderate: violations.filter((v) => v.impact === 'moderate'),
      minor: violations.filter((v) => v.impact === 'minor'),
    };
  }

  /**
   * Generate fix suggestions for violations
   * @param {Object} violation - Parsed violation
   * @returns {Array} Fix suggestions
   */
  generateFixSuggestions(violation) {
    const suggestions = [];

    // Base suggestion from Axe
    suggestions.push({
      title: violation.help,
      description: violation.description,
      learnMore: violation.helpUrl,
      automated: false,
    });

    // Add specific suggestions based on violation type
    switch (violation.id) {
      case 'color-contrast':
        suggestions.push(this.getColorContrastSuggestion(violation));
        break;
      case 'image-alt':
        suggestions.push(this.getImageAltSuggestion(violation));
        break;
      case 'label':
        suggestions.push(this.getLabelSuggestion(violation));
        break;
      case 'button-name':
        suggestions.push(this.getButtonNameSuggestion(violation));
        break;
      case 'link-name':
        suggestions.push(this.getLinkNameSuggestion(violation));
        break;
      // Add more specific suggestions as needed
    }

    return suggestions.filter(Boolean);
  }

  /**
   * Get color contrast fix suggestion
   * @private
   */
  getColorContrastSuggestion(violation) {
    const node = violation.nodes[0];
    const contrastData = node.any?.[0]?.data;

    if (!contrastData) return null;

    return {
      title: 'Improve Color Contrast',
      description: `Current contrast ratio is ${contrastData.contrastRatio}, but needs to be at least ${contrastData.expectedContrastRatio}`,
      code: `/* Suggested colors */\ncolor: ${this.suggestForegroundColor(
        contrastData.bgColor
      )};\nbackground-color: ${contrastData.bgColor};`,
      automated: true,
    };
  }

  /**
   * Get image alt fix suggestion
   * @private
   */
  getImageAltSuggestion(violation) {
    return {
      title: 'Add Alt Text to Images',
      description:
        'All images must have alt attributes that describe the image content',
      code: '<img src="..." alt="Descriptive text here">',
      automated: true,
    };
  }

  /**
   * Get label fix suggestion
   * @private
   */
  getLabelSuggestion(violation) {
    return {
      title: 'Associate Labels with Form Controls',
      description: 'Form inputs must have associated labels',
      code: '<label for="input-id">Label text</label>\n<input id="input-id" type="text">',
      automated: true,
    };
  }

  /**
   * Get button name fix suggestion
   * @private
   */
  getButtonNameSuggestion(violation) {
    return {
      title: 'Add Accessible Name to Button',
      description: 'Buttons must have text content or aria-label',
      code: '<button aria-label="Descriptive action">Icon</button>',
      automated: true,
    };
  }

  /**
   * Get link name fix suggestion
   * @private
   */
  getLinkNameSuggestion(violation) {
    return {
      title: 'Add Accessible Name to Link',
      description: 'Links must have text content or aria-label',
      code: '<a href="..." aria-label="Descriptive link text">Link</a>',
      automated: true,
    };
  }

  /**
   * Suggest foreground color for contrast
   * @private
   */
  suggestForegroundColor(bgColor) {
    // Simple suggestion: use black or white based on background
    // In production, use a proper color contrast calculator
    return '#000000'; // Placeholder
  }

  /**
   * Format complete results for frontend
   * @param {Object} axeResults - Raw Axe results
   * @returns {Object} Formatted results
   */
  formatForFrontend(axeResults) {
    const violations = this.parseViolations(axeResults.violations);
    const incomplete = this.parseIncomplete(axeResults.incomplete);

    return {
      summary: {
        url: axeResults.url,
        timestamp: axeResults.timestamp,
        violations: violations.length,
        incomplete: incomplete.length,
        passes: axeResults.passes.length,
        totalNodes: violations.reduce((sum, v) => sum + v.nodeCount, 0),
      },
      violations,
      incomplete,
      byPrinciple: this.categorizeByPrinciple(violations),
      byImpact: this.categorizeByImpact(violations),
      testEngine: axeResults.testEngine,
      wcagLevels: this.getWCAGLevelSummary(violations),
    };
  }

  /**
   * Get WCAG level summary
   * @private
   */
  getWCAGLevelSummary(violations) {
    return {
      A: violations.filter((v) => v.wcagLevel === 'A').length,
      AA: violations.filter((v) => v.wcagLevel === 'AA').length,
      AAA: violations.filter((v) => v.wcagLevel === 'AAA').length,
    };
  }
}

export default new AxeResultsParser();
