import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Button } from '../../src/components/Button';
import { useAuthStore } from '../../src/store/authStore';
import { rowDirection, textAlignStart } from '../../src/utils/rtl';

interface FeaturedPackage {
  id: string;
  name: string;
  duration: number;
  price: number;
  description: string;
  features: string[];
}

export default function FeaturedPackages() {
  const { t } = useTranslation();
  const router = useRouter();
  const { company } = useAuthStore();
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const textAlign = textAlignStart();
  const flexDirection = rowDirection();

  const packages: FeaturedPackage[] = [
    {
      id: '7days',
      name: t('featured.packages.basic.name'),
      duration: 7,
      price: 5.00,
      description: t('featured.packages.basic.description'),
      features: [
        t('featured.packages.basic.feature1'),
        t('featured.packages.basic.feature2'),
        t('featured.packages.basic.feature3'),
      ],
    },
    {
      id: '14days',
      name: t('featured.packages.standard.name'),
      duration: 14,
      price: 8.00,
      description: t('featured.packages.standard.description'),
      features: [
        t('featured.packages.standard.feature1'),
        t('featured.packages.standard.feature2'),
        t('featured.packages.standard.feature3'),
        t('featured.packages.standard.feature4'),
      ],
    },
    {
      id: '30days',
      name: t('featured.packages.premium.name'),
      duration: 30,
      price: 12.00,
      description: t('featured.packages.premium.description'),
      features: [
        t('featured.packages.premium.feature1'),
        t('featured.packages.premium.feature2'),
        t('featured.packages.premium.feature3'),
        t('featured.packages.premium.feature4'),
        t('featured.packages.premium.feature5'),
      ],
    },
  ];

  const handlePurchase = async (packageId: string) => {
    if (!company) {
      Alert.alert(t('common.error') || 'Error', t('auth.loginRequired') || 'Please login first');
      return;
    }

    setLoading(true);
    try {
      // Here you would integrate with your payment system
      // For now, we'll simulate the purchase
      Alert.alert(
        t('featured.purchase.title') || 'Purchase Featured Package',
        t('featured.purchase.confirm') || 'Are you sure you want to purchase this package?',
        [
          {
            text: t('common.cancel') || 'Cancel',
            style: 'cancel',
          },
          {
            text: t('common.confirm') || 'Confirm',
            onPress: () => {
              // Navigate to property selection or payment
              router.push({
                pathname: '/company/select-property',
                params: { packageId, action: 'featured' }
              });
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert(t('common.error') || 'Error', t('featured.purchase.error') || 'Failed to process purchase');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return `BD ${price.toFixed(2)}`;
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { textAlign }]}>{t('featured.packages.title') || 'Featured Packages'}</Text>
        <Text style={[styles.subtitle, { textAlign }]}>
          {t('featured.packages.subtitle') || 'Boost your property visibility with featured listings'}
        </Text>
      </View>

      <View style={styles.packagesContainer}>
        {packages.map((pkg) => (
          <TouchableOpacity
            key={pkg.id}
            style={[
              styles.packageCard,
              selectedPackage === pkg.id && styles.selectedPackage,
            ]}
            onPress={() => setSelectedPackage(pkg.id)}
          >
            <View style={[styles.packageHeader, { flexDirection }]}>
              <Text style={[styles.packageName, { textAlign }]}>{pkg.name}</Text>
              <Text style={[styles.packagePrice, { textAlign }]}>{formatPrice(pkg.price)}</Text>
            </View>

            <Text style={[styles.packageDescription, { textAlign }]}>{pkg.description}</Text>

            <View style={styles.featuresList}>
              {pkg.features.map((feature, index) => (
                <View key={index} style={[styles.featureItem, { flexDirection }]}>
                  <Text style={styles.featureBullet}>•</Text>
                  <Text style={[styles.featureText, { textAlign, flex: 1 }]}>{feature}</Text>
                </View>
              ))}
            </View>

            <Button
              title={t('featured.purchase.title') || 'Purchase'}
              onPress={() => handlePurchase(pkg.id)}
              variant={selectedPackage === pkg.id ? 'primary' : 'secondary'}
              style={styles.purchaseButton}
              disabled={loading}
            />
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.infoSection}>
        <Text style={[styles.infoTitle, { textAlign }]}>{t('featured.howItWorks') || 'How It Works'}</Text>
        <View style={styles.stepsList}>
          <View style={[styles.stepItem, { flexDirection }]}>
            <Text style={styles.stepNumber}>1</Text>
            <Text style={[styles.stepText, { textAlign }]}>
              {t('featured.step1') || 'Choose a featured package that suits your needs'}
            </Text>
          </View>
          <View style={[styles.stepItem, { flexDirection }]}
          >
            <Text style={styles.stepNumber}>2</Text>
            <Text style={[styles.stepText, { textAlign }]}>
              {t('featured.step2') || 'Select the property you want to feature'}
            </Text>
          </View>
          <View style={[styles.stepItem, { flexDirection }]}>
            <Text style={styles.stepNumber}>3</Text>
            <Text style={[styles.stepText, { textAlign }]}>
              {t('featured.step3') || 'Complete payment and get instant activation'}
            </Text>
          </View>
          <View style={[styles.stepItem, { flexDirection }]}>
            <Text style={styles.stepNumber}>4</Text>
            <Text style={[styles.stepText, { textAlign }]}>
              {t('featured.step4') || 'Enjoy increased visibility and priority placement'}
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00305D',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#C6A55E',
  },
  packagesContainer: {
    padding: 20,
  },
  packageCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedPackage: {
    borderColor: '#00305D',
  },
  packageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  packageName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00305D',
    flex: 1,
  },
  packagePrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#C6A55E',
  },
  packageDescription: {
    fontSize: 14,
    color: '#C6A55E',
    marginBottom: 15,
  },
  featuresList: {
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  featureBullet: {
    fontSize: 14,
    color: '#00305D',
    marginEnd: 8,
    marginTop: 2,
  },
  featureText: {
    fontSize: 14,
    color: '#00305D',
    lineHeight: 20,
  },
  purchaseButton: {
    marginTop: 10,
  },
  infoSection: {
    padding: 20,
    backgroundColor: '#fff',
    marginTop: 10,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00305D',
    marginBottom: 15,
  },
  stepsList: {
    gap: 15,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#00305D',
    color: '#fff',
    textAlign: 'center',
    fontSize: 12,
    fontWeight: 'bold',
    lineHeight: 24,
    marginEnd: 12,
    marginTop: 2,
  },
  stepText: {
    fontSize: 14,
    color: '#00305D',
    lineHeight: 20,
    flex: 1,
  },
});