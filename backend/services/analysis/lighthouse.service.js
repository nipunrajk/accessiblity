import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';
import puppeteer from 'puppeteer';
import logger from '../../utils/logger.js';
import {
  createExternalAPIError,
  createInternalError,
} from '../../utils/errorHandler.js';

class LighthouseService {
  constructor() {
    this.browserConfig = {
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1920x1080',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process',
      ],
    };
  }

  async discoverPages(url, maxPages = 100) {
    const browser = await puppeteer.launch(this.browserConfig);
    const page = await browser.newPage();

    await page.setDefaultNavigationTimeout(15000);
    await page.setRequestInterception(true);

    // Optimize performance by blocking unnecessary resources
    page.on('request', (request) => {
      const resourceType = request.resourceType();
      if (
        ['image', 'stylesheet', 'font', 'media', 'other'].includes(resourceType)
      ) {
        request.abort();
      } else {
        request.continue();
      }
    });

    const visited = new Set();
    const toVisit = [new URL(url).toString()];
    const discovered = [];

    try {
      while (toVisit.length > 0 && discovered.length < maxPages) {
        const currentUrl = toVisit.shift();
        if (visited.has(currentUrl)) continue;

        try {
          const response = await page.goto(currentUrl, {
            waitUntil: 'domcontentloaded',
            timeout: 15000,
          });

          if (response && response.ok()) {
            visited.add(currentUrl);
            discovered.push(currentUrl);

            // Find all links on the page
            const links = await page.evaluate(() => {
              return Array.from(document.querySelectorAll('a[href]'))
                .map((link) => {
                  try {
                    const href = link.href;
                    if (
                      href.startsWith('tel:') ||
                      href.startsWith('mailto:') ||
                      href.includes('javascript:') ||
                      href.endsWith('.pdf') ||
                      href.endsWith('.jpg') ||
                      href.endsWith('.png')
                    ) {
                      return null;
                    }
                    return new URL(href, window.location.href).toString();
                  } catch {
                    return null;
                  }
                })
                .filter((href) => href && href.startsWith('http'));
            });

            // Add new links to toVisit if they're from the same domain
            const baseUrl = new URL(url).origin;
            for (const link of links) {
              try {
                const normalizedLink = new URL(link).toString();
                if (
                  normalizedLink.startsWith(baseUrl) &&
                  !visited.has(normalizedLink) &&
                  !toVisit.includes(normalizedLink) &&
                  !normalizedLink.includes('#')
                ) {
                  toVisit.push(normalizedLink);
                }
              } catch (error) {
                // Silently ignore invalid URLs
              }
            }
          }
        } catch (error) {
          if (error.name !== 'TimeoutError') {
            logger.warn(`Failed to visit page during discovery`, {
              url: currentUrl,
              error: error.message,
            });
          }
        }
      }
    } finally {
      await browser.close();
    }

    return discovered;
  }

  async analyzePage(page, url) {
    try {
      const result = await lighthouse(url, {
        port: new URL(page.browser().wsEndpoint()).port,
        output: 'json',
        logLevel: 'error',
        onlyCategories: [
          'performance',
          'accessibility',
          'best-practices',
          'seo',
        ],
      });

      const report = JSON.parse(result.report);
      return this.processLighthouseReport(report);
    } catch (error) {
      logger.error('Lighthouse analysis failed for page', error, { url });
      throw createExternalAPIError('Lighthouse', error);
    }
  }

  processLighthouseReport(report) {
    const { audits, categories } = report;

    const extractIssues = (categoryName, categoryData) => {
      const issues = [];
      const auditRefs = categoryData.auditRefs || [];

      const sortedRefs = auditRefs.sort((a, b) => {
        const scoreA = audits[a.id].score || 0;
        const scoreB = audits[b.id].score || 0;
        const weightA = a.weight || 0;
        const weightB = b.weight || 0;
        const impactA = (1 - scoreA) * weightA;
        const impactB = (1 - scoreB) * weightB;
        return impactB - impactA;
      });

      for (const ref of sortedRefs) {
        const audit = audits[ref.id];
        if (audit.score !== 1 && audit.score !== null) {
          const rawScore = audit.score || 0;
          const weight = ref.weight || 1;
          const maxWeight = Math.max(...auditRefs.map((r) => r.weight || 0));
          const normalizedImpact = (
            (1 - rawScore) *
            (weight / maxWeight) *
            100
          ).toFixed(1);

          const issue = {
            type: categoryName.toLowerCase(),
            title: audit.title,
            description: audit.description,
            score: audit.score * 100,
            impact: normalizedImpact,
            weight: ref.weight,
            items: audit.details?.items || [],
            recommendations:
              audit.details?.items
                ?.map((item) => ({
                  snippet: item.node?.snippet || item.source || '',
                  selector: item.node?.selector || '',
                  suggestion: item.suggestion || audit.description,
                }))
                .filter((rec) => rec.snippet || rec.selector)
                .slice(0, 3) || [],
          };
          issues.push(issue);
        }
      }

      return issues.filter((issue, index) => {
        const totalImpact = issues.reduce(
          (sum, i) => sum + parseFloat(i.impact),
          0
        );
        let cumulativeImpact = 0;
        for (let i = 0; i <= index; i++) {
          cumulativeImpact += parseFloat(issues[i].impact);
        }
        return cumulativeImpact <= totalImpact * 0.8;
      });
    };

    return {
      performance: {
        score: categories.performance.score * 100,
        metrics: {
          fcp: {
            score: audits['first-contentful-paint'].score * 100,
            value: audits['first-contentful-paint'].numericValue,
          },
          lcp: {
            score: audits['largest-contentful-paint'].score * 100,
            value: audits['largest-contentful-paint'].numericValue,
          },
          tbt: {
            score: audits['total-blocking-time'].score * 100,
            value: audits['total-blocking-time'].numericValue,
          },
          cls: {
            score: audits['cumulative-layout-shift'].score * 100,
            value: audits['cumulative-layout-shift'].numericValue,
          },
          si: {
            score: audits['speed-index'].score * 100,
            value: audits['speed-index'].numericValue,
          },
          tti: {
            score: audits['interactive'].score * 100,
            value: audits['interactive'].numericValue,
          },
        },
        issues: extractIssues('performance', categories.performance),
      },
      accessibility: {
        score: categories.accessibility.score * 100,
        audits: {
          passed: categories.accessibility.auditRefs.filter(
            (ref) => audits[ref.id].score === 1
          ).length,
          failed: categories.accessibility.auditRefs.filter(
            (ref) => audits[ref.id].score !== 1 && audits[ref.id].score !== null
          ).length,
          total: categories.accessibility.auditRefs.length,
        },
        issues: extractIssues('accessibility', categories.accessibility),
      },
      bestPractices: {
        score: categories['best-practices'].score * 100,
        audits: {
          passed: categories['best-practices'].auditRefs.filter(
            (ref) => audits[ref.id].score === 1
          ).length,
          failed: categories['best-practices'].auditRefs.filter(
            (ref) => audits[ref.id].score !== 1 && audits[ref.id].score !== null
          ).length,
          total: categories['best-practices'].auditRefs.length,
        },
        issues: extractIssues('best-practices', categories['best-practices']),
      },
      seo: {
        score: categories.seo.score * 100,
        audits: {
          passed: categories.seo.auditRefs.filter(
            (ref) => audits[ref.id].score === 1
          ).length,
          failed: categories.seo.auditRefs.filter(
            (ref) => audits[ref.id].score !== 1 && audits[ref.id].score !== null
          ).length,
          total: categories.seo.auditRefs.length,
        },
        issues: extractIssues('seo', categories.seo),
      },
    };
  }

  async scanWebsite(url, sendProgress) {
    const routes = await this.discoverPages(url);
    const scannedUrls = [];
    const totalPages = routes.length;
    let pagesScanned = 0;

    if (totalPages === 0) {
      sendProgress({
        pagesScanned: 0,
        totalPages: 1,
        scannedUrls: [url],
      });
      routes.push(url);
    }

    const browser = await puppeteer.launch(this.browserConfig);

    try {
      const page = await browser.newPage();
      await page.setDefaultNavigationTimeout(30000);

      for (const route of routes) {
        try {
          const result = await this.analyzePage(page, route);
          if (result) {
            scannedUrls.push({ url: route, scores: result });
            pagesScanned++;

            sendProgress({
              pagesScanned,
              totalPages: totalPages || 1,
              scannedUrls: scannedUrls.map((u) => u.url),
            });
          }
        } catch (error) {
          logger.error(`Failed to analyze page`, error, { url: route });
          // Continue with other pages even if one fails
        }
      }
    } finally {
      await browser.close();
    }

    return {
      urls: scannedUrls,
      stats: {
        pagesScanned,
        totalPages: totalPages || 1,
      },
    };
  }
}

export default new LighthouseService();
