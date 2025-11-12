import { createScreenshotError, handleError } from '../utils/errorHandler';
import logger from '../utils/logger';

// Screenshot service for capturing and highlighting issues
export class ScreenshotService {
  constructor() {
    this.baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  }

  /**
   * Capture a screenshot of the website with issue highlights
   * @param {string} url - Website URL to capture
   * @param {Array} issues - Array of issues with selectors
   * @param {Object} options - Screenshot options
   */
  async captureWithHighlights(url, issues = [], options = {}) {
    try {
      const response = await fetch(`${this.baseUrl}/api/screenshot/highlight`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          issues,
          options: {
            width: options.width || 1200,
            height: options.height || 800,
            fullPage: options.fullPage || false,
            format: 'png',
            quality: 90,
            ...options,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Screenshot capture failed: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        return {
          success: true,
          screenshot: data.screenshot, // Base64 encoded image
          highlights: data.highlights, // Array of highlighted elements
          metadata: data.metadata,
        };
      } else {
        throw new Error(data.error || 'Screenshot capture failed');
      }
    } catch (error) {
      const screenshotError = createScreenshotError(
        'Screenshot capture failed',
        error,
        { url, issueCount: issues.length }
      );
      logger.warn('Screenshot unavailable, using placeholder', {
        error: error.message,
        url,
      });
      // Fallback to mock screenshot if real capture fails
      return this.createMockScreenshot(issues[0]?.type || 'accessibility');
    }
  }

  /**
   * Generate before/after comparison screenshots
   * @param {string} url - Website URL
   * @param {Array} fixes - Array of applied fixes
   */
  async generateComparison(url, fixes = []) {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/screenshot/comparison`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url,
            fixes,
            options: {
              width: 1200,
              height: 800,
              fullPage: true,
              format: 'png',
              quality: 90,
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Comparison generation failed: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        return {
          success: true,
          before: data.before,
          after: data.after,
          metadata: data.metadata,
        };
      } else {
        throw new Error(data.error || 'Comparison generation failed');
      }
    } catch (error) {
      const comparisonError = createScreenshotError(
        'Comparison generation failed',
        error,
        { url, fixCount: fixes.length }
      );
      logger.warn('Comparison unavailable, using placeholder', {
        error: error.message,
        url,
      });
      // Fallback to mock comparison if real capture fails
      return {
        success: true,
        before: null, // Will use mock data in component
        after: null,
      };
    }
  }

  /**
   * Create a mock screenshot for development/demo purposes
   * @param {string} issueType - Type of issue (accessibility, performance, etc.)
   */
  createMockScreenshot(issueType) {
    // Create more realistic mock screenshots that look like actual websites
    const createWebsiteMockup = (bgColor, headerColor, issueArea) => {
      const svg = `
        <svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
          <!-- Website mockup background -->
          <rect width="800" height="600" fill="${bgColor}"/>
          
          <!-- Header -->
          <rect x="0" y="0" width="800" height="80" fill="#f8fafc"/>
          <rect x="40" y="20" width="120" height="40" rx="4" fill="${headerColor}"/>
          <text x="100" y="45" text-anchor="middle" font-family="Arial" font-size="14" fill="white">Logo</text>
          
          <!-- Navigation -->
          <text x="200" y="45" font-family="Arial" font-size="14" fill="#374151">Home</text>
          <text x="260" y="45" font-family="Arial" font-size="14" fill="#374151">About</text>
          <text x="320" y="45" font-family="Arial" font-size="14" fill="#374151">Services</text>
          <text x="390" y="45" font-family="Arial" font-size="14" fill="#374151">Contact</text>
          
          ${issueArea}
          
          <!-- Footer -->
          <rect x="0" y="520" width="800" height="80" fill="#374151"/>
          <text x="400" y="565" text-anchor="middle" font-family="Arial" font-size="12" fill="#9ca3af">© 2024 Company Name</text>
        </svg>
      `;
      return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    };

    const mockScreenshots = {
      accessibility: {
        screenshot: createWebsiteMockup(
          '#ffffff',
          '#3b82f6',
          `
          <!-- Hero Section with missing alt text -->
          <rect x="40" y="120" width="720" height="300" rx="8" fill="#e5e7eb"/>
          <rect x="60" y="140" width="200" height="150" rx="4" fill="#d1d5db"/>
          <text x="160" y="220" text-anchor="middle" font-family="Arial" font-size="12" fill="#6b7280">Image without alt text</text>
          
          <!-- Content -->
          <rect x="280" y="140" width="460" height="20" rx="2" fill="#374151"/>
          <rect x="280" y="180" width="400" height="12" rx="2" fill="#6b7280"/>
          <rect x="280" y="200" width="380" height="12" rx="2" fill="#6b7280"/>
          <rect x="280" y="220" width="420" height="12" rx="2" fill="#6b7280"/>
        `
        ),
        highlights: [
          { x: 60, y: 140, width: 200, height: 150, issue: 'Missing alt text' },
        ],
      },
      performance: {
        screenshot: createWebsiteMockup(
          '#ffffff',
          '#ef4444',
          `
          <!-- Large Hero Image (performance issue) -->
          <rect x="0" y="80" width="800" height="400" fill="#fef2f2"/>
          <rect x="50" y="130" width="700" height="300" rx="8" fill="#fee2e2"/>
          <text x="400" y="270" text-anchor="middle" font-family="Arial" font-size="18" fill="#dc2626">Large Unoptimized Image</text>
          <text x="400" y="295" text-anchor="middle" font-family="Arial" font-size="14" fill="#991b1b">5.2MB • Blocking render</text>
          <text x="400" y="315" text-anchor="middle" font-family="Arial" font-size="12" fill="#7f1d1d">Consider optimizing or lazy loading</text>
          
          <!-- Content below -->
          <rect x="40" y="500" width="720" height="80" fill="#f9fafb"/>
          <rect x="60" y="520" width="300" height="16" rx="2" fill="#374151"/>
          <rect x="60" y="545" width="250" height="12" rx="2" fill="#6b7280"/>
        `
        ),
        highlights: [
          {
            x: 50,
            y: 130,
            width: 700,
            height: 300,
            issue: 'Large image blocking render',
          },
        ],
      },
      seo: {
        screenshot: createWebsiteMockup(
          '#ffffff',
          '#f59e0b',
          `
          <!-- Missing H1 issue -->
          <rect x="40" y="120" width="720" height="60" fill="#fef3c7"/>
          <text x="60" y="145" font-family="Arial" font-size="18" fill="#92400e">Welcome to Our Website</text>
          <text x="60" y="165" font-family="Arial" font-size="12" fill="#b45309">(This should be an H1 tag for SEO)</text>
          
          <!-- Content -->
          <rect x="40" y="200" width="720" height="300" fill="#f9fafb"/>
          <rect x="60" y="220" width="400" height="16" rx="2" fill="#374151"/>
          <rect x="60" y="250" width="680" height="12" rx="2" fill="#6b7280"/>
          <rect x="60" y="270" width="650" height="12" rx="2" fill="#6b7280"/>
          <rect x="60" y="290" width="600" height="12" rx="2" fill="#6b7280"/>
        `
        ),
        highlights: [
          { x: 40, y: 120, width: 720, height: 60, issue: 'Missing H1 tag' },
        ],
      },
    };

    return {
      success: true,
      ...(mockScreenshots[issueType] || mockScreenshots.accessibility),
    };
  }
}

export const screenshotService = new ScreenshotService();
