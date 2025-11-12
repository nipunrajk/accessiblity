import express from 'express';
import screenshotService from '../services/screenshotService.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Basic screenshot endpoint
router.post('/capture', async (req, res) => {
  try {
    const { url, options = {} } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'URL is required',
      });
    }

    // Validate URL
    try {
      new URL(url);
    } catch (urlError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid URL provided',
      });
    }

    const result = await screenshotService.captureScreenshot(url, options);
    res.json(result);
  } catch (error) {
    logger.error('Screenshot API error', error, { url: req.body.url });
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// Screenshot with issue highlights
router.post('/highlight', async (req, res) => {
  try {
    const { url, issues = [], options = {} } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'URL is required',
      });
    }

    try {
      new URL(url);
    } catch (urlError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid URL provided',
      });
    }

    const result = await screenshotService.captureWithHighlights(
      url,
      issues,
      options
    );
    res.json(result);
  } catch (error) {
    logger.error('Screenshot highlight API error', error, {
      url: req.body.url,
    });
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// Before/after comparison
router.post('/comparison', async (req, res) => {
  try {
    const { url, fixes = [], options = {} } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'URL is required',
      });
    }

    try {
      new URL(url);
    } catch (urlError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid URL provided',
      });
    }

    const result = await screenshotService.generateBeforeAfterComparison(
      url,
      fixes,
      options
    );
    res.json(result);
  } catch (error) {
    logger.error('Screenshot comparison API error', error, {
      url: req.body.url,
    });
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// Issue-wise screenshots (NEW)
router.post('/issue-wise', async (req, res) => {
  try {
    const { url, issues = [], options = {} } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'URL is required',
      });
    }

    if (!Array.isArray(issues) || issues.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Issues array is required and must not be empty',
      });
    }

    try {
      new URL(url);
    } catch (urlError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid URL provided',
      });
    }

    const result = await screenshotService.captureIssueWiseScreenshots(
      url,
      issues,
      options
    );
    res.json(result);
  } catch (error) {
    logger.error('Issue-wise screenshot API error', error, {
      url: req.body.url,
    });
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// List all screenshots
router.get('/list', async (req, res) => {
  try {
    const screenshots = await screenshotService.listScreenshots();
    res.json({ success: true, screenshots });
  } catch (error) {
    logger.error('List screenshots API error', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// Delete screenshot
router.delete('/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const result = await screenshotService.deleteScreenshot(filename);
    res.json(result);
  } catch (error) {
    logger.error('Delete screenshot API error', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// Clean old screenshots
router.post('/clean', async (req, res) => {
  try {
    const { maxAgeHours = 24 } = req.body;
    const result = await screenshotService.cleanOldScreenshots(maxAgeHours);
    res.json(result);
  } catch (error) {
    logger.error('Clean screenshots API error', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

export default router;
