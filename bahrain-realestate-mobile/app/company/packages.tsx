import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, I18nManager } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../src/store/authStore';
import { getPackages, Package, requestSubscription } from '../../src/api/packages';
import { getCompanySubscriptionHistory, CompanySubscriptionHistoryItem } from '../../src/api/company';
import { rowDirection, textAlignStart } from '../../src/utils/rtl';
import { Button } from '../../src/components/Button';
import { Ionicons } from '@expo/vector-icons';

export default function SubscriptionPackages() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { company, isAuthenticated } = useAuthStore();
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscriptionHistory, setSubscriptionHistory] = useState<CompanySubscriptionHistoryItem[]>([]);

  const textAlign = textAlignStart();
  const flexDirection = rowDirection();
  const isRTL = I18nManager.isRTL;

  const fetchPackages = useCallback(async () => {
    if (!isAuthenticated || !company) {
      router.replace('/login');
      return;
    }

    try {
      const [pkgs, history] = await Promise.all([
        getPackages(),
        getCompanySubscriptionHistory(),
      ]);
      setPackages(pkgs);
      setSubscriptionHistory(history);
    } catch (error) {
      console.error('Failed to fetch packages:', error);
      Alert.alert(t('common.error'), t('packages.fetchError'));
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, company, router]);

  useEffect(() => {
    fetchPackages();
  }, [fetchPackages]);

  const handleSubscribe = (pkg: Package) => {
    Alert.alert(
      t('packages.subscribe'),
      t('packages.subscribeConfirm', { name: i18n.language === 'ar' ? pkg.nameAr : pkg.nameEn }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('common.confirm'), 
          onPress: async () => {
            try {
              setLoading(true);
              await requestSubscription(pkg.id);
              Alert.alert(
                t('common.success'),
                t('packages.requestSent'),
                [
                  {
                    text: t('common.ok'),
                    onPress: () => {
                      // ارجاع المستخدم إلى لوحة الشركة حتى يتم إعادة تحميل الباقات
                      router.push('/company');
                    },
                  },
                ]
              );
            } catch (error: any) {
              const rawMessage = error.response?.data?.message || '';
              const msg = rawMessage.toLowerCase();

              if (rawMessage.includes('pending subscription request')) {
                Alert.alert(t('common.error'), t('packages.alreadyPending'));
              } else if (rawMessage.includes('active subscription for this package')) {
                Alert.alert(t('common.error'), t('packages.alreadyActive'));
              } else {
                Alert.alert(t('common.error'), rawMessage || t('common.error'));
              }
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0066cc" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <Text style={[styles.title, { textAlign }]}>{t('packages.title')}</Text>
        <Text style={[styles.subtitle, { textAlign }]}>{t('packages.subtitle')}</Text>
        <Text style={[styles.rulesText, { textAlign }]}>{t('packages.rulesInfo')}</Text>
      </View>

      <View style={styles.grid}>
        {packages.map((pkg) => (
          <View key={pkg.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={[styles.packageName, { textAlign }]}>
                {i18n.language === 'ar' ? pkg.nameAr : pkg.nameEn}
              </Text>
              <Text style={styles.price}>
                {pkg.price === 0 ? t('common.free') : `${pkg.price} ${t('currency.bhd')}`}
              </Text>
            </View>
            
            <View style={styles.divider} />

            <View style={styles.featuresList}>
              <View style={[styles.featureItem, { flexDirection }]}>
                <Ionicons name="time-outline" size={20} color="#666" />
                <Text style={[styles.featureText, { textAlign }]}>
                  {pkg.durationDays} {t('common.days')}
                </Text>
              </View>
              
              <View style={[styles.featureItem, { flexDirection }]}>
                <Ionicons name="home-outline" size={20} color="#666" />
                <Text style={[styles.featureText, { textAlign }]}>
                  {pkg.adsLimit} {t('packages.adsLimit')}
                </Text>
              </View>

              <View style={[styles.featureItem, { flexDirection }]}>
                <Ionicons name="star-outline" size={20} color="#666" />
                <Text style={[styles.featureText, { textAlign }]}>
                  {pkg.featuredAdsLimit} {t('packages.featuredLimit')}
                </Text>
              </View>
            </View>

            {(() => {
              const now = new Date();
              const historyForPackage = subscriptionHistory.filter(h => h.packageId === pkg.id);

              const hasPending = historyForPackage.some(h => h.status === 'PENDING');

              let hasActive = false;
              for (const h of historyForPackage) {
                if (h.status !== 'APPROVED') continue;
                const start = new Date(h.processedAt || h.createdAt);
                const end = new Date(start.getTime() + h.durationDays * 24 * 60 * 60 * 1000);
                if (end.getTime() > now.getTime()) {
                  hasActive = true;
                  break;
                }
              }

              // هذا المتغير يتحكم في تعطيل زر هذه الباقة حسب حالتها الذاتية فقط
              let disabled = false;
              let title = t('common.select');
              let extraStyle: any = {};

              if (hasPending) {
                disabled = true;
                title = t('packages.pendingLabel');
                extraStyle = { backgroundColor: '#d4ac0d' };
              } else if (hasActive) {
                disabled = true;
                title = t('packages.activeLabel');
                extraStyle = { backgroundColor: '#27ae60' };
              }

              // تحديد إن كانت هذه هي الباقة المختارة (معلقة أو نشطة)
              const isSelected = hasPending || hasActive;

              // إذا كان هناك أي باقة مختارة، نمنع اختيار باقي الباقات
              const hasAnySelected = subscriptionHistory.some(h => h.status === 'PENDING' || h.status === 'APPROVED');

              // الباقات غير المختارة تصبح أزرارها معطلة وخلفيتها مختلفة
              const isDisabledByGlobalRule = !isSelected && hasAnySelected;
              const finalDisabled = disabled || isDisabledByGlobalRule;

              const cardDisabledStyle = !isSelected && hasAnySelected
                ? styles.cardDisabled
                : null;

              // لو كانت هذه باقة غير مختارة ومعطلة بسبب وجود باقة أخرى مختارة، غير نص الزر
              const finalTitle = isDisabledByGlobalRule
                ? t('packages.cannotSelectNow')
                : title;

              return (
                <>
                  <View style={cardDisabledStyle} />
                  <Button 
                    title={finalTitle}
                    onPress={() => handleSubscribe(pkg)}
                    disabled={finalDisabled}
                    style={[styles.button, extraStyle]}
                  />
                </>
              );
            })()}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  scrollContent: {
    paddingBottom: 140, // مساحة إضافية تحت آخر بطاقة فوق الفوتر
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  rulesText: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  grid: {
    gap: 16,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardDisabled: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.04)',
    borderRadius: 12,
  },
  cardHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  packageName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0066cc',
    marginBottom: 8,
  },
  price: {
    fontSize: 24,
    fontWeight: '800',
    color: '#333',
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginBottom: 16,
  },
  featuresList: {
    marginBottom: 20,
    gap: 12,
  },
  featureItem: {
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    fontSize: 16,
    color: '#444',
  },
  button: {
    marginTop: 8,
  }
});
