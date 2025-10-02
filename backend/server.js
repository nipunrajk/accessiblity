import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import analysisController from './controllers/analysisController.js';
import aiController from './controllers/aiController.js';
import {
  connectGitHub,
  getGitHubConfig,
} from './controllers/githubController.js';
import { analyzeRepository } from './controllers/repoAnalysisController.js';
import { applyAccessibilityFixes } from './controllers/accessibilityFixController.js';
import repoModificationRoutes from './routes/repoModificationRoutes.js';
import { errorHandler, asyncHandler } from './middleware/errorHandler.js';

// Import screenshot routes (keeping the new functionality)
import screenshotRoutes from './routes/screenshot.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Configure CORS
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5176',
    credentials: true,
  })
);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes with async error handling
app.post('/analyze', asyncHandler(analysisController.analyzeWebsite));
app.post('/api/scan-elements', asyncHandler(analysisController.scanElements));
app.post('/api/ai-analysis', asyncHandler(aiController.getAnalysis));
app.post('/api/ai-fixes', asyncHandler(aiController.getFixes));
app.post('/api/github/connect', asyncHandler(connectGitHub));
app.get('/api/github/config', asyncHandler(getGitHubConfig));
app.post('/api/analyze-repo', asyncHandler(analyzeRepository));
app.post(
  '/api/apply-accessibility-fixes',
  asyncHandler(applyAccessibilityFixes)
);
app.use('/api/repo', repoModificationRoutes);

// Screenshot routes (new functionality)
app.use('/api/screenshot', screenshotRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// 404 handler for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.originalUrl} not found`,
    code: 'ROUTE_NOT_FOUND',
  });
});

// Global error handling middleware
app.use(errorHandler);

// Import screenshot service for graceful shutdown
import screenshotService from './services/screenshotService.js';

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await screenshotService.closeBrowser();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  await screenshotService.closeBrowser();
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`🚀 FastFix server running at http://localhost:${PORT}`);
  console.log(`📊 Health check available at http://localhost:${PORT}/health`);
  console.log(
    `📸 Screenshot service available at http://localhost:${PORT}/api/screenshot`
  );
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});
