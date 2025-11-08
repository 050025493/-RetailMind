import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import sequelize from "./config/database.js";
import authRoutes from "./routes/auth.js";
import productRoutes from "./routes/products.js";
import importRoutes from "./routes/import.js";
import dashboardRoutes from "./routes/dashboard.js";
import competitorRoutes from "./routes/competitors.js";


import forecastRoutes from "./routes/forecast.js";

// Import all models to ensure they are synced
import User from "./models/User.js";
import Product from "./models/Product.js";
import DemandData from "./models/DemandData.js";
import DemandForecast from "./models/DemandForecast.js";
import { CompetitorPrice, CompetitorPriceHistory } from "./models/CompetitorPrice.js";




dotenv.config();
const app = express();

app.use(cors({
  origin: "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));
app.use(express.json());

// ===== SET UP MODEL ASSOCIATIONS =====
// Product has many CompetitorPrices

// ===== END ASSOCIATIONS =====

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/import", importRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/forecast", forecastRoutes);
app.use("/api/competitors", competitorRoutes);


// Sync Database
sequelize.sync({ alter: true }).then(() => {
  console.log("📦 Database synced");
 
});

app.get("/", (req, res) => res.send("Backend running ✅"));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));