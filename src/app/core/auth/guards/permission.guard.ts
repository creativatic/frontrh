import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const permissionGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    return router.createUrlTree(['/auth/login']);
  }

  const requiredPermission = route.data?.['permission'];

  if (!requiredPermission) {
    return true;
  }

  if (authService.hasPermission(requiredPermission)) {
    return true;
  }

  console.warn(`Usuario no cuenta con el permiso requerido: ${requiredPermission}. Redireccionando.`);
  
  const role = (authService.user()?.role ?? '').toUpperCase();
  if (role === 'GUARDIA' && state.url.includes('/asistencia/scanner')) {
    // Si un guardia es redirigido aquí pero no tiene permiso, lo mandamos a notfound para romper el bucle infinito
    return router.createUrlTree(['/notfound']);
  }

  return router.createUrlTree(['/']);
};
