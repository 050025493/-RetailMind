//promoSimulator
import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import User from "./User.js";
import Product from "./Product.js";

const ProductReview = sequelize.define("ProductReview", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  productId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'products',
      key: 'id'
    },
    field: 'product_id'
  },
  userId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'Users',
      key: 'id'
    },
    field: 'user_id'
  },
  reviewText: {
    type: DataTypes.TEXT,
    allowNull: false,
    field: 'review_text'
  },
  rating: {
    type: DataTypes.INTEGER,
    validate: {
      min: 1,
      max: 5
    }
  },
  sentimentScore: {
    type: DataTypes.DECIMAL(5, 4),
    field: 'sentiment_score'
  },
  sentimentLabel: {
    type: DataTypes.STRING(20),
    field: 'sentiment_label'
  }
}, {
  tableName: 'product_reviews',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

const PromoCampaign = sequelize.define("PromoCampaign", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    },
    field: 'user_id'
  },
  campaignName: {
    type: DataTypes.STRING(200),
    allowNull: false,
    field: 'campaign_name'
  },
  productId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'products',
      key: 'id'
    },
    field: 'product_id'
  },
  discountType: {
    type: DataTypes.STRING(20),
    allowNull: false,
    field: 'discount_type'
  },
  discountValue: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: 'discount_value'
  },
  startDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'start_date'
  },
  endDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'end_date'
  },
  durationDays: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'duration_days'
  },
  status: {
    type: DataTypes.STRING(20),
    defaultValue: 'draft'
  },
  predictedDemandLift: {
    type: DataTypes.DECIMAL(5, 2),
    field: 'predicted_demand_lift'
  },
  predictedRevenue: {
    type: DataTypes.DECIMAL(12, 2),
    field: 'predicted_revenue'
  },
  predictedUnitsSold: {
    type: DataTypes.INTEGER,
    field: 'predicted_units_sold'
  },
  sentimentImpactScore: {
    type: DataTypes.DECIMAL(5, 4),
    field: 'sentiment_impact_score'
  },
  confidenceScore: {
    type: DataTypes.DECIMAL(5, 2),
    field: 'confidence_score'
  },
  actualRevenue: {
    type: DataTypes.DECIMAL(12, 2),
    field: 'actual_revenue'
  },
  actualUnitsSold: {
    type: DataTypes.INTEGER,
    field: 'actual_units_sold'
  },
  actualDemandLift: {
    type: DataTypes.DECIMAL(5, 2),
    field: 'actual_demand_lift'
  }
}, {
  tableName: 'promo_campaigns',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

const PromoSimulation = sequelize.define("PromoSimulation", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    },
    field: 'user_id'
  },
  productId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'products',
      key: 'id'
    },
    field: 'product_id'
  },
  discountPercentage: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    field: 'discount_percentage'
  },
  durationDays: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'duration_days'
  },
  currentPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: 'current_price'
  },
  avgDailySales: {
    type: DataTypes.DECIMAL(10, 2),
    field: 'avg_daily_sales'
  },
  stockAvailable: {
    type: DataTypes.INTEGER,
    field: 'stock_available'
  },
  sentimentScore: {
    type: DataTypes.DECIMAL(5, 4),
    field: 'sentiment_score'
  },
  predictedRevenue: {
    type: DataTypes.DECIMAL(12, 2),
    field: 'predicted_revenue'
  },
  predictedUnitsSold: {
    type: DataTypes.INTEGER,
    field: 'predicted_units_sold'
  },
  predictedDemandLift: {
    type: DataTypes.DECIMAL(5, 2),
    field: 'predicted_demand_lift'
  },
  breakEvenUnits: {
    type: DataTypes.INTEGER,
    field: 'break_even_units'
  },
  roiPercentage: {
    type: DataTypes.DECIMAL(5, 2),
    field: 'roi_percentage'
  }
}, {
  tableName: 'promo_simulations',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

// Relationships
Product.hasMany(ProductReview, { foreignKey: 'productId', as: 'reviews' });
ProductReview.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

User.hasMany(ProductReview, { foreignKey: 'userId', as: 'reviews' });
ProductReview.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(PromoCampaign, { foreignKey: 'userId', as: 'promoCampaigns' });
PromoCampaign.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Product.hasMany(PromoCampaign, { foreignKey: 'productId', as: 'campaigns' });
PromoCampaign.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

User.hasMany(PromoSimulation, { foreignKey: 'userId', as: 'promoSimulations' });
PromoSimulation.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Product.hasMany(PromoSimulation, { foreignKey: 'productId', as: 'simulations' });
PromoSimulation.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

export  { ProductReview, PromoCampaign, PromoSimulation };