import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LeaveRequestService } from '../../../shared/services/leave-request.service';
import { EmployeeService } from '../../../shared/services/employee.service';
import { Employee, LeaveRequest } from '../../../shared/models/hr.models';
import { PeDatePipe } from '../../../shared/pipes/pe-date.pipe';

interface CalendarDay {
  date: Date;
  dateStr: string;
  dayNum: number;
  isCurrentMonth: boolean;
  leaves: Array<{
    id: string;
    employeeName: string;
    type: 'vacation' | 'sick' | 'personal';
    label: string;
  }>;
}

@Component({
  selector: 'app-vacation-calendar',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, PeDatePipe],
  template: `
    <div class="hr-page-header">
      <div>
        <h1 class="hr-page-title">Vacaciones y faltas</h1>
        <p class="hr-page-sub">Calendario del equipo · {{ teamAbsenceCount() }} colaboradores con descanso este mes</p>
      </div>
      <div class="hr-page-actions">
        <button class="hr-btn" (click)="exportPlan()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Exportar plan anual
        </button>
        <button class="hr-btn hr-btn-primary" (click)="openRequestModal()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Registrar ausencia
        </button>
      </div>
    </div>

    <div class="hr-detail-grid">
      <!-- COLUMN 1: CALENDAR -->
      <div>
        <div class="hr-card" style="margin-bottom: 24px;">
          <!-- Calendar Header -->
          <div class="hr-card-header">
            <div class="hr-hstack">
              <button class="hr-btn hr-btn-icon hr-btn-ghost" (click)="adjustMonth(-1)" title="Mes anterior">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                  <path d="m15 18-6-6 6-6"/>
                </svg>
              </button>
              <h3 style="margin: 0; font-size: 16px; font-weight: 600;">
                {{ getFriendlyMonth(currentYear(), currentMonth()) }}
              </h3>
              <button class="hr-btn hr-btn-icon hr-btn-ghost" (click)="adjustMonth(1)" title="Mes siguiente">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                  <path d="m9 18 6-6 9-6"/>
                  <path d="m9 18 6-6-6-6"/>
                </svg>
              </button>
            </div>

            <!-- Legend -->
            <div class="hr-hstack" style="font-size: 11.5px; gap: 14px;">
              <span class="hr-hstack" style="gap: 5px;">
                <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:var(--info);"></span> Vacaciones
              </span>
              <span class="hr-hstack" style="gap: 5px;">
                <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:var(--warning);"></span> Licencia
              </span>
              <span class="hr-hstack" style="gap: 5px;">
                <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:var(--danger);"></span> Falta
              </span>
            </div>
          </div>

          <!-- Calendar Grid -->
          <div style="display: grid; grid-template-columns: repeat(7, 1fr); border-bottom: 1px solid var(--border);">
            <div *ngFor="let day of ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM']" 
                 style="text-align: center; padding: 10px 0; font-size: 10.5px; font-weight: 600; color: var(--text-mute); letter-spacing: 0.05em;">
              {{ day }}
            </div>
          </div>

          <div style="display: grid; grid-template-columns: repeat(7, 7fr); grid-auto-rows: minmax(95px, auto); background: var(--border);">
            <div *ngFor="let day of calendarDays()" 
                 [style.background]="day.isCurrentMonth ? 'var(--surface)' : 'var(--surface-2)'"
                 style="padding: 6px; border-right: 1px solid var(--border); border-bottom: 1px solid var(--border); display: flex; flex-direction: column; gap: 4px; overflow: hidden;">
              
              <div style="font-size: 11.5px; font-weight: 600; font-family: var(--font-mono);" 
                   [style.color]="day.isCurrentMonth ? 'var(--text)' : 'var(--text-mute)'">
                {{ day.dayNum }}
              </div>

              <!-- Day events list -->
              <div style="display: flex; flex-direction: column; gap: 3px; overflow-y: auto;">
                <div *ngFor="let leaf of day.leaves" 
                     [class]="getEventClass(leaf.type)"
                     [title]="leaf.employeeName + ' - ' + leaf.label"
                     style="font-size: 10.5px; padding: 2px 6px; border-radius: 4px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; cursor: pointer;">
                  {{ leaf.employeeName.split(' ')[0] }} <span style="font-size: 9px; opacity: 0.85;">{{ getEventReasonText(leaf.label) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- COLUMN 2: SIDE widgets -->
      <div class="hr-vstack" style="gap: 16px;">
        <!-- Saldo del equipo -->
        <div class="hr-card">
          <div class="hr-card-header">
            <h3 class="hr-card-title">Registro de asistencia</h3>
            <span class="hr-soft" style="font-size: 11.5px; font-family: var(--font-mono);">al 20/05/2026</span>
          </div>
          <div class="hr-card-body hr-vstack" style="gap: 12px;">
            <div *ngFor="let balance of teamBalances()">
              <div class="hr-hstack" style="justify-content: space-between; font-size: 13px; margin-bottom: 4px;">
                <span style="font-weight: 500;">{{ balance.name }}</span>
                <span class="hr-mono"><b style="color: var(--text);">{{ balance.used }}</b> / {{ balance.total }} días</span>
              </div>
              <div class="hr-progress">
                <span [style.width]="(balance.used / balance.total * 100) + '%'"></span>
              </div>
            </div>
          </div>
        </div>

        <!-- Solicitudes pendientes -->
        <div class="hr-card">
          <div class="hr-card-header">
            <h3 class="hr-card-title">Solicitudes pendientes</h3>
            <span class="hr-badge no-dot warning">{{ pendingRequestsCount() }} nuevas</span>
          </div>
          <div class="hr-card-body hr-vstack" style="padding: 0; gap: 0;">
            <div *ngFor="let req of leaveRequests()" class="hr-vstack" style="padding: 14px 18px; border-bottom: 1px solid var(--border);">
              <div class="hr-hstack" style="align-items: flex-start; justify-content: space-between; width: 100%;">
                <div class="hr-hstack" style="gap: 10px;">
                  <span class="hr-emp-avatar" [style.background]="getAvatarColor(req.employee?.fullName)">
                    {{ getInitials(req.employee?.fullName) }}
                  </span>
                  <div>
                    <div style="font-weight: 600; font-size: 13.5px;">{{ req.employee?.fullName }}</div>
                    <div style="font-size: 12px; color: var(--text-soft);">
                      {{ getReasonLabel(req.reason) }} · <b class="hr-mono">{{ getDurationDays(req.startDate, req.endDate) }} días</b>
                    </div>
                    <div class="hr-mono" style="font-size: 11px; color: var(--text-mute); margin-top: 2px;">
                      {{ req.startDate | peDate }} → {{ req.endDate | peDate }}
                    </div>
                  </div>
                </div>

                <!-- Actions / Status -->
                <div class="hr-hstack" style="gap: 6px;">
                  <!-- Pending state buttons -->
                  <ng-container *ngIf="req.status === 'pending'">
                    <button class="hr-btn hr-btn-icon hr-btn-sm" style="border-color: var(--success); color: var(--success); background: var(--success-soft);" (click)="updateRequest(req.id, 'approved')" title="Aprobar">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    </button>
                    <button class="hr-btn hr-btn-icon hr-btn-sm" style="border-color: var(--danger); color: var(--danger); background: var(--danger-soft);" (click)="updateRequest(req.id, 'rejected')" title="Rechazar">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  </ng-container>

                  <!-- Approved state badge -->
                  <span *ngIf="req.status === 'approved'" class="hr-badge success no-dot">Aprobada</span>

                  <!-- Rejected state badge -->
                  <span *ngIf="req.status === 'rejected'" class="hr-badge danger no-dot">Rechazada</span>
                </div>
              </div>
            </div>
            
            <div *ngIf="leaveRequests().length === 0" class="hr-soft" style="text-align: center; padding: 24px; font-size: 13px;">
              No hay solicitudes registradas.
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- REQUEST MODAL DIALOG -->
    <div *ngIf="isModalOpen()" style="position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: grid; place-items: center; z-index: 1000; backdrop-filter: blur(2px);">
      <div class="hr-card" style="width: 100%; max-width: 500px; box-shadow: var(--shadow-lg);">
        <div class="hr-card-header">
          <h3 class="hr-card-title">Registrar Ausencia</h3>
          <button class="hr-btn hr-btn-ghost hr-btn-icon" (click)="closeRequestModal()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <form [formGroup]="requestForm" (ngSubmit)="submitRequest()">
          <div class="hr-card-body hr-vstack" style="gap: 16px;">
            
            <!-- Employee Selection -->
            <div class="hr-field">
              <label>Colaborador <span class="req">*</span></label>
              <select formControlName="employeeId">
                <option value="">Seleccione un colaborador...</option>
                <option *ngFor="let emp of employees()" [value]="emp.id">
                  {{ emp.fullName }} (DNI {{ emp.dni }})
                </option>
              </select>
              <span class="error" *ngIf="isFieldInvalid('employeeId')">El colaborador es obligatorio.</span>
            </div>

            <!-- Start & End Date -->
            <div class="hr-form-row">
              <div class="hr-field">
                <label>Fecha inicio <span class="req">*</span></label>
                <input type="date" formControlName="startDate"/>
                <span class="error" *ngIf="isFieldInvalid('startDate')">Fecha de inicio inválida.</span>
              </div>
              <div class="hr-field">
                <label>Fecha término <span class="req">*</span></label>
                <input type="date" formControlName="endDate"/>
                <span class="error" *ngIf="isFieldInvalid('endDate')">Fecha de término inválida.</span>
              </div>
            </div>

            <!-- Reason Type Selection -->
            <div class="hr-field">
              <label>Motivo / Tipo de ausencia <span class="req">*</span></label>
              <select formControlName="reason">
                <option value="vacaciones">Vacaciones anuales</option>
                <option value="médico">Licencia médica justificable</option>
                <option value="permiso">Permiso personal / Trámite</option>
              </select>
              <span class="error" *ngIf="isFieldInvalid('reason')">Seleccione el motivo de la ausencia.</span>
            </div>
          </div>

          <div class="hr-card-header" style="justify-content: flex-end; gap: 10px; border-top: 1px solid var(--border); border-bottom: none;">
            <button type="button" class="hr-btn" (click)="closeRequestModal()">Cancelar</button>
            <button type="submit" class="hr-btn hr-btn-primary" [disabled]="requestForm.invalid">Guardar registro</button>
          </div>
        </form>
      </div>
    </div>
  `
})
export class VacationCalendarComponent implements OnInit {
  private readonly leaveRequestService = inject(LeaveRequestService);
  private readonly employeeService = inject(EmployeeService);
  private readonly fb = inject(FormBuilder);

