import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuthenticatedUser, LoginRequest, LoginResponse } from '../models/auth.models';

const TOKEN_STORAGE_KEY = 'rrhh.accessToken';
const USER_STORAGE_KEY = 'rrhh.user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly _token = signal<string | null>(this.readStoredToken());
  private readonly _user = signal<AuthenticatedUser | null>(this.readStoredUser());

  readonly token = this._token.asReadonly();
  readonly user = this._user.asReadonly();
  readonly isAuthenticated = computed(() => this._token() !== null);

  async login(payload: LoginRequest): Promise<void> {
    const response = await firstValueFrom(
      this.http.post<LoginResponse>(`${environment.apiUrl}/auth/login`, payload),
    );
    this.persistSession(response);
    // Cargar perfil completo con datos del tenant
    await this.fetchCurrentUser();
  }

  async fetchCurrentUser(): Promise<void> {
    if (!this.token()) return;
    try {
      const response = await firstValueFrom(
        this.http.get<{ user: AuthenticatedUser }>(`${environment.apiUrl}/auth/me`),
      );
      this._user.set(response.user);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(response.user));
    } catch {
      this.logout();
    }
  }

  logout(): void {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
    this._token.set(null);
    this._user.set(null);
    void this.router.navigateByUrl('/auth/login');
  }

  private persistSession(response: LoginResponse): void {
    localStorage.setItem(TOKEN_STORAGE_KEY, response.accessToken);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(response.user));
    this._token.set(response.accessToken);
    this._user.set(response.user);
  }

  private readStoredToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  }

  private readStoredUser(): AuthenticatedUser | null {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthenticatedUser;
    } catch {
      return null;
    }
  }
}
