import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { EmployeeService, DepartmentInfo, ProvinceInfo, DistrictInfo, BanksCatalogResponse, CatalogItem } from '../../../shared/services/employee.service';
import { ContractService } from '../../../shared/services/contract.service';
import { CustomValidators } from '../../../shared/validators/custom-validators';
import { HrCurrencyPipe } from '../../../shared/pipes/hr-currency.pipe';
import { PeDatePipe } from '../../../shared/pipes/pe-date.pipe';
import { Employee } from '../../../shared/models/hr.models';

@Component({
    selector: 'app-contract-wizard',
    standalone: true,
    imports: [CommonModule, RouterModule, ReactiveFormsModule, HrCurrencyPipe, PeDatePipe],
    template: `
        <div class="hr-page-header" style="margin-bottom: 16px;">
            <div>
                <div class="crumb" style="margin-bottom: 8px;">
                    <a routerLink="/contratos" style="cursor: pointer; color: var(--accent); font-weight: 500;">← Contratos</a>
                </div>
                <h1 class="hr-page-title">Nuevo contrato</h1>
                <p class="hr-page-sub">Completa el wizard de 6 pasos. Los plazos se validan conforme al TUO D. Leg. N° 728.</p>
            </div>
            <div class="hr-page-actions" *ngIf="currentStep() < 6">
                <button type="button" class="hr-btn" (click)="saveDraft()">Guardar borrador</button>
                <a routerLink="/contratos" class="hr-btn hr-btn-ghost">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                    Cancelar
                </a>
            </div>
        </div>

        <!-- Stepper (Fila superior de pasos) -->
        <div class="hr-stepper">
            <div *ngFor="let s of STEPS" class="hr-step" [class.active]="currentStep() === s.id" [class.done]="currentStep() > s.id" (click)="goToStep(s.id)">
                <span class="n">{{ s.n }}</span>
                <span>{{ s.label }}</span>
            </div>
        </div>

        <!-- Errores generales -->
        <div *ngIf="errorMessage()" class="hr-card" style="padding: 12px; background: var(--danger-soft); color: var(--danger); border-color: transparent; margin-bottom: 20px; font-size: 13.5px;">
            <strong>Error:</strong> {{ errorMessage() }}
        </div>

        <!-- Formulario Wizard -->
        <form [formGroup]="form" (ngSubmit)="onSubmit()">
            
            <!-- PASO 0: Tipo de Contrato -->
            <div *ngIf="currentStep() === 0" class="hr-card" style="margin-bottom: 24px;">
                <div class="hr-card-header"><h3 class="hr-card-title">Selección de Modalidad Contractual (D. Leg. 728)</h3></div>
                <div class="hr-card-body">
                    <div class="hr-form-row">
                        <div class="hr-field">
                            <label>Naturaleza del Contrato <span class="req">*</span></label>
                            <select formControlName="nature" (change)="onNatureChange()">
                                <option value="Indeterminado">Indeterminado</option>
                                <option value="Temporal">Temporal</option>
                                <option value="Accidental">Accidental</option>
                                <option value="Obra o Servicio">Obra o Servicio</option>
                                <option value="Tiempo Parcial">Tiempo Parcial</option>
                            </select>
                        </div>
                        <div class="hr-field" *ngIf="showModalitySelector()">
                            <label>Modalidad / Tipo Específico <span class="req">*</span></label>
                            <select formControlName="modality">
                                <option *ngFor="let m of modalities()" [value]="m.title">{{ m.title }}</option>
                            </select>
                        </div>
                    </div>
                    <div class="hr-divider"></div>
                    <div class="hr-soft" *ngIf="selectedModalityInfo()" style="padding: 14px; background: var(--surface-2); border-radius: var(--radius); border: 1px solid var(--border);">
                        <h4 style="font-weight: 600; color: var(--text); margin: 0 0 6px;">{{ selectedModalityInfo()?.title }}</h4>
                        <p style="margin: 0 0 10px; font-size: 13px; line-height: 1.5;">{{ selectedModalityInfo()?.desc }}</p>
                        <div style="font-size: 12px;" class="hr-hstack">
                            <span style="font-weight: 600; color: var(--text-soft);">Plazo máximo legal:</span>
                            <span class="hr-badge success no-dot">{{ selectedModalityInfo()?.max }}</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- PASO 1: Datos Personales -->
            <div *ngIf="currentStep() === 1" class="hr-card" style="margin-bottom: 24px;">
                <div class="hr-card-header"><h3 class="hr-card-title">Datos Personales del Colaborador</h3></div>
                <div class="hr-card-body">
                    <div class="hr-form-row cols-3">
                        <div class="hr-field">
                            <label>DNI (8 dígitos) <span class="req">*</span></label>
                            <input formControlName="dni" placeholder="Ej: 70123456" class="hr-mono" maxLength="8"/>
                            <span *ngIf="form.get('dni')?.touched && form.get('dni')?.errors?.['dni']" class="error">El DNI debe tener 8 dígitos numéricos.</span>
                        </div>
                        <div class="hr-field">
                            <label>Nombres <span class="req">*</span></label>
                            <input formControlName="firstName" placeholder="Ej: María Fernanda"/>
                        </div>
                        <div class="hr-field">
                            <label>Apellidos <span class="req">*</span></label>
                            <input formControlName="lastName" placeholder="Ej: Quispe Huamán"/>
                        </div>
                        <div class="hr-field">
                            <label>Sexo / Género <span class="req">*</span></label>
                            <select formControlName="gender">
                                <option value="Femenino">Femenino</option>
                                <option value="Masculino">Masculino</option>
                            </select>
                        </div>
                        <div class="hr-field">
                            <label>Estado Civil <span class="req">*</span></label>
                            <select formControlName="civilStatus">
                                <option value="Soltero(a)">Soltero(a)</option>
                                <option value="Casado(a)">Casado(a)</option>
                                <option value="Divorciado(a)">Divorciado(a)</option>
                                <option value="Viudo(a)">Viudo(a)</option>
                                <option value="Conviviente">Conviviente</option>
                            </select>
                        </div>
                        <div class="hr-field">
                            <label>Fecha de Nacimiento <span class="req">*</span></label>
                            <input type="date" formControlName="birthDate" class="hr-mono"/>
                        </div>
                        <div class="hr-field">
                            <label>Celular (9 dígitos) <span class="req">*</span></label>
                            <input formControlName="phone" placeholder="Ej: 999845217" class="hr-mono" maxLength="9"/>
                            <span *ngIf="form.get('phone')?.touched && form.get('phone')?.errors?.['phone']" class="error">Debe ser un número celular válido (comienza con 9).</span>
                        </div>
                        <div class="hr-field">
                            <label>Correo Electrónico <span class="req">*</span></label>
                            <input type="email" formControlName="email" placeholder="mquispe@empresa.pe"/>
                        </div>
                        <div class="hr-field">
                            <label>Tipo de Sangre <span class="req">*</span></label>
                            <select formControlName="bloodType">
                                <option value="O+">O+</option>
                                <option value="O-">O-</option>
                                <option value="A+">A+</option>
                                <option value="A-">A-</option>
                                <option value="B+">B+</option>
                                <option value="B-">B-</option>
                                <option value="AB+">AB+</option>
                                <option value="AB-">AB-</option>
                            </select>
                        </div>
                        <div class="hr-field" style="justify-content: center; margin-top: 18px;">
                            <label class="hr-hstack" style="cursor: pointer;">
                                <input type="checkbox" formControlName="hasFamilyAllowance" style="width: auto; margin-right: 6px;"/>
                                <span>Derecho a Asignación Familiar</span>
                            </label>
                        </div>
                        <div class="hr-field" *ngIf="form.get('hasFamilyAllowance')?.value">
                            <label>Número de Hijos <span class="req">*</span></label>
                            <input type="number" formControlName="childrenCount" min="0" class="hr-mono"/>
                        </div>
                    </div>
                </div>
            </div>

            <!-- PASO 2: Dirección y Ubigeo -->
            <div *ngIf="currentStep() === 2" class="hr-card" style="margin-bottom: 24px;">
                <div class="hr-card-header"><h3 class="hr-card-title">Dirección de Residencia y UBIGEO</h3></div>
                <div class="hr-card-body">
                    <div class="hr-form-row">
                        <div class="hr-field" style="grid-column: span 2;">
                            <label>Dirección Domiciliaria <span class="req">*</span></label>
                            <input formControlName="address" placeholder="Ej: Av. Javier Prado Oeste 1485, Dpto 502"/>
                        </div>
                        <div class="hr-field">
                            <label>Departamento <span class="req">*</span></label>
                            <select formControlName="department" (change)="onDepartmentChange()">
                                <option value="">-- Seleccione --</option>
                                <option *ngFor="let dep of departments()" [value]="dep.name">{{ dep.name }}</option>
                            </select>
                        </div>
                        <div class="hr-field">
                            <label>Provincia <span class="req">*</span></label>
                            <select formControlName="province" (change)="onProvinceChange()">
                                <option value="">-- Seleccione --</option>
                                <option *ngFor="let prov of provinces()" [value]="prov.name">{{ prov.name }}</option>
                            </select>
                        </div>
                        <div class="hr-field">
                            <label>Distrito <span class="req">*</span></label>
                            <select formControlName="district" (change)="onDistrictChange()">
                                <option value="">-- Seleccione --</option>
                                <option *ngFor="let dist of districts()" [value]="dist.name">{{ dist.name }}</option>
                            </select>
                        </div>
                        <div class="hr-field">
                            <label>Código UBIGEO INEI</label>
                            <input formControlName="ubigeoCode" class="hr-mono" readonly style="background: var(--surface-2); font-weight: 600;"/>
                        </div>
                    </div>
                </div>
            </div>

            <!-- PASO 3: Condiciones Laborales -->
            <div *ngIf="currentStep() === 3" class="hr-card" style="margin-bottom: 24px;">
                <div class="hr-card-header"><h3 class="hr-card-title">Condiciones Laborales del Puesto</h3></div>
                <div class="hr-card-body">
                    <div class="hr-form-row cols-3">
                        <div class="hr-field">
                            <label>Cargo / Puesto de Trabajo <span class="req">*</span></label>
                            <input formControlName="position" placeholder="Ej: Analista Senior de Planillas"/>
                        </div>
                        <div class="hr-field">
                            <label>Fecha de Inicio <span class="req">*</span></label>
                            <input type="date" formControlName="startDate" class="hr-mono" (change)="validateDates()"/>
                        </div>
                        <div class="hr-field" *ngIf="form.get('nature')?.value !== 'Indeterminado'">
                            <label>Fecha de Término <span class="req">*</span></label>
                            <input type="date" formControlName="endDate" class="hr-mono" (change)="validateDates()"/>
                            <span *ngIf="dateError()" class="error">{{ dateError() }}</span>
                        </div>
                        <div class="hr-field">
                            <label>Moneda <span class="req">*</span></label>
                            <select formControlName="currencyCode">
                                <option value="PEN">Soles (PEN)</option>
                                <option value="USD">Dólares (USD)</option>
                                <option value="EUR">Euros (EUR)</option>
                            </select>
                        </div>
                        <div class="hr-field">
                            <label>Remuneración Básica Mensual <span class="req">*</span></label>
                            <input type="number" formControlName="salary" placeholder="0.00" class="hr-mono"/>
                        </div>
                    </div>
                </div>
            </div>

            <!-- PASO 4: Banco y Pensión -->
            <div *ngIf="currentStep() === 4" class="hr-card" style="margin-bottom: 24px;">
                <div class="hr-card-header"><h3 class="hr-card-title">Cuentas Financieras y Previsionales</h3></div>
                <div class="hr-card-body">
                    <div class="hr-form-row cols-3">
                        <div class="hr-field">
                            <label>Entidad Bancaria <span class="req">*</span></label>
                            <select formControlName="bankName">
                                <option *ngFor="let b of banks()" [value]="b.name">{{ b.name }}</option>
                            </select>
                        </div>
                        <div class="hr-field">
                            <label>Número de Cuenta de Haberes <span class="req">*</span></label>
                            <input formControlName="bankAccount" placeholder="Ej: 191-12345678-0-99" class="hr-mono"/>
                        </div>
                        <div class="hr-field">
                            <label>CCI (20 dígitos)</label>
                            <input formControlName="cci" placeholder="Ej: 00219112233445566678" class="hr-mono" maxLength="20"/>
                        </div>
                        <div class="hr-field">
                            <label>Sistema de Pensiones <span class="req">*</span></label>
                            <select formControlName="pensionSystem">
                                <option *ngFor="let p of pensionSystems()" [value]="p.name">{{ p.name }}</option>
                            </select>
                        </div>
                        <div class="hr-field" *ngIf="form.get('pensionSystem')?.value !== 'Oficina de Normalización Previsional (ONP)'">
                            <label>Código CUSPP (AFP)</label>
                            <input formControlName="cuspp" placeholder="Ej: 123456ABCDE1" class="hr-mono" maxLength="12"/>
                        </div>
                        <div class="hr-field">
                            <label>Grado de Instrucción <span class="req">*</span></label>
                            <select formControlName="educationLevel">
                                <option value="Secundaria Completa">Secundaria Completa</option>
                                <option value="Técnico Completo">Técnico Completo</option>
                                <option value="Superior Completo">Superior Completo</option>
                                <option value="Postgrado / Maestría">Postgrado / Maestría</option>
                            </select>
                        </div>
                        <div class="hr-field">
                            <label>Carrera / Especialidad</label>
                            <input formControlName="professionalDegree" placeholder="Ej: Ingeniería de Sistemas"/>
                        </div>
                        <div class="hr-field">
                            <label>Años de Experiencia</label>
                            <input type="number" formControlName="yearsExperience" min="0" class="hr-mono"/>
                        </div>
                    </div>
                    <div class="hr-divider"></div>
                    <div class="hr-form-row cols-3">
                        <div class="hr-field">
                            <label>Contacto de Emergencia <span class="req">*</span></label>
                            <input formControlName="emergencyContactName" placeholder="Ej: Juan Pérez (Esposo)"/>
                        </div>
                        <div class="hr-field">
                            <label>Celular de Emergencia <span class="req">*</span></label>
                            <input formControlName="emergencyContactPhone" placeholder="Ej: 999123456" class="hr-mono" maxLength="9"/>
                        </div>
                    </div>
                    <div class="hr-divider"></div>
                    <div class="hr-form-row cols-3">
                        <div class="hr-field">
                            <label>Talla de Calzado</label>
                            <input formControlName="shoeSize" placeholder="Ej: 37" class="hr-mono"/>
                        </div>
                        <div class="hr-field">
                            <label>Talla de Pantalón</label>
                            <input formControlName="pantsSize" placeholder="Ej: 28" class="hr-mono"/>
                        </div>
                        <div class="hr-field">
                            <label>Talla de Camisa / Blusa</label>
                            <input formControlName="shirtSize" placeholder="Ej: M" class="hr-mono"/>
                        </div>
                    </div>
                </div>
            </div>

            <!-- PASO 5: Revisión y Firma -->
            <div *ngIf="currentStep() === 5" class="hr-card" style="margin-bottom: 24px;">
                <div class="hr-card-header"><h3 class="hr-card-title">Resumen y Firma del Contrato</h3></div>
                <div class="hr-card-body">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 32px;">
                        
                        <!-- Colaborador Resumen -->
                        <div style="padding: 16px; background: var(--surface-2); border-radius: var(--radius);">
                            <h4 style="font-weight: 600; margin-top: 0; margin-bottom: 12px; border-bottom: 1px solid var(--border); padding-bottom: 6px;">Datos del Colaborador</h4>
                            <dl class="hr-kv">
                                <dt>DNI</dt><dd class="hr-mono">{{ form.value.dni }}</dd>
                                <dt>Nombres</dt><dd>{{ form.value.firstName }} {{ form.value.lastName }}</dd>
                                <dt>Género / Sexo</dt><dd>{{ form.value.gender }}</dd>
                                <dt>Estado Civil</dt><dd>{{ form.value.civilStatus }}</dd>
                                <dt>Dirección</dt><dd>{{ form.value.address }}, {{ form.value.district }}</dd>
                                <dt>UBIGEO</dt><dd class="hr-mono">{{ form.value.ubigeoCode }}</dd>
                                <dt>Celular</dt><dd class="hr-mono">{{ form.value.phone }}</dd>
                                <dt>Correo</dt><dd>{{ form.value.email }}</dd>
                                <dt>Asig. Familiar</dt><dd>{{ form.value.hasFamilyAllowance ? 'Sí' : 'No' }} ({{ form.value.childrenCount }} hijos)</dd>
                            </dl>
                        </div>

                        <!-- Contrato Resumen -->
                        <div style="padding: 16px; background: var(--surface-2); border-radius: var(--radius);">
                            <h4 style="font-weight: 600; margin-top: 0; margin-bottom: 12px; border-bottom: 1px solid var(--border); padding-bottom: 6px;">Condiciones del Contrato</h4>
                            <dl class="hr-kv">
                                <dt>Naturaleza</dt><dd><strong>{{ form.value.nature }}</strong></dd>
                                <dt>Modalidad</dt><dd>{{ form.value.modality || '—' }}</dd>
                                <dt>Cargo / Puesto</dt><dd>{{ form.value.position }}</dd>
                                <dt>Fecha de Inicio</dt><dd class="hr-mono">{{ form.value.startDate | peDate }}</dd>
                                <dt>Fecha de Término</dt><dd class="hr-mono">{{ form.value.endDate ? (form.value.endDate | peDate) : 'Indeterminado' }}</dd>
                                <dt>Salario Mensual</dt><dd class="hr-mono" style="font-weight: 600;">{{ form.value.salary | hrCurrency:form.value.currencyCode }}</dd>
                                <dt>Banco / Cuenta</dt><dd>{{ form.value.bankName }} · <span class="hr-mono">{{ form.value.bankAccount }}</span></dd>
                                <dt>Pensión</dt><dd>{{ form.value.pensionSystem }}</dd>
                            </dl>
                        </div>
                    </div>

                    <div class="hr-divider"></div>
                    <div style="padding: 14px; background: var(--success-soft); color: var(--success); border-radius: var(--radius); display: flex; gap: 12px; align-items: flex-start; font-size: 13.5px;">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0; margin-top: 2px;">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                        </svg>
                        <div>
                            <strong>Validación Legal Exitosa:</strong> Las condiciones del contrato y la duración elegida respetan las normativas y plazos máximos exigidos por la legislación laboral peruana (TUO D. Leg. 728).
                        </div>
                    </div>
                </div>
            </div>

            <!-- PASO 6: Éxito y Mostrar Credencial QR -->
            <div *ngIf="currentStep() === 6" class="hr-card" style="margin-bottom: 24px; text-align: center; padding: 40px 24px; position: relative; overflow: hidden;">
                <div style="width: 64px; height: 64px; border-radius: 50%; background: var(--success-soft); color: var(--success); display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px;">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                    </svg>
                </div>
                
                <h2 style="font-size: 24px; font-weight: 800; color: var(--text); margin: 0 0 8px 0;">¡Contrato y Colaborador Registrados!</h2>
                <p class="hr-soft" style="font-size: 15px; max-width: 500px; margin: 0 auto 32px auto; line-height: 1.5;">
                    El colaborador <strong>{{ createdEmployee()?.firstName }} {{ createdEmployee()?.lastName }}</strong> ha sido registrado exitosamente. Se ha generado su credencial de asistencia con un código QR único.
                </p>

                <!-- QR Display -->
                <div style="background: white; padding: 16px; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.06); display: inline-block; margin-bottom: 24px; border: 1px solid var(--border);">
                    <img [src]="'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' + createdEmployee()?.qrCodeToken" 
                         alt="Código QR" 
                         style="display: block; width: 200px; height: 200px; border-radius: 6px;" />
                </div>

                <div style="font-family: monospace; font-size: 13.5px; color: var(--text-muted); margin-bottom: 32px; word-break: break-all;">
                    Token de Asistencia: {{ createdEmployee()?.qrCodeToken }}
                </div>

                <div class="hr-hstack" style="justify-content: center; gap: 12px;">
                    <button type="button" class="hr-btn hr-btn-outline" (click)="downloadCreatedQr()" style="display: inline-flex; align-items: center; gap: 6px;">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                            <polyline points="7 10 12 15 17 10"/>
                            <line x1="12" y1="15" x2="12" y2="3"/>
                        </svg>
                        Descargar Código QR
                    </button>
                    <button type="button" class="hr-btn hr-btn-primary" (click)="finishWizard()">
                        Volver a Contratos
                    </button>
                </div>
            </div>

            <!-- Controles del Wizard -->
            <div *ngIf="currentStep() < 6" class="hr-hstack" style="justify-content: space-between; margin-top: 16px;">
                <button type="button" class="hr-btn" [disabled]="currentStep() === 0" (click)="prevStep()">
                    ← Anterior
                </button>
                <button *ngIf="currentStep() < 5" type="button" class="hr-btn hr-btn-primary" (click)="nextStep()">
                    Siguiente →
                </button>
                <button *ngIf="currentStep() === 5" type="submit" class="hr-btn hr-btn-primary" [disabled]="submitting()">
                    {{ submitting() ? 'Registrando...' : 'Registrar y Firmar Contrato' }}
                </button>
            </div>
        </form>
    `
})
export class ContractWizardComponent implements OnInit {
    private readonly fb = inject(FormBuilder);
    private readonly router = inject(Router);
    private readonly employeeService = inject(EmployeeService);
    private readonly contractService = inject(ContractService);

