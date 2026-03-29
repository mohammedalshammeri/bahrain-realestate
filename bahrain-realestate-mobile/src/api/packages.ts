import api from './api';

export interface Package {
  id: number;
  nameAr: string;
  nameEn: string;
  price: number;
  durationDays: number;
  adsLimit: number;
  featuredAdsLimit: number;
  descriptionAr?: string;
  descriptionEn?: string;
  isActive: boolean;
}

export const getPackages = async () => {
  const response = await api.get<{ data: Package[] }>('/public/packages');
  return response.data.data;
};

export const requestSubscription = async (packageId: number) => {
  const response = await api.post('/company/subscription-requests', { packageId });
  return response.data;
};
