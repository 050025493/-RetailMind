import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import User from "./User.js";
import Product from "./Product.js";

const PricingRule = sequelize.define("PricingRule", {
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
  ruleName: {
    type: DataTypes.STRING(200),
    allowNull: false,
    field: 'rule_name'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  },
  priority: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  conditionType: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'condition_type'
  },
  conditionThreshold: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: 'condition_threshold'
  },
  conditionOperator: {
    type: DataTypes.STRING(10),
    allowNull: false,
    field: 'condition_operator'
  },
  actionType: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'action_type'
  },
  actionValue: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: 'action_value'
  },
  actionUnit: {
    type: DataTypes.STRING(10),
    allowNull: false,
    field: 'action_unit'
  },
  minPrice: {
    type: DataTypes.DECIMAL(10, 2),
    field: 'min_price'
  },
  maxPrice: {
    type: DataTypes.DECIMAL(10, 2),
    field: 'max_price'
  },
  lastAppliedAt: {
    type: DataTypes.DATE,
    field: 'last_applied_at'
  }
}, {
  tableName: 'pricing_rules',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

const PricingRuleApplication = sequelize.define("PricingRuleApplication", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  ruleId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'pricing_rules',
      key: 'id'
    },
    field: 'rule_id'
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
  oldPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: 'old_price'
  },
  newPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: 'new_price'
  },
  appliedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'applied_at'
  },
  success: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  errorMessage: {
    type: DataTypes.TEXT,
    field: 'error_message'
  }
}, {
  tableName: 'pricing_rule_applications',
  underscored: true,
  timestamps: false
});

const VoiceQuery = sequelize.define("VoiceQuery", {
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
  queryText: {
    type: DataTypes.TEXT,
    allowNull: false,
    field: 'query_text'
  },
  queryType: {
    type: DataTypes.STRING(50),
    field: 'query_type'
  },
  responseText: {
    type: DataTypes.TEXT,
    field: 'response_text'
  },
  responseData: {
    type: DataTypes.JSONB,
    field: 'response_data'
  },
  processingTimeMs: {
    type: DataTypes.INTEGER,
    field: 'processing_time_ms'
  }
}, {
  tableName: 'voice_queries',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

// Relationships
User.hasMany(PricingRule, { foreignKey: 'userId', as: 'pricingRules' });
PricingRule.belongsTo(User, { foreignKey: 'userId', as: 'user' });

PricingRule.hasMany(PricingRuleApplication, { foreignKey: 'ruleId', as: 'applications' });
PricingRuleApplication.belongsTo(PricingRule, { foreignKey: 'ruleId', as: 'rule' });

Product.hasMany(PricingRuleApplication, { foreignKey: 'productId', as: 'priceApplications' });
PricingRuleApplication.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

User.hasMany(VoiceQuery, { foreignKey: 'userId', as: 'voiceQueries' });
VoiceQuery.belongsTo(User, { foreignKey: 'userId', as: 'user' });

export default { PricingRule, PricingRuleApplication, VoiceQuery };