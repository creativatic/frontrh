import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ServiceDto } from './service-type.service';
import { LocationDto } from './location.service';

export interface ScheduleDto {
  id?: string;
  service_id: string;
  location_id: string;
  name: string;
  start_time: string;
  end_time: string;
  startTime?: string;
  endTime?: string;
  grace_minutes: number;
  work_days: number[];
  service?: ServiceDto;
  location?: LocationDto;
  created_at?: string;
  updated_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ScheduleService {
  private readonly http = inject(HttpClient);

  getSchedules(search?: string, serviceId?: string, locationId?: string, page = 1, perPage = 100): Promise<any> {
    const params: any = { page, per_page: perPage };
    if (search) params.search = search;
    if (serviceId) params.service_id = serviceId;
    if (locationId) params.location_id = locationId;
    return firstValueFrom(
      this.http.get<any>(`${environment.apiUrl}/schedules`, { params })
    );
  }

  getSchedule(id: string): Promise<ScheduleDto> {
    return firstValueFrom(
      this.http.get<ScheduleDto>(`${environment.apiUrl}/schedules/${id}`)
    );
  }

  createSchedule(schedule: ScheduleDto): Promise<any> {
    return firstValueFrom(
      this.http.post<any>(`${environment.apiUrl}/schedules`, schedule)
    );
  }

  updateSchedule(id: string, schedule: ScheduleDto): Promise<any> {
    return firstValueFrom(
      this.http.put<any>(`${environment.apiUrl}/schedules/${id}`, schedule)
    );
  }

  deleteSchedule(id: string): Promise<any> {
    return firstValueFrom(
      this.http.delete<any>(`${environment.apiUrl}/schedules/${id}`)
    );
  }
}
