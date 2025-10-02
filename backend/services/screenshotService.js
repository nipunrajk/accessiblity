import puppeteer from 'puppeteer';
import path from 'path';
import { promises as fs } from 'fs';

class ScreenshotService {
  constructor() {
    this.browser = null;
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
    }
    return this.browser;
  }

  async captureScreenshot(url, options = {}) {
    const browser = await this.initBrowser();
    const page = await browser.newPage();

    try {
      // Set viewport
      await page.setViewport({
        width: options.width || 1200,
        height: options.height || 800,
        deviceScaleFactor: options.scale || 1,
      });

      // Navigate to the page
      await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });

      // Wait for any additional loading
      if (options.waitFor) {
        await page.waitForTimeout(options.waitFor);
      }

      // Take screenshot
      const screenshotBuffer = await page.screenshot({
        type: options.format || 'png',
        fullPage: options.fullPage || false,
        quality: options.quality || 90,
      });

      return {
        success: true,
        screenshot: `data:image/${
          options.format || 'png'
        };base64,${screenshotBuffer.toString('base64')}`,
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
      console.error('Screenshot capture failed:', error);
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
          position: relative !important;
        }
        .accessibility-issue-highlight::after {
          content: attr(data-issue-text);
          position: absolute;
          top: -30px;
          left: 0;
          background: #ef4444;
          color: white;
          padding: 4px 8px;
          font-size: 12px;
          border-radius: 4px;
          white-space: nowrap;
          z-index: 10000;
        }
      `;

      await page.addStyleTag({ content: highlightCSS });

      // Highlight elements based on issues
      const highlights = [];
      for (const issue of issues) {
        if (issue.selector) {
          try {
            const elements = await page.$$(issue.selector);
            for (let i = 0; i < elements.length; i++) {
              const element = elements[i];
              const boundingBox = await element.boundingBox();

              if (boundingBox) {
                // Add highlight class and data attribute
                await page.evaluate(
                  (el, issueText) => {
                    el.classList.add('accessibility-issue-highlight');
                    el.setAttribute('data-issue-text', issueText);
                  },
                  element,
                  issue.title || issue.description || 'Issue'
                );

                highlights.push({
                  selector: issue.selector,
                  boundingBox,
                  issue: issue.title || issue.description || 'Issue',
                });
              }
            }
          } catch (selectorError) {
            console.warn(
              `Could not highlight selector ${issue.selector}:`,
              selectorError.message
            );
          }
        }
      }

      // Wait a moment for highlights to render
      await page.waitForTimeout(500);

      // Take screenshot
      const screenshotBuffer = await page.screenshot({
        type: options.format || 'png',
        fullPage: options.fullPage || false,
        quality: options.quality || 90,
      });

      return {
        success: true,
        screenshot: `data:image/${
          options.format || 'png'
        };base64,${screenshotBuffer.toString('base64')}`,
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
      console.error('Screenshot with highlights failed:', error);
      return {
        success: false,
        error: error.message,
      };
    } finally {
      await page.close();
    }
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

      // For "after" screenshot, we would need to apply fixes
      // This is a simplified version - in reality, you'd need to:
      // 1. Apply the fixes to a test version of the site
      // 2. Or simulate the fixes with JavaScript injection

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

        await page.waitForTimeout(1000);

        const afterBuffer = await page.screenshot({
          type: options.format || 'png',
          fullPage: options.fullPage || false,
          quality: options.quality || 90,
        });

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
      console.error('Before/after comparison failed:', error);
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
    }
  }
}

export default new ScreenshotService();
