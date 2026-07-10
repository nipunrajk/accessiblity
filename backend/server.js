// Note: Environment variables are loaded via --env-file flag in package.json start script
// so they are available before any module evaluation (ES module safe).
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Now import everything else
import express from "express";
import cors from "cors";
import analysisController from "./controllers/analysisController.js";
import aiController from "./controllers/aiController.js";
import {
  connectGitHub,
  getGitHubConfig,
} from "./controllers/githubController.js";
import { analyzeRepository } from "./controllers/repoAnalysisController.js";
import { applyAccessibilityFixes } from "./controllers/accessibilityFixController.js";
import repoModificationRoutes from "./routes/repoModificationRoutes.js";
import axeRoutes from "./routes/axeRoutes.js";
import { errorHandler, asyncHandler } from "./middleware/errorHandler.js";

// Import screenshot routes (keeping the new functionality)
import screenshotRoutes from "./routes/screenshot.js";
import logger from "./utils/logger.js";
import { config, validateConfig } from "./config/index.js";

// Validate configuration on startup
try {
  validateConfig();
  logger.success("Configuration validated successfully");
} catch (error) {
  logger.error("Configuration validation failed", error);
  process.exit(1);
}

const app = express();
const PORT = config.app.server.port;

// Configure CORS
app.use(
  cors({
    origin: config.app.cors.origin,
    credentials: config.app.cors.credentials,
  }),
);

// Body parsing middleware
app.use(express.json({ limit: config.app.request.sizeLimit }));
app.use(
  express.urlencoded({ extended: true, limit: config.app.request.sizeLimit }),
);

// Routes with async error handling
app.post("/analyze", asyncHandler(analysisController.analyzeWebsite));
app.post("/api/scan-elements", asyncHandler(analysisController.scanElements));
app.post("/api/ai-analysis", asyncHandler(aiController.getAnalysis));
app.post("/api/ai-fixes", asyncHandler(aiController.getFixes));
app.post("/api/github/connect", asyncHandler(connectGitHub));
app.get("/api/github/config", asyncHandler(getGitHubConfig));
app.post("/api/analyze-repo", asyncHandler(analyzeRepository));
app.post(
  "/api/apply-accessibility-fixes",
  asyncHandler(applyAccessibilityFixes),
);
app.use("/api/repo", repoModificationRoutes);

// Axe-Core accessibility routes
app.use("/api/axe", axeRoutes);

// Screenshot routes (new functionality)
app.use("/api/screenshot", screenshotRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Debug endpoint to check environment variables
app.get("/debug/env", (req, res) => {
  res.json({
    AI_PROVIDER: config.ai.provider || "Not set",
    AI_API_KEY: config.ai.apiKey
      ? "Set (length: " + config.ai.apiKey.length + ")"
      : "Not set",
    AI_MODEL: config.ai.model || "Not set",
    NODE_ENV: config.app.server.env || "Not set",
    BROWSERCAT_API_KEY: process.env.BROWSERCAT_API_KEY ? "Set (length: " + process.env.BROWSERCAT_API_KEY.length + ")" : "Not set",
  });
});

import puppeteer from 'puppeteer';
app.get("/debug/browsercat", async (req, res) => {
  try {
    const key = process.env.BROWSERCAT_API_KEY;
    if (!key) {
      return res.json({ error: "No API key" });
    }
    const browser = await puppeteer.connect({
      browserWSEndpoint: 'wss://api.browsercat.com/connect',
      headers: { 'Api-Key': key }
    });
    const page = await browser.newPage();
    await browser.close();
    res.json({ success: true, message: "BrowserCat connected successfully" });
  } catch (err) {
    res.json({ success: false, error: err.message, stack: err.stack });
  }
});

// 404 handler for undefined routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.originalUrl} not found`,
    code: "ROUTE_NOT_FOUND",
  });
});

// Global error handling middleware
app.use(errorHandler);

// Import services for graceful shutdown
import screenshotService from "./services/screenshotService.js";
import browserPool from "./services/browser-pool.service.js";

// Graceful shutdown handler
const gracefulShutdown = async (signal) => {
  logger.info(`${signal} received, shutting down gracefully`);

  try {
    // Close screenshot service browser
    await screenshotService.closeBrowser();

    // Close browser pool
    await browserPool.closeAll();

    logger.success("Graceful shutdown completed");
    process.exit(0);
  } catch (error) {
    logger.error("Error during graceful shutdown", error);
    process.exit(1);
  }
};

// Register shutdown handlers
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGHUP", () => gracefulShutdown("SIGHUP"));

// Handle uncaught exceptions
process.on("uncaughtException", async (error) => {
  logger.error("Uncaught exception", error);
  await gracefulShutdown("UNCAUGHT_EXCEPTION");
});

// Handle unhandled promise rejections
process.on("unhandledRejection", async (reason, promise) => {
  logger.error("Unhandled promise rejection", { reason, promise });
  await gracefulShutdown("UNHANDLED_REJECTION");
});

app.listen(PORT, () => {
  logger.serverStart(PORT, config.app.server.env);
});
