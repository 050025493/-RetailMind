
import axios from 'axios';
import { ProductReview } from '../models/PromoSimulator.js';
import DemandData from '../models/DemandData.js';
import { Op } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const HF_API_TOKEN = process.env.HUGGINGFACE_API_KEY;
const SENTIMENT_MODEL = 'cardiffnlp/twitter-roberta-base-sentiment-latest';
const HF_API_URL = `https://api-inference.huggingface.co/models/${SENTIMENT_MODEL}`;

/**
 * Analyze sentiment using HuggingFace API
 * @param {string} text - Text to analyze
 * @returns {Promise<Object>} Sentiment result
 */
export const analyzeSentiment = async (text) => {
  try {
    const response = await axios.post(
      HF_API_URL,
      { inputs: text },
      {
        headers: {
          'Authorization': `Bearer ${HF_API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // HuggingFace returns array of label predictions
    const results = response.data[0];
    
    // Find the highest scoring label
    let maxScore = -1;
    let maxLabel = 'neutral';
    
    results.forEach(result => {
      if (result.score > maxScore) {
        maxScore = result.score;
        maxLabel = result.label.toLowerCase();
      }
    });

    // Convert label to score (-1 to 1)
    let sentimentScore = 0;
    if (maxLabel.includes('positive')) {
      sentimentScore = maxScore;
    } else if (maxLabel.includes('negative')) {
      sentimentScore = -maxScore;
    } else {
      sentimentScore = 0;
    }

    return {
      label: maxLabel.includes('positive') ? 'positive' : 
             maxLabel.includes('negative') ? 'negative' : 'neutral',
      score: sentimentScore,
      confidence: maxScore
    };

  } catch (error) {
    console.error('HuggingFace API error:', error.response?.data || error.message);
    
    // Fallback: Simple keyword-based sentiment
    return fallbackSentiment(text);
  }
};

/**
 * Fallback sentiment analysis using keywords
 */
const fallbackSentiment = (text) => {
  const lowerText = text.toLowerCase();
  
  const positiveWords = ['great', 'excellent', 'amazing', 'love', 'good', 'best', 'perfect', 'awesome'];
  const negativeWords = ['bad', 'terrible', 'poor', 'hate', 'worst', 'awful', 'disappointing'];
  
  let score = 0;
  positiveWords.forEach(word => {
    if (lowerText.includes(word)) score += 0.3;
  });
  negativeWords.forEach(word => {
    if (lowerText.includes(word)) score -= 0.3;
  });
  
  score = Math.max(-1, Math.min(1, score));
  
  return {
    label: score > 0.4 ? 'positive' : score < -0.2 ? 'negative' : 'neutral',
    score: score,
    confidence: 0.6
  };
};

/**
 * Get product sentiment overview
 * @param {number} productId - Product ID
 * @returns {Promise<Object>} Sentiment analysis
 */
export const getProductSentiment = async (productId) => {
  try {
    const reviews = await ProductReview.findAll({
      where: { productId },
      attributes: ['sentimentScore', 'sentimentLabel', 'rating', 'createdAt'],
      order: [['created_at', 'DESC']],
      limit: 100
    });

    if (reviews.length === 0) {
      return {
        avgSentiment: 0,
        sentiment: 'neutral',
        reviewCount: 0,
        distribution: { positive: 0, neutral: 0, negative: 0 },
        trend: 'stable'
      };
    }

    // Calculate average sentiment
    const avgSentiment = reviews.reduce((sum, r) => 
      sum + parseFloat(r.sentimentScore || 0), 0
    ) / reviews.length;

    // Count distribution
    const distribution = {
      positive: reviews.filter(r => r.sentimentLabel === 'positive').length,
      neutral: reviews.filter(r => r.sentimentLabel === 'neutral').length,
      negative: reviews.filter(r => r.sentimentLabel === 'negative').length
    };

    // Determine overall sentiment
    const sentiment = avgSentiment > 0.2 ? 'positive' : 
                     avgSentiment < -0.2 ? 'negative' : 'neutral';

    // Calculate trend (recent vs older)
    const recentReviews = reviews.slice(0, Math.floor(reviews.length / 3));
    const olderReviews = reviews.slice(Math.floor(reviews.length / 3));
    
    const recentAvg = recentReviews.length > 0 
      ? recentReviews.reduce((sum, r) => sum + parseFloat(r.sentimentScore || 0), 0) / recentReviews.length
      : 0;
    
    const olderAvg = olderReviews.length > 0
      ? olderReviews.reduce((sum, r) => sum + parseFloat(r.sentimentScore || 0), 0) / olderReviews.length
      : 0;

    const trend = recentAvg > olderAvg + 0.1 ? 'improving' : 
                  recentAvg < olderAvg - 0.1 ? 'declining' : 'stable';

    return {
      avgSentiment: parseFloat(avgSentiment.toFixed(4)),
      sentiment,
      reviewCount: reviews.length,
      distribution,
      trend,
      recentSentiment: parseFloat(recentAvg.toFixed(4))
    };

  } catch (error) {
    console.error('Get product sentiment error:', error);
    return {
      avgSentiment: 0,
      sentiment: 'neutral',
      reviewCount: 0,
      distribution: { positive: 0, neutral: 0, negative: 0 },
      trend: 'stable'
    };
  }
};

/**
 * Calculate promo impact based on sentiment
 * @param {Object} sentimentData - Product sentiment data
 * @param {number} discountPercentage - Discount %
 * @returns {Object} Impact multipliers
 */
export const calculateSentimentImpact = (sentimentData, discountPercentage) => {
  const { avgSentiment, sentiment, trend } = sentimentData;

  // Base demand lift from discount
  let demandLiftBase = discountPercentage * 1.5; // 10% discount = 15% demand lift

  // Sentiment multipliers
  let sentimentMultiplier = 1.0;
  
  if (sentiment === 'positive') {
    sentimentMultiplier = 1.3; // Positive sentiment boosts promo 30%
  } else if (sentiment === 'negative') {
    sentimentMultiplier = 0.7; // Negative sentiment reduces promo 30%
  }

  // Trend multipliers
  let trendMultiplier = 1.0;
  if (trend === 'improving') {
    trendMultiplier = 1.15; // Improving sentiment adds 15%
  } else if (trend === 'declining') {
    trendMultiplier = 0.85; // Declining sentiment reduces 15%
  }

  // Final demand lift
  const finalDemandLift = demandLiftBase * sentimentMultiplier * trendMultiplier;

  // Confidence calculation (higher with more reviews)
  const confidence = Math.min(95, 60 + (sentimentData.reviewCount / 10) * 2);

  return {
    demandLift: parseFloat(finalDemandLift.toFixed(2)),
    sentimentMultiplier: parseFloat(sentimentMultiplier.toFixed(2)),
    trendMultiplier: parseFloat(trendMultiplier.toFixed(2)),
    confidence: parseFloat(confidence.toFixed(2)),
    recommendation: sentiment === 'positive' 
      ? 'High promo success probability'
      : sentiment === 'negative'
      ? 'Focus on product improvement before promo'
      : 'Moderate promo success expected'
  };
};

/**
 * Get average daily sales for a product
 * @param {number} productId - Product ID
 * @param {number} days - Number of days to average
 * @returns {Promise<number>} Average daily sales
 */
export const getAvgDailySales = async (productId, days = 30) => {
  try {
    const salesData = await DemandData.findAll({
      where: {
        productId,
        date: {
          [Op.gte]: new Date(Date.now() - days * 24 * 60 * 60 * 1000)
        }
      },
      attributes: ['quantity_sold']
    });

    if (salesData.length === 0) return 0;

    const totalSales = salesData.reduce((sum, s) => sum + parseInt(s.quantity_sold), 0);
    return parseFloat((totalSales / days).toFixed(2));

  } catch (error) {
    console.error('Get avg daily sales error:', error);
    return 0;
  }
};

/**
 * Generate demo reviews for product (for testing)
 * @param {number} productId - Product ID
 * @param {number} count - Number of reviews to generate
 */
export const generateDemoReviews = async (productId, count = 10) => {
  const demoReviews = [
    { text: "Great product! Highly recommended. Quality is excellent.", rating: 5 },
    { text: "Good value for money. Works as expected.", rating: 4 },
    { text: "Average product. Nothing special but does the job.", rating: 3 },
    { text: "Not satisfied. Quality could be better.", rating: 0 },
    { text: "Excellent! Exceeded my expectations. Love it!", rating: 5 },
    { text: "Pretty good. Would buy again.", rating: 4 },
    { text: "Decent product for the price point.", rating: 3 },
    { text: "Amazing quality! Best purchase this year.", rating: 5 },
    { text: "Okay product. Has some issues but usable.", rating: 2 },
    { text: "Very happy with this purchase. Great quality!", rating: 5 }
  ];

  const reviews = [];
  
  for (let i = 0; i < Math.min(count, demoReviews.length); i++) {
    const review = demoReviews[i];
    const sentiment = await analyzeSentiment(review.text);
    
    reviews.push({
      productId,
      reviewText: review.text,
      rating: review.rating,
      sentimentScore: sentiment.score,
      sentimentLabel: sentiment.label
    });
  }

  await ProductReview.bulkCreate(reviews);
  return reviews;
};