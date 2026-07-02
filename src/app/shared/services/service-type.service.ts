import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ServiceDto {
  id?: string;
  name: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ServiceTypeService {
  private readonly http = inject(HttpClient);

  getServices(search?: string, page = 1, perPage = 100): Promise<any> {
    const params: any = { page, per_page: perPage };
    if (search) params.search = search;
    return firstValueFrom(
      this.http.get<any>(`${environment.apiUrl}/services`, { params })
    );
  }

  getService(id: string): Promise<ServiceDto> {
    return firstValueFrom(
      this.http.get<ServiceDto>(`${environment.apiUrl}/services/${id}`)
    );
  }

  createService(service: ServiceDto): Promise<any> {
    return firstValueFrom(
      this.http.post<any>(`${environment.apiUrl}/services`, service)
    );
  }

  updateService(id: string, service: ServiceDto): Promise<any> {
    return firstValueFrom(
      this.http.put<any>(`${environment.apiUrl}/services/${id}`, service)
    );
  }

  deleteService(id: string): Promise<any> {
    return firstValueFrom(
      this.http.delete<any>(`${environment.apiUrl}/services/${id}`)
    );
  }
}
