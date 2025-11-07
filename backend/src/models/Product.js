import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import User from "./User.js";

const Product = sequelize.define("Product", {
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
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  sku: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
  },
  category: {
    type: DataTypes.STRING,
  },
  currentPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: 'current_price'
  },
  costPrice: {
    type: DataTypes.DECIMAL(10, 2),
    field: 'cost_price'
  },
  stockQuantity: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'stock_quantity'
  },
  minPrice: {
    type: DataTypes.DECIMAL(10, 2),
    field: 'min_price'
  },
  maxPrice: {
    type: DataTypes.DECIMAL(10, 2),
    field: 'max_price'
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'active'
  },
  imageUrl: {
    type: DataTypes.STRING,
    field: 'image_url'
  },
  description: {
    type: DataTypes.TEXT,
  },
}, {
  tableName: 'products',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Define relationship
Product.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(Product, { foreignKey: 'userId', as: 'products' });

export default Product;


