'use client';

import { useState, useEffect } from 'react';
import { adminApi, updateCompanyStatus, deleteCompany } from '@/lib/api/adminApi';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import ExpiringPropertiesNotification from '@/components/ExpiringPropertiesNotification';

interface DashboardStats {
  statistics: {
    companies: {
      total: number;
      pending: number;
      approved: number;
      rejected: number;
      blocked: number;
    };
    employees: {
      total: number;
    };
    properties: {
      total: number;
      active: number;
      featured: number;
    };
    complaints: {
      open: number;
    };
  };
  recentActivities: {
    companies: any[];
    properties: any[];
  };
}

export default function AdminDashboard() {
  const { t, language } = useLanguage();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  const fetchDashboardData = async () => {
    try {
      // Check if user is authenticated
      if (!adminApi.isAuthenticated()) {
        router.push('/auth/login');
        return;
      }

      setLoading(true);
      const response = await adminApi.getDashboardStats();
      
      if (response.success) {
        setStats(response.data);
      } else {
        setError(response.message || t('dashboard.loadingFailed'));
      }
    } catch (error: any) {
      console.error('Dashboard error:', error);
      if (error.message.includes('401')) {
        router.push('/auth/login');
      } else {
        setError(error.message || t('dashboard.errorFetch'));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [router]);

  const handleLogout = () => {
    adminApi.logout();
  };

  const handleStatusChange = async (id: number, newStatus: string) => {
    try {
      await updateCompanyStatus(id, newStatus);
      fetchDashboardData(); // Refresh data
    } catch (err) {
      alert('Failed to update company status');
    }
  };

  const handleDeleteCompany = async (id: number) => {
    if (confirm(t('companies.messages.confirmDelete'))) {
      try {
        await deleteCompany(id);
        fetchDashboardData(); // Refresh data
      } catch (err) {
        alert(t('companies.messages.deleteFail'));
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            {t('dashboard.retry')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-12">
      <ExpiringPropertiesNotification />
      
      {/* Top Navigation - Mobile Friendly */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-100 dark:border-gray-700">
        <div className="max-w-[1600px] mx-auto">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-blue-600 bg-clip-text text-transparent">
              {t('dashboard.title')}
            </h1>
            <div className="flex items-center gap-4">
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors shadow-sm"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                </svg>
                {t('common.logout')}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto space-y-8">
        
        {/* Welcome Section */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 sm:p-10 shadow-lg text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white opacity-10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-white opacity-10 rounded-full blur-3xl"></div>
          
          <div className="relative z-10">
            <h2 className="text-3xl font-bold mb-2">Welcome back, Admin! 👋</h2>
            <p className="text-blue-100 max-w-xl text-lg">
              Here's what's happening with your real estate platform today.
            </p>
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
            {t('dashboard.quickActions')}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button onClick={() => router.push('/companies')} className="group bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm hover:shadow-md transition-all border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center text-center gap-3">
              <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
                </svg>
              </div>
              <span className="font-semibold text-gray-900 dark:text-gray-100">{t('dashboard.manageCompanies')}</span>
            </button>

            <button onClick={() => router.push('/properties')} className="group bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm hover:shadow-md transition-all border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center text-center gap-3">
              <div className="w-12 h-12 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205l3 1m1.5.5l-1.5-.5M6.75 7.364V3h-3v18m3-13.636l10.5-3.819" />
                </svg>
              </div>
              <span className="font-semibold text-gray-900 dark:text-gray-100">{t('dashboard.manageProperties')}</span>
            </button>

            <button onClick={() => router.push('/ads')} className="group bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm hover:shadow-md transition-all border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center text-center gap-3">
              <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282m3.102.069a18.03 18.03 0 01-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 018.835 2.535M10.34 6.66a23.847 23.847 0 018.835-2.535m0 0A23.74 23.74 0 0018.795 3m.38 1.125a23.91 23.91 0 011.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 001.014-5.395m0-3.46c.495.43.72 1.125.72 2.159 0 1.034-.225 1.729-.72 2.16m-4.24 3.396a18.963 18.963 0 005.47-5.556m-5.47 5.556a18.963 18.963 0 005.47 5.556" />
                </svg>
              </div>
              <span className="font-semibold text-gray-900 dark:text-gray-100">{t('dashboard.manageAds')}</span>
            </button>

            <button onClick={() => router.push('/complaints')} className="group bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm hover:shadow-md transition-all border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center text-center gap-3">
              <div className="w-12 h-12 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                   <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
              <span className="font-semibold text-gray-900 dark:text-gray-100">{t('dashboard.viewComplaints')}</span>
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div>
           <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" />
            </svg>
            Overview
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Companies Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden group">
              <div className="absolute right-0 top-0 opacity-5 dark:opacity-10 transform translate-x-1/4 -translate-y-1/4 group-hover:scale-110 transition-transform duration-500">
                 <svg className="w-32 h-32 text-blue-600" fill="currentColor" viewBox="0 0 24 24"><path d="M3 21h18v-2H3v2zm0-4h18v-2H3v2zm0-4h18v-2H3v2zm0-4h18V7H3v2zm0-6v2h18V3H3z"/></svg> 
              </div>
              <div className="relative z-10">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('dashboard.totalCompanies')}</p>
                <div className="flex items-baseline mt-2">
                  <h3 className="text-3xl font-bold text-gray-900 dark:text-white">
                    {stats?.statistics.companies.total || 0}
                  </h3>
                </div>
                <div className="mt-4 flex flex-wrap gap-2 text-xs">
                  <span className="inline-flex items-center px-2 py-1 rounded-md bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300 ring-1 ring-inset ring-green-600/20">
                     {stats?.statistics.companies.approved || 0} Approved
                  </span>
                  <span className="inline-flex items-center px-2 py-1 rounded-md bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300 ring-1 ring-inset ring-yellow-600/20">
                     {stats?.statistics.companies.pending || 0} Active
                  </span>
                </div>
              </div>
            </div>

            {/* Employees Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden group">
               <div className="absolute right-0 top-0 opacity-5 dark:opacity-10 transform translate-x-1/4 -translate-y-1/4 group-hover:scale-110 transition-transform duration-500">
                 <svg className="w-32 h-32 text-green-600" fill="currentColor" viewBox="0 0 24 24"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg> 
              </div>
              <div className="relative z-10">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('dashboard.totalEmployees')}</p>
                <div className="flex items-baseline mt-2">
                  <h3 className="text-3xl font-bold text-gray-900 dark:text-white">
                    {stats?.statistics.employees.total || 0}
                  </h3>
                </div>
                <div className="mt-4 text-xs text-gray-500">
                  Registered active users across all companies
                </div>
              </div>
            </div>

             {/* Properties Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden group">
               <div className="absolute right-0 top-0 opacity-5 dark:opacity-10 transform translate-x-1/4 -translate-y-1/4 group-hover:scale-110 transition-transform duration-500">
                 <svg className="w-32 h-32 text-purple-600" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3L2 12h3v8h6v-6h2v6h6v-8h3L12 3zm0 4.5c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2z"/></svg> 
              </div>
              <div className="relative z-10">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('dashboard.totalProperties')}</p>
                 <div className="flex items-baseline mt-2">
                  <h3 className="text-3xl font-bold text-gray-900 dark:text-white">
                    {stats?.statistics.properties.total || 0}
                  </h3>
                </div>
                <div className="mt-4 flex flex-wrap gap-2 text-xs">
                  <span className="inline-flex items-center px-2 py-1 rounded-md bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300 ring-1 ring-inset ring-green-600/20">
                     {stats?.statistics.properties.active || 0} Active
                  </span>
                  <span className="inline-flex items-center px-2 py-1 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 ring-1 ring-inset ring-blue-600/20">
                     {stats?.statistics.properties.featured || 0} Featured
                  </span>
                </div>
              </div>
            </div>

            {/* Complaints Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden group">
               <div className="absolute right-0 top-0 opacity-5 dark:opacity-10 transform translate-x-1/4 -translate-y-1/4 group-hover:scale-110 transition-transform duration-500">
                 <svg className="w-32 h-32 text-red-600" fill="currentColor" viewBox="0 0 24 24"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg> 
              </div>
              <div className="relative z-10">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('dashboard.openComplaints')}</p>
                 <div className="flex items-baseline mt-2">
                  <h3 className="text-3xl font-bold text-gray-900 dark:text-white">
                    {stats?.statistics.complaints.open || 0}
                  </h3>
                </div>
                 <div className="mt-4 text-xs">
                  <span className="text-red-500 font-medium">Attention needed</span>. Review latest reports.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Activity Section */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          
          {/* Recent Companies */}
          <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
             <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
               <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                 <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                 {t('dashboard.recentCompanies')}
               </h3>
               <button onClick={() => router.push('/companies')} className="text-sm text-blue-600 hover:text-blue-700 font-medium">View all</button>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {stats?.recentActivities.companies.map((company) => (
                <div key={company.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{company.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(company.createdAt).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={company.status}
                        onChange={(e) => handleStatusChange(company.id, e.target.value)}
                        className={`text-xs font-semibold rounded-full pl-2 pr-6 py-1 border-0 cursor-pointer focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 transition-shadow ${
                          company.status === 'approved' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200'
                            : company.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200'
                            : company.status === 'rejected'
                            ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200'
                        }`}
                      >
                        <option value="pending">{t('dashboard.pending')}</option>
                        <option value="approved">{t('dashboard.approved')}</option>
                        <option value="rejected">{t('dashboard.rejected')}</option>
                        <option value="blocked">{t('dashboard.blocked')}</option>
                      </select>
                      
                       <button
                          onClick={() => handleDeleteCompany(company.id)}
                          className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 p-1.5 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                    </div>
                  </div>
                </div>
              ))}
              {!stats?.recentActivities.companies.length && (
                <div className="p-8 text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 mb-3">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">{t('dashboard.noNewCompanies')}</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Properties */}
          <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
             <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
               <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                 <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                 {t('dashboard.recentProperties')}
               </h3>
               <button onClick={() => router.push('/properties')} className="text-sm text-blue-600 hover:text-blue-700 font-medium">View all</button>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {stats?.recentActivities.properties.map((property) => (
                <div key={property.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex gap-3">
                       <div className="h-10 w-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
                         <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
                       </div>
                       <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-1">
                            {property.description || 'No description available'}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1">
                            <span className="w-1 h-1 rounded-full bg-gray-400"></span>
                            {property.company?.name || 'Unknown Company'}
                          </p>
                       </div>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                      {property.price} BHD
                    </span>
                  </div>
                </div>
              ))}
              {!stats?.recentActivities.properties.length && (
                 <div className="p-8 text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 mb-3">
                     <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">{t('dashboard.noNewProperties')}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );}
