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

    // 4. --- NEW STEP ---
    // First, tell the AI to train and save a new model
    await trainAIModel(historicalData);

    // 5. --- NEW STEP ---
    // Now, call predict. This will load the model we just saved.
    const aiResponse = await getAIDemandForecast(historicalData, 30);

    if (!aiResponse.success) {
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