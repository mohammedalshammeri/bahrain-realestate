import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../src/api/api';
import { Property, PropertyListResponse } from '../src/types/property';
import { useLanguageStore } from '../src/store/languageStore';
import { PropertyCard } from '../src/components/PropertyCard';
import { PropertyCardSkeleton } from '../src/components/SkeletonLoader';
import { EmptyState } from '../src/components/EmptyState';
import { useToast } from '../src/context/ToastContext';

export default function PropertiesList() {
  const { t } = useTranslation();
  const { language } = useLanguageStore();
  const { showToast } = useToast();
  const params = useLocalSearchParams();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  // const goBack = () => { ... } // Removed as we use native header

  const fetchProperties = async () => {
    try {
      // Build server-side search query so all matching active properties are returned
      const query: Record<string, string | number> = {
        skip: 0,
        take: 100, // fetch up to 100 results for search
      };

      if (params.governorate) {
        query.governorate = params.governorate as string;
      }
      if (params.area) {
        query.area = params.area as string;
      }
      if (params.type) {
        query.type = params.type as string;
      }
      if (params.purpose) {
        query.purpose = params.purpose as string;
      }

      const response = await api.get<PropertyListResponse>('/public/search', { params: query });
      if (response.data.success) {
        const serverData = response.data.data || [];

        const sorted = serverData.sort((a, b) => {
          if (a.isFeatured && !b.isFeatured) return -1;
          if (!a.isFeatured && b.isFeatured) return 1;
          return 0;
        });
        setProperties(sorted);
      } else {
        showToast(t('common.error'), 'error');
      }
    } catch (err) {
      console.error(err);
      showToast(t('common.error'), 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, [language, params.area, params.type, params.purpose]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProperties();
  };

  const renderItem = ({ item }: { item: Property }) => (
    <PropertyCard 
      property={item} 
      onPress={() => router.push(`/property/${item.id}`)}
    />
  );
  
  // Native header handles back navigation automatically
  
  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container} edges={['left', 'right']}>
        <View style={styles.list}>
          <PropertyCardSkeleton />
          <PropertyCardSkeleton />
          <PropertyCardSkeleton />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <Stack.Screen options={{ 
          title: t('home.search'),
          // Company Login button removed from header
      }} />

      <FlatList
        data={properties}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={[styles.list, { paddingBottom: 80 }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <EmptyState 
            title={t('home.noProperties')} 
            message={t('home.tryAdjustingFilters')}
            icon="home-outline"
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end', // Changed from space-between to flex-end since title is gone
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E6DFCC',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00305D',
    flex: 1,
    display: 'none', // Ensure it's hidden if referenced elsewhere
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginEnd: 8,
  },
  backButtonText: {
    color: '#00305D',
    fontSize: 14,
    fontWeight: 'bold',
  },
  langButton: {
    padding: 8,
    backgroundColor: '#C6A55E',
    borderRadius: 6,
  },
  langButtonText: {
    color: '#00305D',
    fontWeight: 'bold',
    fontSize: 12,
  },
  loginButton: {
    padding: 8,
    backgroundColor: '#00305D',
    borderRadius: 6,
  },
  loginButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
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
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  featuredCard: {
    borderWidth: 2,
    borderColor: '#C6A55E',
  },
  featuredBadge: {
    position: 'absolute',
    top: 10,
    start: 10,
    backgroundColor: '#C6A55E',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    zIndex: 1,
  },
  featuredText: {
    color: '#00305D',
    fontWeight: 'bold',
    fontSize: 12,
  },
  image: {
    width: '100%',
    height: 200,
    backgroundColor: '#E6DFCC',
  },
  cardContent: {
    padding: 16,
    // Avoid forcing LTR: let children stretch and use direction-aware textAlign.
    alignItems: 'stretch',
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00305D',
    marginBottom: 4,
    textAlign: 'auto',
  },
  type: {
    fontSize: 14,
    color: '#C6A55E',
    marginBottom: 4,
    textTransform: 'capitalize',
    textAlign: 'auto',
  },
  location: {
    fontSize: 14,
    color: '#C6A55E',
    textAlign: 'auto',
  },
  errorText: {
    fontSize: 16,
    color: '#D1232A',
    marginBottom: 16,
  },
  retryButton: {
    padding: 10,
    backgroundColor: '#00305D',
    borderRadius: 5,
  },
  retryText: {
    color: 'white',
    fontWeight: 'bold',
  },
});
