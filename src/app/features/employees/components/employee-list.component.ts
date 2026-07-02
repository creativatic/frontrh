import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { EmployeeService } from '../../../shared/services/employee.service';
import { Employee } from '../../../shared/models/hr.models';
import { HrCurrencyPipe } from '../../../shared/pipes/hr-currency.pipe';
import { PeDatePipe } from '../../../shared/pipes/pe-date.pipe';

@Component({
    selector: 'app-employee-list',
    standalone: true,
    imports: [CommonModule, RouterModule, HrCurrencyPipe, PeDatePipe],
    template: `
        <div class="hr-page-header">
            <div>
                <h1 class="hr-page-title">Colaboradores</h1>
                <p class="hr-page-sub">{{ filteredEmployees().length }} de {{ employees().length }} · Ficha de Colaboradores</p>
            </div>
            <div class="hr-page-actions">
                <button class="hr-btn" (click)="importData()">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="17 8 12 3 7 8"/>
                        <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                    Importar
                </button>
                <button class="hr-btn" (click)="exportData()">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="7 10 12 15 17 10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                    Exportar
                </button>
                <button class="hr-btn" (click)="printBatchQrs()">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                        <rect width="10" height="10" x="3" y="3" rx="2"/>
                        <rect width="6" height="6" x="5" y="5" rx="1"/>
                        <rect width="10" height="10" x="11" y="11" rx="2"/>
                        <rect width="6" height="6" x="13" y="13" rx="1"/>
                        <rect width="6" height="6" x="15" y="3" rx="1"/>
                        <rect width="6" height="6" x="3" y="15" rx="1"/>
                    </svg>
                    Descargar QRs (Lote)
                </button>
                <a routerLink="/contratos/nuevo" class="hr-btn hr-btn-primary">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19"/>
                        <line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                    Nuevo colaborador
                </a>
            </div>
        </div>

        <!-- Filters Bar -->
        <div class="hr-filters">
            <div class="hr-search-input">
                <span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="11" cy="11" r="7"/>
                        <path d="m20 20-3.5-3.5"/>
                    </svg>
                </span>
                <input placeholder="Buscar por nombre, DNI o cargo..." (input)="onSearch($event)"/>
            </div>

            <!-- Dept Filter -->
            <select class="hr-chip" (change)="onDeptFilter($event)">
                <option value="Todos">Todos los departamentos</option>
                <option *ngFor="let dept of departments()" [value]="dept">{{ dept }}</option>
            </select>

            <!-- Status Filter -->
            <select class="hr-chip" (change)="onStatusFilter($event)">
                <option value="Todos">Todos los estados</option>
                <option value="Vigente">Vigente</option>
                <option value="Por vencer">Por vencer</option>
                <option value="Vencido">Vencido</option>
            </select>

            <div class="hr-spacer"></div>

            <!-- Toggle View -->
            <div class="hr-seg">
                <button [class.active]="viewMode() === 'table'" (click)="setViewMode('table')">Tabla</button>
                <button [class.active]="viewMode() === 'cards'" (click)="setViewMode('cards')">Tarjetas</button>
            </div>
        </div>

        <!-- TABLE VIEW -->
        <div *ngIf="viewMode() === 'table'" class="hr-card hr-card-flush">
            <table class="hr-tbl">
                <thead>
                    <tr>
                        <th style="width: 30px;"><input type="checkbox"/></th>
                        <th>Colaborador</th>
                        <th>Cargo</th>
                        <th>Área</th>
                        <th>Modalidad</th>
                        <th>Estado</th>
                        <th class="num">Remuneración</th>
                        <th>Vence</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    <tr *ngFor="let emp of filteredEmployees()" style="cursor: pointer;" [routerLink]="[emp.id]">
                        <td (click)="$event.stopPropagation()"><input type="checkbox"/></td>
                        <td>
                            <div class="hr-row-emp">
                                <span class="hr-emp-avatar" [style.background]="getAvatarColor(emp.fullName)">
                                    {{ getInitials(emp.fullName) }}
                                </span>
                                <div>
                                    <div class="hr-emp-name">{{ emp.fullName }}</div>
                                    <div class="hr-emp-id">DNI {{ emp.dni }} · {{ emp.email }}</div>
                                </div>
                            </div>
                        </td>
                        <td>{{ emp.position }}</td>
                        <td><span class="hr-badge no-dot neutral">{{ emp.department }}</span></td>
                        <td>
                            <div style="font-size: 13px;">{{ emp.activeContract?.nature ?? 'Indeterminado' }}</div>
                            <div *ngIf="emp.activeContract?.modality" style="font-size: 11px; color: var(--text-mute);">
                                {{ emp.activeContract?.modality }}
                            </div>
                        </td>
                        <td>
                            <span class="hr-badge" [class.success]="getComputedStatus(emp) === 'Vigente'" [class.warning]="getComputedStatus(emp) === 'Por vencer'" [class.danger]="getComputedStatus(emp) === 'Vencido'">
                                {{ getComputedStatus(emp) }}
                            </span>
                        </td>
                        <td class="num">{{ emp.basicSalary | hrCurrency }}</td>
                        <td class="hr-mono" style="font-size: 12.5px;">
                            {{ emp.activeContract?.endDate ? (emp.activeContract?.endDate | peDate) : '—' }}
                            <div *ngIf="getDaysRemaining(emp.activeContract?.endDate) !== null && getDaysRemaining(emp.activeContract?.endDate)! <= 30 && getDaysRemaining(emp.activeContract?.endDate)! >= 0" style="font-size: 10.5px; color: var(--warning); font-weight: 500;">
                                en {{ getDaysRemaining(emp.activeContract?.endDate) }} días
                            </div>
                        </td>
                        <td class="action-cell" (click)="$event.stopPropagation()">
                            <button class="hr-btn hr-btn-ghost hr-btn-icon" [routerLink]="[emp.id]">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                                    <circle cx="12" cy="12" r="1"/>
                                    <circle cx="12" cy="5" r="1"/>
                                    <circle cx="12" cy="19" r="1"/>
                                </svg>
                            </button>
                        </td>
                    </tr>
                    <tr *ngIf="filteredEmployees().length === 0">
                        <td colspan="9" class="hr-soft" style="text-align: center; height: 120px;">
                            No se encontraron colaboradores con los filtros activos.
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- CARDS VIEW -->
        <div *ngIf="viewMode() === 'cards'" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px;">
            <div *ngFor="let emp of filteredEmployees()" class="hr-card" style="cursor: pointer;" [routerLink]="[emp.id]">
                <div class="hr-card-body">
                    <div class="hr-hstack" style="margin-bottom: 12px;">
                        <span class="hr-emp-avatar" [style.background]="getAvatarColor(emp.fullName)" style="width: 44px; height: 44px; font-size: 14px;">
                            {{ getInitials(emp.fullName) }}
                        </span>
                        <div style="flex: 1; min-width: 0;">
                            <div style="font-weight: 600; font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">{{ emp.fullName }}</div>
                            <div style="font-size: 12px; color: var(--text-soft); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">{{ emp.position }}</div>
                        </div>
                    </div>
                    <div class="hr-hstack" style="justify-content: space-between; font-size: 12px;">
                        <span class="hr-muted">DNI</span>
                        <span class="hr-mono">{{ emp.dni }}</span>
                    </div>
                    <div class="hr-hstack" style="justify-content: space-between; font-size: 12px; margin-top: 6px;">
                        <span class="hr-muted">Área</span>
                        <span>{{ emp.department }}</span>
                    </div>
                    <div class="hr-hstack" style="justify-content: space-between; font-size: 12px; margin-top: 6px;">
                        <span class="hr-muted">Remun.</span>
                        <span class="hr-mono">{{ emp.basicSalary | hrCurrency }}</span>
                    </div>
                    <div style="margin-top: 12px;">
                        <span class="hr-badge" [class.success]="getComputedStatus(emp) === 'Vigente'" [class.warning]="getComputedStatus(emp) === 'Por vencer'" [class.danger]="getComputedStatus(emp) === 'Vencido'">
                            {{ getComputedStatus(emp) }}
                        </span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Pagination info -->
        <div class="hr-hstack" style="margin-top: 16px; justify-content: space-between; font-size: 13px; color: var(--text-soft);">
            <div>Mostrando 1–{{ filteredEmployees().length }} de {{ filteredEmployees().length }}</div>
            <div class="hr-hstack">
                <button class="hr-btn hr-btn-sm" disabled>Anterior</button>
                <span class="hr-mono">1 / 1</span>
                <button class="hr-btn hr-btn-sm" disabled>Siguiente</button>
            </div>
        </div>
    `
})
export class EmployeeListComponent implements OnInit {
    private readonly employeeService = inject(EmployeeService);

