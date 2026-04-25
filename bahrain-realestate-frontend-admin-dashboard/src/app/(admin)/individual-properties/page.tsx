'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import {
  distributePropertyToCompanies,
  getApprovedCompanies,
  getIndividualProperties,
  rejectIndividualPropertyWithOptions,
  resetIndividualPropertyToPending,
  updateIndividualProperty,
  markIndividualPropertyAsSold,
  deleteIndividualProperty,
  Company,
  DistributeIndividualPropertyPayload,
  IndividualProperty,
  IndividualPropertyOfferSummary,
  getIndividualPropertyOffers,
  ApiError,
} from '@/lib/api/adminApi';
import { useLanguage } from '@/contexts/LanguageContext';

const STATUSES = ['all', 'DRAFT', 'PENDING_ADMIN', 'SENT_TO_COMPANIES', 'ACTIVE', 'REJECTED', 'SOLD'] as const;

type GovernorateOption = {
  id: number;
  nameEn: string;
  nameAr: string;
  value: string;
};

type AreaOption = {
  id: number;
  governorateId: number;
  nameEn: string;
  nameAr: string;
  value: string;
};

const INDIVIDUAL_PROPERTY_TYPES = [
  'apartments',
  'villas_houses',
  'lands',
  'buildings',
  'offices',
  'studio',
  'shops',
  'warehouses',
  'labor_accommodation',
  'commercial_complexes',
  'chalets',
  'traditional_houses',
  'farms',
  'halls',
  'under_construction',
  'camps',
  'misc',
] as const;

const INDIVIDUAL_PURPOSES = ['sale', 'rent'] as const;

interface PaginationData {
  currentPage?: number;
  totalPages?: number;
  totalCount?: number;
  limit?: number;
}

interface IndividualPropertiesResponse {
  success: boolean;
  data?: {
    properties?: IndividualProperty[];
    pagination?: PaginationData;
  };
}

interface IndividualPropertyOffersResponse {
  success: boolean;
  data?: IndividualPropertyOfferSummary[];
}

interface ApprovedCompaniesResponse {
  data?: Company[] | { companies?: Company[]; data?: Company[] };
}

interface PublicGovernorateRecord {
  id: number;
  name?: string;
  nameEn?: string;
  nameAr?: string;
}

interface PublicAreaRecord {
  id: number;
  governorateId: number;
  name?: string;
  nameEn?: string;
  nameAr?: string;
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

  if (response.data && Array.isArray(response.data.data)) {
    return response.data.data;
  }

  return [];
}

