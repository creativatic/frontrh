import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ContractService } from '../../../shared/services/contract.service';
import { Contract } from '../../../shared/models/hr.models';
import { HrCurrencyPipe } from '../../../shared/pipes/hr-currency.pipe';
import { PeDatePipe } from '../../../shared/pipes/pe-date.pipe';

@Component({
    selector: 'app-contract-list',
    standalone: true,
    imports: [CommonModule, RouterModule, HrCurrencyPipe, PeDatePipe],
    template: `
        <div class="hr-page-header">
            <div>
                <h1 class="hr-page-title">Contratos</h1>
                <p class="hr-page-sub">Conforme al TUO del D. Leg. N° 728 · {{ contracts().length }} contratos en el sistema</p>
            </div>
            <div class="hr-page-actions">
                <button class="hr-btn" (click)="exportPdf()">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="7 10 12 15 17 10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                    Exportar PDF
                </button>
                <a routerLink="nuevo" class="hr-btn hr-btn-primary">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19"/>
                        <line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                    Nuevo contrato
                </a>
            </div>
        </div>

        <!-- Filters -->
        <div class="hr-filters">
            <button class="hr-chip" [class.active]="filter() === 'Todos'" (click)="setFilter('Todos')">
                Todos <span style="opacity: 0.6; margin-left: 4px;">{{ counts().all }}</span>
            </button>
            <button class="hr-chip" [class.active]="filter() === 'Vigentes'" (click)="setFilter('Vigentes')">
                Vigentes <span style="opacity: 0.6; margin-left: 4px;">{{ counts().active }}</span>
            </button>
            <button class="hr-chip" [class.active]="filter() === 'Por vencer'" (click)="setFilter('Por vencer')">
                Por vencer <span style="opacity: 0.6; margin-left: 4px;">{{ counts().warning }}</span>
            </button>
            <button class="hr-chip" [class.active]="filter() === 'Vencidos'" (click)="setFilter('Vencidos')">
                Vencidos <span style="opacity: 0.6; margin-left: 4px;">{{ counts().expired }}</span>
            </button>

            <div class="hr-spacer"></div>

            <div class="hr-search-input">
                <span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="11" cy="11" r="7"/>
                        <path d="m20 20-3.5-3.5"/>
                    </svg>
                </span>
                <input placeholder="Buscar contrato..." (input)="onSearch($event)"/>
            </div>
        </div>

        <!-- Table -->
        <div class="hr-card hr-card-flush">
            <table class="hr-tbl">
                <thead>
                    <tr>
                        <th>Código</th>
                        <th>Colaborador</th>
                        <th>Modalidad</th>
                        <th>Inicio</th>
                        <th>Término</th>
                        <th>Duración</th>
                        <th>Estado</th>
                        <th class="num">Remun.</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    <tr *ngFor="let item of filteredContracts(); let idx = index" style="cursor: pointer;" [routerLink]="['/colaboradores']">
                        <td class="hr-mono" style="font-size: 12.5px;">CTR-{{ getYear(item.startDate) }}-{{ formatCode(idx + 1) }}</td>
                        <td>
                            <div class="hr-row-emp">
                                <span class="hr-emp-avatar" [style.background]="getAvatarColor(item.employee?.fullName)">
                                    {{ getInitials(item.employee?.fullName) }}
                                </span>
                                <div>
                                    <div class="hr-emp-name">{{ item.employee?.fullName }}</div>
                                    <div class="hr-emp-id">{{ item.employee?.position }}</div>
                                </div>
                            </div>
                        </td>
                        <td>
                            <div style="font-size: 13px;">{{ item.nature }}</div>
                            <div *ngIf="item.modality" style="font-size: 11px; color: var(--text-mute);">{{ item.modality }}</div>
                        </td>
                        <td class="hr-mono" style="font-size: 12.5px;">{{ item.startDate | peDate }}</td>
                        <td class="hr-mono" style="font-size: 12.5px;">{{ item.endDate ? (item.endDate | peDate) : '—' }}</td>
                        <td class="hr-soft" style="font-size: 13px;">{{ getDuration(item.startDate, item.endDate) }}</td>
                        <td>
                            <span class="hr-badge" [class.success]="getComputedStatus(item) === 'Vigente'" [class.warning]="getComputedStatus(item) === 'Por vencer'" [class.danger]="getComputedStatus(item) === 'Vencido'">
                                {{ getComputedStatus(item) }}
                            </span>
                        </td>
                        <td class="num">{{ item.salary | hrCurrency }}</td>
                        <td class="action-cell" (click)="$event.stopPropagation()">
                            <button class="hr-btn hr-btn-ghost hr-btn-icon" (click)="downloadPdf(item.id)">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                    <polyline points="7 10 12 15 17 10"/>
                                    <line x1="12" y1="15" x2="12" y2="3"/>
                                </svg>
                            </button>
                        </td>
                    </tr>
                    <tr *ngIf="filteredContracts().length === 0">
                        <td colspan="9" class="hr-soft" style="text-align: center; height: 120px;">
                            No se encontraron contratos con los filtros aplicados.
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    `
})
export class ContractListComponent implements OnInit {
    private readonly contractService = inject(ContractService);

    readonly contracts = signal<Contract[]>([]);
    readonly filter = signal<string>('Todos');
    readonly searchQuery = signal<string>('');

