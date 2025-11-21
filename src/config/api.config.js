/**
 * API Configuration
 * Settings for API communication
 */

export const apiConfig = {
  // Base API URL
  baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:3001',

  // Request Configuration
  timeout: 30000, // 30 seconds
  retryAttempts: 3,
  retryDelay: 1000, // 1 second

  // Headers
  defaultHeaders: {
    'Content-Type': 'application/json',
  },
};

export default apiConfig;
