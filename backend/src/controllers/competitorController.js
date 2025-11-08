// backend/src/controllers/competitorController.js
import Product from '../models/Product.js';
import { CompetitorPrice, CompetitorPriceHistory } from '../models/CompetitorPrice.js';
import { generateCompetitorPrices, generateCompetitorAnalysis } from '../services/geminiCompetitorService.js';
import { Op } from 'sequelize';
import sequelize from '../config/database.js';

const REFRESH_COOLDOWN_MINUTES = 30; // 30 minutes cooldown

/**
 * @desc Get competitor prices for a product
 * @route GET /api/competitors/:productId
 * @access Private
 */
export const getCompetitorPrices = async (req, res) => {
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

    const competitors = await CompetitorPrice.findAll({
      where: { productId },
      order: [['price', 'ASC']]
    });

    // Calculate status
    let status = 'competitive';
    if (competitors.length > 0) {
      const avgPrice = competitors.reduce((sum, c) => sum + parseFloat(c.price), 0) / competitors.length;
      const yourPrice = parseFloat(product.currentPrice);
      const diff = ((yourPrice - avgPrice) / avgPrice) * 100;

      if (diff > 10) status = 'overpriced';
      else if (diff < -10) status = 'underpriced';
    }

    res.status(200).json({
      success: true,
      data: {
        product: {
          id: product.id,
          name: product.name,
          currentPrice: product.currentPrice,
          category: product.category
        },
        competitors: competitors.map(c => ({
          id: c.id,
          competitorName: c.competitorName,
          price: parseFloat(c.price),
          url: c.url,
          lastScrapedAt: c.lastScrapedAt
        })),
        status,
        lastRefresh: product.last_competitor_refresh,
        canRefresh: canRefreshNow(product.last_competitor_refresh)
      }
    });

  } catch (error) {
    console.error('Get competitor prices error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching competitor prices',
      error: error.message
    });
  }
};

/**
 * @desc Refresh competitor prices for a product using Gemini AI
 * @route POST /api/competitors/:productId/refresh
 * @access Private
 */
export const refreshCompetitorPrices = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const { productId } = req.params;
    const userId = req.user.id;

    const product = await Product.findOne({
      where: { id: productId, userId }
    });

    if (!product) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check cooldown
    if (!canRefreshNow(product.last_competitor_refresh)) {
      const minutesLeft = getRemainingCooldown(product.last_competitor_refresh);
      await t.rollback();
      return res.status(429).json({
        success: false,
        message: `Please wait ${minutesLeft} minutes before refreshing again`,
        cooldownMinutes: minutesLeft
      });
    }

    // Get existing competitor prices
    const existingCompetitors = await CompetitorPrice.findAll({
      where: { productId },
      raw: true
    });

    // Generate new prices using Gemini AI
    const newCompetitorData = await generateCompetitorPrices(product, existingCompetitors);

    // Update or create competitor prices
    for (const compData of newCompetitorData) {
      const existing = await CompetitorPrice.findOne({
        where: { 
          productId,
          competitorName: compData.competitorName
        }
      });

      if (existing) {
        const oldPrice = parseFloat(existing.price);
        const newPrice = compData.price;
        const priceChange = newPrice - oldPrice;
        const changePercentage = ((priceChange / oldPrice) * 100).toFixed(2);

        // Update current price
        await existing.update({
          price: newPrice,
          lastScrapedAt: new Date()
        }, { transaction: t });

        // Save to history if price changed
        if (Math.abs(priceChange) > 0.01) {
          await CompetitorPriceHistory.create({
            productId,
            competitorName: compData.competitorName,
            price: newPrice,
            priceChange,
            changePercentage,
            recordedAt: new Date()
          }, { transaction: t });
        }
      } else {
        // Create new competitor price
        await CompetitorPrice.create({
          productId,
          competitorName: compData.competitorName,
          price: compData.price,
          lastScrapedAt: new Date()
        }, { transaction: t });

        // Add to history
        await CompetitorPriceHistory.create({
          productId,
          competitorName: compData.competitorName,
          price: compData.price,
          priceChange: 0,
          changePercentage: 0,
          recordedAt: new Date()
        }, { transaction: t });
      }
    }

    // Update last refresh time
    await product.update({
      last_competitor_refresh: new Date()
    }, { transaction: t });

    await t.commit();

    // Fetch updated data
    const updatedCompetitors = await CompetitorPrice.findAll({
      where: { productId },
      order: [['price', 'ASC']]
    });

    res.status(200).json({
      success: true,
      message: 'Competitor prices refreshed successfully',
      data: updatedCompetitors.map(c => ({
        id: c.id,
        competitorName: c.competitorName,
        price: parseFloat(c.price),
        lastScrapedAt: c.lastScrapedAt
      }))
    });

  } catch (error) {
    await t.rollback();
    console.error('Refresh competitor prices error:', error);
    res.status(500).json({
      success: false,
      message: 'Error refreshing competitor prices',
      error: error.message
    });
  }
};

