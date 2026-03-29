import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import api from '../../src/api/api';
import { Property, PropertyListResponse } from '../../src/types/property';
import { Governorate, Area, GovernorateListResponse, AreaListResponse } from '../../src/types/location';
import { PropertyCardSkeleton } from '../../src/components/SkeletonLoader';
import { EmptyState } from '../../src/components/EmptyState';
import { useToast } from '../../src/context/ToastContext';
import { toAbsoluteUrl } from '../../src/utils/url';
import { useLanguageStore } from '../../src/store/languageStore';
import { rowDirection, textAlignStart } from '../../src/utils/rtl';
import { useFocusEffect } from '@react-navigation/native';

export default function MyProperties() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const { language } = useLanguageStore();
  const [properties, setProperties] = useState<Property[]>([]);
  const [governorates, setGovernorates] = useState<Governorate[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const fetchData = useCallback(async () => {
    try {
      const [propsRes, govsRes, areasRes] = await Promise.all([
        // اطلب عدد أكبر من العقارات بدل القيمة الافتراضية (10)
        api.get<PropertyListResponse>('/company/properties', {
          params: {
            skip: 0,
            take: 200,
          },
        }),
        api.get<GovernorateListResponse>('/public/governorates'),
        api.get<AreaListResponse>('/public/areas')
      ]);

      if (propsRes.data.success) {
        setProperties(propsRes.data.data);
      }
      if (govsRes.data.success) {
        setGovernorates(govsRes.data.data);
      }
      if (areasRes.data.success) {
        setAreas(areasRes.data.data);
      }
    } catch (error) {
      console.error(error);
      showToast(t('common.error'), 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [t, showToast]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const getLocalizedLocation = (name: string, type: 'gov' | 'area') => {
    if (!name) return '';
    
    if (type === 'gov') {
      const gov = governorates.find(g => g.nameEn === name || g.nameAr === name || g.name === name);
      if (gov) {
        return language === 'ar' ? gov.nameAr : gov.nameEn;
      }
    } else {
      const area = areas.find(a => a.nameEn === name || a.nameAr === name || a.name === name);
      if (area) {
        return language === 'ar' ? area.nameAr : area.nameEn;
      }
    }
    return name; // Fallback to original string if not found
  };

  const handleDelete = (id: number) => {
    Alert.alert(
      t('myProperties.deleteConfirmTitle'),
      t('myProperties.deleteConfirmMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/company/properties/${id}`);
              fetchData(); // Refresh list
              showToast(t('common.success'), 'success');
            } catch (error) {
              showToast(t('common.error'), 'error');
            }
          },
        },
      ]
    );
  };

  const handleStatusChange = (id: number, currentStatus: string) => {
    Alert.alert(
      t('myProperties.statusTitle'),
      t('myProperties.statusMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('myProperties.markSold'),
          onPress: () => updateStatus(id, 'sold'),
        },
        {
          text: t('myProperties.markRented'),
          onPress: () => updateStatus(id, 'rented'),
        },
        {
          text: t('myProperties.markActive'),
          onPress: () => updateStatus(id, 'active'),
        },
      ]
    );
  };

  const updateStatus = async (id: number, status: string) => {
    try {
      await api.patch(`/company/properties/${id}`, { status });
      fetchData();
      showToast(t('common.success'), 'success');
    } catch (error) {
      showToast(t('common.error'), 'error');
    }
  };

  const textAlign = textAlignStart();
  const rowDir = rowDirection();

  // Helper to check extension
  const isVideoFile = (url: string) => {
      if (!url) return false;
      return /\.(mp4|mov|avi|wmv|flv|webm|mkv)(\?.*)?$/i.test(url);
  };

  const renderItem = ({ item }: { item: Property }) => {
     // Robustly find the first actual image
     const firstImageObj = item.propertyImages?.find(pi => !pi.isVideo && !isVideoFile(pi.imageUrl));
     const imageUrl = firstImageObj 
        ? firstImageObj.imageUrl
        : (item.images && item.images.length > 0 ? item.images[0] : item.imageUrl);

     // Determine real status and whether admin considers this property "active"
     const rawStatus = String(item.status || '').toLowerCase();
     let displayStatus = rawStatus;
     let isAdminActive = false;

     if (rawStatus === 'active') {
       if (item.expiresAt) {
         const ts = new Date(item.expiresAt).getTime();
         if (!Number.isNaN(ts) && ts > Date.now()) {
           // Active and not expired -> still active at admin
           isAdminActive = true;
         } else {
           // Active but expired -> treated as pending in UI
           displayStatus = 'pending';
         }
       } else {
         // Active without expiry -> active at admin
         isAdminActive = true;
       }
     }

     const canUpdateStatus = isAdminActive;

     return (
    <View style={styles.card}>
      <View style={[styles.cardHeader, { flexDirection: rowDir }]}>
          <Image
            source={toAbsoluteUrl(imageUrl) ? { uri: toAbsoluteUrl(imageUrl) } : require('../../assets/icon.png')}
          style={styles.image}
          contentFit="cover"
        />
        <View style={[styles.headerInfo, { alignItems: 'stretch' }]}>
          <View style={[styles.titleRow, { flexDirection: rowDir, justifyContent: 'space-between' }]}>
            <Text style={[styles.price, { textAlign }]}>{Number(item.price).toLocaleString()} {t('currency.bhd', { defaultValue: 'BHD' })}</Text>
            {item.isFeatured && (
              <View style={styles.featuredBadge}>
                <Text style={styles.featuredText}>⭐ {t('featured.isFeatured')}</Text>
              </View>
            )}
          </View>
          {item.title ? (
            <Text style={[styles.title, { textAlign }]} numberOfLines={1}>
              {item.title}
            </Text>
          ) : null}
          <Text style={[styles.type, { textAlign }]}> {
            (() => {
              const key = String(item.type || '').toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '_');
              return t(`property.types.${key}`) || item.type;
            })()
          } </Text>
          
          <Text style={[styles.location, { textAlign }]}>
            {getLocalizedLocation(item.governorate, 'gov')} - {getLocalizedLocation(item.area, 'area')}
          </Text>
          
          <View style={[styles.badgesRow, { flexDirection: rowDir }]}>
            {(() => {
              const badgeStyle =
                displayStatus === 'active'
                  ? styles.statusActive
                  : displayStatus === 'sold'
                    ? styles.statusSold
                    : displayStatus === 'rented'
                      ? styles.statusRented
                      : styles.statusPending;

              return (
                <View style={[styles.statusBadge, badgeStyle]}>
                  <Text style={styles.statusText}>
                    {(() => {
                      const key = displayStatus;
                      return t(`listing.status.${key}`, {
                        defaultValue: t(`status.${key}`, { defaultValue: item.status }),
                      });
                    })()}
                  </Text>
                </View>
              );
            })()}
          </View>

          {item.isFeatured && item.featuredExpiresAt && (
            <Text style={[styles.expiryText, { textAlign }]}>
              {t('featured.featuredUntil')} {new Date(item.featuredExpiresAt).toLocaleDateString()}
            </Text>
          )}
        </View>
      </View>

      <View style={[styles.actions, { flexDirection: rowDir }]}>
        {!item.isFeatured && (
          <TouchableOpacity 
            style={[styles.actionButton, styles.featuredButton]}
            onPress={() => router.push(`/company/featured/${item.id}`)}
          >
            <Text style={styles.actionText}>⭐ {t('featured.makeFeatured')}</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity 
          style={[styles.actionButton, styles.editButton]}
          onPress={() => router.push(`/company/edit/${item.id}`)}
        >
          <Text style={styles.actionText}>{t('common.edit')}</Text>
        </TouchableOpacity>

        {canUpdateStatus && (
          <TouchableOpacity 
            style={[styles.actionButton, styles.statusButton]}
            onPress={() => handleStatusChange(item.id, item.status)}
          >
            <Text style={styles.actionText}>{t('myProperties.updateStatus') || 'Status'}</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDelete(item.id)}
        >
          <Text style={styles.actionText}>{t('common.delete')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.container}>
        <View style={styles.list}>
          <PropertyCardSkeleton />
          <PropertyCardSkeleton />
          <PropertyCardSkeleton />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={properties}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <EmptyState 
            title={t('myProperties.noProperties')} 
            message={t('dashboard.addPropertySub')}
            icon="business-outline"
            actionLabel={t('dashboard.addProperty')}
            onAction={() => router.push('/company/add')}
          />
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
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  list: {
    padding: 16,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
    padding: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 12,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#eee',
  },
  headerInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00305D',
    marginBottom: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00305D',
    marginBottom: 4,
  },
  type: {
    fontSize: 14,
    color: '#C6A55E',
    marginBottom: 6,
  },
  location: {
    fontSize: 13,
    color: '#C6A55E',
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusActive: { backgroundColor: '#00305D' },
  statusSold: { backgroundColor: '#D1232A' },
  statusRented: { backgroundColor: '#00305D' },
   statusPending: { backgroundColor: '#C6A55E' },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  actions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 12,
    gap: 8,
  },
  actionButton: {
    flex: 1,
    padding: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  editButton: { backgroundColor: '#C6A55E' },
  statusButton: { backgroundColor: '#00305D' },
  deleteButton: { backgroundColor: '#D1232A' },
  featuredButton: { backgroundColor: '#00305D' },
  actionText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  featuredBadge: {
    backgroundColor: '#C6A55E',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  featuredText: {
    color: '#00305D',
    fontSize: 10,
    fontWeight: 'bold',
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  expiryText: {
    fontSize: 12,
    color: '#C6A55E',
    marginTop: 4,
  },
});
