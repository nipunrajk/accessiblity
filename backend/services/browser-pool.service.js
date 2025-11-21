/**
 * Browser Pool Service
 * Manages a pool of Puppeteer browser instances for efficient resource usage
 * Provides automatic cleanup and resource management
 */

import puppeteer from 'puppeteer';
import logger from '../utils/logger.js';

class BrowserPoolService {
  constructor(config = {}) {
    this.maxBrowsers = config.maxBrowsers || 3;
    this.browserIdleTimeout = config.browserIdleTimeout || 60000; // 1 minute
    this.pool = [];
    this.inUse = new Set();
    this.lastUsed = new Map();
    this.cleanupInterval = null;

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
      ...config.browserConfig,
    };

    // Start cleanup interval
    this.startCleanupInterval();

    // Register cleanup handlers
    this.registerCleanupHandlers();
  }

  /**
   * Get a browser instance from the pool
   * Creates a new one if pool is empty and under max limit
   * @returns {Promise<Object>} Browser instance
   */
  async getBrowser() {
    // Try to get an available browser from pool
    for (const browser of this.pool) {
      if (!this.inUse.has(browser)) {
        try {
          // Check if browser is still connected
          if (browser.isConnected()) {
            this.inUse.add(browser);
            this.lastUsed.set(browser, Date.now());
            logger.debug('Reusing browser from pool', {
              poolSize: this.pool.length,
              inUse: this.inUse.size,
            });
            return browser;
          } else {
            // Remove disconnected browser
            await this.removeBrowser(browser);
          }
        } catch (error) {
          logger.warn('Browser in pool is not usable', error);
          await this.removeBrowser(browser);
        }
      }
    }

    // Create new browser if under limit
    if (this.pool.length < this.maxBrowsers) {
      const browser = await this.createBrowser();
      this.pool.push(browser);
      this.inUse.add(browser);
      this.lastUsed.set(browser, Date.now());

      logger.info('Created new browser instance', {
        poolSize: this.pool.length,
        inUse: this.inUse.size,
      });

      return browser;
    }

    // Wait for a browser to become available
    logger.debug('Waiting for available browser', {
      poolSize: this.pool.length,
      inUse: this.inUse.size,
    });

    return new Promise((resolve) => {
      const checkInterval = setInterval(async () => {
        for (const browser of this.pool) {
          if (!this.inUse.has(browser) && browser.isConnected()) {
            clearInterval(checkInterval);
            this.inUse.add(browser);
            this.lastUsed.set(browser, Date.now());
            resolve(browser);
            return;
          }
        }
      }, 100);
    });
  }

  /**
   * Release a browser back to the pool
   * @param {Object} browser - Browser instance to release
   */
  async releaseBrowser(browser) {
    if (this.inUse.has(browser)) {
      this.inUse.delete(browser);
      this.lastUsed.set(browser, Date.now());

      logger.debug('Released browser to pool', {
        poolSize: this.pool.length,
        inUse: this.inUse.size,
      });

      // Close all pages except one to free memory
      try {
        const pages = await browser.pages();
        for (let i = 1; i < pages.length; i++) {
          await pages[i].close();
        }
      } catch (error) {
        logger.warn('Failed to close browser pages', error);
      }
    }
  }

  /**
   * Create a new browser instance
   * @private
   * @returns {Promise<Object>} Browser instance
   */
  async createBrowser() {
    try {
      const browser = await puppeteer.launch(this.browserConfig);

      // Handle browser disconnection
      browser.on('disconnected', () => {
        logger.warn('Browser disconnected unexpectedly');
        this.removeBrowser(browser);
      });

      return browser;
    } catch (error) {
      logger.error('Failed to create browser', error);
      throw error;
    }
  }

  /**
   * Remove a browser from the pool
   * @private
   * @param {Object} browser - Browser to remove
   */
  async removeBrowser(browser) {
    try {
      if (browser.isConnected()) {
        await browser.close();
      }
    } catch (error) {
      logger.warn('Error closing browser', error);
    }

    const index = this.pool.indexOf(browser);
    if (index > -1) {
      this.pool.splice(index, 1);
    }
    this.inUse.delete(browser);
    this.lastUsed.delete(browser);

    logger.debug('Removed browser from pool', {
      poolSize: this.pool.length,
      inUse: this.inUse.size,
    });
  }

  /**
   * Start cleanup interval to close idle browsers
   * @private
   */
  startCleanupInterval() {
    this.cleanupInterval = setInterval(async () => {
      const now = Date.now();

      for (const browser of this.pool) {
        if (!this.inUse.has(browser)) {
          const lastUsedTime = this.lastUsed.get(browser) || 0;
          const idleTime = now - lastUsedTime;

          if (idleTime > this.browserIdleTimeout) {
            logger.info('Closing idle browser', {
              idleTime: Math.round(idleTime / 1000) + 's',
            });
            await this.removeBrowser(browser);
          }
        }
      }
    }, 30000); // Check every 30 seconds
  }

  /**
   * Register cleanup handlers for process termination
   * @private
   */
  registerCleanupHandlers() {
    const cleanup = async () => {
      logger.info('Cleaning up browser pool...');
      await this.closeAll();
      process.exit(0);
    };

    // Handle various termination signals
    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
    process.on('SIGHUP', cleanup);

    // Handle uncaught exceptions
    process.on('uncaughtException', async (error) => {
      logger.error('Uncaught exception, cleaning up browsers', error);
      await this.closeAll();
      process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', async (reason, promise) => {
      logger.error('Unhandled rejection, cleaning up browsers', {
        reason,
        promise,
      });
      await this.closeAll();
      process.exit(1);
    });
  }

  /**
   * Close all browsers in the pool
   */
  async closeAll() {
    logger.info('Closing all browsers in pool', {
      total: this.pool.length,
    });

    // Clear cleanup interval
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    // Close all browsers
    const closePromises = this.pool.map(async (browser) => {
      try {
        if (browser.isConnected()) {
          await browser.close();
        }
      } catch (error) {
        logger.warn('Error closing browser during cleanup', error);
      }
    });

    await Promise.all(closePromises);

    this.pool = [];
    this.inUse.clear();
    this.lastUsed.clear();

    logger.success('All browsers closed');
  }

  /**
   * Get pool statistics
   * @returns {Object} Pool statistics
   */
  getStats() {
    return {
      total: this.pool.length,
      inUse: this.inUse.size,
      available: this.pool.length - this.inUse.size,
      maxBrowsers: this.maxBrowsers,
      idleTimeout: this.browserIdleTimeout,
    };
  }

  /**
   * Execute a function with a browser from the pool
   * Automatically acquires and releases the browser
   *
   * @param {Function} fn - Function to execute with browser
   * @returns {Promise<any>} Result of the function
   *
   * @example
   * const result = await browserPool.withBrowser(async (browser) => {
   *   const page = await browser.newPage();
   *   await page.goto('https://example.com');
   *   return await page.title();
   * });
   */
  async withBrowser(fn) {
    const browser = await this.getBrowser();
    try {
      return await fn(browser);
    } finally {
      await this.releaseBrowser(browser);
    }
  }
}

// Export singleton instance
export default new BrowserPoolService({
  maxBrowsers: 3,
  browserIdleTimeout: 60000,
});
