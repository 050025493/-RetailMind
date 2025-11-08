// frontend/src/lib/competitorApi.ts
const API_URL = 'http://localhost:4000/api';

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

export const competitorAPI = {
  // Get all products with competitor status
  getAllStatus: async () => {
    const res = await fetch(`${API_URL}/competitors`, {
      headers: getAuthHeader(),
    });
    return res.json();
  },

  // Get competitor prices for a specific product
  getProductCompetitors: async (productId: number) => {
    const res = await fetch(`${API_URL}/competitors/${productId}`, {
      headers: getAuthHeader(),
    });
    return res.json();
  },

  // Refresh competitor prices
  refreshPrices: async (productId: number) => {
    const res = await fetch(`${API_URL}/competitors/${productId}/refresh`, {
      method: 'POST',
      headers: getAuthHeader(),
    });
    return res.json();
  },

  // Get detailed analysis
  getAnalysis: async (productId: number) => {
    const res = await fetch(`${API_URL}/competitors/${productId}/analysis`, {
      headers: getAuthHeader(),
    });
    return res.json();
  },
};