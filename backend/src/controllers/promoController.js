// backend/src/controllers/promoController.js
import Product from '../models/Product.js';
import { PromoSimulation, PromoCampaign, ProductReview } from '../models/PromoSimulator.js';
import { 
  getProductSentiment, 
  calculateSentimentImpact, 
  getAvgDailySales,
  generateDemoReviews,
  analyzeSentiment
} from '../services/sentimentService.js';
import sequelize from '../config/database.js';

/**
 * @desc Run promo simulation with sentiment analysis
 * @route POST /api/promo/simulate
 * @access Private
 */
export const simulatePromo = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, discountPercentage, durationDays } = req.body;

    // Validate inputs
    if (!productId || !discountPercentage || !durationDays) {
      return res.status(400).json({
        success: false,
        message: 'Product ID, discount percentage, and duration are required'
      });
    }

    // Get product
    const product = await Product.findOne({
      where: { id: productId, userId }
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Get sentiment analysis
    const sentimentData = await getProductSentiment(productId);

    // Get average daily sales
    const avgDailySales = await getAvgDailySales(productId, 30);

    // Calculate sentiment impact on promo
    const sentimentImpact = calculateSentimentImpact(sentimentData, discountPercentage);

    // Calculate predictions
    const currentPrice = parseFloat(product.currentPrice);
    const discountedPrice = currentPrice * (1 - discountPercentage / 100);
    const costPrice = parseFloat(product.costPrice) || currentPrice * 0.7;

    // Base demand lift
    const demandLift = sentimentImpact.demandLift;
    
    // Predicted units sold
    const baseUnits = avgDailySales * durationDays;
    const predictedUnits = Math.round(baseUnits * (1 + demandLift / 100));

    // Revenue calculations
    const predictedRevenue = predictedUnits * discountedPrice;
    const normalRevenue = baseUnits * currentPrice;
    
    // Cost calculations
    const totalCost = predictedUnits * costPrice;
    const profit = predictedRevenue - totalCost;
    const normalProfit = baseUnits * (currentPrice - costPrice);

    // ROI calculation
    const roi = ((profit - normalProfit) / normalProfit) * 100;

    // Break-even calculation
    const breakEvenUnits = Math.ceil(
      (baseUnits * currentPrice) / discountedPrice
    );

    // Stock check
    const stockAvailable = product.stockQuantity;
    const stockSufficient = predictedUnits <= stockAvailable;

    // Save simulation
    const simulation = await PromoSimulation.create({
      userId,
      productId,
      discountPercentage,
      durationDays,
      currentPrice,
      avgDailySales,
      stockAvailable,
      sentimentScore: sentimentData.avgSentiment,
      predictedRevenue,
      predictedUnitsSold: predictedUnits,
      predictedDemandLift: demandLift,
      breakEvenUnits,
      roiPercentage: parseFloat(roi.toFixed(2))
    });

    res.status(200).json({
      success: true,
      data: {
        simulation: {
          id: simulation.id,
          discountPercentage,
          durationDays,
          currentPrice,
          discountedPrice: parseFloat(discountedPrice.toFixed(2))
        },
        sentiment: {
          ...sentimentData,
          impact: sentimentImpact
        },
        predictions: {
          demandLift: parseFloat(demandLift.toFixed(2)),
          predictedUnits,
          baseUnits: Math.round(baseUnits),
          predictedRevenue: parseFloat(predictedRevenue.toFixed(2)),
          normalRevenue: parseFloat(normalRevenue.toFixed(2)),
          revenueIncrease: parseFloat((predictedRevenue - normalRevenue).toFixed(2)),
          profit: parseFloat(profit.toFixed(2)),
          roi: parseFloat(roi.toFixed(2)),
          breakEvenUnits,
          confidence: sentimentImpact.confidence
        },
        stock: {
          available: stockAvailable,
          required: predictedUnits,
          sufficient: stockSufficient,
          warning: !stockSufficient ? 'Insufficient stock for predicted demand' : null
        },
        recommendation: {
          viable: roi > 0 && stockSufficient,
          message: sentimentImpact.recommendation,
          risks: [
            !stockSufficient ? 'Stock shortage risk' : null,
            sentimentData.sentiment === 'negative' ? 'Negative customer sentiment' : null,
            roi < 0 ? 'Negative ROI projected' : null
          ].filter(Boolean)
        }
      }
    });

  } catch (error) {
    console.error('Simulate promo error:', error);
    res.status(500).json({
      success: false,
      message: 'Error simulating promo',
      error: error.message
    });
  }
};

/**
 * @desc Get product sentiment data
 * @route GET /api/promo/sentiment/:productId
 * @access Private
 */
