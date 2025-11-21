import { describe, it, expect, vi, beforeEach } from 'vitest';
import AxeResultsParser from '../../services/accessibility/axeResultsParser.js';

vi.mock('../../utils/logger.js');

describe('AxeResultsParser', () => {
  describe('parseViolations', () => {
    it('should parse violations into structured format', () => {
      const violations = [
        {
          id: 'color-contrast',
          impact: 'serious',
          description:
            'Ensures the contrast between foreground and background colors',
          help: 'Elements must have sufficient color contrast',
          helpUrl: 'https://dequeuniversity.com/rules/axe/4.4/color-contrast',
          tags: ['wcag2aa', 'wcag143'],
          nodes: [
            {
              html: '<p style="color: #777;">Low contrast text</p>',
              target: ['.low-contrast'],
              failureSummary: 'Fix contrast ratio',
            },
          ],
        },
      ];

      const result = AxeResultsParser.parseViolations(violations);

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('id', 'color-contrast');
      expect(result[0]).toHaveProperty('impact', 'serious');
      expect(result[0]).toHaveProperty('description');
      expect(result[0]).toHaveProperty('help');
      expect(result[0]).toHaveProperty('helpUrl');
      expect(result[0]).toHaveProperty('tags');
      expect(result[0]).toHaveProperty('wcagLevel');
      expect(result[0]).toHaveProperty('wcagCriteria');
      expect(result[0]).toHaveProperty('nodes');
      expect(result[0]).toHaveProperty('nodeCount', 1);
    });

    it('should group duplicate violations by rule ID', () => {
      const violations = [
        {
          id: 'image-alt',
          impact: 'critical',
          description: 'Images must have alt text',
          help: 'Images must have alternate text',
          helpUrl: 'https://dequeuniversity.com/rules/axe/4.4/image-alt',
          tags: ['wcag2a', 'wcag111'],
          nodes: [{ html: '<img src="1.jpg">', target: ['img:nth-child(1)'] }],
        },
        {
          id: 'image-alt',
          impact: 'critical',
          description: 'Images must have alt text',
          help: 'Images must have alternate text',
          helpUrl: 'https://dequeuniversity.com/rules/axe/4.4/image-alt',
          tags: ['wcag2a', 'wcag111'],
          nodes: [{ html: '<img src="2.jpg">', target: ['img:nth-child(2)'] }],
        },
      ];

      const result = AxeResultsParser.parseViolations(violations);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('image-alt');
      expect(result[0].nodeCount).toBe(2);
      expect(result[0].nodes).toHaveLength(2);
    });

    it('should handle empty violations array', () => {
      const result = AxeResultsParser.parseViolations([]);
      expect(result).toEqual([]);
    });

    it('should extract WCAG level and criteria', () => {
      const violations = [
        {
          id: 'label',
          impact: 'critical',
          description: 'Form elements must have labels',
          help: 'Form elements must have labels',
          helpUrl: 'https://dequeuniversity.com/rules/axe/4.4/label',
          tags: ['wcag2a', 'wcag332', 'wcag131'],
          nodes: [{ html: '<input type="text">', target: ['input'] }],
        },
      ];

      const result = AxeResultsParser.parseViolations(violations);

      expect(result[0].wcagLevel).toBe('A');
      expect(result[0].wcagCriteria).toContain('3.3.2');
      expect(result[0].wcagCriteria).toContain('1.3.1');
    });
  });

  describe('parseIncomplete', () => {
    it('should parse incomplete checks into structured format', () => {
      const incomplete = [
        {
          id: 'color-contrast',
          impact: 'serious',
          description: 'Contrast needs manual verification',
          help: 'Elements must have sufficient color contrast',
          helpUrl: 'https://dequeuniversity.com/rules/axe/4.4/color-contrast',
          tags: ['wcag2aa', 'wcag143'],
          nodes: [
            {
              html: '<p>Text with background image</p>',
              target: ['.bg-image'],
            },
          ],
        },
      ];

      const result = AxeResultsParser.parseIncomplete(incomplete);

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('id', 'color-contrast');
      expect(result[0]).toHaveProperty('requiresManualCheck', true);
      expect(result[0]).toHaveProperty('wcagLevel');
      expect(result[0]).toHaveProperty('nodes');
      expect(result[0]).toHaveProperty('nodeCount', 1);
    });

    it('should handle empty incomplete array', () => {
      const result = AxeResultsParser.parseIncomplete([]);
      expect(result).toEqual([]);
    });

    it('should mark all incomplete items as requiring manual check', () => {
      const incomplete = [
        {
          id: 'test-1',
          impact: 'moderate',
          description: 'Test 1',
          help: 'Help 1',
          helpUrl: 'http://example.com',
          tags: ['wcag2aa'],
          nodes: [{ html: '<div></div>', target: ['div'] }],
        },
        {
          id: 'test-2',
          impact: 'serious',
          description: 'Test 2',
          help: 'Help 2',
          helpUrl: 'http://example.com',
          tags: ['wcag2a'],
          nodes: [{ html: '<span></span>', target: ['span'] }],
        },
      ];

      const result = AxeResultsParser.parseIncomplete(incomplete);

      expect(result).toHaveLength(2);
      expect(result[0].requiresManualCheck).toBe(true);
      expect(result[1].requiresManualCheck).toBe(true);
    });
  });

  describe('generateFixSuggestions', () => {
    it('should generate base suggestion from violation', () => {
      const violation = {
        id: 'unknown-rule',
        help: 'Fix this issue',
        description: 'This is a problem',
        helpUrl: 'https://example.com/help',
        nodes: [],
      };

      const suggestions = AxeResultsParser.generateFixSuggestions(violation);

      expect(suggestions).toHaveLength(1);
      expect(suggestions[0]).toHaveProperty('title', 'Fix this issue');
      expect(suggestions[0]).toHaveProperty('description', 'This is a problem');
      expect(suggestions[0]).toHaveProperty(
        'learnMore',
        'https://example.com/help'
      );
      expect(suggestions[0]).toHaveProperty('automated', false);
    });

    it('should generate color contrast suggestion', () => {
      const violation = {
        id: 'color-contrast',
        help: 'Elements must have sufficient color contrast',
        description: 'Contrast issue',
        helpUrl: 'https://example.com/contrast',
        nodes: [
          {
            any: [
              {
                data: {
                  contrastRatio: 3.5,
                  expectedContrastRatio: 4.5,
                  bgColor: '#ffffff',
                },
              },
            ],
          },
        ],
      };

      const suggestions = AxeResultsParser.generateFixSuggestions(violation);

      expect(suggestions.length).toBeGreaterThan(1);
      const contrastSuggestion = suggestions.find(
        (s) => s.title === 'Improve Color Contrast'
      );
      expect(contrastSuggestion).toBeDefined();
      expect(contrastSuggestion.automated).toBe(true);
      expect(contrastSuggestion.code).toContain('color:');
      expect(contrastSuggestion.code).toContain('background-color:');
    });

    it('should generate image alt suggestion', () => {
      const violation = {
        id: 'image-alt',
        help: 'Images must have alternate text',
        description: 'Missing alt text',
        helpUrl: 'https://example.com/image-alt',
        nodes: [{ html: '<img src="test.jpg">' }],
      };

      const suggestions = AxeResultsParser.generateFixSuggestions(violation);

      const altSuggestion = suggestions.find(
        (s) => s.title === 'Add Alt Text to Images'
      );
      expect(altSuggestion).toBeDefined();
      expect(altSuggestion.automated).toBe(true);
      expect(altSuggestion.code).toContain('alt=');
    });

    it('should generate label suggestion', () => {
      const violation = {
        id: 'label',
        help: 'Form elements must have labels',
        description: 'Missing label',
        helpUrl: 'https://example.com/label',
        nodes: [{ html: '<input type="text">' }],
      };

      const suggestions = AxeResultsParser.generateFixSuggestions(violation);

      const labelSuggestion = suggestions.find(
        (s) => s.title === 'Associate Labels with Form Controls'
      );
      expect(labelSuggestion).toBeDefined();
      expect(labelSuggestion.automated).toBe(true);
      expect(labelSuggestion.code).toContain('<label');
      expect(labelSuggestion.code).toContain('for=');
    });

    it('should generate button name suggestion', () => {
      const violation = {
        id: 'button-name',
        help: 'Buttons must have accessible names',
        description: 'Missing button name',
        helpUrl: 'https://example.com/button-name',
        nodes: [{ html: '<button></button>' }],
      };

      const suggestions = AxeResultsParser.generateFixSuggestions(violation);

      const buttonSuggestion = suggestions.find(
        (s) => s.title === 'Add Accessible Name to Button'
      );
      expect(buttonSuggestion).toBeDefined();
      expect(buttonSuggestion.automated).toBe(true);
      expect(buttonSuggestion.code).toContain('aria-label=');
    });

    it('should generate link name suggestion', () => {
      const violation = {
        id: 'link-name',
        help: 'Links must have accessible names',
        description: 'Missing link name',
        helpUrl: 'https://example.com/link-name',
        nodes: [{ html: '<a href="#"></a>' }],
      };

      const suggestions = AxeResultsParser.generateFixSuggestions(violation);

      const linkSuggestion = suggestions.find(
        (s) => s.title === 'Add Accessible Name to Link'
      );
      expect(linkSuggestion).toBeDefined();
      expect(linkSuggestion.automated).toBe(true);
      expect(linkSuggestion.code).toContain('aria-label=');
    });
  });

  describe('getColorContrastSuggestion', () => {
    it('should return null when no contrast data available', () => {
      const violation = {
        nodes: [{ any: [] }],
      };

      const result = AxeResultsParser.getColorContrastSuggestion(violation);
      expect(result).toBeNull();
    });

    it('should generate contrast suggestion with data', () => {
      const violation = {
        nodes: [
          {
            any: [
              {
                data: {
                  contrastRatio: 2.5,
                  expectedContrastRatio: 4.5,
                  bgColor: '#ffffff',
                },
              },
            ],
          },
        ],
      };

      const result = AxeResultsParser.getColorContrastSuggestion(violation);

      expect(result).toBeDefined();
      expect(result.title).toBe('Improve Color Contrast');
      expect(result.description).toContain('2.5');
      expect(result.description).toContain('4.5');
      expect(result.code).toContain('#ffffff');
    });
  });

  describe('getImageAltSuggestion', () => {
    it('should return image alt suggestion', () => {
      const result = AxeResultsParser.getImageAltSuggestion({});

      expect(result).toBeDefined();
      expect(result.title).toBe('Add Alt Text to Images');
      expect(result.automated).toBe(true);
      expect(result.code).toContain('<img');
      expect(result.code).toContain('alt=');
    });
  });

  describe('getLabelSuggestion', () => {
    it('should return label suggestion', () => {
      const result = AxeResultsParser.getLabelSuggestion({});

      expect(result).toBeDefined();
      expect(result.title).toBe('Associate Labels with Form Controls');
      expect(result.automated).toBe(true);
      expect(result.code).toContain('<label');
      expect(result.code).toContain('<input');
    });
  });

  describe('getButtonNameSuggestion', () => {
    it('should return button name suggestion', () => {
      const result = AxeResultsParser.getButtonNameSuggestion({});

      expect(result).toBeDefined();
      expect(result.title).toBe('Add Accessible Name to Button');
      expect(result.automated).toBe(true);
      expect(result.code).toContain('<button');
      expect(result.code).toContain('aria-label=');
    });
  });

  describe('getLinkNameSuggestion', () => {
    it('should return link name suggestion', () => {
      const result = AxeResultsParser.getLinkNameSuggestion({});

      expect(result).toBeDefined();
      expect(result.title).toBe('Add Accessible Name to Link');
      expect(result.automated).toBe(true);
      expect(result.code).toContain('<a');
      expect(result.code).toContain('aria-label=');
    });
  });

  describe('formatForFrontend', () => {
    it('should format complete results for frontend', () => {
      const axeResults = {
        url: 'https://example.com',
        timestamp: '2024-01-01T00:00:00.000Z',
        violations: [
          {
            id: 'color-contrast',
            impact: 'serious',
            description: 'Contrast issue',
            help: 'Fix contrast',
            helpUrl: 'https://example.com/help',
            tags: ['wcag2aa', 'wcag143'],
            nodes: [{ html: '<p>Text</p>', target: ['p'] }],
          },
        ],
        incomplete: [
          {
            id: 'manual-check',
            impact: 'moderate',
            description: 'Needs review',
            help: 'Review this',
            helpUrl: 'https://example.com/review',
            tags: ['wcag2a'],
            nodes: [{ html: '<div>Content</div>', target: ['div'] }],
          },
        ],
        passes: [{ id: 'pass-1' }, { id: 'pass-2' }],
        testEngine: {
          name: 'axe-core',
          version: '4.4.0',
        },
      };

      const result = AxeResultsParser.formatForFrontend(axeResults);

      expect(result).toHaveProperty('summary');
      expect(result.summary).toHaveProperty('url', 'https://example.com');
      expect(result.summary).toHaveProperty('timestamp');
      expect(result.summary).toHaveProperty('violations', 1);
      expect(result.summary).toHaveProperty('incomplete', 1);
      expect(result.summary).toHaveProperty('passes', 2);
      expect(result.summary).toHaveProperty('totalNodes', 1);

      expect(result).toHaveProperty('violations');
      expect(result.violations).toHaveLength(1);

      expect(result).toHaveProperty('incomplete');
      expect(result.incomplete).toHaveLength(1);

      expect(result).toHaveProperty('byPrinciple');
      expect(result).toHaveProperty('byImpact');
      expect(result).toHaveProperty('testEngine');
      expect(result).toHaveProperty('wcagLevels');
    });

    it('should calculate total nodes correctly', () => {
      const axeResults = {
        url: 'https://example.com',
        timestamp: '2024-01-01T00:00:00.000Z',
        violations: [
          {
            id: 'rule-1',
            impact: 'serious',
            description: 'Issue 1',
            help: 'Fix 1',
            helpUrl: 'https://example.com/1',
            tags: ['wcag2aa'],
            nodes: [
              { html: '<div>1</div>', target: ['div:nth-child(1)'] },
              { html: '<div>2</div>', target: ['div:nth-child(2)'] },
            ],
          },
          {
            id: 'rule-2',
            impact: 'critical',
            description: 'Issue 2',
            help: 'Fix 2',
            helpUrl: 'https://example.com/2',
            tags: ['wcag2a'],
            nodes: [{ html: '<span>1</span>', target: ['span'] }],
          },
        ],
        incomplete: [],
        passes: [],
        testEngine: { name: 'axe-core', version: '4.4.0' },
      };

      const result = AxeResultsParser.formatForFrontend(axeResults);

      expect(result.summary.totalNodes).toBe(3);
    });

    it('should include WCAG level summary', () => {
      const axeResults = {
        url: 'https://example.com',
        timestamp: '2024-01-01T00:00:00.000Z',
        violations: [
          {
            id: 'rule-a',
            impact: 'critical',
            description: 'Level A issue',
            help: 'Fix A',
            helpUrl: 'https://example.com/a',
            tags: ['wcag2a', 'wcag111'],
            nodes: [{ html: '<div>A</div>', target: ['div'] }],
          },
          {
            id: 'rule-aa',
            impact: 'serious',
            description: 'Level AA issue',
            help: 'Fix AA',
            helpUrl: 'https://example.com/aa',
            tags: ['wcag2aa', 'wcag143'],
            nodes: [{ html: '<div>AA</div>', target: ['div'] }],
          },
        ],
        incomplete: [],
        passes: [],
        testEngine: { name: 'axe-core', version: '4.4.0' },
      };

      const result = AxeResultsParser.formatForFrontend(axeResults);

      expect(result.wcagLevels).toHaveProperty('A', 1);
      expect(result.wcagLevels).toHaveProperty('AA', 1);
      expect(result.wcagLevels).toHaveProperty('AAA', 0);
    });

    it('should categorize by principle and impact', () => {
      const axeResults = {
        url: 'https://example.com',
        timestamp: '2024-01-01T00:00:00.000Z',
        violations: [
          {
            id: 'perceivable-issue',
            impact: 'critical',
            description: 'Perceivable',
            help: 'Fix perceivable',
            helpUrl: 'https://example.com/p',
            tags: ['wcag2a', 'wcag111'],
            nodes: [{ html: '<div>P</div>', target: ['div'] }],
          },
          {
            id: 'operable-issue',
            impact: 'serious',
            description: 'Operable',
            help: 'Fix operable',
            helpUrl: 'https://example.com/o',
            tags: ['wcag2aa', 'wcag211'],
            nodes: [{ html: '<div>O</div>', target: ['div'] }],
          },
        ],
        incomplete: [],
        passes: [],
        testEngine: { name: 'axe-core', version: '4.4.0' },
      };

      const result = AxeResultsParser.formatForFrontend(axeResults);

      expect(result.byPrinciple).toHaveProperty('perceivable');
      expect(result.byPrinciple).toHaveProperty('operable');
      expect(result.byPrinciple).toHaveProperty('understandable');
      expect(result.byPrinciple).toHaveProperty('robust');

      expect(result.byImpact).toHaveProperty('critical');
      expect(result.byImpact).toHaveProperty('serious');
      expect(result.byImpact).toHaveProperty('moderate');
      expect(result.byImpact).toHaveProperty('minor');
    });
  });

  describe('getWCAGLevelSummary', () => {
    it('should count violations by WCAG level', () => {
      const violations = [
        { wcagLevel: 'A' },
        { wcagLevel: 'A' },
        { wcagLevel: 'AA' },
        { wcagLevel: 'AAA' },
      ];

      const result = AxeResultsParser.getWCAGLevelSummary(violations);

      expect(result).toEqual({
        A: 2,
        AA: 1,
        AAA: 1,
      });
    });

    it('should return zeros for empty violations', () => {
      const result = AxeResultsParser.getWCAGLevelSummary([]);

      expect(result).toEqual({
        A: 0,
        AA: 0,
        AAA: 0,
      });
    });

    it('should handle violations without WCAG level', () => {
      const violations = [
        { wcagLevel: 'A' },
        { wcagLevel: 'Unknown' },
        { wcagLevel: 'AA' },
      ];

      const result = AxeResultsParser.getWCAGLevelSummary(violations);

      expect(result.A).toBe(1);
      expect(result.AA).toBe(1);
      expect(result.AAA).toBe(0);
    });
  });

  describe('suggestForegroundColor', () => {
    it('should suggest a foreground color', () => {
      const result = AxeResultsParser.suggestForegroundColor('#ffffff');
      expect(result).toBe('#000000');
    });
  });
});
