const API_BASE = process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL || 'http://localhost:8000/api/admin';

type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };
type JsonObject = { [key: string]: JsonValue };
type QueryValue = string | number | boolean | null | undefined;
type QueryParams = Record<string, QueryValue>;

function buildQueryString(params: QueryParams): string {
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') {
      continue;
    }

    query.set(key, String(value));
  }

  return query.toString();
}

interface LoginCredentials {
  username: string;
  password: string;
}

interface LoginResponseData {
  token: string;
  admin?: {
    id: number;
    name: string;
    username: string;
  };
}

interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface Company {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  licenseNumber: string;
  crNumber: string;
  licenseImageUrl?: string;
  employeesLimit: number;
  status: 'pending' | 'approved' | 'rejected' | 'blocked';
  freeAdsRemaining?: number;
  featuredAdsBalance?: number;
  subscriptionPlan?: string;
  subscriptionStartDate?: string;
  subscriptionEndDate?: string;
  subscriptionStatus?: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    properties: number;
    employees: number;
  };
}

export interface SubscriptionPackage {
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
  createdAt?: string;
  updatedAt?: string;
}

export interface SubscriptionRequest {
  id: number;
  companyId: number;
  subscriptionPackageId: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
  company: {
    id: number;
    name: string;
    email: string;
    phone: string;
    subscriptionPlan?: string;
  };
  package: SubscriptionPackage;
}

export type DistributeIndividualPropertyPayload =
  | { mode: 'ALL' }
  | { mode: 'COMPANY'; companyId: number }
  | { mode: 'COMPANIES'; companyIds: number[] };

export interface Property {
    remainingTime?: {
      days: number;
      hours: number;
      minutes: number;
    };
    isExpired?: boolean;
    expiresAt?: string;
  id: number;
  title: string;
  description: string;
  price: number;
  minimumPrice?: number;
  type: string;
  purpose: string;
  governorate: string;
  area: string;
  status:
    | 'available'
    | 'sold'
    | 'rented'
    | 'pending'
    | 'PENDING_ADMIN'
    | 'SENT_TO_COMPANIES'
    | 'ACTIVE'
    | 'REJECTED'
    | string;
  location: string;
  companyId?: number;
  ownerIndividualId?: number;
  company?: Company;
  createdBy?: {
    name: string;
    role: string;
  };
  createdAt: string;
  updatedAt: string;
  bedrooms?: number;
  bathrooms?: number;
  sqm?: number;
  latitude?: number;
  longitude?: number;
  images?: string[];
  videoUrl?: string | null;
  companyName?: string;
  isFeatured?: boolean;
  isFeaturedPlus?: boolean;
  durationDays?: number;
  propertyImages?: {
    id: number;
    imageUrl: string;
    displayOrder: number;
    isVideo: boolean;
  }[];
  // ...existing code...
}

export interface IndividualProperty {
  id: number;
  title?: string | null;
  description: string;
  minimumPrice: number;
  type: string;
  purpose: string;
  governorate: string;
  area: string;
  bedrooms?: number | null;
  bathrooms?: number | null;
  areaSqm?: number | null;
  furnishingStatus?: string | null;
  floorsCount?: number | null;
  floorNumber?: number | null;
  livingRooms?: number | null;
  buildingAge?: number | null;
  negotiable?: boolean;
  parkingCount?: number | null;
  condition?: string | null;
  showPhone?: boolean;
  enableWhatsapp?: boolean;
  branch?: string | null;
  status: string;
  adminRejectionReason?: string | null;
  expiresAt?: string | null;
  durationDays?: number | null;
  createdAt: string;
  updatedAt: string;
  owner: {
    id: number;
    fullName?: string | null;
    email?: string | null;
    phone?: string | null;
  };
  images?: string[];
  videoUrl?: string | null;
  videos?: string[];
  _count?: {
    offers: number;
  };
}

