import api from './api';

export interface CompanySubscriptionInfo {
  id: number;
  name: string;
  status: 'pending' | 'approved' | 'rejected' | 'blocked';
  subscriptionPlan?: string;
  subscriptionStartDate?: string | null;
  subscriptionEndDate?: string | null;
  subscriptionStatus?: string;
  freeAdsRemaining: number;
  featuredAdsBalance: number;
}

export const getCompanyProfile = async (): Promise<CompanySubscriptionInfo> => {
  const response = await api.get<{ success: boolean; data: CompanySubscriptionInfo }>('/company/profile');
  return response.data.data;
};

export interface CompanySubscriptionHistoryItem {
  id: number;
  packageId: number;
  packageNameEn: string;
  packageNameAr: string;
  durationDays: number;
  createdAt: string;
  // Time when admin processed the request (approved/rejected)
  processedAt?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export const getCompanySubscriptionHistory = async (): Promise<CompanySubscriptionHistoryItem[]> => {
  const response = await api.get<{ success: boolean; data: CompanySubscriptionHistoryItem[] }>('/company/subscription-history');
  return response.data.data;
};
