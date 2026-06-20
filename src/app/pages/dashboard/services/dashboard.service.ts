import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface DashboardKpis {
  activeEmployees: number;
  totalPayroll: number;
}

export interface DashboardAlert {
  id: string;
  employeeName: string;
  nature: string;
  modality: string;
  endDate: string;
  daysRemaining: number;
}

export interface DashboardAlertsResponse {
  alerts: DashboardAlert[];
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private readonly http = inject(HttpClient);

  getKpis(): Promise<DashboardKpis> {
    return firstValueFrom(
      this.http.get<DashboardKpis>(`${environment.apiUrl}/dashboard/kpis`)
    );
  }

  getAlerts(): Promise<DashboardAlertsResponse> {
    return firstValueFrom(
      this.http.get<DashboardAlertsResponse>(`${environment.apiUrl}/dashboard/alerts`)
    );
  }
}
