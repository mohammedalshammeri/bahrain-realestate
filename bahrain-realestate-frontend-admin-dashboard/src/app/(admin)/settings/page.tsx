'use client';

import { useState, useEffect } from 'react';
import { updateSettings, getSettings, ApiError } from '@/lib/api/adminApi';
import { useLanguage } from '@/contexts/LanguageContext';

export default function SettingsPage() {
  const { t } = useLanguage();
  // State for general settings
  const [generalSettings, setGeneralSettings] = useState({
    websiteName: '',
    supportEmail: '',
    supportPhone: ''
  });

  // State for payment & AFS settings
  const [paymentSettings, setPaymentSettings] = useState({
    afsMerchantId: '',
    afsApiKey: '',
    afsCallbackUrl: ''
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);

  // Fetch current settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await getSettings();
        if (response?.data) {
          const data = response.data;
          setGeneralSettings({
            websiteName: data['general.siteName'] || 'Bahrain Property Hub',
            supportEmail: data['general.contactEmail'] || '',
            supportPhone: data['general.supportPhone'] || '',
          });
          setPaymentSettings({
            afsMerchantId: data['payment.merchantId'] || '',
            afsApiKey: data['payment.apiKey'] || '',
            afsCallbackUrl: data['payment.webhookUrl'] || '',
          });
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      } finally {
        setIsLoadingSettings(false);
      }
    };
    loadSettings();
  }, []);

  const handleGeneralChange = (field: string, value: string) => {
    setGeneralSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePaymentChange = (field: string, value: string) => {
    setPaymentSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };
  const handleSaveChanges = async () => {
    setIsSaving(true);
    
    try {
      const { updateSettings } = await import('@/lib/api/adminApi');
      
      const settingsData = {
        general: {
          siteName: generalSettings.websiteName,
          contactEmail: generalSettings.supportEmail,
          supportPhone: generalSettings.supportPhone
        },
        payment: {
          merchantId: paymentSettings.afsMerchantId,
          apiKey: paymentSettings.afsApiKey,
          webhookUrl: paymentSettings.afsCallbackUrl
        }
      };
      
      await updateSettings(settingsData);
      alert(t('settings.messages.saveSuccess'));
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert(t('settings.messages.saveFailed'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('settings.title')}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General Settings Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">{t('settings.general.title')}</h2>
          
          <div className="space-y-4">
            {/* Website Name */}
            <div>
              <label htmlFor="websiteName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('settings.general.websiteName')}
              </label>
              <input
                type="text"
                id="websiteName"
                value={generalSettings.websiteName}
                onChange={(e) => handleGeneralChange('websiteName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                placeholder={t('settings.general.websiteNamePlaceholder')}
              />
            </div>

            {/* Support Email */}
            <div>
              <label htmlFor="supportEmail" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('settings.general.supportEmail')}
              </label>
              <input
                type="email"
                id="supportEmail"
                value={generalSettings.supportEmail}
                onChange={(e) => handleGeneralChange('supportEmail', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                placeholder={t('settings.general.supportEmailPlaceholder')}
              />
            </div>

            {/* Support Phone */}
            <div>
              <label htmlFor="supportPhone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('settings.general.supportPhone')}
              </label>
              <input
                type="tel"
                id="supportPhone"
                value={generalSettings.supportPhone}
                onChange={(e) => handleGeneralChange('supportPhone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                placeholder={t('settings.general.supportPhonePlaceholder')}
              />
            </div>
          </div>
        </div>

        {/* Payment & AFS Settings Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">{t('settings.payment.title')}</h2>
          
          <div className="space-y-4">
            {/* AFS Merchant ID */}
            <div>
              <label htmlFor="afsMerchantId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('settings.payment.merchantId')}
              </label>
              <input
                type="text"
                id="afsMerchantId"
                value={paymentSettings.afsMerchantId}
                onChange={(e) => handlePaymentChange('afsMerchantId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                placeholder={t('settings.payment.merchantIdPlaceholder')}
              />
            </div>

            {/* AFS API Key */}
            <div>
              <label htmlFor="afsApiKey" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('settings.payment.apiKey')}
              </label>
              <input
                type="password"
                id="afsApiKey"
                value={paymentSettings.afsApiKey}
                onChange={(e) => handlePaymentChange('afsApiKey', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                placeholder={t('settings.payment.apiKeyPlaceholder')}
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {t('settings.payment.description')}
              </p>
            </div>

            {/* AFS Callback URL */}
            <div>
              <label htmlFor="afsCallbackUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('settings.payment.callbackUrl')}
              </label>
              <input
                type="url"
                id="afsCallbackUrl"
                value={paymentSettings.afsCallbackUrl}
                onChange={(e) => handlePaymentChange('afsCallbackUrl', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                placeholder={t('settings.payment.callbackUrlPlaceholder')}
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {t('settings.payment.description')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSaveChanges}
          disabled={isSaving}
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSaving ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {t('settings.actions.saving')}
            </>
          ) : (
            <>
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {t('settings.actions.saveChanges')}
            </>
          )}
        </button>
      </div>

      {/* Settings Information */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400 dark:text-blue-300" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3 rtl:mr-3 rtl:ml-0">
            <h3 className="text-base font-medium text-blue-800 dark:text-blue-200">
              {t('settings.info.title')}
            </h3>
            <div className="mt-2 text-base text-blue-700 dark:text-blue-300">
              <p>
                • {t('settings.info.generalInfo')}
              </p>
              <p>
                • {t('settings.info.afsInfo')}
              </p>
              <p>
                • {t('settings.info.testingInfo')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
