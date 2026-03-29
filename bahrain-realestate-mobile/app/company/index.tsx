import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Modal } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../src/store/authStore';
import { useLanguageStore } from '../../src/store/languageStore';
import { Button } from '../../src/components/Button';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { alignStart, rowDirection, textAlignStart } from '../../src/utils/rtl';
import { useFocusEffect } from '@react-navigation/native';
import { getCompanyProfile } from '../../src/api/company';

export default function CompanyDashboard() {
  const { t } = useTranslation();
  const { company, logout, isAuthenticated } = useAuthStore();
  const { language, setLanguage } = useLanguageStore();
  const router = useRouter();
  const [menuVisible, setMenuVisible] = useState(false);
  const [subscriptionInfo, setSubscriptionInfo] = useState<{
    plan?: string;
    daysLeft?: number;
    freeAdsRemaining?: number;
    featuredAdsBalance?: number;
    startDate?: string | null;
    endDate?: string | null;
    status?: string;
  }>({});

  const textAlign = textAlignStart();
  const startAlign = alignStart();
  const flexDirection = rowDirection();

  const loadProfile = useCallback(async () => {
    // إذا لم يكن هناك جلسة شركة حالية، أعد التوجيه لصفحة تسجيل الدخول ولا تحاول استدعاء الـ API
    if (!isAuthenticated || !company) {
      router.replace('/login');
      return;
    }

    try {
      const profile = await getCompanyProfile();
      let daysLeft: number | undefined;
      if (profile.subscriptionEndDate) {
        const end = new Date(profile.subscriptionEndDate).getTime();
        const now = Date.now();
        const diffDays = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
        daysLeft = diffDays;
      }
      setSubscriptionInfo({
        plan: profile.subscriptionPlan,
        daysLeft,
        freeAdsRemaining: profile.freeAdsRemaining,
        featuredAdsBalance: profile.featuredAdsBalance,
        startDate: profile.subscriptionStartDate,
        endDate: profile.subscriptionEndDate,
        status: profile.subscriptionStatus || profile.status,
      });

    } catch (error) {
      console.log('Failed to load company subscription info', error);
    }
  }, [isAuthenticated, company, router]);

  const getPlanDisplayName = () => {
    if (!subscriptionInfo.plan) {
      return t('companies.subscription.free');
    }

    if (language === 'ar') {
      const plan = subscriptionInfo.plan.toLowerCase();
      if (plan.includes('silver')) return 'الباقة الفضية';
      if (plan.includes('gold')) return 'الباقة الذهبية';
      if (plan.includes('bronze')) return 'الباقة البرونزية';
      if (plan.includes('free')) return t('companies.subscription.free');
    }

    return subscriptionInfo.plan;
  };

  const handleLogout = () => {
    Alert.alert(
      t('dashboard.logout'),
      t('dashboard.logoutConfirm'),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('dashboard.logout'),
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/login');
          },
        },
      ]
    );
  };

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile])
  );

  const toggleLanguage = () => {
    const newLang = language === 'en' ? 'ar' : 'en';
    setLanguage(newLang);
    setMenuVisible(false);
  };

  return (
    <>
      <Stack.Screen options={{
        headerLeft: () => (
          <TouchableOpacity onPress={() => setMenuVisible(true)} style={{ marginStart: 16 }}>
            <Ionicons name="menu" size={28} color="#2c3e50" />
          </TouchableOpacity>
        ),
      }} />
      
      <ScrollView style={styles.container}>
        <View style={[styles.header, { alignItems: startAlign }]}>
          <Text style={[styles.welcome, { textAlign }]}>{t('dashboard.welcome')}</Text>
          <Text style={[styles.companyName, { textAlign }]}>{company?.name}</Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { alignItems: startAlign }]}>
            <Text style={[styles.statLabel, { textAlign }]}>{t('packages.adsLimit')}</Text>
            <Text style={[styles.statValue, { textAlign }]}>
              {subscriptionInfo.freeAdsRemaining ?? '-'}
            </Text>
          </View>
          <View style={[styles.statCard, { alignItems: startAlign }]}>
            <Text style={[styles.statLabel, { textAlign }]}>{t('packages.featuredLimit')}</Text>
            <Text style={[styles.statValue, { textAlign }]}>
              {subscriptionInfo.featuredAdsBalance ?? '-'}
            </Text>
          </View>
        </View>

        <View style={styles.menu}>
          <TouchableOpacity 
            style={[styles.menuItem, { alignItems: startAlign }]} 
            onPress={() => router.push('/company/properties')}
          >
            <Text style={[styles.menuTitle, { textAlign }]}>{t('dashboard.myProperties')}</Text>
            <Text style={[styles.menuSubtitle, { textAlign }]}>{t('dashboard.myPropertiesSub')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, { alignItems: startAlign }]}
            onPress={() => router.push('/company/offers')}
          >
            <Text style={[styles.menuTitle, { textAlign }]}>{t('dashboard.offers')}</Text>
            <Text style={[styles.menuSubtitle, { textAlign }]}>{t('dashboard.offersSub')}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.menuItem, { alignItems: startAlign }]} 
            onPress={() => router.push('/company/add')}
          >
            <Text style={[styles.menuTitle, { textAlign }]}>{t('dashboard.addProperty')}</Text>
            <Text style={[styles.menuSubtitle, { textAlign }]}>{t('dashboard.addPropertySub')}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.menuItem, { alignItems: startAlign }]} 
            onPress={() => router.push('/company/packages')}
          >
            <Text style={[styles.menuTitle, { textAlign }]}>{t('packages.title') || 'Packages'}</Text>
            <Text style={[styles.menuSubtitle, { textAlign }]}>{t('packages.viewAll') || 'View subscription plans'}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.menuItem, { alignItems: startAlign }]} 
            onPress={() => router.push('/company/my-subscriptions')}
          >
            <Text style={[styles.menuTitle, { textAlign }]}>{t('dashboard.mySubscriptions')}</Text>
            <Text style={[styles.menuSubtitle, { textAlign }]}>{t('dashboard.mySubscriptionsSub')}</Text>
          </TouchableOpacity>

          <TouchableOpacity  
            style={[styles.menuItem, { alignItems: startAlign }]} 
            onPress={() => router.push('/company/featured-packages')}
          >
            <Text style={[styles.menuTitle, { textAlign }]}>{t('dashboard.featuredPackages')}</Text>
            <Text style={[styles.menuSubtitle, { textAlign }]}>{t('dashboard.featuredPackagesSub')}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.menuItem, { alignItems: startAlign }]} 
            onPress={() => router.push('/company/notifications')}
          >
            <Text style={[styles.menuTitle, { textAlign }]}>{t('dashboard.notifications')}</Text>
            <Text style={[styles.menuSubtitle, { textAlign }]}>{t('dashboard.notificationsSub')}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.menuItem, { alignItems: startAlign }]} 
            onPress={() => router.push('/company/complaint-company')}
          >
            <Text style={[styles.menuTitle, { textAlign }]}>{t('complaints.companyTitle')}</Text>
            <Text style={[styles.menuSubtitle, { textAlign }]}>{t('complaints.companyDescription')}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.menuItem, { alignItems: startAlign }]} 
            onPress={() => router.push('/company/complaint-general')}
          >
            <Text style={[styles.menuTitle, { textAlign }]}>{t('complaints.generalTitle') || 'General Complaint'}</Text>
            <Text style={[styles.menuSubtitle, { textAlign }]}>{t('complaints.generalDescription') || 'Submit a general complaint or suggestion'}</Text>
          </TouchableOpacity>

          {['OWNER', 'MANAGER'].includes(company?.role || '') && (
            <>
              <TouchableOpacity 
                style={[styles.menuItem, { alignItems: startAlign }]} 
                onPress={() => router.push('/company/featured')}
              >
                <Text style={[styles.menuTitle, { textAlign }]}>{t('dashboard.featuredAds')}</Text>
                <Text style={[styles.menuSubtitle, { textAlign }]}>{t('dashboard.featuredAdsSub')}</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.menuItem, { alignItems: startAlign }]} 
                onPress={() => router.push('/company/employees')}
              >
                <Text style={[styles.menuTitle, { textAlign }]}>{t('employees.title')}</Text>
                <Text style={[styles.menuSubtitle, { textAlign }]}>{t('employees.addTitle')}</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        <Button 
          title={t('dashboard.logout')}
          onPress={handleLogout}
          variant="danger"
          style={styles.logoutButton}
        />
      </ScrollView>

      {/* Side Menu Modal */}
      <Modal
        visible={menuVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity 
          style={[
            styles.modalOverlay, 
            { 
              flexDirection: 'row', 
              justifyContent: startAlign,
            }
          ]} 
          activeOpacity={1} 
          onPress={() => setMenuVisible(false)}
        >
          <View style={[
            styles.menuContainer, 
            { position: 'relative', height: '100%' }
          ]}>
            <SafeAreaView edges={['top', 'bottom']}>
              <View style={[styles.menuHeader, { flexDirection }]}>
                 <Text style={[styles.sideMenuTitle, { textAlign }]}>{t('home.menu')}</Text>
                 <TouchableOpacity onPress={() => setMenuVisible(false)}>
                   <Ionicons name="close" size={24} color="#2c3e50" />
                 </TouchableOpacity>
              </View>
              
              <TouchableOpacity style={[styles.sideMenuItem, { flexDirection }]} onPress={() => {
                setMenuVisible(false);
                router.push('/');
              }}>
                <Ionicons name="home-outline" size={24} color="#34495e" />
                <Text style={styles.sideMenuItemText}>{t('home.title')}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.sideMenuItem, { flexDirection }]} onPress={() => {
                setMenuVisible(false);
                // Already on dashboard
              }}>
                <Ionicons name="grid-outline" size={24} color="#34495e" />
                <Text style={styles.sideMenuItemText}>{t('dashboard.title')}</Text>
              </TouchableOpacity>

              <View style={styles.menuDivider} />

              <TouchableOpacity style={[styles.sideMenuItem, { flexDirection }]} onPress={toggleLanguage}>
                <Ionicons name="language-outline" size={24} color="#34495e" />
                <Text style={styles.sideMenuItemText}>
                  {language === 'en' ? 'العربية' : 'English'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.sideMenuItem, { flexDirection }]} onPress={() => {
                setMenuVisible(false);
                handleLogout();
              }}>
                <Ionicons name="log-out-outline" size={24} color="#D1232A" />
                <Text style={[styles.sideMenuItemText, { color: '#D1232A' }]}>{t('dashboard.logout')}</Text>
              </TouchableOpacity>

            </SafeAreaView>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  header: {
    marginBottom: 30,
    alignItems: 'flex-start',
  },
  welcome: {
    fontSize: 16,
    color: '#C6A55E',
  },
  companyName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00305D',
  },
  statsContainer: {
    marginBottom: 30,
  },
  statCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    alignItems: 'flex-start',
  },
  statLabel: {
    fontSize: 14,
    color: '#C6A55E',
    marginBottom: 5,
  },
  statHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00305D',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00305D',
    textTransform: 'capitalize',
  },
  statSmall: {
    fontSize: 13,
    color: '#C6A55E',
    marginTop: 4,
  },
  statDivider: {
    height: 1,
    backgroundColor: '#ecf0f1',
    marginVertical: 12,
    alignSelf: 'stretch',
  },
  historyContainer: {
    marginBottom: 20,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00305D',
    marginBottom: 8,
  },
  historyItem: {
    paddingVertical: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: '#d0d7de',
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
  menu: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  menuItem: {
    width: '48%',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    minHeight: 130,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00305D',
    marginBottom: 5,
  },
  menuSubtitle: {
    fontSize: 14,
    color: '#C6A55E',
  },
  logoutButton: {
    marginTop: 20,
    marginBottom: 40,
  },
  // Side Menu Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  menuContainer: {
    width: '70%',
    backgroundColor: '#fff',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 10,
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sideMenuTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#00305D',
  },
  sideMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    gap: 12,
  },
  sideMenuItemText: {
    fontSize: 16,
    color: '#00305D',
    fontWeight: '500',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 15,
  },
});
