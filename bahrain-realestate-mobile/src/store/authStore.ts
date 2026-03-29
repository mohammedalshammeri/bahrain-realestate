import { create } from 'zustand';
import { storage } from '../utils/storage';
import { AuthState, CompanyProfile } from '../types/auth';
import { router } from 'expo-router';

interface AuthStore extends AuthState {
  login: (token: string, company: CompanyProfile) => Promise<void>;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
}

const TOKEN_KEY = 'auth_token';
const COMPANY_KEY = 'auth_company';

export const useAuthStore = create<AuthStore>((set) => ({
  token: null,
  company: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (token, company) => {
    try {
      await storage.setItem(TOKEN_KEY, token);
      await storage.setItem(COMPANY_KEY, JSON.stringify(company));
      set({ token, company, isAuthenticated: true });
    } catch (error) {
      console.error('Error saving auth data:', error);
    }
  },

  logout: async () => {
    try {
      await storage.deleteItem(TOKEN_KEY);
      await storage.deleteItem(COMPANY_KEY);
      set({ token: null, company: null, isAuthenticated: false });
      router.replace('/');
    } catch (error) {
      console.error('Error clearing auth data:', error);
    }
  },

  hydrate: async () => {
    try {
      const token = await storage.getItem(TOKEN_KEY);
      const companyStr = await storage.getItem(COMPANY_KEY);
      
      if (token && companyStr) {
        const company = JSON.parse(companyStr);
        set({ token, company, isAuthenticated: true, isLoading: false });
      } else {
        set({ token: null, company: null, isAuthenticated: false, isLoading: false });
      }
    } catch (error) {
      console.error('Error hydrating auth:', error);
      set({ token: null, company: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
