import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Response interceptor for clean error handling
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.warn('API Call Notice:', error.message);
    return Promise.reject(error);
  }
);

export default apiClient;