    readonly currentStep = signal<number>(0);
    readonly submitting = signal<boolean>(false);
    readonly errorMessage = signal<string | null>(null);
    readonly createdEmployee = signal<Employee | null>(null);

    // Formulario completo
    form!: FormGroup;

    // Catálogos reactivos
    readonly ubigeoTree = signal<DepartmentInfo[]>([]);
    readonly banks = signal<CatalogItem[]>([]);
    readonly pensionSystems = signal<CatalogItem[]>([]);

    readonly departments = computed(() => this.ubigeoTree());
    readonly provinces = signal<ProvinceInfo[]>([]);
    readonly districts = signal<DistrictInfo[]>([]);

    readonly dateError = signal<string | null>(null);

    readonly STEPS = [
        { id: 0, n: '01', label: 'Tipo de contrato' },
        { id: 1, n: '02', label: 'Datos personales' },
        { id: 2, n: '03', label: 'Dirección' },
        { id: 3, n: '04', label: 'Condiciones laborales' },
        { id: 4, n: '05', label: 'Banco y pensión' },
        { id: 5, n: '06', label: 'Revisión y firma' }
    ];

    private readonly ALL_MODALITIES = [
        { title: 'Inicio o incremento de actividad', max: '3 años', desc: 'Lanzamiento de nueva actividad productiva o incremento sostenido de actividades existentes.' },
        { title: 'Necesidades del mercado', max: '5 años', desc: 'Atender incrementos coyunturales originados por variaciones sustanciales del mercado.' },
        { title: 'Reconversión empresarial', max: '2 años', desc: 'Sustitución, ampliación o modificación de las actividades desarrolladas en la empresa.' },
        { title: 'Ocasional', max: '6 meses al año', desc: 'Atender necesidades transitorias distintas de la actividad habitual del centro de trabajo.' },
        { title: 'Suplencia', max: 'Lo necesario', desc: 'Sustituir a un trabajador estable de la empresa cuyo vínculo laboral se encuentre suspendido.' },
        { title: 'Emergencia', max: 'Duración de la emergencia', desc: 'Cubrir necesidades promovidas por caso fortuito o fuerza mayor.' },
        { title: 'Específico', max: 'Fin de obra (máx. 8 años)', desc: 'Objeto previamente establecido y duración determinada por el fin de la obra o servicio.' },
        { title: 'Intermitente', max: 'Sin plazo fijo', desc: 'Cubrir necesidades de la empresa que por su naturaleza son permanentes pero discontinuas.' },
        { title: 'Temporada', max: 'Sin plazo fijo', desc: 'Cubrir necesidades que surgen en determinadas épocas del año y se repiten cíclicamente.' }
    ];

