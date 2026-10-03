import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const api = {
  getHealth: async () => {
    const res = await client.get('/health');
    return res.data;
  },

  getModelInfo: async () => {
    const res = await client.get('/model/info');
    return res.data;
  },

  predictChurn: async (customerData, threshold = null) => {
    const params = threshold ? { threshold } : {};
    const res = await client.post('/predict', customerData, { params });
    return res.data;
  },

  predictBatch: async (file, threshold = null) => {
    const formData = new FormData();
    formData.append('file', file);
    const params = threshold ? { threshold } : {};
    const res = await client.post('/predict/batch', formData, {
      params,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },

  explainCustomer: async (customerData) => {
    const res = await client.post('/explain', customerData);
    return res.data;
  },

  getAnalyticsSummary: async () => {
    const res = await client.get('/analytics/summary');
    return res.data;
  },

  getChurnDistributions: async () => {
    const res = await client.get('/analytics/churn-distribution');
    return res.data;
  },

  getSampleCustomers: async () => {
    const res = await client.get('/analytics/samples');
    return res.data;
  },

  simulateWhatIf: async (payload) => {
    const res = await client.post('/whatif', payload);
    return res.data;
  },
};
