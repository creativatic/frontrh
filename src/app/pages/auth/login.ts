import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/services/auth.service';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [FormsModule],
    template: `
        <div class="login-shell">
            <!-- Aside con gradiente y pills -->
            <aside class="login-aside">
                <div class="login-brand">
                    <div class="logo">RH</div>
                    <span>Sistema HR</span>
                </div>

                <h1>Gestión laboral conforme al <em>TUO D. Leg. N° 728</em>.</h1>
                <p class="login-lead">
                    Contratos, planillas, asistencia y vacaciones para empresas peruanas,
                    en una sola plataforma multi-empresa.
                </p>

                <div class="login-pill-row">
                    <span class="login-pill">Contratos · 10 modalidades</span>
                    <span class="login-pill">UBIGEO INEI</span>
                    <span class="login-pill">AFP / ONP</span>
                    <span class="login-pill">Multi-tenant</span>
                </div>

                <div class="login-foot">
                    <span>v0.1.0 · entorno desarrollo</span>
                    <span>Lima, Perú · GMT-5</span>
                </div>
            </aside>

            <!-- Form -->
            <main class="login-main">
                <div class="login-card">
                    <h2>Inicia sesión</h2>
                    <p class="login-sub">Acceso al portal administrativo de Recursos Humanos.</p>

                    <form class="login-form" (ngSubmit)="onSubmit()" #f="ngForm">
                        <div>
                            <label for="email">Correo corporativo</label>
                            <div class="field-input">
                                <span class="icon" aria-hidden="true">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                                         stroke="currentColor" stroke-width="1.75"
                                         stroke-linecap="round" stroke-linejoin="round">
                                        <rect x="3" y="5" width="18" height="14" rx="2"/>
                                        <path d="m3 7 9 6 9-6"/>
                                    </svg>
                                </span>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="admin@rrhh.local"
                                    autocomplete="email"
                                    required
                                    [(ngModel)]="email" />
                            </div>
                        </div>

                        <div>
                            <label for="password">Contraseña</label>
                            <div class="field-input">
                                <span class="icon" aria-hidden="true">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                                         stroke="currentColor" stroke-width="1.75"
                                         stroke-linecap="round" stroke-linejoin="round">
                                        <rect x="4" y="11" width="16" height="10" rx="2"/>
                                        <path d="M8 11V8a4 4 0 0 1 8 0v3"/>
                                    </svg>
                                </span>
                                <input
                                    id="password"
                                    name="password"
                                    [type]="showPwd() ? 'text' : 'password'"
                                    placeholder="Tu contraseña"
                                    autocomplete="current-password"
                                    required
                                    minlength="8"
                                    [(ngModel)]="password" />
                                <span
                                    class="icon action"
                                    role="button"
                                    aria-label="Mostrar/ocultar contraseña"
                                    (click)="showPwd.set(!showPwd())">
                                    @if (showPwd()) {
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                                             stroke="currentColor" stroke-width="1.75"
                                             stroke-linecap="round" stroke-linejoin="round">
                                            <path d="M3 3l18 18"/>
                                            <path d="M10.5 10.5a3 3 0 0 0 4 4"/>
                                            <path d="M9.9 5.1A10 10 0 0 1 22 12s-1.5 2.5-4.1 4.5"/>
                                            <path d="M6.6 6.6C3.6 8.5 2 12 2 12s4 7 10 7c1.7 0 3.2-.5 4.5-1.2"/>
                                        </svg>
                                    } @else {
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                                             stroke="currentColor" stroke-width="1.75"
                                             stroke-linecap="round" stroke-linejoin="round">
                                            <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/>
                                            <circle cx="12" cy="12" r="3"/>
                                        </svg>
                                    }
                                </span>
                            </div>
                        </div>

                        <div class="options">
                            <label class="check">
                                <input type="checkbox" name="remember" [(ngModel)]="remember" />
                                <span>Mantener sesión</span>
                            </label>
                            <a href="javascript:void(0)" (click)="onForgot()">Olvidé mi contraseña</a>
                        </div>

                        @if (errorMessage()) {
                            <div class="login-error" role="alert">{{ errorMessage() }}</div>
                        }

                        <button type="submit" class="submit"
                                [disabled]="loading() || !email || !password">
                            @if (loading()) {
                                <span>Verificando…</span>
                            } @else {
                                <span>Ingresar</span>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                                     stroke="currentColor" stroke-width="1.75"
                                     stroke-linecap="round" stroke-linejoin="round">
                                    <path d="m9 6 6 6-6 6"/>
                                </svg>
                            }
                        </button>
                    </form>

                    <div class="login-divider">o</div>

                    <button class="login-sso" type="button" (click)="onSso()">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                             stroke="currentColor" stroke-width="1.75"
                             stroke-linecap="round" stroke-linejoin="round">
                            <path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6Z"/>
                            <path d="m9 12 2 2 4-4"/>
                        </svg>
                        Continuar con Microsoft 365
                    </button>

                    <p class="legal">
                        Al continuar aceptas la
                        <a href="javascript:void(0)">Política de Privacidad</a>.<br />
                        Tu sesión se protege con JWT.
                    </p>
                </div>
            </main>
        </div>
    `
})
export class Login {
    private readonly auth = inject(AuthService);
    private readonly router = inject(Router);

    email = '';
    password = '';
    remember = true;

    readonly loading = signal(false);
    readonly errorMessage = signal<string | null>(null);
    readonly showPwd = signal(false);

    async onSubmit(): Promise<void> {
        if (this.loading()) return;
        this.errorMessage.set(null);
        this.loading.set(true);
        try {
            await this.auth.login({
                email: this.email.trim(),
                password: this.password
            });
            await this.router.navigateByUrl('/');
        } catch (err: any) {
            const apiMessage = err?.error?.message;
            this.errorMessage.set(
                apiMessage ?? 'No se pudo iniciar sesión. Verifica tu correo y contraseña.'
            );
        } finally {
            this.loading.set(false);
        }
    }

    onSso(): void {
        this.errorMessage.set('SSO con Microsoft 365 aún no está configurado.');
    }

    onForgot(): void {
        this.errorMessage.set('Recuperación de contraseña aún no implementada.');
    }
}
