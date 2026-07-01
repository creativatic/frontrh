export interface CompanyInfo {
  id: string;
  name: string;
  ruc: string;
  rolesPermissions?: any;
}

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'RRHH' | 'COLABORADOR' | 'GUARDIA' | 'admin' | 'rrhh' | 'colaborador' | 'guardia';
  companyId: string;
  company?: CompanyInfo;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  user: AuthenticatedUser;
}
