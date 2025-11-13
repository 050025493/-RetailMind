// backend/src/controllers/scenarioController.js
import Scenario from "../models/Scenario.js";
import { GoogleGenerativeAI } from "@google/generative-ai";

// ✅ Initialize Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ✅ Use Gemini 2.5 Pro for best reasoning and structured output
const modelName = "gemini-2.5-pro";

// ✅ Generation configuration
const generationConfig = {
  temperature: 0.6,
  topP: 0.9,
  topK: 40,
};

// ✅ Helper: Retry logic for 503 overloads
async function callGeminiWithRetry(apiCall, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await apiCall();
    } catch (err) {
      if ((err.status === 503 || err.message?.includes("503") || err.message?.includes("overloaded")) && i < retries - 1) {
        console.warn(`Gemini overloaded. Retrying in ${1000 * (i + 1)} ms...`);
        await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
      } else {
        throw err;
      }
    }
  }
}

// ✅ Strong JSON-only prompt builder
// ✅ Strong JSON-only prompt builder with base assumptions
const buildPrompt = (payload) => {
  // Destructure all inputs from the payload
  const {
    name,
    timePeriod,
    priceChange,
    demandLift,
    competitionFactor,
    parameters, // extra parameters
    baseAssumptions, //  new field
  } = payload;

  // --- NEW: Define default assumptions if not provided ---
  const defaults = {
    basePricePerUnit: 1000,
    baseUnitsSoldPerDay: 50,
    baseMarketShare: 12.0,
    baseMarginPerUnit: 25.0,
  };

  // Merge provided assumptions with defaults
  const assumptions = { ...defaults, ...(baseAssumptions || {}) };

  return `You are an expert business analyst AI.
Your task: Analyze the scenario input below and **calculate** the key metrics based on the provided "Base Assumptions".
Output one valid JSON object only.
Do NOT include Markdown code blocks, explanations, or commentary.

---
Base Assumptions (Your starting point for all calculations):
- Base Price per Unit: ₹${assumptions.basePricePerUnit}
- Base Units Sold per Day: ${assumptions.baseUnitsSoldPerDay}
- Base Market Share: ${assumptions.baseMarketShare}%
- Base Unit Margin: ${assumptions.baseMarginPerUnit}%
---
Scenario Input (Apply these changes to the base assumptions):
- Name: "${name}"
- Time period (days): ${timePeriod}
- Price change (%): ${priceChange}
- Expected demand lift (%): ${demandLift}
- Competition factor: ${competitionFactor}
- Extra parameters: ${JSON.stringify(parameters || {}, null, 2)}
---

Your response must be ONLY a valid JSON object following this exact schema.
REPLACE the placeholder descriptions with your calculated values.

{
  "analysis": {
    "revenue": "CALCULATED_TOTAL_REVENUE for the ${timePeriod}-day period (e.g., '₹550,000')",
    "marketShare": "CALCULATED_NEW_MARKET_SHARE (e.g., '16.5%')",
    "confidence": "CONFIDENCE_LEVEL (e.g., 'High', 'Medium', 'Low')",
    "keyMetrics": {
      "estUnits": "CALCULATED_TOTAL_ESTIMATED_UNITS for the period (e.g., 1350)",
      "estMargin": "CALCULATED_NEW_ESTIMATED_MARGIN (e.g., '16.0%')"
    }
  },
  "report": {
    "executiveSummary": "A 2-3 sentence summary of the business scenario findings, referencing the inputs.",
    "keyAssumptions": [
      "Assumed base price of ₹${assumptions.basePricePerUnit} and base sales of ${assumptions.baseUnitsSoldPerDay} units/day.",
      "The ${demandLift}% demand lift is a direct result of the ${priceChange}% price change.",
      "Competition factor '${competitionFactor}' has been factored into market share."
    ],
    "reasoning": "Step-by-step logic explaining how the price change, demand lift, and time period were used to calculate the new revenue and units from the base assumptions.",
    "sensitivityAnalysis": "Analysis of how a ±10% variation in the '${demandLift}%' demand lift would affect the final calculated revenue.",
    "risks": ["Risk 1: The demand lift may not materialize.", "Risk 2: Competitors may react aggressively.", "Risk 3"],
    "recommendations": ["Action 1: Monitor sales closely.", "Action 2", "Action 3"],
    "takeaway": "Final one-line conclusion summarizing the scenario's viability."
  }
}

CRITICAL: Output ONLY the JSON object. Start with { and end with }. No other text.`;
};