    readonly employees = signal<Employee[]>([]);
    readonly viewMode = signal<'table' | 'cards'>('table');
    readonly searchQuery = signal<string>('');
    readonly selectedDept = signal<string>('Todos');
    readonly selectedStatus = signal<string>('Todos');

    // Extraer lista única de departamentos
    readonly departments = computed(() => {
        const list = this.employees();
        return Array.from(new Set(list.map((e) => e.department).filter(Boolean)));
    });

    // Colaboradores filtrados
    readonly filteredEmployees = computed(() => {
        let list = this.employees();
        const q = this.searchQuery().toLowerCase();
        const dept = this.selectedDept();
        const status = this.selectedStatus();

        if (q) {
            list = list.filter((e) =>
                e.fullName.toLowerCase().includes(q) ||
                e.dni.includes(q) ||
                e.position.toLowerCase().includes(q)
            );
        }

        if (dept !== 'Todos') {
            list = list.filter((e) => e.department === dept);
        }

        if (status !== 'Todos') {
            list = list.filter((e) => this.getComputedStatus(e) === status);
        }

        return list;
    });

    ngOnInit(): void {
        this.loadEmployees();
    }

    async loadEmployees(): Promise<void> {
        try {
            // Obtener colaboradores del tenant (por simplicidad jalamos lista extendida de 100)
            const response = await this.employeeService.getEmployees(undefined, undefined, 1, 100);
            this.employees.set(response.data);
        } catch (err) {
            console.error('Error al cargar colaboradores', err);
        }
    }

