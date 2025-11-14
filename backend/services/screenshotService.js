import puppeteer from 'puppeteer';
import path from 'path';
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class ScreenshotService {
  constructor() {
    this.browser = null;
    this.screenshotsDir = path.join(__dirname, '../../screenshots');
    this.initScreenshotsDir();
  }

  async initScreenshotsDir() {
    try {
      await fs.mkdir(this.screenshotsDir, { recursive: true });
      logger.info('Screenshots directory initialized', {
        path: this.screenshotsDir,
      });
    } catch (error) {
      logger.error('Failed to create screenshots directory', error);
    }
  }

  async initBrowser() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
        ],
      });
      logger.info('Puppeteer browser initialized');
    }
    return this.browser;
  }

  async captureScreenshot(url, options = {}) {
    const browser = await this.initBrowser();
    const page = await browser.newPage();

    try {
      await page.setViewport({
        width: options.width || 1200,
        height: options.height || 800,
        deviceScaleFactor: options.scale || 1,
      });

      await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });

      if (options.waitFor) {
        await new Promise((resolve) => setTimeout(resolve, options.waitFor));
      }

      const format = options.format || 'png';
      const screenshotOptions = {
        type: format,
        fullPage: options.fullPage || false,
      };

      // Quality only applies to JPEG
      if (format === 'jpeg' || format === 'jpg') {
        screenshotOptions.quality = options.quality || 90;
      }

      const screenshotBuffer = await page.screenshot(screenshotOptions);

      // Save to filesystem if requested
      let filePath = null;
      if (options.saveToFile) {
        const timestamp = Date.now();
        const filename = `screenshot-${timestamp}.png`;
        filePath = path.join(this.screenshotsDir, filename);
        await fs.writeFile(filePath, screenshotBuffer);
      }

      return {
        success: true,
        screenshot: `data:image/${
          options.format || 'png'
        };base64,${screenshotBuffer.toString('base64')}`,
        filePath,
        metadata: {
          url,
          timestamp: new Date().toISOString(),
          viewport: {
            width: options.width || 1200,
            height: options.height || 800,
          },
        },
      };
    } catch (error) {
      logger.error('Screenshot capture failed', error, { url });
      return {
        success: false,
        error: error.message,
      };
    } finally {
      await page.close();
    }
  }

  async captureWithHighlights(url, issues = [], options = {}) {
    const browser = await this.initBrowser();
    const page = await browser.newPage();

    try {
      await page.setViewport({
        width: options.width || 1200,
        height: options.height || 800,
        deviceScaleFactor: options.scale || 1,
      });

      await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });

      // Inject CSS to highlight elements with issues
      const highlightCSS = `
        .accessibility-issue-highlight {
          outline: 3px solid #ef4444 !important;
          outline-offset: 2px !important;
          box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.2) !important;
          position: relative !important;
        }
        .accessibility-issue-badge {
          position: absolute !important;
          top: -30px !important;
          left: 0 !important;
          background: #ef4444 !important;
          color: white !important;
          padding: 4px 8px !important;
          font-size: 12px !important;
          font-weight: 600 !important;
          border-radius: 4px !important;
          white-space: nowrap !important;
          z-index: 10000 !important;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2) !important;
        }
      `;

      await page.addStyleTag({ content: highlightCSS });

      // Highlight elements based on issues
      const highlights = [];
      for (const issue of issues) {
        if (issue.selector) {
          try {
            await page.evaluate(
              (selector, issueText) => {
                const elements = document.querySelectorAll(selector);
                elements.forEach((el) => {
                  el.classList.add('accessibility-issue-highlight');
                  const badge = document.createElement('div');
                  badge.className = 'accessibility-issue-badge';
                  badge.textContent = issueText;
                  el.style.position = 'relative';
                  el.appendChild(badge);
                });
              },
              issue.selector,
              issue.title || issue.description || 'Issue'
            );

            const elements = await page.$$(issue.selector);
            for (let i = 0; i < elements.length; i++) {
              const element = elements[i];
              const boundingBox = await element.boundingBox();

              if (boundingBox) {
                highlights.push({
                  selector: issue.selector,
                  boundingBox,
                  issue: issue.title || issue.description || 'Issue',
                });
              }
            }
          } catch (selectorError) {
            logger.warn('Could not highlight selector', selectorError, {
              selector: issue.selector,
            });
          }
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 500));

      const format = options.format || 'png';
      const screenshotOptions = {
        type: format,
        fullPage: options.fullPage || false,
      };

      // Quality only applies to JPEG
      if (format === 'jpeg' || format === 'jpg') {
        screenshotOptions.quality = options.quality || 90;
      }

      const screenshotBuffer = await page.screenshot(screenshotOptions);

      // Save to filesystem if requested
      let filePath = null;
      if (options.saveToFile) {
        const timestamp = Date.now();
        const filename = `screenshot-${timestamp}.png`;
        filePath = path.join(this.screenshotsDir, filename);
        await fs.writeFile(filePath, screenshotBuffer);
      }

      return {
        success: true,
        screenshot: `data:image/${
          options.format || 'png'
        };base64,${screenshotBuffer.toString('base64')}`,
        filePath,
        highlights,
        metadata: {
          url,
          timestamp: new Date().toISOString(),
          viewport: {
            width: options.width || 1200,
            height: options.height || 800,
          },
          issuesHighlighted: highlights.length,
        },
      };
    } catch (error) {
      logger.error('Screenshot with highlights failed', error, { url });
      return {
        success: false,
        error: error.message,
      };
    } finally {
      await page.close();
    }
  }

  // New method: Capture issue-wise screenshots
  async captureIssueWiseScreenshots(url, issues = [], options = {}) {
    const browser = await this.initBrowser();
    const screenshots = [];

    logger.info('Starting issue-wise screenshot capture', {
      url,
      issueCount: issues.length,
    });

    for (const issue of issues) {
      const page = await browser.newPage();

      try {
        await page.setViewport({
          width: options.width || 1200,
          height: options.height || 800,
          deviceScaleFactor: options.scale || 1,
        });

        await page.goto(url, {
          waitUntil: 'networkidle2',
          timeout: 30000,
        });

        // Inject highlight CSS
        const highlightCSS = `
          .issue-highlight {
            outline: 3px solid #ef4444 !important;
            outline-offset: 2px !important;
            box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.2) !important;
            position: relative !important;
          }
          .issue-badge {
            position: absolute !important;
            top: -35px !important;
            left: 0 !important;
            background: #ef4444 !important;
            color: white !important;
            padding: 6px 12px !important;
            font-size: 13px !important;
            font-weight: 600 !important;
            border-radius: 6px !important;
            white-space: nowrap !important;
            z-index: 10000 !important;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3) !important;
          }
        `;

        await page.addStyleTag({ content: highlightCSS });

        // Highlight only this specific issue
        let elementFound = false;
        if (issue.selector) {
          try {
            const elementExists = await page.$(issue.selector);
            if (elementExists) {
              await page.evaluate(
                (selector, issueTitle) => {
                  const element = document.querySelector(selector);
                  if (element) {
                    element.classList.add('issue-highlight');
                    const badge = document.createElement('div');
                    badge.className = 'issue-badge';
                    badge.textContent = issueTitle;
                    element.style.position = 'relative';
                    element.appendChild(badge);

                    // Scroll element into view
                    element.scrollIntoView({
                      behavior: 'smooth',
                      block: 'center',
                    });
                  }
                },
                issue.selector,
                issue.title || issue.description || 'Issue'
              );
              elementFound = true;
            }
          } catch (err) {
            logger.warn('Could not find element for issue', err, {
              selector: issue.selector,
            });
          }
        }

        // Wait for scroll and render
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Take screenshot
        const screenshotBuffer = await page.screenshot({
          type: 'png',
          fullPage: false,
        });

        // Save to filesystem
        const timestamp = Date.now();
        const sanitizedTitle = (issue.title || 'issue')
          .replace(/[^a-z0-9]/gi, '-')
          .toLowerCase()
          .substring(0, 50);
        const filename = `issue-${sanitizedTitle}-${timestamp}.png`;
        const filePath = path.join(this.screenshotsDir, filename);
        await fs.writeFile(filePath, screenshotBuffer);

        screenshots.push({
          issue: {
            title: issue.title,
            description: issue.description,
            severity: issue.severity,
            selector: issue.selector,
          },
          screenshot: `data:image/png;base64,${screenshotBuffer.toString(
            'base64'
          )}`,
          filename,
          filePath,
          elementFound,
          timestamp: new Date().toISOString(),
        });

        logger.info('Captured screenshot for issue', {
          title: issue.title,
          elementFound,
        });
      } catch (error) {
        logger.error('Failed to capture issue screenshot', error, {
          issue: issue.title,
        });
        screenshots.push({
          issue: {
            title: issue.title,
            description: issue.description,
            severity: issue.severity,
          },
          error: error.message,
          success: false,
        });
      } finally {
        await page.close();
      }
    }

    return {
      success: true,
      screenshots,
      totalIssues: issues.length,
      successfulCaptures: screenshots.filter((s) => !s.error).length,
      metadata: {
        url,
        timestamp: new Date().toISOString(),
      },
    };
  }

  async generateBeforeAfterComparison(url, fixes = [], options = {}) {
    try {
      // Capture "before" screenshot
      const beforeResult = await this.captureScreenshot(url, {
        ...options,
        waitFor: 1000,
      });

      if (!beforeResult.success) {
        return { success: false, error: 'Failed to capture before screenshot' };
      }

      const browser = await this.initBrowser();
      const page = await browser.newPage();

      try {
        await page.setViewport({
          width: options.width || 1200,
          height: options.height || 800,
        });

        await page.goto(url, { waitUntil: 'networkidle2' });

        // Simulate fixes by injecting CSS/JS
        for (const fix of fixes) {
          if (fix.type === 'css' && fix.selector && fix.styles) {
            await page.addStyleTag({
              content: `${fix.selector} { ${fix.styles} }`,
            });
          } else if (fix.type === 'attribute' && fix.selector) {
            await page.evaluate(
              (selector, attributes) => {
                const elements = document.querySelectorAll(selector);
                elements.forEach((el) => {
                  Object.entries(attributes).forEach(([key, value]) => {
                    el.setAttribute(key, value);
                  });
                });
              },
              fix.selector,
              fix.attributes
            );
          }
        }

        await new Promise((resolve) => setTimeout(resolve, 1000));

        const format = options.format || 'png';
        const screenshotOptions = {
          type: format,
          fullPage: options.fullPage || false,
        };

        // Quality only applies to JPEG
        if (format === 'jpeg' || format === 'jpg') {
          screenshotOptions.quality = options.quality || 90;
        }

        const afterBuffer = await page.screenshot(screenshotOptions);

        return {
          success: true,
          before: beforeResult.screenshot,
          after: `data:image/${
            options.format || 'png'
          };base64,${afterBuffer.toString('base64')}`,
          metadata: {
            url,
            timestamp: new Date().toISOString(),
            fixesApplied: fixes.length,
          },
        };
      } finally {
        await page.close();
      }
    } catch (error) {
      logger.error('Before/after comparison failed', error, { url });
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      logger.info('Puppeteer browser closed');
    }
  }

  // Utility: List all screenshots
  async listScreenshots() {
    try {
      const files = await fs.readdir(this.screenshotsDir);
      const screenshots = [];

      for (const file of files) {
        if (file.endsWith('.png')) {
          const filePath = path.join(this.screenshotsDir, file);
          const stats = await fs.stat(filePath);
          screenshots.push({
            filename: file,
            path: filePath,
            size: stats.size,
            created: stats.birthtime,
          });
        }
      }

      return screenshots;
    } catch (error) {
      logger.error('Failed to list screenshots', error);
      return [];
    }
  }

  // Utility: Delete screenshot
  async deleteScreenshot(filename) {
    try {
      const filePath = path.join(this.screenshotsDir, filename);
      await fs.unlink(filePath);
      logger.info('Screenshot deleted', { filename });
      return { success: true };
    } catch (error) {
      logger.error('Failed to delete screenshot', error, { filename });
      return { success: false, error: error.message };
    }
  }

  // Utility: Clean old screenshots
  async cleanOldScreenshots(maxAgeHours = 24) {
    try {
      const files = await fs.readdir(this.screenshotsDir);
      const now = Date.now();
      const maxAge = maxAgeHours * 60 * 60 * 1000;
      let deletedCount = 0;

      for (const file of files) {
        if (file.endsWith('.png')) {
          const filePath = path.join(this.screenshotsDir, file);
          const stats = await fs.stat(filePath);
          const age = now - stats.birthtimeMs;

          if (age > maxAge) {
            await fs.unlink(filePath);
            deletedCount++;
          }
        }
      }

      logger.info('Old screenshots cleaned', { deletedCount, maxAgeHours });
      return { success: true, deletedCount };
    } catch (error) {
      logger.error('Failed to clean old screenshots', error);
      return { success: false, error: error.message };
    }
  }
}

export default new ScreenshotService();
