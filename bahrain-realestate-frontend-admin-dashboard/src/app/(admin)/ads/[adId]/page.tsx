'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface AdDetails {
  id: string;
  title?: string;
  description?: string;
  type: string;
  status: string;
  rejectionReason?: string | null;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt?: string;

  property: {
    id: string;
    title?: string;
    purpose?: string;
    governorate?: string;
    price?: number;
    images?: string[];
    propertyImages?: Array<{ imageUrl?: string }>;
  };

  company: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    crNumber?: string;
  };
}

export default function AdDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const adId = params.adId as string;

  const [adDetails, setAdDetails] = useState<AdDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectReasonError, setRejectReasonError] = useState<string | null>(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');
  const [editError, setEditError] = useState<string | null>(null);

  const normalizeAdStatus = (status?: string) => {
    const normalized = String(status || '').toLowerCase();
    if (normalized === 'approved' || normalized === 'active') return 'APPROVED';
    if (normalized === 'rejected' || normalized === 'inactive') return 'REJECTED';
    if (normalized === 'pending') return 'PENDING';
    if (normalized === 'deleted') return 'DELETED';
    return String(status || '').toUpperCase();
  };

  const normalizeAdType = (type?: string) => {
    const normalized = String(type || '').toLowerCase();
    if (normalized === 'featured') return 'FEATURED';
    if (normalized === 'regular') return 'REGULAR';
    return String(type || '').toUpperCase();
  };

  const isFeaturedAd = (type?: string) => String(type || '').toLowerCase() === 'featured';

  const toDatetimeLocalValue = (value?: string) => {
    if (!value) return '';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const openEditModal = () => {
    if (!adDetails) return;
    setEditTitle(adDetails.title || '');
    setEditDescription(adDetails.description || '');
    setEditStartDate(toDatetimeLocalValue(adDetails.startDate));
    setEditEndDate(toDatetimeLocalValue(adDetails.endDate));
    setEditError(null);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    const title = editTitle.trim();
    const description = editDescription.trim();
    if (!title) {
      setEditError('Title is required');
      return;
    }
    if (!description) {
      setEditError('Description is required');
      return;
    }
    if (!editStartDate || !editEndDate) {
      setEditError('Start and end dates are required');
      return;
    }

    try {
      setIsActionLoading(true);
      const { updateAd } = await import('@/lib/api/adminApi');
      await updateAd(parseInt(adId), {
        title,
        description,
        startDate: new Date(editStartDate).toISOString(),
        endDate: new Date(editEndDate).toISOString(),
      });
      setIsEditModalOpen(false);
      await fetchAdDetails();
    } catch (err: any) {
      setEditError(err?.message || 'Failed to update ad');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleSoftDelete = async () => {
    const ok = confirm('Archive this ad? (Soft delete)');
    if (!ok) return;

    try {
      setIsActionLoading(true);
      const { deleteAd } = await import('@/lib/api/adminApi');
      await deleteAd(parseInt(adId));
      router.push('/ads');
    } catch (err: any) {
      alert(err?.message || 'Failed to archive ad');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleToggleFeatured = async () => {
    if (!adDetails) return;

    const normalizedStatus = normalizeAdStatus(adDetails.status);
    if (normalizedStatus !== 'APPROVED') {
      alert('Only approved ads can be set as Featured.');
      return;
    }

    const nextFeatured = !isFeaturedAd(adDetails.type);
    const ok = confirm(nextFeatured
      ? 'Set this ad as Featured? (No payment flow will run)'
      : 'Unset Featured for this ad?');
    if (!ok) return;

    try {
      setIsActionLoading(true);
      const { setAdFeatured } = await import('@/lib/api/adminApi');
      await setAdFeatured(parseInt(adId), nextFeatured);
      await fetchAdDetails();
    } catch (err: any) {
      alert(err?.message || 'Failed to update featured status');
    } finally {
      setIsActionLoading(false);
    }
  };

  useEffect(() => {
    if (adId) {
      fetchAdDetails();
    }
  }, [adId]);
  const fetchAdDetails = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { getAdById } = await import('@/lib/api/adminApi');
      const response = await getAdById(parseInt(adId));
      setAdDetails(response.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load ad details');
    } finally {
      setIsLoading(false);
    }
  };
  const handleApprove = async () => {
    try {
      setIsActionLoading(true);
      
      const { approveAd } = await import('@/lib/api/adminApi');
      await approveAd(parseInt(adId));

      // Refresh the page data
      await fetchAdDetails();
    } catch (err) {
      alert('Failed to approve ad');
    } finally {
      setIsActionLoading(false);
    }
  };
  const openRejectModal = () => {
    setRejectReason('');
    setRejectReasonError(null);
    setIsRejectModalOpen(true);
  };

  const handleConfirmReject = async () => {
    const trimmed = rejectReason.trim();
    if (!trimmed) {
      setRejectReasonError('Rejection reason is required');
      return;
    }

    try {
      setIsActionLoading(true);
      const { rejectAd } = await import('@/lib/api/adminApi');
      await rejectAd(parseInt(adId), trimmed);
      setIsRejectModalOpen(false);
      await fetchAdDetails();
    } catch (err) {
      alert('Failed to reject ad');
    } finally {
      setIsActionLoading(false);
    }
  };

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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-BH', {
      style: 'currency',
      currency: 'BHD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  const getTypeBadge = (type: string) => {
    const baseClasses = "px-3 py-1 text-sm font-medium rounded-full";
    switch (type) {
      case 'FEATURED':
        return `${baseClasses} bg-purple-100 text-purple-800`;
      case 'REGULAR':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-3 py-1 text-sm font-medium rounded-full";
    switch (status) {
      case 'APPROVED':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'PENDING':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'REJECTED':
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const getPurposeBadge = (purpose: string) => {
    const baseClasses = "px-3 py-1 text-sm font-medium rounded-full";
    switch (purpose.toLowerCase()) {
      case 'sale':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'rent':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const handleBack = () => {
    router.push('/ads');
  };

  const handleRetry = () => {
    fetchAdDetails();
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="animate-pulse">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-6 w-6 bg-gray-200 rounded"></div>
            <div className="h-8 w-32 bg-gray-200 rounded"></div>
          </div>
          <div className="h-5 w-48 bg-gray-200 rounded"></div>
        </div>

        {/* Cards skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Ad Info Card skeleton */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="animate-pulse space-y-4">
              <div className="h-6 w-32 bg-gray-200 rounded"></div>
              <div className="space-y-3">
                <div className="h-4 w-24 bg-gray-200 rounded"></div>
                <div className="h-4 w-20 bg-gray-200 rounded"></div>
                <div className="h-4 w-36 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>

          {/* Property Info Card skeleton */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="animate-pulse space-y-4">
              <div className="h-6 w-40 bg-gray-200 rounded"></div>
              <div className="space-y-3">
                <div className="h-4 w-full bg-gray-200 rounded"></div>
                <div className="h-4 w-24 bg-gray-200 rounded"></div>
                <div className="h-4 w-32 bg-gray-200 rounded"></div>
                <div className="h-4 w-28 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>

          {/* Company Info Card skeleton */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="animate-pulse space-y-4">
              <div className="h-6 w-40 bg-gray-200 rounded"></div>
              <div className="space-y-3">
                <div className="h-4 w-full bg-gray-200 rounded"></div>
                <div className="h-4 w-32 bg-gray-200 rounded"></div>
                <div className="h-4 w-40 bg-gray-200 rounded"></div>
                <div className="h-4 w-36 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>

          {/* Images Card skeleton */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="animate-pulse space-y-4">
              <div className="h-6 w-32 bg-gray-200 rounded"></div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="aspect-square bg-gray-200 rounded-lg"></div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Status Actions Card skeleton */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="animate-pulse space-y-4">
            <div className="h-6 w-32 bg-gray-200 rounded"></div>
            <div className="flex gap-3">
              <div className="h-10 w-24 bg-gray-200 rounded-lg"></div>
              <div className="h-10 w-24 bg-gray-200 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={handleBack}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Ad Details</h1>
          </div>
          <p className="text-gray-600">Ad ID: {adId}</p>
        </div>

        {/* Error Message */}
        <div className="bg-white rounded-lg shadow-sm border-2 border-red-200 p-12">
          <div className="text-center">
            <svg className="mx-auto h-12 w-12 text-red-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.98-.833-2.75 0L3.064 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Ad Details</h3>
            <p className="text-gray-600 mb-6">{error}</p>
            <button 
              onClick={handleRetry}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main content
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <button
            onClick={handleBack}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Ad Details</h1>
        </div>
        <p className="text-gray-600">Ad ID: {adDetails?.id}</p>
      </div>

      {adDetails && (
        <>
          {/* Edit Modal */}
          {isEditModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
              <div className="w-full max-w-2xl bg-white rounded-lg shadow-lg border border-gray-200">
                <div className="p-6 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Edit Ad</h3>
                      <p className="text-sm text-gray-600">Admin-only fields (not the mobile listing form).</p>
                    </div>
                    <button
                      onClick={() => setIsEditModalOpen(false)}
                      className="p-1 rounded hover:bg-gray-100"
                      aria-label="Close"
                      disabled={isActionLoading}
                    >
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Title</label>
                      <input
                        value={editTitle}
                        onChange={(e) => { setEditTitle(e.target.value); setEditError(null); }}
                        className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={isActionLoading}
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Description</label>
                      <textarea
                        value={editDescription}
                        onChange={(e) => { setEditDescription(e.target.value); setEditError(null); }}
                        rows={4}
                        className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={isActionLoading}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Start Date</label>
                        <input
                          type="datetime-local"
                          value={editStartDate}
                          onChange={(e) => { setEditStartDate(e.target.value); setEditError(null); }}
                          className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          disabled={isActionLoading}
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">End Date</label>
                        <input
                          type="datetime-local"
                          value={editEndDate}
                          onChange={(e) => { setEditEndDate(e.target.value); setEditError(null); }}
                          className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          disabled={isActionLoading}
                        />
                      </div>
                    </div>
                  </div>

                  {editError && <p className="text-sm text-red-600">{editError}</p>}

                  <div className="flex gap-3 justify-end pt-2">
                    <button
                      onClick={() => setIsEditModalOpen(false)}
                      disabled={isActionLoading}
                      className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      disabled={isActionLoading}
                      className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      {isActionLoading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Reject Modal */}
          {isRejectModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
              <div className="w-full max-w-lg bg-white rounded-lg shadow-lg border border-gray-200">
                <div className="p-6 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Reject Ad</h3>
                      <p className="text-sm text-gray-600">Please provide a reason (required).</p>
                    </div>
                    <button
                      onClick={() => setIsRejectModalOpen(false)}
                      className="p-1 rounded hover:bg-gray-100"
                      aria-label="Close"
                      disabled={isActionLoading}
                    >
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <div className="space-y-2">
                    <textarea
                      value={rejectReason}
                      onChange={(e) => {
                        setRejectReason(e.target.value);
                        setRejectReasonError(null);
                      }}
                      rows={4}
                      placeholder="Write rejection reason..."
                      className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                      disabled={isActionLoading}
                    />
                    {rejectReasonError && (
                      <p className="text-sm text-red-600">{rejectReasonError}</p>
                    )}
                  </div>

                  <div className="flex gap-3 justify-end pt-2">
                    <button
                      onClick={() => setIsRejectModalOpen(false)}
                      disabled={isActionLoading}
                      className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleConfirmReject}
                      disabled={isActionLoading}
                      className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                    >
                      {isActionLoading ? 'Rejecting...' : 'Reject'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {normalizeAdStatus(adDetails.status) === 'DELETED' && (
              <div className="lg:col-span-2 bg-yellow-50 border border-yellow-200 text-yellow-900 p-4 rounded-lg">
                This ad is archived (soft-deleted).
              </div>
            )}
            {/* Ad Information Card */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Ad Information</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Title:</span>
                  <span className="text-sm text-gray-900 text-right max-w-[60%] truncate">{adDetails.title || '—'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Ad Type:</span>
                  <span className={getTypeBadge(normalizeAdType(adDetails.type))}>
                    {normalizeAdType(adDetails.type).charAt(0) + normalizeAdType(adDetails.type).slice(1).toLowerCase()}
                  </span>
                </div>
                {isFeaturedAd(adDetails.type) && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Featured:</span>
                    <span className="px-3 py-1 text-sm font-medium rounded-full bg-yellow-100 text-yellow-800">
                      Featured Promotion
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Status:</span>
                  <span className={getStatusBadge(normalizeAdStatus(adDetails.status))}>
                    {normalizeAdStatus(adDetails.status).charAt(0) + normalizeAdStatus(adDetails.status).slice(1).toLowerCase()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Created At:</span>
                  <span className="text-sm text-gray-900">{formatDate(adDetails.createdAt)}</span>
                </div>
                {adDetails.startDate && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Start:</span>
                    <span className="text-sm text-gray-900">{formatDate(adDetails.startDate)}</span>
                  </div>
                )}
                {adDetails.endDate && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">End:</span>
                    <span className="text-sm text-gray-900">{formatDate(adDetails.endDate)}</span>
                  </div>
                )}
                <div className="pt-3 flex gap-3">
                  <button
                    onClick={openEditModal}
                    disabled={isActionLoading || normalizeAdStatus(adDetails.status) === 'DELETED'}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    Edit Ad
                  </button>
                  <button
                    onClick={handleSoftDelete}
                    disabled={isActionLoading || normalizeAdStatus(adDetails.status) === 'DELETED'}
                    className="flex-1 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 disabled:opacity-50"
                  >
                    Archive
                  </button>
                </div>
              </div>
            </div>

            {/* Rejection Reason Card */}
            {normalizeAdStatus(adDetails.status) === 'REJECTED' && (
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Rejection Reason</h2>
                <p className="text-sm text-gray-800 whitespace-pre-wrap">
                  {adDetails.rejectionReason?.trim() ? adDetails.rejectionReason : 'Not provided'}
                </p>
              </div>
            )}

            {/* Featured Toggle Card */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Featured Promotion</h2>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Current:</span>
                <span className={getTypeBadge(normalizeAdType(adDetails.type))}>
                  {normalizeAdType(adDetails.type).charAt(0) + normalizeAdType(adDetails.type).slice(1).toLowerCase()}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-3">
                Featured ads are paid promotions by property owners. This toggle does not create payments.
              </p>
              <div className="mt-4">
                <button
                  onClick={handleToggleFeatured}
                  disabled={isActionLoading}
                  className={
                    isFeaturedAd(adDetails.type)
                      ? 'w-full px-4 py-2 rounded-lg bg-gray-700 text-white hover:bg-gray-800 disabled:opacity-50'
                      : 'w-full px-4 py-2 rounded-lg bg-yellow-600 text-white hover:bg-yellow-700 disabled:opacity-50'
                  }
                >
                  {isFeaturedAd(adDetails.type) ? 'Unset Featured' : 'Set as Featured'}
                </button>
              </div>
            </div>

            {/* Property Information Card */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Property Information</h2>
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-gray-600">Title:</span>
                  <p className="text-sm font-medium text-gray-900">{adDetails.property.title || `Property #${adDetails.property.id}`}</p>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Purpose:</span>
                  <span className={getPurposeBadge(adDetails.property.purpose || '')}>
                    {adDetails.property.purpose ? (adDetails.property.purpose.charAt(0).toUpperCase() + adDetails.property.purpose.slice(1)) : 'N/A'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Governorate:</span>
                  <span className="text-sm text-gray-900">{adDetails.property.governorate || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Price:</span>
                  <span className="text-sm font-semibold text-gray-900">{typeof adDetails.property.price === 'number' ? formatPrice(adDetails.property.price) : 'N/A'}</span>
                </div>
                <div className="pt-3">
                  <button
                    onClick={() => router.push(`/properties/${adDetails.property.id}`)}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  >
                    View Property
                  </button>
                </div>
              </div>
            </div>

            {/* Company Information Card */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Company Information</h2>
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-gray-600">Company Name:</span>
                  <p className="text-sm font-medium text-gray-900">{adDetails.company.name}</p>
                </div>
                {adDetails.company.crNumber && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">CR Number:</span>
                    <span className="text-sm text-gray-900">{adDetails.company.crNumber}</span>
                  </div>
                )}
                <div>
                  <span className="text-sm text-gray-600">Email:</span>
                  <p className="text-sm text-gray-900">{adDetails.company.email}</p>
                </div>
                {adDetails.company.phone && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Phone:</span>
                    <span className="text-sm text-gray-900">{adDetails.company.phone}</span>
                  </div>
                )}
                <div className="pt-3">
                  <button
                    onClick={() => router.push(`/companies/${adDetails.company.id}`)}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                  >
                    View Company
                  </button>
                </div>
              </div>
            </div>

            {/* Images Gallery Card */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Property Images</h2>
              {((adDetails.property.images && adDetails.property.images.length > 0) || (adDetails.property.propertyImages && adDetails.property.propertyImages.length > 0)) ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(adDetails.property.images || adDetails.property.propertyImages?.map((img) => img.imageUrl || '').filter(Boolean) || []).map((image, index) => (
                    <div key={index} className="aspect-square overflow-hidden rounded-lg border border-gray-200">
                      <img
                        src={image}
                        alt={`Property image ${index + 1}`}
                        className="w-full h-full object-contain bg-gray-100 dark:bg-gray-800 hover:scale-105 transition-transform duration-200"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-48 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <div className="text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-sm text-gray-500">No images available</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Status Actions Card */}
          {normalizeAdStatus(adDetails.status) === 'PENDING' && (
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Ad Actions</h2>
              <div className="flex gap-3">
                <button
                  onClick={handleApprove}
                  disabled={isActionLoading}
                  className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isActionLoading ? (
                    <svg className="w-4 h-4 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  Approve Ad
                </button>
                <button
                  onClick={openRejectModal}
                  disabled={isActionLoading}
                  className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isActionLoading ? (
                    <svg className="w-4 h-4 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                  Reject Ad
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
