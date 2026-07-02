import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface RosterAssignmentDto {
  id?: string;
  employeeId: string;
  serviceId: string;
  locationId: string;
  scheduleId: string;
  startDate: string;
  endDate?: string | null;
  status?: string;
  days: string[];
}

export interface BulkRosterAssignmentDto {
  employeeIds: string[];
  serviceId: string;
  locationId: string;
  scheduleId: string;
  startDate: string;
  endDate?: string | null;
  days: string[];
  notes?: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class RosterService {
  private readonly http = inject(HttpClient);

  getShifts(semana: string, serviceId?: string, colaborador?: string): Promise<{ shifts: any[] }> {
    let params = new HttpParams().set('semana', semana);
    if (serviceId) params = params.set('servicio_id', serviceId);
    if (colaborador) params = params.set('colaborador', colaborador);

    return firstValueFrom(
      this.http.get<{ shifts: any[] }>(`${environment.apiUrl}/roster-assignments`, { params })
    );
  }

  saveRosterAssignment(payload: RosterAssignmentDto): Promise<any> {
    return firstValueFrom(
      this.http.post<any>(`${environment.apiUrl}/roster-assignments`, payload)
    );
  }

  updateRosterAssignment(id: string, payload: RosterAssignmentDto): Promise<any> {
    return firstValueFrom(
      this.http.put<any>(`${environment.apiUrl}/roster-assignments/${id}`, payload)
    );
  }

  deleteRosterAssignment(id: string): Promise<any> {
    return firstValueFrom(
      this.http.delete<any>(`${environment.apiUrl}/roster-assignments/${id}`)
    );
  }

  saveBulkRosterAssignments(payload: BulkRosterAssignmentDto): Promise<any> {
    return firstValueFrom(
      this.http.post<any>(`${environment.apiUrl}/roster-assignments/bulk`, payload)
    );
  }
}
