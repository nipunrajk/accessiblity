import { describe, it, expect } from 'vitest';
import {
  mapImpactToScore,
  getGrade,
  calculateWeightedScore,
  extractWCAGCriteria,
  extractWCAGLevel,
  convertAxeViolationToIssue,
  deduplicateIssues,
  calculateIssueSummary,
  calculateWCAGCompliance,
} from '../../utils/transformers.js';

describe('mapImpactToScore', () => {
  describe('valid impact levels', () => {
    it('should map critical to 100', () => {
      expect(mapImpactToScore('critical')).toBe(100);
    });

    it('should map serious to 75', () => {
      expect(mapImpactToScore('serious')).toBe(75);
    });

    it('should map moderate to 50', () => {
      expect(mapImpactToScore('moderate')).toBe(50);
    });

    it('should map minor to 25', () => {
      expect(mapImpactToScore('minor')).toBe(25);
    });
  });

  describe('invalid impact levels', () => {
    it('should return 50 for unknown impact', () => {
      expect(mapImpactToScore('unknown')).toBe(50);
    });

    it('should return 50 for null', () => {
      expect(mapImpactToScore(null)).toBe(50);
    });

    it('should return 50 for undefined', () => {
      expect(mapImpactToScore(undefined)).toBe(50);
    });

    it('should return 50 for empty string', () => {
      expect(mapImpactToScore('')).toBe(50);
    });
  });
});

describe('getGrade', () => {
  describe('grade A', () => {
    it('should return A for score 100', () => {
      expect(getGrade(100)).toBe('A');
    });

    it('should return A for score 90', () => {
      expect(getGrade(90)).toBe('A');
    });

    it('should return A for score 95', () => {
      expect(getGrade(95)).toBe('A');
    });
  });

  describe('grade B', () => {
    it('should return B for score 89', () => {
      expect(getGrade(89)).toBe('B');
    });

    it('should return B for score 80', () => {
      expect(getGrade(80)).toBe('B');
    });

    it('should return B for score 85', () => {
      expect(getGrade(85)).toBe('B');
    });
  });

  describe('grade C', () => {
    it('should return C for score 79', () => {
      expect(getGrade(79)).toBe('C');
    });

    it('should return C for score 70', () => {
      expect(getGrade(70)).toBe('C');
    });

    it('should return C for score 75', () => {
      expect(getGrade(75)).toBe('C');
    });
  });

  describe('grade D', () => {
    it('should return D for score 69', () => {
      expect(getGrade(69)).toBe('D');
    });

    it('should return D for score 60', () => {
      expect(getGrade(60)).toBe('D');
    });

    it('should return D for score 65', () => {
      expect(getGrade(65)).toBe('D');
    });
  });

  describe('grade F', () => {
    it('should return F for score 59', () => {
      expect(getGrade(59)).toBe('F');
    });

    it('should return F for score 0', () => {
      expect(getGrade(0)).toBe('F');
    });

    it('should return F for score 30', () => {
      expect(getGrade(30)).toBe('F');
    });
  });

  describe('edge cases', () => {
    it('should handle negative scores', () => {
      expect(getGrade(-10)).toBe('F');
    });

    it('should handle scores above 100', () => {
      expect(getGrade(150)).toBe('A');
    });
  });
});

