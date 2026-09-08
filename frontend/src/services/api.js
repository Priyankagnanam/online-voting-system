import axios from "axios";

const BACKEND_URL = 'https://voting-backend-zn31.onrender.com';

const envBase = import.meta.env.VITE_API_URL || '';
const isLocalhost =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

const defaultBase = isLocalhost ? '' : BACKEND_URL;

const rawBase = envBase || defaultBase;
const cleanBase = rawBase
  ? (rawBase.startsWith('http://') || rawBase.startsWith('https://') ? rawBase : `https://${rawBase}`).replace(/\/+$/, '')
  : '';

const api = axios.create({
  baseURL: cleanBase ? `${cleanBase}/api` : '/api',
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      // Only redirect if not already on auth pages
      if (!window.location.pathname.startsWith('/login') &&
          !window.location.pathname.startsWith('/admin/login') &&
          !window.location.pathname.startsWith('/register')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
