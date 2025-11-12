import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
// import { Op } from 'sequelize'; // No longer used
import Product from '../models/Product.js';
import PricingSuggestion from '../models/PricingSuggestion.js';
import { CompetitorPrice as Competitor } from '../models/CompetitorPrice.js';
// ❗ FIX: Import DemandData instead of DemandForecast
import DemandData from '../models/DemandData.js'; 

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper: Call Python ML model with better error handling
async function callPythonModel(scriptName, data) {
  // ... (This function remains the same)
  return new Promise((resolve, reject) => {
    const pythonPath = process.env.PYTHON_PATH || 'python';
    const scriptDir = path.join(__dirname, '../../ml_models');

    if (!data || typeof data !== 'object') {
      reject(new Error('Invalid input data for Python model'));
      return;
    }
    const python = spawn(pythonPath, [scriptName], { cwd: scriptDir });
    let resultData = '';
    let errorData = '';
    try {
      python.stdin.write(JSON.stringify(data));
      python.stdin.end();
    } catch (err) {
      reject(new Error(`Failed to write to Python process: ${err.message}`));
      return;
    }
    python.stdout.on('data', (data) => {
      resultData += data.toString();
    });
    python.stderr.on('data', (data) => {
      errorData += data.toString();
    });
    python.on('close', (code) => {
      if (code !== 0) {
        try {
          const errorObj = JSON.parse(errorData);
          reject(new Error(`${errorObj.type}: ${errorObj.error}`));
        } catch {
          reject(new Error(`Python process exited with code ${code}: ${errorData}`));
        }
      } else {
        try {
          const result = JSON.parse(resultData);
          resolve(result);
        } catch (err) {
          reject(new Error(`Failed to parse Python output: ${resultData}`));
        }
      }
    });
    python.on('error', (err) => {
      reject(new Error(`Failed to spawn Python process: ${err.message}`));
    });
  });
}

// Helper: Safely parse float values
function safeParseFloat(value, defaultValue = 0) {
  // ... (This function remains the same)
  if (value === null || value === undefined) return defaultValue;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? defaultValue : parsed;
}

// Helper: Safely parse int values
function safeParseInt(value, defaultValue = 0) {
  // ... (This function remains the same)
  if (value === null || value === undefined) return defaultValue;
  const parsed = parseInt(value);
  return isNaN(parsed) ? defaultValue : parsed;
}

// ✅ Get all pricing suggestions
export const getPricingSuggestions = async (req, res) => {
  try {
    const { search } = req.query;
    
    // Get products with their related data
    let products = await Product.findAll({
      // where: search ? { name: { [Op.like]: `%${search}%` } } : {},
      include: [
        // ❗ FIX: Use DemandData model with 'demand' alias
        // We also order by date and limit to 30 to get recent history
        { 
          model: DemandData, 
          as: 'demand',
          order: [['date', 'DESC']],
          limit: 30 
        },
        { model: PricingSuggestion, as: 'pricingSuggestion' }
      ],
      order: [['created_at', 'DESC']]
    });
    
    // Get all competitor data
    const competitors = await Competitor.findAll();
    
    // Prepare data for ML model
    const suggestions = [];
    
    for (const product of products) {
      // Get competitor prices for this product
      const productCompetitors = competitors.filter(c => c.productId === product.id);
      const competitorPrices = productCompetitors
        .map(c => safeParseFloat(c.price))
        .filter(p => p > 0);
      
      // Safely parse all values (using correct model properties)
      const currentPrice = safeParseFloat(product.currentPrice, 100);
      const costPrice = safeParseFloat(product.costPrice, currentPrice * 0.6);
      
      // ❗ FIX: Get forecast from the most recent 'demand' entry
      const demandForecast = safeParseFloat(
        product.demand?.[0]?.quantity_sold, // Use quantity_sold from first item
        100
      );
      
      // Prepare product data for ML model
      const productData = {
        id: product.id,
        name: product.name,
        current_price: currentPrice,
        cost_price: costPrice,
        demand_forecast: demandForecast,
        competitor_prices: competitorPrices.length > 0 ? competitorPrices : [currentPrice],
        stock_level: safeParseInt(product.stockQuantity, 100),
        days_in_stock: safeParseInt(product.days_in_stock, 30),
        seasonality_index: safeParseFloat(product.seasonality_index, 1.0),
        category_avg_price: safeParseFloat(product.category_avg_price, currentPrice),
        // ❗ FIX: Use real historical data, reversed to be chronological
        historical_sales: (product.demand && product.demand.length > 0)
          ? product.demand.map(d => d.quantity_sold).reverse()
          : [100]
      };
      
      try {
        // Call Python ML model for prediction
        const prediction = await callPythonModel('predict_price.py', productData);
        
        // Store or update suggestion in database
        await PricingSuggestion.upsert({
          product_id: product.id,
          current_price: productData.current_price,
          suggested_price: prediction.suggested_price,
          min_price: prediction.price_range.min,
          max_price: prediction.price_range.max,
          confidence: prediction.confidence,
          reasoning: JSON.stringify(prediction.reasoning),
          impact: JSON.stringify(prediction.impact),
          change_percentage: prediction.change_percentage,
          status: product.pricingSuggestion?.status || 'pending'
        });
        
        suggestions.push({
          product: {
            id: product.id,
            name: product.name,
            category: product.category,
            image: product.imageUrl
          },
          current_price: productData.current_price,
          ...prediction
        });
        
      } catch (mlError) {
        console.error(`ML prediction failed for ${product.name}:`, mlError.message);
        
        // Use existing suggestion if available
        if (product.pricingSuggestion) {
          suggestions.push({
            product: {
              id: product.id,
              name: product.name,
              category: product.category,
              image: product.imageUrl
            },
            current_price: productData.current_price,
            suggested_price: safeParseFloat(product.pricingSuggestion.suggested_price),
            confidence: safeParseFloat(product.pricingSuggestion.confidence),
            change_percentage: safeParseFloat(product.pricingSuggestion.change_percentage),
            price_range: {
              min: safeParseFloat(product.pricingSuggestion.min_price),
              max: safeParseFloat(product.pricingSuggestion.max_price)
            },
            reasoning: {
              primary: 'Using cached suggestion',
              factors: ['ML service unavailable'],
              direction: 'maintain'
            },
            impact: {
              revenue_change: 0,
              revenue_change_pct: 0,
              profit_change: 0,
              estimated_units: 0,
              margin: 0
            }
          });
        }
      }
    }
    
    res.json({
      success: true,
      data: suggestions,
      total: suggestions.length
    });
    
  } catch (err) {
    console.error('Get pricing suggestions error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to get pricing suggestions',
      error: err.message
    });
  }
};

