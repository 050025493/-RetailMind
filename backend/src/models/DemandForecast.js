import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import Product from "./Product.js";

const DemandForecast = sequelize.define("DemandForecast", {
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
  date: {
    type: DataTypes.DATEONLY, // Use DATEONLY for "YYYY-MM-DD"
    allowNull: false,
  },
  predicted_quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
  }
}, {
  tableName: 'demand_forecasts',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

Product.hasMany(DemandForecast, { foreignKey: 'productId', as: 'forecasts' });
DemandForecast.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

export default DemandForecast;