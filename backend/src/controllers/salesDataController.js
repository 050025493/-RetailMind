import Papa from 'papaparse';
import Product from '../models/Product.js';
import DemandData from '../models/DemandData.js';
import sequelize from '../config/database.js';
import { Op } from 'sequelize';

/**
 * @desc Parse and validate CSV data
 * @route POST /api/sales-data/preview
 * @access Private
 */
export const previewCSV = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    let csvString = req.file.buffer.toString('utf-8');

    // Remove BOM if present
    if (csvString.charCodeAt(0) === 0xFEFF) {
      csvString = csvString.slice(1);
    }

    // Parse CSV
    const parseResult = Papa.parse(csvString, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      transformHeader: (header) => header.trim().toLowerCase()
    });

    if (parseResult.errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'CSV parsing errors',
        errors: parseResult.errors
      });
    }

    const data = parseResult.data;

    // Validate required columns
    const requiredColumns = ['date', 'quantity_sold'];
    const optionalColumns = ['sku', 'product_name', 'revenue', 'price'];

    const headers = Object.keys(data[0] || {});
    const missingColumns = requiredColumns.filter(col => !headers.includes(col));

    if (missingColumns.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required columns: ${missingColumns.join(', ')}`,
        requiredColumns,
        optionalColumns,
        foundColumns: headers
      });
    }

    // Validate data
    const validationErrors = [];
    const validRows = [];

    data.forEach((row, index) => {
      const errors = [];

      // Validate date - supports YYYY-MM-DD, MM/DD/YYYY, DD/MM/YYYY
      const dateVal = row.date;
      let date = new Date(dateVal);

      // Fallback for Excel dates (serial numbers) not implemented here, assuming string dates
      // If date is invalid, try some manual parsing if needed, but ISO is standard.

      if (isNaN(date.getTime())) {
        errors.push(`Invalid date format '${dateVal}' at row ${index + 1}. Use YYYY-MM-DD.`);
      }

      // Validate quantity_sold
      if (!row.quantity_sold || row.quantity_sold < 0) {
        errors.push(`Invalid quantity_sold at row ${index + 1}`);
      }

      // Validate revenue if present
      if (row.revenue !== undefined && row.revenue < 0) {
        errors.push(`Invalid revenue at row ${index + 1}`);
      }

      if (errors.length > 0) {
        validationErrors.push(...errors);
      } else {
        validRows.push({
          date: date.toISOString().split('T')[0],
          quantity_sold: parseInt(row.quantity_sold),
          revenue: row.revenue ? parseFloat(row.revenue) : null,
          sku: row.sku || null,
          product_name: row.product_name || null
        });
      }
    });

    res.status(200).json({
      success: true,
      message: 'CSV parsed successfully',
      data: {
        totalRows: data.length,
        validRows: validRows.length,
        invalidRows: validationErrors.length,
        preview: validRows.slice(0, 10), // First 10 rows
        validationErrors: validationErrors.slice(0, 20), // First 20 errors
        columns: headers
      }
    });

  } catch (error) {
    console.error('Preview CSV error:', error);
    res.status(500).json({
      success: false,
      message: 'Error parsing CSV',
      error: error.message
    });
  }
};

/**
 * @desc Import sales data from CSV
 * @route POST /api/sales-data/import
 * @access Private
 */
export const importSalesData = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { productId, csvData, options = {} } = req.body;
    const userId = req.user.id;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required'
      });
    }

    if (!csvData || !Array.isArray(csvData)) {
      return res.status(400).json({
        success: false,
        message: 'Valid CSV data is required'
      });
    }

    // Verify product belongs to user
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

    // Handle duplicates based on options
    const {
      skipDuplicates = true,
      updateDuplicates = false,
      deleteExisting = false
    } = options;

    // Delete existing data if requested
    if (deleteExisting) {
      await DemandData.destroy({
        where: { productId },
        transaction: t
      });
    }

    // Prepare data for insertion
    const salesDataToInsert = [];
    const skippedRows = [];
    const updatedRows = [];

    for (const row of csvData) {
      const date = new Date(row.date).toISOString().split('T')[0];
      const quantity_sold = parseInt(row.quantity_sold);

      // Calculate revenue if not provided
      let revenue = row.revenue ? parseFloat(row.revenue) : null;
      if (!revenue && product.currentPrice) {
        revenue = quantity_sold * parseFloat(product.currentPrice);
      }

      // Check for existing record
      const existing = await DemandData.findOne({
        where: { productId, date },
        transaction: t
      });

      if (existing) {
        if (updateDuplicates) {
          await existing.update({
            quantity_sold,
            revenue
          }, { transaction: t });
          updatedRows.push({ date, quantity_sold });
        } else if (skipDuplicates) {
          skippedRows.push({ date, reason: 'Duplicate' });
        }
      } else {
        salesDataToInsert.push({
          productId,
          date,
          quantity_sold,
          revenue: revenue || 0
        });
      }
    }

    // Bulk insert new records
    let insertedCount = 0;
    if (salesDataToInsert.length > 0) {
      await DemandData.bulkCreate(salesDataToInsert, { transaction: t });
      insertedCount = salesDataToInsert.length;
    }

    await t.commit();

    res.status(201).json({
      success: true,
      message: 'Sales data imported successfully',
      data: {
        productId,
        productName: product.name,
        inserted: insertedCount,
        updated: updatedRows.length,
        skipped: skippedRows.length,
        total: csvData.length,
        skippedRows: skippedRows.slice(0, 10) // Sample of skipped
      }
    });

  } catch (error) {
    await t.rollback();
    console.error('Import sales data error:', error);
    res.status(500).json({
      success: false,
      message: 'Error importing sales data',
      error: error.message
    });
  }
};

/**
 * @desc Import sales data with auto product matching
 * @route POST /api/sales-data/import-with-matching
 * @access Private
 */
export const importWithProductMatching = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { csvData, matchBy = 'sku' } = req.body; // matchBy: 'sku' or 'name'
    const userId = req.user.id;

    if (!csvData || !Array.isArray(csvData)) {
      return res.status(400).json({
        success: false,
        message: 'Valid CSV data is required'
      });
    }

    const results = {
      inserted: 0,
      skipped: 0,
      errors: []
    };

    for (const row of csvData) {
      try {
        // Find product by SKU or name
        let product;

        if (matchBy === 'sku' && row.sku) {
          product = await Product.findOne({
            where: {
              sku: row.sku.toString().trim(),
              userId
            }
          });
        } else if (matchBy === 'name' && row.product_name) {
          product = await Product.findOne({
            where: {
              name: { [Op.iLike]: `%${row.product_name.toString().trim()}%` },
              userId
            }
          });
        }

        if (!product) {
          results.errors.push({
            row,
            error: `Product not found (${matchBy}: ${row[matchBy]})`
          });
          results.skipped++;
          continue;
        }

        // Insert sales data
        const date = new Date(row.date).toISOString().split('T')[0];
        const quantity_sold = parseInt(row.quantity_sold);
        const revenue = row.revenue
          ? parseFloat(row.revenue)
          : quantity_sold * parseFloat(product.currentPrice);

        await DemandData.create({
          productId: product.id,
          date,
          quantity_sold,
          revenue
        }, { transaction: t });

        results.inserted++;

      } catch (err) {
        results.errors.push({
          row,
          error: err.message
        });
        results.skipped++;
      }
    }

    await t.commit();

    res.status(201).json({
      success: true,
      message: 'Sales data imported with product matching',
      data: results
    });

  } catch (error) {
    await t.rollback();
    console.error('Import with matching error:', error);
    res.status(500).json({
      success: false,
      message: 'Error importing sales data',
      error: error.message
    });
  }
};

/**
 * @desc Get sample CSV template
 * @route GET /api/sales-data/template
 * @access Private
 */
export const getCSVTemplate = async (req, res) => {
  try {
    const { includeProduct = false } = req.query;

    let csvContent = '';

    if (includeProduct) {
      // Template with product matching
      csvContent = `sku,product_name,date,quantity_sold,revenue
PROD-001,Wireless Headphones,2024-01-01,45,33750
PROD-001,Wireless Headphones,2024-01-02,52,39000
PROD-002,Smart Watch,2024-01-01,30,74400`;
    } else {
      // Template for single product
      csvContent = `date,quantity_sold,revenue
2024-01-01,45,33750
2024-01-02,52,39000
2024-01-03,48,36000`;
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=sales_data_template.csv');
    res.send(csvContent);

  } catch (error) {
    console.error('Get template error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating template',
      error: error.message
    });
  }
};

/**
 * @desc Get sales data statistics
 * @route GET /api/sales-data/stats/:productId
 * @access Private
 */
export const getSalesStats = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user.id;

    // Verify product ownership
    const product = await Product.findOne({
      where: { id: productId, userId }
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Get sales data statistics
    const salesData = await DemandData.findAll({
      where: { productId },
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalRecords'],
        [sequelize.fn('MIN', sequelize.col('date')), 'earliestDate'],
        [sequelize.fn('MAX', sequelize.col('date')), 'latestDate'],
        [sequelize.fn('SUM', sequelize.col('quantity_sold')), 'totalQuantity'],
        [sequelize.fn('SUM', sequelize.col('revenue')), 'totalRevenue'],
        [sequelize.fn('AVG', sequelize.col('quantity_sold')), 'avgDailyQuantity']
      ],
      raw: true
    });

    const stats = salesData[0];

    // Calculate date range in days
    let daysCovered = 0;
    if (stats.earliestDate && stats.latestDate) {
      const start = new Date(stats.earliestDate);
      const end = new Date(stats.latestDate);
      daysCovered = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    }

    res.status(200).json({
      success: true,
      data: {
        productId: product.id,
        productName: product.name,
        totalRecords: parseInt(stats.totalRecords || 0),
        earliestDate: stats.earliestDate,
        latestDate: stats.latestDate,
        daysCovered,
        totalQuantitySold: parseInt(stats.totalQuantity || 0),
        totalRevenue: parseFloat(stats.totalRevenue || 0),
        avgDailyQuantity: parseFloat(parseFloat(stats.avgDailyQuantity || 0).toFixed(2)),
        readyForForecast: daysCovered >= 30
      }
    });

  } catch (error) {
    console.error('Get sales stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching sales statistics',
      error: error.message
    });
  }
};