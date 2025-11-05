import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: "postgres",
  logging: false,
});

try {
  await sequelize.authenticate();
  console.log("✅ Database connected successfully!");
} catch (error) {
  console.error("❌ Database connection failed:", error);
}

export default sequelize;

