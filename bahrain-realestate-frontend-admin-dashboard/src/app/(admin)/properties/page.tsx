
'use client';

// Helper: حساب الوقت المتبقي من expiresAt
const getRemainingTimeFromExpiresAt = (expiresAt?: string) => {
  if (!expiresAt) return undefined;
  const expires = new Date(expiresAt).getTime();
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

import { useState, useEffect, useRef } from 'react';
import { getProperties, updatePropertyStatus, deleteProperty, getPropertyById, updatePropertyFeatured, updatePropertyExpiry, updatePropertyDetails, Property, ApiError, getApprovedCompanies } from '@/lib/api/adminApi';
import CountdownTimer from '@/components/ui/CountdownTimer';
// ...existing code...
import { useLanguage } from '@/contexts/LanguageContext';

const governorates = ['All', 'Capital Governorate', 'Muharraq Governorate', 'Northern Governorate', 'Southern Governorate'];
const purposes = ['All', 'Sale', 'Rent'];
const statuses = ['All', 'Active', 'Pending', 'Rejected', 'Sold', 'Rented'];
const propertyTypes = ['All', 'apartments', 'villas_houses', 'lands', 'buildings', 'offices', 'studio', 'shops', 'warehouses', 'labor_accommodation', 'commercial_complexes', 'chalets', 'traditional_houses', 'farms', 'halls', 'under_construction', 'camps', 'misc'];

export default function PropertiesPage() {
  // State for duration/expiry controls per property (MUST be inside component)

  const { t, language, direction } = useLanguage();

  // Ref لضبط موضع بداية الـ scroll الأفقي حسب اتجاه الواجهة
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // Helper to format remaining time (localized, no hardcoded Arabic)
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
  const [properties, setProperties] = useState<Property[]>([]);
  const [areasByGovernorate, setAreasByGovernorate] = useState<Record<string, string[]>>({});
  const [governorateAreas, setGovernorateAreas] = useState<Record<number, { id: number; name: string; nameAr: string; governorateId: number }[]>>({});
  const [governorateNameToId, setGovernorateNameToId] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    message: string;
    onConfirm: () => void;
  }>({ open: false, message: '', onConfirm: () => {} });

  const openConfirm = (message: string, onConfirm: () => void) => {
    setConfirmState({ open: true, message, onConfirm });
  };

  const closeConfirm = () => {
    setConfirmState((prev) => ({ ...prev, open: false }));
  };

  // Translation helper functions
  const translateGovernorate = (governorate: string) => {
    const key = `properties.governorates.${governorate}`;
    const translated = t(key);
    return translated !== key ? translated : governorate;
  };

  const translatePropertyType = (type: string) => {
    const key = `properties.types.${type}`;
    const translated = t(key);
    return translated !== key ? translated : type;
  };

  const translateUserRole = (role: string) => {
    if (role === 'OWNER') return t('properties.userRoles.owner');
    if (role === 'AGENT') return t('properties.userRoles.agent');
    if (role === 'COMPANY') return t('properties.userRoles.company');
    return role;
  };

  const translateArea = (area: string) => {
    // حاول استخدام خريطة المناطق المحمّلة من الـ API لإظهار الاسم العربي حتى لو لم يكن هناك مفتاح ترجمة
    if (area && Object.keys(governorateAreas).length > 0) {
      for (const govId of Object.keys(governorateAreas)) {
        const govIdNum = parseInt(govId, 10);
        const areas = governorateAreas[govIdNum] || [];
        const found = areas.find((a) => a.name === area);
        if (found) {
          if (language === 'ar' && found.nameAr) return found.nameAr;
          if (!language || language === 'en') return found.name || area;
        }
      }
    }

    const key = `properties.areas.${area}`;
    const translated = t(key);
    return translated !== key ? translated : area;
  };

  const getCurrentFilters = () => {
    const filters: any = {};
    if (selectedGovernorate !== 'All') filters.governorate = selectedGovernorate;
    if (selectedPurpose !== 'All') filters.purpose = selectedPurpose;
    if (selectedStatus !== 'All') filters.status = selectedStatus;
    if (selectedType !== 'All') filters.type = selectedType;
    if (dateFrom) filters.dateFrom = dateFrom;
    if (dateTo) filters.dateTo = dateTo;
    if (selectedCompany !== 'All') filters.company = selectedCompany;
    return filters;
  };

  const [currentPage, setCurrentPage] = useState(1);
  const [selectedGovernorate, setSelectedGovernorate] = useState('All');
  const [selectedPurpose, setSelectedPurpose] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedType, setSelectedType] = useState('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('All');
  const [companies, setCompanies] = useState<any[]>([]);
  const [selectedProperties, setSelectedProperties] = useState<number[]>([]);
  const [editingDurations, setEditingDurations] = useState<Record<number, string>>({});
  const [savingDurationIds, setSavingDurationIds] = useState<number[]>([]);
  
  // Duration Modal State
  const [showDurationModal, setShowDurationModal] = useState(false);
  const [durationData, setDurationData] = useState({ days: 0, hours: 0, minutes: 0 });
  const [selectedPropertyForDuration, setSelectedPropertyForDuration] = useState<Property | null>(null);

  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);

  const [previewProperty, setPreviewProperty] = useState<Property | null>(null);
  const [previewImageIndex, setPreviewImageIndex] = useState(0);
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [dataVersion, setDataVersion] = useState(0);
  
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
    limit: 20
  });

  // ضبط نقطة البداية للـ scroll الأفقي فقط (بدون لمس العمودي نهائياً)
  // العربية: نبدأ من اليمين
  // الإنجليزية: نبدأ من اليسار
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
  }, [language, dataVersion]);

  // Load approved companies for company filter
  useEffect(() => {
    const loadCompanies = async () => {
      try {
        const resp: any = await getApprovedCompanies(undefined, 1, 200);
        const list = resp?.data?.companies ?? resp?.data ?? resp?.data?.data ?? [];
        if (Array.isArray(list)) {
          setCompanies(list);
        } else {
          setCompanies([]);
        }
      } catch (e) {
        setCompanies([]);
      }
    };

    loadCompanies();
  }, []);

  const handleOpenDurationModal = (property: Property) => {
    setSelectedPropertyForDuration(property);
    setDurationData({ days: 0, hours: 0, minutes: 0 });
    setShowDurationModal(true);
  };

  const handleSaveDuration = async () => {
    if (!selectedPropertyForDuration) return;
    try {
      if (durationData.days === 0 && durationData.hours === 0 && durationData.minutes === 0) {
        alert('Please enter a duration');
        return;
      }
      await updatePropertyExpiry(selectedPropertyForDuration.id, durationData.days, durationData.hours, durationData.minutes);
      setShowDurationModal(false);
      fetchProperties(currentPage, getCurrentFilters());
    } catch (err) {
      alert('Failed to update duration');
    }
  };

  const fetchProperties = async (
    page: number = 1,
    filters: {
      governorate?: string;
      purpose?: string;
      status?: string;
      type?: string;
      dateFrom?: string;
      dateTo?: string;
      company?: string;
    } = {},
    limit: number = pagination.limit
  ) => {
    try {
      setIsLoading(true);
      setError(null);
      const params: Record<string, any> = {
        page: page.toString(),
        limit: limit.toString(),
        sort: sortOrder
      };
      if (filters.governorate) params.governorate = filters.governorate;
      if (filters.purpose) params.purpose = filters.purpose.toLowerCase();
      if (filters.status) params.status = filters.status.toLowerCase();
      if (filters.type) params.type = filters.type;
      if (filters.dateFrom) params.dateFrom = filters.dateFrom;
      if (filters.dateTo) params.dateTo = filters.dateTo;
      if (filters.company) params.company = filters.company;
      const response = await getProperties(params) as any;
      
      if (response.success && response.data && Array.isArray(response.data.properties)) {
        const list = response.data.properties as Property[];
        setProperties(list);

        // زِد رقم نسخة البيانات بحيث يُعاد ضبط السكول الأفقي بعد كل تحميل جديد
        setDataVersion((prev) => prev + 1);

        // لو نافذة المعاينة مفتوحة، حدّث بيانات العقار المعروض بعد أي تحميل جديد
        if (previewProperty) {
          const updated = list.find((p) => p.id === previewProperty.id);
          if (updated) {
            setPreviewProperty(updated);
          }
        }

        // Build areas list per governorate from current properties
        const map: Record<string, Set<string>> = {};
        list.forEach((p) => {
          const gov = p.governorate;
          const area = p.area;
          if (!gov || !area) return;
          if (!map[gov]) map[gov] = new Set<string>();
          map[gov].add(String(area));
        });
        const normalized: Record<string, string[]> = {};
        Object.keys(map).forEach((gov) => {
          normalized[gov] = Array.from(map[gov]).sort();
        });
        setAreasByGovernorate(normalized);
        
        if (response.data.pagination) {
          setPagination({
            page: response.data.pagination.currentPage || 1,
            totalPages: response.data.pagination.totalPages || 1,
            total: response.data.pagination.totalCount || 0,
            limit: response.data.pagination.limit || limit
          });
        }
      } else {
        setProperties([]);
      }
      setCurrentPage(page);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to load properties');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchProperties(currentPage, getCurrentFilters());
  };

  useEffect(() => {
    fetchProperties(1, getCurrentFilters());
  }, [sortOrder]);

  // Load full governorates/areas map once for rich area dropdowns
  useEffect(() => {
    const loadGovernoratesAndAreas = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        // 1) Get all governorates with their areas (using fetch instead of axios)
        const res = await fetch(`${baseUrl}/api/public/governorates`);
        if (!res.ok) return;
        const data = await res.json();
        if (data?.success && Array.isArray(data.data)) {
          const govs = data.data as Array<{
            id: number;
            name?: string;
            nameEn?: string;
            nameAr?: string;
            areas?: Array<{ id: number; name: string; nameEn?: string; nameAr?: string; governorateId: number }>;
          }>;

          const areaMap: Record<number, { id: number; name: string; nameAr: string; governorateId: number }[]> = {};
          const nameToId: Record<string, number> = {};

          govs.forEach((g) => {
            const areas = Array.isArray(g.areas) ? g.areas : [];
            if (areas.length) {
              areaMap[g.id] = areas.map((a) => ({
                id: a.id,
                name: a.nameEn || a.name || '',
                nameAr: a.nameAr || a.name || '',
                governorateId: a.governorateId,
              }));
            }

            // اربط كل أسماء المحافظة (عربي/إنجليزي) بالـ ID الخاص بها
            const possibleNames = [g.nameEn, g.name, g.nameAr].filter((n): n is string => !!n);
            possibleNames.forEach((n) => {
              nameToId[n] = g.id;
            });
          });

          setGovernorateAreas(areaMap);
          setGovernorateNameToId(nameToId);
        }
      } catch (e) {
        // في حال فشل تحميل القائمة الكاملة، نستمر باستخدام القائمة المبنية من العقارات فقط
      }
    };

    loadGovernoratesAndAreas();
  }, []);

  useEffect(() => {
    if (!previewProperty) return;
    setPreviewImageIndex(0);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPreviewProperty(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [previewProperty]);

  // Handle filter changes
  const handleFilterChange = (filterType: string, value: string) => {
    let newFilters: any = {};
    
    switch (filterType) {
      case 'governorate':
        setSelectedGovernorate(value);
        newFilters.governorate = value !== 'All' ? value : undefined;
        break;
      case 'purpose':
        setSelectedPurpose(value);
        newFilters.purpose = value !== 'All' ? value : undefined;
        break;
      case 'status':
        setSelectedStatus(value);
        newFilters.status = value !== 'All' ? value : undefined;
        break;
      case 'type':
        setSelectedType(value);
        newFilters.type = value !== 'All' ? value : undefined;
        break;
      case 'company':
        setSelectedCompany(value);
        newFilters.company = value !== 'All' ? value : undefined;
        break;
      case 'dateFrom':
        setDateFrom(value);
        newFilters.dateFrom = value || undefined;
        break;
      case 'dateTo':
        setDateTo(value);
        newFilters.dateTo = value || undefined;
        break;
    }

    // Include current filter values
    if (selectedGovernorate !== 'All' && filterType !== 'governorate') {
      newFilters.governorate = selectedGovernorate;
    }
    if (selectedPurpose !== 'All' && filterType !== 'purpose') {
      newFilters.purpose = selectedPurpose;
    }
    if (selectedStatus !== 'All' && filterType !== 'status') {
      newFilters.status = selectedStatus;
    }
    if (selectedType !== 'All' && filterType !== 'type') {
      newFilters.type = selectedType;
    }
    if (selectedCompany !== 'All' && filterType !== 'company') {
      newFilters.company = selectedCompany;
    }
    if (dateFrom && filterType !== 'dateFrom') {
      newFilters.dateFrom = dateFrom;
    }
    if (dateTo && filterType !== 'dateTo') {
      newFilters.dateTo = dateTo;
    }
    
    fetchProperties(1, newFilters);
  };

  const handleApprove = async (id: number) => {
    openConfirm(t('properties.messages.confirmApprove'), async () => {
      try {
        // عند الموافقة من الجدول: فعل العقار لمدة شهر افتراضيًا
        await updatePropertyStatus(id, 'active', 30);
        fetchProperties(currentPage, getCurrentFilters());
      } catch (err: any) {
        alert(err.message || 'Failed to approve property');
      }
    });
  };

  const handleReject = async (id: number) => {
    openConfirm(t('properties.messages.confirmReject'), async () => {
      try {
        await updatePropertyStatus(id, 'rejected');
        fetchProperties(currentPage, getCurrentFilters());
      } catch (err: any) {
        alert(err.message || 'Failed to reject property');
      }
    });
  };

  const handleDelete = async (id: number) => {
    openConfirm(t('properties.messages.confirmDelete'), async () => {
      try {
        await deleteProperty(id);
        fetchProperties(currentPage, getCurrentFilters());
      } catch (err: any) {
        alert(err.message || 'Failed to delete property');
      }
    });
  };

  // Bulk actions
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      // Only select properties with positive IDs (real properties, not individual offers)
      setSelectedProperties(properties.filter(p => p.id > 0).map(p => p.id));
    } else {
      setSelectedProperties([]);
    }
  };

  const handleSelectProperty = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedProperties([...selectedProperties, id]);
    } else {
      setSelectedProperties(selectedProperties.filter(pId => pId !== id));
    }
  };

  const handleBulkApprove = async () => {
    if (selectedProperties.length === 0) return;
    if (!confirm(t('properties.messages.confirmBulkApprove').replace('{count}', selectedProperties.length.toString()))) return;
    
    setBulkActionLoading(true);
    try {
      for (const id of selectedProperties) {
        // الموافقة الجماعية: تفعيل كل عقار لمدة شهر افتراضيًا
        await updatePropertyStatus(id, 'active', 30);
      }
      setSelectedProperties([]);
      fetchProperties(currentPage, getCurrentFilters());
      alert(t('properties.messages.approveSuccess'));
    } catch (err: any) {
      alert(err.message || t('properties.messages.approveFail'));
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkReject = async () => {
    if (selectedProperties.length === 0) return;
    if (!confirm(t('properties.messages.confirmBulkReject').replace('{count}', selectedProperties.length.toString()))) return;
    
    setBulkActionLoading(true);
    try {
      for (const id of selectedProperties) {
        await updatePropertyStatus(id, 'rejected');
      }
      setSelectedProperties([]);
      fetchProperties(currentPage, getCurrentFilters());
      alert(t('properties.messages.rejectSuccess'));
    } catch (err: any) {
      alert(err.message || t('properties.messages.rejectFail'));
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedProperties.length === 0) return;
    if (!confirm(t('properties.messages.confirmBulkDelete').replace('{count}', selectedProperties.length.toString()))) return;
    
    setBulkActionLoading(true);
    try {
      for (const id of selectedProperties) {
        await deleteProperty(id);
      }
      setSelectedProperties([]);
      fetchProperties(currentPage, getCurrentFilters());
      alert(t('properties.messages.bulkDeleteSuccess'));
    } catch (err: any) {
      alert(err.message || t('properties.messages.bulkDeleteFail'));
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleToggleFeatured = async (id: number, currentStatus: boolean) => {
    try {
      await updatePropertyFeatured(id, !currentStatus, undefined);
      fetchProperties(currentPage, getCurrentFilters());
    } catch (err: any) {
      alert(err.message || t('properties.messages.featureFail'));
    }
  };

  const handleToggleFeaturedPlus = async (id: number, currentStatus: boolean) => {
    try {
      await updatePropertyFeatured(id, undefined, !currentStatus);
      fetchProperties(currentPage, getCurrentFilters());
    } catch (err: any) {
      alert(err.message || t('properties.messages.featureFail'));
    }
  };

  // Property editing
  const handleEditProperty = (property: Property) => {
    setEditingProperty(property);
    setShowEditModal(true);
  };

  const handleSaveProperty = async (updatedProperty: any) => {
    try {
      if (!updatedProperty || !updatedProperty.id) return;

      const payload = {
        title: updatedProperty.title,
        price: Number(updatedProperty.price) || 0,
        purpose: String(updatedProperty.purpose || '').toLowerCase() === 'rent' ? 'rent' : 'sale',
        type: updatedProperty.type,
        governorate: updatedProperty.governorate,
        area: updatedProperty.area,
        bedrooms: updatedProperty.bedrooms ?? null,
        bathrooms: updatedProperty.bathrooms ?? null,
        description: updatedProperty.description,
      };

      await updatePropertyDetails(updatedProperty.id, payload);
      setShowEditModal(false);
      setEditingProperty(null);
      fetchProperties(currentPage, getCurrentFilters());
      alert(t('properties.messages.updateSuccess'));
    } catch (err: any) {
      alert(err.message || t('properties.messages.updateFail'));
    }
  };

  const handleActivateFromModal = async () => {
    if (!editingProperty) return;
    openConfirm(t('properties.messages.confirmActivate'), async () => {
      try {
        // التفعيل من داخل نموذج التعديل: شهر افتراضيًا عند الضغط على "تفعيل"
        await updatePropertyStatus(editingProperty.id, 'active', 30);
        setShowEditModal(false);
        setEditingProperty(null);
        fetchProperties(currentPage, getCurrentFilters());
        alert('تم تفعيل العقار بنجاح');
      } catch (err: any) {
        alert(err.message || 'فشل تفعيل العقار');
      }
    });
  };

  const formatPrice = (price: number, purpose: string) => {
    // Handle case-insensitive "sale" check
    const isSale = purpose?.toLowerCase() === 'sale';
    const currency = isSale ? t('common.currency') : `${t('common.currency')}${t('common.perMonth')}`;
    return `${currency} ${price.toLocaleString()}`;
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-2 py-1 text-xs font-medium rounded-full uppercase tracking-wider";
    const statusLower = status?.toLowerCase() || '';
    
    switch (statusLower) {
      case 'active':
      case 'available':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'pending':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'inactive':
      case 'rejected':
      case 'blocked':
        return `${baseClasses} bg-red-100 text-red-800`;
      case 'sold':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case 'rented':
        return `${baseClasses} bg-indigo-100 text-indigo-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };
  const handleExportProperties = () => {
    if (!Array.isArray(properties) || !properties.length) return;
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + "ID,Title,Company,Purpose,Type,Price,Governorate,Area,Status,Created At\n"
      + properties.map(property => 
          `"${property.id}","${property.title}","${property.company?.name || 'N/A'}","${property.purpose}","${property.type}","${property.price}","${property.governorate}","${property.area}","${property.status}","${new Date(property.createdAt).toLocaleDateString()}"`
        ).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `properties_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getImageUrl = (imagePath: string) => {
    if (!imagePath) return '';
    if (imagePath.startsWith('http')) return imagePath;
    // Ensure we're pointing to the backend server
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    // Remove leading slash if present
    const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
    return `${baseUrl}/${cleanPath}`;
  };

  const openPreview = async (property: Property) => {
    setPreviewProperty(property);
    setPreviewImageIndex(0);

    if (property.id > 0) {
      try {
        const res: any = await getPropertyById(property.id);
        if (res?.success && res?.data) {
          setPreviewProperty(res.data as Property);
        }
      } catch {
        // keep existing preview data
      }
    }
  };

  const isVideoFile = (value: string) => /\.(mp4|mov|webm|mkv)(\?.*)?$/i.test(value);

  const getPropertyThumbnail = (p: Property) => {
     // 1. Try robust propertyImages (skip videos)
     const validImgObj = p.propertyImages?.find((pi) => !pi.isVideo && !isVideoFile(pi.imageUrl));
     if (validImgObj) return validImgObj.imageUrl;
     
     // 2. Try images array (skip videos)
     const validImgStr = p.images?.find((img) => !isVideoFile(img));
     if (validImgStr) return validImgStr;
     
     return null; 
  };

  const getPropertyHasVideo = (p: Property) => {
      return (p.propertyImages?.some((pi) => pi.isVideo || isVideoFile(pi.imageUrl)))
             || (p.images?.some((img) => isVideoFile(img)))
             || !!p.videoUrl;
  };
  
  // Get images and videos from propertyImages (new system) - prioritize this
  const propertyImages = previewProperty?.propertyImages || [];
  
  // Robust filtering: Check BOTH the flag AND the file extension
  const newImages = propertyImages
    .filter((pi) => !pi.isVideo && !isVideoFile(pi.imageUrl))
    .map((pi) => pi.imageUrl);
    
  const newVideos = propertyImages
    .filter((pi) => pi.isVideo || isVideoFile(pi.imageUrl))
    .map((pi) => pi.imageUrl);
  
  // 🔍 DEBUG: Log what we receive from API
  return (
    <div className="max-w-[1600px] mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
         <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
          {t('properties.title')}
        </h1>
         <div className="flex items-center gap-2">
            <button
               onClick={handleExportProperties}
               disabled={!properties.length}
               className="inline-flex items-center px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
             >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
               Export
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

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 uppercase tracking-wider flex items-center gap-2">
           <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
           {t('properties.filters.title')}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Governorate Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
              {t('properties.filters.governorate')}
            </label>
            <select
              value={selectedGovernorate}
              onChange={(e) => handleFilterChange('governorate', e.target.value)}
              className="block w-full rounded-lg border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 py-2.5 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 transition-colors"
            >
              {governorates.map(gov => (
                <option key={gov} value={gov}>{gov === 'All' ? t('properties.filters.all') : translateGovernorate(gov)}</option>
              ))}
            </select>
          </div>

          {/* Purpose Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
              {t('properties.filters.purpose')}
            </label>
            <select
              value={selectedPurpose}
              onChange={(e) => handleFilterChange('purpose', e.target.value)}
              className="block w-full rounded-lg border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 py-2.5 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 transition-colors"
            >
              {purposes.map(purpose => (
                <option key={purpose} value={purpose}>{purpose === 'All' ? t('properties.filters.all') : t(`properties.purposes.${purpose.toLowerCase()}`)}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
              {t('properties.filters.status')}
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="block w-full rounded-lg border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 py-2.5 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 transition-colors"
            >
              {statuses.map(status => (
                <option key={status} value={status}>{status === 'All' ? t('properties.filters.all') : t(`properties.status.${status.toLowerCase()}`)}</option>
              ))}
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
              {t('properties.filters.type')}
            </label>
            <select
              value={selectedType}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              className="block w-full rounded-lg border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 py-2.5 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 transition-colors"
            >
              {propertyTypes.map(type => (
                <option key={type} value={type}>{type === 'All' ? t('properties.filters.allTypes') : translatePropertyType(type)}</option>
              ))}
            </select>
          </div>

          {/* Date From */}
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
              {t('properties.filters.dateFrom')}
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              className="block w-full rounded-lg border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 py-2.5 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 transition-colors"
            />
          </div>

          {/* Date To */}
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
              {t('properties.filters.dateTo')}
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              className="block w-full rounded-lg border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 py-2.5 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 transition-colors"
            />
          </div>

          {/* Company Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
              {t('properties.filters.company')}
            </label>
            <select
              value={selectedCompany}
              onChange={(e) => handleFilterChange('company', e.target.value)}
              className="block w-full rounded-lg border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 py-2.5 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 transition-colors"
            >
              <option value="All">{t('properties.filters.allCompanies')}</option>
              {companies.map(company => (
                <option key={company.id} value={company.id}>{company.name}</option>
              ))}
            </select>
          </div>

          {/* Sort Order */}
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
              {t('properties.filters.sort')}
            </label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
              className="block w-full rounded-lg border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 py-2.5 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 transition-colors"
            >
              <option value="desc">{t('properties.filters.newest')}</option>
              <option value="asc">{t('properties.filters.oldest')}</option>
            </select>
          </div>

          {/* Clear Filters */}
          <div className="flex items-end">
            <button
              onClick={() => {
                setSelectedGovernorate('All');
                setSelectedPurpose('All');
                setSelectedStatus('All');
                setSelectedType('All');
                setDateFrom('');
                setDateTo('');
                setSelectedCompany('All');
                setSortOrder('desc');
                fetchProperties(1, {});
              }}
              className="w-full px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium text-sm rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              {t('properties.filters.clear')}
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedProperties.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/40 dark:to-indigo-900/40 rounded-xl border border-blue-100 dark:border-blue-800 p-4 shadow-sm animate-fade-in-up">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-200 font-bold text-sm">
                {selectedProperties.length}
              </span>
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                {t('properties.actions.selectedCount').replace('{count}', '')}
              </span>
              <button
                onClick={() => setSelectedProperties([])}
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium hover:underline"
              >
                {t('properties.actions.clearSelection')}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleBulkApprove}
                disabled={bulkActionLoading}
                className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 transition-colors shadow-sm"
              >
                {bulkActionLoading ? t('properties.actions.approving') : t('properties.actions.bulkApprove')}
              </button>
              <button
                onClick={handleBulkReject}
                disabled={bulkActionLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {bulkActionLoading ? t('properties.actions.rejecting') : t('properties.actions.bulkReject')}
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={bulkActionLoading}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {bulkActionLoading ? t('properties.actions.deleting') : t('properties.actions.bulkDelete')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      {!isLoading && !error && properties.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl transition-transform hover:scale-105 duration-200 cursor-default">
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{pagination.total}</div>
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('properties.stats.total')}</div>
            </div>
            <div className="flex flex-col items-center justify-center p-4 bg-green-50 dark:bg-green-900/10 rounded-xl transition-transform hover:scale-105 duration-200 cursor-default">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-1">
                {Array.isArray(properties)
                  ? properties.filter((p) => {
                      const status = String(p.status || '').toLowerCase();
                      const isExpired = (p as any).isExpired;
                      // Available = ACTIVE and not expired
                      return status === 'active' && !isExpired;
                    }).length
                  : 0}
              </div>
              <div className="text-sm font-medium text-green-600/70 dark:text-green-400/70">{t('properties.stats.available')}</div>
            </div>
            <div className="flex flex-col items-center justify-center p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl transition-transform hover:scale-105 duration-200 cursor-default">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                {Array.isArray(properties) ? properties.filter(p => (p.purpose || '').toLowerCase() === 'sale').length : 0}
              </div>
              <div className="text-sm font-medium text-blue-600/70 dark:text-blue-400/70">{t('properties.stats.sale')}</div>
            </div>
            <div className="flex flex-col items-center justify-center p-4 bg-purple-50 dark:bg-purple-900/10 rounded-xl transition-transform hover:scale-105 duration-200 cursor-default">
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-1">
                {Array.isArray(properties) ? properties.filter(p => (p.purpose || '').toLowerCase() === 'rent').length : 0}
              </div>
              <div className="text-sm font-medium text-purple-600/70 dark:text-purple-400/70">{t('properties.stats.rent')}</div>
            </div>
          </div>
        </div>
      )}

      {/* global duration setting removed per request */}

      {/* Properties Table */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
        {/* Outer container: vertical scroll; dir controls scrollbar side */}
        <div
          className="h-[70vh] overflow-y-auto"
        >
          {/* Inner container: horizontal scroll only, always LTR */}
          <div
            ref={scrollContainerRef}
            className="min-w-full h-full overflow-x-auto"
            dir="ltr"
          >
            <table dir={direction} className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th scope="col" className="px-4 py-3 text-start">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedProperties.length === properties.length && properties.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedProperties(properties.map(p => p.id));
                        } else {
                          setSelectedProperties([]);
                        }
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:ring-offset-gray-800"
                    />
                  </div>
                </th>
                <th scope="col" className="px-4 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                  {t('properties.table.image')}
                </th>
                <th scope="col" className="px-4 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                  {t('properties.table.id')}
                </th>
                <th scope="col" className="px-4 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                  {t('properties.table.title')}
                </th>
                <th scope="col" className="px-4 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                  {t('properties.table.company')}
                </th>
                <th scope="col" className="px-4 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                  {t('properties.table.purpose')}
                </th>
                <th scope="col" className="px-4 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                  {t('properties.table.type')}
                </th>
                <th scope="col" className="px-4 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                  {t('properties.table.featured')}
                </th>
                <th scope="col" className="px-4 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                  {t('properties.table.featuredPlus')}
                </th>
                <th scope="col" className="px-4 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                  {t('properties.table.price')}
                </th>
                <th scope="col" className="px-4 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                  {t('properties.table.location')}
                </th>
                <th scope="col" className="px-4 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                  الوقت المتبقي
                </th>
                <th scope="col" className="px-4 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                  {t('properties.table.status')}
                </th>
                <th scope="col" className="px-4 py-3 text-end text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                  {t('properties.table.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {isLoading ? (
                // Loading skeleton
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index} className="animate-pulse border-b dark:border-gray-700 last:border-0">
                    {Array.from({ length: 14 }).map((_, colIndex) => (
                      <td key={colIndex} className="px-4 py-4 whitespace-nowrap">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full min-w-[3rem]"></div>
                      </td>
                    ))}
                  </tr>
                ))
              ) : (Array.isArray(properties) ? properties.map((property, index) => (
                <tr key={property.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors border-b dark:border-gray-700 last:border-0">
                  <td className="px-4 py-4 whitespace-nowrap">
                    {property.id > 0 && (
                      <input
                        type="checkbox"
                        checked={selectedProperties.includes(property.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedProperties([...selectedProperties, property.id]);
                          } else {
                            setSelectedProperties(selectedProperties.filter(id => id !== property.id));
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:ring-offset-gray-800"
                      />
                    )}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex flex-col items-center gap-1">
                      {getPropertyThumbnail(property) ? (
                        <button
                          type="button"
                          onClick={() => openPreview(property)}
                          className="h-10 w-10 rounded-lg overflow-hidden ring-1 ring-gray-200 dark:ring-gray-700"
                          title={t('common.preview')}
                        >
                          <img
                            src={getImageUrl(getPropertyThumbnail(property)!)}
                            alt={property.title}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              // Fallback if image fails to load
                              (e.target as HTMLImageElement).style.display = 'none';
                              (e.target as HTMLImageElement).parentElement?.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => openPreview(property)}
                        className={`h-10 w-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-400 ${getPropertyThumbnail(property) ? 'hidden' : ''} ring-1 ring-gray-200 dark:ring-gray-600`}
                        title={getPropertyHasVideo(property) ? "Video Preview" : "No Image"}
                      >
                         {getPropertyHasVideo(property) ? (
                          <svg className="h-5 w-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        ) : (
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    <span className="font-mono">{property.id}</span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white max-w-xs truncate">
                    {property.title || (language === 'ar' ? 'بدون عنوان' : 'No title')}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                    {property.company?.name || 'N/A'}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                    {t(`properties.purposes.${property.purpose?.toLowerCase()}`) || property.purpose}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                    {translatePropertyType(property.type)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleToggleFeatured(property.id, !!property.isFeatured)}
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${
                        property.isFeatured 
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' 
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {property.isFeatured ? t('common.yes') : t('common.no')}
                    </button>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleToggleFeaturedPlus(property.id, !!property.isFeaturedPlus)}
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${
                        property.isFeaturedPlus 
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' 
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {property.isFeaturedPlus ? t('common.yes') : t('common.no')}
                    </button>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white">
                    {formatPrice(property.price, property.purpose || 'Sale')}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-900 dark:text-white text-xs">{translateGovernorate(property.governorate)}</span>
                      <span className="text-xs">{translateArea(property.area)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm">
                    <div className="flex flex-col items-center gap-1">
                      {property.status?.toLowerCase() === 'rejected' ? (
                            <span className="text-gray-400 text-xs text-center">
                              {t('properties.duration.notAvailableForRejected')}
                            </span>
                         ) : ['sold', 'rented'].includes(property.status?.toLowerCase() || '') ? (
                            <span className="text-gray-400 text-xs text-center">
                              {t('properties.duration.notAvailableForSoldOrRented')}
                            </span>
                         ) : property.status?.toLowerCase() === 'pending' ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300 text-center">
                              {t('properties.duration.pausedForPending')}
                            </span>
                         ) : property.isExpired ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                              {t('properties.duration.expired', 'Expired')}
                            </span>
                         ) : (
                            property.expiresAt ? (
                                <div className="text-xs font-mono bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-800">
                                  <CountdownTimer 
                                      targetDate={property.expiresAt} 
                                      onExpire={() => handleRefresh()}
                                      showSeconds={true}
                                  />
                                </div>
                            ) : (
                              <span className="text-gray-400 text-xs">{t('properties.duration.notSet', 'Not set')}</span>
                            )
                         )}
                      {property.id > 0 && !['sold', 'rented'].includes(property.status?.toLowerCase() || '') && (
                        <button
                          onClick={() => handleOpenDurationModal(property)}
                          className="p-1 text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
                          title={property.isExpired
                            ? (property.status?.toLowerCase() === 'rejected'
                                ? t('properties.duration.set')
                                : t('properties.duration.renew'))
                            : property.status?.toLowerCase() === 'active'
                              ? t('properties.duration.edit')
                              : t('properties.duration.set')}
                        >
                          <span className="text-[10px] underline">
                            {property.isExpired
                              ? (property.status?.toLowerCase() === 'rejected'
                                  ? t('properties.duration.set')
                                  : t('properties.duration.renew'))
                              : property.status?.toLowerCase() === 'active'
                                ? t('properties.duration.edit')
                                : t('properties.duration.set')}
                          </span>
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    {(() => {
                      const originalStatus = property.status;
                      const normalizedStatus = originalStatus?.toLowerCase();
                      const displayStatus = property.isExpired && normalizedStatus === 'active'
                        ? 'pending'
                        : originalStatus;

                      return (
                        <span className={getStatusBadge(displayStatus)}>
                          {t(`properties.status.${displayStatus?.toLowerCase()}`) || displayStatus}
                        </span>
                      );
                    })()}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-end text-sm font-medium">
                    {property.id > 0 ? (
                      <div className="flex items-center justify-end space-x-2">
                       <button 
                        onClick={() => handleEditProperty(property)}
                        className="text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors bg-gray-50 dark:bg-gray-700/50 p-1.5 rounded-lg border border-gray-200 dark:border-gray-600"
                        title={t('properties.actions.edit')}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button 
                        onClick={() => handleApprove(property.id)}
                        className="text-gray-500 hover:text-green-600 dark:text-gray-400 dark:hover:text-green-400 transition-colors bg-gray-50 dark:bg-gray-700/50 p-1.5 rounded-lg border border-gray-200 dark:border-gray-600"
                        title={t('properties.actions.approve')}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                      <button 
                        onClick={() => handleReject(property.id)}
                        className="text-gray-500 hover:text-yellow-600 dark:text-gray-400 dark:hover:text-yellow-400 transition-colors bg-gray-50 dark:bg-gray-700/50 p-1.5 rounded-lg border border-gray-200 dark:border-gray-600"
                        title={t('properties.actions.reject')}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                      </button>
                      <button 
                        onClick={() => handleDelete(property.id)}
                        className="text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors bg-gray-50 dark:bg-gray-700/50 p-1.5 rounded-lg border border-gray-200 dark:border-gray-600"
                        title={t('properties.actions.delete')}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                    ) : (
                      <span className="text-xs text-gray-400">
                        {language === 'ar' ? 'عرض أفراد' : 'View individuals'}
                      </span>
                    )}
                  </td>
                </tr>
              )) : [])}
            </tbody>
          </table>
        </div>
        {/* Close outer vertical scroll container */}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          <button 
            onClick={handleExportProperties}
            disabled={!Array.isArray(properties) || !properties.length}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {t('properties.actions.export')}
          </button>
          <button
            onClick={handleRefresh}
            className="flex items-center px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {t('properties.actions.refresh')}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.98-.833-2.75 0L3.064 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">{t('properties.errors.loading')}</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{error}</p>
            <button 
              onClick={() => fetchProperties(1, getCurrentFilters())}
              className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {t('properties.errors.tryAgain')}
            </button>
          </div>
        )}

        {/* No Results Message */}
        {!isLoading && !error && properties.length === 0 && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">{t('properties.errors.notFound')}</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t('properties.errors.notFoundHint')}</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {!isLoading && !error && properties.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Rows Per Page */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
                {language === 'ar' ? 'عدد العناصر:' : 'Items per page:'}
              </span>
              <select
                value={pagination.limit}
                onChange={(e) => {
                  const newLimit = parseInt(e.target.value);
                  setPagination(prev => ({ ...prev, limit: newLimit }));
                  fetchProperties(1, getCurrentFilters(), newLimit);
                }}
                className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-1.5"
                dir="ltr"
              >
                <option value={20}>20</option>
                <option value={40}>40</option>
                <option value={60}>60</option>
                <option value={100}>100</option>
              </select>
            </div>

            {/* Results Info */}
            <div className="text-sm text-gray-700 dark:text-gray-300">
             {t('pagination.showing')
                .replace('{from}', (((pagination.page - 1) * pagination.limit) + 1).toString())
                .replace('{to}', Math.min(pagination.page * pagination.limit, pagination.total).toString())
                .replace('{total}', pagination.total.toString())
              }
            </div>

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => fetchProperties(Math.max(currentPage - 1, 1), getCurrentFilters())}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300"
              >
                {t('pagination.previous')}
              </button>

              {/* Page Numbers */}
              <div className="flex items-center space-x-1">
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                  .filter(pageNum => 
                    pageNum === 1 || 
                    pageNum === pagination.totalPages || 
                    (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                  )
                  .map((pageNum, index, array) => {
                    const isGap = index > 0 && pageNum - array[index - 1] > 1;
                    return (
                        <div key={pageNum} className="flex">
                            {isGap && <span className="px-2 text-gray-500">...</span>}
                            <button
                                onClick={() => fetchProperties(pageNum, getCurrentFilters())}
                                className={`px-3 py-1 text-sm border rounded-md ${
                                currentPage === pageNum
                                    ? 'bg-blue-500 text-white border-blue-500'
                                    : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                                }`}
                            >
                                {pageNum}
                            </button>
                        </div>
                    );
                  })}
              </div>

              <button
                onClick={() => fetchProperties(Math.min(currentPage + 1, pagination.totalPages), getCurrentFilters())}
                disabled={currentPage === pagination.totalPages}
                className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300"
              >
                {t('pagination.next')}
              </button>
            </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Property Modal */}
      {showEditModal && editingProperty && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{t('properties.editProperty')}</h2>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingProperty(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault();
                handleSaveProperty(editingProperty);
              }} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('properties.title')}
                    </label>
                    <input
                      type="text"
                      value={editingProperty.title || ''}
                      onChange={(e) => setEditingProperty({...editingProperty, title: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('properties.table.price')}
                    </label>
                    <input
                      type="number"
                      value={editingProperty.price || ''}
                      onChange={(e) => setEditingProperty({...editingProperty, price: parseFloat(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                       {t('properties.table.purpose')}
                    </label>
                    <select
                      value={(editingProperty.purpose || '').toLowerCase()}
                      onChange={(e) => setEditingProperty({...editingProperty, purpose: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      required
                    >
                      <option value="sale">{t('properties.stats.sale')}</option>
                      <option value="rent">{t('properties.stats.rent')}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                       {t('properties.table.type')}
                    </label>
                    <select
                      value={editingProperty.type || ''}
                      onChange={(e) => setEditingProperty({...editingProperty, type: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      required
                    >
                      {propertyTypes.filter(type => type !== 'All').map(type => (
                        <option key={type} value={type}>{translatePropertyType(type)}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('properties.table.location')}
                    </label>
                    <select
                      value={editingProperty.governorate || ''}
                      onChange={(e) => setEditingProperty({
                        ...editingProperty,
                        governorate: e.target.value,
                        area: '',
                      })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      required
                    >
                      {governorates.filter(gov => gov !== 'All').map(gov => (
                        <option key={gov} value={gov}>{translateGovernorate(gov)}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {language === 'ar' ? 'المنطقة' : t('properties.area')}
                    </label>
                    {(() => {
                      const govName = editingProperty.governorate || '';

                      // حدد ID المحافظة الحالية من خلال اسمها (عربي/إنجليزي)
                      const govId = govName ? governorateNameToId[govName] ?? null : null;

                      let areaOptions: string[] = [];
                      const areaLabels: Record<string, string> = {};

                      if (govId != null && governorateAreas[govId]) {
                        // استخدم القائمة الكاملة من الـ API للمحافظة المحددة
                        const fullAreas = governorateAreas[govId];
                        areaOptions = fullAreas.map((a) => {
                          const value = a.name;
                          const label = language === 'ar'
                            ? (a.nameAr || translateArea(value))
                            : (a.name || translateArea(value));
                          if (value) {
                            areaLabels[value] = label;
                          }
                          return value;
                        });
                      } else {
                        // fallback: استخدم القائمة المبنية من العقارات الحالية في حال تعذّر الربط
                        const govKey = govName;
                        const baseAreas = areasByGovernorate[govKey] || [];
                        areaOptions = baseAreas;
                        baseAreas.forEach((value) => {
                          if (!value) return;
                          areaLabels[value] = translateArea(value);
                        });
                      }

                      const uniqueAreas = Array.from(
                        new Set(
                          [editingProperty.area, ...areaOptions]
                            .filter((a): a is string => !!a)
                            .map((a) => String(a))
                        )
                      );

                      return (
                        <select
                          value={editingProperty.area || ''}
                          onChange={(e) => setEditingProperty({ ...editingProperty, area: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          required
                        >
                          <option value="">
                            {language === 'ar' ? 'اختر المنطقة' : 'Select area'}
                          </option>
                          {uniqueAreas.map((area) => {
                            const label = areaLabels[area] || translateArea(area);
                            return (
                              <option key={area} value={area}>
                                {label}
                              </option>
                            );
                          })}
                        </select>
                      );
                    })()}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('properties.bedrooms')}
                    </label>
                    <input
                      type="number"
                      value={editingProperty.bedrooms || ''}
                      onChange={(e) => setEditingProperty({...editingProperty, bedrooms: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('properties.bathrooms')}
                    </label>
                    <input
                      type="number"
                      value={editingProperty.bathrooms || ''}
                      onChange={(e) => setEditingProperty({...editingProperty, bathrooms: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('properties.description')}
                    </label>
                    <textarea
                      value={editingProperty.description || ''}
                      onChange={(e) => setEditingProperty({...editingProperty, description: e.target.value})}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                </div>

                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingProperty(null);
                    }}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="button"
                    onClick={handleActivateFromModal}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
                  >
                    تفعيل
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                  >
                    {t('common.save')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Property Preview Modal */}
      {previewProperty && (
        <div
          className="fixed inset-0 z-50"
          role="dialog"
          aria-modal="true"
          aria-label="Property preview"
        >
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setPreviewProperty(null)}
          />

          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="w-full max-w-4xl bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden max-h-[85vh] flex flex-col">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-800">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {previewProperty.title || `Property #${previewProperty.id}`}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    ID: {previewProperty.id} • {translateGovernorate(previewProperty.governorate)} • {translateArea(previewProperty.area)}
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
                {/* Image */}
                <div className="p-5">
                  {(() => {
                    const activePreviewImage = newImages[previewImageIndex];
                    return (
                      <div className="aspect-[4/3] w-full rounded-lg bg-gray-100 dark:bg-gray-800 overflow-hidden">
                        {activePreviewImage ? (
                          <img
                            src={getImageUrl(activePreviewImage)}
                            alt={previewProperty.title}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                   {newImages.length > 1 && (
                    <div className="mt-3 flex gap-2 overflow-x-auto">
                      {newImages.map((img: string, idx: number) => (
                        <button
                          key={`${previewProperty.id}-img-${idx}`}  
                          type="button"
                          onClick={() => setPreviewImageIndex(idx)}
                          className={`h-14 w-14 rounded-md overflow-hidden border ${idx === previewImageIndex ? 'border-blue-500' : 'border-gray-200 dark:border-gray-700'} flex-shrink-0`}
                          aria-label={`Image ${idx + 1}`}
                        >
                          <img
                            src={getImageUrl(img)}
                            alt=""
                            className="h-full w-full object-contain bg-gray-100 dark:bg-gray-800"
                          />
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Videos Section - Always visible if videos exist */}
                  {newVideos.length > 0 && (
                    <div className="mt-6 pt-6 border-t-2 border-blue-500">
                      <div className="text-lg font-bold text-blue-600 dark:text-blue-400 mb-3 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                        {t('properties.videos')} ({newVideos.length})
                      </div>
                      
                      {/* Active Video */}
                      <div className="w-full h-64 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800 mb-3">
                        <video
                          src={getImageUrl(newVideos[activeVideoIndex] || newVideos[0])}
                          controls
                          className="w-full h-full object-contain bg-black"
                        />
                      </div>
                      
                      {/* Video Thumbnails */}
                      {newVideos.length > 1 && (
                        <div className="flex gap-2 overflow-x-auto">
                          {newVideos.map((vid, idx) => (
                            <button
                              key={`${previewProperty.id}-vid-${idx}`}
                              type="button"
                              onClick={() => setActiveVideoIndex(idx)}
                              className={`relative h-14 w-14 rounded-md overflow-hidden border ${idx === activeVideoIndex ? 'border-blue-500' : 'border-gray-200 dark:border-gray-700'} flex-shrink-0`}
                            >
                              <video
                                src={getImageUrl(vid)}
                                className="w-full h-full object-contain bg-black pointer-events-none"
                              />
                              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                                <div className="w-4 h-4 bg-white/80 rounded-full flex items-center justify-center">
                                  <svg className="w-2 h-2 text-gray-900 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M8 5v14l11-7z"/>
                                  </svg>
                                </div>
                              </div>
                              <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs px-1 text-center">
                                {idx + 1}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="p-5 border-t md:border-t-0 md:border-l border-gray-200 dark:border-gray-800">
                  <div className="space-y-4">
                    {/* Remaining Time prominently at top - only for active properties */}
                    {previewProperty.status?.toLowerCase() === 'active' && (
                      <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-4 bg-gray-50 dark:bg-gray-800/40 mb-2">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {t('properties.duration.remainingLabel', language === 'ar' ? 'الوقت المتبقي' : 'Remaining time')}
                          </div>
                          <div className={previewProperty.isExpired || (previewProperty.expiresAt && getRemainingTimeFromExpiresAt(previewProperty.expiresAt)?.days === 0 && getRemainingTimeFromExpiresAt(previewProperty.expiresAt)?.hours === 0 && getRemainingTimeFromExpiresAt(previewProperty.expiresAt)?.minutes === 0) ? 'text-red-600 font-bold' : 'text-gray-900 dark:text-white'}>
                            {(previewProperty.isExpired || (previewProperty.expiresAt && getRemainingTimeFromExpiresAt(previewProperty.expiresAt)?.days === 0 && getRemainingTimeFromExpiresAt(previewProperty.expiresAt)?.hours === 0 && getRemainingTimeFromExpiresAt(previewProperty.expiresAt)?.minutes === 0))
                              ? t('properties.duration.expired', 'Expired')
                              : formatRemainingTime(previewProperty.remainingTime || getRemainingTimeFromExpiresAt(previewProperty.expiresAt))}
                          </div>
                        </div>
                        {previewProperty.expiresAt && (
                          <div className="text-xs text-gray-500 mt-1">
                            {t('properties.duration.expiresAtLabel', language === 'ar' ? 'تاريخ الانتهاء:' : 'Expires at:')}{' '}
                            {new Date(previewProperty.expiresAt).toLocaleString(language === 'ar' ? 'ar-BH' : 'en-US')}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-4 bg-gray-50 dark:bg-gray-800/40">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{t('properties.table.price')}</div>
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">
                          {formatPrice(Number(previewProperty.price || 0), previewProperty.purpose || 'Sale')}
                        </div>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <div className="text-sm text-gray-600 dark:text-gray-300">{t('properties.table.status')}</div>
                        {(() => {
                          const originalStatus = previewProperty.status;
                          const normalizedStatus = String(originalStatus || '').toLowerCase();

                          // اعتبر العقار المنتهي (active + expired) كأنه "pending" في الواجهة
                          let isExpired = Boolean((previewProperty as any).isExpired);
                          if (!isExpired && previewProperty.expiresAt) {
                            const ts = new Date(previewProperty.expiresAt).getTime();
                            if (!Number.isNaN(ts)) {
                              isExpired = ts <= Date.now();
                            }
                          }

                          const displayStatus = isExpired && normalizedStatus === 'active'
                            ? 'pending'
                            : originalStatus;

                          const statusKey = String(displayStatus || '').toLowerCase();

                          return (
                            <span className={getStatusBadge(statusKey)}>
                              {displayStatus
                                ? t(`properties.status.${statusKey}`, displayStatus)
                                : previewProperty.status}
                            </span>
                          );
                        })()}
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                        <div className="text-gray-600 dark:text-gray-300">{t('properties.table.purpose')}</div>
                        <div className="text-gray-900 dark:text-white text-right">
                          {(() => {
                            const purposeRaw = String(previewProperty.purpose || '').toLowerCase();
                            const purposeKey = purposeRaw === 'rent' ? 'properties.stats.rent' : 'properties.stats.sale';
                            return t(purposeKey) || previewProperty.purpose;
                          })()}
                        </div>
                        <div className="text-gray-600 dark:text-gray-300">{t('properties.table.type')}</div>
                        <div className="text-gray-900 dark:text-white text-right">{translatePropertyType(previewProperty.type)}</div>
                      </div>
                    </div>

                    <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-white mb-2">{t('properties.ownerAndCompany')}</div>
                      <div className="text-sm text-gray-700 dark:text-gray-300">
                        <div className="flex items-center justify-between">
                          <span>{t('properties.table.company')}</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {previewProperty.company?.name || 'N/A'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <span>{t('properties.createdBy')}</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {previewProperty.createdBy?.name ? `${previewProperty.createdBy.name} (${translateUserRole(previewProperty.createdBy.role)})` : 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-white mb-2">{t('properties.description')}</div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                        {previewProperty.description || t('common.noData')}
                      </p>
                    </div>

                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {t('properties.table.createdAt')}: {previewProperty.createdAt ? new Date(previewProperty.createdAt).toLocaleString(language === 'ar' ? 'ar-BH' : 'en-US') : '—'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Duration Modal */}
      {showDurationModal && (
        <div className="fixed inset-0 z-[100] w-screen overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-gray-500/75 transition-opacity" 
              onClick={() => setShowDurationModal(false)}
            ></div>

            {/* Modal Panel */}
            <div className="relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg z-10">
              <div className="bg-white dark:bg-gray-800 px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                    <h3 className="text-lg font-semibold leading-6 text-gray-900 dark:text-white mb-4 text-center" id="modal-title">
                      {(() => {
                        const status = selectedPropertyForDuration?.status?.toLowerCase();
                        if (status === 'rejected') {
                          // للعقارات المرفوضة استخدم نفس نص العقارات المعلقة (Set)
                          return t('properties.duration.modalTitleSet');
                        }
                        if (selectedPropertyForDuration?.isExpired) {
                          return t('properties.duration.modalTitleRenew');
                        }
                        if (status === 'active') {
                          return t('properties.duration.modalTitleEdit');
                        }
                        return t('properties.duration.modalTitleSet');
                      })()}
                    </h3>
                    <div className="mt-2" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                       <p className="text-sm text-gray-500 dark:text-gray-400 mb-6" style={{ textAlign: language === 'ar' ? 'right' : 'left' }}>
                         {(() => {
                           const status = selectedPropertyForDuration?.status?.toLowerCase();
                           if (status === 'rejected') {
                             // نفس وصف العقارات المعلقة: بعد التفعيل
                             return t('properties.duration.descriptionSet');
                           }
                           if (selectedPropertyForDuration?.isExpired) {
                             return t('properties.duration.descriptionRenew');
                           }
                           if (status === 'active') {
                             return t('properties.duration.descriptionEdit');
                           }
                           return t('properties.duration.descriptionSet');
                         })()}
                       </p>
                       <div className="grid grid-cols-3 gap-x-4 gap-y-2">
                         <div className="col-span-1">
                           <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" style={{ textAlign: language === 'ar' ? 'right' : 'left' }}>
                             {language === 'ar' ? 'أيام' : 'Days'}
                           </label>
                           <input
                             type="number"
                             min="0"
                             className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white p-2.5 border text-center font-mono font-bold"
                             value={durationData.days}
                             onChange={(e) => setDurationData({...durationData, days: parseInt(e.target.value) || 0})}
                           />
                         </div>
                         <div className="col-span-1">
                           <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" style={{ textAlign: language === 'ar' ? 'right' : 'left' }}>
                             {language === 'ar' ? 'ساعات' : 'Hours'}
                           </label>
                           <input
                             type="number"
                             min="0"
                             max="23"
                             className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white p-2.5 border text-center font-mono font-bold"
                             value={durationData.hours}
                             onChange={(e) => setDurationData({...durationData, hours: parseInt(e.target.value) || 0})}
                           />
                         </div>
                         <div className="col-span-1">
                           <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" style={{ textAlign: language === 'ar' ? 'right' : 'left' }}>
                             {language === 'ar' ? 'دقائق' : 'Minutes'}
                           </label>
                           <input
                             type="number"
                             min="0"
                             max="59"
                             className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white p-2.5 border text-center font-mono font-bold"
                             value={durationData.minutes}
                             onChange={(e) => setDurationData({...durationData, minutes: parseInt(e.target.value) || 0})}
                           />
                         </div>
                       </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 gap-2">
                <button
                  type="button"
                  className="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 sm:w-auto"
                  onClick={handleSaveDuration}
                >
                  {(() => {
                    const status = selectedPropertyForDuration?.status?.toLowerCase();
                    if (status === 'rejected') {
                      // للعقار المرفوض خله دائماً "تأكيد المدة"
                      return t('properties.duration.confirm');
                    }
                    if (selectedPropertyForDuration?.isExpired) {
                      return t('properties.duration.renew');
                    }
                    if (status === 'active') {
                      return t('properties.duration.edit');
                    }
                    return t('properties.duration.confirm');
                  })()}
                </button>
                <button
                  type="button"
                  className="mt-3 inline-flex w-full justify-center rounded-md bg-white dark:bg-gray-800 px-3 py-2 text-sm font-semibold text-gray-900 dark:text-gray-200 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 sm:mt-0 sm:w-auto"
                  onClick={() => setShowDurationModal(false)}
                >
                  {t('common.cancel')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {confirmState.open && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-sm w-full mx-4">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                {t('common.confirm')}
              </h2>
            </div>
            <div className="px-4 py-4 text-sm text-gray-700 dark:text-gray-200" dir={language === 'ar' ? 'rtl' : 'ltr'}>
              {confirmState.message}
            </div>
            <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/60 flex justify-end gap-2">
              <button
                type="button"
                className="inline-flex justify-center rounded-md bg-white dark:bg-gray-800 px-3 py-1.5 text-xs font-semibold text-gray-900 dark:text-gray-200 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                onClick={closeConfirm}
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                className="inline-flex justify-center rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-500"
                onClick={() => {
                  const fn = confirmState.onConfirm;
                  closeConfirm();
                  fn();
                }}
              >
                {t('common.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
