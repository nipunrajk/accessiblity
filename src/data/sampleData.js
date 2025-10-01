// Sample data for testing the dashboard
export const sampleAnalysisResults = {
  performance: {
    score: 75,
    metrics: {
      fcp: { value: 1200, displayValue: '1.2s', score: 95 },
      lcp: { value: 2100, displayValue: '2.1s', score: 90 },
      tbt: { value: 150, displayValue: '150ms', score: 85 },
      cls: { value: 0.05, displayValue: '0.05', score: 92 },
      si: { value: 1800, displayValue: '1.8s', score: 88 },
      tti: { value: 2500, displayValue: '2.5s', score: 80 },
    },
    issues: [
      {
        title: 'Reduce unused JavaScript',
        description:
          'Reduce unused JavaScript and defer loading scripts until they are required to decrease bytes consumed by network activity.',
        type: 'performance',
        impact: '15.2',
        selector: 'script[src*="unused"]',
      },
      {
        title: 'Largest Contentful Paint Element',
        description:
          'This is the largest contentful paint element. Consider optimizing it for better performance.',
        type: 'performance',
        impact: '12.8',
        selector: 'img.hero-image',
      },
      {
        title: 'First Meaningful Paint',
        description:
          'First Meaningful Paint measures when the primary content of a page is visible.',
        type: 'performance',
        impact: '8.5',
        selector: 'main',
      },
    ],
  },
  accessibility: {
    score: 88,
    issues: [
      {
        title: 'Missing alt text for images',
        description:
          'Images must have alternate text to give screen readers and other assistive technologies a text alternative to images.',
        type: 'accessibility',
        impact: '18.5',
        selector: 'img.hero-image',
        severity: 'High',
      },
      {
        title: 'Insufficient color contrast',
        description:
          'Background and foreground colors do not have a sufficient contrast ratio.',
        type: 'accessibility',
        impact: '12.3',
        selector: 'footer a',
        severity: 'Medium',
      },
      {
        title: 'Form elements must have labels',
        description:
          'Form elements must have programmatically associated labels to give screen reader users the information they need.',
        type: 'accessibility',
        impact: '8.7',
        selector: 'form input',
        severity: 'Low',
      },
    ],
  },
  seo: {
    score: 75,
    issues: [
      {
        title: 'Document does not have a meta description',
        description:
          'Meta descriptions may be included in search results to concisely summarize page content.',
        type: 'seo',
        impact: '14.2',
        selector: 'head',
      },
    ],
  },
  bestPractices: {
    score: 92,
    issues: [
      {
        title: 'Browser errors were logged to the console',
        description:
          'Errors logged to the console indicate unresolved problems. They can come from network request failures and other browser concerns.',
        type: 'best-practices',
        impact: '6.8',
        selector: 'console',
      },
    ],
  },
};
