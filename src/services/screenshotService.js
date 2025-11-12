const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

class ScreenshotService {
  constructor() {
    this.baseUrl = `${API_BASE_URL}/api/screenshot`;
  }

  /**
   * Capture issue-wise screenshots
   * @param {string} url - Website URL
   * @param {Array} issues - Array of issues with selectors
   * @param {Object} options - Screenshot options
   * @returns {Promise<Object>} Screenshot results
   */
  async captureIssueWiseScreenshots(url, issues, options = {}) {
    try {
      const response = await fetch(`${this.baseUrl}/issue-wise`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          issues,
          options: {
            width: 1200,
            height: 800,
            ...options,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Screenshot API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to capture issue-wise screenshots:', error);
      throw error;
    }
  }

  /**
   * Capture screenshot with all issues highlighted
   * @param {string} url - Website URL
   * @param {Array} issues - Array of issues
   * @param {Object} options - Screenshot options
   * @returns {Promise<Object>} Screenshot result
   */
  async captureWithHighlights(url, issues, options = {}) {
    try {
      const response = await fetch(`${this.baseUrl}/highlight`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          issues,
          options: {
            width: 1200,
            height: 800,
            fullPage: false,
            ...options,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Screenshot API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to capture screenshot with highlights:', error);
      throw error;
    }
  }

  /**
   * Download screenshot as file
   * @param {string} dataUrl - Base64 data URL
   * @param {string} filename - Filename for download
   */
  downloadScreenshot(dataUrl, filename = 'screenshot.png') {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * List all screenshots
   * @returns {Promise<Array>} List of screenshots
   */
  async listScreenshots() {
    try {
      const response = await fetch(`${this.baseUrl}/list`);
      if (!response.ok) {
        throw new Error(`Screenshot API error: ${response.statusText}`);
      }
      const data = await response.json();
      return data.screenshots || [];
    } catch (error) {
      console.error('Failed to list screenshots:', error);
      return [];
    }
  }

  /**
   * Delete screenshot
   * @param {string} filename - Filename to delete
   * @returns {Promise<Object>} Delete result
   */
  async deleteScreenshot(filename) {
    try {
      const response = await fetch(`${this.baseUrl}/${filename}`, {
        method: 'DELETE',
      });
      return await response.json();
    } catch (error) {
      console.error('Failed to delete screenshot:', error);
      throw error;
    }
  }

  /**
   * Clean old screenshots
   * @param {number} maxAgeHours - Maximum age in hours
   * @returns {Promise<Object>} Clean result
   */
  async cleanOldScreenshots(maxAgeHours = 24) {
    try {
      const response = await fetch(`${this.baseUrl}/clean`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ maxAgeHours }),
      });
      return await response.json();
    } catch (error) {
      console.error('Failed to clean old screenshots:', error);
      throw error;
    }
  }
}

export default new ScreenshotService();
