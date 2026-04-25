'use client';

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import { getComplaints, updateComplaintStatus, Complaint, ApiError } from '@/lib/api/adminApi';
import { useLanguage } from '@/contexts/LanguageContext';

type ComplaintStatus = Complaint['status'];

interface ComplaintPropertyImage {
  imageUrl: string;
  displayOrder?: number;
  createdAt?: string;
  isVideo?: boolean;
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

export default function ComplaintsPage() {
  const { t, language, direction } = useLanguage();
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedSubmitterType, setSelectedSubmitterType] = useState('all');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
    limit: 10
  });

  const statusOptions = [
    { value: 'all', label: t('complaints.filters.allStatus') },
    { value: 'new', label: t('complaints.status.new') },
    { value: 'under_review', label: t('complaints.status.under_review') },
    { value: 'resolved', label: t('complaints.status.resolved') }
  ];

  const submitterTypeOptions = [
    { value: 'all', label: t('complaints.filters.allTypes') },
    { value: 'INDIVIDUAL', label: t('complaints.submitterType.individual') },
    { value: 'COMPANY', label: t('complaints.submitterType.company') }
  ];

  const fetchComplaints = useCallback(async (page: number = 1, status?: string, submitterType?: string, order?: 'asc' | 'desc') => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await getComplaints(status, submitterType, undefined, page, pagination.limit, order || sortOrder);
      // حماية من البيانات الفارغة أو غير المتوقعة
      setComplaints(Array.isArray(response?.data) ? response.data : []);
      setPagination({
        page: response?.pagination?.page || page,
        totalPages: response?.pagination?.totalPages || 1,
        total: response?.pagination?.total || 0,
        limit: response?.pagination?.limit || 10
      });
    } catch (err: unknown) {
      setError(getErrorMessage(err, t('complaints.messages.errorLoading')));
    } finally {
      setIsLoading(false);
    }
  }, [pagination.limit, sortOrder, t]);

  useEffect(() => {
    void fetchComplaints();
  }, [fetchComplaints]);

  useEffect(() => {
    void fetchComplaints(1, selectedStatus !== 'all' ? selectedStatus : undefined, selectedSubmitterType !== 'all' ? selectedSubmitterType : undefined, sortOrder);
  }, [fetchComplaints, selectedStatus, selectedSubmitterType, sortOrder]);

  const handleStatusChange = (status: string) => {
    setSelectedStatus(status);
  };

  const handleSubmitterTypeChange = (submitterType: string) => {
    setSelectedSubmitterType(submitterType);
  };

  const handleUpdateStatus = async (id: number, newStatus: string) => {
    try {
      await updateComplaintStatus(id, newStatus);
      await fetchComplaints(pagination.page, selectedStatus !== 'all' ? selectedStatus : undefined, selectedSubmitterType !== 'all' ? selectedSubmitterType : undefined, sortOrder);
    } catch (err: unknown) {
      alert(getErrorMessage(err, t('companyEmployees.messages.updateFail')));
    }
  };

  const handleViewComplaint = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedComplaint(null);
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-2 py-1 text-xs font-medium rounded-full";
    switch (status) {
      case 'new':
        return `${baseClasses} bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300`;
      case 'under_review':
        return `${baseClasses} bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300`;
      case 'resolved':
        return `${baseClasses} bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300`;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'new':
        return t('complaints.status.new');
      case 'under_review':
        return t('complaints.status.under_review');
      case 'resolved':
        return t('complaints.status.resolved');
      default:
        return status;
    }
  };

  const getImageUrl = (url?: string | null) => {
    if (!url) return '';
    if (/^https?:\/\//i.test(url)) return url;
    
    // Robust URL construction matching properties/page.tsx
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'; 
    const cleanPath = url.startsWith('/') ? url.slice(1) : url;
    return `${baseUrl}/${cleanPath}`;
  };

  const isVideoFile = (value: string) => /\.(mp4|mov|webm|mkv)(\?.*)?$/i.test(value);

  const getComplaintTypeLabel = (complaint: Complaint) => {
    if (complaint.property?.id) return t('complaints.types.property');
    if (complaint.companyId) return t('complaints.types.company');
    return t('complaints.types.general');
  };

  // نفس منطق جدول العقارات: ضبط بداية الـ scroll الأفقي حسب اللغة بدون لمس العمودي
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const maxScroll = Math.max(0, el.scrollWidth - el.clientWidth);
    if (language === 'ar') {
      // عربي: ابدأ من أقصى اليمين
      el.scrollLeft = maxScroll;
    } else {
      // إنجليزي: ابدأ من اليسار
      el.scrollLeft = 0;
    }
  }, [language, complaints.length]);

  return (
    <div className="max-w-[1600px] mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('complaints.title')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t('complaints.description')}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">{t('complaints.filters.status')}</label>
              <select
                value={selectedStatus}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500"
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
          </div>
          
          <div className="flex flex-col gap-1">
             <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">{t('complaints.filters.type')}</label>
             <select
                value={selectedSubmitterType}
                onChange={(e) => handleSubmitterTypeChange(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500"
              >
                {submitterTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">{t('complaints.filters.sort')}</label>
            <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500"
              >
                <option value="desc">{t('complaints.filters.newest')}</option>
                <option value="asc">{t('complaints.filters.oldest')}</option>
              </select>
          </div>
          
          <div className="flex items-end">
             {!isLoading && !error && (
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded-lg w-full text-center">
                  {t('complaints.messages.showing', { count: complaints.length, total: pagination.total })}
                </div>
              )}
          </div>
        </div>
      </div>

       {/* Complaints Table */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
        {/* Outer container: vertical scroll only, follows page direction */}
        <div
          className="h-[70vh] overflow-y-auto"
        >
          {/* Inner container: horizontal scroll only, always LTR for stable scrollLeft math */}
          <div
            ref={scrollContainerRef}
            className="min-w-full h-full overflow-x-auto"
            dir="ltr"
          >
          <table dir={direction} className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">{t('complaints.table.id')}</th>
                <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">{t('complaints.table.submitter')}</th>
                <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">{t('complaints.table.target')}</th>
                <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">{t('complaints.table.message')}</th>
                <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">{t('complaints.table.status')}</th>
                <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">{t('complaints.table.createdAt')}</th>
                <th scope="col" className="px-6 py-3 text-end text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">{t('complaints.table.action')}</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {isLoading ? (
                // Loading skeleton
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index} className="animate-pulse border-b dark:border-gray-700 last:border-0">
                    {Array.from({ length: 7 }).map((_, colIndex) => (
                      <td key={colIndex} className="px-6 py-4 whitespace-nowrap">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                      </td>
                    ))}
                  </tr>
                ))
              ) : (Array.isArray(complaints) ? complaints.map((complaint) => (
                <tr key={complaint.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors border-b dark:border-gray-700 last:border-0">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    <span className="font-mono text-gray-500 dark:text-gray-400">#</span>{complaint.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {complaint.submitterType === 'COMPANY' 
                          ? complaint.submitterCompanyName || complaint.submitterCompany?.name || 'Company' 
                          : complaint.userName || 'Individual'}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                         {complaint.submitterType === 'COMPANY' ? t('complaints.submitterType.company') : t('complaints.submitterType.individual')}
                      </span>
                       <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                        {complaint.submitterType === 'COMPANY' ? complaint.submitterCompanyEmail : complaint.userEmail}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                    <div className="flex flex-col gap-1">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 w-fit">
                          {getComplaintTypeLabel(complaint)}
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {complaint.company?.name || t('complaints.types.general')}
                      </span>
                      {complaint.property?.id && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
                          {complaint.property.title ? `${complaint.property.title}` : `Property #${complaint.property.id}`}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-xs">
                    <div className="line-clamp-2" title={complaint.message}>
                      {complaint.message}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={getStatusBadge(complaint.status)}>
                      {getStatusLabel(complaint.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(complaint.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-end">
                    <div className="flex items-center justify-end gap-2">
                       <select
                        value={complaint.status}
                        onChange={(e) => handleUpdateStatus(complaint.id, e.target.value)}
                        className="text-xs border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 bg-white dark:bg-gray-700 text-gray-900 dark:text-white py-1 pl-2 pr-6"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <option value="new">{t('complaints.status.new')}</option>
                        <option value="under_review">{t('complaints.status.under_review')}</option>
                        <option value="resolved">{t('complaints.status.resolved')}</option>
                      </select>
                      
                      <button
                        onClick={() => handleViewComplaint(complaint)}
                        className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/40 rounded-lg transition-colors"
                        title={t('common.view')}
                      >
                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                         </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              )) : [])}
            </tbody>
          </table>
        </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.98-.833-2.75 0L3.064 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">{t('complaints.messages.errorLoading')}</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{error}</p>
            <button 
              onClick={() => void fetchComplaints(1, selectedStatus !== 'all' ? selectedStatus : undefined, selectedSubmitterType !== 'all' ? selectedSubmitterType : undefined, sortOrder)}
              className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {t('common.tryAgain')}
            </button>
          </div>
        )}

        {/* No Results Message */}
        {!isLoading && !error && Array.isArray(complaints) && complaints.length === 0 && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">{t('complaints.messages.noComplaints')}</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t('complaints.messages.noMatch')}</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {!isLoading && !error && pagination.totalPages > 1 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              {t('pagination.showing')
                .replace('{from}', (((pagination.page - 1) * pagination.limit) + 1).toString())
                .replace('{to}', Math.min(pagination.page * pagination.limit, pagination.total).toString())
                .replace('{total}', pagination.total.toString())
              }
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => fetchComplaints(
                  Math.max(pagination.page - 1, 1),
                  selectedStatus !== 'all' ? selectedStatus : undefined,
                  selectedSubmitterType !== 'all' ? selectedSubmitterType : undefined,
                  sortOrder
                )}
                disabled={pagination.page === 1}
                className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300"
              >
                {t('pagination.previous')}
              </button>

              <div className="flex items-center space-x-1">
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(pageNum => (
                  <button
                    key={pageNum}
                    onClick={() => fetchComplaints(
                      pageNum,
                      selectedStatus !== 'all' ? selectedStatus : undefined,
                      selectedSubmitterType !== 'all' ? selectedSubmitterType : undefined,
                      sortOrder
                    )}
                    className={`px-3 py-1 text-sm border rounded-md ${
                      pagination.page === pageNum
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}
              </div>

              <button
                onClick={() => fetchComplaints(
                  Math.min(pagination.page + 1, pagination.totalPages),
                  selectedStatus !== 'all' ? selectedStatus : undefined,
                  selectedSubmitterType !== 'all' ? selectedSubmitterType : undefined,
                  sortOrder
                )}
                disabled={pagination.page === pagination.totalPages}
                className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300"
              >
                {t('pagination.next')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Summary Statistics */}
      {!isLoading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('complaints.summary.total')}</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{pagination.total}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('complaints.summary.new')}</div>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {complaints.filter(c => c.status === 'new').length}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('complaints.summary.underReview')}</div>
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {complaints.filter(c => c.status === 'under_review').length}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('complaints.summary.resolved')}</div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {complaints.filter(c => c.status === 'resolved').length}
            </div>
          </div>
        </div>
      )}

      {/* Complaint Details Modal */}
      {isModalOpen && selectedComplaint && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {t('complaints.details.title')} #{selectedComplaint.id}
                </h2>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Submitter Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('complaints.details.submitterInfo')}</h3>
                  
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <div className="flex items-center mb-2">
                      <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${
                        selectedComplaint.submitterType === 'COMPANY' 
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' 
                          : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                      }`}>
                        {selectedComplaint.submitterType === 'COMPANY' ? t('complaints.submitterType.company') : t('complaints.submitterType.individual')}
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      <div>
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('complaints.details.name')}:</span>
                        <p className="text-sm text-gray-900 dark:text-white">
                          {selectedComplaint.submitterType === 'COMPANY' 
                            ? (selectedComplaint.submitterCompanyName || selectedComplaint.submitterCompany?.name || t('common.na'))
                            : (selectedComplaint.userName || t('common.na'))}
                        </p>
                      </div>
                      
                      <div>
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('complaints.details.email')}:</span>
                        <p className="text-sm text-gray-900 dark:text-white">
                          {selectedComplaint.submitterType === 'COMPANY' 
                            ? (selectedComplaint.submitterCompanyEmail || t('common.na'))
                            : (selectedComplaint.userEmail || t('common.na'))}
                        </p>
                      </div>
                      
                      <div>
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('complaints.details.phone')}:</span>
                        <p className="text-sm text-gray-900 dark:text-white">
                          {selectedComplaint.submitterType === 'COMPANY' 
                            ? (selectedComplaint.submitterCompanyPhone || t('common.na'))
                            : (selectedComplaint.userPhone || t('common.na'))}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Complaint Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('complaints.details.complaintInfo')}</h3>
                  
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('complaints.details.complaintType')}:</span>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {getComplaintTypeLabel(selectedComplaint)}
                      </p>
                    </div>

                    <div>
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('complaints.details.targetCompany')}:</span>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {selectedComplaint.company?.name || t('complaints.types.general')}
                      </p>
                    </div>

                    {selectedComplaint.property?.id ? (
                      <div>
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('complaints.details.targetProperty')}:</span>
                        <p className="text-sm text-gray-900 dark:text-white">
                          {selectedComplaint.property.title
                            ? `${selectedComplaint.property.title}`
                            : 'Property'}
                        </p>
                        {(() => {
                          const images = selectedComplaint.property.propertyImages as ComplaintPropertyImage[] | undefined;
                          if (!images || images.length === 0) return null;

                          // Try to find the first valid image (not video)
                          const validImageObj = images.find((pi) => !pi.isVideo && !isVideoFile(pi.imageUrl));
                          const imageUrl = validImageObj ? validImageObj.imageUrl : images[0].imageUrl;

                          return (
                            <div className="mt-3">
                              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('complaints.details.propertyImage')}:</span>
                              <div className="mt-2">
                                <Image
                                  src={getImageUrl(imageUrl)}
                                  alt={selectedComplaint.property?.title || 'Property'}
                                  width={768}
                                  height={384}
                                  unoptimized
                                  className="max-h-64 w-auto max-w-full rounded-md object-contain border border-gray-200 dark:border-gray-700 block"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    ) : null}
                    
                    <div>
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('complaints.table.status')}:</span>
                      <div className="mt-1">
                        <span className={getStatusBadge(selectedComplaint.status)}>
                          {getStatusLabel(selectedComplaint.status)}
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('complaints.table.createdAt')}:</span>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {formatDate(selectedComplaint.createdAt)}
                      </p>
                    </div>
                    
                    {selectedComplaint.resolvedAt && (
                      <div>
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('complaints.details.resolvedAt')}:</span>
                        <p className="text-sm text-gray-900 dark:text-white">
                          {formatDate(selectedComplaint.resolvedAt)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Complaint Message */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">{t('complaints.details.message')}</h3>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
                    {selectedComplaint.message}
                  </p>
                </div>
              </div>

              {/* Admin Notes */}
              {selectedComplaint.adminNotes && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">{t('complaints.details.adminNotes')}</h3>
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                    <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
                      {selectedComplaint.adminNotes}
                    </p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="mt-6 flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('complaints.details.updateStatus')}:</span>
                  <select
                    value={selectedComplaint.status}
                    onChange={(e) => {
                      handleUpdateStatus(selectedComplaint.id, e.target.value);
                      setSelectedComplaint({ ...selectedComplaint, status: e.target.value as ComplaintStatus });
                    }}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="new">{t('complaints.status.new')}</option>
                    <option value="under_review">{t('complaints.status.under_review')}</option>
                    <option value="resolved">{t('complaints.status.resolved')}</option>
                  </select>
                </div>
                
                <button
                  onClick={closeModal}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors"
                >
                  {t('common.close')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
