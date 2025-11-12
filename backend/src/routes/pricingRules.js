// backend/src/routes/pricingRules.js
import express from 'express';
import {
  getPricingRules,
  createPricingRule,
  updatePricingRule,
  deletePricingRule,
  previewRuleImpact,
  applyPricingRules,
  handleVoiceQuery,
  getVoiceHistory
} from '../controllers/pricingRulesController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Rule CRUD operations
router.route('/')
  .get(getPricingRules)
  .post(createPricingRule);

router.route('/:id')
  .put(updatePricingRule)
  .delete(deletePricingRule);

// Rule application
router.post('/preview', previewRuleImpact);
router.post('/apply', applyPricingRules);

// Voice query
router.post('/voice-query', handleVoiceQuery);
router.get('/voice-history', getVoiceHistory);

export default router;