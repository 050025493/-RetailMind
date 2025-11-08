const API_URL = 'http://localhost:4000/api';

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

// Auth API
export const authAPI = {
  login: async (email: string, password: string) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return res.json();
  },

  register: async (name: string, email: string, password: string) => {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    return res.json();
  },
};

// Products API
export const productsAPI = {
  getAll: async (filters?: { category?: string; search?: string }) => {
    const params = new URLSearchParams(filters as any);
    const res = await fetch(`${API_URL}/products?${params}`, {
      headers: getAuthHeader(),
    });
    return res.json();
  },

  getOne: async (id: number) => {
    const res = await fetch(`${API_URL}/products/${id}`, {
      headers: getAuthHeader(),
    });
    return res.json();
  },

  getStats: async () => {
    const res = await fetch(`${API_URL}/products/stats`, {
      headers: getAuthHeader(),
    });
    return res.json();
  },

  getCategories: async () => {
    const res = await fetch(`${API_URL}/products/categories`, {
      headers: getAuthHeader(),
    });
    return res.json();
  },

  getLowStock: async (threshold = 10) => {
    const res = await fetch(`${API_URL}/products/low-stock?threshold=${threshold}`, {
      headers: getAuthHeader(),
    });
    return res.json();
  },
};

// Import API
export const importAPI = {
  seedDemo: async () => {
    const res = await fetch(`${API_URL}/import/seed-demo`, {
      method: 'POST',
      headers: getAuthHeader(),
    });
    return res.json();
  },

  bulkImport: async (products: any[]) => {
    const res = await fetch(`${API_URL}/import/products`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify({ products }),
    });
    return res.json();
  },
};

// Dashboard API
export const dashboardAPI = {
  getStats: async () => {
    const res = await fetch(`${API_URL}/dashboard/stats`, {
      headers: getAuthHeader(),
    });
    return res.json();
  },

  getRevenueTrend: async (months = 6) => {
    const res = await fetch(`${API_URL}/dashboard/revenue-trend?months=${months}`, {
      headers: getAuthHeader(),
    });
    return res.json();
  },

  getCategorySales: async () => {
    const res = await fetch(`${API_URL}/dashboard/category-sales`, {
      headers: getAuthHeader(),
    });
    return res.json();
  },

  getAlerts: async () => {
    const res = await fetch(`${API_URL}/dashboard/alerts`, {
      headers: getAuthHeader(),
    });
    return res.json();
  },

  markAlertRead: async (id: number) => {
    const res = await fetch(`${API_URL}/dashboard/alerts/${id}/read`, {
      method: "PUT",
      headers: getAuthHeader(),
    });
    return res.json();
  },

  getTopProducts: async (limit = 5) => {
    const res = await fetch(`${API_URL}/dashboard/top-products?limit=${limit}`, {
      headers: getAuthHeader(),
    });
    return res.json();
  },
};
// --- Scenarios API ---
export const scenariosAPI = {
  // 🧠 Fetch all saved scenarios
  getAll: async () => {
    const res = await fetch(`${API_URL}/scenarios`, {
      headers: getAuthHeader(),
    });
    return res.json();
  },

  // 🪄 Create a new scenario (Gemini AI prompt backend)
  create: async (scenarioData: {
    name: string;
    timePeriod: number;
    priceChange: number;
    demandLift: number;
    competitionFactor: string;
    includeStock: boolean;
    includeSeasonal: boolean;
    includeBundle: boolean;
    includeLoyalty: boolean;
  }) => {
    const res = await fetch(`${API_URL}/scenarios`, {
      method: "POST",
      headers: getAuthHeader(),
      body: JSON.stringify(scenarioData),
    });
    return res.json();
  },

  // ❌ Delete a scenario
  delete: async (id: number) => {
    const res = await fetch(`${API_URL}/scenarios/${id}`, {
      method: "DELETE",
      headers: getAuthHeader(),
    });
    return res.json();
  },
};