import express from 'express';
import {
  previewCSV,
  importSalesData,
  importWithProductMatching,
  getCSVTemplate,
  getSalesStats
} from '../controllers/salesDataController.js';
import { protect } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// CSV template download
router.get('/template', getCSVTemplate);

// Preview CSV before import
router.post('/preview', upload.single('file'), previewCSV);

// Import sales data for specific product
router.post('/import', importSalesData);

// Import with automatic product matching
router.post('/import-with-matching', importWithProductMatching);

// Get sales statistics for a product
router.get('/stats/:productId', getSalesStats);

export default router;