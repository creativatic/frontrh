import { Injectable, signal } from '@angular/core';

export type Theme = 'light' | 'dark';
export type Density = 'compact' | 'normal' | 'cozy';

const THEME_KEY = 'hr.theme';
const DENSITY_KEY = 'hr.density';
const ACCENT_H_KEY = 'hr.accentH';

const DEFAULT_THEME: Theme = 'light';
const DEFAULT_DENSITY: Density = 'normal';
const DEFAULT_ACCENT_H = '250';

/**
 * Gestiona los tokens runtime del diseño:
 *   - tema (light/dark)
 *   - densidad (compact/normal/cozy)
 *   - hue del color de acento (oklch H)
 *
 * Persiste en localStorage para que la preferencia sobreviva el reload.
 * El index.html ya aplica los valores iniciales para evitar flash.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly _theme = signal<Theme>(this.readStored<Theme>(THEME_KEY, DEFAULT_THEME));
  private readonly _density = signal<Density>(
    this.readStored<Density>(DENSITY_KEY, DEFAULT_DENSITY),
  );
  private readonly _accentH = signal<string>(this.readStored(ACCENT_H_KEY, DEFAULT_ACCENT_H));

  readonly theme = this._theme.asReadonly();
  readonly density = this._density.asReadonly();
  readonly accentH = this._accentH.asReadonly();

  constructor() {
    this.apply();
  }

  setTheme(theme: Theme): void {
    this._theme.set(theme);
    localStorage.setItem(THEME_KEY, theme);
    this.apply();
  }

  toggleTheme(): void {
    this.setTheme(this._theme() === 'light' ? 'dark' : 'light');
  }

  setDensity(density: Density): void {
    this._density.set(density);
    localStorage.setItem(DENSITY_KEY, density);
    this.apply();
  }

  setAccentH(hue: string | number): void {
    const h = String(hue);
    this._accentH.set(h);
    localStorage.setItem(ACCENT_H_KEY, h);
    this.apply();
  }

  private apply(): void {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.setAttribute('data-theme', this._theme());
    root.setAttribute('data-density', this._density());
    root.style.setProperty('--accent-h', this._accentH());
  }

  private readStored<T extends string>(key: string, fallback: T): T {
    if (typeof window === 'undefined') return fallback;
    return (localStorage.getItem(key) as T | null) ?? fallback;
  }
}
