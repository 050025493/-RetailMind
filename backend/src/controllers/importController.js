// backend/src/controllers/importController.js
import Product from "../models/Product.js";
import { Op } from "sequelize";

// @desc    Bulk import products from CSV/API
// @route   POST /api/import/products
// @access  Private
export const bulkImportProducts = async (req, res) => {
  try {
    const { products } = req.body; // Array of products
    const userId = req.user.id;

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of products'
      });
    }

    // Add userId to each product
    const productsWithUser = products.map(p => ({
      ...p,
      userId,
      status: 'active'
    }));

    // Bulk create with update on conflict
    const created = await Product.bulkCreate(productsWithUser, {
      updateOnDuplicate: ['name', 'currentPrice', 'stockQuantity', 'updatedAt']
    });

    res.status(201).json({
      success: true,
      message: `${created.length} products imported successfully`,
      data: created
    });
  } catch (error) {
    console.error('Bulk import error:', error);
    res.status(500).json({
      success: false,
      message: 'Error importing products',
      error: error.message
    });
  }
};

// @desc    Sync products from external source (Amazon, Shopify, etc.)
// @route   POST /api/import/sync
// @access  Private
export const syncExternalProducts = async (req, res) => {
  try {
    const { source, apiKey } = req.body; // e.g., 'shopify', 'amazon'
    const userId = req.user.id;

    // This is where you'd integrate with external APIs
    // For now, we'll just demonstrate the structure

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

    // Import products
    // ... similar to bulkImportProducts

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

// @desc    Seed sample data for demo
// @route   POST /api/import/seed-demo
// @access  Private
export const seedDemoData = async (req, res) => {
  try {
    const userId = req.user.id;

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

    const created = await Product.bulkCreate(demoProducts);

    res.status(201).json({
      success: true,
      message: `${created.length} demo products created`,
      data: created
    });
  } catch (error) {
    console.error('Seed demo error:', error);
    res.status(500).json({
      success: false,
      message: 'Error seeding demo data',
      error: error.message
    });
  }
};