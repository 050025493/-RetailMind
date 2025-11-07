import express from 'express';
import { generateForecast, getForecast }from '../controllers/forecastController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes are protected
router.use(protect); // This comes from your src/middleware/auth.js

router.route('/:productId')
  .post(generateForecast) // Generate a new forecast
  .get(getForecast);      // Get the saved forecast

export default router;