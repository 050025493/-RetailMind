import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Scenario = sequelize.define("Scenario", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  timePeriod: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  priceChange: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false
  },
  demandLift: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false
  },
  competitionFactor: {
    type: DataTypes.STRING,
    allowNull: false
  },
  parameters: {
    type: DataTypes.JSONB, // for checkboxes (seasonal, loyalty, etc.)
    defaultValue: {}
  },
  aiAnalysis: {
    type: DataTypes.TEXT
  },
  revenue: {
    type: DataTypes.STRING
  },
  marketShare: {
    type: DataTypes.STRING
  }
}, {
  tableName: "scenarios",
  timestamps: true,
  underscored: true
});

export default Scenario;
