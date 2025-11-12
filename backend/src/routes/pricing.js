// backend/src/routes/pricing.js
import express from 'express';
import {
  getPricingSuggestions,
  getProductPricing,
  applyPricingSuggestion,
  dismissPricingSuggestion,
  applyAllSuggestions,
  retrainModel
} from '../controllers/pricingController.js';

const router = express.Router();

// Get all pricing suggestions
router.get('/suggestions', getPricingSuggestions);

// Get single product pricing suggestion with details
router.get('/product/:productId', getProductPricing);

// Apply a pricing suggestion
router.post('/product/:productId/apply', applyPricingSuggestion);

// Dismiss a pricing suggestion
router.post('/product/:productId/dismiss', dismissPricingSuggestion);

// Apply all pending suggestions
router.post('/apply-all', applyAllSuggestions);

// Retrain the ML model with historical data
router.post('/retrain', retrainModel);

export default router;