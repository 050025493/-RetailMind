import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import sequelize from "./config/database.js";
import authRoutes from "./routes/auth.js";
import User from "./models/User.js";
import importRoutes from "./routes/import.js";


dotenv.config();
const app = express();


app.use(cors({
  origin: "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/import", importRoutes);

// Sync Database
sequelize.sync({ alter: true }).then(() => console.log("📦 Database synced"));

app.get("/", (req, res) => res.send("Backend running ✅"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
