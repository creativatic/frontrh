import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface EmployeeShiftDto {
  id?: string;
  employee_id: string;
  employeeId?: string;
  service_id?: string | null;
  serviceId?: string | null;
  location_id?: string | null;
  locationId?: string | null;
  schedule_id?: string | null;
  scheduleId?: string | null;
  date: string;
  notes?: string | null;
  service?: any;
  location?: any;
  schedule?: any;
  isRecurrent?: boolean;
  created_at?: string;
  updated_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class EmployeeShiftService {
  private readonly http = inject(HttpClient);

  getShifts(startDate: string, endDate: string): Promise<{ shifts: EmployeeShiftDto[] }> {
    const params = { start_date: startDate, end_date: endDate };
    return firstValueFrom(
      this.http.get<any>(`${environment.apiUrl}/employee-shifts`, { params })
    );
  }

  saveShifts(assignments: Partial<EmployeeShiftDto>[]): Promise<any> {
    return firstValueFrom(
      this.http.post<any>(`${environment.apiUrl}/employee-shifts`, { assignments })
    );
  }

  deleteShift(id: string): Promise<any> {
    return firstValueFrom(
      this.http.delete<any>(`${environment.apiUrl}/employee-shifts/${id}`)
    );
  }
}