export interface IndividualPropertyOfferSummary {
  id: number;
  companyId: number;
  propertyId: number;
  companyPrice?: number | string | null;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  createdAt: string;
  updatedAt: string;
  company?: {
    id: number;
    name: string;
    status: string;
  };
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public data?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface Employee {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: 'OWNER' | 'MANAGER' | 'AGENT';
  isActive: boolean;
  companyId: number;
  company?: Company;
  createdAt: string;
  updatedAt: string;
}

export interface Complaint {
  id: number;
  companyId: number;
  propertyId?: number | null;
  submitterType: 'INDIVIDUAL' | 'COMPANY';
  
  // Individual submitter fields
  userName?: string;
  userPhone?: string;
  userEmail?: string;
  
  // Company submitter fields  
  submitterCompanyId?: number;
  submitterCompanyName?: string;
  submitterCompanyEmail?: string;
  submitterCompanyPhone?: string;
  
  message: string;
  status: 'new' | 'under_review' | 'resolved' | 'closed';
  adminNotes?: string;
  createdAt: string;
  resolvedAt?: string;
  
  // Relations
  company?: {
    id: number;
    name: string;
  };
  submitterCompany?: {
    id: number;
    name: string;
  };
  property?: {
    id: number;
    title?: string | null;
    purpose?: string;
    governorate?: string;
    area?: string;
    price?: number | string;
    companyId?: number;
    propertyImages?: Array<{
      imageUrl: string;
      displayOrder?: number;
      createdAt?: string;
    }>;
  };
}

export interface Ad {
  id: number;
  title: string;
  description: string;
  type: 'regular' | 'featured' | string;
  status: 'pending' | 'approved' | 'rejected' | 'active' | 'inactive' | string;
  rejectionReason?: string | null;
  startDate: string;
  endDate: string;
  propertyId?: number;
  companyId: number;
  createdAt: string;
  updatedAt: string;
  property?: {
    id: number;
    title: string;
    purpose: string;
    governorate: string;
    price: number;
    images: string[];
  };
  company?: {
    id: number;
    name: string;
    email: string;
    phone?: string;
    crNumber?: string;
  };
}

export interface DashboardStats {
  totalProperties: number;
  totalCompanies: number;
  totalComplaints: number;
  pendingComplaints: number;
  totalAds: number;
  totalFeaturedAdsSold: number;
  recentActivities: Array<{
    id: number;
    type: string;
    description: string;
    createdAt: string;
  }>;
}

export interface Payment {
  id: number;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  method: string;
  transactionId: string;
  description: string;
  companyId: number;
  company?: {
    id: number;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface AdminProfile {
  id: number;
  username: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

class AdminApiService {
  private token: string | null = null;

  constructor() {
    // Load token from localStorage on client side
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('adminToken');
    }
  }  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('adminToken', token);
      // Also set cookie for middleware
      document.cookie = `admin_token=${token}; path=/; max-age=${7 * 24 * 60 * 60}`; // 7 days
    }
  }
  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('adminToken');
      // Also clear cookie
      document.cookie = 'admin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    }
  }

