import axios from 'axios';

const AI_API_URL = 'http://localhost:5001'; // Make sure this is port 5001

/**
 * @desc Tell the AI server to train and save a new model
 * @param {Array} historicalData The user's real sales data
 */
export const trainAIModel = async (historicalData) => {
  try {
    // This calls your new /train route
    const response = await axios.post(`${AI_API_URL}/train`, {
      historical_data: historicalData,
    });
    return response.data; // Returns { success: true, message: ... }
  } catch (error) {
    console.error('Error calling AI train service:', error.message);
    throw new Error('Could not train AI model');
  }
};

/**
 * @desc Get a demand forecast from the AI server
 * @param {Array} historicalData The user's real sales data (for feature creation)
 * @param {number} days The number of days to forecast
 */
export const getAIDemandForecast = async (historicalData, days = 30) => {
  try {
    // This calls your /predict/demand route
    const response = await axios.post(`${AI_API_URL}/predict/demand`, {
      historical_data: historicalData,
      days_to_forecast: days,
    });
    return response.data; // Returns { success, forecast: [...] }
  } catch (error) {
    let aiErrorMessage = 'Could not get prediction from AI server';
    if (error.response && error.response.data && error.response.data.message) {
      aiErrorMessage = `AI Error: ${error.response.data.message}`;
    } else if (error.message) {
      aiErrorMessage = error.message;
    }
    console.error('Error calling AI forecast service:', aiErrorMessage);
    throw new Error(aiErrorMessage);
  }
};