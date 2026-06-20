import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AttendanceResponse } from '../models/hr.models';

@Injectable({
  providedIn: 'root'
})
export class AttendanceService {
  private readonly http = inject(HttpClient);

  getAttendance(date?: string, department?: string): Promise<AttendanceResponse> {
    let params = new HttpParams();
    if (date) params = params.set('date', date);
    if (department) params = params.set('department', department);

    return firstValueFrom(
      this.http.get<AttendanceResponse>(`${environment.apiUrl}/attendance`, { params })
    );
  }

  clock(employeeId: string): Promise<{ message: string; attendance: any }> {
    return firstValueFrom(
      this.http.post<{ message: string; attendance: any }>(`${environment.apiUrl}/attendance/clock`, { employeeId })
    );
  }

  qrClock(
    qrCodeToken: string,
    photo: Blob,
    latitude?: number,
    longitude?: number
  ): Promise<{ message: string; employeeName: string; type: 'entrada' | 'salida'; attendance: any }> {
    const formData = new FormData();
    formData.append('qr_code_token', qrCodeToken);
    formData.append('photo', photo, 'credential.png');
    
    if (latitude !== undefined && latitude !== null) {
      formData.append('latitude', latitude.toString());
    }
    if (longitude !== undefined && longitude !== null) {
      formData.append('longitude', longitude.toString());
    }

    return firstValueFrom(
      this.http.post<{ message: string; employeeName: string; type: 'entrada' | 'salida'; attendance: any }>(
        `${environment.apiUrl}/attendance/qr-clock`,
        formData
      )
    );
  }

  updateAttendance(
    idOrEmployeeId: string,
    payload: {
      status: string;
      clockIn?: string | null;
      clockOut?: string | null;
      justificationType?: string | null;
      justificationNotes?: string | null;
      date?: string | null;
      employeeId?: string | null;
    }
  ): Promise<{ message: string; attendance: any }> {
    return firstValueFrom(
      this.http.put<{ message: string; attendance: any }>(
        `${environment.apiUrl}/attendance/${idOrEmployeeId}`,
        payload
      )
    );
  }
}
