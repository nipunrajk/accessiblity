import aiProvider from '../services/aiProvider.js';

// Standalone function for getting issue recommendations
async function getIssueRecommendations(issue) {
  const issuePrompt = `
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

Please provide 3 specific, actionable recommendations in this format:
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

  const content = await aiProvider.invoke(issuePrompt);

  if (!content) {
    throw new Error('No content in AI response');
  }

  // Parse the recommendations
  const recommendations = [];
  const sections = content.split(/\d+\.\s+/).filter(Boolean);

  for (const section of sections) {
    const lines = section
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
    const title = lines[0];
    let implementation = '';
    let codeExample = '';
    let expectedImpact = '';

    // Process each line
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (line.includes('Implementation:')) {
        implementation = line.replace('- Implementation:', '').trim();
      } else if (line.includes('Code Example:')) {
        // Find the code block
        let codeBlock = '';
        i++; // Move to next line
        if (i < lines.length && lines[i].includes('```')) {
          i++; // Skip the opening ```
          while (i < lines.length && !lines[i].includes('```')) {
            codeBlock += lines[i] + '\n';
            i++;
          }
        }
        codeExample = codeBlock.trim();
      } else if (line.includes('Expected Impact:')) {
        expectedImpact = line.replace('- Expected Impact:', '').trim();
      }
    }

    recommendations.push({
      suggestion: title,
      implementation,
      codeExample,
      expectedImpact,
      selector: null,
      snippet: codeExample || null,
    });
  }

  return recommendations;
}

class AIController {
  async getAnalysis(req, res) {
    try {
      const { results } = req.body;

      if (!results) {
        return res.status(400).json({ error: 'Analysis results are required' });
      }

      // Check if AI provider is available
      if (!aiProvider.isAvailable()) {
        return res.status(503).json({
          error: 'No AI provider configured. Check backend AI configuration',
        });
      }

      const analysisPrompt = `
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

      console.log('🚀 Invoking AI provider with prompt...');
      const analysis = await aiProvider.invoke(analysisPrompt);
      res.json({ analysis });
    } catch (error) {
      console.error('AI Analysis failed:', error);
      console.error('Error stack:', error.stack);
      res.status(500).json({
        error: 'Failed to generate AI analysis',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      });
    }
  }

  async getFixes(req, res) {
    try {
      const { issues } = req.body;

      if (!issues || !Array.isArray(issues)) {
        return res.status(400).json({ error: 'Issues array is required' });
      }

      // Check if AI provider is available
      if (!aiProvider.isAvailable()) {
        return res.status(503).json({
          error: 'No AI provider configured. Check backend AI configuration',
        });
      }

      const suggestions = {};

      // Process each unique issue
      const uniqueIssues = issues.filter(
        (issue, index, self) =>
          index === self.findIndex((i) => i.title === issue.title)
      );

      for (const issue of uniqueIssues) {
        try {
          const recommendations = await getIssueRecommendations(issue);
          suggestions[issue.title] = recommendations.map((rec) => ({
            description: rec.suggestion,
            implementation: rec.implementation,
            codeExample: rec.codeExample,
            expectedImpact: rec.expectedImpact,
            selector: rec.selector,
            snippet: rec.snippet,
          }));
        } catch (error) {
          console.error(
            `Failed to get recommendations for ${issue.title}:`,
            error
          );
          suggestions[issue.title] = [
            {
              description:
                'Failed to generate AI recommendations for this issue',
              implementation:
                'Please check the issue manually or try again later',
              codeExample: '',
              expectedImpact: 'Manual review required',
              selector: null,
              snippet: null,
            },
          ];
        }
      }

      res.json({ suggestions });
    } catch (error) {
      console.error('AI Fixes failed:', error);
      res.status(500).json({ error: 'Failed to generate AI fixes' });
    }
  }
}

export default new AIController();
