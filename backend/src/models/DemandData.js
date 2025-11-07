import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import Product from "./Product.js";

const DemandData = sequelize.define("DemandData", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  productId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'products', // Use table name
      key: 'id'
    },
    field: 'product_id'
  },
  date: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  quantity_sold: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  revenue: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  }
}, {
  tableName: 'demand_data',
  underscored: true,
  timestamps: false, // No createdAt/updatedAt for this table
});

Product.hasMany(DemandData, { foreignKey: 'productId', as: 'demand' });
DemandData.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

export default DemandData;