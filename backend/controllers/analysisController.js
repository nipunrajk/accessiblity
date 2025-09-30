import lighthouseService from '../services/lighthouseService.js';
import puppeteer from 'puppeteer';
import { validateUrl } from '../utils/validation.js';

class AnalysisController {
  async analyzeWebsite(req, res) {
    const { url } = req.body;

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

      res.write(
        `data: ${JSON.stringify({
          ...mainResults,
          scanStats: {
            pagesScanned: scanResults.stats.pagesScanned,
            totalPages: scanResults.stats.totalPages,
            scannedUrls: scanResults.urls.map((u) => u.url),
          },
          done: true,
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
