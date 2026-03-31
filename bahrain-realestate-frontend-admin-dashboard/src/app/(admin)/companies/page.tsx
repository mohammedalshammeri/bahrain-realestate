'use client';

import { useState, useEffect } from 'react';
import { getCompanies, updateCompanyStatus, Company, ApiError } from '@/lib/api/adminApi';
import { useToast } from '@/components/ui/Toast';
import { useLanguage } from '@/contexts/LanguageContext';

export default function CompaniesPage() {
  const { t, language } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
    limit: 10
  });
  const { showToast, ToastContainer } = useToast();

  const fetchCompanies = async (page: number = 1, search?: string, status?: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await getCompanies(search, page, 10, status);
      
      if (response.success && response.data && Array.isArray(response.data.companies)) {
        setCompanies(response.data.companies);
        
        if (response.data.pagination) {
          setPagination({
            page: response.data.pagination.currentPage || 1,
            totalPages: response.data.pagination.totalPages || 1,
            total: response.data.pagination.totalCount || 0,
            limit: response.data.pagination.limit || 10
          });
        }
      } else {
        setCompanies([]);
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError(t('companies.failedLoad'));
      }
      setCompanies([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (companyId: number, newStatus: string, reason?: string) => {
    try {
      await updateCompanyStatus(companyId, newStatus, reason);
      showToast({
        message: t('companies.statusUpdated'),
        type: 'success'
      });
      fetchCompanies(pagination.page, searchTerm, statusFilter);
    } catch (error) {
      showToast({
        message: t('companies.failedUpdate'),
        type: 'error'
      });
    }
  };

  const handleRefresh = async () => {
    try {
      await fetchCompanies(1, searchTerm, statusFilter);
      showToast({
        message: t('companies.refreshed'),
        type: 'success'
      });
    } catch (error) {
      showToast({
        message: t('companies.failedRefresh'),
        type: 'error'
      });
    }
  };

  const handlePageChange = async (page: number) => {
    await fetchCompanies(page, searchTerm, statusFilter);
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const handleSearch = async (term: string) => {
    setSearchTerm(term);
    await fetchCompanies(1, term, statusFilter);
  };

  const handleFilterChange = async (status: string) => {
    setStatusFilter(status);
    await fetchCompanies(1, searchTerm, status);
  };

  const handleExportCompanies = () => {
    if (!companies.length) {
      showToast({
        message: t('companies.noExport'),
        type: 'warning'
      });
      return;
    }
    
    try {
      const csvContent = "data:text/csv;charset=utf-8," 
        + `${t('companies.table.name')},${t('companies.table.cr')},${t('companies.table.email')},${t('companies.table.phone')},${t('companies.table.status')},${t('companies.table.employeesLimit')},${t('companies.table.createdAt')}\n`
        + companies.map(company => 
            `"${company.name}","${company.crNumber}","${company.email}","${company.phone}","${company.status}","${company.employeesLimit}","${new Date(company.createdAt).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}"`
          ).join("\n");
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `companies_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      showToast({
        message: t('companies.exportSuccess'),
        type: 'success'
      });
    } catch (error) {
      showToast({
        message: t('companies.exportFail'),
        type: 'error'
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-2 py-1 text-sm font-medium rounded-full";
    switch (status) {
      case 'approved':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'rejected':
        return `${baseClasses} bg-red-100 text-red-800`;
      case 'pending':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'blocked':
        return `${baseClasses} bg-gray-100 text-gray-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-6">
      <ToastContainer />
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
          {t('companies.title')}
        </h1>
        <div className="flex items-center gap-2">
           <button 
            onClick={handleExportCompanies}
            disabled={!companies.length}
            className="inline-flex items-center px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            {t('companies.export')}
          </button>
           <button 
            onClick={handleRefresh}
            className="p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 hover:text-blue-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all shadow-sm"
            title={t('common.refresh')}
          >
            <svg className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Search & Filter Card */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search Bar */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 rtl:left-auto rtl:right-0 pl-3 rtl:pr-3 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder={t('companies.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="block w-full rounded-lg border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 pl-10 rtl:pl-4 rtl:pr-10 focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2.5 transition-colors"
            />
          </div>

          {/* Status Filter */}
          <div className="w-full md:w-56">
            <div className="relative">
               <select
                value={statusFilter}
                onChange={(e) => handleFilterChange(e.target.value)}
                className="block w-full rounded-lg border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 py-2.5 pl-3 pr-10 rtl:pl-10 rtl:pr-3 text-base focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm appearance-none transition-colors"
              >
                <option value="all">{t('companies.allStatuses')}</option>
                <option value="pending">{t('companies.pending')}</option>
                <option value="approved">{t('companies.approved')}</option>
                <option value="rejected">{t('companies.rejected')}</option>
                <option value="blocked">{t('companies.blocked')}</option>
              </select>
               <div className="pointer-events-none absolute inset-y-0 right-0 rtl:right-auto rtl:left-0 flex items-center px-2 text-gray-700">
                <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Companies Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50/50 dark:bg-gray-700/50">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('companies.table.name')}
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">
                  {t('companies.table.cr')}
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">
                  {t('companies.table.email')}
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden lg:table-cell">
                  {t('companies.table.phone')}
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden xl:table-cell">
                  {t('companies.table.subscription')}
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('companies.table.status')}
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('companies.table.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="animate-pulse h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                      <div className="animate-pulse h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                      <div className="animate-pulse h-4 bg-gray-200 dark:bg-gray-700 rounded w-40"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                      <div className="animate-pulse h-4 bg-gray-200 dark:bg-gray-700 rounded w-28"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap hidden xl:table-cell">
                      <div className="animate-pulse h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-1"></div>
                      <div className="animate-pulse h-3 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="animate-pulse h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-16"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="animate-pulse h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </td>
                  </tr>
                ))
              ) : Array.isArray(companies) && companies.length > 0 ? (
                companies.map((company, index) => (
                <tr key={company.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                       <div className="h-10 w-10 flex-shrink-0 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-sm">
                         {company.name.charAt(0).toUpperCase()}
                       </div>
                       <div className="ml-4">
                         <div className="text-sm font-medium text-gray-900 dark:text-white">{company.name}</div>
                         <div className="text-xs text-gray-500 dark:text-gray-400 sm:hidden">#{company.crNumber}</div>
                       </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 hidden sm:table-cell font-mono">
                    {company.crNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 hidden md:table-cell">
                    {company.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 hidden lg:table-cell">
                    {company.phone}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 hidden xl:table-cell">
                    <div className="flex flex-col space-y-1">
                      <span className="font-medium text-gray-900 dark:text-white capitalize">
                        {company.subscriptionPlan === 'free' || !company.subscriptionPlan ? t('companies.subscription.free') : company.subscriptionPlan}
                      </span>
                      <div className="text-xs text-gray-500 flex flex-col gap-1">
                        {company.subscriptionEndDate && (
                           <span
                             suppressHydrationWarning
                             className={`${new Date(company.subscriptionEndDate) < new Date() ? 'text-red-500' : 'text-green-600'}`}
                           >
                             {new Date(company.subscriptionEndDate) < new Date() 
                               ? t('companies.subscription.expired')
                               : t('companies.subscription.daysLeft', { days: Math.ceil((new Date(company.subscriptionEndDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24)) })
                             }
                           </span>
                        )}
                        <span className="text-gray-400">
                          {t('companies.subscription.adsUsage', { used: 50 - (company.freeAdsRemaining || 0), left: company.freeAdsRemaining ?? 0 })}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      company.status === 'approved' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                      company.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                      company.status === 'rejected' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                      'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                         company.status === 'approved' ? 'bg-green-500' :
                         company.status === 'pending' ? 'bg-yellow-500' :
                         company.status === 'rejected' ? 'bg-red-500' :
                         'bg-gray-500'
                      }`}></span>
                      {t(`companies.${company.status.toLowerCase()}`)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      {/* View CR Document */}
                      {company.licenseImageUrl && (
                        <a 
                          href={`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'}${company.licenseImageUrl}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          title={t('companies.viewCr')}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </a>
                      )}

                      {/* Show all status change buttons, disabling the current status */}
                      <button
                        onClick={() => handleStatusUpdate(company.id, 'pending')}
                        className={`text-yellow-600 hover:text-yellow-900 dark:text-yellow-400 dark:hover:text-yellow-300 transparent-btn ${company.status === 'pending' ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title={t('companies.pending')}
                        disabled={company.status === 'pending'}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="10" strokeWidth="2" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6l4 2" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(company.id, 'approved')}
                        className={`text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 transparent-btn ${company.status === 'approved' ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title={t('companies.actions.approve')}
                        disabled={company.status === 'approved'}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(company.id, 'rejected')}
                        className={`text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transparent-btn ${company.status === 'rejected' ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title={t('companies.actions.reject')}
                        disabled={company.status === 'rejected'}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(company.id, 'blocked')}
                        className={`text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300 transparent-btn ${company.status === 'blocked' ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title={t('companies.actions.block')}
                        disabled={company.status === 'blocked'}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    {error ? t('companies.errorLoading') : t('companies.noData')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Error Message */}
        {error && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.98-.833-2.75 0L3.064 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">{t('companies.errorLoading')}</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{error}</p>
            <button 
              onClick={() => fetchCompanies()}
              className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {t('companies.tryAgain')}
            </button>
          </div>
        )}

        {/* No Results Message */}
        {!isLoading && !error && companies.length === 0 && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">{t('companies.noData')}</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t('companies.noResultsParams')}</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {!isLoading && !error && companies.length > 0 && pagination.totalPages > 1 && (
        <div className="bg-white dark:bg-gray-800 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('common.previous')}
            </button>
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('common.next')}
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {t('common.showing')} <span className="font-medium">{((pagination.page - 1) * pagination.limit) + 1}</span> -{' '}
                <span className="font-medium">
                  {Math.min(pagination.page * pagination.limit, pagination.total)}
                </span>{' '}
                {t('common.of')} <span className="font-medium">{pagination.total}</span>
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
                
                {Array.from({ length: Math.min(5, pagination.totalPages) }).map((_, index) => {
                  const page = pagination.page - 2 + index;
                  if (page < 1 || page > pagination.totalPages) return null;
                  
                  return (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        page === pagination.page
                          ? 'z-10 bg-blue-50 dark:bg-blue-900 border-blue-500 text-blue-600 dark:text-blue-200'
                          : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      {!isLoading && !error && companies.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex space-x-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{pagination.total}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{t('companies.stats.total')}</div>
              </div>              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {companies.filter(c => c.status === 'approved').length}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{t('companies.stats.approved')}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {companies.filter(c => c.status === 'pending').length}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{t('companies.stats.pending')}</div>
              </div>
            </div>
            <button
              onClick={handleRefresh}
              className="flex items-center px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {t('common.refresh')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
