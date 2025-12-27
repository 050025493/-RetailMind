import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import Product from "./Product.js";

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
    field: 'product_id',
    onDelete: 'CASCADE' // Match your SQL schema
  },
  competitorName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'competitor_name'
  },
  oldPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true, // Matches SQL (nullable by default)
    field: 'old_price'
  },
  newPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: 'new_price'
  },
  changePercentage: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true, // Matches SQL (nullable by default)
    field: 'change_percentage'
  },
  recordedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'recorded_at'
  }
}, {
  tableName: 'competitor_price_history',
  underscored: true,
  timestamps: true,       // Enable timestamps
  createdAt: 'recorded_at', // Tell Sequelize 'recorded_at' is the creation timestamp
  updatedAt: false,       // Tell Sequelize there is no 'updatedAt' column
});

// Define relationships
Product.hasMany(CompetitorPriceHistory, { 
  foreignKey: 'productId', 
  as: 'priceHistory' 
});
CompetitorPriceHistory.belongsTo(Product, { 
  foreignKey: 'productId', 
  as: 'product' 
});

export default CompetitorPriceHistory;