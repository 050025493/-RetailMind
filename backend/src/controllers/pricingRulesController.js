// backend/src/controllers/pricingRulesController.js
import Models from "../models/PricingRule.js";
const { PricingRule, PricingRuleApplication, VoiceQuery } = Models;

import Product from "../models/Product.js";
import DemandForecast from "../models/DemandForecast.js";
import DemandData from "../models/DemandData.js";
import { CompetitorPrice } from "../models/CompetitorPrice.js";
import { processVoiceQuery } from "../services/voiceQueryService.js";
import sequelize from "../config/database.js";
import { Op } from "sequelize";

/**
 * @desc Get all pricing rules for user
 * @route GET /api/pricing-rules
 * @access Private
 */
export const getPricingRules = async (req, res) => {
  try {
    const userId = req.user.id;

    const rules = await PricingRule.findAll({
      where: { userId },
      order: [["priority", "DESC"], ["created_at", "DESC"]],
      include: [
        {
          model: PricingRuleApplication,
          as: "applications",
          limit: 5,
          order: [["appliedAt", "DESC"]],
        },
      ],
    });

    res.status(200).json({
      success: true,
      count: rules.length,
      data: rules,
    });
  } catch (error) {
    console.error("Get pricing rules error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching pricing rules",
      error: error.message,
    });
  }
};

/**
 * @desc Create new pricing rule
 * @route POST /api/pricing-rules
 * @access Private
 */
export const createPricingRule = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      ruleName,
      conditionType,
      conditionThreshold,
      conditionOperator,
      actionType,
      actionValue,
      actionUnit,
      minPrice,
      maxPrice,
      isActive,
      priority,
    } = req.body;

    const rule = await PricingRule.create({
      userId,
      ruleName,
      conditionType,
      conditionThreshold,
      conditionOperator,
      actionType,
      actionValue,
      actionUnit,
      minPrice,
      maxPrice,
      isActive: isActive !== undefined ? isActive : true,
      priority: priority || 0,
    });

    res.status(201).json({
      success: true,
      message: "Pricing rule created successfully",
      data: rule,
    });
  } catch (error) {
    console.error("Create pricing rule error:", error);
    res.status(500).json({
      success: false,
      message: "Error creating pricing rule",
      error: error.message,
    });
  }
};

/**
 * @desc Update pricing rule
 * @route PUT /api/pricing-rules/:id
 * @access Private
 */
export const updatePricingRule = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const rule = await PricingRule.findOne({
      where: { id, userId },
    });

    if (!rule) {
      return res.status(404).json({
        success: false,
        message: "Pricing rule not found",
      });
    }

    await rule.update(req.body);

    res.status(200).json({
      success: true,
      message: "Pricing rule updated successfully",
      data: rule,
    });
  } catch (error) {
    console.error("Update pricing rule error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating pricing rule",
      error: error.message,
    });
  }
};

/**
 * @desc Delete pricing rule
 * @route DELETE /api/pricing-rules/:id
 * @access Private
 */
export const deletePricingRule = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const rule = await PricingRule.findOne({
      where: { id, userId },
    });

    if (!rule) {
      return res.status(404).json({
        success: false,
        message: "Pricing rule not found",
      });
    }

    await rule.destroy();

    res.status(200).json({
      success: true,
      message: "Pricing rule deleted successfully",
    });
  } catch (error) {
    console.error("Delete pricing rule error:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting pricing rule",
      error: error.message,
    });
  }
};

/**
 * @desc Preview rule impact on products
 * @route POST /api/pricing-rules/preview
 * @access Private
 */
