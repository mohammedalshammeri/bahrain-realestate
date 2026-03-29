'use client';

import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

/**
 * Comprehensive logout function that clears all authentication data
 * and redirects user to login page
 */
export function logout(router?: AppRouterInstance): void {
  // Clear localStorage
  if (typeof window !== 'undefined') {
    localStorage.removeItem('admin_token');
    
    // Clear all localStorage items that might contain sensitive data
    const keysToRemove = Object.keys(localStorage).filter(key => 
      key.includes('admin') || key.includes('token') || key.includes('auth')
    );
    keysToRemove.forEach(key => localStorage.removeItem(key));
  }

  // Clear cookies
  if (typeof document !== 'undefined') {
    // Clear the admin_token cookie
    document.cookie = 'admin_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=' + window.location.hostname;
    document.cookie = 'admin_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    
    // Clear any other auth-related cookies
    const authCookies = ['admin_token', 'auth_token', 'token'];
    authCookies.forEach(cookieName => {
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname}`;
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${window.location.hostname}`;
    });
  }

  // Redirect to login page
  if (router) {
    router.push('/auth/login');
  } else if (typeof window !== 'undefined') {
    window.location.href = '/auth/login';
  }
}

/**
 * Check if user is authenticated by verifying token existence
 */
export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Check localStorage
  const localToken = localStorage.getItem('admin_token');
  if (localToken) return true;
  
  // Check cookies as fallback
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'admin_token' && value && value !== '') {
      return true;
    }
  }
  
  return false;
}

/**
 * Force logout across all tabs/windows by using localStorage events
 */
export function broadcastLogout(): void {
  if (typeof window !== 'undefined') {
    // Trigger storage event to notify other tabs
    localStorage.setItem('logout-broadcast', Date.now().toString());
    localStorage.removeItem('logout-broadcast');
  }
}

/**
 * Listen for logout events from other tabs
 */
export function setupLogoutListener(router: AppRouterInstance): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === 'logout-broadcast') {
      logout(router);
    }
  };

  window.addEventListener('storage', handleStorageChange);
  
  // Return cleanup function
  return () => {
    window.removeEventListener('storage', handleStorageChange);
  };
}
