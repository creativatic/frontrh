import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { EmployeeService } from '../../../shared/services/employee.service';
import { Employee, Contract } from '../../../shared/models/hr.models';
import { HrCurrencyPipe } from '../../../shared/pipes/hr-currency.pipe';
import { PeDatePipe } from '../../../shared/pipes/pe-date.pipe';
import { CustomValidators } from '../../../shared/validators/custom-validators';
import { environment } from '../../../../environments/environment';
import { ContractService } from '../../../shared/services/contract.service';

@Component({
    selector: 'app-employee-detail',
    standalone: true,
    imports: [CommonModule, RouterModule, ReactiveFormsModule, HrCurrencyPipe, PeDatePipe],
    template: `
        <div *ngIf="loading()" style="display: flex; justify-content: center; align-items: center; height: 300px;" class="hr-soft">
            Cargando ficha del colaborador...
        </div>

        <div *ngIf="!loading() && employee()">
            <!-- Page Header -->
            <div class="hr-page-header" style="margin-bottom: 16px;">
                <div>
                    <div class="crumb" style="margin-bottom: 8px;">
                        <a routerLink="/colaboradores" style="cursor: pointer; color: var(--accent); font-weight: 500;">← Colaboradores</a>
                    </div>
                    <div class="hr-hstack" style="gap: 16px;">
                        <span class="hr-emp-avatar" [style.background]="getAvatarColor(employee()?.fullName)" style="width: 60px; height: 60px; font-size: 18px;">
                            {{ getInitials(employee()?.fullName) }}
                        </span>
                        <div>
                            <h1 class="hr-page-title">{{ employee()?.fullName }}</h1>
                            <div class="hr-hstack" style="margin-top: 6px;">
                                <span class="hr-soft" style="font-size: 13.5px;">
                                    {{ employee()?.position }} · {{ employee()?.department }}
                                </span>
                                <span class="hr-muted">·</span>
                                <span class="hr-mono" style="font-size: 12.5px; color: var(--text-soft);">
                                    DNI {{ employee()?.dni }}
                                </span>
                                <span class="hr-badge" [class.success]="getComputedStatus() === 'Vigente'" [class.warning]="getComputedStatus() === 'Por vencer'" [class.danger]="getComputedStatus() === 'Vencido'">
                                    {{ getComputedStatus() }}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="hr-page-actions">
                    <button class="hr-btn" (click)="sendMessage()">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                            <rect x="3" y="5" width="18" height="14" rx="2"/>
                            <path d="m3 7 9 6 9-6"/>
                        </svg>
                        Enviar mensaje
                    </button>
                    <button class="hr-btn" (click)="downloadContract()">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
                            <polyline points="14 3 14 9 20 9"/>
                        </svg>
                        Generar PDF
                    </button>
                    <button *ngIf="!editing()" class="hr-btn hr-btn-primary" (click)="startEdit()">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                        Editar
                    </button>
                    <button *ngIf="editing()" class="hr-btn hr-btn-primary" (click)="saveChanges()" [disabled]="form.invalid">
                        Guardar
                    </button>
                    <button *ngIf="editing()" class="hr-btn" (click)="cancelEdit()">
                        Cancelar
                    </button>
                </div>
            </div>

            <!-- Tab Selector -->
            <div class="hr-tabs">
                <button *ngFor="let t of TABS" class="hr-tab" [class.active]="activeTab() === t.id" (click)="setActiveTab(t.id)">
                    {{ t.label }}
                </button>
            </div>

            <!-- TAB CONTENT -->
            <div [formGroup]="form">
                
                <!-- 1. RESUMEN TAB -->
                <div *ngIf="activeTab() === 'resumen'" class="hr-detail-grid">
                    <div class="hr-vstack" style="gap: 16px;">
                        <!-- Contacto Card -->
                        <div class="hr-card">
                            <div class="hr-card-header"><h3 class="hr-card-title">Contacto</h3></div>
                            <div class="hr-card-body hr-vstack" style="gap: 12px;">
                                <div class="hr-hstack">
                                    <span class="hr-muted">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                                            <rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>
                                        </svg>
                                    </span>
                                    <span style="font-size: 13px;">{{ employee()?.email }}</span>
                                </div>
                                <div class="hr-hstack">
                                    <span class="hr-muted">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                                            <path d="M22 16.5v3a2 2 0 0 1-2.2 2 19.7 19.7 0 0 1-8.6-3 19 19 0 0 1-6-6 19.7 19.7 0 0 1-3-8.7A2 2 0 0 1 4.2 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.7a2 2 0 0 1-.5 2L8 9.5a16 16 0 0 0 6 6l1.1-1.3a2 2 0 0 1 2-.5c.9.3 1.8.5 2.7.6A2 2 0 0 1 22 16.5Z"/>
                                        </svg>
                                    </span>
                                    <span style="font-size: 13px;">{{ employee()?.phone }}</span>
                                </div>
                                <div class="hr-hstack">
                                    <span class="hr-muted">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                                            <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z"/>
                                            <circle cx="12" cy="10" r="3"/>
                                        </svg>
                                    </span>
                                    <span style="font-size: 13px;">{{ employee()?.district }}, {{ employee()?.province }}</span>
                                </div>
                                <div class="hr-hstack">
                                    <span class="hr-muted">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                                            <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M2 13h20"/>
                                        </svg>
                                    </span>
                                    <span style="font-size: 13px;">{{ employee()?.department }}</span>
                                </div>
                            </div>
                        </div>

                        <!-- Datos Rápidos Card -->
                        <div class="hr-card">
                            <div class="hr-card-header"><h3 class="hr-card-title">Datos rápidos</h3></div>
                            <div class="hr-card-body">
                                <dl class="hr-kv">
                                    <dt>Sexo</dt><dd>{{ employee()?.gender }}</dd>
                                    <dt>Estado civil</dt><dd>{{ employee()?.civilStatus }}</dd>
                                    <dt>N° de hijos</dt><dd class="hr-mono">{{ employee()?.childrenCount }}</dd>
                                    <dt>Tipo de sangre</dt><dd class="hr-mono">{{ employee()?.bloodType }}</dd>
                                    <dt>Asig. familiar</dt>
                                    <dd>
                                        <span class="hr-badge success" *ngIf="employee()?.hasFamilyAllowance">Sí aplica</span>
                                        <span class="hr-badge neutral" *ngIf="!employee()?.hasFamilyAllowance">No</span>
                                    </dd>
                                </dl>
                            </div>
                        </div>

                        <!-- Credencial QR Card -->
                        <div class="hr-card" *ngIf="employee()?.qrCodeToken">
                            <div class="hr-card-header">
                                <h3 class="hr-card-title">Credencial de Asistencia QR</h3>
                            </div>
                            <div class="hr-card-body hr-vstack" style="gap: 16px; align-items: center; text-align: center;">
                                <div style="background: white; padding: 12px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); display: inline-block;">
                                    <img [src]="'https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=' + employee()?.qrCodeToken" 
                                         alt="Código QR del colaborador" 
                                         style="display: block; width: 180px; height: 180px; border-radius: 4px;" />
                                </div>
                                <div>
                                    <div class="hr-soft" style="font-size: 12px; font-family: monospace; word-break: break-all;">
                                        Token: {{ employee()?.qrCodeToken }}
                                    </div>
                                    <p class="hr-soft" style="font-size: 13px; margin: 8px 0 0 0;">
                                        Este código QR es único. El colaborador puede usarlo para marcar su asistencia en el lector QR de seguridad.
                                    </p>
                                </div>
                                <button type="button" class="hr-btn hr-btn-outline hr-btn-sm" style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 6px;" (click)="downloadQrCode()">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                        <polyline points="7 10 12 15 17 10"/>
                                        <line x1="12" y1="15" x2="12" y2="3"/>
                                    </svg>
                                    Descargar QR / Imprimir
                                </button>
                            </div>
                        </div>
                    </div>

                    <div class="hr-vstack" style="gap: 16px;">
                        <!-- Contrato Vigente Card -->
                        <div class="hr-card">
                            <div class="hr-card-header">
                                <div>
                                    <h3 class="hr-card-title">Contrato vigente</h3>
                                    <div class="hr-card-sub">
                                        {{ employee()?.activeContract?.nature ?? 'Indeterminado' }}
                                        {{ employee()?.activeContract?.modality ? ' · ' + employee()?.activeContract?.modality : '' }}
                                    </div>
                                </div>
                                <button type="button" *ngIf="getComputedStatus() === 'Por vencer'" class="hr-btn hr-btn-primary hr-btn-sm" routerLink="/contratos/nuevo">
                                    Renovar contrato
                                </button>
                            </div>
                            <div class="hr-card-body">
                                <div class="hr-form-row cols-3" style="margin-bottom: 16px;">
                                    <div>
                                        <div class="hr-soft" style="font-size: 11.5px; text-transform: uppercase; letter-spacing: 0.06em;">Inicio</div>
                                        <div class="hr-tabular" style="font-size: 18px; font-weight: 600; margin-top: 2px;">
                                            {{ employee()?.activeContract?.startDate ?? employee()?.hireDate | peDate }}
                                        </div>
                                    </div>
                                    <div>
                                        <div class="hr-soft" style="font-size: 11.5px; text-transform: uppercase; letter-spacing: 0.06em;">Término</div>
                                        <div class="hr-tabular" style="font-size: 18px; font-weight: 600; margin-top: 2px;">
                                            {{ employee()?.activeContract?.endDate ? (employee()?.activeContract?.endDate | peDate) : 'Sin fecha fin' }}
                                        </div>
                                    </div>
                                    <div>
                                        <div class="hr-soft" style="font-size: 11.5px; text-transform: uppercase; letter-spacing: 0.06em;">Remuneración</div>
                                        <div class="hr-tabular" style="font-size: 18px; font-weight: 600; margin-top: 2px;">
                                            {{ employee()?.activeContract?.salary ?? employee()?.basicSalary | hrCurrency }}
                                        </div>
                                    </div>
                                </div>
                                
                                <div *ngIf="getComputedStatus() === 'Por vencer'" style="padding: 12px; background: var(--warning-soft); color: oklch(0.45 0.15 70); border-radius: 8px; font-size: 13px; display: flex; gap: 10px; align-items: flex-start;">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0; margin-top: 2px;">
                                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                                        <line x1="12" y1="9" x2="12" y2="13"/><circle cx="12" cy="17" r="0.5" fill="currentColor"/>
                                    </svg>
                                    <div>
                                        <b>Atención:</b> el contrato vence en {{ getDaysRemaining(employee()?.activeContract?.endDate) }} días. Conforme a la legislación peruana, debes renovar o convertir a indeterminado antes del vencimiento.
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Tallas Card -->
                        <div class="hr-card">
                            <div class="hr-card-header"><h3 class="hr-card-title">Tallas de Uniformes / EPP</h3></div>
                            <div class="hr-card-body" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;">
                                <div>
                                    <div class="hr-soft" style="font-size: 11.5px;">Zapato</div>
                                    <div class="hr-tabular" style="font-size: 20px; font-weight: 600;">{{ employee()?.shoeSize ?? '—' }}</div>
                                </div>
                                <div>
                                    <div class="hr-soft" style="font-size: 11.5px;">Pantalón</div>
                                    <div class="hr-tabular" style="font-size: 20px; font-weight: 600;">{{ employee()?.pantsSize ?? '—' }}</div>
                                </div>
                                <div>
                                    <div class="hr-soft" style="font-size: 11.5px;">Camisa</div>
                                    <div class="hr-tabular" style="font-size: 20px; font-weight: 600;">{{ employee()?.shirtSize ?? '—' }}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 2. DATOS PERSONALES TAB -->
                <div *ngIf="activeTab() === 'datos'" class="hr-card">
                    <div class="hr-card-header"><h3 class="hr-card-title">Ficha de Datos Personales</h3></div>
                    <div class="hr-card-body">
                        <div class="hr-form-row cols-3">
                            <div class="hr-field">
                                <label>DNI</label>
                                <input formControlName="dni" [readonly]="!editing()" class="hr-mono" [style.background]="editing() ? 'none' : 'var(--surface-2)'"/>
                            </div>
                            <div class="hr-field">
                                <label>Nombres</label>
                                <input formControlName="firstName" [readonly]="!editing()" [style.background]="editing() ? 'none' : 'var(--surface-2)'"/>
                            </div>
                            <div class="hr-field">
                                <label>Apellidos</label>
                                <input formControlName="lastName" [readonly]="!editing()" [style.background]="editing() ? 'none' : 'var(--surface-2)'"/>
                            </div>
                            <div class="hr-field">
                                <label>Cargo / Puesto</label>
                                <input formControlName="position" [readonly]="!editing()" [style.background]="editing() ? 'none' : 'var(--surface-2)'"/>
                            </div>
                            <div class="hr-field">
                                <label>Celular</label>
                                <input formControlName="phone" [readonly]="!editing()" class="hr-mono" [style.background]="editing() ? 'none' : 'var(--surface-2)'"/>
                            </div>
                            <div class="hr-field">
                                <label>Correo electrónico</label>
                                <input formControlName="email" [readonly]="!editing()" [style.background]="editing() ? 'none' : 'var(--surface-2)'"/>
                            </div>
                            <div class="hr-field" style="grid-column: span 2;">
                                <label>Dirección</label>
                                <input formControlName="address" [readonly]="!editing()" [style.background]="editing() ? 'none' : 'var(--surface-2)'"/>
                            </div>
                            <div class="hr-field">
                                <label>UBIGEO</label>
                                <input formControlName="ubigeoCode" [readonly]="true" class="hr-mono" style="background: var(--surface-2)"/>
                            </div>
                            <div class="hr-field">
                                <label>Distrito</label>
                                <input formControlName="district" [readonly]="!editing()" [style.background]="editing() ? 'none' : 'var(--surface-2)'"/>
                            </div>
                            <div class="hr-field">
                                <label>Provincia</label>
                                <input formControlName="province" [readonly]="!editing()" [style.background]="editing() ? 'none' : 'var(--surface-2)'"/>
                            </div>
                            <div class="hr-field">
                                <label>Departamento</label>
                                <input formControlName="department" [readonly]="!editing()" [style.background]="editing() ? 'none' : 'var(--surface-2)'"/>
                            </div>
                            <div class="hr-field">
                                <label>Grado de estudio</label>
                                <input formControlName="educationLevel" [readonly]="!editing()" [style.background]="editing() ? 'none' : 'var(--surface-2)'"/>
                            </div>
                            <div class="hr-field">
                                <label>Carrera / Especialidad</label>
                                <input formControlName="professionalDegree" [readonly]="!editing()" [style.background]="editing() ? 'none' : 'var(--surface-2)'"/>
                            </div>
                            <div class="hr-field">
                                <label>Años de experiencia</label>
                                <input type="number" formControlName="yearsExperience" [readonly]="!editing()" class="hr-mono" [style.background]="editing() ? 'none' : 'var(--surface-2)'"/>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 3. CONTRATO TAB -->
                <div *ngIf="activeTab() === 'contrato'" class="hr-vstack" style="gap: 16px;">
                    <!-- Contrato Actual -->
                    <div class="hr-card">
                        <div class="hr-card-header"><h3 class="hr-card-title">Detalles del Contrato Vigente</h3></div>
                        <div class="hr-card-body">
                            <div class="hr-form-row cols-3">
                                <div class="hr-field">
                                    <label>Modalidad / Naturaleza</label>
                                    <input [value]="employee()?.activeContract?.nature ?? 'Indeterminado'" readonly style="background: var(--surface-2)"/>
                                </div>
                                <div class="hr-field">
                                    <label>Tipo Específico</label>
                                    <input [value]="employee()?.activeContract?.modality ?? '—'" readonly style="background: var(--surface-2)"/>
                                </div>
                                <div class="hr-field">
                                    <label>Fecha de Inicio</label>
                                    <input [value]="employee()?.activeContract?.startDate ?? employee()?.hireDate | peDate" readonly class="hr-mono" style="background: var(--surface-2)"/>
                                </div>
                                <div class="hr-field">
                                    <label>Fecha de Término</label>
                                    <input [value]="employee()?.activeContract?.endDate ? (employee()?.activeContract?.endDate | peDate) : 'Indefinido'" readonly class="hr-mono" style="background: var(--surface-2)"/>
                                </div>
                                <div class="hr-field">
                                    <label>Remuneración Mensual</label>
                                    <input [value]="employee()?.activeContract?.salary ?? employee()?.basicSalary | hrCurrency" readonly class="hr-mono" style="background: var(--surface-2)"/>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Historial de Contratos -->
                    <div class="hr-card">
                        <div class="hr-card-header">
                            <h3 class="hr-card-title">Historial de contratos</h3>
                            <span class="hr-muted" style="font-size: 12px;">{{ employee()?.contracts?.length ?? 1 }} registros</span>
                        </div>
                        <div class="hr-card-flush">
                            <table class="hr-tbl">
                                <thead>
                                    <tr>
                                        <th>Inicio</th>
                                        <th>Término</th>
                                        <th>Naturaleza</th>
                                        <th class="num">Remun.</th>
                                        <th>Estado</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr *ngFor="let item of employee()?.contracts">
                                        <td class="hr-mono">{{ item.startDate | peDate }}</td>
                                        <td class="hr-mono">{{ item.endDate ? (item.endDate | peDate) : 'Indefinido' }}</td>
                                        <td>{{ item.nature }} <span *ngIf="item.modality" style="font-size: 11px;" class="hr-soft">· {{ item.modality }}</span></td>
                                        <td class="num">{{ item.salary | hrCurrency }}</td>
                                        <td>
                                            <span class="hr-badge" [class.success]="item.status === 'active'" [class.neutral]="item.status !== 'active'">
                                                {{ item.status === 'active' ? 'Vigente' : 'Cerrado' }}
                                            </span>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <!-- 4. BANCO Y PENSION TAB -->
                <div *ngIf="activeTab() === 'banco'" class="hr-card">
                    <div class="hr-card-header"><h3 class="hr-card-title">Detalles de Planilla, Cuentas y AFP/ONP</h3></div>
                    <div class="hr-card-body">
                        <div class="hr-form-row cols-3">
                            <div class="hr-field">
                                <label>Entidad Bancaria</label>
                                <input formControlName="bankName" [readonly]="!editing()" [style.background]="editing() ? 'none' : 'var(--surface-2)'"/>
                            </div>
                            <div class="hr-field">
                                <label>Número de Cuenta de Haberes</label>
                                <input formControlName="bankAccount" [readonly]="!editing()" class="hr-mono" [style.background]="editing() ? 'none' : 'var(--surface-2)'"/>
                            </div>
                            <div class="hr-field">
                                <label>CCI (Código Interbancario)</label>
                                <input formControlName="cci" [readonly]="!editing()" class="hr-mono" [style.background]="editing() ? 'none' : 'var(--surface-2)'" maxLength="20"/>
                            </div>
                            <div class="hr-field">
                                <label>Sistema de Pensión</label>
                                <input formControlName="pensionSystem" [readonly]="!editing()" [style.background]="editing() ? 'none' : 'var(--surface-2)'"/>
                            </div>
                            <div class="hr-field">
                                <label>Código CUSPP (AFP)</label>
                                <input formControlName="cuspp" [readonly]="!editing()" class="hr-mono" [style.background]="editing() ? 'none' : 'var(--surface-2)'"/>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 5. DOCUMENTOS TAB -->
                <div *ngIf="activeTab() === 'documentos'" class="hr-card hr-card-flush">
                    <table class="hr-tbl">
                        <thead>
                            <tr>
                                <th>Documento</th>
                                <th>Subido por</th>
                                <th>Fecha</th>
                                <th>Tamaño</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td><strong>Contrato firmado.pdf</strong></td>
                                <td>María Q.</td>
                                <td class="hr-mono">14/03/2022</td>
                                <td class="hr-mono">482 KB</td>
                                <td class="action-cell">
                                    <button class="hr-btn hr-btn-sm" (click)="downloadContract()">Descargar</button>
                                </td>
                            </tr>
                            <tr>
                                <td><strong>Copia DNI (frontal + reverso).pdf</strong></td>
                                <td>{{ employee()?.firstName }}</td>
                                <td class="hr-mono">13/03/2022</td>
                                <td class="hr-mono">1.2 MB</td>
                                <td class="action-cell">
                                    <button class="hr-btn hr-btn-sm" (click)="dummyDownload()">Descargar</button>
                                </td>
                            </tr>
                            <tr>
                                <td><strong>Certificado de AFP / ONP.pdf</strong></td>
                                <td>{{ employee()?.firstName }}</td>
                                <td class="hr-mono">13/03/2022</td>
                                <td class="hr-mono">210 KB</td>
                                <td class="action-cell">
                                    <button class="hr-btn hr-btn-sm" (click)="dummyDownload()">Descargar</button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <!-- 6. CONTACTO DE EMERGENCIA TAB -->
                <div *ngIf="activeTab() === 'emergencia'" class="hr-card">
                    <div class="hr-card-header"><h3 class="hr-card-title">Contacto ante Incidentes</h3></div>
                    <div class="hr-card-body">
                        <div class="hr-form-row cols-2">
                            <div class="hr-field">
                                <label>Nombre Completo del Contacto</label>
                                <input formControlName="emergencyContactName" [readonly]="!editing()" [style.background]="editing() ? 'none' : 'var(--surface-2)'"/>
                            </div>
                            <div class="hr-field">
                                <label>Celular / Teléfono</label>
                                <input formControlName="emergencyContactPhone" [readonly]="!editing()" class="hr-mono" [style.background]="editing() ? 'none' : 'var(--surface-2)'"/>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 7. IDENTIFICACIÓN QR TAB -->
                <div *ngIf="activeTab() === 'qr'" class="hr-card" style="max-width: 480px; margin: 0 auto; text-align: center; padding: 32px 24px;">
                    <div class="hr-card-header" style="border: none; padding-bottom: 0;">
                        <h3 class="hr-card-title" style="font-size: 20px; font-weight: 800; margin-bottom: 8px;">Credencial de Asistencia QR</h3>
                        <p class="hr-soft" style="font-size: 13.5px; margin: 0;">Código QR único para control de accesos y asistencia.</p>
                    </div>
                    <div class="hr-card-body hr-vstack" style="gap: 20px; align-items: center; margin-top: 16px;">
                        <div style="background: white; padding: 16px; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.06); display: inline-block; border: 1px solid var(--border);">
                            <img [src]="'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' + employee()?.qrCodeToken" 
                                 alt="Código QR del colaborador" 
                                 style="display: block; width: 200px; height: 200px; border-radius: 4px;" />
                        </div>
                        <div>
                            <div style="font-family: monospace; font-size: 14px; font-weight: 700; color: var(--text-muted); word-break: break-all; background: var(--surface-2); padding: 8px 12px; border-radius: 6px; border: 1px solid var(--border);">
                                ID Token: {{ employee()?.qrCodeToken }}
                            </div>
                        </div>
                        
                        <div class="hr-divider" style="margin: 8px 0; width: 100%;"></div>

                        <button type="button" class="hr-btn hr-btn-outline" style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 6px;" (click)="downloadQrCode()">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                <polyline points="7 10 12 15 17 10"/>
                                <line x1="12" y1="15" x2="12" y2="3"/>
                            </svg>
                            Descargar Credencial QR (PNG)
                        </button>
                    </div>
                </div>

            </div>
        </div>
    `
})
export class EmployeeDetailComponent implements OnInit {
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly employeeService = inject(EmployeeService);
    private readonly contractService = inject(ContractService);
    private readonly fb = inject(FormBuilder);

