import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const client = axios.create({
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Dynamic IP resolution and auth injections
client.interceptors.request.use(
  async (config) => {
    // Prefix relative paths with the current active Server URL from AsyncStorage
    if (!config.url.startsWith('http')) {
      const savedUrl = await AsyncStorage.getItem('@leopard_server_url');
      const base = savedUrl ? savedUrl.trim().replace(/\/$/, '') : 'http://192.168.1.100:3000';
      
      // Ensure url starts with a slash
      const path = config.url.startsWith('/') ? config.url : `/${config.url}`;
      config.url = `${base}${path}`;
    }

    // Inject Auth headers for future JWT authentication support
    const token = await AsyncStorage.getItem('@leopard_auth_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Centralized error handling
client.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle network error, timeouts, or unauthorized sessions
    if (!error.response) {
      console.warn('Network Error: Unable to connect to server');
    } else if (error.response.status === 401) {
      console.warn('Session Expired / Unauthorized request');
    }
    return Promise.reject(error);
  }
);

export default client;
