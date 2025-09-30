import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import analysisController from './controllers/analysisController.js';
import aiController from './controllers/aiController.js';
import repoModificationRoutes from './routes/repoModificationRoutes.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Configure CORS
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5176',
    credentials: true,
  })
);
app.use(express.json());

// Routes
app.post('/analyze', analysisController.analyzeWebsite);
app.post('/api/scan-elements', analysisController.scanElements);
app.post('/api/ai-analysis', aiController.getAnalysis);
app.post('/api/ai-fixes', aiController.getFixes);
app.use('/api/repo', repoModificationRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
