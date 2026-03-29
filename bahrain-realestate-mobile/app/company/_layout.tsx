import { Stack, useRouter, useSegments, usePathname } from 'expo-router';
import { useEffect } from 'react';
import { useAuthStore } from '../../src/store/authStore';
import { View, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';

export default function CompanyLayout() {
  const { t } = useTranslation();
  const { isAuthenticated, isLoading, hydrate, logout } = useAuthStore();
  const segments = useSegments();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    hydrate();
  }, []);

  useEffect(() => {
    // Debug: log current state
    console.log('COMPANY_LAYOUT', { pathname, isAuthenticated, isLoading });
    if (!isLoading && !isAuthenticated) {
      // Only enforce login if we are trying to access a company route
      // and prevent redirect loop if we are navigating away (e.g. to '/')
      if (
        pathname.startsWith('/company') &&
        pathname !== '/company/login' &&
        pathname !== '/company/register'
      ) {
        router.replace('/company/login');
      }
      // If already on login or register, do nothing (stay on page)
    }
    // If authenticated, do nothing (allow navigation)
  }, [isLoading, isAuthenticated, pathname]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#fff',
        },
        headerTintColor: '#000',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="login" 
        options={{ title: t('auth.companyLoginTitle') || 'Company Login' }} 
      />
      <Stack.Screen 
        name="index" 
        options={{ 
          title: t('dashboard.title'),
          headerLeft: () => null,
        }} 
      />
      <Stack.Screen 
        name="properties" 
        options={{ title: t('myProperties.title') }} 
      />
      <Stack.Screen 
        name="add" 
        options={{ title: t('addProperty.title') }} 
      />
      <Stack.Screen 
        name="edit/[id]" 
        options={{ title: t('addProperty.editTitle') }} 
      />
      <Stack.Screen 
        name="register" 
        options={{ title: t('auth.registerTitle') }} 
      />

      <Stack.Screen
        name="offers/index"
        options={{ title: t('offers.title') || 'Offers' }}
      />
      <Stack.Screen
        name="offers/[id]"
        options={{ title: t('offers.detailsTitle') || 'Offer Details' }}
      />

      <Stack.Screen
        name="featured-packages"
        options={{ title: t('featured.packages.title') || 'Featured Packages' }}
      />

      <Stack.Screen
        name="packages"
        options={{ title: t('packages.title') }}
      />

      <Stack.Screen
        name="my-subscriptions"
        options={{ title: t('dashboard.mySubscriptions') }}
      />

      <Stack.Screen
        name="complaint-company"
        options={{ title: t('complaints.companyTitle') || 'Company Complaint' }}
      />

      <Stack.Screen
        name="complaint-general"
        options={{ title: t('complaints.generalTitle') || 'General Complaint' }}
      />

      <Stack.Screen
        name="employees/index"
        options={{ title: t('employees.title') || 'Employees' }}
      />

      <Stack.Screen
        name="employees/add"
        options={{ title: t('employees.addTitle') || 'Add Employee' }}
      />

      <Stack.Screen
        name="featured/index"
        options={{ title: t('dashboard.featuredAds') || 'Featured Ads' }}
      />

      <Stack.Screen
        name="featured/[id]"
        options={{ title: t('featured.selectDuration') || 'Select Duration' }}
      />

      <Stack.Screen
        name="notifications"
        options={{ title: t('notifications.title') || 'Notifications' }}
      />
    </Stack>
  );
}