    readonly employee = signal<Employee | null>(null);
    readonly loading = signal<boolean>(true);
    readonly editing = signal<boolean>(false);
    readonly activeTab = signal<string>('resumen');

    form!: FormGroup;

    readonly TABS = [
        { id: 'resumen', label: 'Resumen' },
        { id: 'datos', label: 'Datos personales' },
        { id: 'contrato', label: 'Contrato' },
        { id: 'banco', label: 'Banco y pensión' },
        { id: 'documentos', label: 'Documentos' },
        { id: 'emergencia', label: 'Contacto de emergencia' },
        { id: 'qr', label: 'Identificación QR' }
    ];

    ngOnInit(): void {
        this.initForm();
        this.loadEmployee();
    }

    initForm(): void {
        this.form = this.fb.group({
            dni: ['', [Validators.required, CustomValidators.dni()]],
            firstName: ['', Validators.required],
            lastName: ['', Validators.required],
            position: ['', Validators.required],
            phone: ['', [Validators.required, CustomValidators.phone()]],
            email: ['', [Validators.required, Validators.email]],
            address: ['', Validators.required],
            department: ['', Validators.required],
            province: ['', Validators.required],
            district: ['', Validators.required],
            ubigeoCode: ['', Validators.required],
            educationLevel: ['', Validators.required],
            professionalDegree: [''],
            yearsExperience: [0, Validators.min(0)],
            bankName: ['', Validators.required],
            bankAccount: ['', Validators.required],
            cci: [''],
            pensionSystem: ['', Validators.required],
            cuspp: [''],
            emergencyContactName: ['', Validators.required],
            emergencyContactPhone: ['', [Validators.required, CustomValidators.phone()]]
        });
    }

