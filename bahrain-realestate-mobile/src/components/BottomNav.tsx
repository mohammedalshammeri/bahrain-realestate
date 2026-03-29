import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { rowDirection } from '../utils/rtl';
import { useAuthStore } from '../store/authStore';
import { useIndividualAuthStore } from '../store/individualAuthStore';

export const BottomNav = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useTranslation();
  const rowDir = rowDirection();

  const { isAuthenticated: isCompanyAuthenticated } = useAuthStore();
  const { isAuthenticated: isIndividualAuth } = useIndividualAuthStore();
  const isAuthenticated = isCompanyAuthenticated || isIndividualAuth;

  const profileRoute = isCompanyAuthenticated 
    ? '/company' 
    : isIndividualAuth 
      ? '/individual' 
      : '/login';

  const profileLabel = isAuthenticated 
    ? (isCompanyAuthenticated ? t('dashboard.title', { defaultValue: 'Dashboard' }) : t('dashboard.title', { defaultValue: 'Dashboard' }))
    : t('auth.login', { defaultValue: 'Login' });

  const tabs = [
    {
      name: 'home',
      label: t('home.title', { defaultValue: 'Home' }),
      icon: 'home-outline',
      activeIcon: 'home',
      route: '/',
    },
    {
      name: 'categories',
      label: t('common.sections', { defaultValue: 'Categories' }),
      icon: 'grid-outline',
      activeIcon: 'grid',
      route: '/properties',
    },
    {
      name: 'profile',
      label: profileLabel,
      icon: isAuthenticated ? 'person-outline' : 'log-in-outline',
      activeIcon: isAuthenticated ? 'person' : 'log-in',
      route: profileRoute,
    },
  ];

  const handlePress = (route: string) => {
    if (pathname === route) return;
    
    // Use replace for main tabs to avoid building up a stack
    // But for navigation between main sections, push is safer in Expo Router to avoid losing history 
    // unless we want a true tab behavior
    router.push(route);
  };

  return (
    <View style={styles.container}>
      <View style={[styles.content, { flexDirection: rowDir }]}>
        {tabs.map((tab) => {
          // Check if tab is active (exact match or prefix for sections not sharing root)
          // Simplified active check:
          const isActive = pathname === tab.route || (tab.route !== '/' && pathname.startsWith(tab.route));
          
          // Special case for profile: if we are in company or individual routes, profile tab is active
          let isProfileActive = false;
          if (tab.name === 'profile') {
             if (isCompanyAuthenticated && pathname.startsWith('/company')) isProfileActive = true;
             else if (isIndividualAuth && pathname.startsWith('/individual')) isProfileActive = true;
             else if (!isAuthenticated && pathname.startsWith('/login')) isProfileActive = true;
          }

          // Special case for Categories (properties)
          const isCategoriesActive = tab.name === 'categories' && pathname.startsWith('/properties');

          // Special case for Home
          const isHomeActive = tab.name === 'home' && pathname === '/';

          const finalActive = isProfileActive || isCategoriesActive || isHomeActive;
          
          return (
            <TouchableOpacity
              key={tab.name}
              style={styles.tab}
              onPress={() => handlePress(tab.route)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={(finalActive ? tab.activeIcon : tab.icon) as any}
                size={24}
                color={finalActive ? '#0066CC' : '#8E8E93'}
              />
              <Text style={[styles.label, finalActive && styles.activeLabel]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <SafeAreaView edges={['bottom']} style={{ backgroundColor: '#fff' }} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  content: {
    flexDirection: 'row',
    height: 60,
    paddingBottom: Platform.OS === 'ios' ? 0 : 10,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  label: {
    fontSize: 10,
    marginTop: 4,
    color: '#8E8E93',
  },
  activeLabel: {
    color: '#0066CC',
    fontWeight: '600',
  },
});