  getToken(): string | null {
    return this.token;
  }
  private async request<T = unknown>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const url = `${API_BASE}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        cache: 'no-store',
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          this.clearToken();
          // Redirect to login if on client side
          if (typeof window !== 'undefined') {
            window.location.href = '/auth/login';
          }
        }
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API Request Error:', error);
      throw error;
    }
  }

  // Authentication
  async login(credentials: LoginCredentials): Promise<ApiResponse<LoginResponseData>> {
    const response = await this.request('/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }) as ApiResponse<LoginResponseData>;
    
    if (response.success && response.data?.token) {
      this.setToken(response.data.token);
    }
    
    return response;
  }

  async logout(): Promise<void> {
    this.clearToken();
    if (typeof window !== 'undefined') {
      window.location.href = '/auth/login';
    }
  }

  // Dashboard
  async getDashboardStats() {
    return this.request('/dashboard/stats');
  }

  // Companies
  async getCompanies(params: QueryParams = {}) {
    const query = buildQueryString({
      page: '1',
      limit: '10',
      ...params
    });
    
    return this.request(`/companies?${query}`);
  }

  async updateCompanyStatus(id: number, status: string, reason?: string) {
    return this.request(`/companies/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, reason }),
    });
  }

  async deleteCompany(id: number) {
    return this.request(`/companies/${id}`, {
      method: 'DELETE',
    });
  }

  // Properties
  async getProperties(params: QueryParams = {}) {
    const query = buildQueryString({
      page: '1',
      limit: '10',
      ...params
    });

    return this.request(`/properties?${query}`);
  }

  async updatePropertyDetails(
    id: number,
    data: Partial<
      Pick<
        Property,
        'title' | 'price' | 'purpose' | 'type' | 'governorate' | 'area' | 'bedrooms' | 'bathrooms' | 'description'
      >
    >,
  ) {
    return this.request(`/properties/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async getExpiringProperties() {
    return this.request('/properties/expiring');
  }

  // Individual Properties (admin)
  async getIndividualProperties(params: QueryParams = {}) {
    const query = buildQueryString({
      page: '1',
      limit: '10',
      t: Date.now().toString(), // Cache buster
      ...params,
    });
    return this.request(`/individual-properties?${query}`);
  }

  async getIndividualPropertyOffers(id: number) {
    return this.request(`/individual-properties/${id}/offers`);
  }

  async rejectIndividualProperty(id: number, reason: string) {
    return this.request(`/individual-properties/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async rejectIndividualPropertyWithOptions(id: number, payload: { reason: string; forceReject?: boolean }) {
    return this.request(`/individual-properties/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updateIndividualProperty(id: number, data: Partial<IndividualProperty>) {
    return this.request(`/individual-properties/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async resetIndividualPropertyToPending(id: number) {
    return this.request(`/individual-properties/${id}/reset`, {
      method: 'POST',
    });
  }

  async markIndividualPropertyAsSold(id: number, offerId?: number) {
    const body: { offerId?: number } = {};
    if (typeof offerId === 'number' && !Number.isNaN(offerId)) {
      body.offerId = offerId;
    }

    return this.request(`/individual-properties/${id}/mark-sold`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async deleteIndividualProperty(id: number) {
    return this.request(`/individual-properties/${id}`, {
      method: 'DELETE',
    });
  }

  async updatePropertyStatus(id: number, status: string, durationDays?: number, expiresAt?: string) {
    const body: { status: string; durationDays?: number; expiresAt?: string } = { status };
    if (typeof durationDays === 'number' && !Number.isNaN(durationDays)) body.durationDays = durationDays;
    if (expiresAt) body.expiresAt = expiresAt;

    return this.request(`/properties/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }

  async updatePropertyExpiry(id: number, days: number, hours: number, minutes: number) {
    return this.request(`/properties/${id}/expiry`, {
      method: 'PATCH',
      body: JSON.stringify({ days, hours, minutes }),
    });
  }

  // Individual property distribution (admin-only)
  async distributePropertyToCompanies(
    id: number,
    payload: DistributeIndividualPropertyPayload
  ) {
    return this.request(`/properties/${id}/distribute`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async deleteProperty(id: number) {
    return this.request(`/properties/${id}`, {
      method: 'DELETE',
    });
  }

  // Complaints
  async getComplaints(params: QueryParams = {}) {
    const query = buildQueryString({
      page: '1',
      limit: '10',
      ...params
    });
    return this.request(`/complaints?${query}`);
  }

  async updateComplaintStatus(id: number, status: string, notes?: string) {
    return this.request(`/complaints/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, notes }),
    });
  }

  // Ads
  async getAds(params: QueryParams = {}) {
    const query = buildQueryString({
      page: '1',
      limit: '10',
      ...params
    });
    return this.request(`/ads?${query}`);
  }

  async approveAd(id: number) {
    return this.request(`/ads/${id}/approve`, {
      method: 'POST',
    });
  }

  async rejectAd(id: number, reason: string) {
    return this.request(`/ads/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async updateAd(id: number, data: Partial<Pick<Ad, 'title' | 'description' | 'startDate' | 'endDate'>>) {
    return this.request(`/ads/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteAd(id: number) {
    return this.request(`/ads/${id}`, {
      method: 'DELETE',
    });
  }

  async setAdFeatured(id: number, featured: boolean) {
    return this.request(`/ads/${id}/featured`, {
      method: 'POST',
      body: JSON.stringify({ featured }),
    });
  }

  async getAdById(id: number) {
    return this.request(`/ads/${id}`);
  }

  // Payments
  async getPayments(params: QueryParams = {}) {
    const query = buildQueryString({
      page: '1',
      limit: '10',
      ...params
    });
    return this.request(`/payments?${query}`);
  }

  // Employees
  async getEmployees(params: QueryParams = {}) {
    const query = buildQueryString({
      page: '1',
      limit: '10',
      ...params
    });
    return this.request(`/employees?${query}`);
  }

  async updateEmployeeStatus(id: number, status: string) {
    return this.request(`/employees/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async createEmployee(companyId: number, data: JsonObject) {
    return this.request(`/companies/${companyId}/employees`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // System Employees
  async getSystemEmployees(params: QueryParams = {}) {
    const query = buildQueryString({
      page: '1',
      limit: '10',
      ...params
    });
    return this.request(`/system-employees?${query}`);
  }

  async getSystemEmployeeById(id: number) {
    return this.request(`/system-employees/${id}`);
  }

  async createSystemEmployee(data: JsonObject) {
    return this.request('/system-employees', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateSystemEmployee(id: number, data: JsonObject) {
    return this.request(`/system-employees/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteSystemEmployee(id: number) {
    return this.request(`/system-employees/${id}`, {
      method: 'DELETE',
    });
  }

  // Withdrawals
  async getWithdrawals(params: QueryParams = {}) {
    const query = buildQueryString({
      page: '1',
      limit: '10',
      ...params
    });
    return this.request(`/withdrawals?${query}`);
  }

  async approveWithdrawal(id: number) {
    return this.request(`/withdrawals/${id}/approve`, {
      method: 'POST',
    });
  }

  async rejectWithdrawal(id: number) {
    return this.request(`/withdrawals/${id}/reject`, {
      method: 'POST',
    });
  }

  async getWithdrawalById(id: number) {
    return this.request(`/withdrawals/${id}`);
  }

  // Get specific resources by ID
  async getCompanyById(id: number) {
    return this.request(`/companies/${id}`);
  }

  async getCompanyEmployees(companyId: number) {
    return this.request(`/companies/${companyId}/employees`);
  }

  async getPropertyById(id: number) {
    return this.request(`/properties/${id}`);
  }

  // Profile and Settings
  async getProfile() {
    return this.request('/profile');
  }

  async getSettings() {
    return this.request('/settings');
  }

  async updateSettings(settings: JsonObject) {
    return this.request('/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.token;
  }
}

export const adminApi = new AdminApiService();

// Standalone functions for easier imports
export const getCompanies = async (search?: string, page: number = 1, limit: number = 10, status?: string) => {
  const params: QueryParams = { page: page.toString(), limit: limit.toString() };
  if (search) {
    params.search = search;
  }
  if (status && status !== 'all') {
    params.status = status;
  }
  return adminApi.getCompanies(params);
};

export const getProperties = async (params: QueryParams = {}) => {
  return adminApi.getProperties(params);
};

export const updatePropertyDetails = (
  id: number,
  data: Partial<
    Pick<Property, 'title' | 'price' | 'purpose' | 'type' | 'governorate' | 'area' | 'bedrooms' | 'bathrooms' | 'description'>
  >,
) => {
  return adminApi.updatePropertyDetails(id, data);
};

export const getIndividualProperties = async (search?: string, status: string = 'all', page: number = 1, limit: number = 10) => {
  const params: QueryParams = { page: page.toString(), limit: limit.toString() };
  if (search) params.search = search;
  if (status && status !== 'all') params.status = status;
  return adminApi.getIndividualProperties(params);
};

export const rejectIndividualProperty = (id: number, reason: string) => {
  return adminApi.rejectIndividualProperty(id, reason);
};

export const rejectIndividualPropertyWithOptions = (id: number, payload: { reason: string; forceReject?: boolean }) => {
  return adminApi.rejectIndividualPropertyWithOptions(id, payload);
};

export const updateIndividualProperty = (id: number, data: Partial<IndividualProperty>) => {
  return adminApi.updateIndividualProperty(id, data);
};

export const resetIndividualPropertyToPending = (id: number) => {
  return adminApi.resetIndividualPropertyToPending(id);
};

export const markIndividualPropertyAsSold = (id: number, offerId?: number) => {
  return adminApi.markIndividualPropertyAsSold(id, offerId);
};

export const deleteIndividualProperty = (id: number) => {
  return adminApi.deleteIndividualProperty(id);
};

export const updateCompanyStatus = (id: number, status: string, reason?: string) => {
  return adminApi.updateCompanyStatus(id, status, reason);
};

export const deleteCompany = (id: number) => {
  return adminApi.deleteCompany(id);
};

export const getIndividualPropertyOffers = (id: number) => {
  return adminApi.getIndividualPropertyOffers(id);
};

// Additional standalone functions
export const getDashboardStats = () => {
  return adminApi.getDashboardStats();
};

export const getComplaints = async (status?: string, submitterType?: string, search?: string, page: number = 1, limit: number = 10, sortOrder: 'asc' | 'desc' = 'desc') => {
  const params: QueryParams = { page: page.toString(), limit: limit.toString() };
  if (status && status !== 'all') {
    params.status = status;
  }
  if (submitterType && submitterType !== 'all') {
    params.submitterType = submitterType;
  }
  if (search) {
    params.search = search;
  }
  if (sortOrder) {
    params.sort = sortOrder;
  }
  return adminApi.getComplaints(params);
};

export const getCompanyById = (id: number) => {
  return adminApi.getCompanyById(id);
};

export const getCompanyEmployees = (companyId: number) => {
  return adminApi.getCompanyEmployees(companyId);
};

export const getPropertyById = (id: number) => {
  return adminApi.getPropertyById(id);
};

export const getProfile = () => {
  return adminApi.getProfile();
};

export const getSettings = () => {
  return adminApi.getSettings();
};

export const updateSettings = (settings: JsonObject) => {
  return adminApi.updateSettings(settings);
};

export const updatePropertyStatus = (id: number, status: string, durationDays?: number, expiresAt?: string) => {
  return adminApi.updatePropertyStatus(id, status, durationDays, expiresAt);
};

export const updatePropertyExpiry = (id: number, days: number, hours: number, minutes: number) => {
  return adminApi.updatePropertyExpiry(id, days, hours, minutes);
};

export const distributePropertyToCompanies = (id: number, payload: DistributeIndividualPropertyPayload) => {
  return adminApi.distributePropertyToCompanies(id, payload);
};

export const getApprovedCompanies = async (search?: string, page: number = 1, limit: number = 200) => {
  return getCompanies(search, page, limit, 'approved');
};

export const deleteProperty = (id: number) => {
  return adminApi.deleteProperty(id);
};

export const updateComplaintStatus = (id: number, status: string, notes?: string) => {
  return adminApi.updateComplaintStatus(id, status, notes);
};

export const getAds = async (search?: string, adType?: string, status?: string, page: number = 1, limit: number = 10) => {
  const params: QueryParams = { page: page.toString(), limit: limit.toString() };
  if (search) params.search = search;
  if (adType) params.type = adType;
  if (status) params.status = status;
  return adminApi.getAds(params);
};

export const approveAd = (id: number) => {
  return adminApi.approveAd(id);
};

export const rejectAd = (id: number, reason: string) => {
  return adminApi.rejectAd(id, reason);
};

export const deleteAd = (id: number) => {
  return adminApi.deleteAd(id);
};

export const setAdFeatured = (id: number, featured: boolean) => {
  return adminApi.setAdFeatured(id, featured);
};

export const getAdById = (id: number) => {
  return adminApi.getAdById(id);
};

export const updateAd = (id: number, data: Partial<Pick<Ad, 'title' | 'description' | 'startDate' | 'endDate'>>) => {
  return adminApi.updateAd(id, data);
};

export const getPayments = async (search?: string, status?: string, page: number = 1, limit: number = 10) => {
  const params: QueryParams = { page: page.toString(), limit: limit.toString() };
  if (search) params.search = search;
  if (status) params.status = status;
  return adminApi.getPayments(params);
};

export const getEmployees = async (search?: string, role?: string, page: number = 1, limit: number = 10) => {
  const params: QueryParams = { page: page.toString(), limit: limit.toString() };
  if (search) params.search = search;
  if (role) params.role = role;
  return adminApi.getEmployees(params);
};

export const updateEmployeeStatus = (id: number, status: string) => {
  return adminApi.updateEmployeeStatus(id, status);
};

export const createEmployee = (companyId: number, data: JsonObject) => {
  return adminApi.createEmployee(companyId, data);
};

export const getSystemEmployees = async (search?: string, page: number = 1, limit: number = 10) => {
  const params: QueryParams = { page: page.toString(), limit: limit.toString() };
  if (search) params.search = search;
  return adminApi.getSystemEmployees(params);
};

export const getSystemEmployeeById = (id: number) => {
  return adminApi.getSystemEmployeeById(id);
};

export const createSystemEmployee = (data: JsonObject) => {
  return adminApi.createSystemEmployee(data);
};

export const updateSystemEmployee = (id: number, data: JsonObject) => {
  return adminApi.updateSystemEmployee(id, data);
};

export const deleteSystemEmployee = (id: number) => {
  return adminApi.deleteSystemEmployee(id);
};

export const getWithdrawals = async (search?: string, status?: string, page: number = 1, limit: number = 10) => {
  const params: QueryParams = { page: page.toString(), limit: limit.toString() };
  if (search) params.search = search;
  if (status) params.status = status;
  return adminApi.getWithdrawals(params);
};

export const approveWithdrawal = (id: number) => {
  return adminApi.approveWithdrawal(id);
};

export const rejectWithdrawal = (id: number) => {
  return adminApi.rejectWithdrawal(id);
};

export const getWithdrawalById = (id: number) => {
  return adminApi.getWithdrawalById(id);
};

export const updatePropertyFeatured = async (id: number, isFeatured?: boolean, isFeaturedPlus?: boolean) => {
  // Use the adminApi wrapper if possible, or fetch directly.
  // Since adminApi object is not fully visible here (likely above), I will use fetch similar to how other functions might be doing or assuming adminApi has generic methods?
  // Actually, examining the file content above, it seems it exports functions that call `adminApi.something`.
  // I should check if `adminApi` object is defined in this file.
  const token = localStorage.getItem('adminToken');
  const res = await fetch(`${API_BASE}/properties/${id}/featured`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ isFeatured, isFeaturedPlus })
  });

  if (!res.ok) {
    const error = await res.json();
    throw new ApiError(error.message || 'Failed to update property featured status');
  }

  return res.json();
};

// Packages
export const getPackages = async () => {
  const token = localStorage.getItem('adminToken');
  const res = await fetch(`${API_BASE}/packages`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to fetch packages');
  return res.json();
};

export const createPackage = async (data: Omit<SubscriptionPackage, 'id' | 'createdAt' | 'updatedAt'>) => {
  const token = localStorage.getItem('adminToken');
  const res = await fetch(`${API_BASE}/packages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to create package');
  return res.json();
};

export const updatePackage = async (id: number, data: Partial<SubscriptionPackage>) => {
  const token = localStorage.getItem('adminToken');
  const res = await fetch(`${API_BASE}/packages/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to update package');
  return res.json();
};

export const deletePackage = async (id: number) => {
  const token = localStorage.getItem('adminToken');
  const res = await fetch(`${API_BASE}/packages/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to delete package');
  return res.json();
};

export const getSubscriptionRequests = async () => {
  const token = localStorage.getItem('adminToken');
  const res = await fetch(`${API_BASE}/subscription-requests`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to fetch subscription requests');
  return res.json();
};

export const updateSubscriptionRequestStatus = async (id: number, status: 'APPROVED' | 'REJECTED', adminNotes?: string) => {
  const token = localStorage.getItem('adminToken');
  const res = await fetch(`${API_BASE}/subscription-requests/${id}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ status, adminNotes })
  });
  if (!res.ok) throw new Error('Failed to update request status');
  return res.json();
};

export type { LoginCredentials, ApiResponse };
