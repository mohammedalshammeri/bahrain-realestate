import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, TouchableOpacity, Image as RNImage, Platform, Alert, Switch, KeyboardAvoidingView, InputAccessoryView, Keyboard } from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import api from '../../src/api/api';
import { Button } from '../../src/components/Button';
import { useToast } from '../../src/context/ToastContext';
import { useLanguageStore } from '../../src/store/languageStore';
import { storage } from '../../src/utils/storage';
import { ModalSelector } from '../../src/components/ModalSelector';
import { useLocationStore } from '../../src/store/locationStore';
import { Governorate, Area, GovernorateListResponse, AreaListResponse } from '../../src/types/location';
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist';
import { alignStart, rowDirection } from '../../src/utils/rtl';

const INITIAL_FORM_STATE = {
  status: 'DRAFT',
  title: '',
  type: '',
  purpose: 'sale',
  price: '',
  isNegotiable: false,
  parkingCount: '',
  propertyCondition: '',
  coverImageUri: '',
  showPhoneNumber: true,
  enableWhatsApp: true,
  governorateId: '',
  areaId: '',
  description: '',
  locationLat: '',
  locationLng: '',
  bedrooms: '',
  bathrooms: '',
  areaSqm: '',
  furnishingStatus: '',
  floorsCount: '',
  floorNumber: '',
  livingRooms: '',
  buildingAge: '',
};

