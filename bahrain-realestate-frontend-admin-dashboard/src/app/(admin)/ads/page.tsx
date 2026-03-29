'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Ad, getAds, approveAd, rejectAd, deleteAd, setAdFeatured } from '@/lib/api/adminApi';
import { useLanguage } from '@/contexts/LanguageContext';

export default function AdsPage() {
  const router = useRouter();
  const { t, language } = useLanguage();
  
  const [ads, setAds] = useState<Ad[]>([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    pageSize: 10,
    totalPages: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [adTypeFilter, setAdTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Debounce search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (search !== undefined) {
        setCurrentPage(1);
        fetchAds(1, search, adTypeFilter, statusFilter);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [search]);

  // Fetch ads on filter or page change
  useEffect(() => {
    fetchAds(currentPage, search, adTypeFilter, statusFilter);
  }, [currentPage, adTypeFilter, statusFilter]);

  // Initial fetch
  useEffect(() => {
    fetchAds(1, '', '', '');
  }, []);

  const fetchAds = async (page: number, searchTerm: string, adType: string, status: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await getAds(searchTerm, adType, status, page);
      setAds(response.data.ads);
      setPagination({
        total: response.data.pagination.total,
        page: response.data.pagination.page,
        pageSize: response.data.pagination.limit || 10,
        totalPages: response.data.pagination.totalPages
      });
    } catch (err: any) {
      setError(err.message || t('ads.messages.errorLoading'));
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const locale = language === 'ar' ? 'ar-BH' : 'en-US';
    return date.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getAdTypeBadge = (adType: string) => {
    const baseClasses = "px-2 py-1 text-sm font-medium rounded-full";
    switch (adType.toUpperCase()) {
      case 'FEATURED':
        return `${baseClasses} bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300`;
      case 'REGULAR':
        return `${baseClasses} bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300`;
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-2 py-1 text-sm font-medium rounded-full";
    const normalized = (() => {
      const s = String(status || '').toLowerCase();
      if (s === 'approved' || s === 'active') return 'APPROVED';
      if (s === 'rejected' || s === 'inactive') return 'REJECTED';
      if (s === 'pending') return 'PENDING';
      return String(status || '').toUpperCase();
    })();

    switch (normalized) {
      case 'APPROVED':
        return `${baseClasses} bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300`;
      case 'PENDING':
        return `${baseClasses} bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300`;
      case 'REJECTED':
        return `${baseClasses} bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300`;
    }
  };

  const handleViewAd = (adId: number) => {
    router.push(`/ads/${adId}`);
  };

  const handleApproveAd = async (adId: number) => {
    try {
      await approveAd(adId);
      fetchAds(currentPage, search, adTypeFilter, statusFilter);
    } catch (err) {
      alert(t('ads.messages.failedApprove'));
    }
  };

  const handleRejectAd = async (adId: number) => {
    try {
      const reason = window.prompt(t('ads.messages.rejectReason'));
      if (!reason || !reason.trim()) {
        return;
      }

      await rejectAd(adId, reason.trim());
      fetchAds(currentPage, search, adTypeFilter, statusFilter);
    } catch (err) {
      alert(t('ads.messages.failedReject'));
    }
  };

  const handleDeleteAd = async (adId: number) => {
    if (confirm(t('ads.messages.confirmDelete'))) {
      try {
        await deleteAd(adId);
        fetchAds(currentPage, search, adTypeFilter, statusFilter);
      } catch (err) {
        alert(t('ads.messages.failedDelete'));
      }
    }
  };

  const normalizeAdStatus = (status?: string) => {
    const s = String(status || '').toLowerCase();
    if (s === 'approved' || s === 'active') return 'APPROVED';
    if (s === 'rejected' || s === 'inactive') return 'REJECTED';
    if (s === 'pending') return 'PENDING';
    return String(status || '').toUpperCase();
  };

  const isFeaturedAd = (type?: string) => String(type || '').toLowerCase() === 'featured';

  const handleToggleFeatured = async (ad: Ad) => {
    const approved = normalizeAdStatus(ad.status) === 'APPROVED';
    if (!approved) {
      alert(t('ads.messages.onlyApprovedFeatured'));
      return;
    }

    const nextFeatured = !isFeaturedAd(ad.type);
    const ok = confirm(nextFeatured
      ? t('ads.messages.confirmSetFeatured')
      : t('ads.messages.confirmUnsetFeatured'));
    if (!ok) return;

    try {
      await setAdFeatured(ad.id, nextFeatured);
      fetchAds(currentPage, search, adTypeFilter, statusFilter);
    } catch (err: any) {
      alert(err?.message || t('ads.messages.failedApprove'));
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < pagination.totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handleRetry = () => {
    fetchAds(currentPage, search, adTypeFilter, statusFilter);
  };

  // Loading skeleton
  if (isLoading && ads.length === 0) {
    return (
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* Title skeleton */}
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
        </div>

        {/* Filters skeleton */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="animate-pulse grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2 h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>

        {/* Table skeleton */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="animate-pulse">
            {/* Table header skeleton */}
            <div className="bg-gray-50/50 dark:bg-gray-700/50 px-6 py-4">
              <div className="grid grid-cols-6 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-4 bg-gray-200 dark:bg-gray-600 rounded"></div>
                ))}
              </div>
            </div>
            
            {/* Table rows skeleton */}
            {Array.from({ length: 5 }).map((_, rowIndex) => (
              <div key={rowIndex} className="px-6 py-4 border-b dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <div className="grid grid-cols-6 gap-4">
                  {Array.from({ length: 6 }).map((_, colIndex) => (
                    <div key={colIndex} className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error && ads.length === 0) {
    return (
      <div className="max-w-[1600px] mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('ads.title')}</h1>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border-2 border-red-200 dark:border-red-900/50 p-12">
          <div className="text-center">
            <svg className="mx-auto h-12 w-12 text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.98-.833-2.75 0L3.064 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">{t('ads.messages.errorLoading')}</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
            <button 
              onClick={handleRetry}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {t('ads.messages.tryAgain')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main content
  return (
    <div className="max-w-[1600px] mx-auto space-y-6">
      {/* Page Title */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('ads.title')}</h1>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search Bar */}
          <div className="md:col-span-2 relative">
            <input
              type="text"
              placeholder={t('ads.searchPlaceholder')}
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

          {/* Ad Type Filter */}
          <div>
            <select
              value={adTypeFilter}
              onChange={(e) => setAdTypeFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            >
              <option value="">{t('ads.filters.allAdTypes')}</option>
              <option value="regular">{t('ads.filters.regular')}</option>
              <option value="featured">{t('ads.filters.featured')}</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            >
              <option value="">{t('ads.filters.allStatuses')}</option>
              <option value="pending">{t('ads.filters.pending')}</option>
              <option value="approved">{t('ads.filters.approved')}</option>
              <option value="rejected">{t('ads.filters.rejected')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Ads Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50/50 dark:bg-gray-700/50">
              <tr>
                <th className="px-6 py-4 text-start text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('ads.table.propertyTitle')}
                </th>
                <th className="px-6 py-4 text-start text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('ads.table.companyName')}
                </th>
                <th className="px-6 py-4 text-start text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('ads.table.adType')}
                </th>
                <th className="px-6 py-4 text-start text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('ads.table.status')}
                </th>
                <th className="px-6 py-4 text-start text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('ads.table.createdAt')}
                </th>
                <th className="px-6 py-4 text-end text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('ads.table.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {ads.length > 0 ? (
                ads.map((ad, index) => (
                  <tr
                    key={ad.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors border-b dark:border-gray-700 last:border-0"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {ad.title}
                      {isFeaturedAd(ad.type) && (
                         <span className="ml-2 inline-flex items-center text-yellow-500" title="Featured">
                           <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.539 1.118l-2.8-2.034a1 1 0 00-1.176 0l-2.8 2.034c-.783.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                         </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {ad.company?.name || 'Unknown Company'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={getAdTypeBadge(ad.type)}>
                        {ad.type.charAt(0).toUpperCase() + ad.type.slice(1).toLowerCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={getStatusBadge(ad.status)}>
                        {(() => {
                          const s = String(ad.status || '').toLowerCase();
                          if (s === 'approved' || s === 'active') return t('ads.status.approved');
                          if (s === 'rejected' || s === 'inactive') return t('ads.status.rejected');
                          if (s === 'pending') return t('ads.status.pending');
                          return ad.status.charAt(0).toUpperCase() + ad.status.slice(1).toLowerCase();
                        })()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(ad.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-end">
                      <div className="flex items-center justify-end gap-2">
                        {/* Featured Toggle */}
                        <button
                          onClick={() => handleToggleFeatured(ad)}
                          className={`p-1.5 rounded-lg transition-colors ${
                             isFeaturedAd(ad.type)
                              ? 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400'
                              : 'bg-gray-50 text-gray-400 hover:bg-gray-100 dark:bg-gray-700/50 dark:text-gray-500 dark:hover:bg-gray-700'
                          }`}
                          title={isFeaturedAd(ad.type) ? t('ads.actions.unsetFeatured') : t('ads.actions.setFeatured')}
                        >
                          <svg className="w-4 h-4" fill={isFeaturedAd(ad.type) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l2.07 6.373a1 1 0 00.95.69h6.704c.969 0 1.371 1.24.588 1.81l-5.424 3.94a1 1 0 00-.364 1.118l2.07 6.373c.3.921-.755 1.688-1.539 1.118l-5.424-3.94a1 1 0 00-1.176 0l-5.424 3.94c-.783.57-1.838-.197-1.539-1.118l2.07-6.373a1 1 0 00-.364-1.118l-5.424-3.94c-.783-.57-.38-1.81.588-1.81h6.704a1 1 0 00.95-.69l2.07-6.373z" />
                          </svg>
                        </button>

                        {/* View Button */}
                        {ad.property && (
                          <button
                            onClick={() => handleViewAd(ad.property!.id)}
                            className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/40 rounded-lg transition-colors"
                            title={t('ads.actions.view')}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                        )}  
                        
                        {/* Approve Button */}
                        {ad.status === 'pending' && (
                          <button
                            onClick={() => handleApproveAd(ad.id)}
                            className="p-1.5 bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/40 rounded-lg transition-colors"
                            title={t('ads.actions.approve')}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                        )}

                        {/* Reject Button */}
                        {ad.status === 'pending' && (
                          <button
                            onClick={() => handleRejectAd(ad.id)}
                            className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40 rounded-lg transition-colors"
                            title={t('ads.actions.reject')}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}

                        {/* Delete Button */}
                        <button
                          onClick={() => handleDeleteAd(ad.id)}
                          className="p-1.5 bg-gray-50 text-gray-600 hover:bg-red-50 hover:text-red-600 dark:bg-gray-700/50 dark:text-gray-400 dark:hover:bg-red-900/20 dark:hover:text-red-400 rounded-lg transition-colors"
                          title={t('ads.actions.delete')}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                   <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                     <div className="flex flex-col items-center justify-center space-y-3">
                      <svg className="w-12 h-12 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <h3 className="text-base font-medium text-gray-900 dark:text-white">{t('ads.messages.noAds')}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {search || adTypeFilter || statusFilter 
                          ? t('ads.messages.noMatch')
                          : t('ads.messages.noAdsCreated')
                        }
                      </p>
                       {(search || adTypeFilter || statusFilter) && (
                        <button
                          onClick={() => {
                            setSearch('');
                            setAdTypeFilter('');
                            setStatusFilter('');
                          }}
                          className="mt-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
                        >
                          {t('ads.messages.clearFilters')}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 0 && (
        <div className="flex justify-center pt-4">
          <nav className="flex items-center gap-1">
             <button
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
              className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 font-medium">
             {t('common.pageOf', { current: currentPage, total: pagination.totalPages })}
            </span>
             <button
              onClick={handleNextPage}
              disabled={currentPage === pagination.totalPages}
              className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </nav>
        </div>
      )}

      {/* Results Summary */}
      {!isLoading && !error && (
        <div className="text-sm text-gray-500 dark:text-gray-400 text-center">
          {search || adTypeFilter || statusFilter ? (
            <>{t('ads.messages.showing', { count: ads.length, total: pagination.total })}</>
          ) : (
            <>{t('ads.messages.total', { count: pagination.total })}</>
          )}
        </div>
      )}
    </div>
  );
}
