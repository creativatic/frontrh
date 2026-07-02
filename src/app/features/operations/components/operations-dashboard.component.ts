import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EmployeeService } from '../../../shared/services/employee.service';
import { ServiceTypeService, ServiceDto } from '../../../shared/services/service-type.service';
import { LocationService, LocationDto } from '../../../shared/services/location.service';
import { ScheduleService, ScheduleDto } from '../../../shared/services/schedule.service';
import { EmployeeShiftService, EmployeeShiftDto } from '../../../shared/services/employee-shift.service';
import { RosterService, RosterAssignmentDto, BulkRosterAssignmentDto } from '../../../shared/services/roster.service';

interface WeekDay {
  date: Date;
  dateStr: string;
  label: string;
}

@Component({
  selector: 'app-operations-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="hr-page-header" style="margin-bottom: 24px;">
      <div>
        <h1 class="hr-page-title">Programación y Operaciones de Personal</h1>
        <p class="hr-page-sub">Planifica los turnos de los vigilantes, gestiona rotaciones y programa días de descanso.</p>
      </div>
      <div class="hr-page-actions" style="display: flex; gap: 8px;">
        <button class="hr-btn hr-btn-ghost" (click)="openIndividualProgModal()" style="border: 1px solid var(--border); background: var(--surface);">
          ➕ Registrar Programación
        </button>
        <button class="hr-btn hr-btn-primary" (click)="openBulkModal()">
          📅 Programar Rotación Masiva
        </button>
      </div>
    </div>

    <!-- Filtros y Navegación de Semana -->
    <div class="hr-card" style="padding: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap;">
      <div style="display: flex; align-items: center; gap: 12px;">
        <button class="hr-btn hr-btn-ghost" style="padding: 8px 12px;" (click)="navigateWeek(-7)">
          ◀ Anterior
        </button>
        <span style="font-weight: 700; font-size: 15px; color: var(--text);">
          {{ weekLabel() }}
        </span>
        <button class="hr-btn hr-btn-ghost" style="padding: 8px 12px;" (click)="navigateWeek(7)">
          Siguiente ▶
        </button>
        <button class="hr-btn hr-btn-ghost" style="padding: 8px 12px; margin-left: 8px;" (click)="goToCurrentWeek()">
          Semana Actual
        </button>
      </div>

      <div style="display: flex; align-items: center; gap: 12px;">
        <input 
          type="text" 
          placeholder="Buscar vigilante..." 
          [(ngModel)]="searchQuery" 
          (input)="onSearchChange()" 
          style="padding: 8px 12px; border: 1px solid var(--border); border-radius: var(--radius-sm); font-size: 13px; width: 220px; background: var(--surface); color: var(--text);"
        />
        <select 
          [(ngModel)]="filterServiceId" 
          (change)="loadShiftsAndEmployees()"
          style="padding: 8px 12px; border: 1px solid var(--border); border-radius: var(--radius-sm); font-size: 13px; background: var(--surface); color: var(--text);"
        >
          <option value="">Todos los Servicios</option>
          <option *ngFor="let s of services()" [value]="s.id">{{ s.name }}</option>
        </select>
      </div>
    </div>

    <!-- Cuadrante de Operaciones (Grid) -->
    <div class="hr-card" style="padding: 0; overflow-x: auto; margin-bottom: 24px;">
      <table class="hr-tbl" style="width: 100%; border-collapse: collapse; min-width: 900px;">
        <thead>
          <tr>
            <th style="width: 250px; text-align: left; padding: 14px;">Vigilante</th>
            <th *ngFor="let day of weekDays()" style="text-align: center; padding: 14px; width: 140px;">
              <div style="font-weight: 700; color: var(--text);">{{ day.label }}</div>
              <div style="font-size: 11px; color: var(--text-soft); font-weight: 500; margin-top: 2px;">{{ day.date | date:'dd/MM' }}</div>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let emp of filteredEmployees()">
            <td style="padding: 12px; border-bottom: 1px solid var(--border);">
              <div style="display: flex; align-items: center; gap: 10px;">
                <span class="hr-emp-avatar" style="background: oklch(0.55 0.14 var(--accent-h)); color: white; width: 32px; height: 32px; font-size: 12px; font-weight: 700;">
                  {{ getInitials(emp.full_name || emp.fullName) }}
                </span>
                <div>
                  <div style="font-weight: 700; font-size: 13.5px; color: var(--text);">{{ emp.full_name || emp.fullName }}</div>
                  <div style="font-size: 11.5px; color: var(--text-soft);">{{ emp.position }}</div>
                </div>
              </div>
            </td>
            
            <td *ngFor="let day of weekDays()" 
                (click)="openShiftModal(emp, day)" 
                style="padding: 10px; text-align: center; border-bottom: 1px solid var(--border); cursor: pointer; position: relative;"
                class="hover-cell"
            >
              <!-- CELDA CONTENIDO -->
              <ng-container *ngIf="getExplicitShift(emp.id, day.dateStr) as shift; else defaultShift">
                <!-- Turno Personalizado (Explícito) -->
                @if (shift.serviceId) {
                  <div [class]="getServiceClass(shift.service?.name || '')" 
                       style="padding: 6px 8px; border-radius: var(--radius-sm); font-size: 11px; font-weight: 700; text-align: center; line-height: 1.3; box-shadow: var(--shadow-sm);">
                    <div style="font-size: 9.5px; text-transform: uppercase; opacity: 0.9;">{{ shift.service?.name }}</div>
                    <div style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                      {{ shift.schedule ? formatTime(shift.schedule.startTime) + '-' + formatTime(shift.schedule.endTime) : 'Sin Horario' }}
                    </div>
                    <div style="font-size: 9.5px; font-weight: 500; opacity: 0.85;">📍 {{ shift.location?.name }}</div>
                  </div>
                } @else {
                  <!-- Franco Personalizado -->
                  <div style="padding: 8px; background: var(--surface-2); border: 1px solid var(--surface-3); border-radius: var(--radius-sm); font-size: 11px; font-weight: 700; color: var(--text-soft);">
                    😴 Franco (Descanso)
                  </div>
                }
              </ng-container>

              <!-- Turno Predeterminado (Fallback) -->
              <ng-template #defaultShift>
                <ng-container *ngIf="emp.schedule; else noDefault">
                  <div style="padding: 6px 8px; border: 1px dashed var(--border-strong); border-radius: var(--radius-sm); font-size: 11px; font-weight: 500; text-align: center; line-height: 1.3; color: var(--text-soft); opacity: 0.75;"
                       title="Turno predeterminado de su contrato">
                    <div style="font-size: 9px; text-transform: uppercase; opacity: 0.8; letter-spacing: 0.5px;">Predeterminado</div>
                    <div style="font-weight: 600; color: var(--text);">
                      {{ emp.schedule ? formatTime(emp.schedule.startTime) + '-' + formatTime(emp.schedule.endTime) : '' }}
                    </div>
                    <div style="font-size: 9.5px;">📍 {{ emp.location?.name || 'Sede principal' }}</div>
                  </div>
                </ng-container>
                <ng-template #noDefault>
                  <div style="font-size: 11.5px; color: var(--text-mute); font-style: italic;">
                    Sin Asignar
                  </div>
                </ng-template>
              </ng-template>

              <!-- Edit overlay indicator -->
              <div class="edit-indicator">✏️</div>
            </td>
          </tr>
          
          <tr *ngIf="filteredEmployees().length === 0">
            <td colspan="8" style="padding: 40px; text-align: center; color: var(--text-soft); font-style: italic;">
              No se encontraron colaboradores.
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- MODAL DE EDICIÓN INDIVIDUAL (OVERRIDE DIARIO) -->
    <div *ngIf="showShiftModal()" class="modal-overlay">
      <div class="modal-card" style="max-width: 480px; width: 90%;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <div>
            <h3 style="font-size: 16px; font-weight: 800; color: var(--text); margin-bottom: 2px;">Programar Turno Diario</h3>
            <p style="font-size: 12px; color: var(--text-soft);">
              {{ selectedDay()?.label }} {{ selectedDay()?.date | date:'dd' }} de {{ selectedDay()?.date | date:'MMMM, yyyy' }}
            </p>
          </div>
          <button class="hr-btn hr-btn-ghost" style="padding: 4px 8px; font-size: 18px;" (click)="closeShiftModal()">×</button>
        </div>

        <div style="margin-bottom: 16px; display: flex; align-items: center; gap: 10px; background: var(--surface-2); padding: 10px; border-radius: var(--radius-sm);">
          <span class="hr-emp-avatar" style="background: oklch(0.55 0.14 var(--accent-h)); color: white; width: 36px; height: 36px; font-weight: 700;">
            {{ getInitials(selectedEmployee()?.full_name || selectedEmployee()?.fullName) }}
          </span>
          <div>
            <div style="font-weight: 700; font-size: 13.5px; color: var(--text);">{{ selectedEmployee()?.full_name || selectedEmployee()?.fullName }}</div>
            <div style="font-size: 11px; color: var(--text-soft);">{{ selectedEmployee()?.position }}</div>
          </div>
        </div>

        <!-- Checkbox Franco/Descanso -->
        <label class="check-container" style="display: flex; align-items: center; gap: 8px; margin-bottom: 20px; font-weight: 700; color: var(--text); cursor: pointer;">
          <input type="checkbox" [(ngModel)]="modalIsFranco" (change)="onIsFrancoChange()" style="width: 16px; height: 16px; accent-color: var(--accent);" />
          <span>Marcar como Franco (Día de Descanso)</span>
        </label>

        <!-- Selectores de Turno -->
        <div *ngIf="!modalIsFranco" style="display: flex; flex-direction: column; gap: 14px; margin-bottom: 20px;">
          <div class="hr-field">
            <label style="font-size: 12px; font-weight: 700; color: var(--text-soft); margin-bottom: 6px;">Servicio</label>
            <select [(ngModel)]="modalServiceId" style="width: 100%; padding: 10px; border: 1px solid var(--border); border-radius: var(--radius-sm); font-size: 13px; background: var(--surface); color: var(--text);">
              <option value="">Selecciona un servicio</option>
              <option *ngFor="let s of services()" [value]="s.id">{{ s.name }}</option>
            </select>
          </div>

          <div class="hr-field">
            <label style="font-size: 12px; font-weight: 700; color: var(--text-soft); margin-bottom: 6px;">Sede (Ubicación)</label>
            <select [(ngModel)]="modalLocationId" style="width: 100%; padding: 10px; border: 1px solid var(--border); border-radius: var(--radius-sm); font-size: 13px; background: var(--surface); color: var(--text);">
              <option value="">Selecciona una sede</option>
              <option *ngFor="let l of locations()" [value]="l.id">{{ l.name }}</option>
            </select>
          </div>

          <div class="hr-field">
            <label style="font-size: 12px; font-weight: 700; color: var(--text-soft); margin-bottom: 6px;">Horario (Turno)</label>
            <select [(ngModel)]="modalScheduleId" style="width: 100%; padding: 10px; border: 1px solid var(--border); border-radius: var(--radius-sm); font-size: 13px; background: var(--surface); color: var(--text);">
              <option value="">Selecciona un horario</option>
              <option *ngFor="let sc of schedules()" [value]="sc.id">
                {{ sc.name }} ({{ formatTime(sc.startTime || '') }} - {{ formatTime(sc.endTime || '') }})
              </option>
            </select>
          </div>
        </div>

        <div class="hr-field" style="margin-bottom: 24px;">
          <label style="font-size: 12px; font-weight: 700; color: var(--text-soft); margin-bottom: 6px;">Notas / Observaciones</label>
          <input type="text" [(ngModel)]="modalNotes" placeholder="Ej: Rotación por descanso médico, refuerzo nocturno..." style="width: 100%; padding: 10px; border: 1px solid var(--border); border-radius: var(--radius-sm); font-size: 13px; background: var(--surface); color: var(--text);" />
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; gap: 12px;">
          <!-- Eliminar asignación personalizada si existe -->
          <div>
            <button 
              *ngIf="hasExplicitShift(selectedEmployee()?.id, selectedDay()?.dateStr)" 
              class="hr-btn hr-btn-ghost" 
              style="color: var(--danger); padding: 8px 12px; font-size: 12px;" 
              (click)="deleteExplicitShift()"
            >
              🗑️ Revertir a Predeterminado
            </button>
          </div>

          <div style="display: flex; gap: 8px;">
            <button class="hr-btn hr-btn-ghost" (click)="closeShiftModal()">Cancelar</button>
            <button class="hr-btn hr-btn-primary" (click)="saveIndividualShift()" [disabled]="!modalIsFranco && (!modalServiceId || !modalLocationId || !modalScheduleId)">
              Guardar Turno
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL DE PROGRAMACIÓN INDIVIDUAL RECURRENTE -->
    <div *ngIf="showIndividualProgModal()" class="modal-overlay">
      <div class="modal-card" style="max-width: 480px; width: 90%;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <div>
            <h3 style="font-size: 16px; font-weight: 800; color: var(--text); margin-bottom: 2px;">Registrar Programación Individual</h3>
            <p style="font-size: 12px; color: var(--text-soft);">Define un turno recurrente para un colaborador.</p>
          </div>
          <button class="hr-btn hr-btn-ghost" style="padding: 4px 8px; font-size: 18px;" (click)="closeIndividualProgModal()">×</button>
        </div>

        <div style="display: flex; flex-direction: column; gap: 14px; margin-bottom: 20px;">
          <!-- Colaborador -->
          <div class="hr-field">
            <label style="font-size: 12px; font-weight: 700; color: var(--text-soft); margin-bottom: 6px; display: block;">Colaborador</label>
            <select [(ngModel)]="progEmployeeId" style="width: 100%; padding: 10px; border: 1px solid var(--border); border-radius: var(--radius-sm); font-size: 13px; background: var(--surface); color: var(--text);">
              <option value="">Selecciona un colaborador</option>
              <option *ngFor="let e of employees()" [value]="e.id">{{ e.full_name || e.fullName }} ({{ e.position }})</option>
            </select>
          </div>

          <!-- Servicio -->
          <div class="hr-field">
            <label style="font-size: 12px; font-weight: 700; color: var(--text-soft); margin-bottom: 6px; display: block;">Servicio</label>
            <select [(ngModel)]="progServiceId" style="width: 100%; padding: 10px; border: 1px solid var(--border); border-radius: var(--radius-sm); font-size: 13px; background: var(--surface); color: var(--text);">
              <option value="">Selecciona un servicio</option>
              <option *ngFor="let s of services()" [value]="s.id">{{ s.name }}</option>
            </select>
          </div>

          <!-- Sede -->
          <div class="hr-field">
            <label style="font-size: 12px; font-weight: 700; color: var(--text-soft); margin-bottom: 6px; display: block;">Sede (Ubicación)</label>
            <select [(ngModel)]="progLocationId" style="width: 100%; padding: 10px; border: 1px solid var(--border); border-radius: var(--radius-sm); font-size: 13px; background: var(--surface); color: var(--text);">
              <option value="">Selecciona una sede</option>
              <option *ngFor="let l of locations()" [value]="l.id">{{ l.name }}</option>
            </select>
          </div>

          <!-- Horario -->
          <div class="hr-field">
            <label style="font-size: 12px; font-weight: 700; color: var(--text-soft); margin-bottom: 6px; display: block;">Horario (Turno)</label>
            <select [(ngModel)]="progScheduleId" style="width: 100%; padding: 10px; border: 1px solid var(--border); border-radius: var(--radius-sm); font-size: 13px; background: var(--surface); color: var(--text);">
              <option value="">Selecciona un horario</option>
              <option *ngFor="let sc of schedules()" [value]="sc.id">
                {{ sc.name }} ({{ formatTime(sc.startTime || '') }} - {{ formatTime(sc.endTime || '') }})
              </option>
            </select>
          </div>

          <!-- Días de la Semana checkboxes L, M, X, J, V, S, D -->
          <div class="hr-field">
            <label style="font-size: 12px; font-weight: 700; color: var(--text-soft); margin-bottom: 6px; display: block;">Días de Trabajo</label>
            <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-top: 4px;">
              <label *ngFor="let day of weekLetters" style="display: flex; align-items: center; gap: 4px; font-size: 13px; color: var(--text); cursor: pointer; background: var(--surface-2); padding: 6px 10px; border: 1px solid var(--border); border-radius: var(--radius-sm);">
                <input type="checkbox" [checked]="progDays.has(day)" (change)="toggleProgDay(day)" style="accent-color: var(--accent);" />
                <span>{{ day }}</span>
              </label>
            </div>
          </div>

          <!-- Rango de Fechas -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            <div class="hr-field">
              <label style="font-size: 12px; font-weight: 700; color: var(--text-soft); margin-bottom: 4px;">F. Inicio</label>
              <input type="date" [(ngModel)]="progStartDate" style="width: 100%; padding: 10px; border: 1px solid var(--border); border-radius: var(--radius-sm); font-size: 13px; background: var(--surface); color: var(--text);" />
            </div>
            <div class="hr-field">
              <label style="font-size: 12px; font-weight: 700; color: var(--text-soft); margin-bottom: 4px;">F. Fin (Opcional)</label>
              <input type="date" [(ngModel)]="progEndDate" style="width: 100%; padding: 10px; border: 1px solid var(--border); border-radius: var(--radius-sm); font-size: 13px; background: var(--surface); color: var(--text);" />
            </div>
          </div>

          <!-- Error message placeholder -->
          <div *ngIf="individualProgError()" style="margin-top: 10px; padding: 10px; background: rgba(239, 68, 68, 0.1); border: 1px solid #ef4444; border-radius: var(--radius-sm); color: #ef4444; font-size: 12px;">
            ⚠️ {{ individualProgError() }}
          </div>
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 8px;">
          <button class="hr-btn hr-btn-ghost" (click)="closeIndividualProgModal()">Cancelar</button>
          <button class="hr-btn hr-btn-primary" (click)="saveIndividualProg()" [disabled]="!progEmployeeId || !progServiceId || !progLocationId || !progScheduleId || progDays.size === 0 || !progStartDate">
            Registrar Programación
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL DE ASIGNACIÓN MASIVA (ROTACIÓN) -->
    <div *ngIf="showBulkModal()" class="modal-overlay">
      <div class="modal-card" style="max-width: 600px; width: 95%;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <div>
            <h3 style="font-size: 16px; font-weight: 800; color: var(--text); margin-bottom: 2px;">Planificar Rotación Masiva</h3>
            <p style="font-size: 12px; color: var(--text-soft);">Programa turnos o francos para múltiples vigilantes de manera simultánea.</p>
          </div>
          <button class="hr-btn hr-btn-ghost" style="padding: 4px 8px; font-size: 18px;" (click)="closeBulkModal()">×</button>
        </div>

        <!-- RESULTADOS DEL PROCESAMIENTO MASIVO -->
        <div *ngIf="bulkResults" style="display: flex; flex-direction: column; gap: 14px; margin-bottom: 20px;">
          <div style="padding: 10px; background: var(--surface-2); border-radius: var(--radius-sm); border: 1px solid var(--border);">
            <div style="font-weight: 700; font-size: 14px; color: var(--text); margin-bottom: 6px;">Resumen del Proceso:</div>
            <div style="font-size: 13px; color: var(--text-soft);">
              Éxitos: <span style="color: #22c55e; font-weight: 700;">{{ bulkResults.successes.length }}</span> | 
              Conflictos: <span style="color: #ef4444; font-weight: 700;">{{ bulkResults.failures.length }}</span>
            </div>
          </div>

          <div style="max-height: 250px; overflow-y: auto; display: flex; flex-direction: column; gap: 8px;">
            <!-- Éxitos -->
            <div *ngFor="let s of bulkResults.successes" style="display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; background: rgba(34, 197, 94, 0.08); border-left: 4px solid #22c55e; border-radius: var(--radius-xs); font-size: 12.5px;">
              <span style="font-weight: 600; color: var(--text);">{{ s.employee_name }}</span>
              <span style="color: #22c55e; font-weight: 600;">✔️ Registrado</span>
            </div>

            <!-- Fallas/Solapamientos -->
            <div *ngFor="let f of bulkResults.failures" style="display: flex; flex-direction: column; gap: 4px; padding: 8px 12px; background: rgba(239, 68, 68, 0.08); border-left: 4px solid #ef4444; border-radius: var(--radius-xs); font-size: 12.5px;">
              <div style="display: flex; align-items: center; justify-content: space-between;">
                <span style="font-weight: 600; color: var(--text);">{{ f.employee_name }}</span>
                <span style="color: #ef4444; font-weight: 600;">❌ Solapamiento</span>
              </div>
              <div style="font-size: 11px; color: var(--text-soft); line-height: 1.3;">{{ f.error }}</div>
            </div>
          </div>
        </div>

        <div *ngIf="!bulkResults" style="display: grid; grid-template-columns: 1.1fr 1fr; gap: 20px; margin-bottom: 20px;">
          <!-- Columna izquierda: Selección de personal -->
          <div style="display: flex; flex-direction: column; border-right: 1px solid var(--border); padding-right: 16px;">
            <label style="font-size: 12px; font-weight: 700; color: var(--text-soft); margin-bottom: 6px; display: flex; justify-content: space-between;">
              <span>Seleccionar Personal</span>
              <a href="javascript:void(0)" (click)="toggleAllBulkEmployees()" style="text-decoration: none; font-size: 11.5px; color: var(--accent);">
                {{ allBulkSelected() ? 'Desmarcar todos' : 'Marcar todos' }}
              </a>
            </label>
            <input 
              type="text" 
              placeholder="Filtrar vigilantes..." 
              [(ngModel)]="bulkSearchQuery" 
              style="padding: 6px 10px; border: 1px solid var(--border); border-radius: var(--radius-sm); font-size: 12.5px; margin-bottom: 10px; background: var(--surface); color: var(--text);"
            />
            <div style="max-height: 220px; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; padding-right: 4px;">
              <label *ngFor="let emp of filteredBulkEmployees()" style="display: flex; align-items: center; gap: 8px; font-size: 12.5px; color: var(--text); cursor: pointer;">
                <input 
                  type="checkbox" 
                  [checked]="bulkSelectedEmployeeIds.has(emp.id)" 
                  (change)="toggleBulkEmployeeSelection(emp.id)" 
                  style="accent-color: var(--accent);"
                />
                <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                  {{ emp.full_name || emp.fullName }}
                </span>
              </label>
            </div>
          </div>

          <!-- Columna derecha: Parámetros del turno -->
          <div style="display: flex; flex-direction: column; gap: 14px;">
            <!-- Fechas -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
              <div class="hr-field">
                <label style="font-size: 11.5px; font-weight: 700; color: var(--text-soft); margin-bottom: 4px;">F. Inicio</label>
                <input type="date" [(ngModel)]="bulkStartDate" style="width: 100%; padding: 8px; border: 1px solid var(--border); border-radius: var(--radius-sm); font-size: 12.5px; background: var(--surface); color: var(--text);" />
              </div>
              <div class="hr-field">
                <label style="font-size: 11.5px; font-weight: 700; color: var(--text-soft); margin-bottom: 4px;">F. Fin</label>
                <input type="date" [(ngModel)]="bulkEndDate" style="width: 100%; padding: 8px; border: 1px solid var(--border); border-radius: var(--radius-sm); font-size: 12.5px; background: var(--surface); color: var(--text);" />
              </div>
            </div>

            <!-- Días de Trabajo en modal masivo -->
            <div class="hr-field">
              <label style="font-size: 11.5px; font-weight: 700; color: var(--text-soft); margin-bottom: 4px; display: block;">Días de Trabajo</label>
              <div style="display: flex; gap: 6px; flex-wrap: wrap; margin-top: 2px;">
                <label *ngFor="let day of weekLetters" style="display: flex; align-items: center; gap: 3px; font-size: 11.5px; color: var(--text); cursor: pointer; background: var(--surface-2); padding: 4px 8px; border: 1px solid var(--border); border-radius: var(--radius-sm);">
                  <input type="checkbox" [checked]="bulkDays.has(day)" (change)="toggleBulkDay(day)" style="accent-color: var(--accent);" />
                  <span>{{ day }}</span>
                </label>
              </div>
            </div>

            <!-- Franco checkbox -->
            <label class="check-container" style="display: flex; align-items: center; gap: 6px; font-weight: 700; color: var(--text); cursor: pointer; font-size: 12.5px; margin-top: 4px;">
              <input type="checkbox" [(ngModel)]="bulkIsFranco" (change)="onBulkIsFrancoChange()" style="accent-color: var(--accent);" />
              <span>Marcar como Franco (Días Libres)</span>
            </label>

            <!-- Inputs de turno -->
            <ng-container *ngIf="!bulkIsFranco">
              <div class="hr-field">
                <label style="font-size: 11.5px; font-weight: 700; color: var(--text-soft); margin-bottom: 4px;">Servicio</label>
                <select [(ngModel)]="bulkServiceId" style="width: 100%; padding: 8px; border: 1px solid var(--border); border-radius: var(--radius-sm); font-size: 12.5px; background: var(--surface); color: var(--text);">
                  <option value="">Selecciona un servicio</option>
                  <option *ngFor="let s of services()" [value]="s.id">{{ s.name }}</option>
                </select>
              </div>

              <div class="hr-field">
                <label style="font-size: 11.5px; font-weight: 700; color: var(--text-soft); margin-bottom: 4px;">Sede (Ubicación)</label>
                <select [(ngModel)]="bulkLocationId" style="width: 100%; padding: 8px; border: 1px solid var(--border); border-radius: var(--radius-sm); font-size: 12.5px; background: var(--surface); color: var(--text);">
                  <option value="">Selecciona una sede</option>
                  <option *ngFor="let l of locations()" [value]="l.id">{{ l.name }}</option>
                </select>
              </div>

              <div class="hr-field">
                <label style="font-size: 11.5px; font-weight: 700; color: var(--text-soft); margin-bottom: 4px;">Horario (Turno)</label>
                <select [(ngModel)]="bulkScheduleId" style="width: 100%; padding: 8px; border: 1px solid var(--border); border-radius: var(--radius-sm); font-size: 12.5px; background: var(--surface); color: var(--text);">
                  <option value="">Selecciona un horario</option>
                  <option *ngFor="let sc of schedules()" [value]="sc.id">
                    {{ sc.name }} ({{ formatTime(sc.startTime || '') }} - {{ formatTime(sc.endTime || '') }})
                  </option>
                </select>
              </div>
            </ng-container>

            <div class="hr-field">
              <label style="font-size: 11.5px; font-weight: 700; color: var(--text-soft); margin-bottom: 4px;">Notas</label>
              <input type="text" [(ngModel)]="bulkNotes" placeholder="Opcional..." style="width: 100%; padding: 8px; border: 1px solid var(--border); border-radius: var(--radius-sm); font-size: 12.5px; background: var(--surface); color: var(--text);" />
            </div>
          </div>
        </div>

        <div style="display: flex; justify-content: flex-end; align-items: center; gap: 8px;">
          <button class="hr-btn hr-btn-ghost" (click)="closeBulkModal()">{{ bulkResults ? 'Cerrar' : 'Cancelar' }}</button>
          <button 
            *ngIf="!bulkResults"
            class="hr-btn hr-btn-primary" 
            (click)="saveBulkRotation()" 
            [disabled]="bulkSelectedEmployeeIds.size === 0 || !bulkStartDate || !bulkEndDate || bulkDays.size === 0 || (!bulkIsFranco && (!bulkServiceId || !bulkLocationId || !bulkScheduleId))"
          >
            Aplicar Planificación Masiva
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .hover-cell:hover {
      background: var(--surface-2) !important;
    }
    .hover-cell:hover .edit-indicator {
      display: block;
    }
    .edit-indicator {
      display: none;
      position: absolute;
      bottom: 2px;
      right: 2px;
      font-size: 10px;
      opacity: 0.7;
    }
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(15, 23, 42, 0.6);
      backdrop-filter: blur(4px);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    }
    .modal-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 20px 25px -5px rgba(0,0,0,0.15), 0 10px 10px -5px rgba(0,0,0,0.04);
    }
  `]
})
export class OperationsDashboardComponent implements OnInit {
  private readonly employeeService = inject(EmployeeService);
  private readonly serviceTypeService = inject(ServiceTypeService);
  private readonly locationService = inject(LocationService);
  private readonly scheduleService = inject(ScheduleService);
  private readonly employeeShiftService = inject(EmployeeShiftService);
  private readonly rosterService = inject(RosterService);

  readonly employees = signal<any[]>([]);
  readonly services = signal<ServiceDto[]>([]);
  readonly locations = signal<LocationDto[]>([]);
  readonly schedules = signal<ScheduleDto[]>([]);
  readonly shifts = signal<EmployeeShiftDto[]>([]);

  // Navegación de Fecha
  currentDate = new Date();
  readonly weekDays = signal<WeekDay[]>([]);
  readonly weekLabel = signal<string>('');

  // Filtros
  searchQuery = '';
  filterServiceId = '';

  // Modales
  readonly showShiftModal = signal(false);
  readonly showBulkModal = signal(false);
  readonly showIndividualProgModal = signal(false);

  // Modal Individual (Override Diario) State
  selectedEmployee = signal<any | null>(null);
  selectedDay = signal<WeekDay | null>(null);
  modalIsFranco = false;
  modalServiceId = '';
  modalLocationId = '';
  modalScheduleId = '';
  modalNotes = '';

  // Modal Programacion Recurrente Individual State
  progEmployeeId = '';
  progServiceId = '';
  progLocationId = '';
  progScheduleId = '';
  progStartDate = '';
  progEndDate = '';
  progDays = new Set<string>();
  readonly individualProgError = signal<string>('');
  weekLetters = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Modal Masivo State
  bulkSearchQuery = '';
  bulkStartDate = '';
  bulkEndDate = '';
  bulkIsFranco = false;
  bulkServiceId = '';
  bulkLocationId = '';
  bulkScheduleId = '';
  bulkNotes = '';
  bulkDays = new Set<string>();
  readonly bulkSelectedEmployeeIds = new Set<string>();
  bulkResults: { successes: any[], failures: any[] } | null = null;

  ngOnInit(): void {
    this.calculateWeekDays();
    this.loadCatalogs();
    this.loadShiftsAndEmployees();
  }

  calculateWeekDays(): void {
    const temp = new Date(this.currentDate);
    const day = temp.getDay();
    const diff = temp.getDate() - day + (day === 0 ? -6 : 1); // Monday
    const monday = new Date(temp.setDate(diff));

    const days: WeekDay[] = [];
    const weekdaysLabels = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const isoStr = this.formatToDateString(d);
      days.push({
        date: d,
        dateStr: isoStr,
        label: weekdaysLabels[i]
      });
    }

    this.weekDays.set(days);

    // Formatear label del picker
    const startStr = days[0].date.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' });
    const endStr = days[6].date.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
    this.weekLabel.set(`${startStr} - ${endStr}`);
  }

  formatToDateString(d: Date): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  navigateWeek(days: number): void {
    this.currentDate.setDate(this.currentDate.getDate() + days);
    this.calculateWeekDays();
    this.loadShiftsAndEmployees();
  }

  goToCurrentWeek(): void {
    this.currentDate = new Date();
    this.calculateWeekDays();
    this.loadShiftsAndEmployees();
  }

  async loadCatalogs(): Promise<void> {
    try {
      const [sRes, lRes, scRes] = await Promise.all([
        this.serviceTypeService.getServices(),
        this.locationService.getLocations(),
        this.scheduleService.getSchedules()
      ]);
      this.services.set(sRes.data || sRes.services || sRes);
      this.locations.set(lRes.data || lRes.locations || lRes);
      this.schedules.set(scRes.data || scRes.schedules || scRes);
    } catch (err) {
      console.error('Error al cargar catálogos de planificación', err);
    }
  }

  async loadShiftsAndEmployees(): Promise<void> {
    const days = this.weekDays();
    if (days.length === 0) return;

    // Use Monday dateStr of the current week as the 'semana' parameter
    const semana = days[0].dateStr;

    try {
      const [empRes, shiftRes] = await Promise.all([
        this.employeeService.getEmployees(undefined, undefined, 1, 100),
        this.rosterService.getShifts(semana, this.filterServiceId || undefined, this.searchQuery || undefined)
      ]);
      
      console.log('API Emp Res:', empRes);
      
      // Manejar posibles anidaciones de Laravel (ej. empRes.data.data)
      let employeesList = [];
      if (Array.isArray(empRes)) {
        employeesList = empRes;
      } else if (empRes && Array.isArray(empRes.data)) {
        employeesList = empRes.data;
      } else if (empRes && empRes.data && Array.isArray((empRes.data as any).data)) {
        employeesList = (empRes.data as any).data;
      }

      this.employees.set(employeesList);
      this.shifts.set(shiftRes.shifts || []);
    } catch (err) {
      console.error('Error al cargar datos del cuadrante', err);
    }
  }

  filteredEmployees(): any[] {
    let list = this.employees();
    
    // Filter to only show employees with active programaciones or shifts in this week
    list = list.filter(e => {
      const hasShift = this.shifts().some(s => s.employeeId === e.id);
      return hasShift;
    });

    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(e => 
        (e.full_name || e.fullName || '').toLowerCase().includes(q) ||
        (e.dni || '').includes(q) ||
        (e.position || '').toLowerCase().includes(q)
      );
    }
    if (this.filterServiceId) {
      list = list.filter(e => {
        const hasShiftOfWeek = this.shifts().some(s => s.employeeId === e.id && s.serviceId === this.filterServiceId);
        return hasShiftOfWeek || e.serviceId === this.filterServiceId;
      });
    }
    return list;
  }

  getInitials(name: string): string {
    if (!name) return 'V';
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  }

  formatTime(timeStr: string): string {
    if (!timeStr) return '';
    return timeStr.slice(0, 5);
  }

  getExplicitShift(employeeId: string | undefined, dateStr: string | undefined): EmployeeShiftDto | null {
    if (!employeeId || !dateStr) return null;
    return this.shifts().find(s => s.employeeId === employeeId && s.date === dateStr) || null;
  }

  hasExplicitShift(employeeId: string | undefined, dateStr: string | undefined): boolean {
    return !!this.getExplicitShift(employeeId, dateStr);
  }

  getServiceClass(name: string): string {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('empresa')) {
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
    }
    if (lowerName.includes('evento')) {
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300';
    }
    if (lowerName.includes('discoteca')) {
      return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300';
    }
    return 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300';
  }

  onSearchChange(): void {
    // Angular handles change detection, filteredEmployees() will re-run automatically
  }

  openShiftModal(employee: any, day: WeekDay): void {
    this.selectedEmployee.set(employee);
    this.selectedDay.set(day);

    const existing = this.getExplicitShift(employee.id, day.dateStr);
    if (existing) {
      this.modalIsFranco = !existing.serviceId;
      this.modalServiceId = existing.serviceId || '';
      this.modalLocationId = existing.locationId || '';
      this.modalScheduleId = existing.scheduleId || '';
      this.modalNotes = existing.notes || '';
    } else {
      // Fallback a los predeterminados del colaborador
      this.modalIsFranco = false;
      this.modalServiceId = employee.serviceId || '';
      this.modalLocationId = employee.locationId || '';
      this.modalScheduleId = employee.scheduleId || '';
      this.modalNotes = '';
    }

    this.showShiftModal.set(true);
  }

  closeShiftModal(): void {
    this.showShiftModal.set(false);
    this.selectedEmployee.set(null);
    this.selectedDay.set(null);
  }

  onIsFrancoChange(): void {
    if (this.modalIsFranco) {
      this.modalServiceId = '';
      this.modalLocationId = '';
      this.modalScheduleId = '';
    }
  }

  async saveIndividualShift(): Promise<void> {
    const employee = this.selectedEmployee();
    const day = this.selectedDay();
    if (!employee || !day) return;

    const payload: Partial<EmployeeShiftDto> = {
      employeeId: employee.id,
      date: day.dateStr,
      notes: this.modalNotes || null,
      serviceId: this.modalIsFranco ? null : this.modalServiceId,
      locationId: this.modalIsFranco ? null : this.modalLocationId,
      scheduleId: this.modalIsFranco ? null : this.modalScheduleId
    };

    try {
      await this.employeeShiftService.saveShifts([payload]);
      alert('Información corporativa guardada con éxito.');
      this.closeShiftModal();
      await this.loadShiftsAndEmployees();
    } catch (err) {
      console.error('Error saving individual shift', err);
    }
  }

  async deleteExplicitShift(): Promise<void> {
    const employee = this.selectedEmployee();
    const day = this.selectedDay();
    if (!employee || !day) return;

    const existing = this.getExplicitShift(employee.id, day.dateStr);
    if (!existing || !existing.id) return;

    try {
      await this.employeeShiftService.deleteShift(existing.id);
      alert('Turno personalizado eliminado con éxito.');
      this.closeShiftModal();
      await this.loadShiftsAndEmployees();
    } catch (err) {
      console.error('Error deleting explicit shift', err);
    }
  }

  // PROGRAMACIÓN INDIVIDUAL RECURRENTE
  openIndividualProgModal(): void {
    this.progEmployeeId = '';
    this.progServiceId = '';
    this.progLocationId = '';
    this.progScheduleId = '';
    this.progStartDate = this.weekDays()[0].dateStr;
    this.progEndDate = '';
    this.progDays.clear();
    this.individualProgError.set('');
    this.showIndividualProgModal.set(true);
  }

  closeIndividualProgModal(): void {
    this.showIndividualProgModal.set(false);
  }

  toggleProgDay(day: string): void {
    if (this.progDays.has(day)) {
      this.progDays.delete(day);
    } else {
      this.progDays.add(day);
    }
  }

  async saveIndividualProg(): Promise<void> {
    this.individualProgError.set('');
    
    const payload: RosterAssignmentDto = {
      employeeId: this.progEmployeeId,
      serviceId: this.progServiceId,
      locationId: this.progLocationId,
      scheduleId: this.progScheduleId,
      startDate: this.progStartDate,
      endDate: this.progEndDate || null,
      status: 'active',
      days: Array.from(this.progDays)
    };

    try {
      await this.rosterService.saveRosterAssignment(payload);
      alert('Información corporativa guardada con éxito.');
      this.closeIndividualProgModal();
      await this.loadShiftsAndEmployees();
    } catch (err: any) {
      console.error('Error saving individual roster assignment', err);
      // Extract error from validation response if possible
      if (err.error && err.error.errors) {
        if (err.error.errors.employeeId) {
          this.individualProgError.set(err.error.errors.employeeId[0]);
        } else if (err.error.errors.employee_id) {
          this.individualProgError.set(err.error.errors.employee_id[0]);
        } else {
          this.individualProgError.set(Object.values(err.error.errors).flat().join(' '));
        }
      } else if (err.error && err.error.message) {
        this.individualProgError.set(err.error.message);
      } else {
        this.individualProgError.set('Unknown scheduling conflict error.');
      }
    }
  }

  // ASIGNACIÓN MASIVA
  openBulkModal(): void {
    this.bulkStartDate = this.weekDays()[0].dateStr;
    this.bulkEndDate = this.weekDays()[6].dateStr;
    this.bulkIsFranco = false;
    this.bulkServiceId = '';
    this.bulkLocationId = '';
    this.bulkScheduleId = '';
    this.bulkNotes = '';
    this.bulkSearchQuery = '';
    this.bulkSelectedEmployeeIds.clear();
    this.bulkDays.clear();
    this.bulkResults = null;

    this.showBulkModal.set(true);
  }

  closeBulkModal(): void {
    this.showBulkModal.set(false);
    this.bulkResults = null;
  }

  toggleBulkDay(day: string): void {
    if (this.bulkDays.has(day)) {
      this.bulkDays.delete(day);
    } else {
      this.bulkDays.add(day);
    }
  }

  filteredBulkEmployees(): any[] {
    const q = this.bulkSearchQuery.toLowerCase();
    return this.employees().filter(e => 
      (e.full_name || e.fullName || '').toLowerCase().includes(q) ||
      (e.dni || '').includes(q)
    );
  }

  toggleBulkEmployeeSelection(id: string): void {
    if (this.bulkSelectedEmployeeIds.has(id)) {
      this.bulkSelectedEmployeeIds.delete(id);
    } else {
      this.bulkSelectedEmployeeIds.add(id);
    }
  }

  allBulkSelected(): boolean {
    const filtered = this.filteredBulkEmployees();
    if (filtered.length === 0) return false;
    return filtered.every(e => this.bulkSelectedEmployeeIds.has(e.id));
  }

  toggleAllBulkEmployees(): void {
    const filtered = this.filteredBulkEmployees();
    if (this.allBulkSelected()) {
      filtered.forEach(e => this.bulkSelectedEmployeeIds.delete(e.id));
    } else {
      filtered.forEach(e => this.bulkSelectedEmployeeIds.add(e.id));
    }
  }

  onBulkIsFrancoChange(): void {
    if (this.bulkIsFranco) {
      this.bulkServiceId = '';
      this.bulkLocationId = '';
      this.bulkScheduleId = '';
    }
  }

  async saveBulkRotation(): Promise<void> {
    if (this.bulkResults) {
      this.closeBulkModal();
      return;
    }

    if (this.bulkSelectedEmployeeIds.size === 0 || !this.bulkStartDate || !this.bulkEndDate || this.bulkDays.size === 0) return;

    const payload: BulkRosterAssignmentDto = {
      employeeIds: Array.from(this.bulkSelectedEmployeeIds),
      serviceId: this.bulkIsFranco ? null as any : this.bulkServiceId,
      locationId: this.bulkIsFranco ? null as any : this.bulkLocationId,
      scheduleId: this.bulkIsFranco ? null as any : this.bulkScheduleId,
      startDate: this.bulkStartDate,
      endDate: this.bulkEndDate || null,
      days: Array.from(this.bulkDays),
      notes: this.bulkNotes || null
    };

    try {
      const res = await this.rosterService.saveBulkRosterAssignments(payload);
      if (res && res.results) {
        this.bulkResults = res.results;
        const successCount = res.results.successes?.length || 0;
        const failureCount = res.results.failures?.length || 0;
        if (failureCount === 0) {
          alert('Información corporativa guardada con éxito.');
        } else {
          alert(`Información corporativa guardada con éxito.\nÉxitos: ${successCount}\nErrores (solapamientos): ${failureCount}`);
        }
      } else {
        alert('Información corporativa guardada con éxito.');
        this.closeBulkModal();
      }
      await this.loadShiftsAndEmployees();
    } catch (err) {
      console.error('Error saving bulk rotation', err);
      alert('Error al registrar la rotación masiva.');
    }
  }
}
