const express = require('express');
const router = express.Router();
const screenshotService = require('../services/screenshotService');

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
    console.error('Screenshot API error:', error);
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
    console.error('Screenshot highlight API error:', error);
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
    console.error('Screenshot comparison API error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

module.exports = router;
