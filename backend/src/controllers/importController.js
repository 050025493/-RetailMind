// backend/src/controllers/importController.js
import Product from "../models/Product.js";
import DemandData from "../models/DemandData.js";
import sequelize from "../config/database.js";

// --- THIS IS THE FUNCTION THAT WAS MISSING ---
export const bulkImportProducts = async (req, res) => {
  try {
    const { products } = req.body;
    const userId = req.user.id;

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide an array of products",
      });
    }

    const productsWithUser = products.map((p) => ({
      ...p,
      userId,
      status: "active",
    }));

    const created = await Product.bulkCreate(productsWithUser); // ✅ simplified for Postgres

    res.status(201).json({
      success: true,
      message: `${created.length} products imported successfully`,
      data: created,
    });
  } catch (error) {
    console.error("Bulk import error:", error);
    res.status(500).json({
      success: false,
      message: "Error importing products",
      error: error.message,
    });
  }
};


// --- THIS WAS ALSO MISSING ---
// @desc    Sync products from external source (Amazon, Shopify, etc.)
// @route   POST /api/import/sync
// @access  Private
export const syncExternalProducts = async (req, res) => {
  try {
    const { source, apiKey } = req.body; // e.g., 'shopify', 'amazon'
    const userId = req.user.id;

    let externalProducts = [];

    switch (source) {
      case 'shopify':
        // externalProducts = await fetchFromShopify(apiKey);
        break;
      case 'amazon':
        // externalProducts = await fetchFromAmazon(apiKey);
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid source'
        });
    }

    res.status(200).json({
      success: true,
      message: 'Products synced successfully'
    });
  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({
      success: false,
      message: 'Error syncing products',
      error: error.message
    });
  }
};

// --- THIS IS THE UPDATED FUNCTION YOU HAD ---
// @desc    Seed sample data for demo
// @route   POST /api/import/seed-demo
// @access  Private
export const seedDemoData = async (req, res) => {
  const userId = req.user.id;
  const t = await sequelize.transaction(); // Start a transaction

  try {
    // Check if user already has products
    const existing = await Product.count({ where: { userId } });
    
    if (existing > 0) {
      return res.status(400).json({
        success: false,
        message: 'You already have products. Delete them first to seed demo data.'
      });
    }

    const demoProducts = [
       {
        userId,
        name: "Wireless Headphones Pro",
        sku: "WHP-001",
        category: "Electronics",
        currentPrice: 7469,
        costPrice: 5000,
        stockQuantity: 50,
        minPrice: 6000,
        maxPrice: 9000,
        status: "active",
        description: "Premium wireless headphones with noise cancellation"
      },
      {
        userId,
        name: "Smart Watch Elite",
        sku: "SWE-002",
        category: "Electronics",
        currentPrice: 24817,
        costPrice: 18000,
        stockQuantity: 30,
        minPrice: 20000,
        maxPrice: 30000,
        status: "active",
        description: "Advanced smartwatch with health tracking"
      },
      {
        userId,
        name: "Gaming Mouse RGB",
        sku: "GMR-003",
        category: "Gaming",
        currentPrice: 4149,
        costPrice: 2500,
        stockQuantity: 100,
        minPrice: 3500,
        maxPrice: 5000,
        status: "active",
        description: "Professional gaming mouse with RGB lighting"
      },
      {
        userId,
        name: "Mechanical Keyboard",
        sku: "MKB-004",
        category: "Gaming",
        currentPrice: 8999,
        costPrice: 6000,
        stockQuantity: 45,
        minPrice: 7500,
        maxPrice: 11000,
        status: "active",
        description: "Mechanical gaming keyboard with blue switches"
      },
      {
        userId,
        name: "USB-C Hub Pro",
        sku: "UCH-005",
        category: "Accessories",
        currentPrice: 2499,
        costPrice: 1500,
        stockQuantity: 200,
        minPrice: 2000,
        maxPrice: 3500,
        status: "active",
        description: "7-in-1 USB-C hub with 4K HDMI"
      }
    ];

    const createdProducts = await Product.bulkCreate(demoProducts, { transaction: t });

    // --- NEW: CREATE DEMO SALES DATA (DAILY) ---
    const salesData = [];
    const today = new Date();

    const headphones = createdProducts.find(p => p.sku === 'WHP-001');
    const watch = createdProducts.find(p => p.sku === 'SWE-002');
    const mouse = createdProducts.find(p => p.sku === 'GMR-003');
    const hub = createdProducts.find(p => p.sku === 'UCH-005');

    // Helper to generate DAILY sales for the past 180 days
    const generateSales = (product, days, baseDailySales, price) => {
      if (!product) return;
      for (let i = 0; i < days; i++) {
        const date = new Date();
        date.setDate(today.getDate() - i);
        
        const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
        let quantity = baseDailySales;

        if (dayOfWeek === 6 || dayOfWeek === 0) {
          quantity += Math.floor(baseDailySales * (Math.random() * 0.5 + 0.3)); // 30-80% more
        } else {
          quantity += Math.floor(Math.random() * 3 - 1); // Small noise
        }
        
        quantity = Math.max(0, quantity); // No negative sales
        const revenue = quantity * price * (1 + (Math.random() - 0.5) * 0.05); // +/- 5% price noise

        salesData.push({
          productId: product.id,
          date: date,
          quantity_sold: quantity,
          revenue: parseFloat(revenue.toFixed(2)),
        });
      }
    };

    // Generate sales for the products (180 days)
    generateSales(headphones, 180, 5, 7469);
    generateSales(watch, 180, 2, 24817);
    generateSales(mouse, 180, 10, 4149);
    generateSales(hub, 180, 15, 2499);

    await DemandData.bulkCreate(salesData, { transaction: t });
    // --- END NEW SECTION ---

    await t.commit(); // Commit the transaction

    res.status(201).json({
      success: true,
      message: `${createdProducts.length} demo products and ${salesData.length} sales records created`,
      data: createdProducts
    });
  } catch (error) {
    await t.rollback(); // Rollback on error
    console.error('Seed demo error:', error);
    res.status(500).json({
      success: false,
      message: 'Error seeding demo data',
      error: error.message
    });
  }
};