// ✅ Get single product pricing suggestion
export const getProductPricing = async (req, res) => {
  try {
    const { productId } = req.params;
    
    const product = await Product.findByPk(productId, {
      include: [
        // ❗ FIX: Use DemandData model with 'demand' alias
        { 
          model: DemandData, 
          as: 'demand',
          order: [['date', 'DESC']],
          limit: 30 
        },
        { model: PricingSuggestion, as: 'pricingSuggestion' }
      ]
    });
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    // Get competitor prices
    const competitors = await Competitor.findAll({
      where: { productId: product.id }
    });
    
    const competitorPrices = competitors
      .map(c => safeParseFloat(c.price))
      .filter(p => p > 0);
    
    const currentPrice = safeParseFloat(product.currentPrice, 100);
    const costPrice = safeParseFloat(product.costPrice, currentPrice * 0.6);
    
    const productData = {
      current_price: currentPrice,
      cost_price: costPrice,
      // ❗ FIX: Get forecast from the most recent 'demand' entry
      demand_forecast: safeParseFloat(product.demand?.[0]?.quantity_sold, 100),
      competitor_prices: competitorPrices.length > 0 ? competitorPrices : [currentPrice],
      stock_level: safeParseInt(product.stockQuantity, 100),
      days_in_stock: safeParseInt(product.days_in_stock, 30),
      seasonality_index: safeParseFloat(product.seasonality_index, 1.0),
      category_avg_price: safeParseFloat(product.category_avg_price, currentPrice),
      // ❗ FIX: Use real historical data, reversed to be chronological
      historical_sales: (product.demand && product.demand.length > 0)
        ? product.demand.map(d => d.quantity_sold).reverse()
        : [100]
    };
    
    // Get ML prediction
    const prediction = await callPythonModel('predict_price.py', productData);
    
    // Save suggestion
    await PricingSuggestion.upsert({
      product_id: product.id,
      current_price: productData.current_price,
      suggested_price: prediction.suggested_price,
      min_price: prediction.price_range.min,
      max_price: prediction.price_range.max,
      confidence: prediction.confidence,
      reasoning: JSON.stringify(prediction.reasoning),
      impact: JSON.stringify(prediction.impact),
      change_percentage: prediction.change_percentage,
      status: 'pending'
    });
    
    res.json({
      success: true,
      data: {
        product: {
          id: product.id,
          name: product.name,
          category: product.category,
          current_price: productData.current_price
        },
        ...prediction,
        competitors: competitors.map(c => ({
          name: c.competitorName,
          price: safeParseFloat(c.price)
        }))
      }
    });
    
  } catch (err) {
    console.error('Get product pricing error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to get pricing suggestion',
      error: err.message
    });
  }
};

