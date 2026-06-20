import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DashboardService, DashboardKpis, DashboardAlert } from './services/dashboard.service';
import { AuthService } from '../../core/auth/services/auth.service';
import { HrCurrencyPipe } from '../../shared/pipes/hr-currency.pipe';
import { PeDatePipe } from '../../shared/pipes/pe-date.pipe';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule, RouterModule, HrCurrencyPipe, PeDatePipe],
    template: `
        <div class="hr-page-header">
            <div>
                <h1 class="hr-page-title">Buen día, {{ userFirstName() }}. Esto es lo que pasa hoy.</h1>
                <p class="hr-page-sub">{{ todayDate() }} · {{ companyName() }} · {{ kpis()?.activeEmployees ?? 0 }} colaboradores activos.</p>
            </div>
            <div class="hr-page-actions">
                <a routerLink="/asistencia/scanner" class="hr-btn" style="display: inline-flex; align-items: center; gap: 6px; text-decoration: none;">
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
                <button class="hr-btn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="7 10 12 15 17 10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                    Exportar resumen
                </button>
                <a routerLink="/contratos" class="hr-btn hr-btn-primary">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19"/>
                        <line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                    Nuevo contrato
                </a>
            </div>
        </div>

        <!-- KPI Grid -->
        <div class="hr-kpi-grid">
            <div class="hr-kpi">
                <div class="hr-kpi-label">Colaboradores activos</div>
                <div class="hr-kpi-value hr-tabular">{{ kpis()?.activeEmployees ?? 0 }}</div>
                <div class="hr-kpi-meta">
                    <span class="delta-up hr-hstack" style="gap: 2px;">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="18 15 12 9 6 15"/>
                        </svg>
                        4
                    </span> 
                    vs. mes anterior
                </div>
            </div>
            <div class="hr-kpi">
                <div class="hr-kpi-label">Planilla mensual</div>
                <div class="hr-kpi-value hr-tabular">{{ kpis()?.totalPayroll ?? 0 | hrCurrency }}</div>
                <div class="hr-kpi-meta">
                    <span class="delta-up hr-hstack" style="gap: 2px;">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="18 15 12 9 6 15"/>
                        </svg>
                        2.1%
                    </span> 
                    vs. mes anterior
                </div>
            </div>
            <div class="hr-kpi">
                <div class="hr-kpi-label">Contratos por vencer</div>
                <div class="hr-kpi-value hr-tabular" [style.color]="alerts().length > 0 ? 'oklch(0.5 0.15 70)' : 'inherit'">
                    {{ alerts().length }}
                </div>
                <div class="hr-kpi-meta">En los próximos 30 días</div>
            </div>
            <div class="hr-kpi">
                <div class="hr-kpi-label">Asistencia hoy</div>
                <div class="hr-kpi-value hr-tabular">96.2%</div>
                <div class="hr-kpi-meta">71 marcaron · 3 justificados</div>
            </div>
        </div>

        <!-- Charts Row -->
        <div style="display: grid; grid-template-columns: 1.4fr 1fr; gap: 20px; margin-bottom: 20px;">
            <!-- Headcount -->
            <div class="hr-card">
                <div class="hr-card-header">
                    <div>
                        <h3 class="hr-card-title">Headcount · últimos 12 meses</h3>
                        <div class="hr-card-sub">Total contratado, no incluye prácticas</div>
                    </div>
                    <div class="hr-seg">
                        <button class="active">Mes</button>
                        <button>Trimestre</button>
                        <button>Año</button>
                    </div>
                </div>
                <div class="hr-card-body" style="padding-bottom: 36px;">
                    <div class="hr-bar-chart">
                        <div *ngFor="let item of headcountData; let last = last" class="hr-bar" [class.this]="last" [style.height.%]="(item.value / 80) * 100" [title]="item.month + ': ' + item.value">
                            <span class="hr-bar-label">{{ item.month }}</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Distribution -->
            <div class="hr-card">
                <div class="hr-card-header">
                    <div>
                        <h3 class="hr-card-title">Distribución por modalidad</h3>
                        <div class="hr-card-sub">TUO D. Leg. N° 728</div>
                    </div>
                </div>
                <div class="hr-card-body">
                    <div class="hr-donut-wrap">
                        <svg viewBox="0 0 36 36" width="140" height="140">
                            <circle cx="18" cy="18" r="14" fill="none" stroke="var(--surface-2)" stroke-width="4"/>
                            <!-- Indeterminado: 55% -->
                            <circle cx="18" cy="18" r="14" fill="none" stroke="oklch(0.55 0.14 var(--accent-h))" stroke-width="4" stroke-dasharray="48 100" transform="rotate(-90 18 18)"/>
                            <!-- Plazo Fijo: 30% -->
                            <circle cx="18" cy="18" r="14" fill="none" stroke="oklch(0.7 0.13 70)" stroke-width="4" stroke-dasharray="26 100" transform="rotate(82 18 18)"/>
                            <!-- Parcial: 10% -->
                            <circle cx="18" cy="18" r="14" fill="none" stroke="oklch(0.6 0.12 145)" stroke-width="4" stroke-dasharray="9 100" transform="rotate(176 18 18)"/>
                            <!-- Formativo: 5% -->
                            <circle cx="18" cy="18" r="14" fill="none" stroke="oklch(0.65 0.1 230)" stroke-width="4" stroke-dasharray="5 100" transform="rotate(208 18 18)"/>
                        </svg>
                        <div class="hr-donut-center">
                            <div>
                                <div class="v hr-tabular">{{ kpis()?.activeEmployees ?? 74 }}</div>
                                <div class="l">activos</div>
                            </div>
                        </div>
                    </div>
                    <div class="hr-vstack" style="gap: 8px; margin-top: 8px;">
                        <div class="hr-hstack" style="justify-content: space-between;">
                            <div class="hr-hstack">
                                <span style="width: 8px; height: 8px; border-radius: 2px; background: oklch(0.55 0.14 var(--accent-h)); display: inline-block;"></span>
                                <span style="font-size: 13px;">Indeterminado</span>
                            </div>
                            <span class="hr-mono" style="font-size: 12.5px; color: var(--text-soft);">38</span>
                        </div>
                        <div class="hr-hstack" style="justify-content: space-between;">
                            <div class="hr-hstack">
                                <span style="width: 8px; height: 8px; border-radius: 2px; background: oklch(0.7 0.13 70); display: inline-block;"></span>
                                <span style="font-size: 13px;">Plazo fijo (Sujeto a mod.)</span>
                            </div>
                            <span class="hr-mono" style="font-size: 12.5px; color: var(--text-soft);">26</span>
                        </div>
                        <div class="hr-hstack" style="justify-content: space-between;">
                            <div class="hr-hstack">
                                <span style="width: 8px; height: 8px; border-radius: 2px; background: oklch(0.6 0.12 145); display: inline-block;"></span>
                                <span style="font-size: 13px;">Tiempo parcial</span>
                            </div>
                            <span class="hr-mono" style="font-size: 12.5px; color: var(--text-soft);">7</span>
                        </div>
                        <div class="hr-hstack" style="justify-content: space-between;">
                            <div class="hr-hstack">
                                <span style="width: 8px; height: 8px; border-radius: 2px; background: oklch(0.65 0.1 230); display: inline-block;"></span>
                                <span style="font-size: 13px;">Modalidad formativa</span>
                            </div>
                            <span class="hr-mono" style="font-size: 12.5px; color: var(--text-soft);">3</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Alerts & Activity Row -->
        <div style="display: grid; grid-template-columns: 1.4fr 1fr; gap: 20px;">
            <!-- Expiring Contracts -->
            <div class="hr-card">
                <div class="hr-card-header">
                    <div>
                        <h3 class="hr-card-title">Contratos que requieren atención</h3>
                        <div class="hr-card-sub">Renovar, convertir a indeterminado o cerrar antes del vencimiento</div>
                    </div>
                    <a routerLink="/contratos" class="hr-btn hr-btn-sm hr-btn-ghost">
                        Ver todos
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="9 18 15 12 9 6"/>
                        </svg>
                    </a>
                </div>
                <div class="hr-card-flush">
                    <table class="hr-tbl">
                        <thead>
                            <tr>
                                <th>Colaborador</th>
                                <th>Modalidad</th>
                                <th>Vence</th>
                                <th>Días</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr *ngFor="let item of alerts()">
                                <td>
                                    <div class="hr-row-emp">
                                        <span class="hr-emp-avatar" [style.background]="'oklch(0.65 0.12 250)'">{{ getInitials(item.employeeName) }}</span>
                                        <div>
                                            <div class="hr-emp-name">{{ item.employeeName }}</div>
                                            <div class="hr-emp-id">{{ item.modality || item.nature }}</div>
                                        </div>
                                    </div>
                                </td>
                                <td><span class="hr-soft">{{ item.nature }}</span></td>
                                <td class="hr-mono" style="font-size: 13px;">{{ item.endDate | peDate }}</td>
                                <td>
                                    <span class="hr-badge" [class.danger]="item.daysRemaining <= 10" [class.warning]="item.daysRemaining > 10 && item.daysRemaining <= 20" [class.success]="item.daysRemaining > 20">
                                        {{ item.daysRemaining }} días
                                    </span>
                                </td>
                                <td class="action-cell">
                                    <a [routerLink]="['/colaboradores']" class="hr-btn hr-btn-sm">Gestionar</a>
                                </td>
                            </tr>
                            <tr *ngIf="alerts().length === 0">
                                <td colspan="5" class="hr-soft" style="text-align: center; height: 100px;">
                                    No hay contratos próximos a vencer en los siguientes 30 días.
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Activity Feed -->
            <div class="hr-card">
                <div class="hr-card-header">
                    <h3 class="hr-card-title">Actividad reciente</h3>
                    <button class="hr-btn hr-btn-sm hr-btn-ghost" (click)="loadData()">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
                        </svg>
                    </button>
                </div>
                <div class="hr-activity">
                    <div *ngFor="let act of recentActivity" class="hr-activity-item">
                        <span class="hr-activity-dot" [style.background]="getActivityColor(act.kind)"></span>
                        <div class="hr-activity-body">
                            <div class="hr-activity-text" [innerHTML]="act.text"></div>
                            <div class="hr-activity-meta">{{ act.time }}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `
})
export class Dashboard implements OnInit {
    private readonly dashboardService = inject(DashboardService);
    private readonly authService = inject(AuthService);

