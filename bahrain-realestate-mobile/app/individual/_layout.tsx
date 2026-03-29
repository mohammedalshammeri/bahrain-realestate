import { Stack, useRouter, useSegments, usePathname } from 'expo-router';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { View, ActivityIndicator, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useIndividualAuthStore } from '../../src/store/individualAuthStore';

export default function IndividualLayout() {
  const { t } = useTranslation();
  const { isAuthenticated, isLoading, hydrate } = useIndividualAuthStore();
  const segments = useSegments();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    hydrate();
  }, []);

  useEffect(() => {
    // حماية إضافية: لا تسمح أبدًا بالتوجيه إلى صفحات الشركات من هنا
    if (pathname && pathname.startsWith('/company')) {
      router.replace('/individual/login');
      return;
    }
    // Debug: log current state
    console.log('INDIVIDUAL_LAYOUT', { pathname, isAuthenticated, isLoading });
    if (!isLoading && !isAuthenticated) {
      if (
        pathname !== '/individual/login' &&
        pathname !== '/individual/register' &&
        pathname !== '/individual/forgot-password' &&
        pathname !== '/individual/reset-password'
      ) {
        router.replace('/individual/login');
      }
      // إذا كان بالفعل في صفحة تسجيل الدخول أو التسجيل، لا تفعل شيء
    } else if (!isLoading && isAuthenticated) {
        // If already authenticated and trying to access auth pages, redirect to dashboard
        if (
            pathname === '/individual/login' ||
            pathname === '/individual/register' ||
            pathname === '/individual/forgot-password'
        ) {
            router.replace('/individual');
        }
    }
    // إذا كان مسجل دخول، لا تفعل شيء
  }, [isLoading, isAuthenticated, pathname]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Stack>
      <Stack.Screen 
        name="index" 
        options={{ 
          title: t('dashboard.title') || 'Dashboard',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.replace('/')} style={{ marginHorizontal: 10 }}>
               <Ionicons name={Platform.OS === 'ios' ? 'chevron-back' : 'arrow-back'} size={24} color="#000" />
            </TouchableOpacity>
          ),
        }} 
      />
      <Stack.Screen name="login" options={{ title: t('individual.loginTitle') || 'Individual Login' }} />
      <Stack.Screen name="register" options={{ title: t('individual.registerTitle') || 'Individual Registration' }} />
      <Stack.Screen name="forgot-password" options={{ title: t('auth.resetPasswordTitle') || 'Reset Password' }} />
      <Stack.Screen name="reset-password" options={{ title: t('auth.resetPasswordTitle') || 'Reset Password' }} />
      <Stack.Screen name="add" options={{ title: t('individual.addPropertyTitle') || 'Add Property' }} />
      <Stack.Screen name="profile" options={{ title: t('individual.editProfileTitle') || 'My Profile' }} />
    </Stack>
  );
}
