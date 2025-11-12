// backend/src/services/voiceQueryService.js
import { GoogleGenerativeAI } from '@google/generative-ai';
import Product from '../models/Product.js';
import DemandData from '../models/DemandData.js';
import { CompetitorPrice } from '../models/CompetitorPrice.js';
import { Op } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Process voice query and return intelligent response
 * @param {string} queryText - User's voice query
 * @param {number} userId - User ID for context
 * @returns {Promise<Object>} Response with text and data
 */
export const processVoiceQuery = async (queryText, userId) => {
  const startTime = Date.now();

  try {
    // Step 1: Classify query type and extract intent
    const intent = await classifyQuery(queryText);
    
    // Step 2: Fetch relevant data
    const contextData = await fetchContextData(userId, intent);
    
    // Step 3: Generate response using Gemini AI
    const response = await generateResponse(queryText, intent, contextData);
    
    const processingTime = Date.now() - startTime;

    return {
      success: true,
      queryType: intent.type,
      responseText: response.text,
      responseData: response.data,
      processingTimeMs: processingTime
    };

  } catch (error) {
    console.error('Voice query processing error:', error);
    return {
      success: false,
      responseText: "I'm sorry, I couldn't process that query. Please try again.",
      error: error.message,
      processingTimeMs: Date.now() - startTime
    };
  }
};

/**
 * Classify query type using AI
 */
const classifyQuery = async (queryText) => {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `
Classify this pricing query and extract key information:
Query: "${queryText}"

Determine:
1. Query Type: product_price, sales_data, comparison, recommendation, underpriced_products, profit_analysis, demand_trend
2. Product mentioned (if any)
3. Time period (if any)
4. Action needed

Return ONLY valid JSON:
{
  "type": "product_price|sales_data|comparison|recommendation|underpriced_products|profit_analysis|demand_trend",
  "productName": "extracted product name or null",
  "timePeriod": "today|week|month|year or null",
  "action": "get|increase|decrease|compare or null"
}
`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  let text = response.text().replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
  
  try {
    return JSON.parse(text);
  } catch {
    // Fallback classification
    return {
      type: 'general',
      productName: null,
      timePeriod: null,
      action: 'get'
    };
  }
};

/**
 * Fetch relevant context data based on intent
 */
const fetchContextData = async (userId, intent) => {
  const data = {};

  // Fetch user's products
  data.products = await Product.findAll({
    where: { userId },
    attributes: ['id', 'name', 'currentPrice', 'costPrice', 'stockQuantity', 'category'],
    limit: 100
  });

  // If specific product mentioned, find it
  if (intent.productName) {
    data.targetProduct = data.products.find(p => 
      p.name.toLowerCase().includes(intent.productName.toLowerCase())
    );
  }

  // Fetch sales data for analysis
  if (intent.type === 'sales_data' || intent.type === 'demand_trend') {
    const productIds = data.products.map(p => p.id);
    const timeFilter = getTimeFilter(intent.timePeriod);
    
    data.salesData = await DemandData.findAll({
      where: {
        productId: { [Op.in]: productIds },
        date: timeFilter
      },
      order: [['date', 'DESC']],
      limit: 100
    });
  }

  // Fetch competitor prices if needed
  if (intent.type === 'comparison' || intent.type === 'recommendation') {
    if (data.targetProduct) {
      data.competitorPrices = await CompetitorPrice.findAll({
        where: { productId: data.targetProduct.id }
      });
    }
  }

  // Calculate underpriced products
  if (intent.type === 'underpriced_products') {
    data.underpricedProducts = data.products.filter(p => {
      if (!p.costPrice) return false;
      const margin = ((parseFloat(p.currentPrice) - parseFloat(p.costPrice)) / parseFloat(p.currentPrice)) * 100;
      return margin < 20; // Less than 20% margin
    });
  }

  return data;
};

/**
 * Generate natural language response using Gemini
 */
const generateResponse = async (queryText, intent, contextData) => {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `
You are a pricing assistant for an e-commerce business. Answer this query naturally and concisely.

User Query: "${queryText}"

Context Data:
${JSON.stringify(contextData, null, 2)}

Return ONLY valid JSON:
{
  "text": "Your natural language response here",
  "data": {}
}
`;

  const result = await model.generateContent(prompt);

  // 🔍 Debug full raw Gemini response
  console.log("Gemini full raw result:", JSON.stringify(result, null, 2));

  const rawText =
    result.response?.candidates?.[0]?.content?.parts?.[0]?.text || "";

  console.log("Gemini raw text:", rawText);

  if (!rawText) {
    return {
      text: "Gemini returned empty response. Try adjusting the prompt.",
      data: {},
    };
  }

  let clean = rawText.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

  try {
    return JSON.parse(clean);
  } catch (err) {
    console.warn("Gemini parse error:", err.message);
    return {
      text: clean || "Sorry, I couldn't parse Gemini output.",
      data: {},
    };
  }
};


/**
 * Helper to get time filter for queries
 */
const getTimeFilter = (timePeriod) => {
  const now = new Date();
  
  switch (timePeriod) {
    case 'today':
      return { [Op.gte]: new Date(now.setHours(0, 0, 0, 0)) };
    case 'week':
      return { [Op.gte]: new Date(now.setDate(now.getDate() - 7)) };
    case 'month':
      return { [Op.gte]: new Date(now.setMonth(now.getMonth() - 1)) };
    case 'year':
      return { [Op.gte]: new Date(now.setFullYear(now.getFullYear() - 1)) };
    default:
      return { [Op.gte]: new Date(now.setDate(now.getDate() - 30)) };
  }
};