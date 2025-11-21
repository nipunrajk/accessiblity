import analysisOrchestrator from '../services/analysis/analysis-orchestrator.service.js';
import { validateUrl } from '../utils/validation.js';
import logger from '../utils/logger.js';

/**
 * Analysis Controller
 * Handles HTTP concerns for analysis endpoints
 * Delegates business logic to analysis orchestrator service
 */
class AnalysisController {
  /**
   * Analyze website endpoint
   * POST /analyze
   * Streams results via Server-Sent Events (SSE)
   */
  async analyzeWebsite(req, res) {
    const { url, includeAI = true, includeAxe = true } = req.body;

    // Validate URL
    const validatedUrl = validateUrl(url);

    // Set up SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });

    try {
      // Progress callback for SSE
      const sendProgress = (progress) => {
        res.write(`data: ${JSON.stringify(progress)}\n\n`);
      };

      // Delegate to orchestration service
      const results = await analysisOrchestrator.analyzeWebsite({
        url: validatedUrl,
        includeAI,
        includeAxe,
        onProgress: sendProgress,
      });

      // Send final response
      res.write(`data: ${JSON.stringify(results)}\n\n`);
    } catch (error) {
      logger.error('Analysis failed', error, { url: validatedUrl });
      res.write(
        `data: ${JSON.stringify({
          error: 'Failed to analyze website',
          message: error.message,
        })}\n\n`
      );
    }

    res.end();
  }

  /**
   * Scan DOM elements endpoint
   * POST /api/scan-elements
   */
  async scanElements(req, res) {
    try {
      const { url } = req.body;

      // Validate URL
      const validatedUrl = validateUrl(url);

      // Delegate to element scanner service
      const elementScanner = (
        await import('../services/analysis/element-scanner.service.js')
      ).default;
      const elements = await elementScanner.scanElements(validatedUrl);

      res.json({
        success: true,
        elements,
        count: elements.length,
      });
    } catch (error) {
      logger.error('Error scanning elements', error, { url: req.body.url });
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
}

export default new AnalysisController();