    readonly kpis = signal<DashboardKpis | null>(null);
    readonly alerts = signal<DashboardAlert[]>([]);

    userName = computed(() => this.authService.user()?.name ?? 'María F. Quispe');
    userFirstName = computed(() => this.userName().split(' ')[0]);
    companyName = computed(() => this.authService.user()?.company?.name ?? 'Constructora Norte S.A.C.');

    headcountData = [
        { month: 'ene', value: 62 },
        { month: 'feb', value: 64 },
        { month: 'mar', value: 65 },
        { month: 'abr', value: 65 },
        { month: 'may', value: 68 },
        { month: 'jun', value: 69 },
        { month: 'jul', value: 71 },
        { month: 'ago', value: 72 },
        { month: 'sep', value: 73 },
        { month: 'oct', value: 73 },
        { month: 'nov', value: 74 },
        { month: 'dic', value: 74 }
    ];

    recentActivity = [
        { time: 'hace 6 min', text: '<b>Mariana Cabrera</b> registró asistencia · ingreso 08:42', kind: 'attendance' },
        { time: 'hace 22 min', text: '<b>Ana Lucía Rivera</b> solicitó renovación de contrato', kind: 'contract' },
        { time: 'hace 1 h', text: 'Generaste el reporte de planilla <span class="hr-mono">PLA-2026-05</span>', kind: 'report' },
        { time: 'hace 2 h', text: '<b>Carlos Vargas</b> actualizó CCI del Banco BCP', kind: 'data' },
        { time: 'hace 3 h', text: '<b>Diego Soto</b> subió contrato firmado (PDF)', kind: 'doc' },
        { time: 'ayer 16:20', text: 'Notificación enviada: 3 contratos vencen en julio', kind: 'alert' }
    ];

    ngOnInit(): void {
        this.loadData();
    }

    async loadData(): Promise<void> {
        try {
            const [kpis, alertsResponse] = await Promise.all([
                this.dashboardService.getKpis(),
                this.dashboardService.getAlerts()
            ]);
            this.kpis.set(kpis);
            this.alerts.set(alertsResponse.alerts);
        } catch (err) {
            console.error('Error al cargar datos del dashboard', err);
        }
    }

    todayDate(): string {
        const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const dateStr = new Date().toLocaleDateString('es-PE', options);
        // Capitalizar primera letra
        return dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
    }

    getInitials(name: string): string {
        return name
            .split(' ')
            .filter(Boolean)
            .slice(0, 2)
            .map((n) => n[0])
            .join('')
            .toUpperCase();
    }

    getActivityColor(kind: string): string {
        switch (kind) {
            case 'alert':
                return 'var(--warning)';
            case 'doc':
                return 'var(--info)';
            case 'contract':
                return 'var(--accent)';
            case 'attendance':
                return 'var(--success)';
            default:
                return 'var(--text-soft)';
        }
    }
}
