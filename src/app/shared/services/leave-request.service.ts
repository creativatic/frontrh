import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LeaveRequest } from '../models/hr.models';

export interface PaginatedLeaveRequests {
  data: LeaveRequest[];
  total?: number;
  perPage?: number;
  currentPage?: number;
  lastPage?: number;
}

@Injectable({
  providedIn: 'root'
})
export class LeaveRequestService {
  private readonly http = inject(HttpClient);

  getLeaveRequests(employeeId?: string, status?: string, page = 1, perPage = 100): Promise<PaginatedLeaveRequests> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('per_page', perPage.toString());

    if (employeeId) params = params.set('employeeId', employeeId);
    if (status) params = params.set('status', status);

    return firstValueFrom(
      this.http.get<PaginatedLeaveRequests>(`${environment.apiUrl}/leave-requests`, { params })
    );
  }

  createLeaveRequest(requestData: { employeeId: string; startDate: string; endDate: string; reason?: string }): Promise<{ message: string; leave: LeaveRequest }> {
    return firstValueFrom(
      this.http.post<{ message: string; leave: LeaveRequest }>(`${environment.apiUrl}/leave-requests`, requestData)
    );
  }

  updateLeaveRequestStatus(id: string, status: 'approved' | 'rejected' | 'pending'): Promise<{ message: string; leave: LeaveRequest }> {
    return firstValueFrom(
      this.http.put<{ message: string; leave: LeaveRequest }>(`${environment.apiUrl}/leave-requests/${id}`, { status })
    );
  }

  deleteLeaveRequest(id: string): Promise<{ message: string }> {
    return firstValueFrom(
      this.http.delete<{ message: string }>(`${environment.apiUrl}/leave-requests/${id}`)
    );
  }
}