    // Conteo para los chips
    readonly counts = computed(() => {
        const list = this.contracts();
        return {
            all: list.length,
            active: list.filter((c) => this.getComputedStatus(c) === 'Vigente').length,
            warning: list.filter((c) => this.getComputedStatus(c) === 'Por vencer').length,
            expired: list.filter((c) => this.getComputedStatus(c) === 'Vencido').length
        };
    });

    // Contratos filtrados por buscador y por chips
    readonly filteredContracts = computed(() => {
        let list = this.contracts();
        const f = this.filter();
        const q = this.searchQuery().toLowerCase();

        // 1. Filtrar por chip de estado
        if (f === 'Vigentes') {
            list = list.filter((c) => this.getComputedStatus(c) === 'Vigente');
        } else if (f === 'Por vencer') {
            list = list.filter((c) => this.getComputedStatus(c) === 'Por vencer');
        } else if (f === 'Vencidos') {
            list = list.filter((c) => this.getComputedStatus(c) === 'Vencido');
        }

        // 2. Filtrar por búsqueda de colaborador
        if (q) {
            list = list.filter((c) => c.employee?.fullName.toLowerCase().includes(q) || c.employee?.dni.includes(q));
        }

        return list;
    });

    ngOnInit(): void {
        this.loadContracts();
    }

    async loadContracts(): Promise<void> {
        try {
            // Cargar todos los contratos del tenant (por simplicidad cargamos una lista extendida)
            const response = await this.contractService.getContracts(undefined, undefined, undefined, 1, 100);
            this.contracts.set(response.data);
        } catch (err) {
            console.error('Error al cargar contratos', err);
        }
    }

    setFilter(val: string): void {
        this.filter.set(val);
    }

    onSearch(event: Event): void {
        const val = (event.target as HTMLInputElement).value;
        this.searchQuery.set(val.trim());
    }

    getYear(dateStr: string): string {
        return dateStr ? dateStr.split('-')[0] : '2026';
    }

    formatCode(num: number): string {
        return num.toString().padStart(4, '0');
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

    getDuration(startStr: string, endStr?: string | null): string {
        if (!endStr) return 'Indef.';
        const start = new Date(startStr + 'T00:00:00');
        const end = new Date(endStr + 'T00:00:00');
        const diffMonths = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
        return `${diffMonths} meses`;
    }

    getComputedStatus(item: Contract): 'Vigente' | 'Por vencer' | 'Vencido' {
        if (item.status === 'expired' || item.status === 'terminated') {
            return 'Vencido';
        }
        // Si es activo, comprobar días restantes
        const days = this.getDaysRemaining(item.endDate);
        if (days !== null && days <= 30 && days >= 0) {
            return 'Por vencer';
        }
        if (days !== null && days < 0) {
            return 'Vencido';
        }
        return 'Vigente';
    }

    downloadPdf(id: string): void {
        this.contractService.downloadContractPdf(id);
    }

    exportPdf(): void {
        const data = this.contracts();
        if (data.length === 0) {
            alert('No hay contratos registrados para exportar.');
            return;
        }

        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            alert('Por favor habilita las ventanas emergentes (popups) para exportar el reporte.');
            return;
        }

        let rowsHtml = '';
        data.forEach(c => {
            const empName = c.employee ? `${c.employee.firstName} ${c.employee.lastName}` : 'N/A';
            const empDni = c.employee ? c.employee.dni : 'N/A';
            const empPos = c.employee ? c.employee.position : 'N/A';
            const salaryFormatted = new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(c.salary);
            rowsHtml += `
                <tr>
                    <td>${empName}</td>
                    <td>${empDni}</td>
                    <td>${empPos}</td>
                    <td>${c.nature}</td>
                    <td>${salaryFormatted}</td>
                    <td>${c.startDate}</td>
                    <td>${c.endDate || 'Indefinido'}</td>
                    <td>${c.status === 'active' ? 'Vigente' : 'Inactivo'}</td>
                </tr>
            `;
        });

        printWindow.document.write(`
            <html>
            <head>
                <title>Reporte de Contratos - NOVARIX S.A.C.</title>
                <style>
                    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 20px; color: #333; }
                    h1 { font-size: 20px; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 0.5px; }
                    p { font-size: 12px; margin-bottom: 20px; color: #666; }
                    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                    th, td { border: 1px solid #ddd; padding: 8px 10px; text-align: left; font-size: 11px; }
                    th { background-color: #f5f5f5; font-weight: bold; text-transform: uppercase; font-size: 10px; }
                    tr:nth-child(even) { background-color: #fafafa; }
                </style>
            </head>
            <body>
                <h1>Reporte de Contratos</h1>
                <p>NOVARIX S.A.C. &middot; Generado el: ${new Date().toLocaleDateString('es-PE')} &middot; Total contratos: ${data.length}</p>
                <table>
                    <thead>
                        <tr>
                            <th>Colaborador</th>
                            <th>DNI</th>
                            <th>Puesto</th>
                            <th>Naturaleza</th>
                            <th>Sueldo</th>
                            <th>Fecha Inicio</th>
                            <th>Fecha Fin</th>
                            <th>Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        \${rowsHtml}
                    </tbody>
                </table>
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
}