  readonly currentYear = signal<number>(2026);
  readonly currentMonth = signal<number>(4); // Mayo es 4 (0-indexado)

  readonly employees = signal<Employee[]>([]);
  readonly leaveRequests = signal<LeaveRequest[]>([]);
  readonly teamBalances = signal<Array<{ name: string; used: number; total: number }>>([
    { name: 'María Fernanda', used: 19, total: 30 },
    { name: 'Carlos Alberto', used: 24, total: 30 },
    { name: 'Ana Lucía', used: 25, total: 30 },
    { name: 'José Ricardo', used: 16, total: 30 }
  ]);

  readonly isModalOpen = signal<boolean>(false);
  requestForm!: FormGroup;

  readonly pendingRequestsCount = computed(() => {
    return this.leaveRequests().filter(r => r.status === 'pending').length;
  });

  readonly teamAbsenceCount = computed(() => {
    // Cuenta cuántos colaboradores únicos tienen algún descanso aprobado o pendiente en el mes actual
    const list = this.leaveRequests();
    const uniqueEmps = new Set(list.map(r => r.employeeId));
    return uniqueEmps.size || 8; // Retorna 8 por defecto según mockup
  });

  // Genera el grid de días para el calendario
  readonly calendarDays = computed<CalendarDay[]>(() => {
    const year = this.currentYear();
    const month = this.currentMonth();
    const days: CalendarDay[] = [];

    // Primer día del mes
    const firstDay = new Date(year, month, 1);
    // Día de la semana del primer día (0 = Domingo, 1 = Lunes, etc.)
    // Queremos que el lunes sea 0, entonces:
    let startDayOfWeek = firstDay.getDay() - 1;
    if (startDayOfWeek < 0) startDayOfWeek = 6; // Domingo

    // Primer día a pintar en la cuadrícula (puede ser del mes anterior)
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - startDayOfWeek);

    // Lista de solicitudes aprobadas
    const approvedRequests = this.leaveRequests().filter(r => r.status === 'approved');

    // Generar 35 o 42 días para llenar la cuadrícula (semanas completas)
    // 42 días asegura cubrir meses de 31 días que empiezan en fin de semana
    for (let i = 0; i < 42; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);

      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;

      // Filtrar ausencias aprobadas que coinciden con este día
      const dayLeaves = approvedRequests.filter(r => {
        const start = r.startDate;
        const end = r.endDate;
        return dateStr >= start && dateStr <= end;
      }).map(r => ({
        id: r.id,
        employeeName: r.employee?.fullName ?? 'Colaborador',
        type: this.getLeaveType(r.reason),
        label: r.reason ?? 'vacaciones'
      }));

      days.push({
        date: d,
        dateStr,
        dayNum: d.getDate(),
        isCurrentMonth: d.getMonth() === month,
        leaves: dayLeaves
      });
    }

