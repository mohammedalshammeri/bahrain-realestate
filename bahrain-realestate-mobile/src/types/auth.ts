export interface CompanyProfile {
  id: number;
  name: string;
  email: string;
  phone: string;
  status: 'pending' | 'approved' | 'rejected' | 'blocked';
  role: 'OWNER' | 'MANAGER' | 'AGENT';
}

export interface AuthState {
  token: string | null;
  company: CompanyProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    company: CompanyProfile;
  };
}
