import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface LocationDto {
  id?: string;
  code: string;
  name: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  radius_meters: number;
  created_at?: string;
  updated_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class LocationService {
  private readonly http = inject(HttpClient);

  getLocations(search?: string, page = 1, perPage = 100): Promise<any> {
    const params: any = { page, per_page: perPage };
    if (search) params.search = search;
    return firstValueFrom(
      this.http.get<any>(`${environment.apiUrl}/locations`, { params })
    );
  }

  getLocation(id: string): Promise<LocationDto> {
    return firstValueFrom(
      this.http.get<LocationDto>(`${environment.apiUrl}/locations/${id}`)
    );
  }

  createLocation(location: LocationDto): Promise<any> {
    return firstValueFrom(
      this.http.post<any>(`${environment.apiUrl}/locations`, location)
    );
  }

  updateLocation(id: string, location: LocationDto): Promise<any> {
    return firstValueFrom(
      this.http.put<any>(`${environment.apiUrl}/locations/${id}`, location)
    );
  }

  deleteLocation(id: string): Promise<any> {
    return firstValueFrom(
      this.http.delete<any>(`${environment.apiUrl}/locations/${id}`)
    );
  }
}