    setViewMode(mode: 'table' | 'cards'): void {
        this.viewMode.set(mode);
    }

    onSearch(event: Event): void {
        const val = (event.target as HTMLInputElement).value;
        this.searchQuery.set(val.trim());
    }

    onDeptFilter(event: Event): void {
        const val = (event.target as HTMLSelectElement).value;
        this.selectedDept.set(val);
    }

    onStatusFilter(event: Event): void {
        const val = (event.target as HTMLSelectElement).value;
        this.selectedStatus.set(val);
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

    getComputedStatus(emp: Employee): 'Vigente' | 'Por vencer' | 'Vencido' {
        // Si no tiene contrato activo, se asume Indeterminado -> Vigente
        if (!emp.activeContract) return 'Vigente';
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

    importData(): void {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.csv';
        input.onchange = async (event: any) => {
            const file = event.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = async (e: any) => {
                const text = e.target.result;
                const lines = text.split('\n');
                let count = 0;
                
                // Skip header line
                for (let i = 1; i < lines.length; i++) {
                    const line = lines[i].trim();
                    if (!line) continue;
                    
                    // Simple CSV parser
                    const cols = line.split(',').map((col: string) => col.replace(/^"|"$/g, '').trim());
                    if (cols.length < 6) continue;
                    
                    const payload = {
                        dni: cols[0],
                        firstName: cols[1],
                        lastName: cols[2],
                        position: cols[3],
                        phone: cols[4] || null,
                        email: cols[5],
                        address: cols[6] || null,
                        district: cols[7] || null,
                        province: cols[8] || null,
                        department: cols[9] || null,
                        ubigeoCode: cols[10] || null,
                        basicSalary: cols[11] ? parseFloat(cols[11]) : 0,
                    };
                    
                    try {
                        await this.employeeService.createEmployee(payload);
                        count++;
                    } catch (err) {
                        console.error('Error importing row', err);
                    }
                }
                
                if (count > 0) {
                    alert(`Importación masiva completada con éxito. Se registraron ${count} colaboradores.`);
                    await this.loadEmployees();
                } else {
                    alert('No se pudieron importar registros. Verifique el formato del archivo CSV.');
                }
            };
            reader.readAsText(file);
        };
        input.click();
    }

    exportData(): void {
        const data = this.employees();
        if (data.length === 0) {
            alert('No hay colaboradores registrados para exportar.');
            return;
        }
        let csv = '\ufeff'; // BOM to support Spanish accents in Excel
        csv += 'DNI,Nombres,Apellidos,Puesto,Celular,Correo,Dirección,Distrito,Provincia,Departamento,Ubigeo,Sueldo\n';
        data.forEach(e => {
            csv += `"${e.dni}","${e.firstName}","${e.lastName}","${e.position}","${e.phone || ''}","${e.email}","${e.address || ''}","${e.district || ''}","${e.province || ''}","${e.department || ''}","${e.ubigeoCode || ''}",${e.basicSalary || 0}\n`;
        });
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'listado_colaboradores.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }

    printBatchQrs(): void {
        const list = this.filteredEmployees().filter(emp => emp.qrCodeToken);
        if (list.length === 0) {
            alert('No hay colaboradores con códigos QR para exportar en este lote.');
            return;
        }

        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            alert('Por favor habilita las ventanas emergentes (popups) para exportar el lote.');
            return;
        }

        const companyName = 'Constructora Norte S.A.C.';

        const cardsHtml = list.map(emp => `
            <div class="badge-card">
                <div class="badge-header">
                    <div class="badge-logo">RH</div>
                    <div class="badge-brand">
                        <span class="company-name">${companyName}</span>
                        <span class="badge-tag">CREDENCIAL ASISTENCIA</span>
                    </div>
                </div>
                <div class="badge-body">
                    <img class="qr-img" src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${emp.qrCodeToken}" alt="QR" />
                    <div class="emp-name">${emp.firstName} ${emp.lastName}</div>
                    <div class="emp-pos">${emp.position}</div>
                </div>
                <div class="badge-footer">
                    Token: ${emp.qrCodeToken}
                </div>
            </div>
        `).join('');

        printWindow.document.write(`
            <html>
                <head>
                    <title>Credenciales QR - Lote</title>
                    <style>
                        body {
                            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                            background: #f8fafc;
                            margin: 0;
                            padding: 20px;
                            color: #1e293b;
                        }
                        .print-header {
                            margin-bottom: 24px;
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                            border-bottom: 2px solid #e2e8f0;
                            padding-bottom: 12px;
                        }
                        .print-header h1 {
                            font-size: 20px;
                            margin: 0;
                        }
                        .print-btn {
                            background: #06b6d4;
                            color: white;
                            border: none;
                            padding: 8px 16px;
                            border-radius: 6px;
                            font-weight: 600;
                            cursor: pointer;
                        }
                        .badges-grid {
                            display: grid;
                            grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
                            gap: 20px;
                        }
                        .badge-card {
                            background: white;
                            border: 1px solid #cbd5e1;
                            border-radius: 12px;
                            padding: 16px;
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            text-align: center;
                            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
                            position: relative;
                            page-break-inside: avoid;
                        }
                        .badge-header {
                            display: flex;
                            align-items: center;
                            gap: 10px;
                            width: 100%;
                            border-bottom: 1px solid #e2e8f0;
                            padding-bottom: 8px;
                            margin-bottom: 12px;
                            text-align: left;
                        }
                        .badge-logo {
                            width: 32px;
                            height: 32px;
                            background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
                            color: white;
                            font-weight: 800;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            border-radius: 6px;
                            font-size: 14px;
                        }
                        .badge-brand {
                            display: flex;
                            flex-direction: column;
                        }
                        .company-name {
                            font-size: 11px;
                            font-weight: 700;
                            color: #475569;
                            text-transform: uppercase;
                        }
                        .badge-tag {
                            font-size: 8px;
                            font-weight: 700;
                            letter-spacing: 0.5px;
                            color: #94a3b8;
                        }
                        .qr-img {
                            width: 150px;
                            height: 150px;
                            margin-bottom: 12px;
                            display: block;
                            border: 1px solid #e2e8f0;
                            padding: 4px;
                            border-radius: 8px;
                        }
                        .emp-name {
                            font-size: 15px;
                            font-weight: 700;
                            color: #0f172a;
                            margin-bottom: 2px;
                        }
                        .emp-pos {
                            font-size: 12px;
                            color: #64748b;
                        }
                        .badge-footer {
                            margin-top: 12px;
                            font-size: 9px;
                            font-family: monospace;
                            color: #94a3b8;
                            border-top: 1px dashed #e2e8f0;
                            width: 100%;
                            padding-top: 6px;
                        }
                        @media print {
                            .print-header {
                                display: none;
                            }
                            body {
                                background: white;
                                padding: 0;
                            }
                            .badge-card {
                                box-shadow: none;
                                border-color: #94a3b8;
                            }
                        }
                    </style>
                </head>
                <body>
                    <div class="print-header">
                        <h1>Imprimir Lote de Credenciales QR (${list.length})</h1>
                        <button class="print-btn" onclick="window.print()">Imprimir / Guardar PDF</button>
                    </div>
                    <div class="badges-grid">
                        ${cardsHtml}
                    </div>
                    <script>
                        window.onload = function() {
                            setTimeout(function() { window.print(); }, 500);
                        };
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
    }
}
