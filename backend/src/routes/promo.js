// backend/src/routes/promo.js
import express from 'express';
import {
  simulatePromo,
  getProductSentimentData,
  createCampaign,
  getCampaigns,
  addReview,
  createDemoReviews,
  getSimulations
} from '../controllers/promoController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Simulation
router.post('/simulate', simulatePromo);
router.get('/simulations', getSimulations);

// Sentiment analysis
router.get('/sentiment/:productId', getProductSentimentData);
router.post('/review', addReview);
router.post('/demo-reviews/:productId', createDemoReviews);

// Campaigns
router.route('/campaigns')
  .get(getCampaigns)
  .post(createCampaign);

export default router;