export const getProductSentimentData = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user.id;

    const product = await Product.findOne({
      where: { id: productId, userId }
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const sentimentData = await getProductSentiment(productId);

    // Get recent reviews
    const reviews = await ProductReview.findAll({
      where: { productId },
      order: [['createdAt', 'DESC']],
      limit: 10,
      attributes: ['reviewText', 'rating', 'sentimentLabel', 'sentimentScore', 'createdAt']
    });

    res.status(200).json({
      success: true,
      data: {
        product: {
          id: product.id,
          name: product.name
        },
        sentiment: sentimentData,
        recentReviews: reviews
      }
    });

  } catch (error) {
    console.error('Get sentiment data error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching sentiment data',
      error: error.message
    });
  }
};

/**
 * @desc Create promo campaign
 * @route POST /api/promo/campaign
 * @access Private
 */
export const createCampaign = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      campaignName,
      productId,
      discountType,
      discountValue,
      startDate,
      endDate,
      durationDays
    } = req.body;

    // Run simulation first
    const simulationResponse = await simulatePromo({
      user: { id: userId },
      body: { productId, discountPercentage: discountValue, durationDays }
    }, { status: () => ({ json: (data) => data }) });

    if (!simulationResponse.success) {
      return res.status(400).json(simulationResponse);
    }

    const simData = simulationResponse.data;

    // Create campaign
    const campaign = await PromoCampaign.create({
      userId,
      campaignName,
      productId,
      discountType,
      discountValue,
      startDate,
      endDate,
      durationDays,
      status: 'draft',
      predictedDemandLift: simData.predictions.demandLift,
      predictedRevenue: simData.predictions.predictedRevenue,
      predictedUnitsSold: simData.predictions.predictedUnits,
      sentimentImpactScore: simData.sentiment.avgSentiment,
      confidenceScore: simData.predictions.confidence
    });

    res.status(201).json({
      success: true,
      message: 'Campaign created successfully',
      data: campaign
    });

  } catch (error) {
    console.error('Create campaign error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating campaign',
      error: error.message
    });
  }
};

/**
 * @desc Get all campaigns
 * @route GET /api/promo/campaigns
 * @access Private
 */
export const getCampaigns = async (req, res) => {
  try {
    const userId = req.user.id;
    const status = req.query.status;

    const where = { userId };
    if (status) where.status = status;

    const campaigns = await PromoCampaign.findAll({
      where,
      include: [{
        model: Product,
        as: 'product',
        attributes: ['id', 'name', 'currentPrice', 'stockQuantity']
      }],
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      count: campaigns.length,
      data: campaigns
    });

  } catch (error) {
    console.error('Get campaigns error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching campaigns',
      error: error.message
    });
  }
};

/**
 * @desc Add product review
 * @route POST /api/promo/review
 * @access Private
 */
export const addReview = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, reviewText, rating } = req.body;

    if (!productId || !reviewText) {
      return res.status(400).json({
        success: false,
        message: 'Product ID and review text are required'
      });
    }

    // Analyze sentiment
    const sentiment = await analyzeSentiment(reviewText);

    // Create review
    const review = await ProductReview.create({
      productId,
      userId,
      reviewText,
      rating,
      sentimentScore: sentiment.score,
      sentimentLabel: sentiment.label
    });

    res.status(201).json({
      success: true,
      message: 'Review added successfully',
      data: {
        review,
        sentiment
      }
    });

  } catch (error) {
    console.error('Add review error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding review',
      error: error.message
    });
  }
};

/**
 * @desc Generate demo reviews for testing
 * @route POST /api/promo/demo-reviews/:productId
 * @access Private
 */
export const createDemoReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user.id;

    const product = await Product.findOne({
      where: { id: productId, userId }
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const reviews = await generateDemoReviews(productId, 10);

    res.status(201).json({
      success: true,
      message: `${reviews.length} demo reviews created`,
      data: reviews
    });

  } catch (error) {
    console.error('Create demo reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating demo reviews',
      error: error.message
    });
  }
};

/**
 * @desc Get simulation history
 * @route GET /api/promo/simulations
 * @access Private
 */
export const getSimulations = async (req, res) => {
  try {
    const userId = req.user.id;
    const productId = req.query.productId;
    const limit = parseInt(req.query.limit) || 20;

    const where = { userId };
    if (productId) where.productId = productId;

    const simulations = await PromoSimulation.findAll({
      where,
      include: [{
        model: Product,
        as: 'product',
        attributes: ['id', 'name']
      }],
      order: [['createdAt', 'DESC']],
      limit
    });

    res.status(200).json({
      success: true,
      count: simulations.length,
      data: simulations
    });

  } catch (error) {
    console.error('Get simulations error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching simulations',
      error: error.message
    });
  }
};