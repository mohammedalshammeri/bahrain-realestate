import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import api from '../../src/api/api';
import { useAuthStore } from '../../src/store/authStore';
import { rowDirection, textAlignStart } from '../../src/utils/rtl';

interface Property {
  id: number;
  titleEn: string;
  titleAr: string;
  type: string;
  status: string;
  price: number;
  isFeatured: boolean;
  images?: { id: number; imageUrl: string }[];
}

export default function SelectPropertyFeature() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { days, amount, packageName } = params;
  const { company } = useAuthStore();

  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(null);

  const textAlign = textAlignStart();
  const flexDirection = rowDirection();
  const isAr = i18n.language === 'ar';

  useEffect(() => {
    loadProperties();
  }, []);

  const loadProperties = async () => {
    try {
      const response = await api.get('/company/properties', {
        params: { skip: 0, take: 100 },
      });

      if (response.data?.success) {
        // Filter out already-featured properties
        const allProps = response.data.data?.properties || response.data.data || [];
        const available = allProps.filter((p: Property) => !p.isFeatured && p.status === 'ACTIVE');
        setProperties(available);
      }
    } catch (error) {
      console.error('Failed to load properties:', error);
      Alert.alert(t('common.error') || 'Error', t('properties.loadError') || 'Failed to load properties');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (!selectedPropertyId) {
      Alert.alert(t('common.error') || 'Error', t('featured.selectProperty') || 'Please select a property');
      return;
    }

    const selectedProp = properties.find(p => p.id === selectedPropertyId);
    const propName = selectedProp
      ? (isAr ? selectedProp.titleAr : selectedProp.titleEn) || `Property #${selectedProp.id}`
      : '';

    router.push({
      pathname: '/company/payment',
      params: {
        propertyId: String(selectedPropertyId),
        days: String(days),
        amount: String(amount),
        propertyName: propName,
      },
    });
  };

  const getImageUrl = (property: Property) => {
    if (property.images && property.images.length > 0) {
      const url = property.images[0].imageUrl;
      if (url.startsWith('http')) return url;
      return `${process.env.EXPO_PUBLIC_API_URL}/${url}`;
    }
    return null;
  };

  const renderProperty = ({ item }: { item: Property }) => {
    const isSelected = selectedPropertyId === item.id;
    const title = isAr ? item.titleAr : item.titleEn;
    const imageUrl = getImageUrl(item);

    return (
      <TouchableOpacity
        style={[styles.propertyCard, isSelected && styles.selectedCard]}
        onPress={() => setSelectedPropertyId(item.id)}
        activeOpacity={0.7}
      >
        <View style={[styles.propertyRow, { flexDirection }]}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.propertyImage} />
          ) : (
            <View style={[styles.propertyImage, styles.placeholderImage]}>
              <Ionicons name="home-outline" size={28} color="#bdc3c7" />
            </View>
          )}
          <View style={styles.propertyInfo}>
            <Text style={[styles.propertyTitle, { textAlign }]} numberOfLines={2}>
              {title || `Property #${item.id}`}
            </Text>
            <Text style={[styles.propertyType, { textAlign }]}>
              {item.type} • {item.status}
            </Text>
            <Text style={[styles.propertyPrice, { textAlign }]}>
              {item.price?.toLocaleString()} BHD
            </Text>
          </View>
          <View style={styles.checkContainer}>
            <Ionicons
              name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
              size={28}
              color={isSelected ? '#27ae60' : '#bdc3c7'}
            />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>{t('common.loading') || 'Loading...'}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { textAlign }]}>
          {t('featured.selectProperty') || 'Select a Property'}
        </Text>
        <Text style={[styles.subtitle, { textAlign }]}>
          {packageName} – {Number(days)} {t('featured.days') || 'days'} – {Number(amount).toFixed(2)} BHD
        </Text>
      </View>

      {properties.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="home-outline" size={64} color="#bdc3c7" />
          <Text style={[styles.emptyText, { textAlign }]}>
            {t('featured.noEligibleProperties') || 'No eligible properties found. All properties are already featured or inactive.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={properties}
          renderItem={renderProperty}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.confirmButton, !selectedPropertyId && styles.confirmButtonDisabled]}
          onPress={handleConfirm}
          disabled={!selectedPropertyId}
        >
          <Text style={styles.confirmButtonText}>
            {t('common.continue') || 'Continue to Payment'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6c757d',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  listContent: {
    padding: 15,
  },
  propertyCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  selectedCard: {
    borderColor: '#27ae60',
    backgroundColor: '#f0fff4',
  },
  propertyRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  propertyImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
    marginEnd: 12,
  },
  placeholderImage: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  propertyInfo: {
    flex: 1,
  },
  propertyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  propertyType: {
    fontSize: 12,
    color: '#95a5a6',
    marginBottom: 2,
  },
  propertyPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#27ae60',
  },
  checkContainer: {
    marginStart: 10,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#6c757d',
    marginTop: 15,
    lineHeight: 24,
  },
  footer: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  confirmButton: {
    backgroundColor: '#27ae60',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: '#95a5a6',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
