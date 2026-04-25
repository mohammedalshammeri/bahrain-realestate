'use client';

import Image from 'next/image';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getCompanies, getPropertyById, updatePropertyStatus, Property, ApiError, Company, distributePropertyToCompanies } from '@/lib/api/adminApi';
import { useLanguage } from '@/contexts/LanguageContext';

interface PropertyDetailsResponse {
  data?: Property;
}

interface ApprovedCompaniesResponse {
  data?: Company[] | { companies?: Company[] };
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

function extractCompanies(response: ApprovedCompaniesResponse): Company[] {
  if (Array.isArray(response.data)) {
    return response.data;
  }

  if (response.data && Array.isArray(response.data.companies)) {
    return response.data.companies;
  }

  return [];
}

export default function PropertyDetailsPage() {
  const { t, language } = useLanguage();
  // State for duration/expiry controls
  const [durationDays, setDurationDays] = useState<string>('');
  const [expiresAtInput, setExpiresAtInput] = useState<string>('');
  const [durationLoading, setDurationLoading] = useState(false);
  // Helper to format remaining time
  const formatRemainingTime = (remainingTime?: { days: number; hours: number; minutes: number }) => {
    if (!remainingTime) return t('properties.duration.notSet');
    if (remainingTime.days === 0 && remainingTime.hours === 0 && remainingTime.minutes === 0) {
      return t('properties.duration.expired');
    }

    const parts: string[] = [];

    if (remainingTime.days > 0) {
      parts.push(`${remainingTime.days} ${t('common.days')}`);
    }
    if (remainingTime.hours > 0) {
      parts.push(`${remainingTime.hours} ${t('common.hours')}`);
    }
    if (remainingTime.minutes > 0) {
      parts.push(`${remainingTime.minutes} ${t('common.minutes')}`);
    }

    return parts.join(' ');
  };

  // Calculate remaining time from expiresAt if not present
  const getRemainingTime = () => {
    if (property?.remainingTime) return property.remainingTime;
    if (!property?.expiresAt) return undefined;
    const expires = new Date(property.expiresAt).getTime();
    const now = Date.now();
    if (expires <= now) return { days: 0, hours: 0, minutes: 0 };
    let diff = expires - now;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    diff -= days * (1000 * 60 * 60 * 24);
    const hours = Math.floor(diff / (1000 * 60 * 60));
    diff -= hours * (1000 * 60 * 60);
    const minutes = Math.floor(diff / (1000 * 60));
    return { days, hours, minutes };
  };

  const params = useParams();
  const router = useRouter();
  const propertyId = params.id as string;
  const [property, setProperty] = useState<Property | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [companies, setCompanies] = useState<Company[]>([]);
  const [isDistributeOpen, setIsDistributeOpen] = useState(false);
  const [distributionMode, setDistributionMode] = useState<'ALL' | 'COMPANY'>('ALL');
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchPropertyDetails = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await getPropertyById(parseInt(propertyId, 10)) as PropertyDetailsResponse;
      setProperty(response.data as Property);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to load property details'));
    } finally {
      setIsLoading(false);
    }
  }, [propertyId]);

  useEffect(() => {
    if (propertyId) {
      void fetchPropertyDetails();
    }
  }, [fetchPropertyDetails, propertyId]);

  // Admin: Set duration/expiry for property
  const handleSetDuration = async () => {
    if (!property) return;
    setDurationLoading(true);
    try {
      // If admin provided durationDays or expiresAt, pass them to the API
      const durationNum = durationDays ? Number(durationDays) : undefined;
      const expiresAtVal = expiresAtInput ? expiresAtInput : undefined;
      await updatePropertyStatus(property.id, property.status, durationNum, expiresAtVal);
      await fetchPropertyDetails();
      setDurationDays('');
      setExpiresAtInput('');
      alert(language === 'ar' ? 'تم تحديث مدة العقار بنجاح' : 'Property duration updated successfully');
    } catch (err: unknown) {
      alert(getErrorMessage(err, language === 'ar' ? 'فشل تحديث مدة العقار' : 'Failed to update property duration'));
    } finally {
      setDurationLoading(false);
    }
  };
