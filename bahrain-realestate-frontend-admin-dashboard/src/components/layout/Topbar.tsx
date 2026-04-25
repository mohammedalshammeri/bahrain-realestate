'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { logout, broadcastLogout, setupLogoutListener } from '@/lib/auth/logout';
import { GlobalSearch } from '@/components/search/GlobalSearch';
import { getDashboardStats } from '@/lib/api/adminApi';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useLanguage } from '@/contexts/LanguageContext';

interface TopbarProps {
  title: string;
  onMenuClickAction: () => void;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  link: string;
  type: 'info' | 'warning' | 'success' | 'error';
  time: string;
}

interface TopbarDashboardStats {
  statistics: {
    companies: {
      pending: number;
    };
    complaints: {
      open: number;
    };
  };
}

export default function Topbar({ title, onMenuClickAction }: TopbarProps) {
  const router = useRouter();
  const { t } = useLanguage();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  const notificationRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Setup cross-tab logout listener
  useEffect(() => {
    const cleanup = setupLogoutListener(router);
    return cleanup;
  }, [router]);

  // Fetch notifications (derived from stats)
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await getDashboardStats();
        if (response.success && response.data) {
          const stats = (response.data as TopbarDashboardStats).statistics;
          const newNotifications: Notification[] = [];

          if (stats.companies.pending > 0) {
            newNotifications.push({
              id: 'pending-companies',
              title: t('dashboard.companies.pending'),
              message: t('dashboard.companies.waitingApproval', { count: stats.companies.pending }),
              link: '/companies?status=pending',
              type: 'warning',
              time: t('common.now')
            });
          }

          if (stats.complaints.open > 0) {
            newNotifications.push({
              id: 'open-complaints',
              title: t('dashboard.complaints.new'),
              message: t('dashboard.complaints.received', { count: stats.complaints.open }),
              link: '/complaints?status=new',
              type: 'error',
              time: t('common.now')
            });
          }

          setNotifications(newNotifications);
          setUnreadCount(newNotifications.length);
        }
      } catch (error) {
        console.error('Failed to fetch notifications', error);
      }
    };

    fetchNotifications();
    // Poll every minute
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
    setIsNotificationsOpen(false);
  };

  const toggleNotifications = () => {
    setIsNotificationsOpen(!isNotificationsOpen);
    setIsDropdownOpen(false);
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    setIsDropdownOpen(false);
    
    // Brief loading delay for better UX
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Broadcast logout to other tabs
    broadcastLogout();
    
    // Perform logout with utility function
    logout(router);
  };

  return (
    <header className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40 px-4 py-3 flex items-center justify-between">
      {/* Left Side - Menu Button + Title */}
      <div className="flex items-center space-x-4">
        {/* Mobile Menu Button */}
        <button
          onClick={onMenuClickAction}
          className="lg:hidden p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>

        {/* Page Title */}
        <h1 className="text-lg font-bold text-gray-800 dark:text-white hidden sm:block tracking-tight">
          {title === 'Dashboard' ? t('common.dashboard') : title}
        </h1>
      </div>

      {/* Right Side - Search + Notifications + Admin Menu */}
      <div className="flex items-center space-x-2 sm:space-x-4 rtl:space-x-reverse">
        {/* Language Switcher */}
        <LanguageSwitcher />

        {/* Notifications */}
        <div className="relative" ref={notificationRef}>
          <button 
            onClick={toggleNotifications}
            className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 relative transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
            </svg>
            {/* Notification Badge */}
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-gray-800"></span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {isNotificationsOpen && (
            <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 py-2 z-50 transform origin-top-right transition-all">
              <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{t('dashboard.notifications')}</h3>
                {unreadCount > 0 && (
                  <span className="text-xs font-medium text-blue-600 dark:text-blue-400 cursor-pointer hover:underline" onClick={() => setUnreadCount(0)}>
                    {t('dashboard.markAllRead')}
                  </span>
                )}
              </div>
              <div className="max-h-[32rem] overflow-y-auto custom-scrollbar">
                {notifications.length > 0 ? (
                  notifications.map((notification) => (
                    <div 
                      key={notification.id}
                      onClick={() => {
                        router.push(notification.link);
                        setIsNotificationsOpen(false);
                      }}
                      className="px-4 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer border-b border-gray-50 dark:border-gray-700/50 last:border-0 transition-colors"
                    >
                      <div className="flex gap-4">
                        <div className={`flex-shrink-0 w-2 h-2 mt-2 rounded-full ${
                          notification.type === 'warning' ? 'bg-amber-400' : 
                          notification.type === 'error' ? 'bg-red-400' : 'bg-blue-400'
                        }`}></div>
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">{notification.title}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{notification.message}</p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 pt-1">{notification.time}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-8 text-center">
                    <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 mb-3">
                       <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" /></svg>
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">{t('dashboard.noNotifications')}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Admin Avatar + Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={toggleDropdown}
            className="flex items-center space-x-2 sm:space-x-3 p-1.5 sm:p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 border border-transparent hover:border-gray-200 dark:hover:border-gray-600"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <div className="hidden md:block text-left">
              <div className="text-sm font-semibold text-gray-900 dark:text-white leading-none mb-1">{t('adminUsers.roles.admin')}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">admin@propertyhub.bh</div>
            </div>
            <svg className={`hidden md:block w-4 h-4 text-gray-400 dark:text-gray-500 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-3 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 py-2 z-50 transform origin-top-right">
              
               <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 md:hidden">
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">{t('adminUsers.roles.admin')}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">admin@propertyhub.bh</div>
              </div>

              <a
                href="/admin/profile"
                className="flex items-center px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <svg className="w-4 h-4 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
                {t('common.profile')}
              </a>
              
              <a
                href="/admin/settings"
                className="flex items-center px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <svg className="w-4 h-4 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {t('common.settings')}
              </a>

              <hr className="my-1 border-gray-100 dark:border-gray-700 mx-2" />

              <button
                onClick={handleLogout}
                className="flex items-center w-full px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                </svg>
                {t('common.logout')}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Overlay for dropdown */}
      {isDropdownOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/5"
          onClick={() => setIsDropdownOpen(false)}
        />
      )}

      {/* Logout Loading Overlay */}
      {isLoggingOut && (
        <div className="fixed inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center shadow-xl border border-gray-100 dark:border-gray-700">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-800 dark:text-white font-medium">{t('auth.loggingOut')}</p>
          </div>
        </div>
      )}
    </header>
  );
}
