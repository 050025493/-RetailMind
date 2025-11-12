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

    // Check if product has reviews, if not, generate demo reviews automatically
    const reviewCount = await ProductReview.count({ where: { productId } });
    if (reviewCount === 0) {
      console.log(`No reviews found for product ${productId}, generating demo reviews...`);
      await generateDemoReviews(productId, 10);
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
  order: [['created_at', 'DESC']], 
  limit: 10,
  attributes: [
    'reviewText', 
    'rating', 
    'sentimentLabel', 
    'sentimentScore', 
    ['created_at', 'createdAt'] 
  ]
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
      order: [['created_at', 'DESC']]
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
 * @desc Save simulation as campaign
 * @route POST /api/promo/save-simulation
 * @access Private
 */
export const saveSimulation = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      simulationId,
      campaignName,
      startDate,
      endDate
    } = req.body;

    if (!simulationId || !campaignName) {
      return res.status(400).json({
        success: false,
        message: 'Simulation ID and campaign name are required'
      });
    }

    // Get simulation data
    const simulation = await PromoSimulation.findOne({
      where: { id: simulationId, userId },
      include: [{
        model: Product,
        as: 'product',
        attributes: ['id', 'name', 'currentPrice', 'costPrice']
      }]
    });

    if (!simulation) {
      return res.status(404).json({
        success: false,
        message: 'Simulation not found'
      });
    }

    // Create campaign from simulation
    const campaign = await PromoCampaign.create({
      userId,
      campaignName,
      productId: simulation.productId,
      discountType: 'percentage',
      discountValue: simulation.discountPercentage,
      startDate: startDate || new Date(),
      endDate: endDate || new Date(Date.now() + simulation.durationDays * 24 * 60 * 60 * 1000),
      durationDays: simulation.durationDays,
      status: 'draft',
      predictedDemandLift: simulation.predictedDemandLift,
      predictedRevenue: simulation.predictedRevenue,
      predictedUnitsSold: simulation.predictedUnitsSold,
      sentimentImpactScore: simulation.sentimentScore,
      confidenceScore: 60 + (simulation.avgDailySales / 10) * 2
    });

    res.status(201).json({
      success: true,
      message: 'Simulation saved as campaign',
      data: campaign
    });

  } catch (error) {
    console.error('Save simulation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error saving simulation',
      error: error.message
    });
  }
};

/**
 * @desc Generate PDF report for simulation
 * @route GET /api/promo/export-pdf/:simulationId
 * @access Private
 */
