import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AttendanceService } from '../../../shared/services/attendance.service';
import { AttendanceRecord, AttendanceSummary } from '../../../shared/models/hr.models';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-attendance-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="hr-page-header">
      <div>
        <h1 class="hr-page-title">Asistencia</h1>
        <p class="hr-page-sub">Marcaciones biométricas + check-in por celular</p>
      </div>
      <div class="hr-page-actions">
        <a class="hr-btn" routerLink="/asistencia/scanner" style="display: inline-flex; align-items: center; gap: 6px; text-decoration: none;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect width="10" height="10" x="3" y="3" rx="2"/>
            <rect width="6" height="6" x="5" y="5" rx="1"/>
            <rect width="10" height="10" x="11" y="11" rx="2"/>
            <rect width="6" height="6" x="13" y="13" rx="1"/>
            <rect width="6" height="6" x="15" y="3" rx="1"/>
            <rect width="6" height="6" x="3" y="15" rx="1"/>
          </svg>
          Escanear QR
        </a>
        <button class="hr-btn" (click)="exportCsv()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Exportar CSV
        </button>
        <button class="hr-btn hr-btn-primary" (click)="syncTerminal()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
          </svg>
          Sincronizar terminal
        </button>
      </div>
    </div>

    <!-- KPIs Grid -->
    <div class="hr-kpi-grid">
      <div class="hr-kpi">
        <span class="hr-kpi-label">Marcaciones hoy</span>
        <span class="hr-kpi-value">{{ summary().clockedInCount }}/{{ summary().totalActiveEmployees }}</span>
        <span class="hr-kpi-meta">
          {{ getAttendanceRate() }}% de asistencia
        </span>
      </div>
      <div class="hr-kpi">
        <span class="hr-kpi-label">Tardanzas</span>
        <span class="hr-kpi-value">{{ summary().tardanzasCount }}</span>
        <span class="hr-kpi-meta">Acumulado en mayo: 23</span>
      </div>
      <div class="hr-kpi">
        <span class="hr-kpi-label">Ausencias justificadas</span>
        <span class="hr-kpi-value">{{ summary().justifiedAbsencesCount }}</span>
        <span class="hr-kpi-meta">2 médicas · 1 trámite</span>
      </div>
      <div class="hr-kpi">
        <span class="hr-kpi-label">Horas extras (semana)</span>
        <span class="hr-kpi-value">{{ summary().weeklyOvertimeHours }}h</span>
        <span class="hr-kpi-meta">8 colaboradores</span>
      </div>
    </div>

    <!-- Date selector & View segment control -->
    <div class="hr-card" style="margin-bottom: 16px; padding: 12px 18px;">
      <div class="hr-hstack" style="justify-content: space-between; flex-wrap: wrap; gap: 12px;">
        <div class="hr-hstack">
          <button class="hr-btn hr-btn-icon hr-btn-ghost" (click)="adjustDate(-1)" title="Día anterior">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
              <path d="m15 18-6-6 6-6"/>
            </svg>
          </button>
          
          <input type="date" class="hr-chip" [ngModel]="selectedDate()" (ngModelChange)="onDateChange($event)" style="border: 1px solid var(--border-strong); font-weight: 500; font-family: var(--font-mono);"/>
          
          <button class="hr-btn hr-btn-icon hr-btn-ghost" (click)="adjustDate(1)" title="Día siguiente">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
              <path d="m9 18 6-6-6-6"/>
            </svg>
          </button>

          <span class="hr-soft" style="font-weight: 500; font-size: 14.5px; margin-left: 8px;">
            {{ getFriendlyDate(selectedDate()) }}
          </span>
        </div>

        <div class="hr-seg">
          <button [class.active]="viewPeriod() === 'day'" (click)="setViewPeriod('day')">Día</button>
          <button [class.active]="viewPeriod() === 'week'" (click)="setViewPeriod('week')">Semana</button>
          <button [class.active]="viewPeriod() === 'month'" (click)="setViewPeriod('month')">Mes</button>
        </div>
      </div>
    </div>

    <!-- Search & Filters Bar -->
    <div class="hr-filters">
      <div class="hr-search-input">
        <span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="7"/>
            <path d="m20 20-3.5-3.5"/>
          </svg>
        </span>
        <input placeholder="Buscar colaborador, DNI..." (input)="onSearch($event)"/>
      </div>

      <!-- Area filter -->
      <select class="hr-chip" (change)="onAreaFilter($event)">
        <option value="Todos">Todas las áreas</option>
        <option *ngFor="let area of areas()" [value]="area">{{ area }}</option>
      </select>

      <!-- Status filter -->
      <select class="hr-chip" (change)="onStatusFilter($event)">
        <option value="Todos">Todos los estados</option>
        <option value="a tiempo">A tiempo</option>
        <option value="tarde">Tarde</option>
        <option value="ausente">Ausente</option>
        <option value="justificada">Justificada</option>
      </select>
    </div>

    <!-- Main list of attendance -->
    <div class="hr-card hr-card-flush">
      <table class="hr-tbl">
        <thead>
          <tr>
            <th>Colaborador</th>
            <th>Área</th>
            <th>Ingreso</th>
            <th>Salida</th>
            <th>Horas</th>
            <th>Estado</th>
            <th>Origen</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let rec of filteredRecords()" 
              [routerLink]="[rec.employeeId]" [queryParams]="{ date: selectedDate() }"
              style="cursor: pointer;">
            <td>
              <div class="hr-row-emp">
                <span class="hr-emp-avatar" [style.background]="getAvatarColor(rec.employee.fullName)">
                  {{ getInitials(rec.employee.fullName) }}
                </span>
                <div>
                  <div class="hr-emp-name">{{ rec.employee.fullName }}</div>
                  <div class="hr-emp-id">DNI {{ rec.employee.dni }}</div>
                </div>
              </div>
            </td>
            <td>
              <span class="hr-badge no-dot neutral">{{ rec.employee.department }}</span>
            </td>
            <td class="hr-mono" style="font-size: 13px;">{{ rec.clockIn || '—' }}</td>
            <td class="hr-mono" style="font-size: 13px;">{{ rec.clockOut || '—' }}</td>
            <td class="hr-mono" style="font-size: 13px;">{{ rec.hours !== null ? rec.hours + ' h' : '—' }}</td>
            <td>
              <span class="hr-badge" [class.success]="rec.status === 'a tiempo'" [class.warning]="rec.status === 'tarde'" [class.danger]="rec.status === 'ausente'" [class.info]="rec.status === 'justificada'">
                {{ getStatusLabel(rec.status) }}
              </span>
            </td>
            <td style="font-size: 13px; color: var(--text-soft);">{{ rec.origin || '—' }}</td>
            <td class="action-cell" (click)="$event.stopPropagation()">
              <button class="hr-btn hr-btn-ghost hr-btn-icon" [routerLink]="[rec.employeeId]" [queryParams]="{ date: selectedDate() }">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="1"/>
                  <circle cx="12" cy="5" r="1"/>
                  <circle cx="12" cy="19" r="1"/>
                </svg>
              </button>
            </td>
          </tr>
          <tr *ngIf="filteredRecords().length === 0">
            <td colspan="8" class="hr-soft" style="text-align: center; height: 120px;">
              No se encontraron marcaciones para el día y filtros indicados.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
  styles: [`
    .hr-split-layout {
      display: grid;
      grid-template-columns: 1.15fr 0.85fr;
      gap: 20px;
      align-items: start;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    @media (max-width: 992px) {
      .hr-split-layout {
        grid-template-columns: 1fr;
      }
    }

    .hr-left-pane {
      width: 100%;
    }

    .hr-right-pane {
      background: rgba(30, 41, 59, 0.4);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 16px;
      padding: 20px;
      color: #e2e8f0;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
      position: sticky;
      top: 20px;
      animation: slideInRight 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    @keyframes slideInRight {
      from { transform: translateX(30px); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }

    /* Selected Row feedback */
    .hr-tbl tbody tr.selected-row {
      background: rgba(56, 189, 248, 0.08) !important;
      border-left: 3px solid #38bdf8 !important;
    }

    .hr-pane-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      padding-bottom: 12px;
      margin-bottom: 16px;
    }

    .hr-pane-title {
      font-size: 16px;
      font-weight: 700;
      color: #f8fafc;
      margin: 0;
    }

    .hr-pane-close-btn {
      background: transparent;
      border: none;
      color: #94a3b8;
      cursor: pointer;
      font-size: 22px;
      line-height: 1;
      padding: 0 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: color 0.2s;
    }
    .hr-pane-close-btn:hover { color: #f8fafc; }

    .hr-modal-section-title {
      font-size: 13px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #38bdf8;
      margin: 0 0 12px 0;
      border-left: 3px solid #38bdf8;
      padding-left: 8px;
    }

    .hr-modal-grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    .hr-photo-evidence-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    .hr-photo-evidence-box {
      background: #0f172a;
      border: 1px dashed rgba(255, 255, 255, 0.15);
      border-radius: 10px;
      padding: 8px;
      text-align: center;
    }

    .hr-photo-evidence-lbl {
      display: block;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      color: #94a3b8;
      margin-bottom: 6px;
    }

    .hr-evidence-img {
      width: 100%;
      height: 140px;
      object-fit: cover;
      border-radius: 6px;
      border: 1px solid rgba(255, 255, 255, 0.05);
      transition: transform 0.2s;
    }
    .hr-evidence-img:hover {
      transform: scale(1.02);
    }

    .hr-evidence-placeholder {
      height: 140px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: #475569;
      font-size: 11px;
      gap: 6px;
      background: rgba(15, 23, 42, 0.4);
      border-radius: 6px;
    }

    .hr-modal-form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .hr-modal-form-group label {
      font-size: 12.5px;
      font-weight: 600;
      color: #cbd5e1;
    }

    .hr-modal-input, .hr-modal-select, .hr-modal-textarea {
      background: #0f172a;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      color: #e2e8f0;
      padding: 8px 12px;
      font-size: 13.5px;
      outline: none;
      width: 100%;
      transition: border-color 0.2s;
    }
    .hr-modal-input:focus, .hr-modal-select:focus, .hr-modal-textarea:focus {
      border-color: #38bdf8;
    }

    .hr-modal-textarea {
      resize: vertical;
      min-height: 70px;
    }

    .hr-modal-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 8px 16px;
      font-size: 13.5px;
      font-weight: 600;
      border-radius: 6px;
      border: none;
      cursor: pointer;
      transition: all 0.2s;
    }

    .hr-modal-btn-ghost {
      background: transparent;
      border: 1px solid rgba(255, 255, 255, 0.12);
      color: #cbd5e1;
    }
    .hr-modal-btn-ghost:hover {
      background: rgba(255, 255, 255, 0.05);
    }

    .hr-modal-btn-primary {
      background: linear-gradient(135deg, #38bdf8 0%, #0284c7 100%);
      color: #fff;
      box-shadow: 0 4px 12px rgba(56, 189, 248, 0.25);
    }
    .hr-modal-btn-primary:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 6px 15px rgba(56, 189, 248, 0.35);
    }
    .hr-modal-btn-primary:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none !important;
      box-shadow: none !important;
    }

    .hr-modal-emp-card {
      display: flex;
      align-items: center;
      gap: 12px;
      background: rgba(15, 23, 42, 0.4);
      padding: 10px 14px;
      border-radius: 8px;
      border: 1px solid rgba(255, 255, 255, 0.04);
    }

    .hr-modal-emp-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      font-weight: 700;
      color: #fff;
    }

    .hr-modal-emp-name {
      font-size: 15px;
      font-weight: 700;
      color: #f1f5f9;
    }

    .hr-modal-emp-meta {
      font-size: 12px;
      color: #94a3b8;
      display: flex;
      gap: 6px;
      align-items: center;
      margin-top: 2px;
    }
  `]
})