// ...existing code...

  const isIndividualProperty = useMemo(() => {
    if (!property) return false;
    return !!property.ownerIndividualId || property.minimumPrice !== undefined || String(property.status || '').toUpperCase() === 'PENDING_ADMIN';
  }, [property]);

  const canDistribute = useMemo(() => {
    if (!property) return false;
    const status = String(property.status || '').toUpperCase();
    return isIndividualProperty && (status === 'PENDING_ADMIN' || status === 'REJECTED');
  }, [property, isIndividualProperty]);

  const fetchCompanies = useCallback(async () => {
    try {
      const resp = await getCompanies(undefined, 1, 200, 'approved') as ApprovedCompaniesResponse;
      setCompanies(extractCompanies(resp));
    } catch {
      // non-blocking
    }
  }, []);

  const openDistributeModal = async () => {
    setDistributionMode('ALL');
    setSelectedCompanyId(null);
    setIsDistributeOpen(true);
    await fetchCompanies();
  };

  const handleApproveAndDistribute = async () => {
    if (!property) return;
    if (distributionMode === 'COMPANY' && !selectedCompanyId) {
      alert('Please select a company.');
      return;
    }

    if (!confirm('Approve and send this property to companies?')) return;

    setActionLoading(true);
    try {
      if (distributionMode === 'ALL') {
        await distributePropertyToCompanies(property.id, { mode: 'ALL' });
      } else {
        if (!selectedCompanyId) {
          return;
        }
        await distributePropertyToCompanies(property.id, {
          mode: 'COMPANY',
          companyId: selectedCompanyId,
        });
      }
      setIsDistributeOpen(false);
      await fetchPropertyDetails();
      alert('Property sent to companies successfully.');
    } catch (err: unknown) {
      alert(getErrorMessage(err, 'Failed to distribute property.'));
    } finally {
      setActionLoading(false);
    }
  };

  const formatPrice = (price: number, purpose?: string) => {
    const formattedPrice = new Intl.NumberFormat('en-BH', {
      style: 'currency',
      currency: 'BHD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);

    if (purpose === 'Rent') {
      return `${formattedPrice} / month`;
    }
    return formattedPrice;
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

  // اجعل حالة العقار المنتهي تظهر "معلقة" بدل "نشطة" كما في صفحة القائمة
  const getDisplayStatus = (prop?: Property | null): string => {
    if (!prop) return '';
    const originalStatus = prop.status;
    const normalizedStatus = String(originalStatus || '').toLowerCase();

    // حدد إن كان العقار منتهيًا إما من الحقل isExpired أو من expiresAt
    let isExpired = Boolean(prop.isExpired);
    if (!isExpired && prop.expiresAt) {
      const ts = new Date(prop.expiresAt).getTime();
      if (!Number.isNaN(ts)) {
        isExpired = ts <= Date.now();
      }
    }

    if (isExpired && normalizedStatus === 'active') {
      return 'pending';
    }

    return originalStatus;
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-3 py-1 text-sm font-medium rounded-full";
    switch (status.toLowerCase()) {
      case 'pending_admin':
      case 'pending-admin':
      case 'pending admin':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'sent_to_companies':
      case 'sent-to-companies':
        return `${baseClasses} bg-indigo-100 text-indigo-800`;
      case 'active':
      case 'available':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'rejected':
      case 'sold':
        return `${baseClasses} bg-red-100 text-red-800`;
      case 'rented':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const handleImageClick = (imageUrl: string) => {
    // TODO: Implement lightbox functionality
    alert(`Lightbox for image: ${imageUrl}`);
  };

  const handleViewCompany = () => {
    if (property?.companyId) {
      router.push(`/companies/${property.companyId}`);
    }
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-2"></div>
          <div className="h-6 bg-gray-200 rounded w-32"></div>
        </div>

        {/* Cards skeletons */}
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-40 mb-4"></div>
              <div className="space-y-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="h-4 bg-gray-200 rounded w-20 mb-1"></div>
                      <div className="h-4 bg-gray-200 rounded w-32"></div>
                    </div>
                    <div>
                      <div className="h-4 bg-gray-200 rounded w-20 mb-1"></div>
                      <div className="h-4 bg-gray-200 rounded w-28"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Property Details</h1>
          <p className="text-gray-600">Property ID: {propertyId}</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border-2 border-red-200 p-12">
          <div className="text-center">
            <svg className="mx-auto h-12 w-12 text-red-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.98-.833-2.75 0L3.064 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Property</h3>
            <p className="text-gray-600 mb-6">{error}</p>
            <button 
              onClick={fetchPropertyDetails}
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
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Property Details</h1>
        <p className="text-gray-600 mt-1">Property ID: {propertyId}</p>
      </div>

      {/* A) Basic Information Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>
        </div>
        <div className="px-6 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Remaining Time prominently at top */}
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                {t('properties.duration.remainingLabel', { defaultValue: language === 'ar' ? 'الوقت المتبقي' : 'Remaining time' })}
              </label>
              <span className={property?.isExpired || (property?.expiresAt && getRemainingTime()?.days === 0 && getRemainingTime()?.hours === 0 && getRemainingTime()?.minutes === 0) ? 'text-red-600 font-bold' : 'text-gray-900'}>
                {(property?.isExpired || (property?.expiresAt && getRemainingTime()?.days === 0 && getRemainingTime()?.hours === 0 && getRemainingTime()?.minutes === 0))
                  ? t('properties.duration.expired', { defaultValue: 'Expired' })
                  : formatRemainingTime(getRemainingTime())}
              </span>
              {(() => { console.log('Details modal remainingTime:', getRemainingTime(), 'expiresAt:', property?.expiresAt); return null; })()}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Property ID</label>
              <p className="text-gray-900 font-medium">{property?.id}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Type</label>
              <p className="text-gray-900 capitalize">{property?.type}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Purpose</label>
              <p className="text-gray-900">
                {property?.purpose
                  ? t(
                      `properties.purposes.${String(property.purpose).toLowerCase()}`,
                      { defaultValue: String(property.purpose).charAt(0).toUpperCase() + String(property.purpose).slice(1) }
                    )
                  : 'N/A'}
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Price</label>
              <p className="text-gray-900 font-semibold text-lg">
                {property?.price ? formatPrice(property.price, property.purpose) : 'N/A'}
              </p>
            </div>

            {isIndividualProperty && (
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Minimum Price (Individual)</label>
                <p className="text-gray-900 font-semibold text-lg">
                  {property?.minimumPrice ? formatPrice(property.minimumPrice, property.purpose) : 'N/A'}
                </p>
                <p className="text-xs text-gray-500 mt-1">Not published publicly; admin distributes offers to companies.</p>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Status</label>
              {(() => {
                const displayStatus = getDisplayStatus(property);
                const statusKey = String(displayStatus || '').toLowerCase();
                return (
                  <span className={getStatusBadge(statusKey)}>
                    {displayStatus
                      ? t(`properties.status.${statusKey}`, { defaultValue: displayStatus.charAt(0).toUpperCase() + displayStatus.slice(1) })
                      : 'Unknown'}
                  </span>
                );
              })()}
            </div>

            {/* Remaining Time & Expiry */}
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                {t('properties.duration.remainingLabel', { defaultValue: language === 'ar' ? 'الوقت المتبقي' : 'Remaining time' })}
              </label>
              <p className={property?.isExpired ? 'text-red-600 font-bold' : 'text-gray-900'}>
                {property?.isExpired ? t('properties.duration.expired', { defaultValue: 'Expired' }) : formatRemainingTime(property?.remainingTime)}
              </p>
              {property?.expiresAt && (
                <p className="text-xs text-gray-500 mt-1">
                  {t('properties.duration.expiresAtLabel', { defaultValue: language === 'ar' ? 'تاريخ الانتهاء:' : 'Expires at:' })}{' '}
                  {formatDate(property.expiresAt)}
                </p>
              )}
            </div>
      {/* Admin: Set Duration/Expiry Controls */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-4">
        <h3 className="text-base font-semibold mb-2">
          {t(
            'properties.duration.setDurationTitle',
            { defaultValue: language === 'ar' ? 'تحديد مدة أو تاريخ انتهاء للعقار' : 'Set duration or expiry date for property' }
          )}
        </h3>
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              {t('properties.duration.daysLabel', { defaultValue: language === 'ar' ? 'عدد الأيام' : 'Number of days' })}
            </label>
            <input
              type="number"
              min="1"
              className="border rounded px-3 py-2 w-32"
              value={durationDays}
              onChange={e => setDurationDays(e.target.value)}
              placeholder={language === 'ar' ? 'مثال: 30' : 'e.g. 30'}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              {t('properties.duration.expiresAtField', { defaultValue: language === 'ar' ? 'تاريخ الانتهاء' : 'Expiry date' })}
            </label>
            <input
              type="datetime-local"
              className="border rounded px-3 py-2 w-56"
              value={expiresAtInput}
              onChange={e => setExpiresAtInput(e.target.value)}
            />
          </div>
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            onClick={handleSetDuration}
            disabled={durationLoading || (!durationDays && !expiresAtInput)}
          >
            {durationLoading
              ? language === 'ar'
                ? 'جاري التحديث...'
                : 'Updating...'
              : language === 'ar'
                ? 'تحديث المدة'
                : 'Update duration'}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          {t(
            'properties.duration.helperText',
            { defaultValue: language === 'ar'
              ? 'يمكنك تحديد عدد الأيام أو تاريخ الانتهاء مباشرة. عند انتهاء المدة سيتم تعليق العقار تلقائيًا.'
              : 'You can either set the number of days or a specific expiry date. When the duration ends, the property will automatically be put on hold.' }
          )}
        </p>
      </div>

            {isIndividualProperty && (
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Owner (Individual)</label>
                <p className="text-gray-900">{property?.ownerIndividualId ? `#${property.ownerIndividualId}` : 'N/A'}</p>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Governorate</label>
              <p className="text-gray-900">{property?.governorate || 'N/A'}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Area</label>
              <p className="text-gray-900">{property?.area || 'N/A'}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Bedrooms</label>
              <p className="text-gray-900">{property?.bedrooms || 'N/A'}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Bathrooms</label>
              <p className="text-gray-900">{property?.bathrooms || 'N/A'}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Size (SQM)</label>
              <p className="text-gray-900">{property?.sqm ? `${property.sqm} SQM` : 'N/A'}</p>
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-500 mb-1">Created At</label>
              <p className="text-gray-900">{property?.createdAt ? formatDate(property.createdAt) : 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Actions for Individual Properties */}
      {canDistribute && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Admin Actions</h2>
            <button
              onClick={openDistributeModal}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
            >
              Approve & Distribute
            </button>
          </div>
          <div className="px-6 py-4">
            <p className="text-sm text-gray-600">
              Approving here does not publish the property publicly. It creates company offers only.
            </p>
          </div>
        </div>
      )}

      {/* Distribute Modal */}
      {isDistributeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xl rounded-lg bg-white shadow-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Approve & Distribute</h3>
              <button
                onClick={() => setIsDistributeOpen(false)}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Distribution Mode</label>
                <div className="flex gap-3">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="distributionMode"
                      checked={distributionMode === 'ALL'}
                      onChange={() => setDistributionMode('ALL')}
                    />
                    Send to ALL companies
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="distributionMode"
                      checked={distributionMode === 'COMPANY'}
                      onChange={() => setDistributionMode('COMPANY')}
                    />
                    Send to a SELECTED company
                  </label>
                </div>
              </div>

              {distributionMode === 'COMPANY' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Company</label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    value={selectedCompanyId ?? ''}
                    onChange={(e) => setSelectedCompanyId(e.target.value ? Number(e.target.value) : null)}
                  >
                    <option value="">-- Select --</option>
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} (#{c.id})
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Only approved companies are listed.</p>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setIsDistributeOpen(false)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleApproveAndDistribute}
                className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-60"
                disabled={actionLoading}
              >
                {actionLoading ? 'Sending...' : 'Approve & Send'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* B) Location Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Location</h2>
        </div>
        <div className="px-6 py-6">
          {property?.latitude && property?.longitude ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Latitude</label>
                  <p className="text-gray-900 font-mono">{property.latitude}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Longitude</label>
                  <p className="text-gray-900 font-mono">{property.longitude}</p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-3">Map Preview</label>
                <Image
                  src={`https://maps.googleapis.com/maps/api/staticmap?center=${property.latitude},${property.longitude}&zoom=14&size=600x300&key=YOUR_GOOGLE_MAPS_API_KEY`}
                  alt="Property Location"
                  width={600}
                  height={300}
                  unoptimized
                  className="w-full h-64 object-cover rounded-lg border border-gray-200"
                  onError={(e) => {
                    e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OTk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk1hcCBub3QgYXZhaWxhYmxlPC90ZXh0Pjwvc3ZnPg==';
                  }}
                />
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <div className="text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <p className="text-gray-500">Location not provided</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* C) Company Information Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Company Information</h2>
        </div>
        <div className="px-6 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Company Name</label>
              <p className="text-gray-900 font-medium">{property?.companyName || property?.company?.name || 'N/A'}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">CR Number</label>
              <p className="text-gray-900">{property?.company?.crNumber || 'N/A'}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Email</label>
              <p className="text-gray-900">{property?.company?.email || 'N/A'}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Phone</label>
              <p className="text-gray-900">{property?.company?.phone || 'N/A'}</p>
            </div>
          </div>
          
          <div className="mt-6 flex justify-end">
            <button 
              onClick={handleViewCompany}
              disabled={!property?.companyId}
              className="inline-flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              View Company
            </button>
          </div>
        </div>
      </div>

      {/* D) Property Images Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Property Images</h2>
        </div>
        <div className="px-6 py-6">
          {property?.images && property.images.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {property.images.map((imageUrl, index) => (
                <div key={index} className="relative group h-48">
                  <Image
                    src={imageUrl}
                    alt={`Property image ${index + 1}`}
                    fill
                    unoptimized
                    sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                    className="w-full h-48 object-cover rounded-lg border border-gray-200 cursor-pointer transition-transform group-hover:scale-105"
                    onClick={() => handleImageClick(imageUrl)}
                    onError={(e) => {
                      e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OTk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIG5vdCBhdmFpbGFibGU8L3RleHQ+PC9zdmc+';
                    }}
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity rounded-lg flex items-center justify-center">
                    <svg className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300">
              <div className="text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-gray-500">No images available</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* E) Property Video Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mt-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Property Video</h2>
        </div>
        <div className="px-6 py-6">
          {property?.videoUrl ? (
             <div>
               <video 
                 src={property.videoUrl} 
                 controls 
                 className="w-full max-h-96 rounded-lg border border-gray-200 bg-black"
               />
               <div className="mt-3">
                 <a 
                   href={property.videoUrl} 
                   target="_blank" 
                   rel="noopener noreferrer" 
                   className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium"
                 >
                   <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                   </svg>
                   Open Video in New Tab
                 </a>
               </div>
             </div>
          ) : (
            <div className="flex items-center justify-center h-48 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300">
              <div className="text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <p className="text-gray-500">No video available</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
