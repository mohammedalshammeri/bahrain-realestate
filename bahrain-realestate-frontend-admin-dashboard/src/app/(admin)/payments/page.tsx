'use client';

import { useCallback, useEffect, useState } from 'react';
import { getPayments, Payment, ApiError } from '@/lib/api/adminApi';
import { useLanguage } from '@/contexts/LanguageContext';

interface PaymentsResponseData {
  payments: Payment[];
  pagination?: {
    page?: number;
    totalPages?: number;
    total?: number;
    limit?: number;
  };
}

export default function PaymentsPage() {
  const { t, language } = useLanguage();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
    limit: 10
  });

  const fetchPayments = useCallback(async (page: number = 1, searchTerm: string = '', status: string = '') => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await getPayments(searchTerm, status, page) as {
        success: boolean;
        data?: PaymentsResponseData;
      };
      
      if (response.success && response.data && Array.isArray(response.data.payments)) {
        setPayments(response.data.payments);
        
        if (response.data.pagination) {
          setPagination({
            page: response.data.pagination.page || page,
            totalPages: response.data.pagination.totalPages || 1,
            total: response.data.pagination.total || 0,
            limit: response.data.pagination.limit || 10
          });
        }
      } else {
        setPayments([]);
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError(t('payments.messages.errorLoading'));
      }
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void fetchPayments();
  }, [fetchPayments]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      void fetchPayments(1, search, statusFilter);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [fetchPayments, search, statusFilter]);

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-2 py-0.5 text-xs font-medium rounded-full";
    switch (status) {
      case 'completed':
        return `${baseClasses} bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400`;
      case 'pending':
        return `${baseClasses} bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400`;
      case 'failed':
        return `${baseClasses} bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400`;
      case 'refunded':
        return `${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300`;
    }
  };

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

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-BH', {
      style: 'currency',
      currency: currency || 'BHD'
    }).format(amount);
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('payments.title')}</h1>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-3">
            <div className="relative">
              <input
                type="text"
                placeholder={t('payments.searchPlaceholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-sm"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            >
              <option value="">{t('payments.filters.allStatuses')}</option>
              <option value="completed">{t('payments.filters.completed')}</option>
              <option value="pending">{t('payments.filters.pending')}</option>
              <option value="failed">{t('payments.filters.failed')}</option>
              <option value="refunded">{t('payments.filters.refunded')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50/50 dark:bg-gray-700/50">
              <tr>
                <th className="px-6 py-4 text-start text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('payments.table.transactionId')}</th>
                <th className="px-6 py-4 text-start text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('payments.table.company')}</th>
                <th className="px-6 py-4 text-start text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('payments.table.amount')}</th>
                <th className="px-6 py-4 text-start text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('payments.table.status')}</th>
                <th className="px-6 py-4 text-start text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('payments.table.createdAt')}</th>
                <th className="px-6 py-4 text-start text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('payments.table.type')}</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index}>
                     <td colSpan={6} className="px-6 py-4 whitespace-nowrap">
                      <div className="animate-pulse flex space-x-4">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                      </div>
                    </td>
                  </tr>
                ))
              ) : payments.length > 0 ? (
                payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors border-b dark:border-gray-700 last:border-0">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {payment.transactionId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {payment.company?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {formatCurrency(payment.amount, payment.currency)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={getStatusBadge(payment.status)}>
                        {t(`payments.status.${payment.status}`)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(payment.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {payment.method}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                   <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <svg className="w-12 h-12 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <h3 className="text-base font-medium text-gray-900 dark:text-white">{t('payments.messages.noPayments')}</h3>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center pt-4">
          <nav className="flex items-center gap-1">
            <button
              onClick={() => fetchPayments(pagination.page - 1, search, statusFilter)}
              disabled={pagination.page === 1}
              className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <svg className={`w-5 h-5 ${language === 'ar' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 font-medium">
             {t('common.pageOf', { current: pagination.page, total: pagination.totalPages })}
            </span>
             <button
              onClick={() => fetchPayments(pagination.page + 1, search, statusFilter)}
              disabled={pagination.page === pagination.totalPages}
              className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
             >
               <svg className={`w-5 h-5 ${language === 'ar' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </nav>
        </div>
      )}
    </div>
  );
}