describe('calculateWeightedScore', () => {
  describe('perfect score scenarios', () => {
    it('should return 100 for no violations', () => {
      const score = calculateWeightedScore([], [], []);
      expect(score).toBe(100);
    });

    it('should return 100 with only passes', () => {
      const passes = [{ id: 'test1' }, { id: 'test2' }];
      const score = calculateWeightedScore([], [], passes);
      expect(score).toBe(100);
    });
  });

  describe('violations impact', () => {
    it('should calculate score with critical violations', () => {
      const violations = [
        { impact: 'critical', nodes: [{ html: '<div></div>' }] },
      ];
      const passes = [{ id: 'test1' }, { id: 'test2' }];
      const score = calculateWeightedScore(violations, [], passes);
      expect(score).toBeLessThan(100);
      expect(score).toBeGreaterThanOrEqual(0);
    });

    it('should calculate score with serious violations', () => {
      const violations = [
        { impact: 'serious', nodes: [{ html: '<div></div>' }] },
      ];
      const passes = [{ id: 'test1' }];
      const score = calculateWeightedScore(violations, [], passes);
      expect(score).toBeLessThan(100);
    });

    it('should calculate score with moderate violations', () => {
      const violations = [
        { impact: 'moderate', nodes: [{ html: '<div></div>' }] },
      ];
      const passes = [{ id: 'test1' }];
      const score = calculateWeightedScore(violations, [], passes);
      expect(score).toBeLessThan(100);
    });

    it('should calculate score with minor violations', () => {
      const violations = [
        { impact: 'minor', nodes: [{ html: '<div></div>' }] },
      ];
      const passes = [{ id: 'test1' }];
      const score = calculateWeightedScore(violations, [], passes);
      expect(score).toBeLessThan(100);
    });
  });

  describe('multiple violations', () => {
    it('should handle multiple violations of same severity', () => {
      const violations = [
        { impact: 'critical', nodes: [{ html: '<div></div>' }] },
        { impact: 'critical', nodes: [{ html: '<span></span>' }] },
      ];
      const passes = [{ id: 'test1' }];
      const score = calculateWeightedScore(violations, [], passes);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThan(100);
    });

    it('should handle mixed severity violations', () => {
      const violations = [
        { impact: 'critical', nodes: [{ html: '<div></div>' }] },
        { impact: 'minor', nodes: [{ html: '<span></span>' }] },
      ];
      const passes = [{ id: 'test1' }];
      const score = calculateWeightedScore(violations, [], passes);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThan(100);
    });
  });

  describe('multiple nodes per violation', () => {
    it('should weight violations by node count', () => {
      const violations = [
        {
          impact: 'critical',
          nodes: [{ html: '<div></div>' }, { html: '<div></div>' }],
        },
      ];
      const passes = [{ id: 'test1' }];
      const score = calculateWeightedScore(violations, [], passes);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThan(100);
    });
  });

  describe('incomplete checks', () => {
    it('should handle incomplete checks with half weight', () => {
      const incomplete = [
        { impact: 'moderate', nodes: [{ html: '<div></div>' }] },
      ];
      const passes = [{ id: 'test1' }];
      const score = calculateWeightedScore([], incomplete, passes);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should combine violations and incomplete checks', () => {
      const violations = [
        { impact: 'serious', nodes: [{ html: '<div></div>' }] },
      ];
      const incomplete = [
        { impact: 'moderate', nodes: [{ html: '<span></span>' }] },
      ];
      const passes = [{ id: 'test1' }];
      const score = calculateWeightedScore(violations, incomplete, passes);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThan(100);
    });
  });

  describe('edge cases', () => {
    it('should handle violations without nodes array', () => {
      const violations = [{ impact: 'critical' }];
      const score = calculateWeightedScore(violations, [], []);
      expect(score).toBeGreaterThanOrEqual(0);
    });

    it('should handle violations with empty nodes array', () => {
      const violations = [{ impact: 'critical', nodes: [] }];
      const score = calculateWeightedScore(violations, [], []);
      expect(score).toBeGreaterThanOrEqual(0);
    });

    it('should handle unknown impact levels', () => {
      const violations = [
        { impact: 'unknown', nodes: [{ html: '<div></div>' }] },
      ];
      const score = calculateWeightedScore(violations, [], []);
      expect(score).toBeGreaterThanOrEqual(0);
    });
  });
});