export class AttendanceListComponent implements OnInit {
  private readonly attendanceService = inject(AttendanceService);

  readonly selectedDate = signal<string>('2026-05-20'); // Por defecto Mayo 20, 2026 como los mocks de capturas
  readonly viewPeriod = signal<'day' | 'week' | 'month'>('day');
  readonly searchQuery = signal<string>('');
  readonly selectedArea = signal<string>('Todos');
  readonly selectedStatus = signal<string>('Todos');

  readonly records = signal<AttendanceRecord[]>([]);
  readonly summary = signal<AttendanceSummary>({
    totalActiveEmployees: 74,
    clockedInCount: 71,
    tardanzasCount: 5,
    justifiedAbsencesCount: 3,
    weeklyOvertimeHours: 38
  });


  readonly areas = computed(() => {
    const list = this.records();
    return Array.from(new Set(list.map(r => r.employee.department).filter(Boolean)));
  });

  readonly filteredRecords = computed(() => {
    let list = this.records();
    const q = this.searchQuery().toLowerCase();
    const area = this.selectedArea();
    const status = this.selectedStatus();

    if (q) {
      list = list.filter(r => 
        r.employee.fullName.toLowerCase().includes(q) ||
        r.employee.dni.includes(q)
      );
    }

    if (area !== 'Todos') {
      list = list.filter(r => r.employee.department === area);
    }

    if (status !== 'Todos') {
      list = list.filter(r => r.status === status);
    }

    return list;
  });

