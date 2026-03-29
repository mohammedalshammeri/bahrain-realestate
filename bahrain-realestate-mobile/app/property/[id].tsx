import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Linking, Dimensions, FlatList, Platform } from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Video } from 'expo-av';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import api from '../../src/api/api';
import { Property, PropertyDetailsResponse } from '../../src/types/property';
import { SkeletonLoader } from '../../src/components/SkeletonLoader';
import { useToast } from '../../src/context/ToastContext';
import { useLanguageStore } from '../../src/store/languageStore';
import { useLocationStore } from '../../src/store/locationStore';
import { getTimeAgo } from '../../src/utils/timeAgo';
import { toAbsoluteUrl } from '../../src/utils/url';
import { rowDirection, textAlignStart } from '../../src/utils/rtl';

const { width } = Dimensions.get('window');
const watermarkLogo = require('../../assets/WhatsApp Image 2026-02-17 at 1.59.17 PM.jpeg');

export default function PropertyDetails() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams();
  const { showToast } = useToast();
  const { language } = useLanguageStore();
  const { getLocalizedName } = useLocationStore();
  const router = useRouter();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);

  const flexDirection = rowDirection();
  const textAlign = textAlignStart();

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        if (!id) return;
        const response = await api.get<PropertyDetailsResponse>(`/public/properties/${id}`);
        if (response.data.success) {
          setProperty(response.data.data);
        } else {
          showToast(t('common.error'), 'error');
        }
      } catch (err) {
        console.error(err);
        showToast(t('common.error'), 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [id]);

  useEffect(() => {
    setActiveMediaIndex(0);
  }, [property?.id]);

  const handleComplaint = () => {
    if (property?.company?.id) {
      const propertyId = id ? String(id) : String(property?.id ?? '');
      router.push({
        pathname: '/complaints',
        params: {
          companyId: String(property.company.id),
          ...(propertyId ? { propertyId } : {}),
        },
      });
    } else {
      showToast(t('complaints.error'), 'error');
    }
  };

  const handleCall = () => {
    const canCall = (property?.showPhoneNumber ?? true) && !!property?.company?.phone;
    if (canCall && property?.company?.phone) {
      Linking.openURL(`tel:${property.company.phone}`);
    }
  };

  const handleWhatsApp = () => {
    const canWhatsApp = (property?.enableWhatsApp ?? true) && !!property?.company?.phone;
    if (canWhatsApp && property?.company?.phone) {
      const phone = property.company.phone.replace(/\D/g, '');
      Linking.openURL(`https://wa.me/${phone}`);
    }
  };

  const formatListingStatus = (status?: string): string => {
    if (!status) return '-';
    const normalized = String(status).toLowerCase();
    return t(`property.listingStatus.${normalized}`, { defaultValue: status });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <SkeletonLoader height={300} borderRadius={0} />
        <View style={styles.content}>
          <SkeletonLoader width="40%" height={30} style={{ marginBottom: 10 }} />
          <SkeletonLoader width="80%" height={24} style={{ marginBottom: 10 }} />
          <SkeletonLoader width="60%" height={20} style={{ marginBottom: 20 }} />
          <View style={{ flexDirection, justifyContent: 'space-between', marginBottom: 20 }}>
            <SkeletonLoader width="30%" height={60} />
            <SkeletonLoader width="30%" height={60} />
            <SkeletonLoader width="30%" height={60} />
          </View>
          <SkeletonLoader height={100} />
        </View>
      </View>
    );
  }

  if (!property) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{t('property.notFound')}</Text>
      </View>
    );
  }

  const showPhoneNumber = property.showPhoneNumber ?? true;
  const enableWhatsApp = property.enableWhatsApp ?? true;
  const hasPhone = !!property.company?.phone;
  const normalizedStatus = String(property.status || '').toLowerCase();
  const rejectionReason =
    property.rejectionReason ||
    property.rejectReason ||
    (property as any).rejection_reason ||
    (property as any).reject_reason;

    const typeKey = String(property?.type ?? '').toLowerCase();
    const localizedType = t(`property.types.${typeKey}`, { defaultValue: property?.type ?? '' });
    const localizedArea = getLocalizedName(property.area, 'area', language);
    const localizedGov = getLocalizedName(property.governorate, 'governorate', language);
    const listingTitle = t('property.typeInArea', {
      type: localizedType,
      area: localizedArea,
      defaultValue: `${localizedType} ${language === 'ar' ? 'في' : 'in'} ${localizedArea}`,
    });
    const rawTitle = (property.title || '').trim();
    const displayTitle = rawTitle.length > 0 ? rawTitle : listingTitle;
    const hasSubtitle = rawTitle.length > 0;
    const currencyBhd = t('currency.bhd', { defaultValue: 'BHD' });

    return (
    <>
      <Stack.Screen options={{ title: displayTitle }} />
      <ScrollView style={styles.container}>
        <View style={styles.mediaSection}>
          {(() => {
            const rawImages = (property.propertyImages?.length || 0) > 0
              ? property.propertyImages
              : (property.images || []).map((url, idx) => ({ id: idx, imageUrl: url, displayOrder: idx }));

            const allImages = rawImages
              .slice()
              .sort((a: any, b: any) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));

            // Helper to check extension if flag is missing (Robust Fallback)
            const isVideoFile = (url: string) => {
               if (!url) return false;
               return /\.(mp4|mov|avi|wmv|flv|webm|mkv)(\?.*)?$/i.test(url);
            };

            const imageUrls = allImages
              .filter((img: any) => !img.isVideo && !isVideoFile(img.imageUrl))
              .map((img: any) => toAbsoluteUrl(img.imageUrl))
              .filter(Boolean) as string[];

            const videos = allImages
              .filter((img: any) => img.isVideo || isVideoFile(img.imageUrl))
              .map((img: any) => toAbsoluteUrl(img.imageUrl))
              .filter(Boolean) as string[];

            // 🔍 DEBUG: Log what we receive from API
            if (property.id === 128) {
              console.log('🔍 Property 128 Debug (Mobile):');
              console.log('allImages:', allImages);
              console.log('Videos found:', videos.length);
              console.log('Video URLs:', videos);
            }

            const videoUrl = property.videoUrl ? toAbsoluteUrl(property.videoUrl) : undefined;

            const mediaItems = [
              ...imageUrls.map((url) => ({ type: 'image' as const, url })),
              ...videos.map((url) => ({ type: 'video' as const, url })),
              ...(videoUrl ? [{ type: 'video' as const, url: videoUrl }] : []),
            ];

            const activeItem = mediaItems[activeMediaIndex] || mediaItems[0];

            if (!activeItem) {
              return (
                <View style={[styles.mediaMain, styles.placeholderImage]}>
                  <Ionicons name="image-outline" size={64} color="#ccc" />
                  <Text style={{ color: '#999', marginTop: 10 }}>{t('property.noImages')}</Text>
                </View>
              );
            }

            return (
              <>
                <View style={styles.mediaMain}>
                  {activeItem.type === 'image' ? (
                    <Image
                      source={{ uri: activeItem.url }}
                      style={styles.mediaImage}
                      contentFit="cover"
                    />
                  ) : Platform.OS === 'web' ? (
                    // @ts-ignore
                    <video
                      src={activeItem.url}
                      controls
                      style={{ width: '100%', height: '100%', borderRadius: 12, backgroundColor: '#111827' }}
                    />
                  ) : (
                    <Video
                      source={{ uri: activeItem.url }}
                      style={styles.mediaImage}
                      useNativeControls
                      resizeMode="contain"
                      isLooping={false}
                      shouldPlay={false}
                    />
                  )}
                  <View style={styles.watermarkOverlay}>
                    <Image
                      source={watermarkLogo}
                      style={styles.watermarkMain}
                      contentFit="contain"
                      transition={0}
                    />
                  </View>
                </View>

                <FlatList
                  data={mediaItems}
                  keyExtractor={(_, idx) => `media-${idx}`}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={[styles.mediaThumbs, { flexDirection }]}
                  renderItem={({ item: mediaItem, index }) => (
                    <TouchableOpacity
                      onPress={() => setActiveMediaIndex(index)}
                      activeOpacity={0.8}
                      style={[styles.thumb, index === activeMediaIndex ? styles.thumbActive : null]}
                    >
                      {mediaItem.type === 'image' ? (
                        <Image source={{ uri: mediaItem.url }} style={styles.thumbImage} contentFit="cover" />
                      ) : (
                        <View style={styles.thumbVideo}>
                          <Text style={styles.thumbVideoIcon}>▶</Text>
                          <Text style={styles.thumbVideoText}>
                            {videos.length > 1 ? 
                              `Video ${videos.findIndex(v => v === mediaItem.url) + 1}` : 
                              (t('addProperty.video') || 'Video')
                            }
                          </Text>
                        </View>
                      )}
                      <Image
                        source={watermarkLogo}
                        style={styles.watermarkThumb}
                        contentFit="contain"
                        transition={0}
                      />
                    </TouchableOpacity>
                  )}
                />
              </>
            );
          })()}
        </View>

        <View style={styles.content}>
          <View style={[styles.header, { flexDirection }]}>
            <Text style={[styles.price, { textAlign }]}>
              {Number(property.price).toLocaleString()} {currencyBhd}
            </Text>
            <View
              style={[
                styles.badgesRow,
                {
                  flexDirection,
                  justifyContent: 'flex-start',
                },
              ]}
            >
              <View style={[styles.badge, property.purpose === 'sale' ? styles.saleBadge : styles.rentBadge]}>
                <Text style={styles.badgeText}>{property.purpose === 'sale' ? t('home.forSale') : t('home.forRent')}</Text>
              </View>
              {!!property.status && (
                <View
                  style={[
                    styles.badge,
                    styles.listingStatusBadge,
                    normalizedStatus === 'pending'
                      ? styles.statusPending
                      : normalizedStatus === 'rejected'
                        ? styles.statusRejected
                        : normalizedStatus === 'active'
                          ? styles.statusActive
                          : styles.statusNeutral,
                  ]}
                >
                  <Text style={styles.badgeText}>{formatListingStatus(property.status)}</Text>
                </View>
              )}
            </View>
          </View>

          <Text style={[styles.title, { textAlign }]}>{displayTitle}</Text>
          {hasSubtitle && (
            <Text style={[styles.subtitle, { textAlign }]}>{listingTitle}</Text>
          )}
          <View style={[styles.locationRow, { flexDirection }]}>
            <Ionicons name="location-outline" size={16} color="#C6A55E" />
            <Text style={[styles.location, { textAlign }]}>{localizedGov}, {localizedArea}</Text>
          </View>

          <View style={[styles.timeRow, { flexDirection }]}>
            <Ionicons name="time-outline" size={16} color="#C6A55E" />
            <Text style={[styles.timeText, { textAlign }]}>{getTimeAgo(property.createdAt, language as 'en' | 'ar')}</Text>
          </View>

          <View style={styles.divider} />

          <View style={[styles.specs, { flexDirection }]}>
            {property.bedrooms && (
              <View style={styles.specItem}>
                <Ionicons name="bed-outline" size={24} color="#00305D" />
                <Text style={styles.specValue}>{property.bedrooms}</Text>
                <Text style={[styles.specLabel, { textAlign: 'center' }]}>{t('property.bedrooms')}</Text>
              </View>
            )}
            {property.bathrooms && (
              <View style={styles.specItem}>
                <Ionicons name="water-outline" size={24} color="#00305D" />
                <Text style={styles.specValue}>{property.bathrooms}</Text>
                <Text style={[styles.specLabel, { textAlign: 'center' }]}>{t('property.bathrooms')}</Text>
              </View>
            )}
            {property.areaSqm && (
              <View style={styles.specItem}>
                <Ionicons name="resize-outline" size={24} color="#00305D" />
                <Text style={styles.specValue}>{property.areaSqm}</Text>
                <Text style={[styles.specLabel, { textAlign: 'center' }]}>{t('property.sqm')}</Text>
              </View>
            )}
          </View>

          <View style={styles.divider} />

          <Text style={[styles.sectionTitle, { textAlign }]}>{t('property.description')}</Text>
          <Text style={[styles.description, { textAlign }]}>{property.description}</Text>

          {normalizedStatus === 'rejected' && (
            <>
              <View style={styles.divider} />
              <View style={styles.rejectionBox}>
                <Text style={[styles.rejectionTitle, { textAlign }]}>
                  {t('property.rejectionReason') || 'Rejection reason'}
                </Text>
                <Text style={[styles.rejectionText, { textAlign }]}>
                  {rejectionReason || t('common.notAvailable') || 'Not available'}
                </Text>
              </View>
            </>
          )}

          <View style={styles.divider} />

          <Text style={[styles.sectionTitle, { textAlign }]}>{t('property.contactCompany')}</Text>
          <View style={[styles.companyRow, { flexDirection }]}>
            <View style={styles.companyIcon}>
              <Ionicons name="business" size={24} color="#fff" />
            </View>
            <Text style={[styles.companyName, { textAlign }]}>{property.company.name}</Text>
          </View>

          {showPhoneNumber && hasPhone && (
            <View style={[styles.phoneRow, { flexDirection }]}>
              <Ionicons name="call-outline" size={16} color="#C6A55E" />
              <Text style={[styles.phoneText, { textAlign }]}>{property.company.phone}</Text>
            </View>
          )}
          
          <View style={[styles.actions, { flexDirection }]}>
            {showPhoneNumber && hasPhone && (
              <TouchableOpacity style={[styles.button, styles.callButton, { flexDirection }]} onPress={handleCall}>
                <Ionicons name="call" size={20} color="white" />
                <Text style={styles.buttonText}>{t('property.call')}</Text>
              </TouchableOpacity>
            )}

            {enableWhatsApp && hasPhone && (
              <TouchableOpacity style={[styles.button, styles.whatsappButton, { flexDirection }]} onPress={handleWhatsApp}>
                <Ionicons name="logo-whatsapp" size={20} color="white" />
                <Text style={styles.buttonText}>{t('property.whatsapp')}</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity style={[styles.button, styles.complaintButton, { flexDirection }]} onPress={handleComplaint}>
              <Ionicons name="alert-circle-outline" size={20} color="white" />
              <Text style={styles.buttonText}>{t('complaints.title')}</Text>
            </TouchableOpacity>
          </View>

          {!hasPhone && (
            <Text style={[styles.contactDisabledText, { textAlign }]}>
              {t('property.contactUnavailable') || 'Contact information is not available'}
            </Text>
          )}
        </View>
      </ScrollView>
    </>
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
  mediaSection: {
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 8,
  },
  mediaMain: {
    width: width,
    height: 260,
    backgroundColor: '#f0f0f0',
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    overflow: 'hidden',
    position: 'relative',
  },
  mediaImage: {
    width: '100%',
    height: '100%',
  },
  videoPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoIcon: {
    color: '#fff',
    fontSize: 36,
    marginBottom: 6,
  },
  videoLabel: {
    color: '#fff',
    fontSize: 13,
  },
  mediaThumbs: {
    marginTop: 8,
    paddingHorizontal: 16,
    gap: 8,
  },
  thumb: {
    width: 70,
    height: 70,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#e5e7eb',
    borderWidth: 1,
    borderColor: 'transparent',
    position: 'relative',
  },
  watermarkOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  watermarkMain: {
    width: 90,
    height: 90,
    opacity: 0.25,
    borderRadius: 16,
  },
  watermarkThumb: {
    position: 'absolute',
    top: 4,
    end: 4,
    width: 22,
    height: 22,
    opacity: 0.3,
    borderRadius: 6,
  },
  thumbActive: {
    borderColor: '#00305D',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  thumbVideo: {
    width: '100%',
    height: '100%',
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  thumbVideoIcon: {
    color: '#fff',
    fontSize: 16,
  },
  thumbVideoText: {
    color: '#fff',
    fontSize: 10,
    marginTop: 2,
    textAlign: 'center',
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00305D',
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  listingStatusBadge: {
    opacity: 0.98,
  },
  statusPending: {
    backgroundColor: '#C6A55E',
  },
  statusRejected: {
    backgroundColor: '#D1232A',
  },
  statusActive: {
    backgroundColor: '#00305D',
  },
  statusNeutral: {
    backgroundColor: '#C6A55E',
  },
  saleBadge: {
    backgroundColor: '#D1232A',
  },
  rentBadge: {
    backgroundColor: '#00305D',
  },
  badgeText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 5,
    color: '#00305D',
  },
  location: {
    fontSize: 16,
    color: '#C6A55E',
    marginBottom: 15,
  },
  divider: {
    height: 1,
    backgroundColor: '#ecf0f1',
    marginVertical: 20,
  },
  specs: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  specItem: {
    alignItems: 'center',
  },
  specLabel: {
    fontSize: 12,
    color: '#C6A55E',
    marginBottom: 4,
  },
  specValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00305D',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#00305D',
  },
  subtitle: {
    fontSize: 14,
    color: '#C6A55E',
    marginBottom: 4,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#00305D',
  },
  rejectionBox: {
    backgroundColor: '#FDECEC',
    borderColor: '#D1232A',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
  },
  rejectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#D1232A',
    marginBottom: 6,
  },
  rejectionText: {
    fontSize: 14,
    color: '#D1232A',
    lineHeight: 20,
  },
  companyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  companyIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#00305D',
    justifyContent: 'center',
    alignItems: 'center',
  },
  companyName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00305D',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: -10,
    marginBottom: 14,
  },
  phoneText: {
    fontSize: 14,
    color: '#C6A55E',
  },
  contactDisabledText: {
    marginTop: 10,
    fontSize: 13,
    color: '#C6A55E',
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  callButton: {
    backgroundColor: '#00305D',
  },
  whatsappButton: {
    backgroundColor: '#25D366',
  },
  complaintButton: {
    backgroundColor: '#D1232A',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#D1232A',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    gap: 4,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    gap: 4,
  },
  timeText: {
    fontSize: 14,
    color: '#C6A55E',
  },
});
