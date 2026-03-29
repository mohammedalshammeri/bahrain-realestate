'use client';

import React, { createContext, useContext, useLayoutEffect, useState } from 'react';

type Language = 'en' | 'ar';
type Direction = 'ltr' | 'rtl';

interface LanguageContextType {
  language: Language;
  direction: Direction;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Simple dictionary implementation
import { en } from '@/i18n/en';
import { ar } from '@/i18n/ar';

const dictionaries = {
  en,
  ar,
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');
  const [direction, setDirection] = useState<Direction>('ltr');
  const [mounted, setMounted] = useState(false);

  const updateLanguage = (lang: Language) => {
    setLanguageState(lang);
    const dir = lang === 'ar' ? 'rtl' : 'ltr';
    setDirection(dir);
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
    if (typeof window !== 'undefined') {
      localStorage.setItem('language', lang);
    }
  };

  useLayoutEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLang = localStorage.getItem('language') as Language;
      const lang = (savedLang && (savedLang === 'en' || savedLang === 'ar')) ? savedLang : 'en';
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLanguageState(lang);
      const dir = lang === 'ar' ? 'rtl' : 'ltr';
      setDirection(dir);
      document.documentElement.lang = lang;
      document.documentElement.dir = dir;
    }
    setMounted(true);
  }, []);

  const t = (path: string, params?: Record<string, string | number>) => {
    const keys = path.split('.');
    let current: unknown = dictionaries[language];
    
    for (const key of keys) {
      if (typeof current !== 'object' || current === null || !(key in current)) {
        console.warn(`Translation missing for key: ${path}`);
        return path;
      }
      current = (current as Record<string, unknown>)[key];
    }
    
    if (typeof current !== 'string') {
      console.warn(`Translation key ${path} is not a string`);
      return path;
    }
    
    let result = current;
    
    // Replace parameters like {status}, {count}, etc.
    if (params) {
      Object.keys(params).forEach(key => {
        result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), String(params[key]));
      });
    }
    
    return result;
  };

  if (!mounted) {
    return (
      <LanguageContext.Provider value={{ language, direction, setLanguage: updateLanguage, t }}>
        <div dir={direction} className={language === 'ar' ? 'font-arabic' : 'font-sans'}>
          {children}
        </div>
      </LanguageContext.Provider>
    );
  }

  return (
    <LanguageContext.Provider value={{ language, direction, setLanguage: updateLanguage, t }}>
      <div dir={direction} className={language === 'ar' ? 'font-arabic' : 'font-sans'}>
        {children}
      </div>
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
