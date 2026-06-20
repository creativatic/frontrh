import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    return router.createUrlTree(['/auth/login']);
  }

  const role = (auth.user()?.role ?? '').toUpperCase();
  const isScannerRoute = state.url.includes('/asistencia/scanner');

  if (role === 'GUARDIA') {
    if (isScannerRoute) {
      return true;
    }
    // Redirect guard to scanner
    return router.createUrlTree(['/asistencia/scanner']);
  }

  // Non-guard users can access any route
  return true;
};
