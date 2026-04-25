import React, { useEffect, useMemo, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Image as RNImage,
  Platform,
  Alert,
  Switch,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import api from '../../src/api/api';
import { Button } from '../../src/components/Button';
import { ModalSelector } from '../../src/components/ModalSelector';
import { useToast } from '../../src/context/ToastContext';
import { useLanguageStore } from '../../src/store/languageStore';
import { useLocationStore } from '../../src/store/locationStore';
import { Governorate, Area, GovernorateListResponse, AreaListResponse } from '../../src/types/location';
import { rowDirection } from '../../src/utils/rtl';

const DRAFT_KEY = 'individual_property_draft_v1';

type DraftState = {
  form: {
    status: 'DRAFT' | 'PENDING_ADMIN';
    title: string;
    type: string;
    purpose: 'sale' | 'rent';
    minimumPrice: string;
    governorate: string;
    area: string;
    branch: string;
    description: string;
    locationLat: string;
    locationLng: string;
    condition: string;
    coverIndex: number;
    bedrooms: string;
    bathrooms: string;
    areaSqm: string;
    furnishingStatus: string;
    floorsCount: string;
    floorNumber: string;
    livingRooms: string;
    buildingAge: string;
    parkingCount: string;
    negotiable: boolean;
    showPhone: boolean;
    enableWhatsapp: boolean;
  };
  images: ImagePicker.ImagePickerAsset[];
  videos: Array<Pick<ImagePicker.ImagePickerAsset, 'uri' | 'fileName' | 'mimeType'>>;
  savedAt: number;
};

export default function IndividualAddPropertyScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { showToast } = useToast();
  const { language } = useLanguageStore();
  const { tempSelectedLocation, setTempSelectedLocation } = useLocationStore();
  
  const scrollViewRef = useRef<ScrollView>(null);
  const locationSectionY = useRef<number>(0);

  // Focus Refs
  const titleRef = useRef<TextInput>(null);
  const minimumPriceRef = useRef<TextInput>(null);
  const descriptionRef = useRef<TextInput>(null);
  const areaSqmRef = useRef<TextInput>(null);
  const bedroomsRef = useRef<TextInput>(null);
  const bathroomsRef = useRef<TextInput>(null);
  const floorNumberRef = useRef<TextInput>(null);
  const floorsCountRef = useRef<TextInput>(null);
  const livingRoomsRef = useRef<TextInput>(null);
  const buildingAgeRef = useRef<TextInput>(null);
  const parkingCountRef = useRef<TextInput>(null);

  const focusAvailable = (...refs: Array<React.RefObject<TextInput | null>>) => {
    for (const ref of refs) {
      if (ref.current) {
        ref.current.focus();
        return;
      }
    }
  };

  const [governorates, setGovernorates] = useState<Governorate[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);

  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [videos, setVideos] = useState<ImagePicker.ImagePickerAsset[]>([]);

  const [form, setForm] = useState<DraftState['form']>({
    status: 'DRAFT',
    title: '',
    type: '',
    purpose: 'sale',
    minimumPrice: '',
    governorate: '',
    area: '',
    branch: '',
    description: '',
    locationLat: '',
    locationLng: '',
    condition: '',
    coverIndex: 0,
    bedrooms: '',
    bathrooms: '',
    areaSqm: '',
    furnishingStatus: '',
    floorsCount: '',
    floorNumber: '',
    livingRooms: '',
    buildingAge: '',
    parkingCount: '',
    negotiable: false,
    showPhone: true,
    enableWhatsapp: true,
  });

  const textAlign = 'auto' as const;
  const writingDirection = 'auto' as const;
  const rowDir = rowDirection();

  const propertyTypes = useMemo(
    () => [
      { id: 'apartments', label: t('property.types.apartments') },
      { id: 'villas_houses', label: t('property.types.villas_houses') },
      { id: 'lands', label: t('property.types.lands') },
      { id: 'buildings', label: t('property.types.buildings') },
      { id: 'offices', label: t('property.types.offices') },
      { id: 'studio', label: t('property.types.studio') },
      { id: 'shops', label: t('property.types.shops') },
      { id: 'warehouses', label: t('property.types.warehouses') },
      { id: 'labor_accommodation', label: t('property.types.labor_accommodation') },
      { id: 'commercial_complexes', label: t('property.types.commercial_complexes') },
      { id: 'chalets', label: t('property.types.chalets') },
      { id: 'traditional_houses', label: t('property.types.traditional_houses') },
      { id: 'farms', label: t('property.types.farms') },
      { id: 'halls', label: t('property.types.halls') },
      { id: 'under_construction', label: t('property.types.under_construction') },
      { id: 'camps', label: t('property.types.camps') },
      { id: 'misc', label: t('property.types.misc') },
    ],
    [language]
  );

  const furnishingOptions = [
    { id: 'furnished', label: t('property.furnished') },
    { id: 'unfurnished', label: t('property.unfurnished') },
    { id: 'semiFurnished', label: t('property.semiFurnished') },
  ];

  const propertyConditionOptions = [
    { id: 'READY', label: t('property.condition.ready') || 'Ready' },
    { id: 'UNDER_CONSTRUCTION', label: t('property.condition.underConstruction') || 'Under construction' },
  ];

  const fetchGovernorates = async () => {
    try {
      const response = await api.get<GovernorateListResponse>('/public/governorates');
      if (response.data.success) {
        setGovernorates(response.data.data);
      }
    } catch {
      // ignore
    }
  };

  const fetchAreas = async (govId: string) => {
    try {
      const response = await api.get<AreaListResponse>(`/public/governorates/${govId}/areas`);
      if (response.data.success) {
        setAreas(response.data.data);
      }
    } catch {
      // ignore
    }
  };

  const saveDraft = async () => {
    const payload: DraftState = {
      form,
      images,
      videos: videos.map((vid) => ({
        uri: vid.uri,
        fileName: vid.fileName,
        mimeType: vid.mimeType,
      })),
      savedAt: Date.now(),
    };
    await AsyncStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
  };

  const loadDraft = async () => {
    const raw = await AsyncStorage.getItem(DRAFT_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as DraftState;
      if (parsed?.form) {
        setForm((p) => {
          const merged = { ...p, ...parsed.form };
          // If returning from location picker, ensure params take precedence over draft
          if (params.action === 'location_selected' && params.selectedLatitude) {
             merged.locationLat = String(params.selectedLatitude);
             merged.locationLng = String(params.selectedLongitude);
          }
          return merged;
        });
      }
      if (Array.isArray(parsed?.images)) setImages(parsed.images);
      if (Array.isArray((parsed as any)?.videos)) {
        // @ts-ignore
        setVideos((parsed as any).videos);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchGovernorates();
    loadDraft();
  }, []);

  useEffect(() => {
    if (form.governorate) {
        // Only fetch if areas empty or changing governorate
        if (areas.length === 0 || (areas[0] && areas[0].governorateId.toString() !== form.governorate)) {
            fetchAreas(form.governorate);
        }
    } else {
        if (areas.length > 0) {
            setAreas([]);
        }
        if (form.area) {
             setForm((p) => ({ ...p, area: '' }));
        }
    }
  }, [form.governorate]);

  // Handle location selection returned from the shared location picker via Global Store (cleaner stack)
  useFocusEffect(
    React.useCallback(() => {
        if (tempSelectedLocation) {
             const { lat, lng } = tempSelectedLocation;
             
             // Update form
             setForm((p) => ({
                ...p,
                locationLat: lat,
                locationLng: lng,
             }));
             
             showToast(t('location.locationSelected') || 'Location selected successfully', 'success');
             
             // Scroll to location section precisely
             setTimeout(() => {
                if (scrollViewRef.current && locationSectionY.current > 0) {
                   scrollViewRef.current.scrollTo({ y: locationSectionY.current, animated: true });
                }
             }, 300);
             
             // Clear temp store so it doesn't trigger again unless new selection
             setTempSelectedLocation(null);
        }
    }, [tempSelectedLocation])
  );

  // Helper also for params-based (backward compatibility if needed, but Store is preferred now)
  useEffect(() => {
    if (params.action === 'location_selected' && params.selectedLatitude && params.selectedLongitude) {
      // Check if values actually changed to avoid loop
      if (form.locationLat !== params.selectedLatitude || form.locationLng !== params.selectedLongitude) {
        setForm((p) => ({
          ...p,
          locationLat: String(params.selectedLatitude),
          locationLng: String(params.selectedLongitude),
        }));
        showToast(t('location.locationSelected') || 'Location selected successfully', 'success');
        
        // Scroll to location section precisely
        setTimeout(() => {
          if (scrollViewRef.current && locationSectionY.current > 0) {
             scrollViewRef.current.scrollTo({ y: locationSectionY.current, animated: true });
          }
        }, 100);
      }
    }
  }, [params.action, params.selectedLatitude, params.selectedLongitude]); // Remove full params dependency

  useEffect(() => {
    // autosave draft
    saveDraft().catch(() => undefined);
  }, [form, images, videos]);

  const pickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.85,
    });

    if (!result.canceled) {
      setImages((prev) => [...prev, ...result.assets]);
    }
  };

  const pickVideo = async () => {
    if (videos.length >= 5) {
      showToast(t('individual.maxVideosReached') || 'Maximum 5 videos allowed', 'error');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['videos'],
      allowsMultipleSelection: true,
    });

    if (!result.canceled) {
      const MAX_DURATION_SECONDS = 30;
      const filteredAssets = result.assets.filter((v) => {
        if (typeof v.duration !== 'number') return true;
        const seconds = v.duration > 1000 ? v.duration / 1000 : v.duration;
        return seconds <= MAX_DURATION_SECONDS;
      });

      if (filteredAssets.length < result.assets.length) {
        showToast(t('addProperty.maxVideoDuration') || 'Each video must be 30 seconds or less', 'error');
      }

      if (filteredAssets.length === 0) {
        return;
      }

      setVideos((prev) => {
        const existing = new Set(prev.map((v) => `${v.uri}|${v.fileName || ''}`))
        const deduped = filteredAssets.filter((v) => !existing.has(`${v.uri}|${v.fileName || ''}`));
        
        // Enforce max 5 videos limit
        const availableSlots = 5 - prev.length;
        const finalVideos = deduped.slice(0, availableSlots);
        
        if (deduped.length < result.assets.length) {
          showToast(t('individual.duplicateVideo') || 'Duplicate video ignored', 'error');
        }
        if (finalVideos.length < deduped.length) {
          showToast(t('individual.maxVideosReached') || 'Maximum 5 videos allowed', 'error');
        }
        return [...prev, ...finalVideos];
      });
    }
  };

  const removeVideo = (idx: number) => {
    setVideos((prev) => prev.filter((_, i) => i !== idx));
  };

  const removeImage = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
    setForm((p) => {
      const newCover = p.coverIndex > idx ? p.coverIndex - 1 : p.coverIndex;
      return { ...p, coverIndex: Math.max(0, Math.min(newCover, Math.max(0, images.length - 2))) };
    });
  };

  const openLocationPicker = () => {
    router.push({
      pathname: '/location-picker',
      params: {
        returnPath: '/individual/add',
        latitude: form.locationLat || undefined,
        longitude: form.locationLng || undefined,
      },
    });
  };

  const validate = () => {
    if (!form.description.trim()) return t('individual.validation.description') || 'Description is required';
    if (!form.type) return t('individual.validation.type') || 'Property type is required';
    if (!form.governorate) return t('individual.validation.governorate') || 'Governorate is required';
    if (!form.area) return t('individual.validation.area') || 'Area is required';

    const min = Number(form.minimumPrice);
    if (!Number.isFinite(min) || min <= 0) return t('individual.validation.minimumPrice') || 'Minimum price is required';

    const sqm = Number(form.areaSqm);
    if (form.type === 'lands' && (!Number.isFinite(sqm) || sqm <= 0)) {
      return t('addProperty.areaSqm') || 'Area (sqm) is required for lands';
    }

    if (['apartments', 'offices', 'studio', 'furnished_apartments'].includes(form.type)) {
      if (!form.floorNumber) return t('property.floorNumber') || 'Floor number is required for apartments/offices';
    }

    if (['villas_houses', 'buildings', 'commercial_complexes'].includes(form.type)) {
      if (!form.floorsCount) return t('property.floorsCount') || 'Floors count is required for villas/buildings';
    }

    if (!['lands', 'under_construction', 'camps'].includes(form.type) && !form.furnishingStatus) {
      return t('property.furnishingStatus') || 'Furnishing status is required';
    }

    return null;
  };

  const submit = async (sendForReview: boolean) => {
    const err = validate();
    if (sendForReview && err) {
      showToast(err, 'error');
      return;
    }

    await doSubmit(sendForReview);
  };

  const doSubmit = async (sendForReview: boolean) => {
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('status', sendForReview ? 'PENDING_ADMIN' : 'DRAFT');
      fd.append('title', form.title);
      fd.append('type', form.type);
      fd.append('purpose', form.purpose);
      fd.append('minimumPrice', form.minimumPrice);
      fd.append('governorate', form.governorate);
      fd.append('area', form.area);
      if (form.branch) fd.append('branch', form.branch);
      fd.append('description', form.description);
      if (form.condition) fd.append('condition', form.condition);
      if (form.locationLat) fd.append('locationLat', form.locationLat);
      if (form.locationLng) fd.append('locationLng', form.locationLng);
      if (form.bedrooms) fd.append('bedrooms', form.bedrooms);
      if (form.bathrooms) fd.append('bathrooms', form.bathrooms);
      if (form.areaSqm) fd.append('areaSqm', form.areaSqm);
      if (form.furnishingStatus) fd.append('furnishingStatus', form.furnishingStatus);
      if (form.floorsCount) fd.append('floorsCount', form.floorsCount);
      if (form.floorNumber) fd.append('floorNumber', form.floorNumber);
      if (form.livingRooms) fd.append('livingRooms', form.livingRooms);
      if (form.buildingAge) fd.append('buildingAge', form.buildingAge);
      if (form.parkingCount) fd.append('parkingCount', form.parkingCount);
      fd.append('negotiable', form.negotiable ? 'true' : 'false');
      fd.append('showPhone', form.showPhone ? 'true' : 'false');
      fd.append('enableWhatsapp', form.enableWhatsapp ? 'true' : 'false');
      fd.append('coverIndex', String(form.coverIndex || 0));

      if (videos.length > 0) {
        const uniqueVideos = videos.filter((vid, idx, arr) => {
          const key = `${vid.uri}|${vid.fileName || ''}`;
          return arr.findIndex((v) => `${v.uri}|${v.fileName || ''}` === key) === idx;
        });
        for (const vid of uniqueVideos) {
          if (Platform.OS === 'web') {
            const videoResponse = await fetch(vid.uri);
            const videoBlob = await videoResponse.blob();
            const videoName = vid.fileName || `video_${Date.now()}.mp4`;
            fd.append('videos', videoBlob, videoName);
          } else {
            // @ts-ignore - RN FormData file
            fd.append('videos', {
              uri: vid.uri,
              name: vid.fileName || `video_${Date.now()}.mp4`,
              type: vid.mimeType || 'video/mp4',
            });
            if (typeof vid.duration === 'number') {
              fd.append('videoDurations', String(vid.duration));
            }
          }
        }
      }

      images.forEach((img) => {
        const uri = img.uri;
        const name = uri.split('/').pop() || `image_${Date.now()}.jpg`;
        const match = /\.(\w+)$/.exec(name);
        const type = match ? `image/${match[1]}` : 'image/jpeg';
        // @ts-ignore - RN FormData file
        fd.append('images', { uri, name, type });
      });

      const res = await api.post('/individual/properties', fd, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        transformRequest: (data, headers) => {
          return data; // Prevent Axios from stringifying FormData
        },
      });

      if (res.data?.success) {
        await AsyncStorage.removeItem(DRAFT_KEY);
        showToast(res.data?.message || (sendForReview ? 'Submitted' : 'Saved'), 'success');
        router.replace('/individual');
      } else {
        showToast(res.data?.message || t('common.error') || 'Error', 'error');
      }
    } catch (e: any) {
      console.error('Submit error:', e);
      let msg = t('common.error') || 'Error';
      if (e?.response?.data?.message) {
        msg = e.response.data.message;
      } else if (e.message && e.message.includes('timeout')) {
        msg = 'Request timed out. Please check your connection or try a smaller video.';
      } else if (e.message && e.message.includes('Network Error')) {
        msg = 'Network error. Please check your connection.';
      }
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        keyboardVerticalOffset={100}
      >
      <ScrollView 
        ref={scrollViewRef}
        contentContainerStyle={[styles.content, { width: '100%', paddingBottom: 50 }]} 
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.title, { width: '100%' }]}>{t('individual.addPropertyTitle') || 'Add Property'}</Text>

        <Text style={[styles.label, { textAlign, width: '100%' }]}>{t('property.details') || 'Property Details'}</Text>

        {/* Property Type first */}
        <Text style={[styles.fieldLabel, { textAlign, width: '100%' }]}>{t('home.selectPropertyType') || 'Property Type'}</Text>
        <ModalSelector
          label=""
          placeholder={t('home.selectPropertyType') || 'Property Type'}
          options={propertyTypes}
          selectedId={form.type}
          onSelect={(id) => setForm((p) => ({ ...p, type: String(id) }))}
        />

        {/* Purpose */}
        <Text style={[styles.fieldLabel, { textAlign, width: '100%' }]}>{t('addProperty.purpose') || 'Purpose'}</Text>
        <View style={[styles.row, { width: '100%', flexDirection: rowDir }]}> 
          <TouchableOpacity
            style={[styles.option, form.purpose === 'sale' && styles.optionSelected]}
            onPress={() => setForm((p) => ({ ...p, purpose: 'sale' }))}
          >
            <Text style={[styles.optionText, form.purpose === 'sale' && styles.optionTextSelected]}>{t('home.forSale')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.option, form.purpose === 'rent' && styles.optionSelected]}
            onPress={() => setForm((p) => ({ ...p, purpose: 'rent' }))}
          >
            <Text style={[styles.optionText, form.purpose === 'rent' && styles.optionTextSelected]}>{t('home.forRent')}</Text>
          </TouchableOpacity>
        </View>

        {/* Title below property type */}
        <Text style={[styles.fieldLabel, { textAlign, width: '100%' }]}>{t('property.title') || 'Title'}</Text>
        <TextInput
          ref={titleRef}
          returnKeyType="next"
          onSubmitEditing={() => minimumPriceRef.current?.focus()}
          blurOnSubmit={false}
          value={form.title}
          onChangeText={(v) => setForm((p) => ({ ...p, title: v }))}
          style={[styles.input, { textAlign, writingDirection, width: '100%' }]}
          placeholder={t('individual.titlePlaceholder') || 'Optional'}
        />

        <View style={[styles.row, { width: '100%', flexDirection: rowDir }]}> 
          <View style={styles.col}>
            <Text style={[styles.fieldLabel, { textAlign, width: '100%' }]}>{t('property.form.selectGovernorate') || 'Select Governorate'}</Text>
            <ModalSelector
              label=""
              placeholder={t('property.form.selectGovernorate') || 'Select Governorate'}
              options={governorates.map((g) => ({
                id: String(g.id),
                label: (language === 'ar' ? (g.nameAr || g.nameEn || g.name) : (g.nameEn || g.nameAr || g.name)) || 'Unknown',
              }))}
              selectedId={form.governorate}
              onSelect={(id) => setForm((p) => ({ ...p, governorate: String(id), area: '' }))}
            />
          </View>
          <View style={styles.col}>
            <Text style={[styles.fieldLabel, { textAlign, width: '100%' }]}>{t('property.form.selectArea') || 'Select Area'}</Text>
            <ModalSelector
              label=""
              placeholder={t('property.form.selectArea') || 'Select Area'}
              options={areas.map((a) => ({
                id: String(a.id),
                label: (language === 'ar' ? (a.nameAr || a.nameEn || a.name) : (a.nameEn || a.nameAr || a.name)) || 'Unknown',
              }))}
              selectedId={form.area}
              onSelect={(id) => setForm((p) => ({ ...p, area: String(id) }))}
              disabled={!form.governorate}
            />
          </View>
        </View>

        <Text style={[styles.fieldLabel, { textAlign, width: '100%' }]}>{t('individual.minimumPrice') || 'Minimum price'}</Text>
        <TextInput
          ref={minimumPriceRef}
          returnKeyType="next"
          onSubmitEditing={() => descriptionRef.current?.focus()}
          blurOnSubmit={false}
          value={form.minimumPrice}
          onChangeText={(v) => setForm((p) => ({ ...p, minimumPrice: v }))}
          style={[styles.input, { textAlign, writingDirection, width: '100%' }]}
          keyboardType={Platform.OS === 'ios' ? 'number-pad' : 'numeric'}
          placeholder="e.g. 50000"
        />

        <View style={[styles.row, { alignItems: 'center', marginTop: 10, width: '100%', flexDirection: rowDir }]}>
          <Text style={[styles.fieldLabel, { flex: 1, textAlign }]}>{t('addProperty.negotiable') || 'Negotiable'}</Text>
          <Switch value={form.negotiable} onValueChange={(v) => setForm((p) => ({ ...p, negotiable: v }))} />
        </View>

        <View style={[styles.row, { alignItems: 'center', marginTop: 6, width: '100%', flexDirection: rowDir }]}>
          <Text style={[styles.fieldLabel, { flex: 1, textAlign }]}>{t('addProperty.showPhoneNumber') || 'Show phone number'}</Text>
          <Switch value={form.showPhone} onValueChange={(v) => setForm((p) => ({ ...p, showPhone: v }))} />
        </View>

        <View style={[styles.row, { alignItems: 'center', marginTop: 6, width: '100%', flexDirection: rowDir }]}>
          <Text style={[styles.fieldLabel, { flex: 1, textAlign }]}>{t('addProperty.enableWhatsApp') || 'Enable WhatsApp'}</Text>
          <Switch value={form.enableWhatsapp} onValueChange={(v) => setForm((p) => ({ ...p, enableWhatsapp: v }))} />
        </View>

        <Text style={[styles.fieldLabel, { textAlign, width: '100%' }]}>{t('property.description') || 'Description'}</Text>
        <TextInput
          ref={descriptionRef}
          value={form.description}
          onChangeText={(v) => setForm((p) => ({ ...p, description: v }))}
          style={[styles.textArea, { textAlign, writingDirection, width: '100%' }]}
          multiline
          placeholder={t('individual.descriptionPlaceholder') || 'Write details about the property'}
        />

        {form.type ? (
          <View style={[styles.row, { gap: 10, flexWrap: 'wrap', marginTop: 12, flexDirection: rowDir }]}>
            {['lands'].includes(form.type) && (
              <View style={{ width: '48%' }}>
                <Text style={[styles.fieldLabel, { textAlign }]}>{t('addProperty.areaSqm') || 'Area (sqm)'}</Text>
                <TextInput
                  ref={areaSqmRef}
                  returnKeyType="next"
                  onSubmitEditing={() => focusAvailable(bedroomsRef, bathroomsRef, floorNumberRef, floorsCountRef, livingRoomsRef, buildingAgeRef, parkingCountRef)}
                  blurOnSubmit={false}
                  value={form.areaSqm}
                  onChangeText={(v) => setForm((p) => ({ ...p, areaSqm: v }))}
                  style={[styles.input, { textAlign, writingDirection }]}
                  keyboardType={Platform.OS === 'ios' ? 'number-pad' : 'numeric'}
                  placeholder="0"
                />
              </View>
            )}

            {!['lands', 'offices', 'shops', 'warehouses', 'halls', 'misc'].includes(form.type) && (
              <View style={{ width: '48%' }}>
                <Text style={[styles.fieldLabel, { textAlign }]}>{t('addProperty.bedrooms') || 'Bedrooms'}</Text>
                <TextInput
                  ref={bedroomsRef}
                  returnKeyType="next"
                  onSubmitEditing={() => focusAvailable(bathroomsRef, floorNumberRef, floorsCountRef, livingRoomsRef, buildingAgeRef, parkingCountRef)}
                  blurOnSubmit={false}
                  value={form.bedrooms}
                  onChangeText={(v) => setForm((p) => ({ ...p, bedrooms: v }))}
                  style={[styles.input, { textAlign, writingDirection }]}
                  keyboardType={Platform.OS === 'ios' ? 'number-pad' : 'numeric'}
                  placeholder="0"
                />
              </View>
            )}

            {!['lands'].includes(form.type) && (
              <View style={{ width: '48%' }}>
                <Text style={[styles.fieldLabel, { textAlign }]}>{t('addProperty.bathrooms') || 'Bathrooms'}</Text>
                <TextInput
                  ref={bathroomsRef}
                  returnKeyType="next"
                  onSubmitEditing={() => focusAvailable(floorNumberRef, floorsCountRef, livingRoomsRef, buildingAgeRef, parkingCountRef)}
                  blurOnSubmit={false}
                  value={form.bathrooms}
                  onChangeText={(v) => setForm((p) => ({ ...p, bathrooms: v }))}
                  style={[styles.input, { textAlign, writingDirection }]}
                  keyboardType={Platform.OS === 'ios' ? 'number-pad' : 'numeric'}
                  placeholder="0"
                />
              </View>
            )}

            {!['lands', 'under_construction', 'camps'].includes(form.type) && (
              <View style={{ width: '48%' }}>
                <Text style={[styles.fieldLabel, { textAlign }]}>{t('property.furnishingStatus') || 'Furnishing'}</Text>
                <ModalSelector
                  label=""
                  placeholder={t('property.furnishingStatus') || 'Furnishing status'}
                  options={furnishingOptions}
                  selectedId={form.furnishingStatus}
                  onSelect={(id) => setForm((p) => ({ ...p, furnishingStatus: String(id) }))}
                />
              </View>
            )}

            {['apartments', 'offices', 'studio', 'furnished_apartments'].includes(form.type) && (
              <View style={{ width: '48%' }}>
                <Text style={[styles.fieldLabel, { textAlign }]}>{t('property.floorNumber') || 'Floor number'}</Text>
                <TextInput
                  ref={floorNumberRef}
                  returnKeyType="next"
                  onSubmitEditing={() => focusAvailable(floorsCountRef, livingRoomsRef, buildingAgeRef, parkingCountRef)}
                  blurOnSubmit={false}
                  value={form.floorNumber}
                  onChangeText={(v) => setForm((p) => ({ ...p, floorNumber: v }))}
                  style={[styles.input, { textAlign, writingDirection }]}
                  keyboardType={Platform.OS === 'ios' ? 'number-pad' : 'numeric'}
                  placeholder="0"
                />
              </View>
            )}

            {['villas_houses', 'buildings', 'commercial_complexes'].includes(form.type) && (
              <View style={{ width: '48%' }}>
                <Text style={[styles.fieldLabel, { textAlign }]}>{t('property.floorsCount') || 'Floors count'}</Text>
                <TextInput
                  ref={floorsCountRef}
                  returnKeyType="next"
                  onSubmitEditing={() => focusAvailable(livingRoomsRef, buildingAgeRef, parkingCountRef)}
                  blurOnSubmit={false}
                  value={form.floorsCount}
                  onChangeText={(v) => setForm((p) => ({ ...p, floorsCount: v }))}
                  style={[styles.input, { textAlign, writingDirection }]}
                  keyboardType={Platform.OS === 'ios' ? 'number-pad' : 'numeric'}
                  placeholder="0"
                />
              </View>
            )}

            {['apartments', 'villas_houses', 'traditional_houses', 'chalets'].includes(form.type) && (
              <View style={{ width: '48%' }}>
                <Text style={[styles.fieldLabel, { textAlign }]}>{t('property.livingRooms') || 'Living rooms'}</Text>
                <TextInput
                  ref={livingRoomsRef}
                  returnKeyType="next"
                  onSubmitEditing={() => focusAvailable(buildingAgeRef, parkingCountRef)}
                  blurOnSubmit={false}
                  value={form.livingRooms}
                  onChangeText={(v) => setForm((p) => ({ ...p, livingRooms: v }))}
                  style={[styles.input, { textAlign, writingDirection }]}
                  keyboardType={Platform.OS === 'ios' ? 'number-pad' : 'numeric'}
                  placeholder="0"
                />
              </View>
            )}

            {!['lands', 'under_construction', 'camps'].includes(form.type) && (
              <View style={{ width: '48%' }}>
                <Text style={[styles.fieldLabel, { textAlign }]}>{t('property.buildingAge') || 'Building age'}</Text>
                <TextInput
                  ref={buildingAgeRef}
                  returnKeyType="next"
                  onSubmitEditing={() => parkingCountRef.current?.focus()}
                  blurOnSubmit={false}
                  value={form.buildingAge}
                  onChangeText={(v) => setForm((p) => ({ ...p, buildingAge: v }))}
                  style={[styles.input, { textAlign, writingDirection }]}
                  keyboardType={Platform.OS === 'ios' ? 'number-pad' : 'numeric'}
                  placeholder="0"
                />
              </View>
            )}

            <View style={{ width: '48%' }}>
              <Text style={[styles.fieldLabel, { textAlign }]}>{t('property.parkingCount') || 'Parking'}</Text>
              <TextInput
                ref={parkingCountRef}
                returnKeyType="done"
                value={form.parkingCount}
                onChangeText={(v) => setForm((p) => ({ ...p, parkingCount: v }))}
                style={[styles.input, { textAlign, writingDirection }]}
                keyboardType={Platform.OS === 'ios' ? 'number-pad' : 'numeric'}
                placeholder="0"
              />
            </View>

            <View style={{ width: '48%' }}>
              <Text style={[styles.fieldLabel, { textAlign }]}>{t('property.conditionLabel') || 'Condition'}</Text>
              <ModalSelector
                label=""
                placeholder={t('property.conditionPlaceholder') || 'Condition'}
                options={propertyConditionOptions}
                selectedId={form.condition}
                onSelect={(id) => setForm((p) => ({ ...p, condition: String(id) }))}
              />
            </View>
          </View>
        ) : null}

        <View 
            style={styles.section}
            onLayout={(event) => {
                locationSectionY.current = event.nativeEvent.layout.y;
            }}
        >
          <Text style={[styles.sectionTitle, { textAlign }]}>{t('location.selectLocation') || 'Select Property Location'}</Text>
          <TouchableOpacity  
            onPress={openLocationPicker} 
            style={[
              styles.locationBtn,
              (!!form.locationLat && !!form.locationLng) ? { backgroundColor: '#5DCA74', borderColor: '#4CB563', borderWidth: 2 } : {}
            ]}
          >
            <Text style={[
              styles.locationBtnText, 
              { textAlign },
              (!!form.locationLat && !!form.locationLng) ? { color: '#ffffff', fontWeight: 'bold' } : {}
            ]}>
              {(!!form.locationLat && !!form.locationLng)
                ? t('location.locationSelectedChange') || 'Location Selected (Tap to change)'
                : t('location.tapToSelect') || 'Tap to select'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <View style={[styles.row, { justifyContent: 'space-between', alignItems: 'center', flexDirection: rowDir }]}> 
            <Text style={[styles.sectionTitle, { textAlign }]}>{t('individual.images') || 'Images'}</Text>
            <TouchableOpacity onPress={pickImages} style={styles.addImageBtn}>
              <Text style={styles.addImageBtnText}>{t('common.add') || 'Add'}</Text>
            </TouchableOpacity>
          </View>

          {images.length === 0 ? (
            <Text style={[styles.muted, { textAlign }]}>{t('individual.imagesHelp') || 'Add photos (optional in MVP).'} </Text>
          ) : (
            <View style={[styles.imagesGrid, { flexDirection: rowDir }]}> 
              {images.map((img, idx) => {
                const isCover = idx === form.coverIndex;
                return (
                  <View key={img.uri} style={styles.imageWrap}>
                    <TouchableOpacity onPress={() => setForm((p) => ({ ...p, coverIndex: idx }))}>
                      <RNImage source={{ uri: img.uri }} style={[styles.image, isCover && styles.coverBorder]} />
                    </TouchableOpacity>
                    <View style={[styles.imageActions, { flexDirection: rowDir }]}> 
                      <TouchableOpacity onPress={() => removeImage(idx)}>
                        <Text style={styles.removeText}>{t('common.delete') || 'Delete'}</Text>
                      </TouchableOpacity>
                      {isCover ? <Text style={styles.coverBadge}>{t('individual.cover') || 'Cover'}</Text> : null}
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <View style={[styles.row, { justifyContent: 'space-between', alignItems: 'center', flexDirection: rowDir }]}> 
            <Text style={[styles.sectionTitle, { textAlign }]}>{t('individual.video') || 'Videos'} ({videos.length}/5)</Text>
            <TouchableOpacity 
              onPress={pickVideo} 
              style={[
                styles.addImageBtn,
                videos.length >= 5 && { backgroundColor: '#ccc', opacity: 0.6 }
              ]}
              disabled={videos.length >= 5}
            >
              <Text style={[
                styles.addImageBtnText,
                videos.length >= 5 && { color: '#666' }
              ]}>
                {videos.length >= 5 ? 
                  (t('individual.maxVideos') || 'Max 5') :
                  (t('common.add') || 'Add')
                }
              </Text>
            </TouchableOpacity>
          </View>
          {videos.length > 0 ? (
            <View style={{ marginTop: 10 }}>
              {videos.map((vid, idx) => (
                <View
                  key={`${vid.uri}-${idx}`}
                  style={[styles.row, { alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f9f9f9', padding: 10, borderRadius: 8, marginBottom: 8, flexDirection: rowDir }]}
                >
                  <Text style={{ flex: 1, color: '#2c3e50' }} numberOfLines={1}>
                    {vid.fileName || `Video ${idx + 1}`}
                  </Text>
                  <TouchableOpacity onPress={() => removeVideo(idx)}>
                    <Text style={styles.removeText}>{t('common.delete') || 'Delete'}</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ) : (
            <Text style={[styles.muted, { textAlign }]}>{t('individual.videoHelp') || 'Add a video tour (optional).'} </Text>
          )}
        </View>

        <View style={styles.actions}>
          <Button title={t('individual.saveDraft') || 'Save Draft'} onPress={() => submit(false)} loading={loading} />
          <View style={{ height: 10 }} />
          <Button title={t('individual.submitForReview') || 'Submit for Review'} onPress={() => submit(true)} loading={loading} variant="success" />
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 16 },
  title: { fontSize: 22, fontWeight: '800', color: '#00305D', textAlign: 'center', marginBottom: 14 },
  label: { fontSize: 16, fontWeight: '700', color: '#00305D', marginTop: 8, marginBottom: 10, width: '100%' },
  fieldLabel: { fontSize: 14, color: '#00305D', marginTop: 10, marginBottom: 6, width: '100%' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 12, fontSize: 16, backgroundColor: '#fff', textAlignVertical: 'center', width: '100%' },
  textArea: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 12, minHeight: 120, fontSize: 16, backgroundColor: '#fff', textAlignVertical: 'top', width: '100%' },
  row: { flexDirection: 'row', gap: 10 },
  option: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#00305D',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  optionSelected: {
    backgroundColor: '#00305D',
  },
  optionText: {
    color: '#00305D',
    fontWeight: '700',
  },
  optionTextSelected: {
    color: '#fff',
  },
  col: { flex: 1 },
  section: { marginTop: 18 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#00305D', marginBottom: 10 },
  locationBtn: { borderWidth: 1, borderColor: '#00305D', borderRadius: 10, padding: 12, backgroundColor: '#fff' },
  locationBtnText: { color: '#00305D', fontWeight: '600' },
  addImageBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: '#00305D' },
  addImageBtnText: { color: '#00305D', fontWeight: '700' },
  muted: { color: '#C6A55E' },
  imagesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  imageWrap: { width: '48%' },
  image: { width: '100%', height: 160, borderRadius: 12 },
  coverBorder: { borderWidth: 3, borderColor: '#C6A55E' },
  imageActions: { marginTop: 6, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  removeText: { color: '#D1232A', fontWeight: '700' },
  coverBadge: { color: '#C6A55E', fontWeight: '800' },
  actions: { marginTop: 20, marginBottom: 40 },
});
