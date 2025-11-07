// backend/src/controllers/productController.js
import Product from "../models/Product.js";
import { Op } from "sequelize";
import DemandData from "../models/DemandData.js"; // <-- FIX: Corrected import path

/**
 * @desc Get all products
 * @route GET /api/products
 * @access Private
 */
export const getProducts = async (req, res) => {
  try {
    const { category, status, search } = req.query;
    const userId = req.user.id;
    const where = { userId };

    if (category) where.category = category;
    if (status) where.status = status;
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { sku: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const products = await Product.findAll({
      where,
      order: [['created_at', 'DESC']] // <-- FIX: 'createdAt' changed to 'created_at'
    });

    res.status(200).json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    console.error("❌ Get products error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching products",
      error: error.message,
    });
  }
};

// ... (getProduct, createProduct, updateProduct, deleteProduct, getProductStats, getCategories, getLowStock)
// ... (All these functions are correct and can stay as you have them)

/**
 * @desc Get single product
 * @route GET /api/products/:id
 * @access Private
 */
export const getProduct = async (req, res) => {
  try {
    const product = await Product.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }
    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error("❌ Get product error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching product",
      error: error.message,
    });
  }
};

/**
 * @desc Create new product
 * @route POST /api/products
 * @access Private
 */
export const createProduct = async (req, res) => {
  try {
    const {
      name,
      sku,
      category,
      currentPrice,
      costPrice,
      stockQuantity,
      minPrice,
      maxPrice,
      description,
      imageUrl,
    } = req.body;
    if (!name || !sku || !currentPrice) {
      return res.status(400).json({
        success: false,
        message: "Please provide name, SKU, and current price",
      });
    }
    const product = await Product.create({
      userId: req.user.id,
      name,
      sku,
      category,
      currentPrice,
      costPrice,
      stockQuantity,
      minPrice,
      maxPrice,
      description,
      imageUrl,
      status: "active",
    });
    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: product,
    });
  } catch (error) {
    console.error("❌ Create product error:", error);
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({
        success: false,
        message: "Product with this SKU already exists",
      });
    }
    res.status(500).json({
      success: false,
      message: "Error creating product",
      error: error.message,
    });
  }
};

/**
 * @desc Update product
 * @route PUT /api/products/:id
 * @access Private
 */
export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }
    await product.update(req.body);
    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: product,
    });
  } catch (error) {
    console.error("❌ Update product error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating product",
      error: error.message,
    });
  }
};

/**
 * @desc Delete product
 * @route DELETE /api/products/:id
 * @access Private
 */
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }
    await product.destroy();
    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("❌ Delete product error:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting product",
      error: error.message,
    });
  }
};

/**
 * @desc Get product statistics (for dashboard)
 * @route GET /api/products/stats
 * @access Private
 */
export const getProductStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const products = await Product.findAll({
      where: { userId, status: "active" },
    });
    if (!products.length) {
      return res.status(200).json({
        success: true,
        data: {
          total_products: 0,
          active_products: 0,
          avg_price: 0,
          total_stock: 0,
          total_inventory_value: 0,
        },
      });
    }
    const totalProducts = products.length;
    const totalStock = products.reduce((sum, p) => sum + (parseInt(p.stockQuantity) || 0), 0);
    const avgPrice =
      products.reduce((sum, p) => sum + parseFloat(p.currentPrice || 0), 0) / totalProducts;
    const totalValue = products.reduce(
      (sum, p) => sum + parseFloat(p.currentPrice || 0) * (parseInt(p.stockQuantity) || 0),
      0
    );
    const stats = {
      total_products: totalProducts,
      active_products: totalProducts,
      avg_price: avgPrice,
      total_stock: totalStock,
      total_inventory_value: totalValue,
    };
    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("❌ Get stats error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching statistics",
      error: error.message,
    });
  }
};

/**
 * @desc Get all categories
 * @route GET /api/products/categories
 * @access Private
 */
export const getCategories = async (req, res) => {
  try {
    const products = await Product.findAll({
      where: {
        userId: req.user.id,
        category: { [Op.not]: null },
      },
      attributes: ["category"],
      group: ["category"],
    });
    const categories = products.map((p) => p.category);
    res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error("❌ Get categories error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching categories",
      error: error.message,
    });
  }
};

/**
 * @desc Get low stock products
 * @route GET /api/products/low-stock
 * @access Private
 */
export const getLowStock = async (req, res) => {
  try {
    const threshold = req.query.threshold || 10;
    const products = await Product.findAll({
      where: {
        userId: req.user.id,
        stockQuantity: { [Op.lte]: threshold },
        status: "active",
      },
      order: [["stockQuantity", "ASC"]],
    });
    res.status(200).json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    console.error("❌ Get low stock error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching low stock products",
      error: error.message,
    });
  }
};

/**
 * @desc Get sales history (demand data) for a single product
 * @route GET /api/products/:id/history
 * @access Private
 */
export const getProductSalesHistory = async (req, res) => {
  try {
    const product = await Product.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const history = await DemandData.findAll({
      where: { productId: req.params.id },
      order: [["date", "ASC"]],
    });

    res.status(200).json({
      success: true,
      data: history,
    });

  } catch (error) {
    console.error("❌ Get product history error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching product history",
      error: error.message,
    });
  }
};