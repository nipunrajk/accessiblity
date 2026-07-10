import { describe, it, expect } from 'vitest';
import PromptBuilderService from '../../services/ai/prompt-builder.service.js';

describe('PromptBuilderService tests', () => {
  const promptBuilder = new PromptBuilderService({ maxRecommendationsPerIssue: 2 });

  describe('buildIssuePrompt', () => {
    it('should build a standard issue prompt when no recommendations are present', () => {
      const issue = {
        type: 'accessibility',
        title: 'Missing image alt text',
        description: 'Image elements must have alt attributes',
        impact: 8,
      };

      const prompt = promptBuilder.buildIssuePrompt(issue);

      expect(prompt).toContain('Issue Type: accessibility');
      expect(prompt).toContain('Issue Title: Missing image alt text');
      expect(prompt).toContain('Description: Image elements must have alt attributes');
      expect(prompt).toContain('Impact Score: 8');
      expect(prompt).not.toContain('Affected Components:');
    });

    it('should append Affected Components details when recommendations are present', () => {
      const issue = {
        type: 'accessibility',
        title: 'Missing image alt text',
        description: 'Image elements must have alt attributes',
        impact: 8,
        recommendations: [
          {
            selector: 'body > div.header > img.logo',
            snippet: '<img class="logo" src="/img/logo.png">',
          },
        ],
      };

      const prompt = promptBuilder.buildIssuePrompt(issue);

      expect(prompt).toContain('Issue Type: accessibility');
      expect(prompt).toContain('Affected Components:');
      expect(prompt).toContain('Selector: "body > div.header > img.logo"');
      expect(prompt).toContain('Code Snippet: `<img class="logo" src="/img/logo.png">`');
      expect(prompt).toContain('If "Affected Components" is provided, analyze the actual component code');
    });
  });

  describe('buildBatchFixesPrompt', () => {
    it('should build standard batch fixes prompt when issues have no recommendations', () => {
      const issues = [
        {
          type: 'accessibility',
          title: 'Missing image alt text',
          description: 'Image elements must have alt attributes',
          impact: 8,
        },
        {
          type: 'performance',
          title: 'Unoptimized script loading',
          description: 'Load scripts asynchronously',
          impact: 7,
        },
      ];

      const prompt = promptBuilder.buildBatchFixesPrompt(issues);

      expect(prompt).toContain('1. Missing image alt text');
      expect(prompt).toContain('Type: accessibility');
      expect(prompt).toContain('2. Unoptimized script loading');
      expect(prompt).toContain('Type: performance');
      expect(prompt).not.toContain('Affected Components:');
    });

    it('should list Affected Components details for each issue when present in batch fixes prompt', () => {
      const issues = [
        {
          type: 'accessibility',
          title: 'Missing image alt text',
          description: 'Image elements must have alt attributes',
          impact: 8,
          recommendations: [
            {
              selector: '.logo',
              snippet: '<img class="logo" src="/logo.png">',
            },
          ],
        },
        {
          type: 'performance',
          title: 'Unoptimized script loading',
          description: 'Load scripts asynchronously',
          impact: 7,
          recommendations: [
            {
              selector: 'script[src*="analytics"]',
              snippet: '<script src="/analytics.js"></script>',
            },
          ],
        },
      ];

      const prompt = promptBuilder.buildBatchFixesPrompt(issues);

      expect(prompt).toContain('1. Missing image alt text');
      expect(prompt).toContain('Affected Components:');
      expect(prompt).toContain('Selector: ".logo"');
      expect(prompt).toContain('Code Snippet: `<img class="logo" src="/logo.png">`');

      expect(prompt).toContain('2. Unoptimized script loading');
      expect(prompt).toContain('Selector: "script[src*="analytics"]"');
      expect(prompt).toContain('Code Snippet: `<script src="/analytics.js"></script>`');
      expect(prompt).toContain('If "Affected Components" or "Code Snippet" is provided for an issue, you MUST inspect the actual component code');
    });
  });
});
