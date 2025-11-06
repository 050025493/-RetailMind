import Product from "../models/Product.js";
import { Op } from "sequelize";

// @desc    Get all products
// @route   GET /api/products
// @access  Private
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
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching products',
      error: error.message,
    });
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Private
export const getProduct = async (req, res) => {
  try {
    const product = await Product.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching product',
      error: error.message,
    });
  }
};

// @desc    Create new product
// @route   POST /api/products
// @access  Private
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
      imageUrl
    } = req.body;

    // Validation
    if (!name || !sku || !currentPrice) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, SKU, and current price',
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
      imageUrl
    });

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product,
    });
  } catch (error) {
    console.error('Create product error:', error);
    
    // Handle duplicate SKU
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'Product with this SKU already exists',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error creating product',
      error: error.message,
    });
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private
export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    await product.update(req.body);

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: product,
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating product',
      error: error.message,
    });
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    await product.destroy();

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting product',
      error: error.message,
    });
  }
};

// @desc    Get product statistics
// @route   GET /api/products/stats
// @access  Private
export const getProductStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const products = await Product.findAll({
      where: { userId, status: 'active' }
    });

    const stats = {
      total_products: products.length,
      active_products: products.length,
      avg_price: products.reduce((sum, p) => sum + parseFloat(p.currentPrice), 0) / products.length || 0,
      total_stock: products.reduce((sum, p) => sum + parseInt(p.stockQuantity || 0), 0),
      total_inventory_value: products.reduce((sum, p) => sum + (parseFloat(p.currentPrice) * parseInt(p.stockQuantity || 0)), 0)
    };

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics',
      error: error.message,
    });
  }
};

// @desc    Get categories
// @route   GET /api/products/categories
// @access  Private
export const getCategories = async (req, res) => {
  try {
    const products = await Product.findAll({
      where: { 
        userId: req.user.id,
        category: { [Op.not]: null }
      },
      attributes: ['category'],
      group: ['category']
    });

    const categories = products.map(p => p.category);

    res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching categories',
      error: error.message,
    });
  }
};

// @desc    Get low stock products
// @route   GET /api/products/low-stock
// @access  Private
export const getLowStock = async (req, res) => {
  try {
    const threshold = req.query.threshold || 10;
    const products = await Product.findAll({
      where: {
        userId: req.user.id,
        stockQuantity: { [Op.lte]: threshold },
        status: 'active'
      },
      order: [['stockQuantity', 'ASC']]
    });

    res.status(200).json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    console.error('Get low stock error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching low stock products',
      error: error.message,
    });
  }
};