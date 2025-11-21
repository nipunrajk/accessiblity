import puppeteer from 'puppeteer';
import logger from '../../utils/logger.js';
import { createExternalAPIError } from '../../utils/errorHandler.js';

/**
 * Keyboard Navigation Service
 * Tests keyboard accessibility compliance
 * WCAG Criteria: 2.1.1, 2.1.2, 2.4.3, 2.4.7, 3.2.1
 */
class KeyboardService {
  constructor() {
    this.browserConfig = {
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--window-size=1920x1080',
      ],
    };
  }

  /**
   * Analyze keyboard accessibility of a page
   * @param {string} url - URL to analyze
   * @param {Object} options - Analysis options
   * @returns {Promise<Object>} Keyboard accessibility results
   */
  async analyzePage(url, options = {}) {
    const browser = await puppeteer.launch(this.browserConfig);
    const page = await browser.newPage();

    try {
      logger.info('Starting keyboard accessibility analysis', { url });

      await page.setViewport({ width: 1920, height: 1080 });
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Run all keyboard tests
      const [
        interactiveElements,
        tabOrder,
        focusIndicators,
        keyboardTraps,
        skipLinks,
        focusManagement,
      ] = await Promise.all([
        this.testInteractiveElements(page),
        this.testTabOrder(page),
        this.testFocusIndicators(page),
        this.detectKeyboardTraps(page),
        this.testSkipLinks(page),
        this.testFocusManagement(page),
      ]);

      const results = {
        url,
        timestamp: new Date().toISOString(),
        summary: this.generateSummary([
          interactiveElements,
          tabOrder,
          focusIndicators,
          keyboardTraps,
          skipLinks,
          focusManagement,
        ]),
        interactiveElements,
        tabOrder,
        focusIndicators,
        keyboardTraps,
        skipLinks,
        focusManagement,
        score: this.calculateScore([
          interactiveElements,
          tabOrder,
          focusIndicators,
          keyboardTraps,
          skipLinks,
          focusManagement,
        ]),
      };

      logger.success('Keyboard accessibility analysis completed', {
        url,
        totalIssues: results.summary.totalIssues,
        score: results.score.score,
      });

      return results;
    } catch (error) {
      logger.error('Keyboard accessibility analysis failed', error, { url });
      throw createExternalAPIError('KeyboardService', error);
    } finally {
      await browser.close();
    }
  }

  /**
   * Test interactive elements for keyboard accessibility
   * WCAG 2.1.1 - Keyboard Accessible
   */
  async testInteractiveElements(page) {
    const results = await page.evaluate(() => {
      const issues = [];
      const interactiveSelectors = [
        'a[href]',
        'button',
        'input:not([type="hidden"])',
        'select',
        'textarea',
        '[tabindex]',
        '[role="button"]',
        '[role="link"]',
        '[role="menuitem"]',
        '[role="tab"]',
        '[role="checkbox"]',
        '[role="radio"]',
        '[role="switch"]',
        '[onclick]',
        // Common fake button patterns
        'div[class*="button" i]',
        'div[class*="btn" i]',
        'span[class*="button" i]',
        'span[class*="btn" i]',
      ];

      const elements = document.querySelectorAll(
        interactiveSelectors.join(',')
      );
      let accessible = 0;
      let inaccessible = 0;
      let fakeButtons = 0;

      elements.forEach((element) => {
        const tagName = element.tagName.toLowerCase();
        const role = element.getAttribute('role');
        const tabindex = element.getAttribute('tabindex');
        const className = element.className || '';
        const hasOnClick = element.hasAttribute('onclick') || element.onclick;

        // Check for event listeners (more comprehensive)
        const hasClickListener =
          element.onclick !== null ||
          element.hasAttribute('onclick') ||
          className.toLowerCase().includes('button') ||
          className.toLowerCase().includes('btn') ||
          className.toLowerCase().includes('clickable');

        const isVisible =
          element.offsetParent !== null &&
          window.getComputedStyle(element).visibility !== 'hidden' &&
          window.getComputedStyle(element).display !== 'none';

        if (!isVisible) return;

        // Get element text for better identification
        const text = element.textContent?.trim().substring(0, 50) || '';

        // Check computed styles for cursor pointer (indicates clickable)
        const style = window.getComputedStyle(element);
        const hasCursorPointer = style.cursor === 'pointer';

        // Check if element is keyboard accessible
        const isFocusable =
          tabindex !== '-1' &&
          (element.tabIndex >= 0 ||
            ['a', 'button', 'input', 'select', 'textarea'].includes(tagName));

        const selector = element.id
          ? `#${element.id}`
          : `${tagName}${
              element.className
                ? '.' + element.className.split(' ').join('.')
                : ''
            }`;

        // ENHANCED: Detect fake buttons (div/span with button role, onclick, or button-like styling)
        const isFakeButton =
          ['div', 'span', 'p', 'img', 'i', 'svg'].includes(tagName) &&
          (role === 'button' ||
            role === 'link' ||
            hasOnClick ||
            hasClickListener ||
            hasCursorPointer ||
            className.toLowerCase().includes('button') ||
            className.toLowerCase().includes('btn'));

        if (isFakeButton && !isFocusable) {
          fakeButtons++;
          inaccessible++;
          const reason = role
            ? `role="${role}"`
            : hasOnClick
            ? 'onclick handler'
            : hasCursorPointer
            ? 'cursor:pointer style'
            : hasClickListener
            ? 'button-like class name'
            : 'interactive appearance';
          issues.push({
            type: 'fake-button',
            severity: 'critical',
            wcag: '2.1.1',
            element: tagName,
            role: role || 'none',
            selector,
            text,
            className: className.substring(0, 50),
            message: `Fake button (${tagName}) is not keyboard accessible`,
            recommendation: `Use <button> element or add tabindex="0" and keyboard event handlers`,
            details: `Element has ${reason} but cannot be focused with keyboard`,
          });
        } else if (!isFocusable && hasOnClick) {
          inaccessible++;
          issues.push({
            type: 'not-focusable-clickable',
            severity: 'critical',
            wcag: '2.1.1',
            element: tagName,
            role: role || 'none',
            selector,
            text,
            message: `Interactive element with click handler is not keyboard accessible`,
            recommendation: `Add tabindex="0" and onkeydown/onkeypress handlers, or use native focusable element`,
          });
        } else if (!isFocusable) {
          inaccessible++;
          issues.push({
            type: 'not-focusable',
            severity: 'critical',
            wcag: '2.1.1',
            element: tagName,
            role: role || 'none',
            selector,
            text,
            message: `Interactive element is not keyboard accessible`,
            recommendation: `Add tabindex="0" or use native focusable element`,
          });
        } else if (parseInt(tabindex) > 0) {
          accessible++;
          issues.push({
            type: 'positive-tabindex',
            severity: 'moderate',
            wcag: '2.4.3',
            element: tagName,
            tabindex: parseInt(tabindex),
            selector,
            text,
            message: `Positive tabindex disrupts natural tab order`,
            recommendation: `Remove positive tabindex, use tabindex="0" or reorder DOM`,
          });
        } else if (isFakeButton && role === 'button') {
          // Fake button that IS focusable but should still be flagged
          accessible++;
          issues.push({
            type: 'fake-button-accessible',
            severity: 'moderate',
            wcag: 'best-practice',
            element: tagName,
            role,
            selector,
            text,
            message: `Using ${tagName} as button instead of <button> element`,
            recommendation: `Replace with semantic <button> element for better accessibility`,
          });
        } else {
          accessible++;
        }
      });

      return {
        total: elements.length,
        accessible,
        inaccessible,
        fakeButtons,
        issues,
        passed: inaccessible === 0,
      };
    });

    return results;
  }

  /**
   * Test tab order and focus flow
   * WCAG 2.4.3 - Focus Order
   */
  async testTabOrder(page) {
    const tabOrder = await page.evaluate(() => {
      const order = [];
      const issues = [];
      let previousPosition = { x: 0, y: 0 };
      let logicalOrder = true;

      // Get all focusable elements
      const focusableElements = Array.from(
        document.querySelectorAll(
          'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => {
        const style = window.getComputedStyle(el);
        return (
          el.offsetParent !== null &&
          style.visibility !== 'hidden' &&
          style.display !== 'none'
        );
      });

      focusableElements.forEach((element, index) => {
        const rect = element.getBoundingClientRect();
        const position = { x: rect.left, y: rect.top };
        const tabindex = element.getAttribute('tabindex');

        // Check if focus order matches visual order (roughly)
        if (index > 0) {
          // If element is significantly above previous element, order might be wrong
          if (position.y < previousPosition.y - 50) {
            logicalOrder = false;
            issues.push({
              type: 'illogical-order',
              severity: 'serious',
              wcag: '2.4.3',
              element: element.tagName.toLowerCase(),
              message: `Focus order doesn't match visual order`,
              recommendation: `Reorder DOM elements to match visual layout`,
            });
          }
        }

        order.push({
          index,
          element: element.tagName.toLowerCase(),
          tabindex: tabindex || '0',
          position,
          text: element.textContent?.trim().substring(0, 30) || '',
        });

        previousPosition = position;
      });

      return {
        order,
        totalFocusable: focusableElements.length,
        logicalOrder,
        issues,
        passed: logicalOrder && issues.length === 0,
      };
    });

    return tabOrder;
  }

  /**
   * Test focus indicators visibility
   * WCAG 2.4.7 - Focus Visible
   */
  async testFocusIndicators(page) {
    const results = await page.evaluate(() => {
      const issues = [];
      const focusableElements = document.querySelectorAll(
        'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      let withIndicator = 0;
      let withoutIndicator = 0;

      focusableElements.forEach((element) => {
        const isVisible =
          element.offsetParent !== null &&
          window.getComputedStyle(element).visibility !== 'hidden';

        if (!isVisible) return;

        const style = window.getComputedStyle(element);
        const focusStyle = window.getComputedStyle(element, ':focus');

        // Check for focus indicator
        const hasOutline =
          style.outline !== 'none' &&
          style.outline !== '0px' &&
          style.outline !== '';
        const hasBoxShadow = style.boxShadow !== 'none';
        const hasBorder = style.border !== 'none';
        const hasBackground = style.backgroundColor !== 'transparent';

        // Check if focus style is different from normal style
        const hasFocusIndicator =
          hasOutline ||
          hasBoxShadow ||
          (hasBorder && style.borderWidth !== '0px') ||
          hasBackground;

        const selector = element.id
          ? `#${element.id}`
          : `${element.tagName.toLowerCase()}${
              element.className
                ? '.' + element.className.split(' ').join('.')
                : ''
            }`;

        if (!hasFocusIndicator || style.outline === 'none') {
          withoutIndicator++;
          issues.push({
            type: 'no-focus-indicator',
            severity: 'serious',
            wcag: '2.4.7',
            element: element.tagName.toLowerCase(),
            selector,
            message: `Element has no visible focus indicator`,
            recommendation: `Add :focus styles with visible outline or border`,
            currentStyle: {
              outline: style.outline,
              boxShadow: style.boxShadow,
              border: style.border,
            },
          });
        } else {
          withIndicator++;
        }
      });

      return {
        total: focusableElements.length,
        withIndicator,
        withoutIndicator,
        issues,
        passed: withoutIndicator === 0,
      };
    });

    return results;
  }

  /**
   * Detect keyboard traps
   * WCAG 2.1.2 - No Keyboard Trap
   */
  async detectKeyboardTraps(page) {
    const results = await page.evaluate(() => {
      const issues = [];
      const traps = [];

      // Check for elements with keyboard event handlers that might trap focus
      const elementsWithHandlers = document.querySelectorAll(
        '[onkeydown], [onkeyup], [onkeypress]'
      );

      elementsWithHandlers.forEach((element) => {
        const hasEscapeHandler =
          element.onkeydown?.toString().includes('Escape') ||
          element.onkeyup?.toString().includes('Escape') ||
          element.getAttribute('onkeydown')?.includes('27') ||
          element.getAttribute('onkeydown')?.includes('Escape');

        if (!hasEscapeHandler) {
          issues.push({
            type: 'potential-trap',
            severity: 'serious',
            wcag: '2.1.2',
            element: element.tagName.toLowerCase(),
            message: `Element has keyboard handlers but no escape mechanism`,
            recommendation: `Ensure users can exit with Escape key or provide clear instructions`,
          });
        }
      });

      // Check for modals/dialogs
      const modals = document.querySelectorAll(
        '[role="dialog"], [role="alertdialog"], .modal, .dialog'
      );

      modals.forEach((modal) => {
        const isVisible = modal.offsetParent !== null;
        if (!isVisible) return;

        const hasCloseButton = modal.querySelector(
          'button[aria-label*="close" i], button[aria-label*="dismiss" i], .close'
        );

        if (!hasCloseButton) {
          traps.push({
            type: 'modal-trap',
            severity: 'critical',
            wcag: '2.1.2',
            element: 'modal',
            message: `Modal/dialog may trap keyboard focus`,
            recommendation: `Add close button and Escape key handler`,
          });
        }
      });

      return {
        potentialTraps: issues.length + traps.length,
        issues: [...issues, ...traps],
        passed: issues.length === 0 && traps.length === 0,
      };
    });

    return results;
  }

  /**
   * Test skip links
   * WCAG 2.4.1 - Bypass Blocks
   */
  async testSkipLinks(page) {
    const results = await page.evaluate(() => {
      const issues = [];

      // Look for skip links
      const skipLinks = Array.from(
        document.querySelectorAll('a[href^="#"]')
      ).filter((link) => {
        const text = link.textContent.toLowerCase();
        return (
          text.includes('skip') ||
          text.includes('jump') ||
          text.includes('main content')
        );
      });

      const hasSkipLink = skipLinks.length > 0;

      if (!hasSkipLink) {
        issues.push({
          type: 'missing-skip-link',
          severity: 'moderate',
          wcag: '2.4.1',
          message: `No skip link found to bypass navigation`,
          recommendation: `Add a "Skip to main content" link at the top of the page`,
        });
      } else {
        // Verify skip links work
        skipLinks.forEach((link) => {
          const targetId = link.getAttribute('href').substring(1);
          const target = document.getElementById(targetId);

          if (!target) {
            issues.push({
              type: 'broken-skip-link',
              severity: 'serious',
              wcag: '2.4.1',
              message: `Skip link target "${targetId}" not found`,
              recommendation: `Ensure skip link points to valid element ID`,
            });
          }
        });
      }

      return {
        hasSkipLink,
        skipLinkCount: skipLinks.length,
        issues,
        passed: hasSkipLink && issues.length === 0,
      };
    });

    return results;
  }

  /**
   * Test focus management (modals, dynamic content)
   * WCAG 3.2.1 - On Focus
   */
  async testFocusManagement(page) {
    const results = await page.evaluate(() => {
      const issues = [];

      // Check for elements that might trigger unexpected changes on focus
      const elementsWithFocusHandlers = document.querySelectorAll('[onfocus]');

      elementsWithFocusHandlers.forEach((element) => {
        const handler = element.getAttribute('onfocus');

        // Check for potentially problematic actions
        if (
          handler.includes('submit') ||
          handler.includes('location') ||
          handler.includes('window.open')
        ) {
          issues.push({
            type: 'unexpected-focus-change',
            severity: 'serious',
            wcag: '3.2.1',
            element: element.tagName.toLowerCase(),
            message: `Element triggers unexpected change on focus`,
            recommendation: `Move action to click/submit event instead of focus`,
          });
        }
      });

      // Check for auto-focus on page load
      const autoFocusElements = document.querySelectorAll('[autofocus]');
      if (autoFocusElements.length > 1) {
        issues.push({
          type: 'multiple-autofocus',
          severity: 'moderate',
          wcag: '3.2.1',
          message: `Multiple elements have autofocus attribute`,
          recommendation: `Use only one autofocus per page`,
        });
      }

      return {
        focusHandlers: elementsWithFocusHandlers.length,
        autoFocusElements: autoFocusElements.length,
        issues,
        passed: issues.length === 0,
      };
    });

    return results;
  }

  /**
   * Generate summary of all tests
   * @private
   */
  generateSummary(testResults) {
    const allIssues = testResults.flatMap((result) => result.issues || []);

    return {
      totalIssues: allIssues.length,
      critical: allIssues.filter((i) => i.severity === 'critical').length,
      serious: allIssues.filter((i) => i.severity === 'serious').length,
      moderate: allIssues.filter((i) => i.severity === 'moderate').length,
      testsPassed: testResults.filter((r) => r.passed).length,
      testsFailed: testResults.filter((r) => !r.passed).length,
      totalTests: testResults.length,
    };
  }

  /**
   * Calculate keyboard accessibility score
   * @private
   */
  calculateScore(testResults) {
    const allIssues = testResults.flatMap((result) => result.issues || []);

    // Weight by severity
    const criticalWeight =
      allIssues.filter((i) => i.severity === 'critical').length * 15;
    const seriousWeight =
      allIssues.filter((i) => i.severity === 'serious').length * 10;
    const moderateWeight =
      allIssues.filter((i) => i.severity === 'moderate').length * 5;

    const totalWeight = criticalWeight + seriousWeight + moderateWeight;
    const maxWeight = 100;

    const score = Math.max(
      0,
      Math.round(100 - (totalWeight / maxWeight) * 100)
    );

    return {
      score,
      grade: this.getGrade(score),
      critical: allIssues.filter((i) => i.severity === 'critical').length,
      serious: allIssues.filter((i) => i.severity === 'serious').length,
      moderate: allIssues.filter((i) => i.severity === 'moderate').length,
      testsPassed: testResults.filter((r) => r.passed).length,
      testsFailed: testResults.filter((r) => !r.passed).length,
    };
  }

  /**
   * Get letter grade from score
   * @private
   */
  getGrade(score) {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }
}

export default new KeyboardService();
