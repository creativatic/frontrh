import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
    selector: 'app-empty',
    standalone: true,
    imports: [CommonModule],
    template: `
        <div class="hr-card" style="padding: 40px; text-align: center; max-width: 600px; margin: 40px auto;">
            <div style="font-size: 48px; color: var(--text-mute); margin-bottom: 20px;">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" style="margin: 0 auto;">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="16" x2="12" y2="12"/>
                    <line x1="12" y1="8" x2="12.01" y2="8"/>
                </svg>
            </div>
            <h2 class="hr-page-title" style="margin-bottom: 12px;">Módulo en Construcción</h2>
            <p class="hr-soft" style="font-size: 14px; margin-bottom: 24px; line-height: 1.6;">
                El módulo de <strong>{{ moduleName() }}</strong> se encuentra planificado para la siguiente fase de desarrollo de Creativa TIC.
            </p>
            <button class="hr-btn hr-btn-primary" (click)="goBack()">
                Regresar al Inicio
            </button>
        </div>
    `
})
export class Empty {
    private readonly router = inject(Router);

    moduleName(): string {
        const url = this.router.url;
        if (url.includes('asistencia')) return 'Control de Asistencia y Marcaciones';
        if (url.includes('vacaciones')) return 'Gestión de Vacaciones, Licencias y Faltas';
        if (url.includes('reportes')) return 'Planillas de Pago y Reportes Operativos';
        if (url.includes('configuracion')) return 'Configuración del Sistema y Tenant';
        return 'Módulo General';
    }

    goBack(): void {
        void this.router.navigateByUrl('/');
    }
}
