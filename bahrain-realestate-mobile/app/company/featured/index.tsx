import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import api from '../../../src/api/api';
import { Property, PropertyListResponse } from '../../../src/types/property';
import { PropertyCardSkeleton } from '../../../src/components/SkeletonLoader';
import { EmptyState } from '../../../src/components/EmptyState';
import { toAbsoluteUrl } from '../../../src/utils/url';
import { alignStart, rowDirection, textAlignStart } from '../../../src/utils/rtl';

export default function FeaturedHistory() {
  const { t } = useTranslation();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProperties = async () => {
    try {
      const response = await api.get<PropertyListResponse>('/company/properties');
      if (response.data.success) {
        // Filter only featured properties
        const featured = response.data.data.filter(p => p.isFeatured);
        setProperties(featured);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProperties();
  };

  const textAlign = textAlignStart();
  const rowDir = rowDirection();
  const startAlign = alignStart();

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

    return (
    <View style={styles.card}>
      <View style={[styles.cardHeader, { flexDirection: rowDir }]}>
          <Image
            source={toAbsoluteUrl(imageUrl) ? { uri: toAbsoluteUrl(imageUrl) } : require('../../../assets/icon.png')}
          style={styles.image}
          contentFit="cover"
        />
        <View style={[styles.headerInfo, { alignItems: startAlign }]}>
          <Text style={[styles.price, { textAlign }]}>{Number(item.price).toLocaleString()} BHD</Text>
          <Text style={[styles.type, { textAlign }]}>{
            (() => {
              const key = String(item.type || '').toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '_');
              return t(`property.types.${key}`) || item.type;
            })()
          }</Text>
          <Text style={[styles.location, { textAlign }]}>{item.area}, {item.governorate}</Text>
          
          {item.featuredExpiresAt && (
            <View style={[styles.expiryContainer, { flexDirection: rowDir, alignSelf: startAlign }]}>
              <Text style={[styles.expiryLabel, { textAlign }]}>{t('featured.featuredUntil')}:</Text>
              <Text style={styles.expiryDate}>
                {new Date(item.featuredExpiresAt).toLocaleDateString()}
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.container}>
        <View style={styles.summaryHeader}>
           {/* Skeleton for summary */}
           <View style={styles.summaryItem}><Text style={styles.summaryLabel}>...</Text></View>
           <View style={styles.summaryDivider} />
           <View style={styles.summaryItem}><Text style={styles.summaryLabel}>...</Text></View>
        </View>
        <View style={styles.list}>
          <PropertyCardSkeleton />
          <PropertyCardSkeleton />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.summaryHeader, { flexDirection: rowDir }]}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{properties.length}</Text>
          <Text style={styles.summaryLabel}>{t('featured.activeAds')}</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{properties.length * 7}.000 BHD</Text>
          <Text style={styles.summaryLabel}>{t('featured.totalSpent')}</Text>
        </View>
      </View>

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
            title={t('featured.noFeaturedAds')} 
            message={t('featured.makeFeatured')}
            icon="star-outline"
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
  summaryHeader: {
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 10,
    elevation: 2,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    backgroundColor: '#eee',
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#00305D',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#C6A55E',
    textTransform: 'uppercase',
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
  },
  cardHeader: {
    flexDirection: 'row',
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#eee',
  },
  headerInfo: {
    flex: 1,
    marginHorizontal: 12,
    justifyContent: 'center',
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00305D',
    marginBottom: 4,
  },
  type: {
    fontSize: 14,
    color: '#C6A55E',
    marginBottom: 2,
  },
  location: {
    fontSize: 12,
    color: '#C6A55E',
    marginBottom: 8,
  },
  expiryContainer: {
    alignItems: 'center',
    backgroundColor: '#E6DFCC',
    padding: 6,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  expiryLabel: {
    fontSize: 12,
    color: '#00305D',
    marginEnd: 4,
  },
  expiryDate: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#00305D',
  },
  emptyText: {
    color: '#C6A55E',
    fontSize: 16,
  },
});
