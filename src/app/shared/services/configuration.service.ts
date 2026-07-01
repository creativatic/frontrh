import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface CompanyConfig {
  id?: string;
  name: string;
  ruc: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  rolesPermissions?: any;
}

@Injectable({
  providedIn: 'root'
})
export class ConfigurationService {
  private readonly http = inject(HttpClient);

  getCompany(): Promise<{ company: CompanyConfig }> {
    return firstValueFrom(
      this.http.get<{ company: CompanyConfig }>(`${environment.apiUrl}/company`)
    );
  }

  updateCompany(company: Partial<CompanyConfig>): Promise<{ message: string; company: CompanyConfig }> {
    return firstValueFrom(
      this.http.put<{ message: string; company: CompanyConfig }>(`${environment.apiUrl}/company`, company)
    );
  }

  updateRolesPermissions(rolesPermissions: any): Promise<{ message: string; company: CompanyConfig }> {
    return firstValueFrom(
      this.http.put<{ message: string; company: CompanyConfig }>(
        `${environment.apiUrl}/company/roles-permissions`,
        { rolesPermissions: rolesPermissions }
      )
    );
  }
}
