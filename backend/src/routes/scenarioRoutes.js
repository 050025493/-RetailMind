// backend/src/routes/scenarioRoutes.js
import express from "express";
import { createScenario, getScenarios, deleteScenario } from "../controllers/scenarioController.js";

const router = express.Router();

router.post("/", createScenario);
router.get("/", getScenarios);
router.delete("/:id", deleteScenario);

export default router;
