import lighthouse from "lighthouse";
import * as chromeLauncher from "chrome-launcher";
import puppeteer from "puppeteer";
import logger from "../../utils/logger.js";
import { getBrowser } from "../browser.service.js";
import { createExternalAPIError } from "../../utils/errorHandler.js";

/**
 * Resolve the Chrome/Chromium executable path for chrome-launcher.
 * Priority:
 *  1. PUPPETEER_EXECUTABLE_PATH env var (Docker deployments with system Chromium)
 *  2. Puppeteer's bundled Chrome (native Node deployments like Render)
 * @returns {Promise<string>}
 */
async function resolveChromePath() {
  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    return process.env.PUPPETEER_EXECUTABLE_PATH;
  }
  // Puppeteer v25+ executablePath() returns a Promise
  const puppeteerPath = await puppeteer.executablePath();
  logger.info("Using Puppeteer bundled Chrome for Lighthouse", {
    puppeteerPath,
  });
  return puppeteerPath;
}

class LighthouseService {
  constructor() {}

  async discoverPages(url, maxPages = 1) {
    const browser = await getBrowser();
    const page = await browser.newPage();

    await page.setDefaultNavigationTimeout(15000);
    await page.setRequestInterception(true);

    // Optimize performance by blocking unnecessary resources
    page.on("request", (request) => {
      const resourceType = request.resourceType();
      if (
        ["image", "stylesheet", "font", "media", "other"].includes(resourceType)
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
            waitUntil: "domcontentloaded",
            timeout: 15000,
          });

          if (response && response.ok()) {
            visited.add(currentUrl);
            discovered.push(currentUrl);

            // Find all links on the page
            const links = await page.evaluate(() => {
              return Array.from(document.querySelectorAll("a[href]"))
                .map((link) => {
                  try {
                    const href = link.href;
                    if (
                      href.startsWith("tel:") ||
                      href.startsWith("mailto:") ||
                      href.includes("javascript:") ||
                      href.endsWith(".pdf") ||
                      href.endsWith(".jpg") ||
                      href.endsWith(".png")
                    ) {
                      return null;
                    }
                    return new URL(href, window.location.href).toString();
                  } catch {
                    return null;
                  }
                })
                .filter((href) => href && href.startsWith("http"));
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
                  !normalizedLink.includes("#")
                ) {
                  toVisit.push(normalizedLink);
                }
                // eslint-disable-next-line no-unused-vars
              } catch (_error) {
                // Silently ignore invalid URLs
              }
            }
          }
        } catch (error) {
          if (error.name !== "TimeoutError") {
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

  /**
   * Resolve Lighthouse execution mode.
   *
   * LIGHTHOUSE_MODE (env) controls where Lighthouse runs:
   *   - 'psi'       (default): public URLs use the free PageSpeed Insights API
   *                            (Google runs Lighthouse on its own servers — no
   *                            Chrome on the host, safe for 512MB free tiers).
   *                            PSI failures fall back to local Chrome.
   *   - 'local':     Always launch a local Chrome via chrome-launcher. Use this
   *                  for self-hosted/firewalled deployments where PSI cannot
   *                  reach the site, or when you want a full local audit.
   *   - 'psi-only': Always use PSI, never fall back to local Chrome (fails
   *                  loudly if PSI is unavailable).
   *
   * localhost / 127.0.0.1 URLs always use local Chrome, since PSI cannot reach
   * them.
   *
   * @param {string} url - The URL to audit
   * @returns {string} One of 'psi' | 'local' | 'psi-only'
   */
  _resolveMode(url) {
    const isLocalhost = url.includes("localhost") || url.includes("127.0.0.1");
    if (isLocalhost) return "local";

    const mode = (process.env.LIGHTHOUSE_MODE || "psi").toLowerCase();
    if (!["psi", "local", "psi-only"].includes(mode)) {
      logger.warn(`Invalid LIGHTHOUSE_MODE "${mode}", defaulting to "psi"`, {
        url,
      });
      return "psi";
    }
    return mode;
  }

  /**
   * Analyze a page with Lighthouse.
   *
   * Routing logic:
   *   - localhost URL  -> local Chrome (PSI can't reach internal sites)
   *   - public + 'psi'      -> PSI API, fall back to local Chrome on failure
   *   - public + 'psi-only' -> PSI API only (no local Chrome fallback)
   *   - public + 'local'    -> local Chrome
   *
   * @param {string} url - The URL to audit
   * @returns {Object} Processed Lighthouse report
   */
  async analyzePage(url) {
    const mode = this._resolveMode(url);

    if (mode === "local") {
      return this._runLocalLighthouse(url);
    }

    // PSI path (psi or psi-only)
    try {
      return await this._runPageSpeedInsights(url);
    } catch (error) {
      if (mode === "psi-only") {
        logger.error(
          "PageSpeed Insights API failed (psi-only mode, no fallback)",
          error,
          {
            url,
          },
        );
        throw error;
      }
      logger.warn(
        "PageSpeed Insights API failed, falling back to local Lighthouse",
        {
          error: error.message,
          url,
        },
      );
      return this._runLocalLighthouse(url);
    }
  }

  /**
   * Run Lighthouse by launching a local Chrome instance (chrome-launcher).
   *
   * Chrome is resolved from PUPPETEER_EXECUTABLE_PATH if set, otherwise from
   * Puppeteer's bundled Chrome (the typical case in local development). This
   * path is used for localhost URLs and as a fallback / opt-in for hosted
   * deployments that choose to run Lighthouse on the host itself.
   *
   * @param {string} url - The URL to audit
   * @returns {Object} Processed Lighthouse report
   */
  async _runLocalLighthouse(url) {
    let chrome;
    try {
      logger.info("Launching local Chrome for Lighthouse audit", { url });

      const chromePath = await resolveChromePath();
      chrome = await chromeLauncher.launch({
        chromeFlags: [
          "--headless",
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-gpu",
          "--disable-accelerated-2d-canvas",
        ],
        chromePath,
      });

      logger.info("Chrome launched for Lighthouse", {
        port: chrome.port,
        pid: chrome.pid,
        chromePath: chromePath || "default",
      });

      const result = await lighthouse(url, {
        port: chrome.port,
        output: "json",
        logLevel: "error",
        onlyCategories: [
          "performance",
          "accessibility",
          "best-practices",
          "seo",
        ],
      });

      const report = JSON.parse(result.report);
      return this.processLighthouseReport(report);
    } catch (error) {
      logger.error("Lighthouse analysis failed for page", error, { url });
      throw createExternalAPIError("Lighthouse", error);
    } finally {
      if (chrome) {
        try {
          await chrome.kill();
        } catch (killErr) {
          logger.warn("Failed to kill Chrome after Lighthouse", killErr);
        }
      }
    }
  }

  /**
   * Run Lighthouse via the free PageSpeed Insights API.
   * Google executes Lighthouse on its own servers and returns a standard
   * lighthouseResult payload, so no local Chrome is required.
   *
   * @param {string} url - The public URL to audit
   * @returns {Object} Processed Lighthouse report
   */
  async _runPageSpeedInsights(url) {
    logger.info("Using PageSpeed Insights API for Lighthouse audit", { url });

    const apiUrl =
      `https://www.googleapis.com/pagespeedonline/v5/runPagespeed` +
      `?url=${encodeURIComponent(url)}` +
      `&category=PERFORMANCE&category=ACCESSIBILITY&category=BEST_PRACTICES&category=SEO`;

    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw createExternalAPIError(
        "PageSpeed Insights",
        new Error(
          `PSI API returned ${response.status}: ${response.statusText}`,
        ),
      );
    }

    const data = await response.json();
    if (!data?.lighthouseResult) {
      throw createExternalAPIError(
        "PageSpeed Insights",
        new Error("PSI response missing lighthouseResult"),
      );
    }

    return this.processLighthouseReport(data.lighthouseResult);
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
                  snippet: item.node?.snippet || item.source || "",
                  selector: item.node?.selector || "",
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
          0,
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
            score: audits["first-contentful-paint"].score * 100,
            value: audits["first-contentful-paint"].numericValue,
          },
          lcp: {
            score: audits["largest-contentful-paint"].score * 100,
            value: audits["largest-contentful-paint"].numericValue,
          },
          tbt: {
            score: audits["total-blocking-time"].score * 100,
            value: audits["total-blocking-time"].numericValue,
          },
          cls: {
            score: audits["cumulative-layout-shift"].score * 100,
            value: audits["cumulative-layout-shift"].numericValue,
          },
          si: {
            score: audits["speed-index"].score * 100,
            value: audits["speed-index"].numericValue,
          },
          tti: {
            score: audits["interactive"].score * 100,
            value: audits["interactive"].numericValue,
          },
        },
        issues: extractIssues("performance", categories.performance),
      },
      accessibility: {
        score: categories.accessibility.score * 100,
        audits: {
          passed: categories.accessibility.auditRefs.filter(
            (ref) => audits[ref.id].score === 1,
          ).length,
          failed: categories.accessibility.auditRefs.filter(
            (ref) =>
              audits[ref.id].score !== 1 && audits[ref.id].score !== null,
          ).length,
          total: categories.accessibility.auditRefs.length,
        },
        issues: extractIssues("accessibility", categories.accessibility),
      },
      bestPractices: {
        score: categories["best-practices"].score * 100,
        audits: {
          passed: categories["best-practices"].auditRefs.filter(
            (ref) => audits[ref.id].score === 1,
          ).length,
          failed: categories["best-practices"].auditRefs.filter(
            (ref) =>
              audits[ref.id].score !== 1 && audits[ref.id].score !== null,
          ).length,
          total: categories["best-practices"].auditRefs.length,
        },
        issues: extractIssues("best-practices", categories["best-practices"]),
      },
      seo: {
        score: categories.seo.score * 100,
        audits: {
          passed: categories.seo.auditRefs.filter(
            (ref) => audits[ref.id].score === 1,
          ).length,
          failed: categories.seo.auditRefs.filter(
            (ref) =>
              audits[ref.id].score !== 1 && audits[ref.id].score !== null,
          ).length,
          total: categories.seo.auditRefs.length,
        },
        issues: extractIssues("seo", categories.seo),
      },
    };
  }

  async scanWebsite(url, sendProgress) {
    const mode = this._resolveMode(url);

    // In psi / psi-only mode for public URLs, skip browser-based page
    // discovery entirely — PageSpeed Insights audits the given URL directly,
    // so we never need a BrowserCat/local Chrome crawl on the host.
    const routes = mode === "local" ? await this.discoverPages(url) : [url];

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

    for (const route of routes) {
      try {
        const result = await this.analyzePage(route);
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
