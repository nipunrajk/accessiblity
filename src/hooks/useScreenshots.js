/**
 * useScreenshots Hook
 * Handles screenshot capture and management for accessibility issues
 */

import { useState } from 'react';
import screenshotService from '../services/screenshotService';

/**
 * @typedef {Object} Screenshot
 * @property {string} screenshot - Base64 encoded screenshot data
 * @property {string} filename - Screenshot filename
 * @property {Object} issue - Associated issue object
 */

/**
 * @typedef {Object} ScreenshotOptions
 * @property {number} [width] - Screenshot width
 * @property {number} [height] - Screenshot height
 * @property {boolean} [fullPage] - Capture full page
 */

/**
 * Custom hook for capturing and managing screenshots
 * @returns {Object} Screenshot state and methods
 *
 * @example
 * const { captureIssueScreenshots, loading, screenshots } = useScreenshots();
 *
 * const result = await captureIssueScreenshots('https://example.com', issues);
 * console.log(`Captured ${screenshots.length} screenshots`);
 */
export const useScreenshots = () => {
  const [loading, setLoading] = useState(false);
  const [screenshots, setScreenshots] = useState([]);
  const [error, setError] = useState(null);

  /**
   * Capture individual screenshots for each issue
   * @param {string} url - Website URL
   * @param {Array} issues - Array of issues to capture
   * @param {ScreenshotOptions} options - Screenshot options
   * @returns {Promise<Object>} Capture result with screenshots array
   * @throws {Error} When screenshot capture fails
   *
   * @example
   * const result = await captureIssueScreenshots(
   *   'https://example.com',
   *   issues,
   *   { fullPage: false }
   * );
   */
  const captureIssueScreenshots = async (url, issues, options = {}) => {
    setLoading(true);
    setError(null);

    try {
      const result = await screenshotService.captureIssueWiseScreenshots(
        url,
        issues,
        options
      );

      if (result.success) {
        setScreenshots(result.screenshots);
        return result;
      } else {
        throw new Error(result.error || 'Failed to capture screenshots');
      }
    } catch (err) {
      setError(err.message);
      console.error('Screenshot capture error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Capture single screenshot with all issues highlighted
   * @param {string} url - Website URL
   * @param {Array} issues - Array of issues to highlight
   * @param {ScreenshotOptions} options - Screenshot options
   * @returns {Promise<Object>} Capture result with single screenshot
   * @throws {Error} When screenshot capture fails
   *
   * @example
   * const result = await captureWithHighlights(
   *   'https://example.com',
   *   issues,
   *   { fullPage: true }
   * );
   */
  const captureWithHighlights = async (url, issues, options = {}) => {
    setLoading(true);
    setError(null);

    try {
      const result = await screenshotService.captureWithHighlights(
        url,
        issues,
        options
      );

      if (result.success) {
        return result;
      } else {
        throw new Error(result.error || 'Failed to capture screenshot');
      }
    } catch (err) {
      setError(err.message);
      console.error('Screenshot capture error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Download a single screenshot
   * @param {Screenshot} screenshot - Screenshot object to download
   *
   * @example
   * downloadScreenshot(screenshots[0]);
   */
  const downloadScreenshot = (screenshot) => {
    try {
      const filename =
        screenshot.filename ||
        `${screenshot.issue?.title || 'screenshot'}-${Date.now()}.png`;
      screenshotService.downloadScreenshot(screenshot.screenshot, filename);
    } catch (err) {
      console.error('Download error:', err);
      setError('Failed to download screenshot');
    }
  };

  /**
   * Download all screenshots (downloads one by one with delay)
   * @param {Array<Screenshot>} screenshots - Array of screenshots to download
   *
   * @example
   * downloadAllScreenshots(screenshots);
   */
  const downloadAllScreenshots = (screenshots) => {
    screenshots.forEach((screenshot, index) => {
      setTimeout(() => {
        downloadScreenshot(screenshot);
      }, index * 500); // Stagger downloads
    });
  };

  /**
   * Clear all screenshots and error state
   */
  const clearScreenshots = () => {
    setScreenshots([]);
    setError(null);
  };

  return {
    loading,
    screenshots,
    error,
    captureIssueScreenshots,
    captureWithHighlights,
    downloadScreenshot,
    downloadAllScreenshots,
    clearScreenshots,
  };
};
