import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

@Component({
    selector: 'app-topbar',
    standalone: true,
    imports: [CommonModule, RouterModule],
    template: `
        <header class="hr-topbar">
            <!-- Breadcrumbs -->
            <div class="hr-crumb">
                <ng-container *ngFor="let crumb of crumbs(); let last = last">
                    <span [class.here]="last">{{ crumb }}</span>
                    <span *ngIf="!last" class="sep">/</span>
                </ng-container>
            </div>

            <!-- Search -->
            <div class="hr-topbar-search">
                <span style="display: inline-flex; align-items: center;">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="11" cy="11" r="7"/>
                        <path d="m20 20-3.5-3.5"/>
                    </svg>
                </span>
                <input placeholder="Buscar colaborador, DNI o contrato..."/>
                <span class="kbd">⌘ K</span>
            </div>

            <!-- Action Buttons -->
            <button class="hr-icon-btn" title="Ayuda">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="9"/>
                    <path d="M9.5 9.5a2.5 2.5 0 0 1 5 .5c0 1.5-2.5 2-2.5 3.5"/>
                    <circle cx="12" cy="17" r="0.5" fill="currentColor"/>
                </svg>
            </button>

            <button class="hr-icon-btn" title="Notificaciones">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9Z"/>
                    <path d="M10.5 21a2 2 0 0 0 3 0"/>
                </svg>
                <span class="dot"></span>
            </button>
        </header>
    `
})
export class AppTopbar {
    private readonly router = inject(Router);

    crumbs = computed(() => {
        const url = this.router.url;
        if (url === '/' || url === '/dashboard') {
            return ['Inicio'];
        }
        if (url.startsWith('/colaboradores')) {
            return ['Operación', 'Colaboradores'];
        }
        if (url.startsWith('/contratos')) {
            return ['Operación', 'Contratos'];
        }
        if (url.startsWith('/asistencia')) {
            return ['Operación', 'Asistencia'];
        }
        if (url.startsWith('/vacaciones')) {
            return ['Operación', 'Vacaciones y faltas'];
        }
        if (url.startsWith('/reportes')) {
            return ['Administración', 'Reportes'];
        }
        if (url.startsWith('/configuracion')) {
            return ['Administración', 'Configuración'];
        }
        return ['Sistema HR'];
    });
}
