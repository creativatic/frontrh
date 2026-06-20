import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { AttendanceService } from '../../../shared/services/attendance.service';
import { EmployeeService } from '../../../shared/services/employee.service';
import { AttendanceRecord, Employee } from '../../../shared/models/hr.models';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-attendance-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div *ngIf="loading()" style="display: flex; justify-content: center; align-items: center; height: 300px;" class="hr-soft">
      Cargando ficha de control de asistencia...
    </div>

    <div *ngIf="!loading() && record()">
      <!-- Page Header -->
      <div class="hr-page-header">
        <div>
          <div class="crumb" style="margin-bottom: 8px;">
            <a [routerLink]="['/asistencia']" [queryParams]="{ date: selectedDate() }" style="cursor: pointer; color: var(--accent); font-weight: 500; text-decoration: none;">← Asistencia</a>
          </div>
          <div class="hr-hstack" style="gap: 16px;">
            <span class="hr-emp-avatar" [style.background]="getAvatarColor(record()?.employee?.fullName)" style="width: 60px; height: 60px; font-size: 18px;">
              {{ getInitials(record()?.employee?.fullName) }}
            </span>
            <div>
              <h1 class="hr-page-title">{{ record()?.employee?.fullName }}</h1>
              <div class="hr-hstack" style="margin-top: 6px;">
                <span class="hr-soft" style="font-size: 13.5px;">
                  {{ record()?.employee?.position }} · {{ record()?.employee?.department }}
                </span>
                <span class="hr-muted">·</span>
                <span class="hr-mono" style="font-size: 12.5px; color: var(--text-soft);">
                  DNI {{ record()?.employee?.dni }}
                </span>
                <span class="hr-badge" 
                      [class.success]="record()?.status === 'a tiempo'" 
                      [class.warning]="record()?.status === 'tarde'" 
                      [class.danger]="record()?.status === 'ausente'" 
                      [class.info]="record()?.status === 'justificada'">
                  {{ getStatusLabel(record()?.status ?? '') }}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div class="hr-page-actions">
          <button class="hr-btn" [routerLink]="['/asistencia']" [queryParams]="{ date: selectedDate() }">
            Cancelar
          </button>
          <button class="hr-btn hr-btn-primary" [disabled]="isSaving()" (click)="saveChanges()">
            <span *ngIf="!isSaving()">Guardar Cambios</span>
            <span *ngIf="isSaving()">Guardando...</span>
          </button>
        </div>
      </div>

      <!-- Tab Selector -->
      <div class="hr-tabs">
        <button *ngFor="let t of TABS" class="hr-tab" [class.active]="activeTab() === t.id" (click)="activeTab.set(t.id)">
          {{ t.label }}
        </button>
      </div>

      <!-- Tab Content Area -->
      <div>
        
        <!-- Tab 1: Registros de QR -->
        <div *ngIf="activeTab() === 'qr_evidence'" class="hr-detail-grid">
          <div class="hr-card" style="grid-column: span 2;">
            <div class="hr-card-header">
              <div>
                <h3 class="hr-card-title">Evidencia Fotográfica de Credencial QR</h3>
                <div class="hr-card-sub">
                  Check-in de fotocheck físico realizado en portería
                </div>
              </div>
            </div>
            <div class="hr-card-body">
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
                  
                <!-- Clock-In Photo / Map -->
                <div style="background: var(--surface-2); border: 1px dashed var(--border-strong); border-radius: 12px; padding: 16px; text-align: center;">
                  <span style="display: block; font-size: 12px; font-weight: 700; text-transform: uppercase; color: var(--accent); margin-bottom: 12px;">Ingreso (Entrada)</span>
                  
                  <div class="hr-mode-toggle" style="margin: 0 auto 16px; max-width: 250px;">
                    <button class="hr-mode-tab" [class.active]="viewIn() === 'map'" (click)="viewIn.set('map')" style="padding: 6px 12px; font-size: 12px;">🗺️ Mapa</button>
                    <button class="hr-mode-tab" [class.active]="viewIn() === 'photo'" (click)="viewIn.set('photo')" style="padding: 6px 12px; font-size: 12px;">📷 QR</button>
                  </div>

                  <!-- MAP VIEW -->
                  <div *ngIf="viewIn() === 'map'">
                    <iframe *ngIf="record()?.latitude && record()?.longitude"
                            [src]="getMapUrl(record()?.latitude, record()?.longitude)"
                            width="100%" height="260" style="border:0; border-radius: 8px; border: 1px solid var(--border);" allowfullscreen="" loading="lazy">
                    </iframe>
                    <div *ngIf="!record()?.latitude || !record()?.longitude" style="height: 260px; display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--text-soft); font-size: 13px; gap: 12px;">
                      <span>📍 Sin Ubicación Registrada en Entrada</span>
                    </div>
                  </div>

                  <!-- PHOTO VIEW -->
                  <div *ngIf="viewIn() === 'photo'">
                    <img *ngIf="getPhotoUrl(record()?.photoInPath) as url" 
                         [src]="url" 
                         style="width: 100%; height: 260px; object-fit: cover; border-radius: 8px; border: 1px solid var(--border);"
                         alt="Foto Credencial Entrada"/>
                    
                    <div *ngIf="!record()?.photoInPath" style="height: 260px; display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--text-soft); font-size: 13px; gap: 12px;">
                      <span>Sin Foto de Credencial en Entrada</span>
                    </div>
                  </div>
                </div>

                <!-- Clock-Out Photo / Map -->
                <div style="background: var(--surface-2); border: 1px dashed var(--border-strong); border-radius: 12px; padding: 16px; text-align: center;">
                  <span style="display: block; font-size: 12px; font-weight: 700; text-transform: uppercase; color: var(--accent); margin-bottom: 12px;">Egreso (Salida)</span>
                  
                  <div class="hr-mode-toggle" style="margin: 0 auto 16px; max-width: 250px;">
                    <button class="hr-mode-tab" [class.active]="viewOut() === 'map'" (click)="viewOut.set('map')" style="padding: 6px 12px; font-size: 12px;">🗺️ Mapa</button>
                    <button class="hr-mode-tab" [class.active]="viewOut() === 'photo'" (click)="viewOut.set('photo')" style="padding: 6px 12px; font-size: 12px;">📷 QR</button>
                  </div>

                  <!-- MAP VIEW -->
                  <div *ngIf="viewOut() === 'map'">
                    <iframe *ngIf="record()?.latitude && record()?.longitude"
                            [src]="getMapUrl(record()?.latitude, record()?.longitude)"
                            width="100%" height="260" style="border:0; border-radius: 8px; border: 1px solid var(--border);" allowfullscreen="" loading="lazy">
                    </iframe>
                    <div *ngIf="!record()?.latitude || !record()?.longitude" style="height: 260px; display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--text-soft); font-size: 13px; gap: 12px;">
                      <span>📍 Sin Ubicación Registrada en Salida</span>
                    </div>
                  </div>

                  <!-- PHOTO VIEW -->
                  <div *ngIf="viewOut() === 'photo'">
                    <img *ngIf="getPhotoUrl(record()?.photoOutPath) as url" 
                         [src]="url" 
                         style="width: 100%; height: 260px; object-fit: cover; border-radius: 8px; border: 1px solid var(--border);"
                         alt="Foto Credencial Salida"/>
                    
                    <div *ngIf="!record()?.photoOutPath" style="height: 260px; display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--text-soft); font-size: 13px; gap: 12px;">
                      <span>Sin Foto de Credencial en Salida</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>

        <!-- Tab 2: Gestión de horarios -->
        <div *ngIf="activeTab() === 'horarios'" class="hr-detail-grid">
          <div class="hr-card" style="grid-column: span 2;">
            <div class="hr-card-header">
              <div>
                <h3 class="hr-card-title">Gestión de Marcación Diaria</h3>
                <div class="hr-card-sub">
                  Ajuste y control del horario del colaborador
                </div>
              </div>
            </div>
            <div class="hr-card-body hr-vstack" style="gap: 20px; max-width: 600px; margin: 0 auto; padding: 20px 0;">
              <div class="hr-form-row cols-2" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                <div class="hr-field">
                  <label for="formClockIn">Hora de Entrada (Ingreso):</label>
                  <input id="formClockIn" type="text" placeholder="HH:MM" 
                         [ngModel]="editClockIn()" (ngModelChange)="editClockIn.set($event)"/>
                </div>

                <div class="hr-field">
                  <label for="formClockOut">Hora de Salida (Egreso):</label>
                  <input id="formClockOut" type="text" placeholder="HH:MM" 
                         [ngModel]="editClockOut()" (ngModelChange)="editClockOut.set($event)"/>
                </div>
              </div>

              <div class="hr-field">
                <label for="formStatus">Estado de Marcación:</label>
                <select id="formStatus" [ngModel]="editStatus()" (ngModelChange)="editStatus.set($event)">
                  <option value="a tiempo">A tiempo</option>
                  <option value="tarde">Tarde</option>
                  <option value="ausente">Ausente</option>
                  <option value="justificada">Justificada</option>
                </select>
              </div>

              <!-- Jornada Info Summary -->
              <div style="background: var(--info-soft); border: 1px solid var(--info); padding: 16px; border-radius: 8px; margin-top: 10px; color: var(--text);">
                <h4 style="margin: 0 0 8px 0; font-size: 14px; color: var(--info); font-weight: 600;">Resumen de Jornada Ordinaria</h4>
                <dl class="hr-kv" style="grid-template-columns: 180px 1fr; gap: 8px;">
                  <dt>Fecha de Control:</dt>
                  <dd>{{ selectedDate() | date:'dd/MM/yyyy' }}</dd>
                  <dt>Horas Laboradas:</dt>
                  <dd>{{ record()?.hours !== null ? record()?.hours + ' horas' : '0.0 horas' }}</dd>
                  <dt>Origen de Registro:</dt>
                  <dd>{{ record()?.origin || 'Control Administrativo' }}</dd>
                  <dt>Jornada Legal Máxima:</dt>
                  <dd>8 horas diarias / 48 horas semanales (Constitución Política y D. Leg. 728)</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <!-- Tab 3: Justificaciones -->
        <div *ngIf="activeTab() === 'justificaciones'" class="hr-detail-grid">
          <div class="hr-card" style="grid-column: span 2;">
            <div class="hr-card-header">
              <div>
                <h3 class="hr-card-title">Gestión de Justificaciones y Licencias</h3>
                <div class="hr-card-sub">
                  Justificación de inasistencias y tardanzas
                </div>
              </div>
            </div>
            <div class="hr-card-body hr-vstack" style="gap: 20px; max-width: 600px; margin: 0 auto; padding: 20px 0;">
              <div class="hr-field">
                <label for="formJustificationType">Tipo de Justificación / Licencia:</label>
                <select id="formJustificationType" 
                        [disabled]="editStatus() !== 'justificada' && editStatus() !== 'tarde'"
                        [ngModel]="editJustificationType()" (ngModelChange)="editJustificationType.set($event)">
                  <option value="">Selecciona tipo de justificación...</option>
                  <option value="Licencia Médica (CITT / EsSalud)">Licencia Médica (CITT / EsSalud)</option>
                  <option value="Licencia por Maternidad / Paternidad">Licencia por Maternidad / Paternidad</option>
                  <option value="Permiso con Goce de Haber">Permiso con Goce de Haber</option>
                  <option value="Permiso sin Goce de Haber">Permiso sin Goce de Haber</option>
                  <option value="Comisión de Servicio / Trabajo de Campo">Comisión de Servicio / Trabajo de Campo</option>
                  <option value="Suspensión Disciplinaria">Suspensión Disciplinaria</option>
                  <option value="Otros (Motivos Particulares)">Otros (Motivos Particulares)</option>
                </select>
              </div>

              <div class="hr-field">
                <label for="formJustificationNotes">Notas y Sustento de Gestión Laboral:</label>
                <textarea id="formJustificationNotes" 
                          style="min-height: 120px; resize: vertical;"
                          [disabled]="editStatus() !== 'justificada' && editStatus() !== 'tarde'"
                          placeholder="Ingresa los detalles, número de descanso médico (CITT) o justificación legal correspondiente..."
                          [ngModel]="editJustificationNotes()" (ngModelChange)="editJustificationNotes.set($event)"></textarea>
              </div>
              
              <div *ngIf="editStatus() !== 'justificada' && editStatus() !== 'tarde'" style="padding: 12px; background: var(--danger-soft); border: 1px solid var(--danger); border-radius: 8px; font-size: 13px; color: var(--danger);">
                ⚠️ El estado de marcación debe ser <b>Justificada</b> o <b>Tarde</b> para poder registrar un motivo de justificación legal o licencia.
              </div>
            </div>
          </div>
        </div>

        <!-- Tab 4: Vacaciones -->
        <div *ngIf="activeTab() === 'vacaciones'" class="hr-detail-grid" style="display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 24px;">
          <!-- Vacation Status -->
          <div class="hr-card">
            <div class="hr-card-header">
              <div>
                <h3 class="hr-card-title">Saldo e Historial de Vacaciones</h3>
                <div class="hr-card-sub">
                  Derecho de descanso anual acumulado (D. Leg. N° 728)
                </div>
              </div>
            </div>
            <div class="hr-card-body hr-vstack" style="gap: 20px;">
              <!-- Vacation Progress -->
              <div style="background: var(--surface-2); padding: 20px; border-radius: 12px; border: 1px solid var(--border);">
                <div class="hr-hstack" style="justify-content: space-between; margin-bottom: 8px;">
                  <span style="font-weight: 600; font-size: 15px; color: var(--text);">Días Gozados / Pendientes</span>
                  <span class="hr-mono" style="font-weight: 700; color: var(--success);">18 / 30 días</span>
                </div>
                <div style="background: var(--surface-3); height: 10px; border-radius: 5px; overflow: hidden; display: flex; width: 100%;">
                  <div style="background: var(--success); width: 60%; height: 100%;"></div>
                </div>
                <div class="hr-hstack" style="justify-content: space-between; margin-top: 10px; font-size: 12px; color: var(--text-soft);">
                  <span>Consumido: 18 días</span>
                  <span>Saldo disponible: 12 días</span>
                </div>
              </div>

              <!-- Vacation Table Mock -->
              <div>
                <h4 style="margin: 0 0 10px 0; font-size: 14px; color: var(--text); font-weight: 600;">Periodos Gozados en el Año</h4>
                <table class="hr-tbl" style="width: 100%; border-collapse: collapse; font-size: 13px;">
                  <thead>
                    <tr style="border-bottom: 1px solid var(--border); text-align: left;">
                      <th style="padding: 8px 0; color: var(--text-soft);">Periodo</th>
                      <th style="padding: 8px 0; color: var(--text-soft);">Días</th>
                      <th style="padding: 8px 0; color: var(--text-soft);">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style="border-bottom: 1px solid var(--border);">
                      <td style="padding: 10px 0;">15/01/2026 al 30/01/2026</td>
                      <td style="padding: 10px 0;" class="hr-mono">15 días</td>
                      <td style="padding: 10px 0;"><span class="hr-badge success no-dot" style="font-size: 10px; padding: 2px 6px;">Gozado</span></td>
                    </tr>
                    <tr style="border-bottom: 1px solid var(--border);">
                      <td style="padding: 10px 0;">01/05/2026 al 03/05/2026</td>
                      <td style="padding: 10px 0;" class="hr-mono">3 días</td>
                      <td style="padding: 10px 0;"><span class="hr-badge success no-dot" style="font-size: 10px; padding: 2px 6px;">Gozado</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- Vacation Legal Frame -->
          <div class="hr-card" style="background: var(--success-soft); border: 1px solid var(--success);">
            <div class="hr-card-header" style="border-bottom-color: var(--success);">
              <h3 class="hr-card-title" style="color: var(--success);">Normativa Legal Vacacional</h3>
            </div>
            <div class="hr-card-body hr-vstack" style="gap: 12px; font-size: 13px; color: var(--success); line-height: 1.4;">
              <p style="margin: 0;">
                De acuerdo con el <b>D. Leg. N° 728</b> y el <b>Decreto Legislativo N° 1405</b>, los colaboradores del régimen de la actividad privada tienen derecho a <b>30 días calendario</b> de descanso vacacional por cada año completo de servicios, sujeto al cumplimiento del récord vacacional.
              </p>
              <p style="margin: 0; font-weight: 500;">
                📌 <b>Fraccionamiento:</b> Se puede pactar el fraccionamiento del descanso vacacional, de los cuales una de las partes no debe ser menor a 15 días calendario (gozado en periodos de 7 y 8 días ininterrumpidos), y el resto puede ser gozado en periodos menores de 7 días.
              </p>
              <p style="margin: 0;">
                ⚠️ <b>Indemnización Vacacional:</b> Si el colaborador no goza de su descanso anual dentro del año siguiente al que adquirió el derecho, la empresa deberá abonar una indemnización equivalente a una remuneración por el descanso no gozado (triple vacacional).
              </p>
            </div>
          </div>
        </div>

        <!-- Tab 5: Permisos -->
        <div *ngIf="activeTab() === 'permisos'" class="hr-detail-grid" style="display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 24px;">
          <!-- Permissions List -->
          <div class="hr-card">
            <div class="hr-card-header">
              <div>
                <h3 class="hr-card-title">Permisos del Colaborador</h3>
                <div class="hr-card-sub">
                  Historial de autorizaciones y licencias temporales durante la jornada
                </div>
              </div>
            </div>
            <div class="hr-card-body">
              <table class="hr-tbl" style="width: 100%; border-collapse: collapse; font-size: 13px;">
                <thead>
                  <tr style="border-bottom: 1px solid var(--border); text-align: left;">
                    <th style="padding: 8px 0; color: var(--text-soft);">Fecha</th>
                    <th style="padding: 8px 0; color: var(--text-soft);">Tipo</th>
                    <th style="padding: 8px 0; color: var(--text-soft);">Duración</th>
                    <th style="padding: 8px 0; color: var(--text-soft);">Sustento</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style="border-bottom: 1px solid var(--border);">
                    <td style="padding: 10px 0;">12/05/2026</td>
                    <td style="padding: 10px 0;">Permiso Médico (Cita)</td>
                    <td style="padding: 10px 0;" class="hr-mono">3 horas (Con Goce)</td>
                    <td style="padding: 10px 0; color: var(--text-soft);">Cita Essalud Hospital Rebagliati</td>
                  </tr>
                  <tr style="border-bottom: 1px solid var(--border);">
                    <td style="padding: 10px 0;">08/04/2026</td>
                    <td style="padding: 10px 0;">Trámite Personal</td>
                    <td style="padding: 10px 0;" class="hr-mono">4 horas (Sin Goce)</td>
                    <td style="padding: 10px 0; color: var(--text-soft);">Firma de escritura notarial</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Permission Rules Card -->
          <div class="hr-card" style="background: var(--info-soft); border: 1px solid var(--info);">
            <div class="hr-card-header" style="border-bottom-color: var(--info);">
              <h3 class="hr-card-title" style="color: var(--info);">Gestión de Permisos</h3>
            </div>
            <div class="hr-card-body hr-vstack" style="gap: 12px; font-size: 13px; color: var(--info); line-height: 1.4;">
              <p style="margin: 0;">
                Los permisos representan ausencias temporales dentro de la jornada de trabajo. La legislación peruana contempla:
              </p>
              <ul style="margin: 0; padding-left: 20px;">
                <li><b>Permisos con Goce de Haber:</b> Por ley (Citas médicas prenatales, licencias sindicales, fallecimiento de familiares directos, etc.) o por política interna (estudios, cumpleaños). No generan descuento salarial.</li>
                <li style="margin-top: 6px;"><b>Permisos sin Goce de Haber:</b> Requieren aprobación mutua. El empleador está facultado para realizar el descuento proporcional de la remuneración por el tiempo no laborado.</li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Tab 6: PFJO & Tardanzas -->
        <div *ngIf="activeTab() === 'pfjo_tardanzas'" class="hr-detail-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
          
          <!-- Left panel: Tardiness details & deductions -->
          <div class="hr-vstack" style="gap: 20px;">
            <div class="hr-card">
              <div class="hr-card-header">
                <div>
                  <h3 class="hr-card-title">Panel de Control de Tardanzas</h3>
                  <div class="hr-card-sub">
                    Descuento proporcional conforme al TUO D. Leg. N° 728
                  </div>
                </div>
              </div>
              <div class="hr-card-body hr-vstack" style="gap: 16px;">
                <dl class="hr-kv" style="grid-template-columns: 180px 1fr; gap: 8px;">
                  <dt>Hora de Ingreso Real:</dt>
                  <dd class="hr-mono" style="font-weight: 600;">{{ record()?.clockIn || '—' }}</dd>
                  
                  <dt>Hora de Ingreso Límite:</dt>
                  <dd class="hr-mono">09:00</dd>
                  
                  <dt>Minutos de Tardanza:</dt>
                  <dd class="hr-mono" style="font-weight: 700; color: var(--warning);">{{ getMinutesLate() }} min</dd>
                  
                  <dt>Remuneración Básica:</dt>
                  <dd class="hr-mono">S/ {{ employee()?.basicSalary | number:'1.2-2' }}</dd>
                  
                  <dt>Descuento Estimado:</dt>
                  <dd class="hr-mono" style="font-weight: 700; color: var(--danger); font-size: 16px;">S/ {{ getDeductionAmount() | number:'1.2-2' }}</dd>
                </dl>

                <div *ngIf="getMinutesLate() > 0" style="padding: 12px; background: var(--danger-soft); border: 1px solid var(--danger); border-radius: 8px; font-size: 12.5px; color: var(--danger); line-height: 1.4;">
                  ⚠️ <b>Cálculo de Descuento:</b> La remuneración diaria se prorratea por día (30 días), horas de jornada ordinaria (8 horas) y minutos (60 minutos). 
                  Deducción por minuto: <b>S/ {{ ((employee()?.basicSalary || 0) / 30 / 8 / 60) | number:'1.4-4' }}</b>.
                </div>

                <!-- RIT Section -->
                <div style="background: var(--surface-2); border: 1px solid var(--border); padding: 14px; border-radius: 8px; margin-top: 10px;">
                  <h4 style="margin: 0 0 10px 0; font-size: 13px; color: var(--text); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Reglamento Interno de Trabajo (RIT)</h4>
                  
                  <div class="hr-vstack" style="gap: 8px; font-size: 12px; color: var(--text-soft);">
                    <div class="hr-hstack" style="justify-content: space-between;">
                      <span>Tolerancia diaria máxima:</span>
                      <span style="font-weight: 600;">15 minutos</span>
                    </div>
                    
                    <div *ngIf="getMinutesLate() > 15" style="padding: 10px; background: var(--warning-soft); border: 1px solid var(--warning); border-radius: 6px; color: oklch(0.5 0.15 70); line-height: 1.4;">
                      🚨 <b>Infracción RIT Detectada:</b> El colaborador superó la tolerancia de 15 minutos (Tardanza de {{ getMinutesLate() }} min). Aplica sanción disciplinaria de **Amonestación Escrita** según reincidencia.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Right panel: Overtime / PFJO details -->
          <div class="hr-vstack" style="gap: 20px;">
            <div class="hr-card">
              <div class="hr-card-header">
                <div>
                  <h3 class="hr-card-title">Panel de Control PFJO (Horas Extras)</h3>
                  <div class="hr-card-sub">
                    Permanencia Fuera de la Jornada Ordinaria (PFJO)
                  </div>
                </div>
              </div>
              <div class="hr-card-body hr-vstack" style="gap: 16px;">
                <dl class="hr-kv" style="grid-template-columns: 180px 1fr; gap: 8px;">
                  <dt>Horas Totales Trabajadas:</dt>
                  <dd class="hr-mono" style="font-weight: 600;">{{ record()?.hours !== null ? record()?.hours : '0.0' }} h</dd>
                  
                  <dt>Jornada Ordinaria:</dt>
                  <dd class="hr-mono">8.0 h</dd>
                  
                  <dt>Horas Extras (PFJO):</dt>
                  <dd class="hr-mono" style="font-weight: 700; color: var(--success);">{{ getOvertimeHours() | number:'1.1-1' }} h</dd>
                  
                  <dt>Tasa de Sobretasa:</dt>
                  <dd class="hr-mono">+25% (primeras 2h), +35% (restantes)</dd>
                  
                  <dt>Pago de Horas Extras:</dt>
                  <dd class="hr-mono" style="font-weight: 700; color: var(--accent); font-size: 16px;">S/ {{ getOvertimePay() | number:'1.2-2' }}</dd>
                </dl>

                <div *ngIf="getOvertimeHours() > 0" style="padding: 12px; background: var(--accent-soft); border: 1px solid var(--accent); border-radius: 8px; font-size: 12.5px; color: var(--accent); line-height: 1.4;">
                  🚀 <b>Cálculo de Horas Extras:</b> Conforme al TUO de la Ley de Jornada de Trabajo, las horas extras se pagan con una sobretasa del 25% por las dos primeras horas y 35% por las siguientes.
                </div>

                <!-- RIT Sanctions Progression -->
                <div style="background: var(--surface-2); border: 1px solid var(--border); padding: 14px; border-radius: 8px; margin-top: 10px;">
                  <h4 style="margin: 0 0 10px 0; font-size: 13px; color: var(--text); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Progreso de Sanciones Disciplinarias</h4>
                  <div class="hr-vstack" style="gap: 8px; font-size: 12px;">
                    <div style="display: flex; align-items: center; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid var(--border);">
                      <span style="color: var(--text-soft);">1° Tardanza Reincidente:</span>
                      <span class="hr-badge no-dot neutral" style="font-size: 10px; padding: 2px 6px;">Amonestación Verbal</span>
                    </div>
                    <div style="display: flex; align-items: center; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid var(--border);">
                      <span style="color: var(--text-soft);">Tardanza > 15 min o 2° Reincidencia:</span>
                      <span class="hr-badge warning no-dot" style="font-size: 10px; padding: 2px 6px;">Amonestación Escrita</span>
                    </div>
                    <div style="display: flex; align-items: center; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid var(--border);">
                      <span style="color: var(--text-soft);">3° Reincidencia o Faltas:</span>
                      <span class="hr-badge danger no-dot" style="font-size: 10px; padding: 2px 6px;">Suspensión 1 a 3 días</span>
                    </div>
                    <div style="display: flex; align-items: center; justify-content: space-between; padding: 6px 0;">
                      <span style="color: var(--text-soft);">Impuntualidad Reiterada Persistente:</span>
                      <span class="hr-badge danger no-dot" style="font-size: 10px; padding: 2px 6px;">Despido Justificado (Art. 25-h)</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  `
})
export class AttendanceDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly attendanceService = inject(AttendanceService);
  private readonly employeeService = inject(EmployeeService);

  readonly employeeId = signal<string>('');
  readonly selectedDate = signal<string>('');
  readonly record = signal<AttendanceRecord | null>(null);
  readonly employee = signal<Employee | null>(null);
  
  readonly loading = signal<boolean>(true);
  readonly isSaving = signal<boolean>(false);

  // Form states
  readonly editStatus = signal<string>('');
  readonly editClockIn = signal<string>('');
  readonly editClockOut = signal<string>('');
  readonly editJustificationType = signal<string>('');
  readonly editJustificationNotes = signal<string>('');

  readonly activeTab = signal<string>('qr_evidence');
  readonly TABS = [
    { id: 'qr_evidence', label: 'Registros de QR' },
    { id: 'horarios', label: 'Gestión de horarios' },
    { id: 'justificaciones', label: 'Justificaciones' },
    { id: 'vacaciones', label: 'Vacaciones' },
    { id: 'permisos', label: 'Permisos' },
    { id: 'pfjo_tardanzas', label: 'PFJO & Tardanzas' }
  ];

  readonly viewIn = signal<'map'|'photo'>('map');
  readonly viewOut = signal<'map'|'photo'>('map');

  private readonly sanitizer = inject(DomSanitizer);

  getMapUrl(lat?: number, lng?: number): SafeResourceUrl | null {
    if (!lat || !lng) return null;
    const url = `https://maps.google.com/maps?q=${lat},${lng}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  ngOnInit(): void {
    const params = this.route.snapshot.params;
    const qparams = this.route.snapshot.queryParams;

    this.employeeId.set(params['employeeId'] || '');
    this.selectedDate.set(qparams['date'] || new Date().toISOString().split('T')[0]);

    this.loadRecord();
  }

  async loadRecord(): Promise<void> {
    this.loading.set(true);
    try {
      // Load full employee details first
      const empRes = await this.employeeService.getEmployee(this.employeeId());
      this.employee.set(empRes.data);
      const emp = empRes.data;

      const response = await this.attendanceService.getAttendance(this.selectedDate());
      const rec = response.records.find(r => r.employeeId === this.employeeId());
      if (rec) {
        this.record.set(rec);
        
        // Populate form states
        this.editStatus.set(rec.status);
        this.editClockIn.set(rec.clockIn || '09:00');
        this.editClockOut.set(rec.clockOut || '');
        this.editJustificationType.set(rec.justificationType || '');
        this.editJustificationNotes.set(rec.justificationNotes || '');
      } else {
        // Construct dummy absent record
        const dummyRec: AttendanceRecord = {
          id: null,
          employeeId: emp.id,
          employee: {
            dni: emp.dni,
            fullName: `${emp.firstName} ${emp.lastName}`,
            position: emp.position,
            department: emp.department
          },
          date: this.selectedDate(),
          clockIn: null,
          clockOut: null,
          hours: null,
          status: 'ausente',
          origin: '-'
        };
        this.record.set(dummyRec);
        
        this.editStatus.set('ausente');
        this.editClockIn.set('09:00');
        this.editClockOut.set('');
        this.editJustificationType.set('');
        this.editJustificationNotes.set('');
      }
    } catch (err) {
      console.error('Error loading attendance details:', err);
    } finally {
      this.loading.set(false);
    }
  }

  getPhotoUrl(path?: string | null): string | null {
    if (!path) return null;
    const backendBaseUrl = environment.apiUrl.replace('/api/v1', '');
    return `${backendBaseUrl}/${path}`;
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

  getMinutesLate(): number {
    const rec = this.record();
    if (!rec || !rec.clockIn || rec.status !== 'tarde') return 0;
    const [h, m] = rec.clockIn.split(':').map(Number);
    const entryMinutes = h * 60 + m;
    const standardMinutes = 9 * 60; // 09:00
    return Math.max(0, entryMinutes - standardMinutes);
  }

  getDeductionAmount(): number {
    const salary = this.employee()?.basicSalary || 0;
    if (salary === 0) return 0;
    const mins = this.getMinutesLate();
    if (mins === 0) return 0;
    const minuteRate = (salary / 30) / 8 / 60;
    return Number((minuteRate * mins).toFixed(2));
  }

  getOvertimeHours(): number {
    const rec = this.record();
    if (!rec || rec.hours === null) return 0;
    return Math.max(0, rec.hours - 8);
  }

  getOvertimePay(): number {
    const salary = this.employee()?.basicSalary || 0;
    if (salary === 0) return 0;
    const ot = this.getOvertimeHours();
    if (ot === 0) return 0;
    const hourlyRate = (salary / 30) / 8;
    
    const first2 = Math.min(2, ot);
    const rest = Math.max(0, ot - 2);
    
    const payFirst2 = first2 * hourlyRate * 1.25;
    const payRest = rest * hourlyRate * 1.35;
    
    return Number((payFirst2 + payRest).toFixed(2));
  }

  async saveChanges(): Promise<void> {
    const rec = this.record();
    if (!rec) return;

    this.isSaving.set(true);
    try {
      const idOrEmployeeId = rec.id || rec.employeeId;
      const payload: any = {
        status: this.editStatus(),
        clockIn: this.editClockIn(),
        clockOut: this.editClockOut() || null,
        justificationType: this.editJustificationType() || null,
        justificationNotes: this.editJustificationNotes() || null,
      };

      if (!rec.id) {
        payload.employeeId = rec.employeeId;
        payload.date = this.selectedDate();
      }

      await this.attendanceService.updateAttendance(idOrEmployeeId, payload);
      
      alert('Marcación guardada exitosamente.');
      this.router.navigate(['/asistencia'], { queryParams: { date: this.selectedDate() } });
    } catch (err: any) {
      console.error('Error updating attendance:', err);
      alert(err.error?.error || err.error?.message || 'Error al guardar los cambios.');
    } finally {
      this.isSaving.set(false);
    }
  }
}
