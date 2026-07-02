import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Contract } from '../models/hr.models';
import { AuthService } from '../../core/auth/services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class ContractService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);

  getContracts(employeeId?: string, nature?: string, status?: string, page = 1, perPage = 15): Promise<{ data: Contract[], links?: any, meta?: any }> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('per_page', perPage.toString());

    if (employeeId) params = params.set('employee_id', employeeId);
    if (nature) params = params.set('nature', nature);
    if (status) params = params.set('status', status);

    return firstValueFrom(
      this.http.get<{ data: Contract[], links?: any, meta?: any }>(`${environment.apiUrl}/contracts`, { params })
    );
  }

  getContract(id: string): Promise<{ data: Contract }> {
    return firstValueFrom(
      this.http.get<{ data: Contract }>(`${environment.apiUrl}/contracts/${id}`)
    );
  }

  createContract(contract: Partial<Contract>): Promise<{ contract: Contract, message: string }> {
    return firstValueFrom(
      this.http.post<{ contract: Contract, message: string }>(`${environment.apiUrl}/contracts`, contract)
    );
  }

  updateContract(id: string, contract: Partial<Contract>): Promise<{ contract: Contract, message: string }> {
    return firstValueFrom(
      this.http.put<{ contract: Contract, message: string }>(`${environment.apiUrl}/contracts/${id}`, contract)
    );
  }

  deleteContract(id: string): Promise<{ message: string }> {
    return firstValueFrom(
      this.http.delete<{ message: string }>(`${environment.apiUrl}/contracts/${id}`)
    );
  }

  downloadContractPdf(id: string): void {
    const token = this.authService.token();
    const url = `${environment.apiUrl}/contracts/${id}/pdf?token=${token}`;
    window.open(url, '_blank');
  }
}
