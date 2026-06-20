import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Employee } from '../models/hr.models';

export interface DistrictInfo {
  code: string;
  name: string;
}

export interface ProvinceInfo {
  code: string;
  name: string;
  districts: DistrictInfo[];
}

export interface DepartmentInfo {
  code: string;
  name: string;
  provinces: ProvinceInfo[];
}

export interface CatalogItem {
  id: string;
  name: string;
}

export interface BanksCatalogResponse {
  banks: CatalogItem[];
  pensionSystems: CatalogItem[];
}

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  private readonly http = inject(HttpClient);

  getEmployees(search?: string, position?: string, page = 1, perPage = 15): Promise<{ data: Employee[], links?: any, meta?: any }> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('per_page', perPage.toString());

    if (search) params = params.set('search', search);
    if (position) params = params.set('position', position);

    return firstValueFrom(
      this.http.get<{ data: Employee[], links?: any, meta?: any }>(`${environment.apiUrl}/employees`, { params })
    );
  }

  getEmployee(id: string): Promise<{ data: Employee }> {
    return firstValueFrom(
      this.http.get<{ data: Employee }>(`${environment.apiUrl}/employees/${id}`)
    );
  }

  createEmployee(employee: Partial<Employee>): Promise<{ employee: Employee, message: string }> {
    return firstValueFrom(
      this.http.post<{ employee: Employee, message: string }>(`${environment.apiUrl}/employees`, employee)
    );
  }

  updateEmployee(id: string, employee: Partial<Employee>): Promise<{ employee: Employee, message: string }> {
    return firstValueFrom(
      this.http.put<{ employee: Employee, message: string }>(`${environment.apiUrl}/employees/${id}`, employee)
    );
  }

  deleteEmployee(id: string): Promise<{ message: string }> {
    return firstValueFrom(
      this.http.delete<{ message: string }>(`${environment.apiUrl}/employees/${id}`)
    );
  }

  getUbigeoCatalog(): Promise<DepartmentInfo[]> {
    return firstValueFrom(
      this.http.get<DepartmentInfo[]>(`${environment.apiUrl}/catalogs/ubigeo`)
    );
  }

  getBanksCatalog(): Promise<BanksCatalogResponse> {
    return firstValueFrom(
      this.http.get<BanksCatalogResponse>(`${environment.apiUrl}/catalogs/banks`)
    );
  }
}
