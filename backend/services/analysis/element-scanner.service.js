import puppeteer from 'puppeteer';
import logger from '../../utils/logger.js';
import { PUPPETEER } from '../../constants/index.js';
import { createInternalError } from '../../utils/errorHandler.js';

/**
 * Element Scanner Service
 * Scans and extracts DOM elements from web pages
 * Provides detailed element information for analysis
 */
class ElementScannerService {
  constructor() {
    this.browserConfig = {
      headless: PUPPETEER.HEADLESS,
      args: PUPPETEER.ARGS,
    };
  }

  /**
   * Scan all elements on a page
   * @param {string} url - URL to scan
   * @returns {Promise<Array>} Array of element information
   */
  async scanElements(url) {
    let browser = null;
    let page = null;

    try {
      logger.info('Starting element scanning', { url });

      // Launch browser
      browser = await puppeteer.launch(this.browserConfig);
      page = await browser.newPage();

      // Navigate to page
      await page.goto(url, { waitUntil: PUPPETEER.WAIT_UNTIL });

      // Extract elements
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

      logger.success('Element scanning completed', {
        url,
        elementCount: elements.length,
      });

      return elements;
    } catch (error) {
      logger.error('Element scanning failed', error, { url });
      throw createInternalError('Element scanning failed', error);
    } finally {
      // Ensure cleanup
      await this._cleanup(browser, page);
    }
  }

  /**
   * Scan specific elements matching a selector
   * @param {string} url - URL to scan
   * @param {string} selector - CSS selector to match
   * @returns {Promise<Array>} Array of matching elements
   */
  async scanElementsBySelector(url, selector) {
    let browser = null;
    let page = null;

    try {
      logger.info('Starting selective element scanning', { url, selector });

      browser = await puppeteer.launch(this.browserConfig);
      page = await browser.newPage();
      await page.goto(url, { waitUntil: PUPPETEER.WAIT_UNTIL });

      const elements = await page.evaluate((sel) => {
        const matchedElements = document.querySelectorAll(sel);
        return Array.from(matchedElements).map((node) => ({
          tag: node.tagName.toLowerCase(),
          id: node.id || null,
          classes: Array.from(node.classList || []),
          textContent: node.textContent?.trim() || null,
          attributes: Array.from(node.attributes || []).map((attr) => ({
            name: attr.name,
            value: attr.value,
          })),
          innerHTML: node.innerHTML,
          outerHTML: node.outerHTML,
        }));
      }, selector);

      logger.success('Selective element scanning completed', {
        url,
        selector,
        elementCount: elements.length,
      });

      return elements;
    } catch (error) {
      logger.error('Selective element scanning failed', error, {
        url,
        selector,
      });
      throw createInternalError('Selective element scanning failed', error);
    } finally {
      await this._cleanup(browser, page);
    }
  }

  /**
   * Scan elements by type (e.g., 'img', 'a', 'button')
   * @param {string} url - URL to scan
   * @param {string} elementType - Element type to scan
   * @returns {Promise<Array>} Array of elements of specified type
   */
  async scanElementsByType(url, elementType) {
    return this.scanElementsBySelector(url, elementType);
  }

  /**
   * Get element statistics
   * @param {string} url - URL to scan
   * @returns {Promise<Object>} Element statistics
   */
  async getElementStats(url) {
    const elements = await this.scanElements(url);

    const stats = {
      total: elements.length,
      byTag: {},
      withId: 0,
      withClasses: 0,
      interactive: 0,
      images: 0,
      links: 0,
      forms: 0,
    };

    elements.forEach((element) => {
      // Count by tag
      stats.byTag[element.tag] = (stats.byTag[element.tag] || 0) + 1;

      // Count elements with IDs
      if (element.id) stats.withId++;

      // Count elements with classes
      if (element.classes.length > 0) stats.withClasses++;

      // Count interactive elements
      if (
        ['button', 'a', 'input', 'select', 'textarea'].includes(element.tag)
      ) {
        stats.interactive++;
      }

      // Count specific types
      if (element.tag === 'img') stats.images++;
      if (element.tag === 'a') stats.links++;
      if (element.tag === 'form') stats.forms++;
    });

    logger.info('Element statistics calculated', { url, stats });

    return stats;
  }

  /**
   * Cleanup browser and page resources
   * @private
   */
  async _cleanup(browser, page) {
    try {
      if (page) {
        await page.close();
      }
      if (browser) {
        await browser.close();
      }
    } catch (error) {
      logger.warn('Error during cleanup', error);
    }
  }
}

export default new ElementScannerService();