    async loadEmployee(): Promise<void> {
        this.loading.set(true);
        const id = this.route.snapshot.paramMap.get('id');
        if (!id) {
            void this.router.navigateByUrl('/colaboradores');
            return;
        }

        try {
            const response = await this.employeeService.getEmployee(id);
            this.employee.set(response.data);
            this.fillForm(response.data);
        } catch (err) {
            console.error('Error al cargar detalle del colaborador', err);
            void this.router.navigateByUrl('/colaboradores');
        } finally {
            this.loading.set(false);
        }
    }

    fillForm(emp: Employee): void {
        this.form.patchValue({
            dni: emp.dni,
            firstName: emp.firstName,
            lastName: emp.lastName,
            position: emp.position,
            phone: emp.phone,
            email: emp.email,
            address: emp.address,
            department: emp.department,
            province: emp.province,
            district: emp.district,
            ubigeoCode: emp.ubigeoCode,
            educationLevel: emp.educationLevel,
            professionalDegree: emp.professionalDegree || '',
            yearsExperience: emp.yearsExperience,
            bankName: emp.bankName,
            bankAccount: emp.bankAccount,
            cci: emp.cci || '',
            pensionSystem: emp.pensionSystem,
            cuspp: '', // AFP CUSPP código
            emergencyContactName: emp.emergencyContactName,
            emergencyContactPhone: emp.emergencyContactPhone
        });
    }

