import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useLanguageStore } from '../../src/store/languageStore';
import { useAuthStore } from '../../src/store/authStore';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { alignStart, textAlignStart } from '../../src/utils/rtl';
import { getCompanySubscriptionHistory, CompanySubscriptionHistoryItem } from '../../src/api/company';

export default function CompanyMySubscriptions() {
  const { t } = useTranslation();
  const { language } = useLanguageStore();
  const { isAuthenticated, company } = useAuthStore();
  const router = useRouter();
  const [subscriptionHistory, setSubscriptionHistory] = useState<CompanySubscriptionHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);

  const textAlign = textAlignStart();
  const startAlign = alignStart();

  const loadHistory = useCallback(async () => {
    if (!isAuthenticated || !company) {
      router.replace('/company/login');
      return;
    }

    setLoading(true);
    try {
      const history = await getCompanySubscriptionHistory();
      setSubscriptionHistory(history);
    } catch (error) {
      console.log('Failed to load company subscription history', error);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, company, router]);

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [loadHistory])
  );

  return (
    <ScrollView style={styles.container}>
      <View style={[styles.header, { alignItems: startAlign }]}> 
        <Text style={[styles.title, { textAlign }]}>{t('dashboard.mySubscriptions')}</Text>
        <Text style={[styles.subtitle, { textAlign }]}>{t('dashboard.mySubscriptionsSub')}</Text>
      </View>

      <View style={[styles.card, { alignItems: startAlign }]}> 
        <Text style={[styles.sectionTitle, { textAlign }]}>{t('packages.title')}</Text>

        {loading ? (
          <ActivityIndicator style={{ marginTop: 12 }} size="small" color="#00305D" />
        ) : subscriptionHistory.length === 0 ? (
          <Text style={[styles.historyDate, { textAlign, marginTop: 8 }]}>
            {t('subscriptionHistory.empty')}
          </Text>
        ) : (
          subscriptionHistory.map((item) => {
            const locale = language === 'ar' ? 'ar-BH' : 'en-US';

            const created = new Date(item.createdAt);
            const processed = item.processedAt ? new Date(item.processedAt) : created;

            const dateStr = processed.toLocaleDateString(locale);
            const timeStr = processed.toLocaleTimeString(locale, {
              hour: '2-digit',
              minute: '2-digit',
            });

            const itemStatus = item.status ?? 'APPROVED';
            const isApproved = itemStatus === 'APPROVED';
            let endStr: string | null = null;
            let diffDays: number | null = null;
            let isExpired = false;

            if (isApproved) {
              const end = new Date(processed.getTime() + item.durationDays * 24 * 60 * 60 * 1000);
              const now = new Date();
              const msPerDay = 24 * 60 * 60 * 1000;
              diffDays = Math.ceil((end.getTime() - now.getTime()) / msPerDay);
              isExpired = (diffDays ?? 0) <= 0;
              endStr = end.toLocaleDateString(locale);
            }

            const statusKey = itemStatus.toLowerCase();
            const statusLabel = itemStatus === 'PENDING'
              ? t('subscriptionStatus.pending')
              : t(`status.${statusKey}` as const);

            return (
              <View key={item.id} style={[styles.historyItem, { alignItems: startAlign }]}> 
                <Text style={[styles.historyPackageName, { textAlign }]}> 
                  {language === 'ar' ? item.packageNameAr : item.packageNameEn}
                </Text>
                <Text style={[styles.historyDate, { textAlign }]} numberOfLines={1}> 
                  {t('subscriptionHistory.statusLabel', { value: statusLabel })}
                </Text>
                {itemStatus !== 'PENDING' && (
                  <>
                    <Text style={[styles.historyDate, { textAlign }]}> 
                      {t('subscriptionHistory.decisionDate', { value: dateStr })}
                    </Text>
                    <Text style={[styles.historyDate, { textAlign }]}> 
                      {t('subscriptionHistory.decisionTime', { value: timeStr })}
                    </Text>
                  </>
                )}
                {isApproved && endStr && diffDays !== null && (
                  <>
                    <Text style={[styles.historyDate, { textAlign }]}> 
                      {t('subscriptionHistory.periodLabel', {
                        value: t('subscriptionHistory.period', { start: dateStr, end: endStr }),
                      })}
                    </Text>
                    <Text style={[styles.historyDate, { textAlign }]}> 
                      {isExpired
                        ? t('companies.subscription.expired')
                        : t('subscriptionHistory.daysLeftLabel', {
                            value: t('subscriptionHistory.daysLeft', { days: diffDays }),
                          })}
                    </Text>
                  </>
                )}
              </View>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  header: {
    marginBottom: 24,
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#00305D',
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    color: '#C6A55E',
  },
  card: {
    backgroundColor: '#fff',
    padding: 18,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    alignItems: 'flex-start',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00305D',
  },
  historyItem: {
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: '#d0d7de',
    alignSelf: 'stretch',
  },
  historyPackageName: {
    fontSize: 14,
    color: '#00305D',
    fontWeight: '500',
  },
  historyDate: {
    fontSize: 12,
    color: '#C6A55E',
    marginTop: 2,
  },
});