  ngOnInit(): void {
    this.loadData();
  }

  async loadData(): Promise<void> {
    try {
      const response = await this.attendanceService.getAttendance(this.selectedDate());
      this.records.set(response.records);
      this.summary.set(response.summary);
    } catch (err) {
      console.error('Error loading attendance logs', err);
    }
  }

  onDateChange(newDate: string): void {
    if (newDate) {
      this.selectedDate.set(newDate);
      this.loadData();
    }
  }

  adjustDate(days: number): void {
    const current = new Date(this.selectedDate() + 'T00:00:00');
    current.setDate(current.getDate() + days);
    
    const yyyy = current.getFullYear();
    const mm = String(current.getMonth() + 1).padStart(2, '0');
    const dd = String(current.getDate()).padStart(2, '0');
    
    this.selectedDate.set(`${yyyy}-${mm}-${dd}`);
    this.loadData();
  }

  setViewPeriod(period: 'day' | 'week' | 'month'): void {
    this.viewPeriod.set(period);
  }

  onSearch(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.searchQuery.set(val.trim());
  }

  onAreaFilter(event: Event): void {
    const val = (event.target as HTMLSelectElement).value;
    this.selectedArea.set(val);
  }

  onStatusFilter(event: Event): void {
    const val = (event.target as HTMLSelectElement).value;
    this.selectedStatus.set(val);
  }

