'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';

interface WithdrawalRequest {
  id: number;
  amount: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
  company: {
    id: number;
    name: string;
  };
  createdAt: string;
}

interface WithdrawalPagination {
  page: number;
  totalPages: number;
  total: number;
}

export default function WithdrawalsPage() {
  const router = useRouter();
  const { t, language } = useLanguage();

  const getErrorMessage = useCallback((error: unknown, fallback: string) => {
    if (error instanceof Error && error.message) {
      return error.message;
    }

    return fallback;
  }, []);

  // State
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [actionLoading, setActionLoading] = useState<{ [key: number]: boolean }>({});

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [search]);
  // Fetch withdrawals data
  const fetchWithdrawals = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { getWithdrawals } = await import('@/lib/api/adminApi');
      const response = await getWithdrawals(debouncedSearch, status, currentPage);
      setWithdrawals(response.data as WithdrawalRequest[]);
      setPagination((response.pagination as WithdrawalPagination | undefined) || { page: 1, totalPages: 1, total: 0 });
    } catch (err: unknown) {
      setError(getErrorMessage(err, t('withdrawals.messages.errorLoading')));
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, debouncedSearch, getErrorMessage, status, t]);

  useEffect(() => {
    fetchWithdrawals();
  }, [fetchWithdrawals]);

  // Handle status change and reset to page 1
  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus);
    setCurrentPage(1);
  };

  // Handle search change and reset to page 1
  const handleSearchChange = (newSearch: string) => {
    setSearch(newSearch);
    setCurrentPage(1);
  };
  // Handle approve withdrawal
  const handleApprove = async (withdrawalId: number) => {
    try {
      setActionLoading(prev => ({ ...prev, [withdrawalId]: true }));

      const { approveWithdrawal } = await import('@/lib/api/adminApi');
      await approveWithdrawal(withdrawalId);

      // Refresh the table
      fetchWithdrawals();
    } catch {
      alert(t('withdrawals.messages.failedApprove'));
    } finally {
      setActionLoading(prev => ({ ...prev, [withdrawalId]: false }));
    }
  };
  // Handle reject withdrawal
  const handleReject = async (withdrawalId: number) => {
    try {
      setActionLoading(prev => ({ ...prev, [withdrawalId]: true }));

      const { rejectWithdrawal } = await import('@/lib/api/adminApi');
      await rejectWithdrawal(withdrawalId);

      // Refresh the table
      fetchWithdrawals();
    } catch {
      alert(t('withdrawals.messages.failedReject'));
    } finally {
      setActionLoading(prev => ({ ...prev, [withdrawalId]: false }));
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-BH', {
      style: 'currency',
      currency: 'BHD',
      minimumFractionDigits: 3,
      maximumFractionDigits: 3
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const locale = language === 'ar' ? 'ar-BH' : 'en-US';
    return date.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get status badge
  // Clear filters
  const clearFilters = () => {
    setSearch('');
    setStatus('');
    setCurrentPage(1);
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* Title skeleton */}
        <div className="animate-pulse">
          <div className="h-8 w-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>

        {/* Filters skeleton */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="animate-pulse grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-3 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          </div>
        </div>

        {/* Table skeleton */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="animate-pulse">
            {/* Table header */}
            <div className="px-6 py-4 bg-gray-50/50 dark:bg-gray-700/50">
              <div className="flex space-x-4">
                <div className="flex-1 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="w-24 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="w-20 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="w-32 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="w-32 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            </div>
            
            {/* Table rows */}
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 last:border-0">
                <div className="flex space-x-4">
                  <div className="flex-1 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="w-24 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="w-20 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="w-32 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="w-32 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-[1600px] mx-auto space-y-6">
        <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">{t('withdrawals.title')}</h1>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border-2 border-red-200 dark:border-red-900/50 p-12">
          <div className="text-center">
            <svg className="mx-auto h-12 w-12 text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.98-.833-2.75 0L3.064 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">{t('withdrawals.messages.errorLoading')}</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
            <button 
              onClick={fetchWithdrawals}
              className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors shadow-sm"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {t('withdrawals.messages.tryAgain')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto space-y-6">
      {/* Page Title */}
       <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('withdrawals.title')}</h1>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search Bar */}
          <div className="md:col-span-3">
             <div className="relative">
                <input
                  type="text"
                  placeholder={t('withdrawals.searchPlaceholder')}
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                   className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-sm"
                />
                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            >
              <option value="">{t('withdrawals.filters.allStatuses')}</option>
              <option value="PENDING">{t('withdrawals.filters.pending')}</option>
              <option value="APPROVED">{t('withdrawals.filters.approved')}</option>
              <option value="REJECTED">{t('withdrawals.filters.rejected')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {withdrawals.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50/50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-6 py-4 text-start text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('withdrawals.table.company')}
                  </th>
                  <th className="px-6 py-4 text-start text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('withdrawals.table.amount')}
                  </th>
                  <th className="px-6 py-4 text-start text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('withdrawals.table.status')}
                  </th>
                  <th className="px-6 py-4 text-start text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('withdrawals.table.requestedAt')}
                  </th>
                  <th className="px-6 py-4 text-end text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('withdrawals.table.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {withdrawals.map((withdrawal) => (
                  <tr key={withdrawal.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors border-b dark:border-gray-700 last:border-0">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {withdrawal.company.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(withdrawal.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                       <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                        withdrawal.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                        withdrawal.status === 'APPROVED' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                        'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                      }`}>
                        {t(`withdrawals.status.${withdrawal.status.toLowerCase()}`)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(withdrawal.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-end">
                      <div className="flex items-center justify-end gap-2">
                        {/* View Button */}
                        <button
                          onClick={() => router.push(`/companies/${withdrawal.company.id}`)}
                          className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/40 rounded-lg transition-colors"
                          title="View Company"
                        >
                           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                           </svg>
                        </button>

                        {/* Approve/Reject Buttons (only for pending) */}
                        {withdrawal.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => handleApprove(withdrawal.id)}
                              disabled={actionLoading[withdrawal.id]}
                              className="p-1.5 bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/40 rounded-lg transition-colors disabled:opacity-50"
                              title={t('withdrawals.actions.approve')}
                            >
                              {actionLoading[withdrawal.id] ? (
                                <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                              ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </button>
                            <button
                              onClick={() => handleReject(withdrawal.id)}
                              disabled={actionLoading[withdrawal.id]}
                              className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40 rounded-lg transition-colors disabled:opacity-50"
                              title={t('withdrawals.actions.reject')}
                            >
                              {actionLoading[withdrawal.id] ? (
                                <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                              ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              )}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          // Empty State
          <div className="flex flex-col items-center justify-center space-y-3 py-12 px-6">
            <svg className="w-12 h-12 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-base font-medium text-gray-900 dark:text-white">{t('withdrawals.messages.noWithdrawals')}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {search || status ? t('withdrawals.messages.noMatch') : t('withdrawals.messages.noMatch')}
            </p>
            {(search || status) && (
              <button
                onClick={clearFilters}
                className="mt-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
              >
                {t('withdrawals.messages.clearFilters')}
              </button>
            )}
          </div>
        )}
      </div>

       {/* Pagination */}
      {withdrawals.length > 0 && (
         <div className="flex justify-center pt-4">
          <nav className="flex items-center gap-1">
             <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={pagination.page === 1}
              className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 font-medium">
             {t('common.pageOf', { current: pagination.page, total: pagination.totalPages })} ({t('withdrawals.messages.total', { count: pagination.total })})
            </span>
             <button
              onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
              disabled={pagination.page === pagination.totalPages}
              className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </nav>
        </div>
      )}
    </div>
  );
}
