import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface PayrollRecord {
  employeeId: string;
  dni: string;
  fullName: string;
  position: string;
  pensionSystem: string;
  basicSalary: number;
  familyAllowance: number;
  grossSalary: number;
  pensionDeduction: number;
  essaludContribution: number;
  netSalary: number;
}

export interface PayrollReportSummary {
  employeeCount: number;
  totalBasicSalary: number;
  totalFamilyAllowance: number;
  totalGrossSalary: number;
  totalPensionDeduction: number;
  totalEssaludEmployerCost: number;
  totalNetPayout: number;
}

export interface PayrollReportResponse {
  month: string;
  currency: string;
  summary: PayrollReportSummary;
  records: PayrollRecord[];
}

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private readonly http = inject(HttpClient);

  getPayrollReport(): Promise<PayrollReportResponse> {
    return firstValueFrom(
      this.http.get<PayrollReportResponse>(`${environment.apiUrl}/reports/payroll/export`)
    );
  }

  /**
   * Generates and downloads a CSV file from the payroll report data.
   */
  downloadPayrollCsv(data: PayrollReportResponse): void {
    const headers = [
      'DNI',
      'Colaborador',
      'Cargo',
      'Sist. Pension',
      'Sueldo Basico',
      'Asig. Familiar',
      'Sueldo Bruto',
      'Deduc. Pension',
      'Aporte EsSalud',
      'Sueldo Neto'
    ];

    const rows = data.records.map(r => [
      r.dni,
      r.fullName,
      r.position,
      r.pensionSystem,
      r.basicSalary.toFixed(2),
      r.familyAllowance.toFixed(2),
      r.grossSalary.toFixed(2),
      r.pensionDeduction.toFixed(2),
      r.essaludContribution.toFixed(2),
      r.netSalary.toFixed(2)
    ]);

    // Append summary at the bottom
    rows.push([]);
    rows.push(['RESUMEN DE PLANILLA']);
    rows.push(['Total Colaboradores', data.summary.employeeCount.toString()]);
    rows.push(['Total Sueldos Basicos', data.summary.totalBasicSalary.toFixed(2)]);
    rows.push(['Total Asignacion Familiar', data.summary.totalFamilyAllowance.toFixed(2)]);
    rows.push(['Total Remuneracion Bruta', data.summary.totalGrossSalary.toFixed(2)]);
    rows.push(['Total Deduccion Pension', data.summary.totalPensionDeduction.toFixed(2)]);
    rows.push(['Total Aporte EsSalud (9%)', data.summary.totalEssaludEmployerCost.toFixed(2)]);
    rows.push(['Total Neto a Pagar', data.summary.totalNetPayout.toFixed(2)]);

    const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Planilla_Haberes_${data.month}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