  getAttendanceRate(): string {
    const summary = this.summary();
    if (summary.totalActiveEmployees === 0) return '0.0';
    return ((summary.clockedInCount / summary.totalActiveEmployees) * 100).toFixed(1);
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'a tiempo': return 'A tiempo';
      case 'tarde': return 'Tarde';
      case 'ausente': return 'Ausente';
      case 'justificada': return 'Justificada';
      default: return status;
    }
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

  getFriendlyDate(dateStr: string): string {
    const d = new Date(dateStr + 'T00:00:00');
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    const formatted = d.toLocaleDateString('es-PE', options);
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  }

  exportCsv(): void {
    const records = this.filteredRecords();
    if (records.length === 0) {
      alert('No hay registros para exportar.');
      return;
    }

    const headers = ['DNI', 'Colaborador', 'Area', 'Ingreso', 'Salida', 'Horas', 'Estado', 'Origen'];
    const rows = records.map(r => [
      r.employee.dni,
      r.employee.fullName,
      r.employee.department,
      r.clockIn || '',
      r.clockOut || '',
      r.hours !== null ? r.hours.toString() : '',
      this.getStatusLabel(r.status),
      r.origin || ''
    ]);

    const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Reporte_Asistencia_${this.selectedDate()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  syncTerminal(): void {
    alert('Sincronizando terminal biométrico central... Cargando datos en tiempo real.');
    this.loadData();
  }


}