    setActiveTab(tabId: string): void {
        this.activeTab.set(tabId);
    }

    startEdit(): void {
        this.editing.set(true);
        // Cambiar a la pestaña de datos personales si estamos en resumen para facilitar la edición
        if (this.activeTab() === 'resumen') {
            this.activeTab.set('datos');
        }
    }

    cancelEdit(): void {
        this.editing.set(false);
        const emp = this.employee();
        if (emp) this.fillForm(emp);
    }

    async saveChanges(): Promise<void> {
        if (this.form.invalid) return;

        const emp = this.employee();
        if (!emp) return;

        this.loading.set(true);
        try {
            const updatedData = {
                ...this.form.value,
                basicSalary: emp.basicSalary // Mantener campos contractuales invariables desde este formulario
            };
            const response = await this.employeeService.updateEmployee(emp.id, updatedData);
            this.employee.set(response.employee);
            this.editing.set(false);
            alert('Información corporativa guardada con éxito.');
        } catch (err) {
            console.error('Error al guardar cambios', err);
            alert('No se pudieron guardar los cambios. Intente nuevamente.');
        } finally {
            this.loading.set(false);
        }
    }

    getInitials(name?: string): string {
        if (!name) return 'HR';
        return name
            .split(' ')
            .filter(Boolean)
            .slice(0, 2)
            .map((n) => n[0])
            .join('')
            .toUpperCase();
    }