export default function AddProperty() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { action, propertyData, selectedLatitude, selectedLongitude } = params;
  const { showToast } = useToast();
  const { language } = useLanguageStore();
  const { tempSelectedLocation, setTempSelectedLocation } = useLocationStore();
  
  const scrollViewRef = useRef<ScrollView>(null);
  const locationSectionY = useRef<number>(0);

  // Refs for Auto-Focus
  const titleRef = useRef<TextInput>(null);
  const priceRef = useRef<TextInput>(null);
  const bedroomsRef = useRef<TextInput>(null);
  const bathroomsRef = useRef<TextInput>(null);
  const areaSqmRef = useRef<TextInput>(null);
  const livingRoomsRef = useRef<TextInput>(null);
  const floorsCountRef = useRef<TextInput>(null);
  const floorNumberRef = useRef<TextInput>(null);
  const buildingAgeRef = useRef<TextInput>(null);
  const parkingCountRef = useRef<TextInput>(null);
  const descriptionRef = useRef<TextInput>(null);

  const focusAvailable = (...refs: Array<React.RefObject<TextInput | null>>) => {
    for (const ref of refs) {
      if (ref.current) {
        ref.current.focus();
        return;
      }
    }
  };

  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [videos, setVideos] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [isDraftLoaded, setIsDraftLoaded] = useState(false);
  
  const [governorates, setGovernorates] = useState<Governorate[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  
  const [formData, setFormData] = useState({ ...INITIAL_FORM_STATE });

  // Handle location selection returned from map via Global Store
  useFocusEffect(
    useCallback(() => {
        if (tempSelectedLocation) {
             const { lat, lng } = tempSelectedLocation;
             
             setFormData((p) => ({
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
             
             setTempSelectedLocation(null);
        }
    }, [tempSelectedLocation])
  );

  // Load draft on component mount
  useEffect(() => {
    // Only fetch governorates initially, loadDraft will handle data
    fetchGovernorates();
    
    // If coming fresh to add screen (no action or action is just location_selected), handle accordingly
    if (!action || action === 'location_selected') {
      loadDraft(); // This will handle location_selected properly
    } else {
      loadDraft();
    }
  }, []); // Removed tempSelectedLocation dependency to prevent overwriting new location with old draft

  // Handle navigation params (from preview screen)
  useEffect(() => {
    if (action === 'publish' && propertyData) {
      const pData = JSON.parse(propertyData as string);
      
      // Submit immediately using the parsed data, bypassing the race condition
      handleSubmitDirectly(pData); 
    } else if (action === 'edit' && propertyData) {
      const pData = JSON.parse(propertyData as string);
      setFormData(prev => ({ ...prev, ...pData }));
      const normalizedImages = (pData.images || []).map((img: any) =>
        typeof img === 'string' ? ({ uri: img } as ImagePicker.ImagePickerAsset) : img
      );
      setImages(normalizedImages);
    } 
    // Note: 'location_selected' is now handled inside loadDraft to prevent race conditions
  }, [action, propertyData]);

  useEffect(() => {
    if (formData.governorateId) {
      fetchAreas(formData.governorateId);
    } else {
      setAreas([]);
    }
  }, [formData.governorateId]);

  // Auto-save draft
  useEffect(() => {
    if (isDraftLoaded) {
      saveDraft();
    }
  }, [formData, images, videos]);

  // Ensure cover image is always valid; default to first image.
  useEffect(() => {
    if (images.length === 0) {
      if (formData.coverImageUri) {
        setFormData(prev => ({ ...prev, coverImageUri: '' }));
      }
      return;
    }

    const coverExists = !!formData.coverImageUri && images.some(img => img.uri === formData.coverImageUri);
    if (!coverExists) {
      setFormData(prev => ({ ...prev, coverImageUri: images[0]?.uri || '' }));
    }
  }, [images]);

  // Draft management functions
  const saveDraft = async () => {
    try {
      const draftData = {
        formData,
        images,
        videos: videos.map(v => ({
            uri: v.uri,
            fileName: v.fileName,
            mimeType: v.mimeType || 'video/mp4',
        })),
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem('property_draft', JSON.stringify(draftData));
    } catch (error) {
      console.error('Error saving draft:', error);
    }
  };

  const loadDraft = async () => {
    try {
      const draftString = await AsyncStorage.getItem('property_draft');
      if (draftString) {
        const draftData = JSON.parse(draftString);
        let loadedFormData = draftData.formData || formData;
        
        // If returning from location picker via Store (priority) or params
        // Note: useFocusEffect handles the Store part, but if params are present (backward compat)
        if (tempSelectedLocation) {
           loadedFormData = {
             ...loadedFormData,
             locationLat: tempSelectedLocation.lat,
             locationLng: tempSelectedLocation.lng
           };
        } else if (action === 'location_selected' && selectedLatitude && selectedLongitude) {
           loadedFormData = {
             ...loadedFormData,
             locationLat: selectedLatitude as string,
             locationLng: selectedLongitude as string
           };
        }

        setFormData(loadedFormData);
        setImages(draftData.images || []);
        
        // Handle migration from single video to multiple videos
        if (draftData.videos && Array.isArray(draftData.videos)) {
            setVideos(draftData.videos);
        } else if (draftData.video) {
            setVideos([draftData.video]);
        } else {
            setVideos([]);
        }

        setIsDraftLoaded(true);
        if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
           console.log('Draft loaded with images count:', (draftData.images || []).length);
        }
        showToast(t('draft.loaded') || 'Draft loaded', 'info');
      } else if (action === 'location_selected' && selectedLatitude && selectedLongitude) {
         // No draft exists, but we have a location selection
         setFormData(prev => ({
            ...prev,
            locationLat: selectedLatitude as string,
            locationLng: selectedLongitude as string
         }));
         setIsDraftLoaded(true); // Treat as loaded so we can start saving
      } else {
        // No draft exists and no special action, keep form clean
        if (!action) {
          setFormData({ ...INITIAL_FORM_STATE });
          setImages([]);
        }
        setIsDraftLoaded(true); // No draft, safe to start saving new changes
      }
    } catch (error) {
      console.error('Error loading draft:', error);
      setIsDraftLoaded(true); // Ensure we don't block saving forever on error
    }
  };

  const clearDraft = async () => {
    try {
      await AsyncStorage.removeItem('property_draft');
      setIsDraftLoaded(false);
    } catch (error) {
      console.error('Error clearing draft:', error);
    }
  };

  const resetForm = () => {
    setFormData({ ...INITIAL_FORM_STATE });
    setImages([]);
    setAreas([]);
  };

  // Image validation
  const validateImage = (image: ImagePicker.ImagePickerAsset): boolean => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    if (image.fileSize && image.fileSize > maxSize) {
      showToast(t('validation.imageSize') || 'Image size must be less than 10MB', 'error');
      return false;
    }

    // Expo ImagePicker returns 'image' as type, not mime type.
    // We already filter by mediaTypes: ['images'] in launchImageLibraryAsync
    if (image.type === 'video') { 
       showToast(t('validation.imageType') || 'Only images are allowed', 'error');
       return false;
    }

    return true;
  };

  // Duplicate property detection (basic)
  const checkDuplicateProperty = async (): Promise<boolean> => {
    try {
      // This is a basic check - in production, you'd want more sophisticated logic
      const duplicateCheck = {
        type: formData.type,
        governorate: governorates.find(g => g.id.toString() === formData.governorateId)?.nameEn,
        area: areas.find(a => a.id.toString() === formData.areaId)?.nameEn,
        price: parseFloat(formData.price),
        bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : null,
        bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : null,
      };

      // For now, just check if there's a similar property in local storage
      // In production, this would be an API call
      const recentProperties = await AsyncStorage.getItem('recent_properties');
      if (recentProperties) {
        const properties = JSON.parse(recentProperties);
        const isDuplicate = properties.some((prop: any) => 
          prop.type === duplicateCheck.type &&
          prop.governorate === duplicateCheck.governorate &&
          prop.area === duplicateCheck.area &&
          Math.abs(prop.price - duplicateCheck.price) < 1000 // Within 1000 BD
        );

        if (isDuplicate) {
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Error checking duplicates:', error);
      return false;
    }
  };

  const fetchGovernorates = async () => {
    try {
      const response = await api.get<GovernorateListResponse>('/public/governorates');
      if (response.data.success) {
        setGovernorates(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching governorates:', error);
    }
  };

  const fetchAreas = async (govId: string) => {
    try {
      const response = await api.get<AreaListResponse>(`/public/governorates/${govId}/areas`);
      if (response.data.success) {
        setAreas(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching areas:', error);
    }
  };

  const pickVideo = async () => {
    if (videos.length >= 5) {
      showToast(t('addProperty.maxVideosReached') || 'Maximum 5 videos allowed', 'error');
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

      const availableSlots = 5 - videos.length;
      const finalVideos = filteredAssets.slice(0, availableSlots);
      
      if (finalVideos.length < result.assets.length) {
        showToast(t('addProperty.maxVideosReached') || 'Maximum 5 videos allowed', 'error');
      }
      
      setVideos(prev => [...prev, ...finalVideos]);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      const validImages = result.assets.filter(validateImage);
      if (validImages.length > 0) {
        setImages([...images, ...validImages]);
      }
    }
  };

  const removeImage = (index: number) => {
    const newImages = [...images];
    const removedUri = newImages[index]?.uri;
    newImages.splice(index, 1);
    setImages(newImages);

    if (removedUri && removedUri === formData.coverImageUri) {
      setFormData(prev => ({ ...prev, coverImageUri: newImages[0]?.uri || '' }));
    }
  };

  const setCoverImage = (uri: string) => {
    setFormData(prev => ({ ...prev, coverImageUri: uri }));
  };

  const handleSubmitDirectly = async (propertyData: any) => {
    try {
      setLoading(true);
      
      // Parse the images from property data  
      const propertyImages = propertyData.images || [];
      const imageAssets = propertyImages.map((img: any) => 
        typeof img === 'string' ? ({ uri: img } as ImagePicker.ImagePickerAsset) : img
      );

      // Find names for display
      const selectedGovernorate = governorates.find(g => g.id.toString() === propertyData.governorateId);
      const selectedArea = areas.find(a => a.id.toString() === propertyData.areaId);

      // 1. Create Property
      const submitData = {
        title: propertyData.title?.trim() || '',
        type: propertyData.type,
        purpose: propertyData.purpose || 'sale',
        price: parseFloat(propertyData.price),
        governorate: selectedGovernorate ? (selectedGovernorate.nameEn || selectedGovernorate.name) : propertyData.governorate || '',
        area: selectedArea ? (selectedArea.nameEn || selectedArea.name) : propertyData.area || '',
        description: propertyData.description || '',
        locationLat: propertyData.locationLat ? parseFloat(propertyData.locationLat) : undefined,
        locationLng: propertyData.locationLng ? parseFloat(propertyData.locationLng) : undefined,
        bedrooms: propertyData.bedrooms ? parseInt(propertyData.bedrooms) : undefined,
        bathrooms: propertyData.bathrooms ? parseInt(propertyData.bathrooms) : undefined,
        areaSqm: propertyData.areaSqm ? parseInt(propertyData.areaSqm) : undefined,
        parkingCount: propertyData.parkingCount ? parseInt(propertyData.parkingCount) : undefined,
        condition: propertyData.propertyCondition || undefined,
        furnishingStatus: propertyData.furnishingStatus || undefined,
        floorsCount: propertyData.floorsCount ? parseInt(propertyData.floorsCount) : undefined,
        floorNumber: propertyData.floorNumber ? parseInt(propertyData.floorNumber) : undefined,
        livingRooms: propertyData.livingRooms ? parseInt(propertyData.livingRooms) : undefined,
        buildingAge: propertyData.buildingAge ? parseInt(propertyData.buildingAge) : undefined,
        negotiable: propertyData.isNegotiable || false,
        showPhone: propertyData.showPhoneNumber !== false,
        enableWhatsapp: propertyData.enableWhatsApp !== false,
      };

      const response = await api.post('/company/properties', submitData);
      
      if (response.data.success) {
        const propertyId = response.data.data.id;

        // 2. Upload Images/Video if any
        const formDataImages = new FormData();
        
        let publishVideos = [];
        if (propertyData?.videos && Array.isArray(propertyData.videos)) {
            publishVideos = propertyData.videos;
        } else if (propertyData?.video) {
            publishVideos = [propertyData.video];
        } else {
            publishVideos = videos;
        }

        // رفع الفيديوهات أولاً منفصلة
        if (publishVideos.length > 0) {
          const formDataVideos = new FormData();
          
          if (Platform.OS === 'web') {
            for (const vid of publishVideos) {
                const videoResponse = await fetch(vid.uri);
                const videoBlob = await videoResponse.blob();
                const videoName = vid.fileName || `video_${Date.now()}.mp4`;
                formDataVideos.append('videos', videoBlob, videoName);
            }
          } else {
            publishVideos.forEach((vid: any, index: number) => {
                 // @ts-ignore
                formDataVideos.append('videos', {
                uri: vid.uri,
                name: vid.fileName || `video_${index}.mp4`,
                type: vid.mimeType || 'video/mp4',
                });
            });
          }

          // إرسال الفيديوهات منفصلة
          const token = await storage.getItem('auth_token');
          const apiUrl = process.env.EXPO_PUBLIC_API_URL;
          
          const videoUploadResponse = await fetch(`${apiUrl}/company/properties/${propertyId}/images`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json',
            },
            body: formDataVideos,
          });

          if (!videoUploadResponse.ok) {
            console.error('Video upload failed:', await videoUploadResponse.text());
          }
        }

        // رفع الصور منفصلة
        if (imageAssets.length > 0) {
          if (Platform.OS === 'web') {
            for (let i = 0; i < imageAssets.length; i++) {
              const img = imageAssets[i];
              const response = await fetch(img.uri);
              const blob = await response.blob();
              formDataImages.append('images', blob, `image_${i}.jpg`);
            }
          } else {
            imageAssets.forEach((img: ImagePicker.ImagePickerAsset, index: number) => {
              // @ts-ignore
              formDataImages.append('images', {
                uri: img.uri,
                type: 'image/jpeg',
                name: `image_${index}.jpg`,
              });
            });
          }
        }

        // إرسال الصور فقط إذا كانت موجودة
        if (imageAssets.length > 0) {
          const token = await storage.getItem('auth_token');
          const apiUrl = process.env.EXPO_PUBLIC_API_URL;
          
          const uploadResponse = await fetch(`${apiUrl}/company/properties/${propertyId}/images`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json',
            },
            body: formDataImages,
          });

          if (!uploadResponse.ok) {
            const errorData = await uploadResponse.json();
            throw new Error(errorData.message || 'Upload failed');
          }
        }

        // Clear draft and reset form
        await clearDraft();
        resetForm();

        showToast(t('addProperty.validation.successAdd'), 'success');
        
        // Navigate directly to dashboard
        setTimeout(() => {
          router.replace('/company');
        }, 1000);
      }
    } catch (error: any) {
      console.error(error);
      showToast(error.response?.data?.message || t('common.error'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (skipPreview = false, ignoreDuplicates = false, dataOverride?: any) => {
    // Use dataOverride if provided, otherwise use formData
    const dataToValidate = dataOverride || formData;

    // Basic validation logging
    console.log('Validating form data:', {
      title: !!dataToValidate.title?.trim(),
      type: !!dataToValidate.type,
      price: !!dataToValidate.price,
      governorateId: !!dataToValidate.governorateId,
      areaId: !!dataToValidate.areaId,
      description: !!dataToValidate.description,
      videosCount: videos.length
    });

    if (!dataToValidate.title?.trim() || !dataToValidate.type || !dataToValidate.price || !dataToValidate.governorateId || !dataToValidate.areaId || !dataToValidate.description) {
      showToast(t('addProperty.validation.required'), 'error');
      return;
    }

    // Check for duplicates
    if (!ignoreDuplicates) {
      const hasDuplicate = await checkDuplicateProperty();
      if (hasDuplicate) {
        Alert.alert(
          t('duplicate.title') || 'Possible Duplicate',
          t('duplicate.message') || 'A similar property already exists. Do you want to continue?',
          [
            { text: t('common.cancel') || 'Cancel', style: 'cancel' },
            { 
              text: t('common.continue') || 'Continue', 
              style: 'default',
              onPress: () => handleSubmit(skipPreview, true, dataToValidate)
            }
          ]
        );
        return;
      }
    }

    if (!skipPreview) {
      // Navigate to preview screen
      const selectedGovernorate = governorates.find(g => g.id.toString() === dataToValidate.governorateId);
      const selectedArea = areas.find(a => a.id.toString() === dataToValidate.areaId);

      const coverImageUri = dataToValidate.coverImageUri || images[0]?.uri || '';

      const previewData = {
        ...dataToValidate,
        // Individual workflow: treat entered price as the minimum requested price.
        minimumPrice: dataToValidate.price,
        status: 'PENDING_ADMIN',
        governorate: selectedGovernorate ? (selectedGovernorate.nameEn || selectedGovernorate.name) : '',
        area: selectedArea ? (selectedArea.nameEn || selectedArea.name) : '',
        images: images.map(img => img.uri),
        coverImageUri,
        imagesMeta: images.map(img => ({ uri: img.uri, isCover: img.uri === coverImageUri })),
        // Support multiple videos while keeping `video` for backward compatibility
        videos: videos.map(v => ({ uri: v.uri, fileName: v.fileName, mimeType: v.mimeType })),
        video: videos.length > 0 ? { uri: videos[0].uri, fileName: videos[0].fileName, mimeType: videos[0].mimeType } : null,
      };

      router.push({
        pathname: '/company/preview',
        params: { propertyData: JSON.stringify(previewData) }
      });
      return;
    }

    // Proceed with actual submission
    setLoading(true);

    try {
      // Find names
      const selectedGovernorate = governorates.find(g => g.id.toString() === dataToValidate.governorateId);
      const selectedArea = areas.find(a => a.id.toString() === dataToValidate.areaId);

      // 1. Create Property
      const propertyData = {
        ...dataToValidate,
        // Individual workflow: property is sent to admin (not published).
        status: 'PENDING_ADMIN',
        title: dataToValidate.title.trim(),
        governorate: selectedGovernorate ? (selectedGovernorate.nameEn || selectedGovernorate.name) : '',
        area: selectedArea ? (selectedArea.nameEn || selectedArea.name) : '',
        // Backward compatibility: keep sending `price` since existing API expects it.
        // New backend can also read `minimumPrice`.
        price: parseFloat(dataToValidate.price),
        minimumPrice: parseFloat(dataToValidate.price),
        bedrooms: dataToValidate.bedrooms ? parseInt(dataToValidate.bedrooms) : undefined,
        bathrooms: dataToValidate.bathrooms ? parseInt(dataToValidate.bathrooms) : undefined,
        areaSqm: dataToValidate.areaSqm ? parseInt(dataToValidate.areaSqm) : undefined,
        parkingCount: dataToValidate.parkingCount ? parseInt(dataToValidate.parkingCount) : undefined,
        propertyCondition: dataToValidate.propertyCondition || undefined,
        furnishingStatus: dataToValidate.furnishingStatus || undefined,
        floorsCount: dataToValidate.floorsCount ? parseInt(dataToValidate.floorsCount) : undefined,
        floorNumber: dataToValidate.floorNumber ? parseInt(dataToValidate.floorNumber) : undefined,
        livingRooms: dataToValidate.livingRooms ? parseInt(dataToValidate.livingRooms) : undefined,
        buildingAge: dataToValidate.buildingAge ? parseInt(dataToValidate.buildingAge) : undefined,
        areaId: parseInt(dataToValidate.areaId),
      };

      const response = await api.post('/company/properties', propertyData);
      
      if (response.data.success) {
        const propertyId = response.data.data.id;

        // 2. Upload Images and Video
        const formDataImages = new FormData();

        // STEP 1 - MOBILE APP: Create ONE FormData for all media
        const formDataMedia = new FormData();
        
        // Add Videos (NO overwrite, NO set - only append)
        console.log('VIDEOS COUNT (MOBILE - Before FormData):', videos.length);
        
        if (Platform.OS === 'web') {
          for (let index = 0; index < videos.length; index++) {
            const vid = videos[index];
            const videoResponse = await fetch(vid.uri);
            const videoBlob = await videoResponse.blob();
            const videoName = vid.fileName || `video_${index}.mp4`;
            formDataMedia.append('videos', videoBlob, videoName);
          }
        } else {
          videos.forEach((video, index) => {
            // @ts-ignore
            formDataMedia.append('videos', {
              uri: video.uri,
              type: 'video/mp4',
              name: `video_${index}.mp4`,
            });
            if (typeof video.duration === 'number') {
              formDataMedia.append('videoDurations', String(video.duration));
            }
          });
        }

        // Add Images
        if (Platform.OS === 'web') {
          for (let i = 0; i < images.length; i++) {
            const img = images[i];
            const response = await fetch(img.uri);
            const blob = await response.blob();
            formDataMedia.append('images', blob, `image_${i}.jpg`);
          }
        } else {
          images.forEach((img, index) => {
            // @ts-ignore
            formDataMedia.append('images', {
              uri: img.uri,
              type: 'image/jpeg',
              name: `image_${index}.jpg`,
            });
          });
        }

        // Send ONE request with all media
        const token = await storage.getItem('auth_token');
        const apiUrl = process.env.EXPO_PUBLIC_API_URL;
        
        const mediaUploadResponse = await fetch(`${apiUrl}/company/properties/${propertyId}/images`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
          body: formDataMedia,
        });

        if (!mediaUploadResponse.ok) {
          console.error('Media upload failed:', await mediaUploadResponse.text());
        } else {
          console.log('VIDEOS COUNT (MOBILE - After Upload):', videos.length);
        }

      // Clear draft and reset form
      await clearDraft();
      resetForm();

      showToast(t('addProperty.validation.successAdd'), 'success');
      
      // Navigate to dashboard after short delay
      setTimeout(() => {
        router.replace('/company');
      }, 1500);
      }
    } catch (error: any) {
      console.error(error);
      showToast(error.response?.data?.message || t('common.error'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const textAlign = 'auto' as const;
  const writingDirection = 'auto' as const;
  const rowDir = rowDirection();
  const startAlign = alignStart();

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
  ];

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

  const renderImageItem = useCallback(({ item, drag, isActive }: RenderItemParams<ImagePicker.ImagePickerAsset>) => (
    <TouchableOpacity
      style={[styles.imageWrapper, isActive && styles.imageWrapperActive]}
      onPress={() => setCoverImage(item.uri)}
      onLongPress={drag}
    >
      <RNImage source={{ uri: item.uri }} style={styles.previewImage} />
      {item.uri === formData.coverImageUri && (
        <View style={styles.coverBadge}>
          <Text style={styles.coverBadgeText}>{t('addProperty.cover') || 'Cover'}</Text>
        </View>
      )}
      <TouchableOpacity 
        style={styles.removeImageButton}
        onPress={() => removeImage(images.indexOf(item))}
      >
        <Text style={styles.removeImageText}>X</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  ), [formData.coverImageUri, images, t]);

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={100}
    >
    <ScrollView 
        ref={scrollViewRef}
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 50 }}
        keyboardShouldPersistTaps="handled"
    >
      <View style={styles.form}>
        <Text style={[styles.title, { textAlign, alignSelf: startAlign, marginBottom: 20 }]}>{t('company.addPropertyTitle')}</Text>
        <Text style={[styles.label, { textAlign }]}>{t('addProperty.purpose')} *</Text>
        <View style={[styles.row, { flexDirection: rowDir }]}>
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

        <ModalSelector
          label={t('addProperty.type') + ' *'}
          options={propertyTypes}
          selectedId={formData.type}
          onSelect={(id) => setFormData({...formData, type: id})}
          placeholder={t('addProperty.typePlaceholder')}
        />

        <Text style={[styles.label, { textAlign }]}>{t('addProperty.title') || 'Listing Title'} *</Text>
        <TextInput
          ref={titleRef}
          returnKeyType="next"
          onSubmitEditing={() => priceRef.current?.focus()}
          blurOnSubmit={false}
          style={[styles.input, { textAlign, writingDirection }]}
          placeholder={t('addProperty.titlePlaceholder') || 'Enter listing title'}
          value={formData.title}
          onChangeText={(text) => setFormData({ ...formData, title: text })}
        />

        <Text style={[styles.label, { textAlign }]}>{t('addProperty.minimumPrice') || t('addProperty.price') || 'Minimum Price'} *</Text>
        <TextInput
          ref={priceRef}
          returnKeyType="done"
          style={[styles.input, { textAlign, writingDirection }]}
          placeholder={t('addProperty.minimumPricePlaceholder') || t('addProperty.pricePlaceholder') || 'Enter minimum acceptable price'}
          keyboardType="numeric"
          value={formData.price}
          onChangeText={(text) => setFormData({...formData, price: text})}
        />

        <View style={[styles.toggleRow, { flexDirection: rowDir }]}
        >
          <Text style={[styles.toggleLabel, { textAlign }]}>{t('addProperty.negotiable') || 'Negotiable price'}</Text>
          <Switch
            value={formData.isNegotiable}
            onValueChange={(value) => setFormData({ ...formData, isNegotiable: value })}
          />
        </View>

        <View style={[styles.toggleRow, { flexDirection: rowDir }]}
        >
          <Text style={[styles.toggleLabel, { textAlign }]}>{t('addProperty.showPhoneNumber') || 'Show phone number'}</Text>
          <Switch
            value={formData.showPhoneNumber}
            onValueChange={(value) => setFormData({ ...formData, showPhoneNumber: value })}
          />
        </View>

        <View style={[styles.toggleRow, { flexDirection: rowDir }]}
        >
          <Text style={[styles.toggleLabel, { textAlign }]}>{t('addProperty.enableWhatsApp') || 'Enable WhatsApp contact'}</Text>
          <Switch
            value={formData.enableWhatsApp}
            onValueChange={(value) => setFormData({ ...formData, enableWhatsApp: value })}
          />
        </View>

        <ModalSelector
          label={t('addProperty.governorate') + ' *'}
          options={governorates.map(g => ({ id: g.id, label: (language === 'ar' ? (g.nameAr || g.nameEn || g.name) : (g.nameEn || g.nameAr || g.name)) || 'Unknown' }))}
          selectedId={formData.governorateId ? parseInt(formData.governorateId) : null}
          onSelect={(id) => setFormData({...formData, governorateId: id.toString(), areaId: ''})}
          placeholder={t('addProperty.governoratePlaceholder')}
        />

        <ModalSelector
          label={t('addProperty.area') + ' *'}
          options={areas.map(a => ({ id: a.id, label: (language === 'ar' ? (a.nameAr || a.nameEn || a.name) : (a.nameEn || a.nameAr || a.name)) || 'Unknown' }))}
          selectedId={formData.areaId ? parseInt(formData.areaId) : null}
          onSelect={(id) => setFormData({...formData, areaId: id.toString()})}
          placeholder={t('addProperty.areaPlaceholder')}
        />
        <View 
             style={{ marginTop: 10 }}
             onLayout={(event) => {
                locationSectionY.current = event.nativeEvent.layout.y;
             }}
        >
          <Text style={[styles.label, { textAlign }]}>{t('addProperty.location')}</Text>
          <TouchableOpacity
            style={[
              styles.locationButton, 
              (!!formData.locationLat && !!formData.locationLng) ? { backgroundColor: '#5DCA74', borderColor: '#4CB563', borderWidth: 2 } : {}
            ]}
            onPress={() => router.push({
              pathname: '/location-picker',
              params: {
                returnPath: '/company/add',
                latitude: formData.locationLat || undefined,
                longitude: formData.locationLng || undefined,
              },
            })}
          >
            <Text style={[
              styles.locationButtonText, 
              (!!formData.locationLat && !!formData.locationLng) ? { color: '#ffffff', fontWeight: 'bold' } : {}
            ]}>
              {formData.locationLat && formData.locationLng
                ? t('location.locationSelectedChange') || 'Location Selected (Tap to change)'
                : t('location.selectOnMap') || 'Select Location on Map (Optional)'
              }
            </Text>
          </TouchableOpacity>
          {!!formData.locationLat && !!formData.locationLng && (
            <TouchableOpacity
              style={[styles.clearLocationButton, { alignSelf: startAlign }]}
              onPress={() => setFormData({...formData, locationLat: '', locationLng: ''})}
            >
              <Text style={styles.clearLocationText}>{t('location.clearLocation') || 'Clear Location'}</Text>
            </TouchableOpacity>
          )}
        </View>

        {showFurnishing && (
          <ModalSelector
            label={t('property.furnishingStatus')}
            options={furnishingOptions}
            selectedId={formData.furnishingStatus}
            onSelect={(id) => setFormData({...formData, furnishingStatus: id})}
            placeholder={t('property.furnishingStatus')}
          />
        )}
        <View style={[styles.row, { gap: 10, flexWrap: 'wrap', flexDirection: rowDir }]}>
          {showBedrooms && (
            <View style={{ width: '30%' }}>
              <Text style={[styles.label, { textAlign }]}>{t('addProperty.bedrooms')}</Text>
              <TextInput
                ref={bedroomsRef}
                returnKeyType="next"
                onSubmitEditing={() => focusAvailable(bathroomsRef, areaSqmRef)}
                blurOnSubmit={false}
                style={[styles.input, { textAlign, writingDirection }]}
                placeholder="0"
                keyboardType="numeric"
                value={formData.bedrooms}
                onChangeText={(text) => setFormData({...formData, bedrooms: text})}
              />
            </View>
          )}
          {showBathrooms && (
            <View style={{ width: '30%' }}>
              <Text style={[styles.label, { textAlign }]}>{t('addProperty.bathrooms')}</Text>
              <TextInput
                ref={bathroomsRef}
                returnKeyType="next"
                onSubmitEditing={() => areaSqmRef.current?.focus()}
                blurOnSubmit={false}
                style={[styles.input, { textAlign, writingDirection }]}
                placeholder="0"
                keyboardType="numeric"
                value={formData.bathrooms}
                onChangeText={(text) => setFormData({...formData, bathrooms: text})}
              />
            </View>
          )}
          <View style={{ width: '30%' }}>
            <Text style={[styles.label, { textAlign }]}>{t('addProperty.areaSqm')}</Text>
            <TextInput
              ref={areaSqmRef}
              returnKeyType="next"
              onSubmitEditing={() => focusAvailable(livingRoomsRef, floorsCountRef, floorNumberRef, buildingAgeRef, parkingCountRef)}
              blurOnSubmit={false}
              style={[styles.input, { textAlign, writingDirection }]}
              placeholder="0"
              keyboardType="numeric"
              value={formData.areaSqm}
              onChangeText={(text) => setFormData({...formData, areaSqm: text})}
            />
          </View>
          {showLivingRooms && (
            <View style={{ width: '30%' }}>
              <Text style={[styles.label, { textAlign }]}>{t('property.livingRooms')}</Text>
              <TextInput
                ref={livingRoomsRef}
                returnKeyType="next"
                onSubmitEditing={() => focusAvailable(floorsCountRef, floorNumberRef, buildingAgeRef, parkingCountRef)}
                blurOnSubmit={false}
                style={[styles.input, { textAlign, writingDirection }]}
                placeholder="0"
                keyboardType="numeric"
                value={formData.livingRooms}
                onChangeText={(text) => setFormData({...formData, livingRooms: text})}
              />
            </View>
          )}
          {showFloorsCount && (
            <View style={{ width: '30%' }}>
              <Text style={[styles.label, { textAlign }]}>{t('property.floorsCount')}</Text>
              <TextInput
                ref={floorsCountRef}
                returnKeyType="next"
                onSubmitEditing={() => focusAvailable(floorNumberRef, buildingAgeRef, parkingCountRef)}
                blurOnSubmit={false}
                style={[styles.input, { textAlign, writingDirection }]}
                placeholder="0"
                keyboardType="numeric"
                value={formData.floorsCount}
                onChangeText={(text) => setFormData({...formData, floorsCount: text})}
              />
            </View>
          )}
          {showFloorNumber && (
            <View style={{ width: '30%' }}>
              <Text style={[styles.label, { textAlign }]}>{t('property.floorNumber')}</Text>
              <TextInput
                ref={floorNumberRef}
                returnKeyType="next"
                onSubmitEditing={() => focusAvailable(buildingAgeRef, parkingCountRef)}
                blurOnSubmit={false}
                style={[styles.input, { textAlign, writingDirection }]}
                placeholder="0"
                keyboardType="numeric"
                value={formData.floorNumber}
                onChangeText={(text) => setFormData({...formData, floorNumber: text})}
              />
            </View>
          )}
          {showBuildingAge && (
            <View style={{ width: '30%' }}>
              <Text style={[styles.label, { textAlign }]}>{t('property.buildingAge')}</Text>
              <TextInput
                ref={buildingAgeRef}
                returnKeyType="next"
                onSubmitEditing={() => parkingCountRef.current?.focus()}
                blurOnSubmit={false}
                style={[styles.input, { textAlign, writingDirection }]}
                placeholder="0"
                keyboardType="numeric"
                value={formData.buildingAge}
                onChangeText={(text) => setFormData({...formData, buildingAge: text})}
              />
            </View>
          )}
        </View>

        <View style={[styles.row, { gap: 10, flexWrap: 'wrap', flexDirection: rowDir }]}
        >
          <View style={{ width: '48%' }}>
            <Text style={[styles.label, { textAlign }]}>{t('property.parkingCount') || 'Parking count'}</Text>
            <TextInput
              ref={parkingCountRef}
              returnKeyType="next"
              onSubmitEditing={() => descriptionRef.current?.focus()}
              blurOnSubmit={false}
              style={[styles.input, { textAlign, writingDirection }]}
              placeholder="0"
              keyboardType="numeric"
              value={formData.parkingCount}
              onChangeText={(text) => setFormData({ ...formData, parkingCount: text })}
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

        <Text style={[styles.label, { textAlign }]}>{t('addProperty.description')} *</Text>
        <TextInput
          ref={descriptionRef}
          style={[styles.input, styles.textArea, { textAlign, writingDirection }]}
          placeholder={t('addProperty.descriptionPlaceholder')}
          multiline
          numberOfLines={4}
          value={formData.description}
          onChangeText={(text) => setFormData({...formData, description: text})}
          inputAccessoryViewID="descriptionDone"
        />
        {Platform.OS === 'ios' && (
          <InputAccessoryView nativeID="descriptionDone">
            <View style={{ backgroundColor: '#f0f0f0', padding: 10, alignItems: 'flex-end', borderTopWidth: 1, borderTopColor: '#ddd' }}>
              <TouchableOpacity onPress={() => Keyboard.dismiss()}>
                <Text style={{ color: '#007AFF', fontWeight: 'bold', fontSize: 16 }}>{t('common.done') || 'Done'}</Text>
              </TouchableOpacity>
            </View>
          </InputAccessoryView>
        )}


        <Text style={[styles.label, { textAlign }]}>{t('addProperty.video') || 'Property Videos'} ({videos.length}/5)</Text>
        <View style={styles.imageSection}>
            <TouchableOpacity 
              style={[
                styles.addImageButton,
                videos.length >= 5 && { backgroundColor: '#ccc', opacity: 0.6 }
              ]} 
              onPress={pickVideo}
              disabled={videos.length >= 5}
            >
              <Text style={[
                styles.addImageText,
                videos.length >= 5 && { color: '#666' }
              ]}>
                {videos.length >= 5 ? 
                  (t('addProperty.maxVideosReached') || 'Maximum 5 videos') :
                  (t('addProperty.addVideo') || 'Add Videos')
                }
              </Text>
            </TouchableOpacity>

            {videos.length > 0 && (
                <View style={{ marginTop: 10 }}>
                    {videos.map((vid, index) => (
                        <View key={index} style={{ 
                            flexDirection: 'row',
                            alignItems: 'center', 
                            backgroundColor: '#f9f9f9',  
                            padding: 10, 
                            borderRadius: 8, 
                            borderWidth: 1, 
                            borderColor: '#ddd',
                            marginBottom: 8
                        }}>
                             <Text style={{ flex: 1, marginHorizontal: 10, textAlign: 'auto', color: '#00305D' }} numberOfLines={1}>
                                {vid.fileName || `Video ${index + 1}`}
                            </Text>
                            <TouchableOpacity 
                                onPress={() => setVideos(prev => prev.filter((_, i) => i !== index))} 
                                style={{ padding: 5 }}
                            >
                                <Text style={{ color: 'red', fontWeight: 'bold' }}>✕</Text>
                            </TouchableOpacity>
                        </View>
                    ))}
                </View>
            )}
        </View>

        <Text style={[styles.label, { textAlign }]}>{t('addProperty.images')} *</Text>
        <View style={styles.imageSection}>
          <TouchableOpacity style={styles.addImageButton} onPress={pickImage}>
            <Text style={styles.addImageText}>{t('addProperty.addImage')}</Text>
          </TouchableOpacity>
          
          {images.length > 0 && (
            <Text style={[styles.dragHint, { textAlign }]}>
              {t('addProperty.dragHint') || 'Drag images to reorder'}
            </Text>
          )}
          
          <DraggableFlatList
            data={images}
            renderItem={renderImageItem}
            keyExtractor={(item, index) => `image-${index}`}
            horizontal
            showsHorizontalScrollIndicator={false}
            onDragEnd={({ data }) => setImages(data)}
            contentContainerStyle={styles.imageList}
          />
        </View>

        <Button 
          title={t('addProperty.previewButton') || 'Preview & Publish'}
          onPress={() => handleSubmit(false)}
          loading={loading}
          variant="success"
          style={styles.submitButton}
        />
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
  form: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00305D',
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#00305D',
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
    textAlignVertical: 'center',
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
    backgroundColor: '#00305D',
    borderColor: '#00305D',
  },
  optionText: {
    color: '#00305D',
    fontWeight: 'bold',
  },
  optionTextSelected: {
    color: 'white',
  },
  imageList: {
    paddingVertical: 10,
  },
  imageSection: {
    marginBottom: 20,
  },
  dragHint: {
    fontSize: 12,
    color: '#C6A55E',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  addImageButton: {
    width: 80,
    height: 80,
    borderWidth: 1,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginEnd: 10,
  },
  addImageText: {
    color: '#00305D',
    fontSize: 12,
    textAlign: 'center',
  },
  imageWrapper: {
    position: 'relative',
    marginEnd: 10,
    borderRadius: 8,
    overflow: 'hidden',
  },
  imageWrapperActive: {
    opacity: 0.8,
    transform: [{ scale: 1.05 }],
  },
  coverBadge: {
    position: 'absolute',
    start: 6,
    bottom: 6,
    backgroundColor: '#C6A55E',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  coverBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  previewImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: -5,
    end: -5,
    backgroundColor: '#D1232A',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeImageText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  submitButton: {
    marginTop: 30,
    marginBottom: 50,
  },
  locationButton: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    alignItems: 'center',
  },
  locationButtonSelected: {
    borderColor: '#00305D',
    backgroundColor: '#E6DFCC',
  },
  locationButtonText: {
    color: '#C6A55E',
    fontSize: 14,
  },
  locationButtonTextSelected: {
    color: '#00305D',
    fontWeight: '500',
  },
  clearLocationButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  clearLocationText: {
    color: '#D1232A',
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  toggleRow: {
    marginTop: 10,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#00305D',
    flex: 1,
    marginEnd: 12,
  },
});
