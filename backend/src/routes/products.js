import express from 'express';
import {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductStats,
  getCategories,
  getLowStock,
} from '../controllers/productController.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// Special routes first (to avoid conflicts with /:id)
router.get('/stats', getProductStats);
router.get('/categories', getCategories);
router.get('/low-stock', getLowStock);

// CRUD routes
router.route('/')
  .get(getProducts)
  .post(createProduct);

router.route('/:id')
  .get(getProduct)
  .put(updateProduct)
  .delete(deleteProduct);

export default router;
