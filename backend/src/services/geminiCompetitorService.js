
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Generate realistic competitor pricing using Gemini AI
 * @param {Object} product - Product details
 * @param {Array} existingCompetitors - Current competitor data (if any)
 * @returns {Promise<Array>} Array of competitor prices
 */
export const generateCompetitorPrices = async (product, existingCompetitors = []) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `
You are a market pricing analyst. Generate realistic competitor pricing data for the following product:

Product Name: ${product.name}
Current Price: ₹${product.currentPrice}
Category: ${product.category}
Cost Price: ₹${product.costPrice || 'Unknown'}

${existingCompetitors.length > 0 ? `
Previous Competitor Prices:
${existingCompetitors.map(c => `- ${c.competitorName}: ₹${c.price}`).join('\n')}

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

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    // Clean up response - remove markdown code blocks if present
    text = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

    const competitors = JSON.parse(text);

    // Validate and normalize data
    if (!Array.isArray(competitors)) {
      throw new Error('Invalid response format from Gemini');
    }

    return competitors.map(c => ({
      competitorName: c.competitorName || c.competitor_name || 'Unknown',
      price: parseFloat(c.price) || 0,
      reasoning: c.reasoning || 'Market-based pricing'
    }));

  } catch (error) {
    console.error('Gemini AI error:', error);
    // Fallback to rule-based generation
    return generateFallbackPrices(product, existingCompetitors);
  }
};

/**
 * Fallback price generation if Gemini fails
 */
const generateFallbackPrices = (product, existingCompetitors) => {
  const basePrice = parseFloat(product.currentPrice);
  const competitors = ['Amazon India', 'Flipkart', 'Croma', 'Reliance Digital'];

  if (existingCompetitors.length > 0) {
    // Update existing prices with small changes
    return existingCompetitors.map(c => {
      const change = (Math.random() - 0.5) * 0.1; // -5% to +5%
      const newPrice = Math.round(parseFloat(c.price) * (1 + change));
      return {
        competitorName: c.competitorName,
        price: newPrice,
        reasoning: 'Market adjustment'
      };
    });
  }

  // Generate new prices
  return competitors.map((name, idx) => {
    const variance = 0.85 + (Math.random() * 0.2); // 85% to 105% of base price
    const price = Math.round(basePrice * variance);
    return {
      competitorName: name,
      price: price,
      reasoning: 'Competitive market positioning'
    };
  });
};

/**
 * Generate detailed analysis and recommendations using Gemini
 */
export const generateCompetitorAnalysis = async (product, competitors, priceHistory) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `
Analyze the competitive pricing landscape for:

Product: ${product.name}
Your Current Price: ₹${product.currentPrice}
Cost Price: ₹${product.costPrice || 'Unknown'}

Current Competitor Prices:
${competitors.map(c => `- ${c.competitorName}: ₹${c.price}`).join('\n')}

${priceHistory.length > 0 ? `
Recent Price History (last 7 days):
${priceHistory.slice(0, 7).map(h => 
  `${h.competitorName}: ₹${h.price} (${h.changePercentage > 0 ? '+' : ''}${h.changePercentage}%)`
).join('\n')}
` : ''}

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

Return ONLY valid JSON, no markdown.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    text = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

    return JSON.parse(text);

  } catch (error) {
    console.error('Analysis generation error:', error);
    return generateFallbackAnalysis(product, competitors);
  }
};

const generateFallbackAnalysis = (product, competitors) => {
  const avgCompPrice = competitors.reduce((sum, c) => sum + parseFloat(c.price), 0) / competitors.length;
  const yourPrice = parseFloat(product.currentPrice);
  const diff = ((yourPrice - avgCompPrice) / avgCompPrice) * 100;

  let position = 'competitive';
  let action = 'maintain';
  
  if (diff > 10) {
    position = 'overpriced';
    action = 'decrease';
  } else if (diff < -10) {
    position = 'underpriced';
    action = 'increase';
  }

  return {
    summary: `Your price is ${diff > 0 ? 'above' : 'below'} market average by ${Math.abs(diff).toFixed(1)}%`,
    position,
    recommendations: [{
      action,
      suggestedPrice: Math.round(avgCompPrice),
      reasoning: 'Align with market average',
      expectedImpact: 'Improved competitiveness'
    }],
    marketInsights: [
      'Market is moderately competitive',
      'Price variations suggest active competition'
    ],
    risks: ['Competitor price changes', 'Demand fluctuations'],
    opportunities: ['Market share growth', 'Brand positioning']
  };
};