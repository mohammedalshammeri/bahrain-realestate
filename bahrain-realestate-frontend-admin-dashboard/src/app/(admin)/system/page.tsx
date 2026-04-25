'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';

type SystemSettingsMap = Record<string, string | undefined>;

export default function SystemPage() {
  const router = useRouter();
  const { t } = useLanguage();

  const [formData, setFormData] = useState({
    platformName: '',
    contactEmail: '',
    contactPhone: '',
    defaultFreeAds: '',
    defaultFeaturedAds: '',
    googleMapsApiKey: '',
    termsAndConditions: '',
    privacyPolicy: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch existing system settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const { getSettings } = await import('@/lib/api/adminApi');
        const response = await getSettings();
        if (response?.data) {
          const data = response.data as SystemSettingsMap;
          setFormData(prev => ({
            ...prev,
            platformName: data['platformName'] || data['general.siteName'] || '',
            contactEmail: data['contactEmail'] || data['general.contactEmail'] || '',
            contactPhone: data['supportPhone'] || data['general.supportPhone'] || '',
            defaultFreeAds: data['defaultAdLimit'] || '',
            googleMapsApiKey: data['googleMapsApiKey'] || '',
            termsAndConditions: data['termsAndConditions'] || '',
            privacyPolicy: data['privacyPolicy'] || '',
          }));
        }
      } catch (error) {
        console.error('Failed to load system settings:', error);
      }
    };
    loadSettings();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear messages when user types
    setError(null);
    setSuccessMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.platformName || !formData.contactEmail) {
      setError(t('system.messages.requiredFields'));
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const { updateSettings } = await import('@/lib/api/adminApi');
      await updateSettings({
        platformName: formData.platformName,
        contactEmail: formData.contactEmail,
        supportPhone: formData.contactPhone,
        defaultAdLimit: parseInt(formData.defaultFreeAds) || 0,
        googleMapsApiKey: formData.googleMapsApiKey,
        termsAndConditions: formData.termsAndConditions,
        privacyPolicy: formData.privacyPolicy
      });

      setSuccessMessage(t('system.messages.saveSuccess'));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('system.messages.saveFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push('/settings');
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('system.title')}</h1>
      
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Success Message */}
          {successMessage && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 px-4 py-3 rounded-md text-base">
              {successMessage}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-md text-base">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Platform Name */}
            <div>
              <label htmlFor="platformName" className="block text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('system.platformName')} {t('system.required')}
              </label>
              <input
                type="text"
                id="platformName"
                name="platformName"
                value={formData.platformName}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-base"
                placeholder={t('system.platformNamePlaceholder')}
              />
            </div>

            {/* Contact Email */}
            <div>
              <label htmlFor="contactEmail" className="block text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('system.contactEmail')} {t('system.required')}
              </label>
              <input
                type="email"
                id="contactEmail"
                name="contactEmail"
                value={formData.contactEmail}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-base"
                placeholder={t('system.contactEmailPlaceholder')}
              />
            </div>

            {/* Contact Phone */}
            <div>
              <label htmlFor="contactPhone" className="block text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('system.contactPhone')}
              </label>
              <input
                type="text"
                id="contactPhone"
                name="contactPhone"
                value={formData.contactPhone}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-base"
                placeholder={t('system.contactPhonePlaceholder')}
              />
            </div>

            {/* Default Free Ads */}
            <div>
              <label htmlFor="defaultFreeAds" className="block text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('system.defaultFreeAds')}
              </label>
              <input
                type="number"
                id="defaultFreeAds"
                name="defaultFreeAds"
                value={formData.defaultFreeAds}
                onChange={handleInputChange}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-base"
                placeholder={t('system.defaultFreeAdsPlaceholder')}
              />
            </div>

            {/* Default Featured Ads */}
            <div>
              <label htmlFor="defaultFeaturedAds" className="block text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('system.defaultFeaturedAds')}
              </label>
              <input
                type="number"
                id="defaultFeaturedAds"
                name="defaultFeaturedAds"
                value={formData.defaultFeaturedAds}
                onChange={handleInputChange}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-base"
                placeholder={t('system.defaultFeaturedAdsPlaceholder')}
              />
            </div>

            {/* Google Maps API Key */}
            <div className="md:col-span-2">
              <label htmlFor="googleMapsApiKey" className="block text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('system.googleMapsApiKey')}
              </label>
              <input
                type="text"
                id="googleMapsApiKey"
                name="googleMapsApiKey"
                value={formData.googleMapsApiKey}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-base"
                placeholder={t('system.googleMapsApiKeyPlaceholder')}
              />
            </div>
          </div>

          {/* Terms and Conditions */}
          <div>
            <label htmlFor="termsAndConditions" className="block text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('system.termsAndConditions')}
            </label>
            <textarea
              id="termsAndConditions"
              name="termsAndConditions"
              value={formData.termsAndConditions}
              onChange={handleInputChange}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-base"
              placeholder={t('system.termsAndConditionsPlaceholder')}
            />
          </div>

          {/* Privacy Policy */}
          <div>
            <label htmlFor="privacyPolicy" className="block text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('system.privacyPolicy')}
            </label>
            <textarea
              id="privacyPolicy"
              name="privacyPolicy"
              value={formData.privacyPolicy}
              onChange={handleInputChange}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-base"
              placeholder={t('system.privacyPolicyPlaceholder')}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 text-base font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {t('system.cancel')}
            </button>
            
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center px-4 py-2 text-base font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting && (
                <div className="animate-spin -ml-1 mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
              )}
              {isSubmitting ? t('system.saving') : t('system.saveSettings')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