export const previewRuleImpact = async (req, res) => {
  try {
    const userId = req.user.id;
    const ruleData = req.body;

    const products = await Product.findAll({
      where: { userId, status: "active" },
    });

    const affectedProducts = [];

    for (const product of products) {
      const shouldApply = await checkRuleCondition(product, ruleData);

      if (shouldApply) {
        const newPrice = calculateNewPrice(product, ruleData);
        affectedProducts.push({
          id: product.id,
          name: product.name,
          currentPrice: parseFloat(product.currentPrice),
          newPrice: newPrice,
          priceChange: newPrice - parseFloat(product.currentPrice),
          changePercentage: (
            ((newPrice - parseFloat(product.currentPrice)) /
              parseFloat(product.currentPrice)) *
            100
          ).toFixed(2),
        });
      }
    }

    res.status(200).json({
      success: true,
      affectedCount: affectedProducts.length,
      totalProducts: products.length,
      data: affectedProducts,
    });
  } catch (error) {
    console.error("Preview rule impact error:", error);
    res.status(500).json({
      success: false,
      message: "Error previewing rule impact",
      error: error.message,
    });
  }
};

/**
 * @desc Apply pricing rules to products
 * @route POST /api/pricing-rules/apply
 * @access Private
 */
export const applyPricingRules = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const userId = req.user.id;

    const rules = await PricingRule.findAll({
      where: { userId, isActive: true },
      order: [["priority", "DESC"]],
    });

    const products = await Product.findAll({
      where: { userId, status: "active" },
    });

    let applicationsCount = 0;
    const applications = [];

    for (const rule of rules) {
      for (const product of products) {
        const shouldApply = await checkRuleCondition(product, rule);

        if (shouldApply) {
          const oldPrice = parseFloat(product.currentPrice);
          const newPrice = calculateNewPrice(product, rule);
          const constrainedPrice = applyPriceConstraints(newPrice, rule, product);

          if (constrainedPrice !== oldPrice) {
            await product.update(
              { currentPrice: constrainedPrice },
              { transaction: t }
            );

            const application = await PricingRuleApplication.create(
              {
                ruleId: rule.id,
                productId: product.id,
                oldPrice,
                newPrice: constrainedPrice,
                success: true,
              },
              { transaction: t }
            );

            applications.push(application);
            applicationsCount++;
          }
        }
      }

      await rule.update(
        { lastAppliedAt: new Date() },
        { transaction: t }
      );
    }

    await t.commit();

    res.status(200).json({
      success: true,
      message: `Applied ${applicationsCount} price changes across ${applications.length} products`,
      applicationsCount,
      data: applications,
    });
  } catch (error) {
    await t.rollback();
    console.error("Apply pricing rules error:", error);
    res.status(500).json({
      success: false,
      message: "Error applying pricing rules",
      error: error.message,
    });
  }
};

/**
 * @desc Process voice query
 * @route POST /api/pricing-rules/voice-query
 * @access Private
 */
export const handleVoiceQuery = async (req, res) => {
  try {
    const userId = req.user.id;
    const { queryText } = req.body;

    if (!queryText) {
      return res.status(400).json({
        success: false,
        message: "Query text is required",
      });
    }

    const result = await processVoiceQuery(queryText, userId);

    await VoiceQuery.create({
      userId,
      queryText,
      queryType: result.queryType,
      responseText: result.responseText,
      responseData: result.responseData,
      processingTimeMs: result.processingTimeMs,
    });

    res.status(200).json(result);
  } catch (error) {
    console.error("Voice query error:", error);
    res.status(500).json({
      success: false,
      message: "Error processing voice query",
      error: error.message,
    });
  }
};

/**
 * @desc Get voice query history
 * @route GET /api/pricing-rules/voice-history
 * @access Private
 */
export const getVoiceHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 20;

    const history = await VoiceQuery.findAll({
      where: { userId },
      order: [["created_at", "DESC"]],
      limit,
    });

    res.status(200).json({
      success: true,
      count: history.length,
      data: history,
    });
  } catch (error) {
    console.error("Get voice history error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching voice history",
      error: error.message,
    });
  }
};

// ---------- Helper Functions ----------

