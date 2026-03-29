import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, TextInput } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import api from '../../../src/api/api';
import { PropertyDetailsResponse, Property } from '../../../src/types/property';
import { toAbsoluteUrl } from '../../../src/utils/url';
import { rowDirection, textAlignStart } from '../../../src/utils/rtl';

const PRICE_PER_DAY = 1.0; // BHD

export default function FeaturedSelection() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState<number>(7);
  const [customDays, setCustomDays] = useState<string>('');

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        // Company-owned properties must be fetched from the protected company endpoint
        const response = await api.get<PropertyDetailsResponse>(`/company/properties/${id}`);
        if (response.data.success) {
          setProperty(response.data.data);
        }
      } catch (error) {
        Alert.alert(t('common.error'), t('common.error'));
        router.back();
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchProperty();
  }, [id]);

  const handleCustomDaysChange = (text: string) => {
    setCustomDays(text);
    const d = parseInt(text);
    if (!isNaN(d) && d > 0) {
      setDays(d);
    }
  };

  const handleProceed = () => {
    if (!property) return;
    
    router.push({
      pathname: '/company/payment',
      params: {
        propertyId: property.id,
        days: days,
        amount: days * PRICE_PER_DAY,
        propertyName: localizedType // localized property name
      }
    });
  };

  if (loading || !property) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const flexDirection = rowDirection();
  const textAlign = textAlignStart();
  const writingDirection = 'auto' as const;
  const totalPrice = days * PRICE_PER_DAY;
  const localizedType = t(`property.types.${property.type}`, { defaultValue: property.type });

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <View style={[styles.cardHeader, { flexDirection }]}>
            <Image
              source={toAbsoluteUrl(property.propertyImages?.[0]?.imageUrl) ? { uri: toAbsoluteUrl(property.propertyImages?.[0]?.imageUrl) } : require('../../../assets/icon.png')}
            style={styles.image}
            contentFit="cover"
          />
          <View style={styles.headerInfo}>
            <Text style={[styles.price, { textAlign }]}>{Number(property.price).toLocaleString()} BHD</Text>
            <Text style={[styles.type, { textAlign }]}>{localizedType}</Text>
            <Text style={[styles.location, { textAlign }]}>{property.area}, {property.governorate}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { textAlign }]}>{t('featured.selectDuration')}</Text>
        
        <View style={[styles.optionsRow, { flexDirection }]}>
          {[7, 14, 30].map((d) => (
            <TouchableOpacity
              key={d}
              style={[styles.optionButton, days === d && customDays === '' && styles.optionSelected]}
              onPress={() => { setDays(d); setCustomDays(''); }}
            >
              <Text style={[styles.optionText, days === d && customDays === '' && styles.optionTextSelected]}>
                {d} {t('featured.days')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.customRow}>
          <Text style={[styles.label, { textAlign }]}>{t('featured.customDays')}</Text>
          <TextInput
            style={[styles.input, { textAlign: 'auto', writingDirection }]}
            keyboardType="numeric"
            value={customDays}
            onChangeText={handleCustomDaysChange}
            placeholder="e.g. 5"
          />
        </View>
      </View>

      <View style={styles.summary}>
        <View style={[styles.summaryRow, { flexDirection }]}>
          <Text style={styles.summaryLabel}>{t('featured.pricePerDay')}</Text>
          <Text style={styles.summaryValue}>{PRICE_PER_DAY.toFixed(3)} BHD</Text>
        </View>
        <View style={styles.divider} />
        <View style={[styles.summaryRow, { flexDirection }]}>
          <Text style={styles.totalLabel}>{t('featured.totalPrice')}</Text>
          <Text style={styles.totalValue}>{totalPrice.toFixed(3)} BHD</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.proceedButton} onPress={handleProceed}>
        <Text style={styles.proceedButtonText}>{t('featured.proceedPayment')}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
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
    marginStart: 12,
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
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#00305D',
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  optionButton: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
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
  customRow: {
    marginTop: 10,
  },
  label: {
    fontSize: 14,
    color: '#00305D',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  summary: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 30,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#C6A55E',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00305D',
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 15,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00305D',
  },
  totalValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#C6A55E',
  },
  proceedButton: {
    backgroundColor: '#00305D',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 50,
  },
  proceedButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
