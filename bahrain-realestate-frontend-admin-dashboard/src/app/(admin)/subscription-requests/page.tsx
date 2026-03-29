'use client';

import { useState, useEffect } from 'react';
import { getSubscriptionRequests, updateSubscriptionRequestStatus, SubscriptionRequest } from '@/lib/api/adminApi';
import { useToast } from '@/components/ui/Toast';
import { useLanguage } from '@/contexts/LanguageContext';

export default function SubscriptionRequestsPage() {
  const { t, language } = useLanguage();
  const [requests, setRequests] = useState<SubscriptionRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();

  const formatDate = (value: string) => {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '-';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const getStatusLabel = (status: 'APPROVED' | 'REJECTED' | 'PENDING') => {
    switch (status) {
      case 'APPROVED':
        return t('dashboard.approved');
      case 'REJECTED':
        return t('dashboard.rejected');
      case 'PENDING':
      default:
        return t('dashboard.pending');
    }
  };

  const fetchRequests = async () => {
    try {
      setIsLoading(true);
      const response = await getSubscriptionRequests();
      if (response.success && response.data) {
        setRequests(response.data);
      }
    } catch (err) {
      showToast({
        message: t('subscriptionRequests.failedLoad'),
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (id: number, status: 'APPROVED' | 'REJECTED') => {
    if (!confirm(status === 'APPROVED' ? t('subscriptionRequests.approveConfirm') : t('subscriptionRequests.rejectConfirm'))) {
      return;
    }

    try {
      await updateSubscriptionRequestStatus(id, status);
      showToast({
        message: t('subscriptionRequests.statusUpdated'),
        type: 'success'
      });
      fetchRequests();
    } catch (error) {
       // Error handled in api wrapper or toast
       showToast({
        message: t('common.error'),
        type: 'error'
      });
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t('subscriptionRequests.title')}
        </h1>
        <button 
          onClick={fetchRequests}
          className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
        >
          {t('common.refresh')}
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
              <tr>
                <th scope="col" className="px-6 py-3">{t('subscriptionRequests.company')}</th>
                <th scope="col" className="px-6 py-3">{t('subscriptionRequests.package')}</th>
                <th scope="col" className="px-6 py-3">{t('subscriptionRequests.status')}</th>
                <th scope="col" className="px-6 py-3">{t('subscriptionRequests.date')}</th>
                <th scope="col" className="px-6 py-3">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center">
                    {t('common.loading')}
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center">
                    {t('common.noData')}
                  </td>
                </tr>
              ) : (
                requests.map((request) => (
                  <tr key={request.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                    <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                      {request.company.name}
                      <div className="text-xs text-gray-500">{request.company.phone}</div>
                    </td>
                    <td className="px-6 py-4">
                      {language === 'ar' ? request.package.nameAr : request.package.nameEn}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        request.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                        request.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {getStatusLabel(request.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {formatDate(request.createdAt)}
                    </td>
                    <td className="px-6 py-4">
                      {request.status === 'PENDING' && (
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleStatusUpdate(request.id, 'APPROVED')}
                            className="px-3 py-1 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all"
                          >
                            {t('subscriptionRequests.approve')}
                          </button>
                          <button 
                            onClick={() => handleStatusUpdate(request.id, 'REJECTED')}
                            className="px-3 py-1 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all"
                          >
                            {t('subscriptionRequests.reject')}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
