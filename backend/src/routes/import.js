import express from 'express';
import {
  bulkImportProducts,
  syncExternalProducts,
  seedDemoData
} from '../controllers/importController.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

router.use(verifyToken);

router.post('/products', bulkImportProducts);
router.post('/sync', syncExternalProducts);
router.post('/seed-demo', seedDemoData);

export default router;
