import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useLanguageStore } from '../src/store/languageStore';
import { useAuthStore } from '../src/store/authStore';
import { useIndividualAuthStore } from '../src/store/individualAuthStore';
import { useLocationStore } from '../src/store/locationStore';
import { ToastProvider } from '../src/context/ToastContext';
import { ActivityIndicator, Image, View } from 'react-native';
import { BottomNav } from '../src/components/BottomNav';
import { ErrorBoundary } from '../src/components/ErrorBoundary';
import '../src/i18n'; // Initialize i18n

export default function Layout() {
  const { t } = useTranslation();
  const { hydrate: hydrateLanguage, language, isHydrated } = useLanguageStore();
  const { hydrate: hydrateAuth } = useAuthStore();
  const { hydrate: hydrateIndividualAuth } = useIndividualAuthStore();
  const { fetchLocations } = useLocationStore();
  const [isLoaded, setIsLoaded] = useState(false);


  useEffect(() => {
    const init = async () => {
      // LanguageStore handles native RTL decision + reload.
      await hydrateLanguage();

      await Promise.all([hydrateAuth(), hydrateIndividualAuth(), fetchLocations()]);
      setIsLoaded(true);
    };
    init();
  }, []);

  if (!isHydrated || !isLoaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff' }}>
        <Image
          source={require('../assets/WhatsApp Image 2026-02-17 at 1.59.17 PM.jpeg')}
          style={{ width: 220, height: 220, marginBottom: 16 }}
          resizeMode="contain"
        />
        <ActivityIndicator size="large" color="#00305D" />
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ToastProvider>
          <StatusBar style="dark" />
        {/* paddingBottom أعلى من ارتفاع الفوتر ليكون هناك فراغ واضح بين آخر المحتوى و BottomNav */}
        <View style={{ flex: 1, paddingBottom: 96 }}>
          <Stack
            key={language}
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
            name="index"
            options={{
              title: t('home.title'),
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="login"
            options={{
              title: t('auth.loginTitle'),
              presentation: 'modal',
            }}
          />
          <Stack.Screen
            name="forgot-password"
            options={{
              title: t('auth.resetPasswordTitle'),
              presentation: 'modal',
            }}
          />
          <Stack.Screen
            name="reset-password"
            options={{
              title: t('auth.resetPasswordTitle'),
              presentation: 'modal',
            }}
          />
          <Stack.Screen
            name="company"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="individual"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="property/[id]"
            options={{
              title: t('property.details'),
              headerBackTitle: t('common.back'),
            }}
          />
          <Stack.Screen
            name="complaints"
            options={{
              title: t('complaints.title') || 'الشكاوى',
              headerBackTitle: t('common.back'),
            }}
          />
          <Stack.Screen
            name="properties"
            options={{
              title: t('home.title'),
              headerBackTitle: t('common.back'),
            }}
          />
          </Stack>
          <BottomNav />
        </View>
      </ToastProvider>
    </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
