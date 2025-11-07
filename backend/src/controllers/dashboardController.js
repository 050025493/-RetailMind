import { query } from '../config/database.js';

// @desc    Get dashboard statistics
// @route   GET /api/dashboard/stats
// @access  Private
export const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. Get stats from the 'products' table
    const productStatsQuery = `
      SELECT 
        COUNT(DISTINCT p.id) as total_products,
        AVG(CASE 
          WHEN p.cost_price > 0 AND p.current_price > 0
          THEN ((p.current_price - p.cost_price) / p.current_price * 100)
          ELSE 0 
        END) as avg_margin,
        COUNT(CASE WHEN p.stock_quantity <= 10 THEN 1 END) as low_stock_count
      FROM products p
      WHERE p.user_id = $1 
        AND (p.status = 'active' OR p.status IS NULL)
    `;
    const productStatsResult = await query(productStatsQuery, [userId]);
    const productStats = productStatsResult.rows[0];

    // 2. Get TOTAL revenue from the 'demand_data' table
    const revenueQuery = `
      SELECT SUM(dd.revenue) as total_revenue
      FROM demand_data dd
      JOIN products p ON p.id = dd.product_id
      WHERE p.user_id = $1
    `;
    const revenueResult = await query(revenueQuery, [userId]);
    const revenueStats = revenueResult.rows[0];

    // 3. --- THIS IS THE FIX ---
    // We comment this out because the 'competitor_prices' table doesn't exist yet.
    /*
    const alertsQuery = `
      SELECT COUNT(DISTINCT p.id) as price_alerts
      FROM products p
      JOIN competitor_prices cp ON p.id = cp.product_id
      WHERE p.user_id = $1 
        AND p.current_price > cp.price * 1.1
        AND cp.scraped_at > NOW() - INTERVAL '24 hours'
    `;
    const alertsResult = await query(alertsQuery, [userId]);
    const alerts = alertsResult.rows[0];
    */

    // 4. Combine all results
    res.status(200).json({
      success: true,
      data: {
        total_revenue: parseFloat(revenueStats.total_revenue || 0),
        total_products: parseInt(productStats.total_products || 0),
        avg_margin: parseFloat(productStats.avg_margin || 0).toFixed(1),
        price_alerts: 0, // <-- Set to 0 for now
        low_stock_count: parseInt(productStats.low_stock_count || 0),
      },
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard statistics',
      error: error.message,
    });
  }
};


// @desc    Get revenue trend data
// @route   GET /api/dashboard/revenue-trend
// @access  Private
export const getRevenueTrend = async (req, res) => {
  try {
    const userId = req.user.id;
    const months = req.query.months || 6;

    const revenueQuery = `
      SELECT 
        TO_CHAR(dd.date, 'Mon') as month,
        SUM(dd.revenue) as revenue,
        SUM(dd.quantity_sold) as units_sold
      FROM demand_data dd
      JOIN products p ON p.id = dd.product_id
      WHERE p.user_id = $1
        AND dd.date >= NOW() - INTERVAL '${months} months'
      GROUP BY TO_CHAR(dd.date, 'Mon'), DATE_TRUNC('month', dd.date)
      ORDER BY DATE_TRUNC('month', dd.date) ASC
    `;

    const result = await query(revenueQuery, [userId]);

    res.status(200).json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('Revenue trend error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching revenue trend',
      error: error.message,
    });
  }
};

// @desc    Get category sales data
// @route   GET /api/dashboard/category-sales
// @access  Private
export const getCategorySales = async (req, res) => {
  try {
    const userId = req.user.id;

    const categoryQuery = `
      SELECT 
        p.category,
        SUM(dd.revenue) as sales,
        SUM(dd.quantity_sold) as units_sold,
        COUNT(DISTINCT p.id) as product_count
      FROM products p
      LEFT JOIN demand_data dd ON dd.product_id = p.id
        AND dd.date >= NOW() - INTERVAL '30 days'
      WHERE p.user_id = $1 AND p.category IS NOT NULL
      GROUP BY p.category
      ORDER BY sales DESC NULLS LAST
      LIMIT 10
    `;

    const result = await query(categoryQuery, [userId]);

    res.status(200).json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('Category sales error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching category sales',
      error: error.message,
    });
  }
};

// @desc    Get recent alerts
// @route   GET /api/dashboard/alerts
// @access  Private
export const getAlerts = async (req, res) => {
  // --- THIS IS A FIX ---
  // Return an empty array for now, because the 'alerts' table doesn't exist
  return res.status(200).json({
    success: true,
    count: 0,
    data: [],
  });
  // --- END FIX ---
  
  /*
  try {
    const userId = req.user.id;
    const limit = req.query.limit || 10;

    const alertsQuery = `
      SELECT 
        a.id,
        a.alert_type,
        a.severity,
        a.message,
        a.is_read,
        a.created_at,
        p.name as product_name,
        p.id as product_id
      FROM alerts a
      LEFT JOIN products p ON p.id = a.product_id
      WHERE a.user_id = $1
      ORDER BY a.created_at DESC
      LIMIT $2
    `;

    const result = await query(alertsQuery, [userId, limit]);

    res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error('Get alerts error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching alerts',
      error: error.message,
    });
  }
  */
};

// @desc    Mark alert as read
// @route   PUT /api/dashboard/alerts/:id/read
// @access  Private
export const markAlertRead = async (req, res) => {
  // --- THIS IS A FIX ---
  // Just return success, as there is no alert to update
  return res.status(200).json({
    success: true,
    data: { id: req.params.id, is_read: true },
  });
  // --- END FIX ---
  
  /*
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const updateQuery = `
      UPDATE alerts
      SET is_read = true
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `;

    const result = await query(updateQuery, [id, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found',
      });
    }

    res.status(200).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Mark alert read error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating alert',
      error: error.message,
    });
  }
  */
};

// @desc    Get top performing products
// @route   GET /api/dashboard/top-products
// @access  Private
export const getTopProducts = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = req.query.limit || 5;

    const topProductsQuery = `
      SELECT 
        p.id,
        p.name,
        p.current_price,
        p.category,
        SUM(dd.revenue) as total_revenue,
        SUM(dd.quantity_sold) as total_units_sold
      FROM products p
      JOIN demand_data dd ON dd.product_id = p.id
      WHERE p.user_id = $1
        AND dd.date >= NOW() - INTERVAL '30 days'
      GROUP BY p.id, p.name, p.current_price, p.category
      ORDER BY total_revenue DESC
      LIMIT $2
    `;

    const result = await query(topProductsQuery, [userId, limit]);

    res.status(200).json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('Top products error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching top products',
      error: error.message,
    });
  }
};