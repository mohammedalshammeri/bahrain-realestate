
'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getPackages, createPackage, updatePackage, deletePackage, SubscriptionPackage } from '@/lib/api/adminApi';

export default function PackagesPage() {
  const { t, language } = useLanguage();
  const [packages, setPackages] = useState<SubscriptionPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingPkg, setEditingPkg] = useState<SubscriptionPackage | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    nameAr: '',
    nameEn: '',
    price: 0,
    durationDays: 30,
    adsLimit: 0,
    featuredAdsLimit: 0,
    descriptionAr: '',
    descriptionEn: '',
  });

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const res = await getPackages();
      if (res.success) {
        setPackages(res.data);
      }
    } catch (err) {
      setError('Failed to load packages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  const handleOpenModal = (pkg?: SubscriptionPackage) => {
    if (pkg) {
      setEditingPkg(pkg);
      setFormData({
        nameAr: pkg.nameAr,
        nameEn: pkg.nameEn,
        price: pkg.price,
        durationDays: pkg.durationDays,
        adsLimit: pkg.adsLimit,
        featuredAdsLimit: pkg.featuredAdsLimit,
        descriptionAr: pkg.descriptionAr || '',
        descriptionEn: pkg.descriptionEn || '',
      });
    } else {
      setEditingPkg(null);
      setFormData({
        nameAr: '',
        nameEn: '',
        price: 0,
        durationDays: 30,
        adsLimit: 0,
        featuredAdsLimit: 0,
        descriptionAr: '',
        descriptionEn: '',
      });
    }
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      if (editingPkg) {
        await updatePackage(editingPkg.id, formData);
      } else {
        await createPackage(formData);
      }
      setShowModal(false);
      fetchPackages();
    } catch (err) {
      alert('Failed to save package');
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this package?')) {
      try {
        await deletePackage(id);
        fetchPackages();
      } catch (err) {
        alert('Failed to delete package');
      }
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t('packages.title')}
        </h1>
        <button
          onClick={() => handleOpenModal()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
        >
          {t('packages.add')}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {packages.map((pkg) => (
          <div key={pkg.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {language === 'ar' ? pkg.nameAr : pkg.nameEn}
                </h3>
                <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded dark:bg-blue-200 dark:text-blue-800">
                  {pkg.price} {t('common.currency')}
                </span>
              </div>
              
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300 mb-6">
                <p>
                    <span className="font-semibold">{language === 'ar' ? 'المدة:' : 'Duration:'}</span> {pkg.durationDays} {language === 'ar' ? 'يوم' : 'Days'}
                </p>
                <p>
                    <span className="font-semibold">{language === 'ar' ? 'إعلانات:' : 'Ads:'}</span> {pkg.adsLimit}
                </p>
                <p>
                    <span className="font-semibold">{language === 'ar' ? 'اعلانات مميزة:' : 'Featured:'}</span> {pkg.featuredAdsLimit}
                </p>
                {pkg.descriptionEn && (
                    <p className="text-gray-500 text-xs mt-2 italic">
                        {language === 'ar' ? pkg.descriptionAr : pkg.descriptionEn}
                    </p>
                )}
              </div>
            </div>

            <div className="flex gap-2 pt-4 border-t border-gray-100 dark:border-gray-700">
              <button
                onClick={() => handleOpenModal(pkg)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                {language === 'ar' ? 'تعديل' : 'Edit'}
              </button>
              <button
                onClick={() => handleDelete(pkg.id)}
                className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                 {language === 'ar' ? 'حذف' : 'Delete'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-lg p-6 shadow-xl relative">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
              {editingPkg ? t('packages.edit') : t('packages.add')}
            </h2>
            
            <div className="space-y-4 max-h-[70vh] overflow-y-auto p-1">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('packages.form.nameAr')}</label>
                  <input
                    type="text"
                    value={formData.nameAr}
                    onChange={(e) => setFormData({...formData, nameAr: e.target.value})}
                    className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('packages.form.nameEn')}</label>
                  <input
                    type="text"
                    value={formData.nameEn}
                    onChange={(e) => setFormData({...formData, nameEn: e.target.value})}
                    className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 p-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('packages.form.price')}</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: Number(e.target.value)})}
                    className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('packages.form.durationDays')}</label>
                  <input
                    type="number"
                    value={formData.durationDays}
                    onChange={(e) => setFormData({...formData, durationDays: Number(e.target.value)})}
                    className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 p-2"
                  />
                </div>
              </div>

               <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('packages.form.adsLimit')}</label>
                  <input
                    type="number"
                    value={formData.adsLimit}
                    onChange={(e) => setFormData({...formData, adsLimit: Number(e.target.value)})}
                    className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('packages.form.featuredAdsLimit')}</label>
                  <input
                    type="number"
                    value={formData.featuredAdsLimit}
                    onChange={(e) => setFormData({...formData, featuredAdsLimit: Number(e.target.value)})}
                    className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 p-2"
                  />
                </div>
              </div>

              <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('packages.form.descriptionAr')}</label>
                  <textarea
                    value={formData.descriptionAr}
                    onChange={(e) => setFormData({...formData, descriptionAr: e.target.value})}
                    className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 p-2"
                    rows={2}
                  />
              </div>
              <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('packages.form.descriptionEn')}</label>
                  <textarea
                    value={formData.descriptionEn}
                    onChange={(e) => setFormData({...formData, descriptionEn: e.target.value})}
                    className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 p-2"
                    rows={2}
                  />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg dark:bg-gray-700 dark:text-white"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
              >
                {t('common.save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