// ✅ Apply pricing suggestion
export const applyPricingSuggestion = async (req, res) => {
  try {
    const { productId } = req.params;
    const { accepted_price } = req.body;
    
    const product = await Product.findByPk(productId);
    const suggestion = await PricingSuggestion.findOne({
      where: { product_id: productId }
    });
    
    if (!product || !suggestion) {
      return res.status(404).json({
        success: false,
        message: 'Product or suggestion not found'
      });
    }
    
    const oldPrice = product.currentPrice;
    const newPrice = safeParseFloat(accepted_price);
    
    // Update product price
    await product.update({ currentPrice: newPrice }); // Use correct property
    
    // Update suggestion status
    await suggestion.update({
      status: 'applied',
      accepted_price: newPrice,
      applied_at: new Date()
    });
    
    console.log(`✅ Price updated: ${product.name} from ₹${oldPrice} to ₹${newPrice}`);
    
    res.json({
      success: true,
      message: 'Price updated successfully',
      data: {
        product_id: product.id,
        old_price: oldPrice,
        new_price: newPrice
      }
    });
    
  } catch (err) {
    console.error('Apply pricing error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to apply pricing',
      error: err.message
    });
  }
};

// ✅ Dismiss pricing suggestion
export const dismissPricingSuggestion = async (req, res) => {
  // ... (This function remains the same)
  try {
    const { productId } = req.params;
    
    await PricingSuggestion.update(
      { status: 'dismissed', dismissed_at: new Date() },
      { where: { product_id: productId } }
    );
    
    res.json({
      success: true,
      message: 'Suggestion dismissed'
    });
    
  } catch (err) {
    console.error('Dismiss pricing error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to dismiss suggestion',
      error: err.message
    });
  }
};

// ✅ Apply all suggestions (bulk update)
export const applyAllSuggestions = async (req, res) => {
  // ... (This function remains the same, but with correct property names)
  try {
    const suggestions = await PricingSuggestion.findAll({
      where: { status: 'pending' },
      include: [{ model: Product, as: 'product' }]
    });
    
    let updated = 0;
    const results = [];
    
    for (const suggestion of suggestions) {
      try {
        const oldPrice = suggestion.product.currentPrice; // Use correct property
        const newPrice = safeParseFloat(suggestion.suggested_price);
        
        await suggestion.product.update({ currentPrice: newPrice }); // Use correct property
        await suggestion.update({
          status: 'applied',
          accepted_price: newPrice,
          applied_at: new Date()
        });
        
        updated++;
        results.push({
          product_id: suggestion.product.id,
          name: suggestion.product.name,
          old_price: oldPrice,
          new_price: newPrice
        });
        
      } catch (err) {
        console.error(`Failed to update ${suggestion.product.name}:`, err);
      }
    }
    
    res.json({
      success: true,
      message: `Successfully updated ${updated} products`,
      data: results
    });
    
  } catch (err) {
    console.error('Apply all suggestions error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to apply suggestions',
      error: err.message
    });
  }
};

// ✅ Retrain model with historical data
export const retrainModel = async (req, res) => {
  try {
    // Get historical pricing decisions
    const trainingData = await PricingSuggestion.findAll({
      where: { status: 'applied' },
      include: [
        { 
          model: Product, 
          as: 'product',
          // ❗ FIX: Use DemandData model with 'demand' alias
          include: [{ 
            model: DemandData, 
            as: 'demand',
            order: [['date', 'DESC']],
            limit: 30
          }]
        }
      ],
      limit: 1000,
      order: [['applied_at', 'DESC']]
    });
    
    // Format for ML model
    const formattedData = trainingData
      .map(s => {
        const currentPrice = safeParseFloat(s.current_price, 100);
        const costPrice = safeParseFloat(s.product.costPrice, currentPrice * 0.6);
        // ❗ FIX: Get forecast from the most recent 'demand' entry
        const demandForecast = safeParseFloat(s.product.demand?.[0]?.quantity_sold, 100);
        const acceptedPrice = safeParseFloat(s.accepted_price);
        
        return {
          current_price: currentPrice,
          cost_price: costPrice,
          demand_forecast: demandForecast,
          competitor_prices: [currentPrice], // Still a stub, but that's a future improvement
          stock_level: safeParseInt(s.product.stockQuantity, 100),
          days_in_stock: safeParseInt(s.product.days_in_stock, 30),
          seasonality_index: safeParseFloat(s.product.seasonality_index, 1.0),
          category_avg_price: safeParseFloat(s.product.category_avg_price, currentPrice),
          // ❗ FIX: Use real historical data, reversed to be chronological
          historical_sales: (s.product.demand && s.product.demand.length > 0)
            ? s.product.demand.map(d => d.quantity_sold).reverse()
            : [100],
          optimal_price: acceptedPrice,
          revenue_generated: acceptedPrice * demandForecast
        };
      })
      .filter(item => item.optimal_price > 0);
    
    if (formattedData.length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient training data. Need at least 10 applied suggestions.'
      });
    }
    
    // Call Python training script
    const result = await callPythonModel('train_model.py', {
      training_data: formattedData
    });
    
    res.json({
      success: true,
      message: 'Model retrained successfully',
      data: result
    });
    
  } catch (err) {
    console.error('Retrain model error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to retrain model',
      error: err.message
    });
  }
};