describe('extractWCAGCriteria', () => {
  describe('valid WCAG tags', () => {
    it('should extract single WCAG criterion', () => {
      const tags = ['wcag143', 'best-practice'];
      const result = extractWCAGCriteria(tags);
      expect(result).toEqual(['1.4.3']);
    });

    it('should extract multiple WCAG criteria', () => {
      const tags = ['wcag143', 'wcag247', 'best-practice'];
      const result = extractWCAGCriteria(tags);
      expect(result).toEqual(['1.4.3', '2.4.7']);
    });

    it('should handle 4-digit WCAG tags', () => {
      const tags = ['wcag1411', 'other-tag'];
      const result = extractWCAGCriteria(tags);
      expect(result).toEqual(['1.4.11']);
    });

    it('should handle mixed 3 and 4 digit tags', () => {
      const tags = ['wcag143', 'wcag1411', 'wcag247'];
      const result = extractWCAGCriteria(tags);
      expect(result).toEqual(['1.4.3', '1.4.11', '2.4.7']);
    });
  });

  describe('invalid or missing WCAG tags', () => {
    it('should return empty array for no WCAG tags', () => {
      const tags = ['best-practice', 'section508'];
      const result = extractWCAGCriteria(tags);
      expect(result).toEqual([]);
    });

    it('should return empty array for empty tags', () => {
      const tags = [];
      const result = extractWCAGCriteria(tags);
      expect(result).toEqual([]);
    });

    it('should filter out non-WCAG tags', () => {
      const tags = ['wcag143', 'not-wcag', 'best-practice'];
      const result = extractWCAGCriteria(tags);
      expect(result).toEqual(['1.4.3']);
    });
  });

  describe('edge cases', () => {
    it('should handle tags with uppercase', () => {
      const tags = ['WCAG143', 'wcag247'];
      const result = extractWCAGCriteria(tags);
      // Should not match uppercase
      expect(result).toEqual(['2.4.7']);
    });
  });
});

describe('extractWCAGLevel', () => {
  describe('Level AAA', () => {
    it('should detect wcag2aaa', () => {
      const tags = ['wcag2aaa', 'wcag143'];
      expect(extractWCAGLevel(tags)).toBe('AAA');
    });

    it('should detect wcag21aaa', () => {
      const tags = ['wcag21aaa', 'wcag143'];
      expect(extractWCAGLevel(tags)).toBe('AAA');
    });
  });

  describe('Level AA', () => {
    it('should detect wcag2aa', () => {
      const tags = ['wcag2aa', 'wcag143'];
      expect(extractWCAGLevel(tags)).toBe('AA');
    });

    it('should detect wcag21aa', () => {
      const tags = ['wcag21aa', 'wcag143'];
      expect(extractWCAGLevel(tags)).toBe('AA');
    });

    it('should prioritize AAA over AA', () => {
      const tags = ['wcag2aa', 'wcag2aaa'];
      expect(extractWCAGLevel(tags)).toBe('AAA');
    });
  });

  describe('Level A', () => {
    it('should detect wcag2a', () => {
      const tags = ['wcag2a', 'wcag143'];
      expect(extractWCAGLevel(tags)).toBe('A');
    });

    it('should detect wcag21a', () => {
      const tags = ['wcag21a', 'wcag143'];
      expect(extractWCAGLevel(tags)).toBe('A');
    });

    it('should prioritize AA over A', () => {
      const tags = ['wcag2a', 'wcag2aa'];
      expect(extractWCAGLevel(tags)).toBe('AA');
    });
  });

  describe('Unknown level', () => {
    it('should return Unknown for no level tags', () => {
      const tags = ['wcag143', 'best-practice'];
      expect(extractWCAGLevel(tags)).toBe('Unknown');
    });

    it('should return Unknown for empty tags', () => {
      const tags = [];
      expect(extractWCAGLevel(tags)).toBe('Unknown');
    });
  });
});

