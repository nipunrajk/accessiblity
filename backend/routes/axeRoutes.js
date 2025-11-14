import express from 'express';
import axeController from '../controllers/axeController.js';

const router = express.Router();

// Axe-Core analysis endpoints
router.post('/analyze', axeController.analyzePage);
router.post('/combined', axeController.analyzeCombined);
router.post('/analyze-batch', axeController.analyzeBatch);
router.post('/violations', axeController.getViolations);
router.post('/analyze-element', axeController.analyzeElement);

// Axe-Core information endpoints
router.get('/rules', axeController.getRules);
router.get('/tags', axeController.getTags);

export default router;
