import axios from 'axios';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { storage } from '../utils/storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

if (!API_URL) {
  console.warn('EXPO_PUBLIC_API_URL is not defined in .env');
}

const api = axios.create({
  baseURL: API_URL,
  timeout: 300000, // 5 minutes timeout (increased for multi-video uploads)
  maxBodyLength: Infinity,
  maxContentLength: Infinity,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach Token & Language
api.interceptors.request.use(
  async (config) => {
    // 1. Attach Token
    const url = config.url || '';
    
    // Skip attaching token for login/register endpoints to prevent sending stale tokens
    // which can cause 401 errors even with correct credentials
    const isAuthEndpoint = url.includes('/login') || url.includes('/register');
    
    if (!isAuthEndpoint) {
      // Consider requests whose first path segment is `individual` or
      // auth/individual specifically as individual endpoints. This avoids
      // accidental matches like `/company/individual-property-offers`.
      const path = (url.split('?')[0] || '').replace(/(^\/+|\/+$)/g, '');
      const segments = path ? path.split('/') : [];
      const isIndividualRequest = segments[0] === 'individual' || (segments[0] === 'auth' && segments[1] === 'individual');
      const tokenKey = isIndividualRequest ? 'individual_token' : 'auth_token';
      const token = await storage.getItem(tokenKey);
      if (token) config.headers.Authorization = `Bearer ${token}`;
    }

    // 2. Attach Language
    const lang = await AsyncStorage.getItem('app_language');
    config.headers['Accept-Language'] = lang || 'en';

    // Debug logging: full request info (temporary)
    try {
      const base = config.baseURL || API_URL || '';
      const urlPart = config.url || '';
      const fullUrl = base.endsWith('/') ? `${base.slice(0, -1)}${urlPart.startsWith('/') ? urlPart : `/${urlPart}`}` : `${base}${urlPart.startsWith('/') ? urlPart : `/${urlPart}`}`;
      const propertyIdMatch = (config.url || '').match(/properties\/(\d+)/);
      const propertyId = propertyIdMatch ? propertyIdMatch[1] : null;
      console.log('[API REQUEST]', (config.method || 'GET').toString().toUpperCase(), fullUrl, propertyId ? `propertyId=${propertyId}` : '');
      console.log('[API REQUEST] Authorization present:', !!config.headers?.Authorization);
    } catch (e) {
      // ignore logging errors
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    try {
      const url: string = error?.config?.url || '';
      const base: string = error?.config?.baseURL || API_URL || '';
      const fullUrl = base.endsWith('/') ? `${base.slice(0, -1)}${url.startsWith('/') ? url : `/${url}`}` : `${base}${url.startsWith('/') ? url : `/${url}`}`;
      console.error('[API RESPONSE ERROR]', error.response?.status, fullUrl, error.response?.data);
    } catch (e) {
      // ignore logging errors
    }

    if (error.response && error.response.status === 401) {
      const url: string = error?.config?.url || '';

      // Do not perform global redirect for authentication endpoints themselves
      // (e.g. POST /auth/individual/login or POST /auth/login) — let the
      // caller handle login failures (invalid credentials).
      if (url.startsWith('/auth')) {
        return Promise.reject(error);
      }

      const path = (url.split('?')[0] || '').replace(/(^\/+|\/+$)/g, '');
      const segments = path ? path.split('/') : [];
      const isIndividualRequest = segments[0] === 'individual' || (segments[0] === 'auth' && segments[1] === 'individual');

      if (isIndividualRequest) {
        await storage.deleteItem('individual_token');
        await storage.deleteItem('individual_user');
        router.replace('/individual/login');
      } else {
        // Token expired or invalid (company)
        await storage.deleteItem('auth_token');
        await storage.deleteItem('auth_company');
        router.replace('/login');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