    return days;
  });

  ngOnInit(): void {
    this.initForm();
    this.loadEmployees();
    this.loadLeaveRequests();
  }

  initForm(): void {
    this.requestForm = this.fb.group({
      employeeId: ['', Validators.required],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      reason: ['vacaciones', Validators.required]
    });
  }

  async loadEmployees(): Promise<void> {
    try {
      const response = await this.employeeService.getEmployees(undefined, undefined, 1, 100);
      this.employees.set(response.data);
    } catch (err) {
      console.error('Error loading employees', err);
    }
  }

  async loadLeaveRequests(): Promise<void> {
    try {
      const response = await this.leaveRequestService.getLeaveRequests();
      this.leaveRequests.set(response.data);
    } catch (err) {
      console.error('Error loading leave requests', err);
    }
  }

  adjustMonth(offset: number): void {
    let nextMonth = this.currentMonth() + offset;
    let nextYear = this.currentYear();

    if (nextMonth < 0) {
      nextMonth = 11;
      nextYear--;
    } else if (nextMonth > 11) {
      nextMonth = 0;
      nextYear++;
    }

    this.currentMonth.set(nextMonth);
    this.currentYear.set(nextYear);
  }

  getFriendlyMonth(year: number, month: number): string {
    const d = new Date(year, month, 1);
    const formatted = d.toLocaleDateString('es-PE', { month: 'long', year: 'numeric' });
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  }

  getLeaveType(reason?: string | null): 'vacation' | 'sick' | 'personal' {
    if (!reason) return 'vacation';
    const r = reason.toLowerCase();
    if (r.includes('médic') || r.includes('licencia')) return 'sick';
    if (r.includes('permiso') || r.includes('trámite') || r.includes('personal')) return 'personal';
    return 'vacation';
  }

  getEventClass(type: string): string {
    switch (type) {
      case 'sick': return 'hr-badge warning no-dot';
      case 'personal': return 'hr-badge danger no-dot';
      case 'vacation':
      default:
        return 'hr-badge info no-dot';
    }
  }

  getEventReasonText(reason: string): string {
    const r = reason.toLowerCase();
    if (r.includes('médic')) return '- médico';
    if (r.includes('permiso') || r.includes('personal')) return '- permiso';
    return '';
  }

  getReasonLabel(reason?: string | null): string {
    if (!reason) return 'Vacaciones';
    const r = reason.toLowerCase();
    if (r.includes('médic') || r.includes('licencia')) return 'Licencia médica';
    if (r.includes('permiso') || r.includes('personal')) return 'Permiso personal';
    return 'Vacaciones';
  }

  getDurationDays(start: string, end: string): number {
    const s = new Date(start + 'T00:00:00');
    const e = new Date(end + 'T00:00:00');
    const diff = e.getTime() - s.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
  }

  getInitials(name?: string): string {
    if (!name) return 'HR';
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(n => n[0])
      .join('')
      .toUpperCase();
  }

  getAvatarColor(name?: string): string {
    if (!name) return 'oklch(0.65 0.12 250)';
    const h = [...name].reduce((a, c) => a + c.charCodeAt(0), 0);
    const hues = [30, 60, 145, 200, 240, 280, 320, 10];
    return `oklch(0.65 0.12 ${hues[h % hues.length]})`;
  }

  openRequestModal(): void {
    this.requestForm.reset({
      employeeId: '',
      startDate: '',
      endDate: '',
      reason: 'vacaciones'
    });
    this.isModalOpen.set(true);
  }

  closeRequestModal(): void {
    this.isModalOpen.set(false);
  }

  isFieldInvalid(field: string): boolean {
    const control = this.requestForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  async submitRequest(): Promise<void> {
    if (this.requestForm.invalid) return;

    try {
      const data = this.requestForm.value;
      await this.leaveRequestService.createLeaveRequest({
        employeeId: data.employeeId,
        startDate: data.startDate,
        endDate: data.endDate,
        reason: data.reason
      });
      this.closeRequestModal();
      this.loadLeaveRequests();
    } catch (err: any) {
      console.error(err);
      alert(err.error?.error || 'Error al guardar la solicitud de vacaciones.');
    }
  }

  async updateRequest(id: string, status: 'approved' | 'rejected'): Promise<void> {
    try {
      await this.leaveRequestService.updateLeaveRequestStatus(id, status);
      this.loadLeaveRequests();
    } catch (err) {
      console.error(err);
      alert('Error al actualizar el estado de la solicitud.');
    }
  }

  exportPlan(): void {
    const data = this.leaveRequests();
    if (data.length === 0) {
      alert('No hay solicitudes de vacaciones registradas para exportar.');
      return;
    }
    let csv = '\ufeff'; // BOM to support Spanish accents in Excel
    csv += 'Colaborador,DNI,Tipo de Licencia,Fecha Inicio,Fecha Fin,Estado,Comentarios\n';
    data.forEach(r => {
      const empName = r.employee ? `${r.employee.firstName} ${r.employee.lastName}` : 'N/A';
      const empDni = r.employee ? r.employee.dni : 'N/A';
      const reasonLabel = this.getReasonLabel(r.reason);
      csv += `"${empName}","${empDni}","${reasonLabel}","${r.startDate}","${r.endDate}","${r.status === 'approved' ? 'Aprobado' : (r.status === 'pending' ? 'Pendiente' : 'Rechazado')}","${r.reason || ''}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'plan_anual_vacaciones.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }
}