export default function IndividualPropertiesPage() {
  const { t, language } = useLanguage();
  const [items, setItems] = useState<IndividualProperty[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<(typeof STATUSES)[number]>('PENDING_ADMIN');

  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
    limit: 10,
  });

  const [isDistributeOpen, setIsDistributeOpen] = useState(false);
  const [distributePropertyId, setDistributePropertyId] = useState<number | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companiesLoading, setCompaniesLoading] = useState(false);
  const [companiesError, setCompaniesError] = useState<string | null>(null);
  const [companySearch, setCompanySearch] = useState('');
  const [sendMode, setSendMode] = useState<'ALL' | 'SELECTED'>('ALL');
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<number[]>([]);

  const [previewProperty, setPreviewProperty] = useState<IndividualProperty | null>(null);
  const [previewImageIndex, setPreviewImageIndex] = useState(0);
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editProperty, setEditProperty] = useState<IndividualProperty | null>(null);
  const [editForm, setEditForm] = useState({
    title: '',
    minimumPrice: '',
    governorate: '',
    area: '',
    type: '',
    purpose: '',
    description: '',
    durationDays: '',
  });

  const canPrev = pagination.page > 1;
  const canNext = pagination.page < pagination.totalPages;
  const isArabic = language === 'ar';

  // Canonical option lists for edit dropdowns (matching mobile app)
  const [governorateOptions, setGovernorateOptions] = useState<GovernorateOption[]>([]);
  const [areaOptions, setAreaOptions] = useState<AreaOption[]>([]);

  // Offers per individual property (which companies received this property / offers statuses)
  const [offersModalOpen, setOffersModalOpen] = useState(false);
  const [offersProperty, setOffersProperty] = useState<IndividualProperty | null>(null);
  const [offers, setOffers] = useState<IndividualPropertyOfferSummary[]>([]);
  const [offersLoading, setOffersLoading] = useState(false);
  const [offersError, setOffersError] = useState<string | null>(null);
  const [selectedOfferIdForSold, setSelectedOfferIdForSold] = useState<number | null>(null);

  // Helpers to translate purpose, type, and location
  const translatePurpose = (purpose: string | null | undefined) => {
    if (!purpose) return '';
    const key = `properties.purposes.${String(purpose).toLowerCase()}`;
    const translated = t(key);
    return translated !== key ? translated : purpose;
  };

  const translatePropertyType = (type: string | null | undefined) => {
    if (!type) return '';
    const key = `properties.types.${type}`;
    const translated = t(key);
    return translated !== key ? translated : type;
  };

  const translateGovernorate = (governorate: string | null | undefined) => {
    if (!governorate) return '';
    const key = `properties.governorates.${governorate}`;
    const translated = t(key);
    return translated !== key ? translated : governorate;
  };

  const translateArea = (area: string | null | undefined) => {
    if (!area) return '';
    const key = `properties.areas.${area}`;
    const translated = t(key);
    return translated !== key ? translated : area;
  };

  const getImageUrl = (imagePath: string) => {
    if (!imagePath) return '';
    if (imagePath.startsWith('http')) return imagePath;
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
    return `${baseUrl}/${cleanPath}`;
  };

  const activePreviewImage = previewProperty?.images?.[previewImageIndex] || previewProperty?.images?.[0] || '';
  const previewVideos = (previewProperty?.videos && previewProperty.videos.length > 0
    ? previewProperty.videos
    : previewProperty?.videoUrl
      ? [previewProperty.videoUrl]
      : []).map(getImageUrl);
  const editImages = (editProperty?.images || []).map(getImageUrl);
  const editVideos = (editProperty?.videos && editProperty.videos.length > 0
    ? editProperty.videos
    : editProperty?.videoUrl
      ? [editProperty.videoUrl]
      : []).map(getImageUrl);

  const openPreview = (property: IndividualProperty) => {
    setPreviewProperty(property);
    setPreviewImageIndex(0);
    setActiveVideoIndex(0);
  };

  const openOffersModal = async (property: IndividualProperty, forMarkSold: boolean = false) => {
    setOffersProperty(property);
    setOffersModalOpen(true);
    setOffersLoading(true);
    setOffersError(null);
    setOffers([]);
    setSelectedOfferIdForSold(null);

    try {
      const response = await getIndividualPropertyOffers(property.id) as IndividualPropertyOffersResponse;
      if (response?.success && Array.isArray(response.data)) {
        setOffers(response.data);

        if (forMarkSold) {
          const accepted = response.data.find((offer) => offer.status === 'ACCEPTED');
          if (accepted) setSelectedOfferIdForSold(accepted.id);
        }
      } else {
        setOffers([]);
        setOffersError(t('individualProperties.messages.failedLoadOffers') || 'فشل في جلب عروض الشركات لهذا العقار');
      }
    } catch (err: unknown) {
      setOffers([]);
      setOffersError(getErrorMessage(err, t('individualProperties.messages.failedLoadOffers') || 'فشل في جلب عروض الشركات لهذا العقار'));
    } finally {
      setOffersLoading(false);
    }
  };

  const fetchData = async (nextPage: number) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await getIndividualProperties(search || undefined, status, nextPage, 10) as IndividualPropertiesResponse;
      if (response?.success && response?.data?.properties) {
        setItems(response.data.properties);
        const p = response.data.pagination;
        setPagination({
          page: p?.currentPage ?? nextPage,
          totalPages: p?.totalPages ?? 1,
          total: p?.totalCount ?? 0,
          limit: p?.limit ?? 10,
        });
      } else {
        setItems([]);
        setPagination({ page: nextPage, totalPages: 1, total: 0, limit: 10 });
      }

      setPage(nextPage);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to load individual properties'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchData(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  // Load full governorates/areas lists to match mobile app options
  useEffect(() => {
    const loadLocations = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const [govRes, areaRes] = await Promise.all([
          fetch(`${baseUrl}/api/public/governorates`),
          fetch(`${baseUrl}/api/public/areas`),
        ]);

        if (govRes.ok) {
          const govJson = await govRes.json();
          if (govJson?.success && Array.isArray(govJson.data)) {
            const mapped: GovernorateOption[] = govJson.data
              .map((g: PublicGovernorateRecord) => {
                const nameEn = g.nameEn || g.name || '';
                const nameAr = g.nameAr || g.name || '';
                return {
                  id: g.id,
                  nameEn,
                  nameAr,
                  value: String(g.id), // نخزن الـ ID كنفس ما يرسله الموبايل
                };
              })
              .filter((g: GovernorateOption) => !!g.value);
            setGovernorateOptions(mapped);
          }
        }

        if (areaRes.ok) {
          const areaJson = await areaRes.json();
          if (areaJson?.success && Array.isArray(areaJson.data)) {
            const mappedAreas: AreaOption[] = areaJson.data
              .map((a: PublicAreaRecord) => {
                const nameEn = a.nameEn || a.name || '';
                const nameAr = a.nameAr || a.name || '';
                return {
                  id: a.id,
                  governorateId: a.governorateId,
                  nameEn,
                  nameAr,
                  value: String(a.id), // نخزن الـ ID
                };
              })
              .filter((a: AreaOption) => !!a.value);
            setAreaOptions(mappedAreas);
          }
        }
      } catch {
        // Ignore location loading errors in admin panel
      }
    };

    loadLocations();
  }, []);

  const filteredAreasForEdit = useMemo(() => {
    if (!editForm.governorate) return [];
    const govId = Number(editForm.governorate);
    if (!Number.isFinite(govId)) return [];
    return areaOptions.filter((a) => a.governorateId === govId);
  }, [areaOptions, editForm.governorate]);

  const openDistribute = async (id: number) => {
    setDistributePropertyId(id);
    setIsDistributeOpen(true);
    setCompaniesError(null);
    setSendMode('ALL');
    setSelectedCompanyIds([]);
    setCompanySearch('');

    try {
      setCompaniesLoading(true);
      const resp = await getApprovedCompanies(undefined, 1, 200) as ApprovedCompaniesResponse;
      setCompanies(extractCompanies(resp));
    } catch (e: unknown) {
      setCompanies([]);
      setCompaniesError(getErrorMessage(e, 'Failed to load companies'));
    } finally {
      setCompaniesLoading(false);
    }
  };

  const toggleCompany = (id: number) => {
    setSelectedCompanyIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const submitDistribute = async () => {
    if (!distributePropertyId) return;

    let payload: DistributeIndividualPropertyPayload;
    if (sendMode === 'ALL') {
      payload = { mode: 'ALL' };
    } else {
      if (selectedCompanyIds.length === 0) {
        alert(t('individualProperties.messages.selectCompany'));
        return;
      }
      payload = { mode: 'COMPANIES', companyIds: selectedCompanyIds };
    }

    if (!confirm(t('individualProperties.messages.confirmSend'))) return;

    try {
      await distributePropertyToCompanies(distributePropertyId, payload);
      
      // Optimistic update
      setItems(prevItems => prevItems.map(item => 
        item.id === distributePropertyId 
          ? { ...item, status: 'SENT_TO_COMPANIES' } 
          : item
      ));

      setIsDistributeOpen(false);
      setDistributePropertyId(null);
      await fetchData(page);
    } catch (err: unknown) {
      alert(getErrorMessage(err, t('individualProperties.messages.failedDistribute')));
    }
  };

  const onReject = async (id: number) => {
    const current = items.find((x) => x.id === id);
    const status = String(current?.status || '').toUpperCase();

    const reason = window.prompt(t('individualProperties.messages.rejectionReason'))?.trim();
    if (!reason) return;
    try {
      if (status === 'ACTIVE') {
        const ok = confirm(t('individualProperties.messages.confirmRejectActive'));
        if (!ok) return;
        await rejectIndividualPropertyWithOptions(id, { reason, forceReject: true });
      } else {
        await rejectIndividualPropertyWithOptions(id, { reason });
      }
      await fetchData(page);
    } catch (err: unknown) {
      alert(getErrorMessage(err, t('individualProperties.messages.failedReject')));
    }
  };

  const onReset = async (id: number) => {
    if (!confirm(t('individualProperties.messages.confirmReset'))) return;
    try {
      await resetIndividualPropertyToPending(id);
      await fetchData(page);
    } catch (err: unknown) {
      alert(getErrorMessage(err, t('individualProperties.messages.failedReset')));
    }
  };

  const onMarkSold = async (property: IndividualProperty, offerId?: number | null) => {
    if (!confirm(t('individualProperties.messages.confirmSold'))) return;
    try {
      await markIndividualPropertyAsSold(property.id, offerId ?? undefined);
      setOffersModalOpen(false);
      setOffersProperty(null);
      await fetchData(page);
    } catch (err: unknown) {
      alert(getErrorMessage(err, t('individualProperties.messages.failedMarkSold')));
    }
  };

  const onDelete = async (id: number) => {
    if (!confirm(t('individualProperties.messages.confirmDelete'))) return;
    try {
      await deleteIndividualProperty(id);
      await fetchData(page);
    } catch (err: unknown) {
      alert(getErrorMessage(err, t('individualProperties.messages.failedDelete')));
    }
  };

  const openEdit = (p: IndividualProperty) => {
    setEditProperty(p);
    setEditForm({
      title: p.title ?? '',
      minimumPrice: String(p.minimumPrice ?? ''),
      governorate: p.governorate ?? '', // يخزن ID كنص (نفس الموبايل)
      area: p.area ?? '',               // يخزن ID كنص
      type: p.type ?? '',
      purpose: String(p.purpose ?? '').toLowerCase(),
      description: p.description ?? '',
      durationDays: p.durationDays ? String(p.durationDays) : '',
    });
    setIsEditOpen(true);
  };

  const submitEdit = async () => {
    if (!editProperty) return;
    try {
      const payload: Partial<IndividualProperty> = {
        title: editForm.title,
        description: editForm.description,
        type: editForm.type,
        purpose: String(editForm.purpose || '').toLowerCase() === 'rent' ? 'rent' : 'sale',
        governorate: editForm.governorate,
        area: editForm.area,
        minimumPrice: Number(editForm.minimumPrice),
        durationDays: editForm.durationDays ? Number(editForm.durationDays) : undefined,
      };

      await updateIndividualProperty(editProperty.id, payload);
      setIsEditOpen(false);
      setEditProperty(null);
      await fetchData(page);
    } catch (err: unknown) {
      alert(getErrorMessage(err, t('individualProperties.messages.failedUpdate')));
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('individualProperties.title')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t('individualProperties.description')}
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
        <div className="flex flex-col space-y-4">
            <div className="flex flex-col md:flex-row justify-between gap-4">
                 <div className="w-full md:w-96 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                     value={search}
                     onChange={(e) => setSearch(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
                    placeholder={t('individualProperties.searchPlaceholder')}
                  />
                </div>
                
                 <div className="flex flex-wrap gap-2">
                     {STATUSES.map((s) => (
                        <button
                            key={s}
                            onClick={() => setStatus(s)}
                            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                                status === s
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                        >
                             {t(`individualProperties.status.${s.toLowerCase()}`)}
                        </button>
                     ))}
                 </div>
            </div>
            
             <div className="flex justify-start">
               {/* Search button is not strictly needed as active search on type is better but kept for compatibility or refresh */}
                <button
                    onClick={() => fetchData(1)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-sm font-medium text-gray-700 dark:text-gray-200 transition-colors"
                >
                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    {t('common.search')}/{t('properties.actions.refresh')}
                </button>
            </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-200 border border-red-200 dark:border-red-800 flex items-center gap-3">
             <svg className="h-5 w-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
             </svg>
            <span>{error}</span>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">{t('individualProperties.table.id')}</th>
                <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">{t('individualProperties.table.titleArea')}</th>
                <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">{t('individualProperties.table.owner')}</th>
                <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">{t('individualProperties.table.minPrice')}</th>
                <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">{t('properties.table.status')}</th>
                <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">{t('individualProperties.table.offers')}</th>
                <th scope="col" className="px-6 py-3 text-end text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
              {isLoading ? (
                 Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index} className="animate-pulse">
                    {Array.from({ length: 7 }).map((_, colIndex) => (
                      <td key={colIndex} className="px-6 py-4 whitespace-nowrap">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                      </td>
                    ))}
                  </tr>
                ))
              ) : items.length === 0 ? (
                <tr>
                  <td className="px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-400" colSpan={7}>
                    <div className="flex flex-col items-center justify-center">
                        <svg className="h-12 w-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        <p>{t('individualProperties.messages.noData')}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                items.map((p) => {
                  const statusUpper = String(p.status || '').toUpperCase();
                  const canDistribute =
                    statusUpper === 'DRAFT' || statusUpper === 'PENDING_ADMIN' || statusUpper === 'SENT_TO_COMPANIES';

                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                      onClick={() => openPreview(p)}
                    >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        <span className="font-mono text-gray-500 dark:text-gray-400">#</span>{p.id}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900 dark:text-white">{p.title || t('common.na')}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {translateGovernorate(p.governorate)} / {translateArea(p.area)} • {translatePropertyType(p.type)}
                      </div>
                      {p.adminRejectionReason ? (
                        <div className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                             <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.98-.833-2.75 0L3.064 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>
                             {t('individualProperties.messages.reason')}: {p.adminRejectionReason}
                        </div>
                      ) : null}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{p.owner?.fullName || t('common.na')}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {(p.owner?.phone || p.owner?.email) ?? t('common.na')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white font-medium">{Number(p.minimumPrice).toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                         statusUpper === 'ACTIVE' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                         statusUpper === 'REJECTED' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                         statusUpper === 'SOLD' ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' :
                         'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                      }`}>
                        {t(`individualProperties.status.${p.status.toLowerCase()}`)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 text-center">{p._count?.offers ?? 0}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-end text-sm font-medium">
                      <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        {(() => {
                          const title = canDistribute
                            ? ''
                            : t('individualProperties.messages.cannotDistribute', { status: t(`individualProperties.status.${statusUpper.toLowerCase()}`) });

                          if (canDistribute) {
                              return (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openDistribute(p.id);
                                  }}
                                  title={title}
                                  className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                                >
                                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                   </svg>
                                   <span className="sr-only">{t('individualProperties.actions.approveSend')}</span>
                                </button>
                              );
                          }
                          return null;
                        })()}
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onReject(p.id);
                          }}
                          className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          title={t('individualProperties.actions.reject')}
                        >
                           <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                           </svg>
                        </button>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openEdit(p);
                          }}
                          className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                          title={t('individualProperties.actions.edit')}
                        >
                           <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                           </svg>
                        </button>

                        {/* View company offers for this individual property */}
                        {p._count?.offers ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openOffersModal(p, false);
                            }}
                            className="p-1.5 rounded-lg text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
                            title={t('individualProperties.actions.viewOffers')}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h7" />
                            </svg>
                          </button>
                        ) : null}
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(p.id);
                          }}
                          className="p-1.5 rounded-lg text-gray-500 hover:text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          title={t('individualProperties.actions.delete')}
                        >
                           <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                           </svg>
                        </button>
                        
                         <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onReset(p.id);
                          }}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          title={t('individualProperties.actions.reset')}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        </button>
                      </div>
                    </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
          <div className="text-xs text-gray-600 dark:text-gray-300">
            {t('common.page')} {pagination.page} {t('common.of')} {pagination.totalPages} • {t('common.total')} {pagination.total}
          </div>
          <div className="flex gap-2">
            <button
              disabled={!canPrev || isLoading}
              onClick={() => fetchData(page - 1)}
              className="px-3 py-1.5 rounded-md border border-gray-300 dark:border-gray-600 text-xs text-gray-800 dark:text-gray-200 disabled:opacity-50"
            >
              {t('common.previous')}
            </button>
            <button
              disabled={!canNext || isLoading}
              onClick={() => fetchData(page + 1)}
              className="px-3 py-1.5 rounded-md border border-gray-300 dark:border-gray-600 text-xs text-gray-800 dark:text-gray-200 disabled:opacity-50"
            >
              {t('common.next')}
            </button>
          </div>
        </div>
      </div>

      {isDistributeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <div>
                <div className="text-sm font-semibold text-gray-900 dark:text-white">{t('individualProperties.distribute.title')}</div>
                <div className="text-xs text-gray-600 dark:text-gray-300">{t('individualProperties.distribute.subtitle')}</div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsDistributeOpen(false);
                  setDistributePropertyId(null);
                }}
                className="p-2 rounded-md text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                aria-label={t('common.close')}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-4">
              <div className="flex items-center gap-4 mb-4">
                <label className="inline-flex items-center gap-2 text-sm text-gray-800 dark:text-gray-200">
                  <input
                    type="radio"
                    checked={sendMode === 'ALL'}
                    onChange={() => setSendMode('ALL')}
                  />
                  {t('individualProperties.distribute.allCompanies')}
                </label>
                <label className="inline-flex items-center gap-2 text-sm text-gray-800 dark:text-gray-200">
                  <input
                    type="radio"
                    checked={sendMode === 'SELECTED'}
                    onChange={() => setSendMode('SELECTED')}
                  />
                  {t('individualProperties.distribute.selectedCompanies')}
                </label>
              </div>

              {sendMode === 'SELECTED' && (
                <div className="rounded-md border border-gray-200 dark:border-gray-700 p-3">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-3">
                    <input
                      value={companySearch}
                      onChange={(e) => setCompanySearch(e.target.value)}
                      placeholder={t('individualProperties.distribute.searchCompanies')}
                      className="w-full md:w-72 px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedCompanyIds(companies.map((c) => c.id))}
                        className="px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 text-xs text-gray-800 dark:text-gray-200"
                      >
                        {t('common.selectAll')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedCompanyIds([])}
                        className="px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 text-xs text-gray-800 dark:text-gray-200"
                      >
                        {t('common.clear')}
                      </button>
                    </div>
                  </div>

                  {companiesError && (
                    <div className="mb-2 text-xs text-red-600 dark:text-red-300">{companiesError}</div>
                  )}

                  <div className="max-h-64 overflow-auto rounded-md border border-gray-200 dark:border-gray-700">
                    {companiesLoading ? (
                      <div className="p-3 text-sm text-gray-600 dark:text-gray-300">{t('common.loading')}</div>
                    ) : (
                      (companies || [])
                        .filter((c) => {
                          const q = companySearch.trim().toLowerCase();
                          if (!q) return true;
                          return (
                            String(c.name || '').toLowerCase().includes(q) ||
                            String(c.email || '').toLowerCase().includes(q) ||
                            String(c.crNumber || '').toLowerCase().includes(q)
                          );
                        })
                        .map((c) => (
                          <label
                            key={c.id}
                            className="flex items-center gap-3 px-3 py-2 border-b border-gray-100 dark:border-gray-700 last:border-b-0 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={selectedCompanyIds.includes(c.id)}
                              onChange={() => toggleCompany(c.id)}
                            />
                            <div className="flex-1">
                              <div className="text-sm text-gray-900 dark:text-white">{c.name}</div>
                              <div className="text-xs text-gray-600 dark:text-gray-300">{c.email || c.crNumber || ''}</div>
                            </div>
                          </label>
                        ))
                    )}
                  </div>

                  <div className="mt-2 text-xs text-gray-600 dark:text-gray-300">Selected: {selectedCompanyIds.length}</div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => {
                  setIsDistributeOpen(false);
                  setDistributePropertyId(null);
                }}
                className="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 text-sm text-gray-800 dark:text-gray-200"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={submitDistribute}
                className="px-4 py-2 rounded-md bg-green-600 hover:bg-green-700 text-white text-sm"
              >
                {t('individualProperties.distribute.send')}
              </button>
            </div>
          </div>
        </div>
      )}

      {isEditOpen && editProperty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl max-h-[85vh] rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <div>
                <div className="text-sm font-semibold text-gray-900 dark:text-white">{t('individualProperties.edit.title', { id: editProperty.id })}</div>
                <div className="text-xs text-gray-600 dark:text-gray-300">{t('individualProperties.edit.subtitle')}</div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsEditOpen(false);
                  setEditProperty(null);
                }}
                className="p-2 rounded-md text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                aria-label={t('common.close')}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3 overflow-y-auto">
              <div>
                <label className="text-xs text-gray-600 dark:text-gray-300">{t('individualProperties.fields.title')}</label>
                <input
                  value={editForm.title}
                  onChange={(e) => setEditForm((p) => ({ ...p, title: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-600 dark:text-gray-300">{t('individualProperties.table.minPrice')}</label>
                <input
                  value={editForm.minimumPrice}
                  onChange={(e) => setEditForm((p) => ({ ...p, minimumPrice: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-600 dark:text-gray-300">{t('individualProperties.fields.governorate')}</label>
                <select
                  value={editForm.governorate}
                  onChange={(e) => {
                    const value = e.target.value;
                    // عند تغيير المحافظة، نفرغ حقل المنطقة ونربطها بالمحافظة الجديدة
                    setEditForm((p) => ({ ...p, governorate: value, area: '' }));
                  }}
                  className="w-full mt-1 px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
                >
                  <option value="">
                    {isArabic ? 'اختر المحافظة' : 'Select governorate'}
                  </option>
                  {governorateOptions.map((gov) => (
                    <option key={gov.id} value={gov.value}>
                      {isArabic ? gov.nameAr || gov.nameEn || gov.value : gov.nameEn || gov.nameAr || gov.value}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-600 dark:text-gray-300">{t('individualProperties.fields.area')}</label>
                <select
                  value={editForm.area}
                  onChange={(e) => setEditForm((p) => ({ ...p, area: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
                >
                  <option value="">
                    {isArabic ? 'اختر المنطقة' : 'Select area'}
                  </option>
                  {filteredAreasForEdit.map((area) => (
                    <option key={area.id} value={area.value}>
                      {isArabic ? area.nameAr || area.nameEn || area.value : area.nameEn || area.nameAr || area.value}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-600 dark:text-gray-300">{t('individualProperties.fields.type')}</label>
                <select
                  value={editForm.type}
                  onChange={(e) => setEditForm((p) => ({ ...p, type: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
                >
                  <option value="">
                    {isArabic ? 'اختر النوع' : 'Select type'}
                  </option>
                  {INDIVIDUAL_PROPERTY_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {translatePropertyType(type)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-600 dark:text-gray-300">{t('individualProperties.fields.purpose')}</label>
                <select
                  value={editForm.purpose}
                  onChange={(e) => setEditForm((p) => ({ ...p, purpose: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
                >
                  <option value="">
                    {isArabic ? 'اختر الغرض' : 'Select purpose'}
                  </option>
                  {INDIVIDUAL_PURPOSES.map((purpose) => (
                    <option key={purpose} value={purpose}>
                      {translatePurpose(purpose)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-600 dark:text-gray-300">Duration (Days)</label>
                <input
                  value={editForm.durationDays}
                  onChange={(e) => setEditForm((p) => ({ ...p, durationDays: e.target.value }))}
                  type="number"
                  placeholder="30"
                  className="w-full mt-1 px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-gray-600 dark:text-gray-300">{t('individualProperties.fields.description')}</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))}
                  rows={4}
                  className="w-full mt-1 px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
                />
              </div>
              {editImages.length > 0 && (
                <div className="md:col-span-2">
                  <label className="text-xs text-gray-600 dark:text-gray-300">{t('individualProperties.fields.images')}</label>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {editImages.map((url, idx) => (
                      <a
                        key={`${editProperty.id || 'edit'}-image-${idx}`}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block h-16 w-16 rounded-md overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-900"
                        aria-label={`${t('individualProperties.fields.images')} ${idx + 1}`}
                      >
                        <Image src={url} alt="" width={64} height={64} unoptimized className="h-full w-full object-cover" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
              <div className="md:col-span-2">
                <label className="text-xs text-gray-600 dark:text-gray-300">{t('individualProperties.preview.videos', { count: '' }).split('(')[0]}</label>
                {editVideos.length > 0 ? (
                  <div className="mt-1 space-y-1">
                    {editVideos.map((url, idx) => (
                      <a
                        key={`${editProperty?.id || 'edit'}-video-${idx}`}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-blue-600 hover:text-blue-800 underline text-sm"
                      >
                        Video {idx + 1}
                      </a>
                    ))}
                  </div>
                ) : (
                  <div className="mt-1 text-sm text-gray-400">{t('individualProperties.edit.noVideo')}</div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => {
                  setIsEditOpen(false);
                  setEditProperty(null);
                }}
                className="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 text-sm text-gray-800 dark:text-gray-200"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={submitEdit}
                className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm"
              >
                {t('common.save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {previewProperty && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Individual property preview">
          <div className="absolute inset-0 bg-black/60" onClick={() => setPreviewProperty(null)} />

          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="w-full max-w-4xl bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden max-h-[85vh] flex flex-col">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-800">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {previewProperty.title || t('individualProperties.preview.propertyId', { id: previewProperty.id })}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t('individualProperties.table.id')}: {previewProperty.id} • {previewProperty.governorate} • {previewProperty.area}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewProperty(null)}
                  className="p-2 rounded-md text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                  aria-label="Close"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-0 overflow-y-auto">
                <div className="p-5">
                  <div className="relative aspect-[4/3] w-full rounded-lg bg-gray-100 dark:bg-gray-800 overflow-hidden">
                    {activePreviewImage ? (
                      <Image
                        src={getImageUrl(activePreviewImage)}
                        alt={previewProperty.title || 'Property'}
                        fill
                        unoptimized
                        sizes="(min-width: 768px) 50vw, 100vw"
                        className="w-full h-full object-contain bg-gray-100 dark:bg-gray-800"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {Array.isArray(previewProperty.images) && previewProperty.images.length > 1 && (
                    <div className="mt-3 flex gap-2 overflow-x-auto">
                      {previewProperty.images.map((img, idx) => (
                        <button
                          key={`${previewProperty.id}-img-${idx}`}
                          type="button"
                          onClick={() => setPreviewImageIndex(idx)}
                          className={`relative h-14 w-14 rounded-md overflow-hidden border ${idx === previewImageIndex ? 'border-blue-500' : 'border-gray-200 dark:border-gray-700'} flex-shrink-0`}
                          aria-label={`Image ${idx + 1}`}
                        >
                          <Image src={getImageUrl(img)} alt="" fill unoptimized sizes="56px" className="h-full w-full object-contain bg-gray-100 dark:bg-gray-800" />
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Videos Section */}
                  {previewVideos.length > 0 && (
                    <div className="mt-6 pt-6 border-t-2 border-blue-500">
                      <div className="text-lg font-bold text-blue-600 dark:text-blue-400 mb-3 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                        {t('individualProperties.preview.videos', { count: previewVideos.length })}
                      </div>

                      {/* Active Video - Fixed Height Container */}
                      <div className="w-full h-64 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800 mb-3 bg-black">
                        <video
                          src={previewVideos[activeVideoIndex] || previewVideos[0]}
                          controls
                          className="w-full h-full object-contain"
                        />
                      </div>

                      {/* Video Thumbnails */}
                      {previewVideos.length > 1 && (
                        <div className="flex gap-2 overflow-x-auto pb-2">
                          {previewVideos.map((url, idx) => (
                            <button
                              key={`${previewProperty.id}-vid-${idx}`}
                              type="button"
                              onClick={() => setActiveVideoIndex(idx)}
                              className={`relative h-16 w-16 rounded-md overflow-hidden border-2 flex-shrink-0 ${
                                idx === activeVideoIndex
                                  ? 'border-blue-500'
                                  : 'border-gray-200 dark:border-gray-700'
                              }`}
                            >
                              <video
                                src={url}
                                className="w-full h-full object-contain bg-black pointer-events-none"
                                onError={() => {
                                   // Keep it silent or show placeholder
                                }}
                              />
                              {/* Play Overlay */}
                              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                <svg
                                  className="w-6 h-6 text-white opacity-90 drop-shadow-md"
                                  fill="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path d="M8 5v14l11-7z" />
                                </svg>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="p-5 border-t md:border-t-0 md:border-l border-gray-200 dark:border-gray-800">
                  <div className="space-y-4">
                    <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-4 bg-gray-50 dark:bg-gray-800/40">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{t('individualProperties.table.minPrice')}</div>
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">
                          {Number(previewProperty.minimumPrice || 0).toFixed(2)}
                        </div>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <div className="text-sm text-gray-600 dark:text-gray-300">{t('properties.table.status')}</div>
                        <span className="inline-flex px-2 py-1 rounded-full text-xs bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                          {t(`individualProperties.status.${previewProperty.status.toLowerCase()}`)}
                        </span>
                      </div>
                      <div className="mt-2 space-y-1 text-sm">
                        <div className="flex items-center justify-between">
                          <div className="text-gray-600 dark:text-gray-300">
                            {t('individualProperties.fields.purpose')}
                          </div>
                          <div className={`text-gray-900 dark:text-white ${isArabic ? 'text-left' : 'text-right'}`}>
                            {translatePurpose(previewProperty.purpose)}
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="text-gray-600 dark:text-gray-300">
                            {t('individualProperties.fields.type')}
                          </div>
                          <div className={`text-gray-900 dark:text-white ${isArabic ? 'text-left' : 'text-right'}`}>
                            {translatePropertyType(previewProperty.type)}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-white mb-2">{t('individualProperties.table.owner')}</div>
                      <div className="text-sm text-gray-700 dark:text-gray-300">
                        <div className="flex items-center justify-between">
                          <span>{t('individualProperties.fields.name')}</span>
                          <span className={`font-medium text-gray-900 dark:text-white ${isArabic ? 'text-left' : 'text-right'}`}>
                            {previewProperty.owner?.fullName || t('common.na')}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <span>{t('individualProperties.fields.contact')}</span>
                          <span className={`font-medium text-gray-900 dark:text-white ${isArabic ? 'text-left' : 'text-right'}`}>
                            {(previewProperty.owner?.phone || previewProperty.owner?.email) ?? t('common.na')}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-white mb-2">{t('individualProperties.fields.description')}</div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                        {previewProperty.description || t('individualProperties.messages.noDescription')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {offersModalOpen && offersProperty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-3xl rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <div>
                <div className="text-sm font-semibold text-gray-900 dark:text-white">
                  {t('individualProperties.table.offers')} – #{offersProperty.id}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-300">
                  {(offersProperty.title || t('individualProperties.messages.noTitle')) as string}
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setOffersModalOpen(false);
                  setOffersProperty(null);
                }}
                className="p-2 rounded-md text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                aria-label={t('common.close')}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1">
              {offersLoading ? (
                <div className="text-sm text-gray-700 dark:text-gray-200">
                  {t('common.loading')}
                </div>
              ) : offersError ? (
                <div className="text-sm text-red-600 dark:text-red-300">{offersError}</div>
              ) : offers.length === 0 ? (
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  {t('individualProperties.messages.noOffers') || 'لا توجد عروض شركات لهذا العقار حتى الآن.'}
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-xs">
                  <thead className="bg-gray-50 dark:bg-gray-900/40">
                    <tr>
                      <th className="px-3 py-2 text-left rtl:text-right font-medium text-gray-700 dark:text-gray-200">{t('individualProperties.table.id')}</th>
                      <th className="px-3 py-2 text-left rtl:text-right font-medium text-gray-700 dark:text-gray-200">{t('companies.title') || 'Company'}</th>
                      <th className="px-3 py-2 text-left rtl:text-right font-medium text-gray-700 dark:text-gray-200">{t('individualProperties.table.minPrice')}</th>
                      <th className="px-3 py-2 text-left rtl:text-right font-medium text-gray-700 dark:text-gray-200">{t('individualProperties.status.active') || 'Status'}</th>
                      <th className="px-3 py-2 text-center font-medium text-gray-700 dark:text-gray-200">
                        {offersProperty.status === 'SOLD' 
                          ? (offersProperty.purpose?.toLowerCase() === 'rent' ? t('individualProperties.status.rented', { defaultValue: 'مؤجر' }) : t('individualProperties.status.sold'))
                          : (offersProperty.purpose?.toLowerCase() === 'rent' ? t('individualProperties.actions.markRented', { defaultValue: 'تحديد كمؤجر' }) : t('individualProperties.actions.markSold'))
                        }
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {offers.map((offer) => {
                      const isWinner = offersProperty.status === 'SOLD' && offer.status === 'ACCEPTED';
                      const isSelected = selectedOfferIdForSold === offer.id;
                      const canSelect = offersProperty.status !== 'SOLD' && offer.status === 'ACCEPTED';

                      return (
                        <tr key={offer.id} className={isWinner ? 'bg-green-50 dark:bg-green-900/20' : ''}>
                          <td className="px-3 py-2 whitespace-nowrap text-gray-800 dark:text-gray-100">{offer.id}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-gray-800 dark:text-gray-100">
                            {offer.company?.name || '-'}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-gray-800 dark:text-gray-100">
                            {offer.companyPrice != null ? Number(offer.companyPrice).toLocaleString() : '-'}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-gray-800 dark:text-gray-100">
                            {t(`individualProperties.offerStatus.${offer.status.toLowerCase()}`, { defaultValue: offer.status })}
                            {isWinner && (
                              <span className="ml-2 rtl:mr-2 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200">
                                {offersProperty.purpose?.toLowerCase() === 'rent' ? t('individualProperties.status.rented', { defaultValue: 'مؤجر' }) : t('individualProperties.status.sold')}
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-center">
                            {canSelect ? (
                              <input
                                type="radio"
                                name="winningOffer"
                                checked={isSelected}
                                onChange={() => setSelectedOfferIdForSold(offer.id)}
                              />
                            ) : isWinner ? (
                              <span className="text-xs text-green-700 dark:text-green-300">{t('individualProperties.messages.soldViaThisCompany') || 'تم البيع عبر هذه الشركة'}</span>
                            ) : null}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {offersProperty && offersProperty.status !== 'SOLD' && offers.length > 0 && (
              <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between gap-3">
                <div className="text-xs text-gray-600 dark:text-gray-300">
                  {t('individualProperties.messages.chooseWinningOffer') || 'اختر الشركة التي تم البيع من خلالها ثم اضغط تأكيد.'}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setOffersModalOpen(false);
                      setOffersProperty(null);
                    }}
                    className="px-3 py-1.5 rounded-md border border-gray-300 dark:border-gray-600 text-xs text-gray-800 dark:text-gray-200"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="button"
                    disabled={!selectedOfferIdForSold}
                    onClick={() => {
                      if (!offersProperty || !selectedOfferIdForSold) return;
                      onMarkSold(offersProperty, selectedOfferIdForSold);
                    }}
                    className="px-3 py-1.5 rounded-md bg-yellow-500 text-white text-xs disabled:opacity-50"
                  >
                    {offersProperty.purpose?.toLowerCase() === 'rent' ? t('individualProperties.actions.markRented', { defaultValue: 'تحديد كمؤجر' }) : t('individualProperties.actions.markSold')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
