import { create } from 'zustand';
import { storage } from '../utils/storage';
import { IndividualUser } from '../types/individual';

interface IndividualAuthState {
  token: string | null;
  user: IndividualUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: IndividualUser) => Promise<void>;
  setUser: (user: IndividualUser) => Promise<void>;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
}

const TOKEN_KEY = 'individual_token';
const USER_KEY = 'individual_user';

export const useIndividualAuthStore = create<IndividualAuthState>((set) => ({
  token: null,
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (token, user) => {
    await storage.setItem(TOKEN_KEY, token);
    await storage.setItem(USER_KEY, JSON.stringify(user));
    set({ token, user, isAuthenticated: true });
  },

  setUser: async (user) => {
    await storage.setItem(USER_KEY, JSON.stringify(user));
    set({ user });
  },

  logout: async () => {
    await storage.deleteItem(TOKEN_KEY);
    await storage.deleteItem(USER_KEY);
    set({ token: null, user: null, isAuthenticated: false });
  },

  hydrate: async () => {
    const token = await storage.getItem(TOKEN_KEY);
    const userStr = await storage.getItem(USER_KEY);

    if (token && userStr) {
      set({ token, user: JSON.parse(userStr), isAuthenticated: true, isLoading: false });
    } else {
      set({ token: null, user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