describe('convertAxeViolationToIssue', () => {
  const mockViolation = {
    help: 'Images must have alternate text',
    description: 'Ensures <img> elements have alternate text',
    impact: 'critical',
    tags: ['wcag2a', 'wcag111', 'section508'],
    helpUrl: 'https://dequeuniversity.com/rules/axe/4.4/image-alt',
    nodes: [
      {
        target: ['#main-image'],
        html: '<img src="photo.jpg">',
        failureSummary: 'Fix this: Element does not have an alt attribute',
      },
    ],
  };

  it('should convert violation to common issue format', () => {
    const result = convertAxeViolationToIssue(mockViolation);

    expect(result).toHaveProperty('type', 'accessibility');
    expect(result).toHaveProperty('title', mockViolation.help);
    expect(result).toHaveProperty('description', mockViolation.description);
    expect(result).toHaveProperty('severity', mockViolation.impact);
    expect(result).toHaveProperty('impact', 100);
    expect(result).toHaveProperty('detectedBy', ['axe-core']);
  });

  it('should extract WCAG criteria', () => {
    const result = convertAxeViolationToIssue(mockViolation);
    expect(result.wcagCriteria).toEqual(['1.1.1']);
  });

  it('should extract WCAG level', () => {
    const result = convertAxeViolationToIssue(mockViolation);
    expect(result.wcagLevel).toBe('A');
  });

  it('should include help URL', () => {
    const result = convertAxeViolationToIssue(mockViolation);
    expect(result.helpUrl).toBe(mockViolation.helpUrl);
  });

  it('should map nodes correctly', () => {
    const result = convertAxeViolationToIssue(mockViolation);
    expect(result.nodes).toHaveLength(1);
    expect(result.nodes[0]).toHaveProperty('selector', '#main-image');
    expect(result.nodes[0]).toHaveProperty('html', mockViolation.nodes[0].html);
  });

  it('should include node count', () => {
    const result = convertAxeViolationToIssue(mockViolation);
    expect(result.nodeCount).toBe(1);
  });

  it('should include first node details', () => {
    const result = convertAxeViolationToIssue(mockViolation);
    expect(result.selector).toBe('#main-image');
    expect(result.html).toBe(mockViolation.nodes[0].html);
    expect(result.failureSummary).toBe(mockViolation.nodes[0].failureSummary);
  });

  it('should create recommendations', () => {
    const result = convertAxeViolationToIssue(mockViolation);
    expect(result.recommendations).toHaveLength(1);
    expect(result.recommendations[0]).toHaveProperty(
      'description',
      mockViolation.help
    );
    expect(result.recommendations[0]).toHaveProperty(
      'learnMore',
      mockViolation.helpUrl
    );
  });

  describe('multiple nodes', () => {
    it('should handle violations with multiple nodes', () => {
      const multiNodeViolation = {
        ...mockViolation,
        nodes: [
          {
            target: ['#image1'],
            html: '<img src="1.jpg">',
            failureSummary: 'Missing alt',
          },
          {
            target: ['#image2'],
            html: '<img src="2.jpg">',
            failureSummary: 'Missing alt',
          },
        ],
      };

      const result = convertAxeViolationToIssue(multiNodeViolation);
      expect(result.nodeCount).toBe(2);
      expect(result.nodes).toHaveLength(2);
    });
  });

  describe('edge cases', () => {
    it('should handle nodes without target', () => {
      const noTargetViolation = {
        ...mockViolation,
        nodes: [
          {
            html: '<img src="photo.jpg">',
            failureSummary: 'Missing alt',
          },
        ],
      };

      const result = convertAxeViolationToIssue(noTargetViolation);
      expect(result.selector).toBeNull();
    });
  });
});

