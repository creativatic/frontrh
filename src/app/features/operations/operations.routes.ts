import { Routes } from '@angular/router';

export const OPERATIONS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/operations-dashboard.component').then((m) => m.OperationsDashboardComponent)
  }
];
