import express from 'express';
import {
  getLatestCompetitorPrices,
  refreshCompetitorPrices
} from '../controllers/competitorController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// GET /api/competitors/
router.get('/', getLatestCompetitorPrices);

// POST /api/competitors/refresh/:productId
router.post('/refresh/:productId', refreshCompetitorPrices);

export default router;