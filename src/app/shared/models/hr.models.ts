export interface Company {
  id: string;
  name: string;
  ruc: string;
}

export interface Employee {
  id: string;
  dni: string;
  firstName: string;
  lastName: string;
  fullName: string;
  position: string;
  phone: string;
  email: string;
  birthDate: string;
  hireDate: string;
  terminationDate?: string | null;
  address: string;
  district: string;
  province: string;
  department: string;
  ubigeoCode: string;
  bloodType: string;
  gender: string;
  civilStatus: string;
  hasFamilyAllowance: boolean;
  childrenCount: number;
  basicSalary: number;
  bankName: string;
  bankAccount: string;
  cci?: string | null;
  pensionSystem: string;
  educationLevel: string;
  professionalDegree?: string | null;
  yearsExperience: number;
  emergencyContactName: string;
  emergencyContactPhone: string;
  shoeSize?: string | null;
  pantsSize?: string | null;
  shirtSize?: string | null;
  qrCodeToken?: string;
  createdAt?: string | null;
  updatedAt?: string | null;
  
  // Relaciones cargadas opcionalmente
  contracts?: Contract[];
  activeContract?: Contract | null;
}

export interface Contract {
  id: string;
  companyId: string;
  employeeId: string;
  nature: string;
  modality?: string | null;
  startDate: string;
  endDate?: string | null;
  salary: number;
  status: 'active' | 'expired' | 'terminated';
  createdAt?: string | null;
  updatedAt?: string | null;
  
  // Relaciones cargadas opcionalmente
  employee?: Employee;
}

export interface AttendanceRecord {
  id?: string | null;
  employeeId: string;
  employee: {
    dni: string;
    fullName: string;
    position: string;
    department: string;
  };
  date: string | null;
  clockIn: string | null;
  clockOut: string | null;
  hours: number | null;
  status: string;
  origin: string | null;
  photoInPath?: string | null;
  photoOutPath?: string | null;
  justificationType?: string | null;
  justificationNotes?: string | null;
  latitude?: number;
  longitude?: number;
}

export interface AttendanceSummary {
  totalActiveEmployees: number;
  clockedInCount: number;
  tardanzasCount: number;
  justifiedAbsencesCount: number;
  weeklyOvertimeHours: number;
}

export interface AttendanceResponse {
  date: string;
  summary: AttendanceSummary;
  records: AttendanceRecord[];
}

export interface LeaveRequest {
  id: string;
  companyId: string;
  employeeId: string;
  startDate: string;
  endDate: string;
  status: 'pending' | 'approved' | 'rejected';
  reason?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  employee?: Employee;
}