describe('deduplicateIssues', () => {
  describe('no duplicates', () => {
    it('should return same array when no duplicates', () => {
      const issues = [
        {
          title: 'Issue 1',
          selector: '#elem1',
          severity: 'critical',
          detectedBy: ['axe-core'],
        },
        {
          title: 'Issue 2',
          selector: '#elem2',
          severity: 'serious',
          detectedBy: ['pa11y'],
        },
      ];

      const result = deduplicateIssues(issues);
      expect(result).toHaveLength(2);
    });
  });

  describe('with duplicates', () => {
    it('should merge issues with same title and selector', () => {
      const issues = [
        {
          title: 'Missing alt text',
          selector: '#image1',
          severity: 'critical',
          detectedBy: ['axe-core'],
        },
        {
          title: 'Missing alt text',
          selector: '#image1',
          severity: 'serious',
          detectedBy: ['pa11y'],
        },
      ];

      const result = deduplicateIssues(issues);
      expect(result).toHaveLength(1);
    });

    it('should merge detectedBy arrays', () => {
      const issues = [
        {
          title: 'Missing alt text',
          selector: '#image1',
          severity: 'critical',
          detectedBy: ['axe-core'],
        },
        {
          title: 'Missing alt text',
          selector: '#image1',
          severity: 'serious',
          detectedBy: ['pa11y'],
        },
      ];

      const result = deduplicateIssues(issues);
      expect(result[0].detectedBy).toContain('axe-core');
      expect(result[0].detectedBy).toContain('pa11y');
      expect(result[0].detectedBy).toHaveLength(2);
    });

    it('should keep higher severity', () => {
      const issues = [
        {
          title: 'Issue',
          selector: '#elem',
          severity: 'serious',
          impact: 75,
          detectedBy: ['tool1'],
        },
        {
          title: 'Issue',
          selector: '#elem',
          severity: 'critical',
          impact: 100,
          detectedBy: ['tool2'],
        },
      ];

      const result = deduplicateIssues(issues);
      expect(result[0].severity).toBe('critical');
      expect(result[0].impact).toBe(100);
    });
  });

  describe('issues without selector', () => {
    it('should handle issues without selector', () => {
      const issues = [
        {
          title: 'Global issue',
          severity: 'moderate',
          detectedBy: ['tool1'],
        },
        {
          title: 'Global issue',
          severity: 'serious',
          detectedBy: ['tool2'],
        },
      ];

      const result = deduplicateIssues(issues);
      expect(result).toHaveLength(1);
      expect(result[0].detectedBy).toHaveLength(2);
    });
  });

  describe('edge cases', () => {
    it('should handle empty array', () => {
      const result = deduplicateIssues([]);
      expect(result).toHaveLength(0);
    });

    it('should handle single issue', () => {
      const issues = [
        {
          title: 'Issue',
          selector: '#elem',
          severity: 'critical',
          detectedBy: ['tool'],
        },
      ];

      const result = deduplicateIssues(issues);
      expect(result).toHaveLength(1);
    });
  });
});

describe('calculateIssueSummary', () => {
  describe('empty issues', () => {
    it('should return zero counts for empty array', () => {
      const result = calculateIssueSummary([]);
      expect(result).toEqual({
        total: 0,
        critical: 0,
        serious: 0,
        moderate: 0,
        minor: 0,
      });
    });
  });

  describe('single severity', () => {
    it('should count critical issues', () => {
      const issues = [{ severity: 'critical' }, { severity: 'critical' }];
      const result = calculateIssueSummary(issues);
      expect(result.total).toBe(2);
      expect(result.critical).toBe(2);
      expect(result.serious).toBe(0);
    });

    it('should count serious issues', () => {
      const issues = [{ severity: 'serious' }];
      const result = calculateIssueSummary(issues);
      expect(result.serious).toBe(1);
    });

    it('should count moderate issues', () => {
      const issues = [{ severity: 'moderate' }];
      const result = calculateIssueSummary(issues);
      expect(result.moderate).toBe(1);
    });

    it('should count minor issues', () => {
      const issues = [{ severity: 'minor' }];
      const result = calculateIssueSummary(issues);
      expect(result.minor).toBe(1);
    });
  });

  describe('mixed severities', () => {
    it('should count all severity levels', () => {
      const issues = [
        { severity: 'critical' },
        { severity: 'critical' },
        { severity: 'serious' },
        { severity: 'moderate' },
        { severity: 'moderate' },
        { severity: 'moderate' },
        { severity: 'minor' },
      ];

      const result = calculateIssueSummary(issues);
      expect(result.total).toBe(7);
      expect(result.critical).toBe(2);
      expect(result.serious).toBe(1);
      expect(result.moderate).toBe(3);
      expect(result.minor).toBe(1);
    });
  });

  describe('edge cases', () => {
    it('should handle issues without severity', () => {
      const issues = [{ title: 'Issue' }, { severity: 'critical' }];
      const result = calculateIssueSummary(issues);
      expect(result.total).toBe(2);
      expect(result.critical).toBe(1);
    });
  });
});

