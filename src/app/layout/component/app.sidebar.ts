import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/auth/services/auth.service';

@Component({
    selector: 'app-sidebar',
    standalone: true,
    imports: [CommonModule, RouterModule],
    template: `
        <aside class="hr-sidebar">
            <!-- Brand -->
            <div class="hr-sidebar-brand">
                <div class="logo">RH</div>
                <div>
                    <div class="title">Sistema HR</div>
                    <div class="sub">Recursos Humanos</div>
                </div>
            </div>

            <!-- Tenant / Empresa Switcher -->
            <div class="hr-sidebar-tenant">
                <div class="avatar">{{ companyInitials() }}</div>
                <div style="flex: 1; min-width: 0;">
                    <div class="name">{{ companyName() }}</div>
                    <div class="ruc">{{ companyRuc() }}</div>
                </div>
                <span class="muted" style="display: inline-flex; align-items: center;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                        <path d="m6 9 6 6 6-6"/>
                    </svg>
                </span>
            </div>

            <!-- Navigation -->
            <nav class="hr-sidebar-nav">
                <ng-container *ngIf="!isGuardia()">
                    <div class="hr-nav-group-label">Operación</div>
                    
                    <a class="hr-nav-item" routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">
                        <span class="icon">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M3 10.5 12 3l9 7.5"/>
                                <path d="M5 9.5V21h14V9.5"/>
                                <path d="M10 21v-6h4v6"/>
                            </svg>
                        </span>
                        <span>Inicio</span>
                    </a>

                    <a class="hr-nav-item" routerLink="/colaboradores" routerLinkActive="active">
                        <span class="icon">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="9" cy="8" r="3.5"/>
                                <path d="M2.5 20a6.5 6.5 0 0 1 13 0"/>
                                <path d="M16 11.5a3.5 3.5 0 0 0 0-7"/>
                                <path d="M21.5 20a5.5 5.5 0 0 0-4-5.3"/>
                            </svg>
                        </span>
                        <span>Colaboradores</span>
                    </a>

                    <a class="hr-nav-item" routerLink="/contratos" routerLinkActive="active">
                        <span class="icon">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M7 3h7l5 5v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"/>
                                <path d="M14 3v5h5"/>
                                <path d="M8 13h8"/>
                                <path d="M8 17h5"/>
                            </svg>
                        </span>
                        <span>Contratos</span>
                    </a>

                    <a class="hr-nav-item" routerLink="/asistencia" routerLinkActive="active">
                        <span class="icon">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="12" cy="12" r="9"/>
                                <path d="M12 7v5l3 2"/>
                            </svg>
                        </span>
                        <span>Asistencia</span>
                    </a>

                    <a class="hr-nav-item" routerLink="/vacaciones" routerLinkActive="active">
                        <span class="icon">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M13 8c0-3-2.5-5-5-5"/>
                                <path d="M13 8c0-3 2.5-5 5-5"/>
                                <path d="M13 8c-3 0-5 2-5 5"/>
                                <path d="M13 8c3 0 5 2 5 5"/>
                                <circle cx="13" cy="8" r="1.2"/>
                                <path d="M13 9v12"/>
                                <path d="M10 21h6"/>
                            </svg>
                        </span>
                        <span>Gestion de notifiaciones</span>
                    </a>

                    <div class="hr-nav-group-label">Administración</div>

                    <a class="hr-nav-item" routerLink="/reportes" routerLinkActive="active">
                        <span class="icon">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M4 20V8"/>
                                <path d="M10 20V4"/>
                                <path d="M16 20v-7"/>
                                <path d="M22 20H2"/>
                            </svg>
                        </span>
                        <span>Reportes</span>
                    </a>

                    <a class="hr-nav-item" routerLink="/configuracion" routerLinkActive="active">
                        <span class="icon">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="12" cy="12" r="3"/>
                                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"/>
                            </svg>
                        </span>
                        <span>Configuración</span>
                    </a>
                </ng-container>

                <ng-container *ngIf="isGuardia()">
                    <div class="hr-nav-group-label">Módulo Guardia</div>
                    <a class="hr-nav-item" routerLink="/asistencia/scanner" routerLinkActive="active">
                        <span class="icon">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                                <rect width="10" height="10" x="3" y="3" rx="2"/>
                                <rect width="6" height="6" x="5" y="5" rx="1"/>
                                <rect width="10" height="10" x="11" y="11" rx="2"/>
                                <rect width="6" height="6" x="13" y="13" rx="1"/>
                                <rect width="6" height="6" x="15" y="3" rx="1"/>
                                <rect width="6" height="6" x="3" y="15" rx="1"/>
                            </svg>
                        </span>
                        <span>Escanear QR</span>
                    </a>
                </ng-container>
            </nav>

            <!-- User -->
            <div class="hr-sidebar-user">
                <div class="avatar">{{ userInitials() }}</div>
                <div style="flex: 1; min-width: 0;">
                    <div class="name" [title]="userName()">{{ userName() }}</div>
                    <div class="role" [title]="userRole()">{{ userRole() }}</div>
                </div>
                <button class="hr-icon-btn" title="Cerrar sesión" (click)="onLogout()">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                        <path d="M16 17l5-5-5-5"/>
                        <path d="M21 12H9"/>
                    </svg>
                </button>
            </div>
        </aside>
    `
})
export class AppSidebar {
    private readonly authService = inject(AuthService);
    private readonly router = inject(Router);

    companyName = computed(() => this.authService.user()?.company?.name ?? 'Empresa Demo S.A.');
    companyRuc = computed(() => {
        const ruc = this.authService.user()?.company?.ruc;
        return ruc ? `RUC ${ruc}` : 'RUC 20601234567';
    });

    companyInitials = computed(() => {
        const name = this.companyName();
        return name
            .split(' ')
            .filter(Boolean)
            .slice(0, 2)
            .map((n) => n[0])
            .join('')
            .toUpperCase();
    });

    userName = computed(() => this.authService.user()?.name ?? 'María F. Quispe');
    userRole = computed(() => {
        const role = (this.authService.user()?.role ?? 'RRHH').toUpperCase();
        return role === 'ADMIN' ? 'Administrador' : role === 'RRHH' ? 'Administrador RR.HH.' : role === 'GUARDIA' ? 'Guardia de Seguridad' : 'Colaborador';
    });

    isGuardia = computed(() => {
        const role = (this.authService.user()?.role ?? '').toUpperCase();
        return role === 'GUARDIA';
    });

    userInitials = computed(() => {
        const name = this.userName();
        return name
            .split(' ')
            .filter(Boolean)
            .slice(0, 2)
            .map((n) => n[0])
            .join('')
            .toUpperCase();
    });

    onLogout(): void {
        this.authService.logout();
    }
}
