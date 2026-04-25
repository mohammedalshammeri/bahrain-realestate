'use client';

import { useCallback, useEffect, useState } from 'react';
import { getProfile, AdminProfile, ApiError } from '@/lib/api/adminApi';
import { useLanguage } from '@/contexts/LanguageContext';

export default function ProfilePage() {
  const { t } = useLanguage();
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await getProfile();
      setProfile(response.data as AdminProfile);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError(t('profile.errors.loadingProfile'));
      }
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void fetchProfile();
  }, [fetchProfile]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleBadge = (role: string) => {
    const baseClasses = "px-2 py-0.5 text-xs font-medium rounded-full";
    switch (role) {
      case 'SUPER_ADMIN':
        return `${baseClasses} bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400`;
      case 'ADMIN':
        return `${baseClasses} bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300`;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return t('profile.roles.superAdmin');
      case 'ADMIN':
        return t('profile.roles.admin');
      default:
        return role;
    }
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="max-w-[1600px] mx-auto space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-6"></div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="animate-pulse space-y-6">
            {/* Avatar skeleton */}
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
              <div className="flex-1">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
              </div>
            </div>
            
            {/* Form skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-2"></div>
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
              <div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-2"></div>
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
              <div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-2"></div>
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
              <div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-2"></div>
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            </div>
            
            {/* Button skeleton */}
            <div className="flex justify-end">
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-[1600px] mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('profile.title')}</h1>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12">
          <div className="text-center">
            <svg className="mx-auto h-12 w-12 text-red-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.98-.833-2.75 0L3.064 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">{t('profile.errors.loadingProfile')}</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
            <button 
              onClick={fetchProfile}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {t('profile.errors.tryAgain')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main profile content
  return (
    <div className="max-w-[1600px] mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('profile.title')}</h1>
      
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        {/* Profile Header */}
        <div className="px-6 py-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-6">
            {/* Avatar */}
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg">
              {profile?.name ? profile.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'AD'}
            </div>
            
            {/* Basic Info */}
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                {profile?.name || t('profile.roles.admin')}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-3">{profile?.email}</p>
              <span className={getRoleBadge(profile?.role || 'ADMIN')}>
                {getRoleLabel(profile?.role || 'ADMIN')}
              </span>
            </div>
          </div>
        </div>

        {/* Profile Details Form */}
        <div className="px-6 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name Field */}
            <div>
              <label className="block text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('profile.fullName')}
              </label>
              <div className="px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-lg text-base text-gray-900 dark:text-white">
                {profile?.name || t('common.na')}
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('profile.email')}
              </label>
              <div className="px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-lg text-base text-gray-900 dark:text-white">
                {profile?.email || t('common.na')}
              </div>
            </div>

            {/* Role Field */}
            <div>
              <label className="block text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('profile.role')}
              </label>
              <div className="px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-lg text-base">
                <span className={getRoleBadge(profile?.role || 'ADMIN')}>
                  {getRoleLabel(profile?.role || 'ADMIN')}
                </span>
              </div>
            </div>

            {/* Created At Field */}
            <div>
              <label className="block text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('profile.accountCreated')}
              </label>
              <div className="px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-lg text-base text-gray-900 dark:text-white">
                {profile?.createdAt ? formatDate(profile.createdAt) : t('common.na')}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button 
              onClick={() => {
                alert(t('profile.messages.editComingSoon'));
              }}
              className="inline-flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 text-base"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              {t('profile.editProfile')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