/**
 * @desc Get detailed analysis with history and AI recommendations
 * @route GET /api/competitors/:productId/analysis
 * @access Private
 */
export const getDetailedAnalysis = async (req, res) => {
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

    // Get current competitors
    const competitors = await CompetitorPrice.findAll({
      where: { productId },
      order: [['price', 'ASC']]
    });

    // Get price history (last 30 days)
    const history = await CompetitorPriceHistory.findAll({
      where: {
        productId,
        recordedAt: {
          [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      },
      order: [['recordedAt', 'DESC']],
      limit: 100
    });

    // Generate AI analysis
    const analysis = await generateCompetitorAnalysis(
      product,
      competitors,
      history
    );

    // Group history by competitor for charting
    const historyByCompetitor = {};
    history.forEach(h => {
      if (!historyByCompetitor[h.competitorName]) {
        historyByCompetitor[h.competitorName] = [];
      }
      historyByCompetitor[h.competitorName].push({
        date: h.recordedAt,
        price: parseFloat(h.price),
        change: parseFloat(h.priceChange || 0),
        changePercentage: parseFloat(h.changePercentage || 0)
      });
    });

    res.status(200).json({
      success: true,
      data: {
        product: {
          id: product.id,
          name: product.name,
          currentPrice: parseFloat(product.currentPrice),
          costPrice: parseFloat(product.costPrice || 0),
          category: product.category
        },
        currentCompetitors: competitors.map(c => ({
          competitorName: c.competitorName,
          price: parseFloat(c.price),
          lastScrapedAt: c.lastScrapedAt
        })),
        priceHistory: historyByCompetitor,
        analysis
      }
    });

  } catch (error) {
    console.error('Get detailed analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating analysis',
      error: error.message
    });
  }
};

/**
 * @desc Get all products with competitor status
 * @route GET /api/competitors
 * @access Private
 */
export const getAllCompetitorStatus = async (req, res) => {
  try {
    const userId = req.user.id;

    const products = await Product.findAll({
      where: { userId, status: 'active' },
      include: [{
        model: CompetitorPrice,
        as: 'competitorPrices',
        attributes: ['competitorName', 'price']
      }],
      order: [['name', 'ASC']]
    });

    const summary = products.map(product => {
      const competitors = product.competitorPrices || [];
      let status = 'no_data';
      let avgCompPrice = 0;

      if (competitors.length > 0) {
        avgCompPrice = competitors.reduce((sum, c) => sum + parseFloat(c.price), 0) / competitors.length;
        const yourPrice = parseFloat(product.currentPrice);
        const diff = ((yourPrice - avgCompPrice) / avgCompPrice) * 100;

        if (diff > 10) status = 'overpriced';
        else if (diff < -10) status = 'underpriced';
        else status = 'competitive';
      }

      return {
        productId: product.id,
        productName: product.name,
        yourPrice: parseFloat(product.currentPrice),
        avgCompetitorPrice: avgCompPrice ? parseFloat(avgCompPrice.toFixed(2)) : null,
        competitorCount: competitors.length,
        status,
        canRefresh: canRefreshNow(product.last_competitor_refresh),
        lastRefresh: product.last_competitor_refresh
      };
    });

    res.status(200).json({
      success: true,
      count: summary.length,
      data: summary
    });

  } catch (error) {
    console.error('Get all competitor status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching competitor status',
      error: error.message
    });
  }
};

// Helper functions
const canRefreshNow = (lastRefresh) => {
  if (!lastRefresh) return true;
  const diffMinutes = (Date.now() - new Date(lastRefresh).getTime()) / (1000 * 60);
  return diffMinutes >= REFRESH_COOLDOWN_MINUTES;
};

const getRemainingCooldown = (lastRefresh) => {
  if (!lastRefresh) return 0;
  const diffMinutes = (Date.now() - new Date(lastRefresh).getTime()) / (1000 * 60);
  return Math.max(0, Math.ceil(REFRESH_COOLDOWN_MINUTES - diffMinutes));
};