export const exportSimulationPDF = async (req, res) => {
  try {
    const { simulationId } = req.params;
    const userId = req.user.id;

    const simulation = await PromoSimulation.findOne({
      where: { id: simulationId, userId },
      include: [{
        model: Product,
        as: 'product',
        attributes: ['id', 'name', 'currentPrice', 'costPrice', 'category']
      }]
    });

    if (!simulation) {
      return res.status(404).json({
        success: false,
        message: 'Simulation not found'
      });
    }

    // Get sentiment data
    const sentimentData = await getProductSentiment(simulation.productId);

    // Calculate additional metrics
    const discountedPrice = simulation.currentPrice * (1 - simulation.discountPercentage / 100);
    const revenue = simulation.predictedUnitsSold * discountedPrice;
    const cost = simulation.predictedUnitsSold * (simulation.product.costPrice || simulation.currentPrice * 0.7);
    const profit = revenue - cost;

    // Generate HTML report
    const htmlReport = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Promo Simulation Report - ${simulation.product.name}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
    .header { text-align: center; margin-bottom: 40px; border-bottom: 3px solid #4F46E5; padding-bottom: 20px; }
    .header h1 { color: #4F46E5; margin: 0; }
    .header p { color: #666; margin: 5px 0; }
    .section { margin: 30px 0; }
    .section h2 { color: #4F46E5; border-bottom: 2px solid #E5E7EB; padding-bottom: 10px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
    .card { background: #F9FAFB; padding: 20px; border-radius: 8px; border-left: 4px solid #4F46E5; }
    .card h3 { margin: 0 0 10px 0; color: #666; font-size: 14px; font-weight: normal; }
    .card .value { font-size: 28px; font-weight: bold; color: #111; }
    .card .subtitle { font-size: 12px; color: #666; margin-top: 5px; }
    .positive { color: #10B981; }
    .negative { color: #EF4444; }
    .neutral { color: #F59E0B; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    table th { background: #F3F4F6; padding: 12px; text-align: left; font-weight: 600; }
    table td { padding: 12px; border-bottom: 1px solid #E5E7EB; }
    .footer { margin-top: 50px; text-align: center; color: #666; font-size: 12px; border-top: 1px solid #E5E7EB; padding-top: 20px; }
    .sentiment-bar { height: 20px; background: #E5E7EB; border-radius: 10px; overflow: hidden; margin: 10px 0; }
    .sentiment-bar-fill { height: 100%; float: left; }
    .recommendation { padding: 20px; border-radius: 8px; margin: 20px 0; }
    .recommendation.viable { background: #D1FAE5; border: 2px solid #10B981; }
    .recommendation.not-viable { background: #FEE2E2; border: 2px solid #EF4444; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Promotional Impact Simulation Report</h1>
    <p>Generated on ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
    <p>Product: <strong>${simulation.product.name}</strong></p>
  </div>

  <div class="section">
    <h2>Simulation Parameters</h2>
    <table>
      <tr>
        <th>Parameter</th>
        <th>Value</th>
      </tr>
      <tr>
        <td>Current Price</td>
        <td>₹${simulation.currentPrice.toLocaleString('en-IN')}</td>
      </tr>
      <tr>
        <td>Discount Percentage</td>
        <td>${simulation.discountPercentage}%</td>
      </tr>
      <tr>
        <td>Discounted Price</td>
        <td>₹${discountedPrice.toFixed(2).toLocaleString('en-IN')}</td>
      </tr>
      <tr>
        <td>Duration</td>
        <td>${simulation.durationDays} days</td>
      </tr>
      <tr>
        <td>Average Daily Sales (Historical)</td>
        <td>${simulation.avgDailySales} units/day</td>
      </tr>
      <tr>
        <td>Available Stock</td>
        <td>${simulation.stockAvailable} units</td>
      </tr>
    </table>
  </div>

  <div class="section">
    <h2>Sentiment Analysis</h2>
    <div class="grid">
      <div class="card">
        <h3>Sentiment Score</h3>
        <div class="value ${sentimentData.sentiment === 'positive' ? 'positive' : sentimentData.sentiment === 'negative' ? 'negative' : 'neutral'}">
          ${simulation.sentimentScore ? parseFloat(simulation.sentimentScore).toFixed(2) : '0.00'}
        </div>
        <div class="subtitle">${sentimentData.sentiment.toUpperCase()}</div>
      </div>
      <div class="card">
        <h3>Review Count</h3>
        <div class="value">${sentimentData.reviewCount}</div>
        <div class="subtitle">Customer reviews analyzed</div>
      </div>
    </div>
    
    <h3>Review Distribution</h3>
    <div style="margin: 20px 0;">
      <div style="margin: 10px 0;">
        <span>Positive (${sentimentData.distribution.positive})</span>
        <div class="sentiment-bar">
          <div class="sentiment-bar-fill" style="width: ${(sentimentData.distribution.positive / sentimentData.reviewCount * 100)}%; background: #10B981;"></div>
        </div>
      </div>
      <div style="margin: 10px 0;">
        <span>Neutral (${sentimentData.distribution.neutral})</span>
        <div class="sentiment-bar">
          <div class="sentiment-bar-fill" style="width: ${(sentimentData.distribution.neutral / sentimentData.reviewCount * 100)}%; background: #F59E0B;"></div>
        </div>
      </div>
      <div style="margin: 10px 0;">
        <span>Negative (${sentimentData.distribution.negative})</span>
        <div class="sentiment-bar">
          <div class="sentiment-bar-fill" style="width: ${(sentimentData.distribution.negative / sentimentData.reviewCount * 100)}%; background: #EF4444;"></div>
        </div>
      </div>
    </div>
  </div>

  <div class="section">
    <h2>Predicted Performance</h2>
    <div class="grid">
      <div class="card">
        <h3>Demand Lift</h3>
        <div class="value positive">+${simulation.predictedDemandLift}%</div>
        <div class="subtitle">Expected increase in demand</div>
      </div>
      <div class="card">
        <h3>Predicted Revenue</h3>
        <div class="value">₹${simulation.predictedRevenue.toLocaleString('en-IN')}</div>
        <div class="subtitle">Total revenue during promo</div>
      </div>
      <div class="card">
        <h3>Predicted Units Sold</h3>
        <div class="value">${simulation.predictedUnitsSold}</div>
        <div class="subtitle">units</div>
      </div>
      <div class="card">
        <h3>Break-even Point</h3>
        <div class="value">${simulation.breakEvenUnits}</div>
        <div class="subtitle">units to break even</div>
      </div>
      <div class="card">
        <h3>Expected Profit</h3>
        <div class="value ${profit > 0 ? 'positive' : 'negative'}">₹${profit.toFixed(2).toLocaleString('en-IN')}</div>
        <div class="subtitle">After costs</div>
      </div>
      <div class="card">
        <h3>ROI</h3>
        <div class="value ${simulation.roiPercentage > 0 ? 'positive' : 'negative'}">${simulation.roiPercentage > 0 ? '+' : ''}${simulation.roiPercentage}%</div>
        <div class="subtitle">Return on investment</div>
      </div>
    </div>
  </div>

  <div class="section">
    <h2>Recommendation</h2>
    <div class="recommendation ${simulation.roiPercentage > 0 && simulation.predictedUnitsSold <= simulation.stockAvailable ? 'viable' : 'not-viable'}">
      <h3>${simulation.roiPercentage > 0 && simulation.predictedUnitsSold <= simulation.stockAvailable ? '✓ Recommended' : '⚠ Not Recommended'}</h3>
      <p>${sentimentData.sentiment === 'positive' ? 'High promo success probability based on positive customer sentiment.' : 
         sentimentData.sentiment === 'negative' ? 'Focus on product improvement before running promo. Negative sentiment may reduce effectiveness.' :
         'Moderate promo success expected with neutral sentiment.'}</p>
      
      ${simulation.predictedUnitsSold > simulation.stockAvailable ? '<p><strong>⚠ Warning:</strong> Insufficient stock for predicted demand. Consider increasing inventory.</p>' : ''}
      ${simulation.roiPercentage < 0 ? '<p><strong>⚠ Warning:</strong> Negative ROI projected. Consider reducing discount or increasing duration.</p>' : ''}
    </div>
  </div>

  <div class="footer">
    <p>This report was generated by RetailMind AI Pricing Intelligence Platform</p>
    <p>Report ID: SIM-${simulation.id} | Generated: ${new Date().toISOString()}</p>
  </div>
</body>
</html>
    `;

    // Return HTML (can be converted to PDF on frontend using jsPDF or similar)
    res.status(200).json({
      success: true,
      data: {
        html: htmlReport,
        filename: `promo_simulation_${simulation.product.name.replace(/\s+/g, '_')}_${Date.now()}.html`,
        simulation: {
          id: simulation.id,
          productName: simulation.product.name,
          discount: simulation.discountPercentage,
          duration: simulation.durationDays,
          roi: simulation.roiPercentage
        }
      }
    });

  } catch (error) {
    console.error('Export PDF error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating report',
      error: error.message
    });
  }
};
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
      order: [['created_at', 'DESC']],
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