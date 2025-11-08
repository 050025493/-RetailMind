// backend/src/controllers/scenarioController.js
import Scenario from "../models/Scenario.js";
// --- CRITICAL FIX: Use the correct new package and class ---
import { GoogleGenAI } from "@google/genai";

// --- CRITICAL FIX: Use new GoogleGenAI class ---
const genAI = new GoogleGenAI(process.env.GEMINI_API_KEY);

// --- FINAL FIX: Use the correct model ID from your list ---
const modelName = "models/gemini-flash-latest";

const generationConfig = {
  responseMimeType: "application/json",
};

// Helper: build a detailed prompt for Gemini
const buildPrompt = (payload) => {
  const { name, timePeriod, priceChange, demandLift, competitionFactor, parameters } = payload;

  return `
You are a senior pricing strategy analyst for a retail company.
Analyze the scenario below and return a single, valid JSON object.

Scenario Input:
- Name: "${name}"
- Time period (days): ${timePeriod}
- Price change (%): ${priceChange}
- Expected demand lift (%): ${demandLift}
- Competition factor: ${competitionFactor}
- Extra parameters: ${JSON.stringify(parameters || {}, null, 2)}

Return a single JSON object with this exact structure:
{
  "analysis": {
    "revenue": "₹...",
    "marketShare": "...",
    "confidence": "Low|Medium|High",
    "keyMetrics": {
      "estUnits": 1200,
      "estMargin": "15.5%"
    }
  },
  "report": {
    "executiveSummary": "A 2-line summary of the findings.",
    "keyAssumptions": "A bulleted list of assumptions made.",
    "reasoning": "Step-by-step logic (price -> demand -> revenue).",
    "sensitivityAnalysis": "Impact of +/- 10% demand.",
    "risks": "A bulleted list of risks and mitigations.",
    "recommendations": "A list of 3 actionable recommendations.",
    "takeaway": "A final 1-line conclusion."
  }
}

Return ONLY the valid JSON object and nothing else.
  `;
};

// ✅ Create Scenario
export const createScenario = async (req, res) => {
  try {
    const {
      name,
      timePeriod,
      priceChange,
      demandLift,
      competitionFactor,
      parameters,
    } = req.body;

    const prompt = buildPrompt({
      name,
      timePeriod,
      priceChange,
      demandLift,
      competitionFactor,
      parameters,
    });

    // --- FIX: Use the NEW syntax for @google/genai ---
    const result = await genAI.models.generateContent({
      model: modelName, // <-- Correct model ID
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: generationConfig,
    });
    
    // ✅ Safely extract text output (which is now guaranteed JSON)
    const aiText = result?.response?.text?.() ?? "{}";

    // --- UPGRADE: Parse the entire response as JSON. No string splitting needed! ---
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(aiText);
    } catch (e) {
      console.error("Critical JSON parse error:", e.message, "Raw text:", aiText);
      throw new Error("Failed to parse AI response.");
    }
    
    const analysis = parsedResponse.analysis || {};
    const report = parsedResponse.report || {};

    // Create a formatted text report from the JSON report object
    const reportText = `
### Executive Summary
${report.executiveSummary || 'N/A'}

### Key Assumptions
${Array.isArray(report.keyAssumptions) ? report.keyAssumptions.join('\n- ') : (report.keyAssumptions || 'N/A')}

### Reasoning
${report.reasoning || 'N/A'}

### Sensitivity Analysis
${report.sensitivityAnalysis || 'N/A'}

### Risks
${Array.isArray(report.risks) ? report.risks.join('\n- ') : (report.risks || 'N/Att')}

### Recommendations
${Array.isArray(report.recommendations) ? report.recommendations.join('\n- ') : (report.recommendations || 'N/A')}

### Final Takeaway
${report.takeaway || 'N/A'}
    `.trim();

    const revenue = analysis.revenue ?? "N/A";
    const marketShare = analysis.marketShare ?? "N/A";
    const confidence = analysis.confidence ?? "Medium";

    // ✅ Save scenario in DB
    const scenario = await Scenario.create({
      name,
      timePeriod,
      priceChange,
      demandLift,
      competitionFactor,
      parameters,
      aiAnalysis: reportText, // Store the formatted report
      revenue,
      marketShare,
    });

    res.json({
      success: true,
      data: {
        ...scenario.toJSON(),
        aiStructured: analysis, // Send back the structured analysis
        confidence,
      },
    });
  } catch (err) {
    console.error("Scenario create error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to create scenario",
      error: err.message,
    });
  }
};

// ✅ Get all scenarios
export const getScenarios = async (req, res) => {
  try {
    const scenarios = await Scenario.findAll({ order: [["created_at", "DESC"]] });
    res.json({ success: true, data: scenarios });
  } catch (err) {
    console.error("Fetch scenarios error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch scenarios" });
  }
};

// ✅ Delete scenario
export const deleteScenario = async (req, res) => {
  try {
    const { id } = req.params;
    await Scenario.destroy({ where: { id } });
    res.json({ success: true, message: "Deleted" });
  } catch (err) {
    console.error("Delete scenario error:", err);
    res.status(500).json({ success: false, message: "Delete failed" });
  }
};