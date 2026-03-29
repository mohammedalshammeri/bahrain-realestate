'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminLayout } from '@/components/layout';
import { setupLogoutListener, isAuthenticated as checkAuth } from '@/lib/auth/logout';

interface AdminLayoutPageProps {
  children: React.ReactNode;
}

export default function AdminLayoutPage({ children }: AdminLayoutPageProps) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  useEffect(() => {
    const performAuthCheck = () => {
      // Check if we're in the browser (client-side)
      if (typeof window !== 'undefined') {
        const authenticated = checkAuth();
        
        if (!authenticated) {
          // No token found, redirect to login
          router.push('/auth/login');
          return;
        }

        // Token exists, user is authenticated
        setIsAuthenticated(true);
      }
    };

    // Initial auth check
    performAuthCheck();

    // Setup logout listener for cross-tab synchronization
    const cleanup = setupLogoutListener(router);

    // Also listen for storage changes to react to login/logout in other tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'admin_token') {
        if (!e.newValue) {
          // Token was removed, redirect to login
          router.push('/auth/login');
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      cleanup();
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [router]);

  // Loading screen while checking authentication
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-xl">BPH</span>
          </div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Only render AdminLayout and children when authenticated
  if (isAuthenticated) {
    return (
      <AdminLayout>
        {children}
      </AdminLayout>
    );
  }

  // Return null while redirecting (shouldn't be visible)
  return null;
}
