'use client';

import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

interface AdminLayoutProps {
  children: React.ReactNode;
  pageTitle?: string;
}

export default function AdminLayout({ children, pageTitle = 'Dashboard' }: AdminLayoutProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Handle responsive sidebar behavior
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsSidebarCollapsed(false);
        setIsMobileMenuOpen(false);
      }
    };

    handleResize(); // Check initial screen size
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => {
    if (window.innerWidth < 1024) {
      setIsMobileMenuOpen(!isMobileMenuOpen);
    } else {
      setIsSidebarCollapsed(!isSidebarCollapsed);
    }
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-30 bg-black bg-opacity-50 lg:hidden"
          onClick={closeMobileMenu}
        />
      )}

      {/* Sidebar */}
      <div className={`
        lg:block
        ${isMobileMenuOpen ? 'block' : 'hidden lg:block'}
        ${isSidebarCollapsed ? 'lg:w-16' : 'lg:w-64'}
      `}>        <Sidebar 
          isCollapsed={isSidebarCollapsed} 
          onToggleAction={toggleSidebar}
        />
      </div>

      {/* Main Content Area */}
      <div className={`
        transition-all duration-300 ease-in-out
        ${isSidebarCollapsed ? 'lg:ms-16' : 'lg:ms-64'}
      `}>
        {/* Topbar */}        <Topbar 
          title={pageTitle}
          onMenuClickAction={toggleSidebar}
        />

        {/* Page Content */}
        <main className="p-4 lg:p-6">
          <div className="max-w-full mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

// Export individual components for direct use if needed
export { default as Sidebar } from './Sidebar';
export { default as Topbar } from './Topbar';
