import express from 'express';
import {
  getDashboardStats,
  getRevenueTrend,
  getCategorySales,
  getAlerts,
  markAlertRead,
  getTopProducts,
} from '../controllers/dashboardController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes are protected
router.use(protect);

router.get('/stats', getDashboardStats);
router.get('/revenue-trend', getRevenueTrend);
router.get('/category-sales', getCategorySales);
router.get('/alerts', getAlerts);
router.put('/alerts/:id/read', markAlertRead);
router.get('/top-products', getTopProducts);

export default router;