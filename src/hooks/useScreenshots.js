import { useState } from 'react';
import screenshotService from '../services/screenshotService';

export const useScreenshots = () => {
  const [loading, setLoading] = useState(false);
  const [screenshots, setScreenshots] = useState([]);
  const [error, setError] = useState(null);

  /**
   * Capture issue-wise screenshots
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
   * Download screenshot
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
   * Download all screenshots as zip (simplified - downloads one by one)
   */
  const downloadAllScreenshots = (screenshots) => {
    screenshots.forEach((screenshot, index) => {
      setTimeout(() => {
        downloadScreenshot(screenshot);
      }, index * 500); // Stagger downloads
    });
  };

  /**
   * Clear screenshots
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
