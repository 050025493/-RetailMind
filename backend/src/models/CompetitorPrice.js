// backend/src/models/CompetitorPrice.js
import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import Product from "./Product.js";

const CompetitorPrice = sequelize.define("CompetitorPrice", {
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
  competitorName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'competitor_name'
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  url: {
    type: DataTypes.TEXT,
  },
  lastScrapedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'last_scraped_at'
  }
}, {
  tableName: 'competitor_prices',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['product_id', 'competitor_name']
    }
  ]
});

const CompetitorPriceHistory = sequelize.define("CompetitorPriceHistory", {
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
  competitorName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'competitor_name'
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  recordedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'recorded_at'
  },
  priceChange: {
    type: DataTypes.DECIMAL(10, 2),
    field: 'price_change'
  },
  changePercentage: {
    type: DataTypes.DECIMAL(5, 2),
    field: 'change_percentage'
  }
}, {
  tableName: 'competitor_price_history',
  underscored: true,
  timestamps: false
});

// Relationships
Product.hasMany(CompetitorPrice, { foreignKey: 'productId', as: 'competitorPrices' });
CompetitorPrice.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

Product.hasMany(CompetitorPriceHistory, { foreignKey: 'productId', as: 'priceHistory' });
CompetitorPriceHistory.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

export { CompetitorPrice, CompetitorPriceHistory };