describe('calculateWCAGCompliance', () => {
  describe('full compliance', () => {
    it('should show AAA compliance with no violations', () => {
      const result = calculateWCAGCompliance([]);
      expect(result.A.compliant).toBe(true);
      expect(result.AA.compliant).toBe(true);
      expect(result.AAA.compliant).toBe(true);
      expect(result.overall.compliantLevel).toBe('AAA');
    });
  });

  describe('Level A violations', () => {
    it('should detect Level A violations', () => {
      const issues = [{ wcagLevel: 'A' }, { wcagLevel: 'A' }];
      const result = calculateWCAGCompliance(issues);
      expect(result.A.violations).toBe(2);
      expect(result.A.compliant).toBe(false);
      expect(result.overall.compliantLevel).toBe('Non-compliant');
    });
  });

  describe('Level AA violations', () => {
    it('should detect Level AA violations', () => {
      const issues = [{ wcagLevel: 'AA' }];
      const result = calculateWCAGCompliance(issues);
      expect(result.AA.violations).toBe(1);
      expect(result.AA.compliant).toBe(false);
      expect(result.overall.compliantLevel).toBe('A');
    });
  });

  describe('Level AAA violations', () => {
    it('should detect Level AAA violations', () => {
      const issues = [{ wcagLevel: 'AAA' }];
      const result = calculateWCAGCompliance(issues);
      expect(result.AAA.violations).toBe(1);
      expect(result.AAA.compliant).toBe(false);
      expect(result.overall.compliantLevel).toBe('AA');
    });
  });

  describe('mixed level violations', () => {
    it('should handle multiple levels', () => {
      const issues = [
        { wcagLevel: 'A' },
        { wcagLevel: 'AA' },
        { wcagLevel: 'AAA' },
      ];
      const result = calculateWCAGCompliance(issues);
      expect(result.A.violations).toBe(1);
      expect(result.AA.violations).toBe(1);
      expect(result.AAA.violations).toBe(1);
      expect(result.overall.compliantLevel).toBe('Non-compliant');
    });

    it('should determine AA compliance with only AAA violations', () => {
      const issues = [{ wcagLevel: 'AAA' }, { wcagLevel: 'AAA' }];
      const result = calculateWCAGCompliance(issues);
      expect(result.A.compliant).toBe(true);
      expect(result.AA.compliant).toBe(true);
      expect(result.AAA.compliant).toBe(false);
      expect(result.overall.compliantLevel).toBe('AA');
    });

    it('should determine A compliance with AA and AAA violations', () => {
      const issues = [{ wcagLevel: 'AA' }, { wcagLevel: 'AAA' }];
      const result = calculateWCAGCompliance(issues);
      expect(result.A.compliant).toBe(true);
      expect(result.AA.compliant).toBe(false);
      expect(result.overall.compliantLevel).toBe('A');
    });
  });

  describe('edge cases', () => {
    it('should handle issues without wcagLevel', () => {
      const issues = [{ title: 'Issue' }];
      const result = calculateWCAGCompliance(issues);
      expect(result.A.violations).toBe(0);
      expect(result.AA.violations).toBe(0);
      expect(result.AAA.violations).toBe(0);
    });

    it('should handle empty array', () => {
      const result = calculateWCAGCompliance([]);
      expect(result.overall.compliantLevel).toBe('AAA');
    });
  });
});
