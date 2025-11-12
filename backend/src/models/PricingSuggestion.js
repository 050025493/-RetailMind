// backend/src/models/PricingSuggestion.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import Product from './Product.js';

const PricingSuggestion = sequelize.define('PricingSuggestion', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  product_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'products',
      key: 'id'
    }
  },
  current_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  suggested_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  min_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  max_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  confidence: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 0
  },
  change_percentage: {
    type: DataTypes.DECIMAL(6, 2),
    allowNull: false,
    defaultValue: 0
  },
  reasoning: {
    type: DataTypes.JSON,
    allowNull: true
  },
  impact: {
    type: DataTypes.JSON,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('pending', 'applied', 'dismissed', 'expired'),
    defaultValue: 'pending'
  },
  accepted_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  applied_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  dismissed_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'pricing_suggestions',
  timestamps: true,
  underscored: true
});
Product.hasOne(PricingSuggestion, {
  foreignKey: 'product_id', 
  as: 'pricingSuggestion' 
});

PricingSuggestion.belongsTo(Product, { 
  foreignKey: 'product_id', 
  as: 'product' 
});

export default PricingSuggestion;