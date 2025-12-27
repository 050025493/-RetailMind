import Product from '../models/Product.js';
import DemandForecast from '../models/DemandForecast.js';
import DemandData from '../models/DemandData.js';
// Import BOTH new functions from the service
import { getAIDemandForecast, trainAIModel } from '../services/aiService.js';
import sequelize from '../config/database.js';

// @desc    Generate a new demand forecast for a product
// @route   POST /api/forecast/:productId
// @access  Private
export const generateForecast = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { productId } = req.params;
    const userId = req.user.id;

    // 1. Check if product exists
    const product = await Product.findOne({
      where: { id: productId, userId },
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // 2. Fetch REAL historical data
    const historicalData = await DemandData.findAll({
      where: { productId: productId },
      attributes: ['date', 'quantity_sold'],
      order: [['date', 'ASC']],
      raw: true,
    });

    // 3. Check if we have enough data to train
    if (historicalData.length < 30) {
      return res.status(400).json({
        success: false,
        message: `Not enough sales data to generate a forecast. Need at least 30 days of history, but found only ${historicalData.length}.`,
      });
    }

    // 4. --- CONDITIONAL TRAINING ---
    // Only train if explicitly requested or if it's the first time (implied by UI logic)
    // Ideally, we check if models exist, but here we'll rely on a query param 'retrain=true'
    // or just skip training if not requested, as predict handles 'models not found' error.
    if (req.query.retrain === 'true') {
      console.log('🔄 Retraining AI models as requested...');
      await trainAIModel(historicalData);
    } else {
      console.log('⏩ Skipping training (use ?retrain=true to force)');
    }

    // 5. --- NEW STEP ---
    // 5. --- PREDICTION WITH AUTO-RECOVERY ---
    // Try to predict first. If it fails because "Models not trained", then train and retry.
    let aiResponse;
    try {
      console.log('🔮 Attempting to get forecast...');
      aiResponse = await getAIDemandForecast(historicalData, 30);
    } catch (predictionError) {
      // Check if error is due to missing models
      if (predictionError.message.includes('Models not trained') ||
        predictionError.message.includes('No model file found') ||
        predictionError.message.includes('Request failed with status code 400')) {

        console.log('⚠️ Models missing. Triggering auto-training...');
        await trainAIModel(historicalData);

        console.log('🔄 Retrying forecast after training...');
        aiResponse = await getAIDemandForecast(historicalData, 30);
      } else {
        // Real error, rethrow
        throw predictionError;
      }
    }

    // Check success of the (potentially retried) response
    if (!aiResponse || !aiResponse.success) {
      throw new Error('AI service returned an error during prediction');
    }

    // 6. Clear old forecast
    await DemandForecast.destroy({
      where: { productId: productId },
      transaction: t,
    });

    // 7. Save the new forecast data
    const forecastData = aiResponse.forecast.map(item => ({
      productId: productId,
      date: item.date,
      predicted_quantity: Math.round(item.predicted_quantity), // Round to nearest integer
    }));

    const savedForecasts = await DemandForecast.bulkCreate(forecastData, { transaction: t });

    // 8. Commit and send
    await t.commit();

    res.status(201).json({
      success: true,
      message: `Forecast generated for ${product.name} based on ${historicalData.length} days of sales history.`,
      data: savedForecasts,
    });

  } catch (error) {
    await t.rollback();
    console.error('Forecast generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating forecast',
      error: error.message,
    });
  }
};

// @desc    Get demand forecast for a product
// @route   GET /api/forecast/:productId
// @access  Private
export const getForecast = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user.id;

    const product = await Product.count({
      where: { id: productId, userId },
    });

    if (product === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    const forecast = await DemandForecast.findAll({
      where: { productId: productId },
      order: [['date', 'ASC']],
    });

    res.status(200).json({
      success: true,
      data: forecast,
    });

  } catch (error) {
    console.error('Get forecast error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching forecast',
      error: error.message,
    });
  }
};