// ✅ Uses real 14-day demand history from DemandData
const checkRuleCondition = async (product, rule) => {
  const threshold = parseFloat(rule.conditionThreshold);

  switch (rule.conditionType) {
    case "demand_increase": {
      // Try forecast first, fallback to real sales
      const forecast = await DemandForecast.findOne({
        where: { productId: product.id },
        order: [["date", "DESC"]],
      });

      if (forecast) {
        const predictedIncrease =
          ((forecast.predicted_quantity - product.stockQuantity) /
            (product.stockQuantity || 1)) *
          100;
        return evaluateCondition(predictedIncrease, rule.conditionOperator, threshold);
      }

      const history = await DemandData.findAll({
        where: { productId: product.id },
        order: [["date", "DESC"]],
        limit: 14,
      });

      if (history.length < 14) return false;
      const recent = history.slice(0, 7).reduce((a, b) => a + b.quantity_sold, 0) / 7;
      const past = history.slice(7, 14).reduce((a, b) => a + b.quantity_sold, 0) / 7;
      const demandChange = ((recent - past) / (past || 1)) * 100;

      return evaluateCondition(demandChange, rule.conditionOperator, threshold);
    }

    case "demand_decrease": {
      const history = await DemandData.findAll({
        where: { productId: product.id },
        order: [["date", "DESC"]],
        limit: 14,
      });

      if (history.length < 14) return false;
      const recent = history.slice(0, 7).reduce((a, b) => a + b.quantity_sold, 0) / 7;
      const past = history.slice(7, 14).reduce((a, b) => a + b.quantity_sold, 0) / 7;
      const demandChange = ((recent - past) / (past || 1)) * 100;

      return evaluateCondition(-demandChange, rule.conditionOperator, threshold);
    }

    case "stock_level":
      return evaluateCondition(product.stockQuantity, rule.conditionOperator, threshold);

    case "competitor_price": {
      const competitors = await CompetitorPrice.findAll({
        where: { productId: product.id },
      });
      if (competitors.length === 0) return false;
      const avgCompPrice =
        competitors.reduce((sum, c) => sum + parseFloat(c.price), 0) / competitors.length;
      const priceDiff =
        ((parseFloat(product.currentPrice) - avgCompPrice) / avgCompPrice) * 100;
      return evaluateCondition(priceDiff, rule.conditionOperator, threshold);
    }

    default:
      return false;
  }
};

const evaluateCondition = (value, operator, threshold) => {
  switch (operator) {
    case ">":
      return value > threshold;
    case "<":
      return value < threshold;
    case ">=":
      return value >= threshold;
    case "<=":
      return value <= threshold;
    case "=":
      return Math.abs(value - threshold) < 0.01;
    default:
      return false;
  }
};

const calculateNewPrice = (product, rule) => {
  const currentPrice = parseFloat(product.currentPrice);
  const actionValue = parseFloat(rule.actionValue);

  switch (rule.actionType) {
    case "increase_price":
      return rule.actionUnit === "%"
        ? currentPrice * (1 + actionValue / 100)
        : currentPrice + actionValue;

    case "decrease_price":
      return rule.actionUnit === "%"
        ? currentPrice * (1 - actionValue / 100)
        : currentPrice - actionValue;

    case "set_price":
      return actionValue;

    case "set_margin": {
      const costPrice = parseFloat(product.costPrice) || currentPrice * 0.7;
      return costPrice / (1 - actionValue / 100);
    }

    default:
      return currentPrice;
  }
};

const applyPriceConstraints = (newPrice, rule, product) => {
  let constrainedPrice = newPrice;

  if (rule.minPrice) {
    constrainedPrice = Math.max(constrainedPrice, parseFloat(rule.minPrice));
  }
  if (rule.maxPrice) {
    constrainedPrice = Math.min(constrainedPrice, parseFloat(rule.maxPrice));
  }

  if (product.costPrice) {
    constrainedPrice = Math.max(
      constrainedPrice,
      parseFloat(product.costPrice) * 1.05
    );
  }

  return Math.round(constrainedPrice * 100) / 100;
};
