export interface Employee {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: 'OWNER' | 'MANAGER' | 'AGENT';
  isActive: boolean;
  createdAt: string;
}

export interface EmployeeListResponse {
  success: boolean;
  data: Employee[];
}
