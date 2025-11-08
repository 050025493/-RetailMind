// backend/src/routes/competitors.js
import express from 'express';
import {
  getAllCompetitorStatus,
  getCompetitorPrices,
  refreshCompetitorPrices,
  getDetailedAnalysis
} from '../controllers/competitorController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Get all products with competitor status
router.get('/', getAllCompetitorStatus);

// Get competitor prices for a specific product
router.get('/:productId', getCompetitorPrices);

// Refresh competitor prices (with cooldown)
router.post('/:productId/refresh', refreshCompetitorPrices);

// Get detailed analysis with history and AI recommendations
router.get('/:productId/analysis', getDetailedAnalysis);

export default router;