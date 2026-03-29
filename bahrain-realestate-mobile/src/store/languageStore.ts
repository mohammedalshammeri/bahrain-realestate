import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nManager, Platform } from 'react-native';
import * as Updates from 'expo-updates';
import i18n from '../i18n';

export type AppLanguage = 'en' | 'ar' | 'ur';

const setWebDirection = (lang: AppLanguage) => {
  if (Platform.OS !== 'web') return;
  if (typeof document === 'undefined') return;
  try {
    const dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.dir = dir;
    document.documentElement.lang = lang;
    console.log(`[RTL] Web direction set to: ${dir} for language: ${lang}`);
  } catch (error) {
    console.error('[RTL] Failed to set web direction:', error);
  }
};

interface LanguageStore {
  language: AppLanguage;
  isHydrated: boolean;
  setLanguage: (lang: AppLanguage) => Promise<void>;
  hydrate: () => Promise<void>;
}

const LANGUAGE_KEY = 'app_language';

const reloadAppAsync = async () => {
  if (Platform.OS === 'web') {
    // On web, no reload needed - state update + Stack key will handle re-render
    return;
  }

  // Attempt to reload the app using Updates.reloadAsync()
  // This works in Expo Go (reloads bundle) and builds (reloads app)
  try {
    await Updates.reloadAsync();
  } catch (error) {
    console.log('[RTL] Auto-reload failed. Please close and reopen the app to see RTL changes.', error);
  }
};

const applyNativeRTLIfNeeded = async (shouldBeRTL: boolean) => {
  if (Platform.OS === 'web') return;

  console.log(`[RTL] Current context: isRTL=${I18nManager.isRTL}, Target=${shouldBeRTL}`);

  // Ensure both allowRTL and forceRTL are set correctly
  // For LTR (English), we explicitly set allowRTL to false to help clean switching
  I18nManager.allowRTL(shouldBeRTL);
  I18nManager.forceRTL(shouldBeRTL);

  // If the current active direction differs from target, we MUST reload
  if (I18nManager.isRTL !== shouldBeRTL) {
    console.log(`[RTL] Direction mismatch detected. Reloading app in 100ms...`);
    
    // A slight delay helps ensure the native I18nManager preference is persisted 
    // before the JS bundle reloads.
    setTimeout(async () => {
      try {
        await reloadAppAsync();
      } catch (e) {
        console.error("[RTL] Reload failed inside timeout", e);
      }
    }, 100);
  } else {
     console.log(`[RTL] Direction matches. No reload needed.`);
  }
};

export const useLanguageStore = create<LanguageStore>((set) => ({
  language: 'en',
  isHydrated: false,

  setLanguage: async (lang) => {
    try {
      console.log(`[Language] Switching to: ${lang}`);
      
      // 1. Save preference first
      await AsyncStorage.setItem(LANGUAGE_KEY, lang);

      // 2. Update i18n instance
      await i18n.changeLanguage(lang);

      // 3. For web: update DOM direction
      setWebDirection(lang);

      // 4. For native: Apply RTL and reload if needed
      //    CRITICAL: This may reload the app, so state update happens after
      const shouldBeRTL = lang === 'ar';
      await applyNativeRTLIfNeeded(shouldBeRTL);

      // 5. ONLY update state AFTER RTL is finalized
      //    If reload happened, this line never executes (app restarted)
      //    If no reload needed, we update state now
      console.log(`[Language] RTL resolved, updating state to: ${lang}`);
      set({ language: lang, isHydrated: true });
    } catch (error) {
      console.error('[Language] Error setting language:', error);
      // Even on error, mark as hydrated to prevent infinite loading
      set({ isHydrated: true });
    }
  },

  hydrate: async () => {
    try {
      console.log('[Language] Starting hydration...');
      
      // 1. Read stored language preference
      const storedLang = await AsyncStorage.getItem(LANGUAGE_KEY);
      const lang: AppLanguage = storedLang === 'ar' || storedLang === 'en' || storedLang === 'ur' ? storedLang : 'en';
      
      console.log(`[Language] Stored language: ${lang}`);

      // 2. Update i18n instance
      await i18n.changeLanguage(lang);

      // 3. For web: update DOM direction
      setWebDirection(lang);

      // 4. For native: Apply RTL and reload if needed
      //    CRITICAL: This must happen BEFORE state update
      const shouldBeRTL = lang === 'ar';
      await applyNativeRTLIfNeeded(shouldBeRTL);

      // 5. ONLY update state AFTER RTL is finalized
      //    If reload happened, this never executes (app restarted)
      //    If no reload needed, we update state now
      console.log(`[Language] Hydration complete, setting language: ${lang}`);
      set({ language: lang, isHydrated: true });
    } catch (error) {
      console.error('[Language] Error hydrating language:', error);
      // Mark as hydrated even on error to prevent infinite loading
      set({ language: 'en', isHydrated: true });
    }
  },
}));