//  Create Scenario
export const createScenario = async (req, res) => {
  try {
    const { name, timePeriod, priceChange, demandLift, competitionFactor, parameters, baseAssumptions } = req.body;
    
    console.log("Creating scenario:", { name, timePeriod, priceChange, demandLift, competitionFactor });
    
   const prompt = buildPrompt({ 
  name, 
  timePeriod, 
  priceChange, 
  demandLift, 
  competitionFactor, 
  parameters,
  baseAssumptions // Pass base assumptions to the prompt
});

    // --- Get the generative model ---
    const model = genAI.getGenerativeModel({ 
      model: modelName,
      generationConfig 
    });

    // --- Make Gemini API call with retry ---
    const result = await callGeminiWithRetry(async () => {
      return await model.generateContent(prompt);
    });

    //  Extract raw text safely from Gemini response
    const response = await result.response;
    let aiText = response.text();

    console.log("Gemini raw text output:\n", aiText);

    if (!aiText || aiText.trim() === "" || aiText === "{}") {
      throw new Error("Gemini returned empty response");
    }

    //  Clean up any Markdown or extra formatting
    aiText = aiText
      .replace(/```json\s*/gi, "")
      .replace(/```\s*/g, "")
      .trim();

    //  Try parsing JSON, fallback to text extraction
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(aiText);
    } catch (parseErr) {
      console.warn("Initial JSON parse failed, attempting extraction...");
      const match = aiText.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          parsedResponse = JSON.parse(match[0]);
        } catch (err2) {
          console.error("JSON reparse failed:", err2.message);
          throw new Error("Gemini returned invalid JSON. Raw output: " + aiText.substring(0, 200));
        }
      } else {
        throw new Error("Gemini did not return a JSON object. Raw output: " + aiText.substring(0, 200));
      }
    }

    //  Validate response structure
    if (!parsedResponse.analysis || !parsedResponse.report) {
      throw new Error("Gemini response missing required fields (analysis or report)");
    }

    //  Extract parts safely
    const analysis = parsedResponse.analysis || {};
    const report = parsedResponse.report || {};

    //  Create formatted Markdown report
    const reportText = `
### Executive Summary
${report.executiveSummary || "N/A"}

### Key Assumptions
${Array.isArray(report.keyAssumptions)
  ? "- " + report.keyAssumptions.join("\n- ")
  : report.keyAssumptions || "N/A"}

### Reasoning
${report.reasoning || "N/A"}

### Sensitivity Analysis
${report.sensitivityAnalysis || "N/A"}

### Risks
${Array.isArray(report.risks)
  ? "- " + report.risks.join("\n- ")
  : report.risks || "N/A"}

### Recommendations
${Array.isArray(report.recommendations)
  ? "- " + report.recommendations.join("\n- ")
  : report.recommendations || "N/A"}

### Final Takeaway
${report.takeaway || "N/A"}
`.trim();

    const revenue = analysis.revenue ?? "N/A";
    const marketShare = analysis.marketShare ?? "N/A";
    const confidence = analysis.confidence ?? "Medium";

    //  Save scenario in database
    const scenario = await Scenario.create({
      name,
      timePeriod,
      priceChange,
      demandLift,
      competitionFactor,
      parameters,
      aiAnalysis: reportText,
      revenue,
      marketShare,
    });

    //  Respond with structured data
    res.json({
      success: true,
      data: {
        ...scenario.toJSON(),
        aiStructured: analysis,
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

//  Get all scenarios
export const getScenarios = async (req, res) => {
  try {
    const scenarios = await Scenario.findAll({ order: [["created_at", "DESC"]] });
    res.json({ success: true, data: scenarios });
  } catch (err) {
    console.error("Fetch scenarios error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch scenarios",
      error: err.message,
    });
  }
};

//  Delete scenario
export const deleteScenario = async (req, res) => {
  try {
    const { id } = req.params;
    await Scenario.destroy({ where: { id } });
    res.json({ success: true, message: "Deleted successfully" });
  } catch (err) {
    console.error("Delete scenario error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to delete scenario",
      error: err.message,
    });
  }
};