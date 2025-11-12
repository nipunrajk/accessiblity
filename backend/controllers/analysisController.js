import lighthouseService from '../services/lighthouseService.js';
import puppeteer from 'puppeteer';
import { validateUrl } from '../utils/validation.js';
import aiProvider from '../services/aiProvider.js';

// Helper function to generate AI insights
async function generateAIInsights(results) {
  if (!aiProvider.isAvailable()) {
    return null;
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

  try {
    return await aiProvider.invoke(analysisPrompt);
  } catch (error) {
    console.error('Failed to generate AI insights:', error);
    return null;
  }
}

// Helper function to generate AI fixes for issues
async function generateAIFixes(issues) {
  if (!aiProvider.isAvailable() || !issues || !Array.isArray(issues)) {
    return null;
  }

  const suggestions = {};
  const uniqueIssues = issues.filter(
    (issue, index, self) =>
      index === self.findIndex((i) => i.title === issue.title)
  );

  for (const issue of uniqueIssues.slice(0, 5)) {
    // Limit to top 5 issues for performance
    try {
      const issuePrompt = `
You are a web performance and accessibility expert. Generate specific recommendations for the following issue:

Issue Type: ${issue.type}
Issue Title: ${issue.title}
Description: ${issue.description}
Impact Score: ${issue.impact}

Provide 2 specific, actionable recommendations in this format:
1. [Title of Recommendation]
   - Implementation: [Step-by-step technical implementation]
   - Code Example: [If applicable, provide a code snippet]
   - Expected Impact: [Specific improvement]

Keep recommendations technical, specific, and focused on WCAG 2.1 compliance.
`;

      const content = await aiProvider.invoke(issuePrompt);

      if (content) {
        const recommendations = [];
        const sections = content.split(/\d+\.\s+/).filter(Boolean);

        for (const section of sections.slice(0, 2)) {
          // Limit to 2 recommendations per issue
          const lines = section
            .split('\n')
            .map((line) => line.trim())
            .filter(Boolean);
          const title = lines[0];
          let implementation = '';
          let codeExample = '';
          let expectedImpact = '';

          for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            if (line.includes('Implementation:')) {
              implementation = line.replace('- Implementation:', '').trim();
            } else if (line.includes('Code Example:')) {
              let codeBlock = '';
              i++;
              if (i < lines.length && lines[i].includes('```')) {
                i++;
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
            description: title,
            implementation,
            codeExample,
            expectedImpact,
            selector: null,
            snippet: codeExample || null,
          });
        }

        suggestions[issue.title] = recommendations;
      }
    } catch (error) {
      console.error(`Failed to get recommendations for ${issue.title}:`, error);
    }
  }

  return Object.keys(suggestions).length > 0 ? suggestions : null;
}

class AnalysisController {
  async analyzeWebsite(req, res) {
    const { url, includeAI = true } = req.body;

    // Validate URL
    const validatedUrl = validateUrl(url);

    // Set up SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });

    try {
      const sendProgress = (progress) => {
        res.write(`data: ${JSON.stringify(progress)}\n\n`);
      };

      // Send initial progress
      sendProgress({ message: 'Starting website analysis...', progress: 0 });

      const scanResults = await lighthouseService.scanWebsite(
        validatedUrl,
        sendProgress
      );

      const mainResults = scanResults.urls[0]?.scores || {
        performance: { score: 0 },
        accessibility: { score: 0 },
        bestPractices: { score: 0 },
        seo: { score: 0 },
      };

      // Send lighthouse results first
      const baseResponse = {
        ...mainResults,
        scanStats: {
          pagesScanned: scanResults.stats.pagesScanned,
          totalPages: scanResults.stats.totalPages,
          scannedUrls: scanResults.urls.map((u) => u.url),
        },
      };

      res.write(
        `data: ${JSON.stringify({ ...baseResponse, progress: 70 })}\n\n`
      );

      let aiInsights = null;
      let aiFixes = null;

      // Generate AI insights and fixes if requested
      if (includeAI && aiProvider.isAvailable()) {
        sendProgress({ message: 'Generating AI insights...', progress: 75 });

        aiInsights = await generateAIInsights(mainResults);

        if (aiInsights) {
          res.write(
            `data: ${JSON.stringify({
              ...baseResponse,
              aiInsights,
              progress: 85,
            })}\n\n`
          );
        }

        // Generate AI fixes for issues if available
        const allIssues = [];
        scanResults.urls.forEach((urlResult) => {
          if (urlResult.issues) {
            allIssues.push(...urlResult.issues);
          }
        });

        if (allIssues.length > 0) {
          sendProgress({
            message: 'Generating AI-powered fixes...',
            progress: 90,
          });

          aiFixes = await generateAIFixes(allIssues);

          if (aiFixes) {
            res.write(
              `data: ${JSON.stringify({
                ...baseResponse,
                aiInsights,
                aiFixes,
                progress: 95,
              })}\n\n`
            );
          }
        }
      }

      // Send final response
      res.write(
        `data: ${JSON.stringify({
          ...baseResponse,
          aiInsights,
          aiFixes,
          done: true,
          progress: 100,
        })}\n\n`
      );
    } catch (error) {
      console.error('Analysis failed:', error);
      res.write(
        `data: ${JSON.stringify({ error: 'Failed to analyze website' })}\n\n`
      );
    }

    res.end();
  }

  async scanElements(req, res) {
    try {
      const { url } = req.body;

      const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });

      const page = await browser.newPage();
      await page.goto(url, { waitUntil: 'networkidle0' });

      const elements = await page.evaluate(() => {
        const getAllElements = (root) => {
          const elements = [];
          const walk = (node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              elements.push({
                tag: node.tagName.toLowerCase(),
                id: node.id || null,
                classes: Array.from(node.classList || []),
                textContent: node.textContent?.trim() || null,
                attributes: Array.from(node.attributes || []).map((attr) => ({
                  name: attr.name,
                  value: attr.value,
                })),
                path: getXPath(node),
                children: node.children.length,
              });

              Array.from(node.children).forEach(walk);
            }
          };

          const getXPath = (node) => {
            const parts = [];
            while (node && node.nodeType === Node.ELEMENT_NODE) {
              let idx = 0;
              let sibling = node;
              while (sibling) {
                if (
                  sibling.nodeType === Node.ELEMENT_NODE &&
                  sibling.tagName === node.tagName
                )
                  idx++;
                sibling = sibling.previousSibling;
              }
              const tag = node.tagName.toLowerCase();
              parts.unshift(`${tag}[${idx}]`);
              node = node.parentNode;
            }
            return parts.length ? '/' + parts.join('/') : '';
          };

          walk(root);
          return elements;
        };

        return getAllElements(document.documentElement);
      });

      await browser.close();
      res.json({ elements });
    } catch (error) {
      console.error('Error scanning elements:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

export default new AnalysisController();