    modalities = computed(() => {
        const nature = this.form?.get('nature')?.value;
        if (nature === 'Temporal') {
            return this.ALL_MODALITIES.filter((m) => ['Inicio o incremento de actividad', 'Necesidades del mercado', 'Reconversión empresarial'].includes(m.title));
        }
        if (nature === 'Accidental') {
            return this.ALL_MODALITIES.filter((m) => ['Ocasional', 'Suplencia', 'Emergencia'].includes(m.title));
        }
        if (nature === 'Obra o Servicio') {
            return this.ALL_MODALITIES.filter((m) => ['Específico', 'Intermitente', 'Temporada'].includes(m.title));
        }
        return [];
    });

    selectedModalityInfo = computed(() => {
        const mod = this.form?.get('modality')?.value;
        return this.ALL_MODALITIES.find((m) => m.title === mod) || null;
    });

    ngOnInit(): void {
        this.initForm();
        this.loadCatalogs();
    }

    initForm(): void {
        this.form = this.fb.group({
            // Paso 0
            nature: ['Temporal', Validators.required],
            modality: ['Inicio o incremento de actividad', Validators.required],

            // Paso 1
            dni: ['', [Validators.required, CustomValidators.dni()]],
            firstName: ['', Validators.required],
            lastName: ['', Validators.required],
            gender: ['Femenino', Validators.required],
            civilStatus: ['Soltero(a)', Validators.required],
            birthDate: ['', Validators.required],
            phone: ['', [Validators.required, CustomValidators.phone()]],
            email: ['', [Validators.required, Validators.email]],
            bloodType: ['O+', Validators.required],
            hasFamilyAllowance: [false],
            childrenCount: [0, Validators.required],

            // Paso 2
            address: ['', Validators.required],
            department: ['', Validators.required],
            province: ['', Validators.required],
            district: ['', Validators.required],
            ubigeoCode: ['', Validators.required],

            // Paso 3
            position: ['', Validators.required],
            startDate: ['', Validators.required],
            endDate: [''],
            salary: ['', [Validators.required, Validators.min(0)]],
            currencyCode: ['PEN', Validators.required],

            // Paso 4
            bankName: ['Banco de Crédito del Perú (BCP)', Validators.required],
            bankAccount: ['', Validators.required],
            cci: [''],
            pensionSystem: ['Oficina de Normalización Previsional (ONP)', Validators.required],
            cuspp: [''],
            educationLevel: ['Superior Completo', Validators.required],
            professionalDegree: [''],
            yearsExperience: [0, Validators.min(0)],
            emergencyContactName: ['', Validators.required],
            emergencyContactPhone: ['', [Validators.required, CustomValidators.phone()]],
            shoeSize: [''],
            pantsSize: [''],
            shirtSize: ['']
        });
    }

