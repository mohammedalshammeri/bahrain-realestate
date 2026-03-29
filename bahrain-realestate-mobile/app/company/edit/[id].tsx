import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Linking, KeyboardAvoidingView, Platform, Switch } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import api from '../../../src/api/api';
import { PropertyDetailsResponse } from '../../../src/types/property';
import { useLanguageStore } from '../../../src/store/languageStore';
import { ModalSelector } from '../../../src/components/ModalSelector';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { Governorate, Area, GovernorateListResponse, AreaListResponse } from '../../../src/types/location';
import { alignStart, rowDirection, textAlignStart } from '../../../src/utils/rtl';

export default function EditProperty() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { language } = useLanguageStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [governorates, setGovernorates] = useState<Governorate[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [selectedGovernorateId, setSelectedGovernorateId] = useState<string | null>(null);
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    type: '',
    purpose: 'sale',
    price: '',
    title: '',
    isNegotiable: false,
    showPhoneNumber: true,
    enableWhatsApp: true,
    governorate: '',
    area: '',
    description: '',
    bedrooms: '',
    bathrooms: '',
    areaSqm: '',
    furnishingStatus: '',
    floorsCount: '',
    floorNumber: '',
    livingRooms: '',
    buildingAge: '',
    parkingCount: '',
    propertyCondition: '',
  });
  const [existingImages, setExistingImages] = useState<Array<{ id: number; imageUrl: string }>>([]);
  const [existingVideos, setExistingVideos] = useState<Array<{ id: number; imageUrl: string; fileName?: string }>>([]);
  const [loadingVideo, setLoadingVideo] = useState(false);

  // Refs for focusing next inputs
  const priceRef = useRef<TextInput>(null);
  const bedroomRef = useRef<TextInput>(null);
  const bathroomRef = useRef<TextInput>(null);
  const areaRef = useRef<TextInput>(null);
  const livingRef = useRef<TextInput>(null);
  const floorsCountRef = useRef<TextInput>(null);
  const floorNumRef = useRef<TextInput>(null);
  const ageRef = useRef<TextInput>(null);
  const parkingRef = useRef<TextInput>(null);
  const descriptionRef = useRef<TextInput>(null);

  useEffect(() => {
    const init = async () => {
      try {
        // 1. Fetch Governorates
        const govResponse = await api.get<GovernorateListResponse>('/public/governorates');
        let govs: Governorate[] = [];
        if (govResponse.data.success) {
          govs = govResponse.data.data;
          setGovernorates(govs);
        }

        // 2. Fetch Property (company-owned properties are under /company)
        const propResponse = await api.get<PropertyDetailsResponse>(`/company/properties/${id}`);
        if (propResponse.data.success) {
          const p = propResponse.data.data;
          
          // 3. Match Governorate
          const matchedGov = govs.find(g => 
            g.nameEn === p.governorate || 
            g.nameAr === p.governorate || 
            g.name === p.governorate
          );

          let currentGovId = '';
          if (matchedGov) {
            currentGovId = matchedGov.id.toString();
            setSelectedGovernorateId(currentGovId);
          }

          // 4. Fetch Areas if we have a governorate
          let currentAreas: Area[] = [];
          if (currentGovId) {
            const areaResponse = await api.get<AreaListResponse>(`/public/governorates/${currentGovId}/areas`);
            if (areaResponse.data.success) {
              currentAreas = areaResponse.data.data;
              setAreas(currentAreas);
            }
          }

          // 5. Match Area
          const matchedArea = currentAreas.find(a => 
            a.nameEn === p.area || 
            a.nameAr === p.area || 
            a.name === p.area
          );

          if (matchedArea) {
            setSelectedAreaId(matchedArea.id.toString());
          }

          // 6. Set Form Data
          setFormData({
            type: p.type,
            purpose: p.purpose,
            price: p.price.toString(),
            title: p.title || '',
            isNegotiable: (p as any).isNegotiable || false,
            showPhoneNumber: p.showPhoneNumber ?? true,
            enableWhatsApp: p.enableWhatsApp ?? true,
            governorate: p.governorate,
            area: p.area,
            description: p.description,
            bedrooms: p.bedrooms ? p.bedrooms.toString() : '',
            bathrooms: p.bathrooms ? p.bathrooms.toString() : '',
            areaSqm: p.areaSqm ? p.areaSqm.toString() : '',
            furnishingStatus: (p as any).furnishingStatus || '',
            floorsCount: (p as any).floorsCount ? (p as any).floorsCount.toString() : '',
            floorNumber: (p as any).floorNumber ? (p as any).floorNumber.toString() : '',
            livingRooms: (p as any).livingRooms ? (p as any).livingRooms.toString() : '',
            buildingAge: (p as any).buildingAge ? (p as any).buildingAge.toString() : '',
            parkingCount: (p as any).parkingCount ? (p as any).parkingCount.toString() : '',
            propertyCondition: (p as any).propertyCondition || '',
          });
          
          // 7. Existing Media
          // The API returns all media in propertyImages which have isVideo flag
          const allMedia = Array.isArray(p.propertyImages) ? p.propertyImages : [];
          const images = allMedia.filter((m: any) => !m.isVideo).map((img: any) => ({ id: img.id, imageUrl: img.imageUrl }));
          const videos = allMedia.filter((m: any) => m.isVideo).map((vid: any) => ({ 
            id: vid.id, 
            imageUrl: vid.imageUrl,
            fileName: `Video ${vid.id}`
          }));

          setExistingImages(images);
          setExistingVideos(videos);
        }
      } catch (error: any) {
        // Ignore 401 errors as they are handled globally by interceptors (redirect to login)
        if (error?.response?.status === 401) return;
        
        console.error(error);
        Alert.alert(t('common.error'), t('common.error'));
        router.back();
      } finally {
        setLoading(false);
      }
    };

    if (id) init();
  }, [id]);

  const handleGovernorateSelect = async (id: string) => {
    setSelectedGovernorateId(id);
    const gov = governorates.find(g => g.id.toString() === id);
    if (gov) {
      // Update form data with the English name (or preferred format)
      setFormData(prev => ({ ...prev, governorate: gov.nameEn || gov.name || '' }));
      
      // Reset area
      setSelectedAreaId(null);
      setFormData(prev => ({ ...prev, area: '' }));
      setAreas([]);

      // Fetch new areas
      try {
        const response = await api.get<AreaListResponse>(`/public/governorates/${id}/areas`);
        if (response.data.success) {
          setAreas(response.data.data);
        }
      } catch (error) {
        console.error(error);
      }
    }
  };

  const handleAreaSelect = (id: string) => {
    setSelectedAreaId(id);
    const area = areas.find(a => a.id.toString() === id);
    if (area) {
      setFormData(prev => ({ ...prev, area: area.nameEn || area.name || '' }));
    }
  };

  const propertyTypes = [
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
    { id: 'furnished_apartments', label: t('property.types.furnished_apartments') || 'Furnished Apartments' },
  ];

  const pickAndUploadImages = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        // use newer API shape to avoid deprecation warning
        mediaTypes: (ImagePicker as any).MediaType?.Images || (ImagePicker as any).MediaType || ImagePicker.MediaTypeOptions?.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
      });

      // result shapes differ across SDKs: check both cancelled/canceled flags
      const cancelled = (result as any).canceled === true || (result as any).cancelled === true;
      if (cancelled) return;

      // normalize selected assets: prefer `assets`, then `selected`, then legacy single object with `uri`
      let selected: any[] = [];
      if (Array.isArray((result as any).assets) && (result as any).assets.length) {
        selected = (result as any).assets;
      } else if (Array.isArray((result as any).selected) && (result as any).selected.length) {
        selected = (result as any).selected;
      } else if ((result as any).uri) {
        selected = [result];
      }

      if (!selected.length) return;

      const fd = new FormData();
      for (const img of selected) {
        const uri: string | undefined = img?.uri || img?.localUri || img?.uriLocal;
        if (!uri) continue; // skip if no uri
        const name = uri.split('/').pop() || `image_${Date.now()}.jpg`;
        const match = /\.(\w+)$/.exec(name);
        const type = match ? `image/${match[1]}` : 'image/jpeg';
        // @ts-ignore - RN FormData file
        fd.append('images', { uri, name, type });
      }

      const res = await api.post(`/company/properties/${id}/images`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data?.success) {
        // append returned images
        const added = Array.isArray(res.data.data) ? res.data.data : [];
        setExistingImages(prev => [...prev, ...added.map((a: any) => ({ id: a.id, imageUrl: a.imageUrl }))]);
        Alert.alert(t('common.success'), t('addProperty.imagesUploaded') || 'Images uploaded successfully');
      } else {
        Alert.alert(t('common.error'), res.data?.message || 'Upload failed');
      }
    } catch (e: any) {
      console.error(e);
      Alert.alert(t('common.error'), e?.response?.data?.message || t('common.error'));
    }
  };

  const pickAndUploadVideo = async () => {
    try {
      if (existingVideos.length >= 5) {
        Alert.alert(t('common.info'), t('addProperty.maxVideosReached') || 'Maximum 5 videos allowed');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: (ImagePicker as any).MediaType?.Videos || (ImagePicker as any).MediaType || ImagePicker.MediaTypeOptions?.Videos,
        allowsMultipleSelection: true,
        quality: 1,
      });

      const cancelled = (result as any).canceled === true || (result as any).cancelled === true;
      if (cancelled) return;

      let selected: any[] = [];
      if (Array.isArray((result as any).assets) && (result as any).assets.length) {
        selected = (result as any).assets;
      } else if ((result as any).uri) {
        selected = [result];
      }

      if (!selected.length) return;

      const MAX_DURATION_SECONDS = 30;
      const filteredSelected = selected.filter((v: any) => {
        if (typeof v.duration !== 'number') return true;
        const seconds = v.duration > 1000 ? v.duration / 1000 : v.duration;
        return seconds <= MAX_DURATION_SECONDS;
      });

      if (filteredSelected.length < selected.length) {
        Alert.alert(t('common.error'), t('addProperty.maxVideoDuration') || 'Each video must be 30 seconds or less');
      }

      if (!filteredSelected.length) {
        return;
      }

      setLoadingVideo(true);
      const fd = new FormData();
      
      let count = 0;
      for (const vid of filteredSelected) {
        if (existingVideos.length + count >= 5) break; 
        
        const uri: string = vid.uri;
        const name = vid.fileName || uri.split('/').pop() || `video_${Date.now()}_${count}.mp4`;
        const type = vid.mimeType || 'video/mp4';
        // @ts-ignore - RN FormData file
        fd.append('videos', { uri, name, type });
        if (typeof vid.duration === 'number') {
          fd.append('videoDurations', String(vid.duration));
        }
        count++;
      }

      if (count === 0) {
        setLoadingVideo(false);
        return;
      }

      // Note: Endpoint usually is shared or specific. Assuming 'images' endpoint handles videos if mime type is video,
      // OR uses 'videos' key. Based on add.tsx it sends 'videos' key to same endpoint usually? 
      // add.tsx sends to POST /company/properties -> Multipart.
      // edit.tsx sends to POST /company/properties/{id}/images.
      // Backend likely checks 'videos' field in multer.
      
      const res = await api.post(`/company/properties/${id}/images`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data?.success) {
        // Refresh properties to get new video IDs
        const propResponse = await api.get<PropertyDetailsResponse>(`/company/properties/${id}`);
        if (propResponse.data.success) {
             const allMedia = Array.isArray(propResponse.data.data.propertyImages) ? propResponse.data.data.propertyImages : [];
             const videos = allMedia.filter((m: any) => m.isVideo).map((vid: any) => ({ 
                id: vid.id, 
                imageUrl: vid.imageUrl,
                fileName: `Video ${vid.id}`
             }));
             setExistingVideos(videos);
        }
        Alert.alert(t('common.success'), t('addProperty.videoUploaded') || 'Video uploaded successfully');
      } else {
        Alert.alert(t('common.error'), res.data?.message || 'Upload failed');
      }
    } catch (e: any) {
      console.error(e);
      Alert.alert(t('common.error'), e?.response?.data?.message || t('common.error'));
    } finally {
      setLoadingVideo(false);
    }
  };

  const deleteVideo = async (videoId: number) => {
    Alert.alert(t('common.confirm'), t('common.confirmDelete') || 'Are you sure?', [
      { text: t('common.cancel') || 'Cancel', style: 'cancel' },
      {
        text: t('common.ok') || 'OK',
        onPress: async () => {
          try {
            const res = await api.delete(`/company/properties/images/${videoId}`);
            if (res.data?.success) {
              setExistingVideos(prev => prev.filter(i => i.id !== videoId));
            } else {
              Alert.alert(t('common.error'), res.data?.message || t('common.error'));
            }
          } catch (e: any) {
            console.error(e);
            Alert.alert(t('common.error'), e?.response?.data?.message || t('common.error'));
          }
        }
      }
    ]);
  };

  const deleteImage = async (imageId: number) => {
    Alert.alert(t('common.confirm'), t('common.confirmDelete') || 'Are you sure?', [
      { text: t('common.cancel') || 'Cancel', style: 'cancel' },
      {
        text: t('common.ok') || 'OK',
        onPress: async () => {
          try {
            const res = await api.delete(`/company/properties/images/${imageId}`);
            if (res.data?.success) {
              setExistingImages(prev => prev.filter(i => i.id !== imageId));
            } else {
              Alert.alert(t('common.error'), res.data?.message || t('common.error'));
            }
          } catch (e: any) {
            console.error(e);
            Alert.alert(t('common.error'), e?.response?.data?.message || t('common.error'));
          }
        }
      }
    ]);
  };

  const handleSubmit = async () => {
    if (!formData.type || !formData.price || !formData.area || !formData.description) {
      Alert.alert(t('common.error'), t('addProperty.validation.required'));
      return;
    }

    setSaving(true);

    try {
      const propertyData = {
        ...formData,
        price: parseFloat(formData.price),
        bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : undefined,
        bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : undefined,
        areaSqm: formData.areaSqm ? parseInt(formData.areaSqm) : undefined,
        parkingCount: formData.parkingCount ? parseInt(formData.parkingCount) : undefined,
        propertyCondition: formData.propertyCondition || undefined,
        furnishingStatus: formData.furnishingStatus || undefined,
        floorsCount: formData.floorsCount ? parseInt(formData.floorsCount) : undefined,
        floorNumber: formData.floorNumber ? parseInt(formData.floorNumber) : undefined,
        livingRooms: formData.livingRooms ? parseInt(formData.livingRooms) : undefined,
        buildingAge: formData.buildingAge ? parseInt(formData.buildingAge) : undefined,
      };

      await api.patch(`/company/properties/${id}`, propertyData);
      
      Alert.alert(t('common.success'), t('addProperty.validation.successUpdate'), [
        { text: t('common.ok'), onPress: () => router.back() }
      ]);
    } catch (error: any) {
      console.error(error);
      Alert.alert(t('common.error'), error.response?.data?.message || t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  const furnishingOptions = [
    { id: 'furnished', label: t('property.furnished') },
    { id: 'unfurnished', label: t('property.unfurnished') },
    { id: 'semiFurnished', label: t('property.semiFurnished') },
  ];

  const propertyConditionOptions = [
    { id: 'READY', label: t('property.condition.ready') || 'Ready' },
    { id: 'UNDER_CONSTRUCTION', label: t('property.condition.underConstruction') || 'Under construction' },
  ];

  // Conditional Rendering Logic
  const showFurnishing = !['lands', 'under_construction', 'camps'].includes(formData.type);
  const showFloorsCount = ['villas_houses', 'buildings', 'commercial_complexes'].includes(formData.type);
  const showFloorNumber = ['apartments', 'offices', 'studio', 'furnished_apartments'].includes(formData.type);
  const showLivingRooms = ['apartments', 'villas_houses', 'traditional_houses', 'chalets'].includes(formData.type);
  const showBuildingAge = !['lands', 'under_construction', 'camps'].includes(formData.type);
  const showBedrooms = !['lands', 'offices', 'shops', 'warehouses', 'halls', 'misc'].includes(formData.type);
  const showBathrooms = !['lands'].includes(formData.type);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const flexDirection = rowDirection();
  const textAlign = textAlignStart();
  const writingDirection = 'auto' as const;
  const startAlign = alignStart();

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      keyboardVerticalOffset={100}
    >
      <ScrollView 
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 50 }}
        keyboardShouldPersistTaps="handled" 
      >
      <View style={styles.form}>
        <Text style={[styles.title, { textAlign, alignSelf: startAlign, fontSize: 20, fontWeight: 'bold', marginBottom: 20 }]}>{t('addProperty.editTitle') || 'Edit Property'}</Text>

        {/* 1. Title */}
        <Text style={[styles.label, { textAlign }]}>{t('property.title')} *</Text>
        <TextInput
          style={[styles.input, { textAlign: 'auto', writingDirection }]}
          value={formData.title}
          onChangeText={(text) => setFormData({...formData, title: text})}
          placeholder={t('addProperty.titlePlaceholder') || 'Property Title'}
          returnKeyType="next"
          onSubmitEditing={() => priceRef.current?.focus()}
          blurOnSubmit={false}
        />

        {/* 2. Purpose */}
        <Text style={[styles.label, { textAlign }]}>{t('addProperty.purpose')} *</Text>
        <View style={[styles.row, { flexDirection }]}>
          <TouchableOpacity 
            style={[styles.option, formData.purpose === 'sale' && styles.optionSelected]}
            onPress={() => setFormData({...formData, purpose: 'sale'})}
          >
            <Text style={[styles.optionText, formData.purpose === 'sale' && styles.optionTextSelected]}>{t('home.forSale')}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.option, formData.purpose === 'rent' && styles.optionSelected]}
            onPress={() => setFormData({...formData, purpose: 'rent'})}
          >
            <Text style={[styles.optionText, formData.purpose === 'rent' && styles.optionTextSelected]}>{t('home.forRent')}</Text>
          </TouchableOpacity>
        </View>

        {/* 3. Type */}
        <Text style={[styles.label, { textAlign }]}>{t('addProperty.type')} *</Text>
        <ModalSelector
          label=""
          placeholder={t('addProperty.type') || 'Type'}
          options={propertyTypes.map(p => ({ id: p.id, label: p.label }))}
          selectedId={formData.type}
          onSelect={(id) => setFormData(prev => ({ ...prev, type: id }))}
        />

        {/* 4. Price & Negotiable */}
        <Text style={[styles.label, { textAlign }]}>{t('addProperty.price')} *</Text>
        <TextInput
          ref={priceRef}
          style={[styles.input, { textAlign, writingDirection }]}
          keyboardType="numeric"
          value={formData.price}
          onChangeText={(text) => setFormData({...formData, price: text})}
          returnKeyType="next"
          // We can't guarantee which field comes next due to conditional rendering,
          returnKeyType="done"
          onSubmitEditing={() => Keyboard.dismiss()}
        />

        <View style={[styles.toggleRow, { flexDirection }]}>
          <Text style={[styles.toggleLabel, { textAlign }]}>{t('addProperty.negotiable')}</Text>
          <Switch
            value={formData.isNegotiable}
            onValueChange={(val) => setFormData(prev => ({ ...prev, isNegotiable: val }))}
          />
        </View>

        {/* 5. Contact Options */}
        <View style={[styles.toggleRow, { flexDirection }]}>
          <Text style={[styles.toggleLabel, { textAlign }]}>{t('addProperty.showPhoneNumber')}</Text>
          <Switch
            value={formData.showPhoneNumber}
            onValueChange={(val) => setFormData(prev => ({ ...prev, showPhoneNumber: val }))}
          />
        </View>

        <View style={[styles.toggleRow, { flexDirection }]}>
          <Text style={[styles.toggleLabel, { textAlign }]}>{t('addProperty.enableWhatsApp')}</Text>
          <Switch
            value={formData.enableWhatsApp}
            onValueChange={(val) => setFormData(prev => ({ ...prev, enableWhatsApp: val }))}
          />
        </View>

        {/* 6. Location (Governorate & Area) */}
        <View style={[styles.row, { flexDirection }]}>
          <View style={{ flex: 1, marginEnd: 10 }}>
            <ModalSelector
              label={t('addProperty.governorate') + ' *'}
              placeholder={t('property.form.selectGovernorate') || 'Select Governorate'}
              options={governorates.map(g => ({
                id: g.id.toString(),
                label: language === 'ar' ? g.nameAr : g.nameEn
              }))}
              selectedId={selectedGovernorateId}
              onSelect={handleGovernorateSelect}
            />
          </View>
          <View style={{ flex: 1 }}>
            <ModalSelector
              label={t('addProperty.area') + ' *'}
              placeholder={t('property.form.selectArea') || 'Select Area'}
              options={areas.map(a => ({
                id: a.id.toString(),
                label: language === 'ar' ? a.nameAr : a.nameEn
              }))}
              selectedId={selectedAreaId}
              onSelect={handleAreaSelect}
              disabled={!selectedGovernorateId}
            />
          </View>
        </View>

        {/* 7. Details Grid */}
        {showFurnishing && (
          <ModalSelector
            label={t('property.furnishingStatus')}
            options={furnishingOptions}
            selectedId={formData.furnishingStatus}
            onSelect={(id) => setFormData({...formData, furnishingStatus: id})}
            placeholder={t('property.furnishingStatus')}
          />
        )}

        <View style={[styles.row, { gap: 10, flexWrap: 'wrap', flexDirection, marginTop: 10 }]}>
          {showBedrooms && (
            <View style={{ width: '30%' }}>
              <Text style={[styles.label, { textAlign }]}>{t('addProperty.bedrooms')}</Text>
              <TextInput
                ref={bedroomRef}
                style={[styles.input, { textAlign, writingDirection }]}
                keyboardType="numeric"
                value={formData.bedrooms}
                onChangeText={(text) => setFormData({...formData, bedrooms: text})}
                returnKeyType="next"
                onSubmitEditing={() => {
                   if (showBathrooms && bathroomRef.current) bathroomRef.current.focus();
                   else areaRef.current?.focus();
                }}
              />
            </View>
          )}
          {showBathrooms && (
            <View style={{ width: '30%' }}>
              <Text style={[styles.label, { textAlign }]}>{t('addProperty.bathrooms')}</Text>
              <TextInput
                ref={bathroomRef}
                style={[styles.input, { textAlign, writingDirection }]}
                keyboardType="numeric"
                value={formData.bathrooms}
                onChangeText={(text) => setFormData({...formData, bathrooms: text})}
                returnKeyType="next"
                onSubmitEditing={() => areaRef.current?.focus()}
              />
            </View>
          )}
          <View style={{ width: '30%' }}>
            <Text style={[styles.label, { textAlign }]}>{t('addProperty.areaSqm')}</Text>
            <TextInput
              ref={areaRef}
              style={[styles.input, { textAlign, writingDirection }]}
              keyboardType="numeric"
              value={formData.areaSqm}
              onChangeText={(text) => setFormData({...formData, areaSqm: text})}
              returnKeyType="next"
              onSubmitEditing={() => {
                  if (showLivingRooms && livingRef.current) livingRef.current.focus();
                  else if (showFloorsCount && floorsCountRef.current) floorsCountRef.current.focus();
                  else if (showFloorNumber && floorNumRef.current) floorNumRef.current.focus();
                  else if (showBuildingAge && ageRef.current) ageRef.current.focus();
                  else if (parkingRef.current) parkingRef.current.focus();
                  else descriptionRef.current?.focus();
              }}
            />
          </View>
          {showLivingRooms && (
            <View style={{ width: '30%' }}>
              <Text style={[styles.label, { textAlign }]}>{t('property.livingRooms')}</Text>
              <TextInput
                ref={livingRef}
                style={[styles.input, { textAlign, writingDirection }]}
                placeholder="0"
                keyboardType="numeric"
                value={formData.livingRooms}
                onChangeText={(text) => setFormData({...formData, livingRooms: text})}
                returnKeyType="next"
                onSubmitEditing={() => {
                   if (showFloorsCount && floorsCountRef.current) floorsCountRef.current.focus();
                   else if (showFloorNumber && floorNumRef.current) floorNumRef.current.focus();
                   else if (showBuildingAge && ageRef.current) ageRef.current.focus();
                   else if (parkingRef.current) parkingRef.current.focus();
                   else descriptionRef.current?.focus();
                }}
              />
            </View>
          )}
          {showFloorsCount && (
            <View style={{ width: '30%' }}>
              <Text style={[styles.label, { textAlign }]}>{t('property.floorsCount')}</Text>
              <TextInput
                ref={floorsCountRef}
                style={[styles.input, { textAlign, writingDirection }]}
                placeholder="0"
                keyboardType="numeric"
                value={formData.floorsCount}
                onChangeText={(text) => setFormData({...formData, floorsCount: text})}
                returnKeyType="next"
                onSubmitEditing={() => {
                   if (showBuildingAge && ageRef.current) ageRef.current.focus();
                   else if (parkingRef.current) parkingRef.current.focus();
                   else descriptionRef.current?.focus();
                }}
              />
            </View>
          )}
          {showFloorNumber && (
            <View style={{ width: '30%' }}>
              <Text style={[styles.label, { textAlign }]}>{t('property.floorNumber')}</Text>
              <TextInput
                ref={floorNumRef}
                style={[styles.input, { textAlign, writingDirection }]}
                placeholder="0"
                keyboardType="numeric"
                value={formData.floorNumber}
                onChangeText={(text) => setFormData({...formData, floorNumber: text})}
                returnKeyType="next"
                onSubmitEditing={() => {
                   if (showBuildingAge && ageRef.current) ageRef.current.focus();
                   else if (parkingRef.current) parkingRef.current.focus();
                   else descriptionRef.current?.focus();
                }}
              />
            </View>
          )}
          {showBuildingAge && (
            <View style={{ width: '30%' }}>
              <Text style={[styles.label, { textAlign }]}>{t('property.buildingAge')}</Text>
              <TextInput
                ref={ageRef}
                style={[styles.input, { textAlign, writingDirection }]}
                placeholder="0"
                keyboardType="numeric"
                value={formData.buildingAge}
                onChangeText={(text) => setFormData({...formData, buildingAge: text})}
                returnKeyType="next"
                onSubmitEditing={() => parkingRef.current?.focus()}
              />
            </View>
          )}
        </View>

        <View style={[styles.row, { gap: 10, flexWrap: 'wrap', flexDirection }]}>
          <View style={{ width: '48%' }}>
            <Text style={[styles.label, { textAlign }]}>{t('property.parkingCount') || 'Parking count'}</Text>
            <TextInput
              ref={parkingRef}
              style={[styles.input, { textAlign, writingDirection }]}
              placeholder="0"
              keyboardType="numeric"
              value={formData.parkingCount}
              onChangeText={(text) => setFormData({ ...formData, parkingCount: text })}
              returnKeyType="next"
              onSubmitEditing={() => descriptionRef.current?.focus()}
            />
          </View>
          <View style={{ width: '48%' }}>
            <ModalSelector
              label={t('property.conditionLabel') || 'Property condition'}
              options={propertyConditionOptions}
              selectedId={formData.propertyCondition}
              onSelect={(id) => setFormData({ ...formData, propertyCondition: id })}
              placeholder={t('property.conditionPlaceholder') || 'Select condition'}
            />
          </View>
        </View>

        {/* 8. Description */}
        <Text style={[styles.label, { textAlign }]}>{t('addProperty.description')} *</Text>
        <TextInput
          ref={descriptionRef}
          style={[styles.input, styles.textArea, { textAlign, writingDirection }]}
          multiline
          numberOfLines={4}
          value={formData.description}
          onChangeText={(text) => setFormData({...formData, description: text})}
        />

        {/* 9. Videos */}
        <Text style={[styles.label, { textAlign, marginTop: 16 }]}>{t('addProperty.video') || 'Property Videos'} ({existingVideos.length}/5)</Text>
        <View style={styles.videoBox}>
             {existingVideos.length > 0 ? (
                existingVideos.map((vid, index) => (
                    <View key={vid.id} style={{ 
                        flexDirection: 'row',
                        alignItems: 'center', 
                        backgroundColor: '#fff',  
                        padding: 8, 
                        borderRadius: 6, 
                        marginBottom: 6,
                        borderBottomWidth: 1,
                        borderBottomColor: '#eee'
                    }}>
                         <Text style={{ flex: 1, marginHorizontal: 10, textAlign: 'auto', color: '#2c3e50' }} numberOfLines={1}>
                            {vid.fileName || `Video ${index + 1}`}
                        </Text>
                        <TouchableOpacity onPress={() => Linking.openURL(vid.imageUrl)} style={{ marginRight: 10 }}>
                             <Text style={{ color: '#3498db' }}>{t('addProperty.viewVideo') || 'View'}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            onPress={() => deleteVideo(vid.id)} 
                            style={{ padding: 5, backgroundColor: '#ffebee', borderRadius: 4 }}
                        >
                            <Text style={{ color: 'red', fontWeight: 'bold' }}>X</Text>
                        </TouchableOpacity>
                    </View>
                ))
            ) : (
                <Text style={styles.videoMutedText}>{t('addProperty.noVideo') || 'No videos uploaded'}</Text>
            )}

            {loadingVideo && <ActivityIndicator size="small" color="#000" style={{ marginVertical: 10 }} />}
            
            <TouchableOpacity 
                style={[styles.option, { marginTop: 10, alignSelf: startAlign, opacity: existingVideos.length >= 5 ? 0.5 : 1 }]} 
                onPress={pickAndUploadVideo}
                disabled={existingVideos.length >= 5 || loadingVideo}
            >
                <Text style={styles.optionText}>
                    {existingVideos.length >= 5 ? (t('addProperty.maxVideosReached') || 'Max 5 Videos') : (t('addProperty.addVideo') || 'Add Video')}
                </Text>
            </TouchableOpacity>
        </View>

        {/* 10. Images */}
        <Text style={[styles.label, { textAlign, marginTop: 16 }]}>{t('addProperty.images') || 'Images'}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
          {existingImages.length > 0 ? (
            existingImages.map(img => (
              <View key={img.id} style={{ marginEnd: 10, position: 'relative' }}>
                <Image source={{ uri: img.imageUrl.startsWith('http') ? img.imageUrl : `${(api.defaults.baseURL || '')}${img.imageUrl.startsWith('/') ? '' : '/'}${img.imageUrl}` }} style={{ width: 120, height: 80, borderRadius: 8 }} />
                <TouchableOpacity onPress={() => deleteImage(img.id)} style={{ position: 'absolute', top: 6, end: 6, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 12, padding: 4 }}>
                  <Text style={{ color: 'white', fontSize: 12 }}>X</Text>
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <Text style={{ color: '#999' }}>{t('addProperty.noImages') || 'No images'}</Text>
          )}
        </ScrollView>

        <TouchableOpacity style={[styles.option, { alignSelf: startAlign }]} onPress={pickAndUploadImages}>
          <Text style={styles.optionText}>{t('addProperty.addImages') || 'Add Images'}</Text>
        </TouchableOpacity>

        {/* 11. Submit */}
        <TouchableOpacity 
          style={[styles.submitButton, saving && styles.disabledButton, { marginTop: 30 }]}
          onPress={handleSubmit}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.submitButtonText}>{t('addProperty.saveButton')}</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  form: {
    padding: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
  toggleRow: {
    marginTop: 10,
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fafafa',
    padding: 10,
    borderRadius: 8,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#34495e',
    flex: 1,
    marginEnd: 12,
  },
    color: '#34495e',
    marginBottom: 8,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  option: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  optionSelected: {
    backgroundColor: '#3498db',
    borderColor: '#3498db',
  },
  optionText: {
    color: '#34495e',
    fontWeight: 'bold',
  },
  optionTextSelected: {
    color: 'white',
  },
  videoBox: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#f9f9f9',
    marginBottom: 10,
  },
  videoLinkText: {
    color: '#3498db',
    textDecorationLine: 'underline',
    marginBottom: 6,
  },
  videoMutedText: {
    color: '#999',
    marginBottom: 6,
  },
  videoSelectedText: {
    color: '#2c3e50',
    marginBottom: 6,
  },
  submitButton: {
    backgroundColor: '#f39c12',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 50,
  },
  disabledButton: {
    backgroundColor: '#95a5a6',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
