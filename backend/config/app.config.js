/**
 * Application Configuration
 * Server and application-level settings
 */

export const appConfig = {
  // Server Configuration
  server: {
    port: process.env.PORT || 3001,
    env: process.env.NODE_ENV || 'development',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5176',
  },

  // Request Configuration
  request: {
    sizeLimit: '10mb',
    timeout: 60000, // 60 seconds
  },

  // CORS Configuration
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5176',
    credentials: true,
  },

  // Analysis Configuration
  analysis: {
    maxPages: parseInt(process.env.MAX_PAGES_TO_SCAN) || 10,
    timeout: 60000, // 60 seconds
    lighthouseTimeout: 90000, // 90 seconds
  },

  // Puppeteer Configuration
  puppeteer: {
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
    waitUntil: 'networkidle0',
    defaultTimeout: 30000,
  },

  // GitHub Configuration
  github: {
    apiBaseUrl: 'https://api.github.com',
    minTokenLength: 10,
  },
};

export default appConfig;