    async loadCatalogs(): Promise<void> {
        try {
            const [ubigeo, banksRes] = await Promise.all([
                this.employeeService.getUbigeoCatalog(),
                this.employeeService.getBanksCatalog()
            ]);
            this.ubigeoTree.set(ubigeo);
            this.banks.set(banksRes.banks);
            this.pensionSystems.set(banksRes.pensionSystems);
        } catch (err) {
            console.error('Error al cargar catálogos', err);
        }
    }

    showModalitySelector(): boolean {
        const nature = this.form.get('nature')?.value;
        return ['Temporal', 'Accidental', 'Obra o Servicio'].includes(nature);
    }

    onNatureChange(): void {
        const nature = this.form.get('nature')?.value;
        if (nature === 'Indeterminado' || nature === 'Tiempo Parcial') {
            this.form.get('modality')?.setValue('');
            this.form.get('endDate')?.setValue('');
            this.form.get('endDate')?.clearValidators();
        } else {
            const mods = this.modalities();
            this.form.get('modality')?.setValue(mods[0]?.title ?? '');
            this.form.get('endDate')?.setValidators([Validators.required]);
        }
        this.form.get('endDate')?.updateValueAndValidity();
        this.validateDates();
    }

    onDepartmentChange(): void {
        const depName = this.form.get('department')?.value;
        this.form.get('province')?.setValue('');
        this.form.get('district')?.setValue('');
        this.form.get('ubigeoCode')?.setValue('');

        const dep = this.ubigeoTree().find((d) => d.name === depName);
        this.provinces.set(dep?.provinces ?? []);
        this.districts.set([]);
    }

