import puppeteer from 'puppeteer';
import logger from '../utils/logger.js';

const BROWSERCAT_WS = 'wss://api.browsercat.com/connect';
const BROWSERCAT_API_KEY = process.env.BROWSERCAT_API_KEY;

/**
 * Centralized Browser Service
 * Provides a Puppeteer browser instance from:
 *  - BrowserCat (remote cloud) when BROWSERCAT_API_KEY is set
 *  - Local Puppeteer (bundled Chrome) otherwise
 *
 * All other services should call `getBrowser()` instead of `puppeteer.launch()`.
 */

/**
 * Get a browser instance. Caller is responsible for calling browser.close() when done.
 * @returns {Promise<import('puppeteer').Browser>}
 */
export async function getBrowser() {
  if (BROWSERCAT_API_KEY) {
    logger.info('Connecting to BrowserCat remote browser');
    try {
      const browser = await puppeteer.connect({
        browserWSEndpoint: BROWSERCAT_WS,
        headers: {
          'Api-Key': BROWSERCAT_API_KEY,
        },
      });
      logger.success('Connected to BrowserCat');
      return browser;
    } catch (err) {
      logger.error('BrowserCat connection failed', err);
      throw new Error(`BrowserCat Error: ${err.message}. Check your API key and credits.`);
    }
  }

  // Local launch (dev / non-BrowserCat environments)
  logger.info('Launching local Puppeteer browser');
  const launchOptions = {
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--disable-gpu',
      '--window-size=1920x1080',
    ],
  };

  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    launchOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
  }

  return puppeteer.launch(launchOptions);
}

/**
 * Get browser launch config for services that need to pass config directly
 * (e.g. pa11y chromeLaunchConfig). This always returns local config since
 * pa11y cannot use remote browsers.
 * @returns {Object}
 */
export function getLocalBrowserConfig() {
  const config = {
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
    ],
  };
  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    config.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
  }
  return config;
}
