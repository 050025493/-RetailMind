import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: "postgres",
  logging: false,
});

// ✅ Add this helper for raw SQL queries
export const query = async (sql, params = []) => {
  const [results] = await sequelize.query(sql, { bind: params });
  return { rows: results };
};

// Test DB connection once
try {
  await sequelize.authenticate();
  console.log("✅ Database connected successfully!");
} catch (error) {
  console.error("❌ Database connection failed:", error);
}

export default sequelize;