    onProvinceChange(): void {
        const provName = this.form.get('province')?.value;
        this.form.get('district')?.setValue('');
        this.form.get('ubigeoCode')?.setValue('');

        const prov = this.provinces().find((p) => p.name === provName);
        this.districts.set(prov?.districts ?? []);
    }

    onDistrictChange(): void {
        const distName = this.form.get('district')?.value;
        const dist = this.districts().find((d) => d.name === distName);
        this.form.get('ubigeoCode')?.setValue(dist?.code ?? '');
    }

    validateDates(): void {
        this.dateError.set(null);
        const nature = this.form.get('nature')?.value;
        if (nature === 'Indeterminado') return;

        const startStr = this.form.get('startDate')?.value;
        const endStr = this.form.get('endDate')?.value;

        if (!startStr || !endStr) return;

        const start = new Date(startStr + 'T00:00:00');
        const end = new Date(endStr + 'T00:00:00');

        if (end < start) {
            this.dateError.set('La fecha de término debe ser posterior a la fecha de inicio.');
            return;
        }

        // Validar límites del D.Leg. 728
        const modality = this.form.get('modality')?.value;
        const diffYears = end.getFullYear() - start.getFullYear();
        const diffMonths = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());

        if (modality === 'Inicio o incremento de actividad' && diffMonths > 36) {
            this.dateError.set('La duración máxima legal para esta modalidad es de 3 años (36 meses).');
        } else if (modality === 'Necesidades del mercado' && diffMonths > 60) {
            this.dateError.set('La duración máxima legal para esta modalidad es de 5 años (60 meses).');
        } else if (modality === 'Reconversión empresarial' && diffMonths > 24) {
            this.dateError.set('La duración máxima legal para esta modalidad es de 2 años (24 meses).');
        } else if (modality === 'Ocasional' && diffMonths > 6) {
            this.dateError.set('La duración máxima legal para esta modalidad es de 6 meses.');
        } else if (modality === 'Específico' && diffMonths > 96) {
            this.dateError.set('La duración máxima jurisprudencial para esta modalidad es de 8 años.');
        }
    }

    goToStep(stepId: number): void {
        if (this.currentStep() === 6) return;
        if (stepId < this.currentStep()) {
            this.currentStep.set(stepId);
        } else if (stepId > this.currentStep()) {
            this.nextStep();
        }
    }

    prevStep(): void {
        this.currentStep.update((c) => Math.max(0, c - 1));
    }

    nextStep(): void {
        const c = this.currentStep();
        let stepValid = false;

        // Validar subconjuntos del formulario según el paso activo
        if (c === 0) {
            stepValid = (this.form.get('nature')?.valid && this.form.get('modality')?.valid) ?? false;
        } else if (c === 1) {
            stepValid = (
                this.form.get('dni')?.valid &&
                this.form.get('firstName')?.valid &&
                this.form.get('lastName')?.valid &&
                this.form.get('gender')?.valid &&
                this.form.get('civilStatus')?.valid &&
                this.form.get('birthDate')?.valid &&
                this.form.get('phone')?.valid &&
                this.form.get('email')?.valid &&
                this.form.get('bloodType')?.valid
            ) ?? false;
        } else if (c === 2) {
            stepValid = (
                this.form.get('address')?.valid &&
                this.form.get('department')?.valid &&
                this.form.get('province')?.valid &&
                this.form.get('district')?.valid &&
                this.form.get('ubigeoCode')?.valid
            ) ?? false;
        } else if (c === 3) {
            stepValid = (
                this.form.get('position')?.valid &&
                this.form.get('startDate')?.valid &&
                (this.form.get('nature')?.value === 'Indeterminado' || this.form.get('endDate')?.valid) &&
                this.form.get('salary')?.valid &&
                this.form.get('currencyCode')?.valid &&
                !this.dateError()
            ) ?? false;
        } else if (c === 4) {
            stepValid = (
                this.form.get('bankName')?.valid &&
                this.form.get('bankAccount')?.valid &&
                this.form.get('pensionSystem')?.valid &&
                this.form.get('emergencyContactName')?.valid &&
                this.form.get('emergencyContactPhone')?.valid
            ) ?? false;
        }

        if (stepValid || c === 5) {
            this.currentStep.update((step) => Math.min(this.STEPS.length - 1, step + 1));
            this.errorMessage.set(null);
        } else {
            this.errorMessage.set('Por favor completa todos los campos requeridos correctamente en este paso.');
        }
    }

    async onSubmit(): Promise<void> {
        if (this.form.invalid || this.dateError()) {
            this.errorMessage.set('El formulario contiene errores. Revise los pasos anteriores.');
            return;
        }

        this.submitting.set(true);
        this.errorMessage.set(null);

        try {
            // 1. Crear al colaborador (Employee) primero
            const employeeData = {
                dni: this.form.value.dni,
                firstName: this.form.value.firstName,
                lastName: this.form.value.lastName,
                gender: this.form.value.gender,
                civilStatus: this.form.value.civilStatus,
                birthDate: this.form.value.birthDate,
                hireDate: this.form.value.startDate, // Fecha de contratación coincide con inicio de contrato
                phone: this.form.value.phone,
                email: this.form.value.email,
                bloodType: this.form.value.bloodType,
                hasFamilyAllowance: this.form.value.hasFamilyAllowance,
                childrenCount: this.form.value.childrenCount,
                address: this.form.value.address,
                district: this.form.value.district,
                province: this.form.value.province,
                department: this.form.value.department,
                ubigeoCode: this.form.value.ubigeoCode,
                position: this.form.value.position,
                basicSalary: parseFloat(this.form.value.salary),
                bankName: this.form.value.bankName,
                bankAccount: this.form.value.bankAccount,
                cci: this.form.value.cci || null,
                pensionSystem: this.form.value.pensionSystem,
                educationLevel: this.form.value.educationLevel,
                professionalDegree: this.form.value.professionalDegree || null,
                yearsExperience: parseInt(this.form.value.yearsExperience || 0),
                emergencyContactName: this.form.value.emergencyContactName,
                emergencyContactPhone: this.form.value.emergencyContactPhone,
                shoeSize: this.form.value.shoeSize || null,
                pantsSize: this.form.value.pantsSize || null,
                shirtSize: this.form.value.shirtSize || null
            };

            const empRes = await this.employeeService.createEmployee(employeeData);

            // 2. Crear el contrato asociado a ese Colaborador (usando su ID)
            const contractData = {
                employeeId: empRes.employee.id,
                nature: this.form.value.nature,
                modality: this.form.value.nature === 'Indeterminado' || this.form.value.nature === 'Tiempo Parcial' ? null : this.form.value.modality,
                startDate: this.form.value.startDate,
                endDate: this.form.value.nature === 'Indeterminado' ? null : this.form.value.endDate,
                salary: parseFloat(this.form.value.salary),
                status: 'active' as const
                // Nota: la columna currencyCode se registraría si la tabla la tuviera, 
                // pero por simplicidad se asume guardada o ignorada según la migración actual
            };

            await this.contractService.createContract(contractData);

            // Set the created employee to show QR code and transition step
            this.createdEmployee.set(empRes.employee);
            this.currentStep.set(6);
        } catch (err: any) {
            console.error('Error al registrar contrato/colaborador', err);
            // Capturar mensaje del backend (si hay validación de ley del Value Object)
            const backendMsg = err?.error?.message;
            this.errorMessage.set(backendMsg ?? 'No se pudo registrar el contrato. Verifique la conexión con el servidor.');
        } finally {
            this.submitting.set(false);
        }
    }

    async downloadCreatedQr(): Promise<void> {
        const emp = this.createdEmployee();
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

    finishWizard(): void {
        void this.router.navigateByUrl('/contratos');
    }

    saveDraft(): void {
        alert('Borrador guardado localmente (simulado).');
    }
}
