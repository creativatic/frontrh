import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AppTopbar } from './app.topbar';
import { AppSidebar } from './app.sidebar';
import { AuthService } from '../../core/auth/services/auth.service';

@Component({
    selector: 'app-layout',
    standalone: true,
    imports: [CommonModule, AppTopbar, AppSidebar, RouterModule],
    template: `
        <div class="hr-shell">
            <app-sidebar></app-sidebar>
            <div class="hr-main">
                <app-topbar></app-topbar>
                <div class="hr-content">
                    <router-outlet></router-outlet>
                </div>
            </div>
        </div>
    `
})
export class AppLayout implements OnInit {
    private readonly authService = inject(AuthService);

    ngOnInit(): void {
        // Cargar el perfil completo (incluyendo RUC y nombre del tenant)
        void this.authService.fetchCurrentUser();
    }
}
