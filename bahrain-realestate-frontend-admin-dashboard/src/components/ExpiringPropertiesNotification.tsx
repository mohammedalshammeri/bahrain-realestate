
"use client";
import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/api/adminApi';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';

export default function ExpiringPropertiesNotification() {
  const { t, language, direction } = useLanguage();
  const [expiringProps, setExpiringProps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [minimized, setMinimized] = useState(false);

  useEffect(() => {
    const fetchExpiring = async () => {
      try {
        const response: any = await adminApi.getExpiringProperties();
        if (response.success && Array.isArray(response.data)) {
          setExpiringProps(response.data);
        }
      } catch (err) {
        console.error('Failed to fetch expiring properties', err);
      } finally {
        setLoading(false);
      }
    };
    fetchExpiring();
  }, []);

  if (loading || expiringProps.length === 0) return null;

  if (minimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button 
          onClick={() => setMinimized(false)}
          className="bg-red-600 text-white rounded-full p-4 shadow-lg flex items-center gap-2 animate-bounce"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-bold">{expiringProps.length}</span>
        </button>
      </div>
    );
  }

  return (
    <div
      className="fixed bottom-4 right-4 z-[60] max-w-sm w-full bg-white dark:bg-gray-800 rounded-lg shadow-2xl border-l-4 border-red-500 overflow-hidden"
      dir={direction}
    >
      <div className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center">
            <span className="flex p-2 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 ml-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {t('dashboard.expiring.title')}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('dashboard.expiring.description', { count: expiringProps.length })}
              </p>
            </div>
          </div>
          <button onClick={() => setMinimized(true)} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
        
        <div className="max-h-60 overflow-y-auto pr-1 custom-scrollbar space-y-2">
          {expiringProps.map((prop, idx) => (
             <div key={idx} className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded border border-gray-100 dark:border-gray-700">
               <div className="font-semibold text-gray-800 dark:text-white text-sm mb-1 line-clamp-1">{prop.title || 'عقار بدون عنوان'}</div>
               <div className="text-xs text-gray-500 dark:text-gray-400 flex justify-between items-center">
                 <span>{prop.company?.name}</span>
                 <span className="text-red-500 font-mono" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                  {(() => {
                    const h = Math.max(0, Math.floor((new Date(prop.expiresAt).getTime() - new Date().getTime()) / 3600000));
                    return t('dashboard.expiring.hoursLeft', { hours: h });
                  })()}
                 </span>
               </div>
               {prop.company?.phone && (
                   <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600 flex justify-end">
                       <a href={`tel:${prop.company.phone}`} className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center">
                           <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                           </svg>
                           {t('dashboard.expiring.callOwner', { phone: prop.company.phone })}
                       </a>
                   </div>
               )}
             </div>
          ))}
        </div>
        
        <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 text-center">
             <Link href="/properties?status=active" className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500">
               {t('dashboard.expiring.viewAll')}
             </Link>
        </div>
      </div>
    </div>
  );
}
