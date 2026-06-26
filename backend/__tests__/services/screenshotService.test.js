import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import puppeteer from 'puppeteer';
import { promises as fs } from 'fs';
import screenshotService from '../../services/screenshotService.js';

vi.mock('puppeteer');
vi.mock('fs', () => ({
  promises: {
    mkdir: vi.fn().mockResolvedValue(undefined),
    writeFile: vi.fn().mockResolvedValue(undefined),
    unlink: vi.fn().mockResolvedValue(undefined),
    readdir: vi.fn().mockResolvedValue([]),
    stat: vi.fn().mockResolvedValue({ birthtimeMs: Date.now() }),
  },
}));
vi.mock('../../utils/logger.js');

describe('ScreenshotService', () => {
  let mockBrowser;
  let mockPage;

  beforeEach(() => {
    vi.clearAllMocks();
    screenshotService.browser = null;

    mockPage = {
      setViewport: vi.fn().mockResolvedValue(undefined),
      goto: vi.fn().mockResolvedValue(undefined),
      screenshot: vi.fn().mockResolvedValue(Buffer.from('mock-screenshot-buffer')),
      evaluate: vi.fn().mockResolvedValue([]),
      addStyleTag: vi.fn().mockResolvedValue(undefined),
      close: vi.fn().mockResolvedValue(undefined),
    };

    mockBrowser = {
      newPage: vi.fn().mockResolvedValue(mockPage),
      close: vi.fn().mockResolvedValue(undefined),
    };

    puppeteer.launch = vi.fn().mockResolvedValue(mockBrowser);
  });

  afterEach(async () => {
    if (screenshotService.browser) {
      await screenshotService.closeBrowser();
    }
  });

  describe('initScreenshotsDir', () => {
    it('should create the screenshots directory', async () => {
      await screenshotService.initScreenshotsDir();
      expect(fs.mkdir).toHaveBeenCalledWith(
        expect.stringContaining('screenshots'),
        { recursive: true }
      );
    });
  });

  describe('initBrowser', () => {
    it('should launch a puppeteer browser if not already launched', async () => {
      const browser = await screenshotService.initBrowser();
      expect(puppeteer.launch).toHaveBeenCalled();
      expect(browser).toBe(mockBrowser);
    });

    it('should return existing browser instance on subsequent calls', async () => {
      await screenshotService.initBrowser();
      await screenshotService.initBrowser();
      expect(puppeteer.launch).toHaveBeenCalledTimes(1);
    });
  });

  describe('captureScreenshot', () => {
    it('should capture a basic screenshot of a URL', async () => {
      const url = 'https://example.com';
      const result = await screenshotService.captureScreenshot(url, {
        width: 1920,
        height: 1080,
      });

      expect(mockBrowser.newPage).toHaveBeenCalled();
      expect(mockPage.setViewport).toHaveBeenCalledWith(
        expect.objectContaining({ width: 1920, height: 1080 })
      );
      expect(mockPage.goto).toHaveBeenCalledWith(url, expect.any(Object));
      expect(mockPage.screenshot).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.screenshot).toContain('data:image/png;base64,');
    });

    it('should save screenshot to file when saveToFile is true', async () => {
      const url = 'https://example.com';
      await screenshotService.captureScreenshot(url, {
        saveToFile: true,
      });

      expect(fs.writeFile).toHaveBeenCalled();
    });
  });

  describe('captureWithHighlights', () => {
    it('should run custom styles injection to highlight element selectors', async () => {
      const url = 'https://example.com';
      const issues = [{ selector: '.error-element', title: 'Contrast issue' }];

      const result = await screenshotService.captureWithHighlights(url, issues);

      expect(mockPage.evaluate).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.screenshot).toContain('data:image/png;base64,');
    });
  });

  describe('generateBeforeAfterComparison', () => {
    it('should capture before and after screenshots', async () => {
      const url = 'https://example.com';
      const fixes = [{ type: 'css', selector: '.fixed-element', styles: 'color: green;' }];

      const result = await screenshotService.generateBeforeAfterComparison(
        url,
        fixes
      );

      expect(result.success).toBe(true);
      expect(result.before).toContain('data:image/png;base64,');
      expect(result.after).toContain('data:image/png;base64,');
    });
  });

  describe('captureIssueWiseScreenshots', () => {
    it('should capture separate screenshots for each issue', async () => {
      const url = 'https://example.com';
      const issues = [
        { id: '1', selector: '.issue1', title: 'Issue 1' },
        { id: '2', selector: '.issue2', title: 'Issue 2' },
      ];

      const result = await screenshotService.captureIssueWiseScreenshots(
        url,
        issues
      );

      expect(result.success).toBe(true);
      expect(result.screenshots).toHaveLength(2);
    });
  });

  describe('deleteScreenshot', () => {
    it('should call fs.unlink to delete screenshot file', async () => {
      const filename = 'screenshot-123.png';
      const result = await screenshotService.deleteScreenshot(filename);

      expect(fs.unlink).toHaveBeenCalledWith(expect.stringContaining(filename));
      expect(result.success).toBe(true);
    });
  });

  describe('cleanOldScreenshots', () => {
    it('should clean up files older than max age', async () => {
      const mockFiles = ['screenshot-old.png', 'other-file.txt'];
      vi.spyOn(fs, 'readdir').mockResolvedValue(mockFiles);

      const oldTime = Date.now() - 25 * 60 * 60 * 1000; // 25 hours ago
      vi.spyOn(fs, 'stat').mockResolvedValue({ birthtimeMs: oldTime });

      const result = await screenshotService.cleanOldScreenshots(24);

      expect(fs.unlink).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });
  });
});
