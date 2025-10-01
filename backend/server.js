const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const screenshotRoutes = require('./routes/screenshot');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api/screenshot', screenshotRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'FastFix Backend',
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  const screenshotService = require('./services/screenshotService');
  await screenshotService.closeBrowser();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  const screenshotService = require('./services/screenshotService');
  await screenshotService.closeBrowser();
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`🚀 FastFix Backend running on port ${PORT}`);
  console.log(
    `📸 Screenshot service available at http://localhost:${PORT}/api/screenshot`
  );
  console.log(`❤️  Health check: http://localhost:${PORT}/health`);
});
