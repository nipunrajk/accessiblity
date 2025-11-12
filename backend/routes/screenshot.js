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

export default router;