    getAvatarColor(name?: string): string {
        if (!name) return 'oklch(0.65 0.12 250)';
        const h = [...name].reduce((a, c) => a + c.charCodeAt(0), 0);
        const hues = [30, 60, 145, 200, 240, 280, 320, 10];
        return `oklch(0.65 0.12 ${hues[h % hues.length]})`;
    }

    getDaysRemaining(endDateStr?: string | null): number | null {
        if (!endDateStr) return null;
        const end = new Date(endDateStr + 'T00:00:00');
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const diffTime = end.getTime() - today.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    getComputedStatus(): 'Vigente' | 'Por vencer' | 'Vencido' {
        const emp = this.employee();
        if (!emp || !emp.activeContract) return 'Vigente';
        if (emp.activeContract.status === 'expired' || emp.activeContract.status === 'terminated') return 'Vencido';

        const days = this.getDaysRemaining(emp.activeContract.endDate);
        if (days !== null && days <= 30 && days >= 0) {
            return 'Por vencer';
        }
        if (days !== null && days < 0) {
            return 'Vencido';
        }
        return 'Vigente';
    }

    sendMessage(): void {
        const emp = this.employee();
        if (emp && emp.phone) {
            const formattedPhone = emp.phone.replace(/\D/g, ''); // strip non-numeric
            const message = encodeURIComponent(`Hola ${emp.firstName}, te saludamos desde la oficina de Recursos Humanos de NOVARIX S.A.C.`);
            const url = `https://wa.me/51${formattedPhone}?text=${message}`;
            window.open(url, '_blank');
        } else {
            alert('El colaborador no cuenta con un número de celular registrado.');
        }
    }

    downloadContract(): void {
        const emp = this.employee();
        if (emp?.activeContract?.id) {
            // Invocar descarga del PDF del contrato usando la URL correspondiente
            this.contractService.downloadContractPdf(emp.activeContract.id);
        } else {
            alert('No hay un contrato vigente registrado para descargar en formato PDF.');
        }
    }

    dummyDownload(): void {
        const emp = this.employee();
        if (!emp) {
            alert('No hay información del colaborador para descargar.');
            return;
        }

        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            alert('Por favor habilita las ventanas emergentes (popups) para descargar el archivo.');
            return;
        }

        const baseSalaryFormatted = new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(emp.basicSalary || 0);

        printWindow.document.write(`
            <html>
            <head>
                <title>Ficha del Colaborador - ${emp.fullName}</title>
                <style>
                    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 30px; color: #333; }
                    .header { display: flex; justify-content: space-between; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
                    h1 { font-size: 24px; margin: 0; }
                    .header p { margin: 5px 0 0 0; color: #666; font-size: 14px; }
                    h2 { font-size: 16px; border-bottom: 1px solid #ddd; padding-bottom: 5px; margin-top: 25px; text-transform: uppercase; color: #555; }
                    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                    td { padding: 8px 10px; font-size: 13px; vertical-align: top; }
                    td.label { font-weight: bold; width: 30%; color: #666; }
                    .footer { margin-top: 50px; font-size: 11px; text-align: center; color: #999; border-top: 1px solid #eee; padding-top: 10px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <div>
                        <h1>Ficha del Colaborador</h1>
                        <p>NOVARIX S.A.C. &middot; Área de Recursos Humanos</p>
                    </div>
                    <div style="text-align: right;">
                        <strong>DNI:</strong> ${emp.dni}<br>
                        <strong>Fecha de impresión:</strong> ${new Date().toLocaleDateString('es-PE')}
                    </div>
                </div>

                <h2>Datos Personales</h2>
                <table>
                    <tr>
                        <td class="label">Nombres y Apellidos:</td>
                        <td>${emp.fullName}</td>
                    </tr>
                    <tr>
                        <td class="label">Puesto / Cargo:</td>
                        <td>${emp.position}</td>
                    </tr>
                    <tr>
                        <td class="label">Correo Electrónico:</td>
                        <td>${emp.email}</td>
                    </tr>
                    <tr>
                        <td class="label">Teléfono:</td>
                        <td>${emp.phone || 'N/A'}</td>
                    </tr>
                    <tr>
                        <td class="label">Dirección:</td>
                        <td>${emp.address || 'N/A'}, ${emp.district || ''} - ${emp.province || ''} - ${emp.department || ''}</td>
                    </tr>
                    <tr>
                        <td class="label">Grado de Instrucción:</td>
                        <td>${emp.educationLevel || 'N/A'}</td>
                    </tr>
                    <tr>
                        <td class="label">Años de Experiencia:</td>
                        <td>${emp.yearsExperience || '0'} años</td>
                    </tr>
                </table>

                <h2>Información de Planilla y Pago</h2>
                <table>
                    <tr>
                        <td class="label">Remuneración Básica:</td>
                        <td>\${baseSalaryFormatted}</td>
                    </tr>
                    <tr>
                        <td class="label">Entidad Bancaria:</td>
                        <td>${emp.bankName || 'N/A'}</td>
                    </tr>
                    <tr>
                        <td class="label">Cuenta de Haberes:</td>
                        <td>${emp.bankAccount || 'N/A'}</td>
                    </tr>
                    <tr>
                        <td class="label">CCI (Interbancario):</td>
                        <td>${emp.cci || 'N/A'}</td>
                    </tr>
                    <tr>
                        <td class="label">Sistema de Pensión:</td>
                        <td>${emp.pensionSystem || 'N/A'}</td>
                    </tr>
                </table>

                <h2>Contacto de Emergencia</h2>
                <table>
                    <tr>
                        <td class="label">Nombre del Contacto:</td>
                        <td>${emp.emergencyContactName || 'N/A'}</td>
                    </tr>
                    <tr>
                        <td class="label">Teléfono de Emergencia:</td>
                        <td>${emp.emergencyContactPhone || 'N/A'}</td>
                    </tr>
                </table>

                <div class="footer">
                    Este documento es una copia fidedigna de los datos registrados en el sistema de Recursos Humanos de NOVARIX S.A.C.
                </div>

                <script>
                    window.onload = function() {
                        window.print();
                        window.close();
                    };
                </script>
            </body>
            </html>
        `);
        printWindow.document.close();
    }

    async downloadQrCode(): Promise<void> {
        const emp = this.employee();
        if (emp?.qrCodeToken) {
            try {
                const url = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${emp.qrCodeToken}`;
                const response = await fetch(url);
                const blob = await response.blob();
                const blobUrl = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = blobUrl;
                const safeName = `${emp.firstName}_${emp.lastName}`.replace(/\s+/g, '_');
                link.download = `QR_${safeName}.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(blobUrl);
            } catch (e) {
                // Fallback to opening in new window if fetch fails (e.g. CORS or network issue)
                window.open(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${emp.qrCodeToken}`, '_blank');
            }
        }
    }
}
