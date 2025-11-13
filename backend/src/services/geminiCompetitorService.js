import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

// ✅ Initialize Gemini client correctly
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Generate realistic competitor pricing using Gemini AI
 * @param {Object} product - Product details
 * @param {Array} existingCompetitors - Current competitor data (if any)
 * @returns {Promise<Array>} Array of competitor prices
 */
export const generateCompetitorPrices = async (product, existingCompetitors = []) => {
  try {
    // ✅ Use correct model name
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
You are a market pricing analyst. Generate realistic competitor pricing data for the following product:

Product Name: ${product.name}
Current Price: ₹${product.currentPrice}
Category: ${product.category}
Cost Price: ₹${product.costPrice || "Unknown"}

${existingCompetitors.length > 0 ? `
Previous Competitor Prices:
${existingCompetitors.map(c => `- ${c.competitorName}: ₹${c.price}`).join("\n")}

Update these prices realistically considering market dynamics. Prices should change by -5% to +8% based on:
- Demand fluctuations
- Stock availability
- Seasonal factors
- Competition intensity
` : `
Generate initial competitor prices for 4 major Indian e-commerce competitors:
1. Amazon India
2. Flipkart
3. Myntra/Ajio (for fashion/accessories)
4. Croma/Vijay Sales (for electronics)

Competitors typically price:
- 5-15% lower for high-demand products
- Similar (±3%) for average products
- 5-10% higher for premium/exclusive items
`}

IMPORTANT: Return ONLY a valid JSON array with this exact structure:
[
  {
    "competitorName": "Amazon India",
    "price": 6999,
    "reasoning": "Aggressive pricing to capture market share"
  },
  {
    "competitorName": "Flipkart",
    "price": 7199,
    "reasoning": "Competitive pricing with occasional sales"
  }
]

Rules:
- Prices must be realistic for Indian market (in ₹)
- No markdown formatting or code blocks
- Exactly 4 competitors
- Include brief reasoning for each price
`;

    console.log(`[Gemini] Requesting competitor prices for ${product.name}...`);

    // ✅ Correct API call syntax
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    console.log(`[Gemini] Raw response: ${text.substring(0, 200)}...`);

    // Clean up the response
    const cleanText = text.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
    
    let competitors;
    try {
      competitors = JSON.parse(cleanText);
    } catch (parseError) {
      console.error("[Gemini] Failed to parse response:", cleanText.substring(0, 200));
      console.warn("[Gemini] Falling back to default pricing");
      return generateFallbackPrices(product, existingCompetitors);
    }

    if (!Array.isArray(competitors)) {
      console.error("[Gemini] Response is not an array");
      return generateFallbackPrices(product, existingCompetitors);
    }

    console.log(`[Gemini] Successfully generated ${competitors.length} competitor prices`);

    return competitors.map(c => ({
      competitorName: c.competitorName || c.competitor_name || "Unknown",
      price: parseFloat(c.price) || 0,
      reasoning: c.reasoning || "Market-based pricing",
    }));
  } catch (error) {
    console.error("[Gemini] AI error:", error.message);
    console.warn("[Gemini] Falling back to default pricing");
    return generateFallbackPrices(product, existingCompetitors);
  }
};

/**
 * Fallback price generation if Gemini fails
 */
const generateFallbackPrices = (product, existingCompetitors) => {
  const basePrice = parseFloat(product.currentPrice);
  const competitors = ["Amazon India", "Flipkart", "Croma", "Reliance Digital"];

  console.log(`[Fallback] Generating prices for ${product.name}`);

  if (existingCompetitors.length > 0) {
    return existingCompetitors.map(c => {
      const change = (Math.random() - 0.5) * 0.1;
      const newPrice = Math.round(parseFloat(c.price) * (1 + change));
      return {
        competitorName: c.competitorName,
        price: newPrice,
        reasoning: "Market adjustment",
      };
    });
  }

  return competitors.map(name => {
    const variance = 0.85 + Math.random() * 0.2;
    const price = Math.round(basePrice * variance);
    return {
      competitorName: name,
      price,
      reasoning: "Competitive market positioning",
    };
  });
};

/**
 * Generate detailed analysis and recommendations using Gemini
 */
export const generateCompetitorAnalysis = async (product, competitors, priceHistory) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    const prompt = `
Analyze the competitive pricing landscape for:

Product: ${product.name}
Your Current Price: ₹${product.currentPrice}
Cost Price: ₹${product.costPrice || "Unknown"}

Current Competitor Prices:
${competitors.map(c => `- ${c.competitorName}: ₹${c.price}`).join("\n")}

${priceHistory.length > 0 ? `
Recent Price History (last 7 days):
${priceHistory.slice(0, 7).map(h =>
  `${h.competitorName}: ₹${h.price} (${h.changePercentage > 0 ? "+" : ""}${h.changePercentage}%)`
).join("\n")}
` : ""}

Provide a comprehensive analysis in JSON format:
{
  "summary": "Brief overview of competitive position",
  "position": "overpriced|competitive|underpriced",
  "recommendations": [
    {
      "action": "increase|decrease|maintain",
      "suggestedPrice": 7499,
      "reasoning": "Why this price is optimal",
      "expectedImpact": "Predicted outcome"
    }
  ],
  "marketInsights": [
    "Key insight about market dynamics",
    "Competitor behavior patterns"
  ],
  "risks": [
    "Potential risk of price change"
  ],
  "opportunities": [
    "Market opportunity to exploit"
  ]
}

IMPORTANT: 
- Use 15% threshold: >15% above average is "overpriced", <-15% is "underpriced", else "competitive"
- Return ONLY valid JSON, no markdown
`;

    console.log(`[Gemini] Requesting analysis for ${product.name}...`);

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    const cleanText = text.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
    
    try {
      const analysis = JSON.parse(cleanText);
      console.log(`[Gemini] Analysis complete: position=${analysis.position}`);
      return analysis;
    } catch (parseError) {
      console.error("[Gemini] Failed to parse analysis:", cleanText.substring(0, 200));
      console.warn("[Gemini] Falling back to default analysis");
      return generateFallbackAnalysis(product, competitors);
    }
  } catch (error) {
    console.error("[Gemini] Analysis generation error:", error.message);
    return generateFallbackAnalysis(product, competitors);
  }
};

/**
 * Fallback analysis if Gemini fails
 */
const generateFallbackAnalysis = (product, competitors) => {
  const avgCompPrice = competitors.reduce((sum, c) => sum + parseFloat(c.price), 0) / competitors.length;
  const yourPrice = parseFloat(product.currentPrice);
  const diff = ((yourPrice - avgCompPrice) / avgCompPrice) * 100;

  let position = "competitive";
  let action = "maintain";

  // ✅ Updated to 15% threshold for consistency
  if (diff > 15) {
    position = "overpriced";
    action = "decrease";
  } else if (diff < -15) {
    position = "underpriced";
    action = "increase";
  }

  console.log(`[Fallback] Analysis: ${yourPrice} vs ${avgCompPrice.toFixed(2)} = ${diff.toFixed(1)}% → ${position}`);

  return {
    summary: `Your price is ${diff > 0 ? "above" : "below"} market average by ${Math.abs(diff).toFixed(1)}%`,
    position,
    recommendations: [
      {
        action,
        suggestedPrice: Math.round(avgCompPrice),
        reasoning: position === "competitive" 
          ? "Your pricing is well-aligned with the market" 
          : "Align with market average to improve competitiveness",
        expectedImpact: position === "competitive" 
          ? "Maintain current market position" 
          : "Improved competitiveness and sales potential",
      },
    ],
    marketInsights: [
      "Market shows moderate competitive activity",
      `Price variance: ${Math.min(...competitors.map(c => c.price))} - ${Math.max(...competitors.map(c => c.price))}`,
    ],
    risks: ["Competitor price changes", "Demand fluctuations", "Market saturation"],
    opportunities: ["Market share growth potential", "Brand positioning opportunity"],
  };
};