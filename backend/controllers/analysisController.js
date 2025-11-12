import lighthouseService from '../services/lighthouseService.js';
import puppeteer from 'puppeteer';
import { validateUrl } from '../utils/validation.js';
import aiAnalysisService from '../services/aiAnalysisService.js';
import { PUPPETEER } from '../constants/index.js';
import logger from '../utils/logger.js';

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
      if (includeAI) {
        sendProgress({ message: 'Generating AI insights...', progress: 75 });

        aiInsights = await aiAnalysisService.generateInsights(mainResults);

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

          aiFixes = await aiAnalysisService.generateFixes(allIssues);

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
      logger.error('Analysis failed', error, { url: validatedUrl });
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
        headless: PUPPETEER.HEADLESS,
        args: PUPPETEER.ARGS,
      });

      const page = await browser.newPage();
      await page.goto(url, { waitUntil: PUPPETEER.WAIT_UNTIL });

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
      logger.success('Element scanning completed', {
        elementCount: elements.length,
      });
      res.json({ elements });
    } catch (error) {
      logger.error('Error scanning elements', error, { url });
      res.status(500).json({ error: error.message });
    }
  }
}

export default new AnalysisController();
