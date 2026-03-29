import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Image, Platform, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import api from '../../../src/api/api';
import { useToast } from '../../../src/context/ToastContext';
import { useLanguageStore } from '../../../src/store/languageStore';
import { EmptyState } from '../../../src/components/EmptyState';
import { IndividualPropertyOffer, ApiResponse } from '../../../src/types/individualOffer';
import { rowDirection, textAlignStart } from '../../../src/utils/rtl';

export default function CompanyOffersList() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const { language } = useLanguageStore();
  const router = useRouter();

  const API_URL = process.env.EXPO_PUBLIC_API_URL || '';

  const [offers, setOffers] = useState<IndividualPropertyOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeMediaIndex, setActiveMediaIndex] = useState<Record<number, number>>({});

  const textAlign = textAlignStart();
  const flexDirection = rowDirection();

  const fetchOffers = async () => {
    try {
      const res = await api.get<ApiResponse<IndividualPropertyOffer[]>>('/company/individual-property-offers');
      if (res.data.success) {
        setOffers(res.data.data || []);
      } else {
        showToast(res.data.message || t('common.error'), 'error');
      }
    } catch (e) {
      showToast(t('common.error'), 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOffers();
  };

  const counts = useMemo(() => {
    const result = { pending: 0, accepted: 0, rejected: 0 };
    for (const offer of offers) {
      if (offer.status === 'PENDING') result.pending += 1;
      else if (offer.status === 'ACCEPTED') result.accepted += 1;
      else if (offer.status === 'REJECTED') result.rejected += 1;
    }
    return result;
  }, [offers]);

  const formatMoney = (value: string | number) => {
    const num = typeof value === 'string' ? Number(value) : value;
    if (!Number.isFinite(num)) return String(value);
    return num.toLocaleString();
  };

  const resolveMediaUrl = (value?: string | null) => {
    if (!value) return '';
    if (/^https?:\/\//i.test(value)) return value;
    if (!API_URL) return value;
    const base = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;
    const path = value.startsWith('/') ? value : `/${value}`;
    return `${base}${path}`;
  };

  const renderItem = ({ item }: { item: IndividualPropertyOffer }) => {
    const title = item.property?.title || t('common.property') || 'Property';
    const minPrice = item.property?.minimumPrice;
    const localizedType = t(`property.types.${item.property?.type}`, { defaultValue: item.property?.type || '' });
    const purposeLabel = item.property?.purpose === 'sale' ? t('home.forSale') : item.property?.purpose === 'rent' ? t('home.forRent') : (item.property?.purpose || '');

    const isSold = item.property?.status === 'SOLD';

    // Helper
    const isVideoFile = (url: string) => /\.(mp4|mov|avi|wmv|flv|webm|mkv)(\?.*)?$/i.test(url);

    const rawImages = Array.isArray(item.property?.images) ? item.property?.images : [];
    
    // Process legacy/mixed images list
    const allUrls = rawImages
      .map((img: any) => (typeof img === 'string' ? img : img?.imageUrl))
      .filter(Boolean)
      .map((url) => resolveMediaUrl(String(url)));

    const imageList = allUrls.filter(u => !isVideoFile(u));
    const videoList = allUrls.filter(u => isVideoFile(u));

    const videoUrl = item.property?.videoUrl ? resolveMediaUrl(String(item.property.videoUrl)) : '';

    const mediaItems = [
      ...imageList.map((url) => ({ type: 'image' as const, url })),
      ...videoList.map((url) => ({ type: 'video' as const, url })),
      ...(videoUrl ? [{ type: 'video' as const, url: videoUrl }] : []),
    ];

    const activeIndex = activeMediaIndex[item.id] ?? 0;
    const activeItem = mediaItems[activeIndex] || mediaItems[0];

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/company/offers/${item.id}`)}
        activeOpacity={0.8}
      >
        {mediaItems.length > 0 && activeItem ? (
          <View style={styles.mediaSection}>
            <View style={styles.mediaMain}>
              {activeItem.type === 'image' ? (
                <Image source={{ uri: activeItem.url }} style={styles.mediaImage} />
              ) : Platform.OS === 'web' ? (
                // @ts-ignore
                <video src={activeItem.url} controls style={{ width: '100%', height: '100%', borderRadius: 12, backgroundColor: '#111827' }} />
              ) : (
                <TouchableOpacity
                  style={styles.videoPlaceholder}
                  onPress={() => Linking.openURL(activeItem.url)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.videoIcon}>▶</Text>
                  <Text style={styles.videoLabel}>{t('addProperty.video') || 'Video'}</Text>
                </TouchableOpacity>
              )}
            </View>

            <FlatList
              data={mediaItems}
              keyExtractor={(_, idx) => `${item.id}-media-${idx}`}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={[styles.mediaThumbs, { flexDirection }]}
              renderItem={({ item: mediaItem, index }) => (
                <TouchableOpacity
                  onPress={() => setActiveMediaIndex((prev) => ({ ...prev, [item.id]: index }))}
                  activeOpacity={0.8}
                  style={[
                    styles.thumb,
                    index === activeIndex ? styles.thumbActive : null,
                  ]}
                >
                  {mediaItem.type === 'image' ? (
                    <Image source={{ uri: mediaItem.url }} style={styles.thumbImage} />
                  ) : (
                    <View style={styles.thumbVideo}>
                      <Text style={styles.thumbVideoIcon}>▶</Text>
                      <Text style={styles.thumbVideoText}>{t('addProperty.video') || 'Video'}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        ) : null}

        <View style={[styles.row, { flexDirection, justifyContent: 'space-between' }]}>
          <Text style={[styles.title, { textAlign, flex: 1, marginEnd: 8 }]} numberOfLines={1}>{title}</Text>
          {(() => {
            const badgeStyle = isSold
              ? styles.badgeSold
              : item.status === 'PENDING'
              ? styles.badgePending
              : item.status === 'ACCEPTED'
              ? styles.badgeAccepted
              : styles.badgeRejected;

            const badgeLabel = isSold
              ? (t('property.listingStatus.sold') || 'مباع')
              : t(`offers.statuses.${item.status.toLowerCase()}`, { defaultValue: item.status });

            return (
              <View style={[styles.badge, badgeStyle]}>
                <Text style={styles.badgeText}>{badgeLabel}</Text>
              </View>
            );
          })()}
        </View>

        <Text style={[styles.sub, { textAlign }]} numberOfLines={2}>
          {localizedType}{item.property?.purpose ? ` • ${purposeLabel}` : ''}
        </Text>

        <Text style={[styles.meta, { textAlign }]}>
          {(t('offers.minimumPrice') || 'Minimum Price') + ': ' + formatMoney(minPrice)}
        </Text>

        {item.status === 'ACCEPTED' && item.companyPrice !== null && item.companyPrice !== undefined && (
          <Text style={[styles.meta, { textAlign }]}>
            {(t('offers.yourPrice') || 'Your Price') + ': ' + formatMoney(item.companyPrice)}
          </Text>
        )}

        {isSold && (
          <Text style={[styles.meta, { textAlign, color: '#16a34a' }]}>
            {item.status === 'ACCEPTED'
              ? (t('offers.soldByYou') || 'This property was sold through your company.')
              : (t('offers.soldByOther') || 'This property was sold by another company.')}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  const header = (
    <View style={styles.header}>
      <Text style={[styles.headerTitle, { textAlign }]}>{t('offers.title') || 'Offers'}</Text>
      <Text style={[styles.headerSub, { textAlign }]}>
        {(t('offers.summary') || 'Pending') + `: ${counts.pending} • ` + (t('offers.accepted') || 'Accepted') + `: ${counts.accepted} • ` + (t('offers.rejected') || 'Rejected') + `: ${counts.rejected}`}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={offers}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        ListHeaderComponent={header}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={offers.length === 0 ? styles.emptyList : undefined}
        ListEmptyComponent={
          !loading ? (
            <EmptyState
              title={t('offers.emptyTitle') || 'No offers yet'}
              message={t('offers.emptyMessage') || 'When admin sends you an offer, it will appear here.'}
              actionLabel={t('common.refresh') || 'Refresh'}
              onAction={fetchOffers}
            />
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  headerSub: {
    marginTop: 6,
    fontSize: 13,
    color: '#7f8c8d',
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 14,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  mediaSection: {
    marginBottom: 12,
  },
  mediaMain: {
    width: '100%',
    height: 190,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#eef2f7',
  },
  mediaImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
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
    fontSize: 32,
    marginBottom: 6,
  },
  videoLabel: {
    color: '#fff',
    fontSize: 13,
  },
  mediaThumbs: {
    marginTop: 8,
    paddingRight: 2,
    gap: 8,
  },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#e5e7eb',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  thumbActive: {
    borderColor: '#2563eb',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#2c3e50',
  },
  sub: {
    marginTop: 6,
    fontSize: 13,
    color: '#34495e',
  },
  meta: {
    marginTop: 6,
    fontSize: 13,
    color: '#7f8c8d',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  badgeSold: {
    backgroundColor: '#16a34a',
  },
  badgePending: {
    backgroundColor: '#f39c12',
  },
  badgeAccepted: {
    backgroundColor: '#27ae60',
  },
  badgeRejected: {
    backgroundColor: '#e74c3c',
  },
});
