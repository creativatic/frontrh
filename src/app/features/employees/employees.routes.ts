import { Routes } from '@angular/router';

export const EMPLOYEES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/employee-list.component').then((m) => m.EmployeeListComponent)
  },
  {
    path: ':id',
    loadComponent: () => import('./components/employee-detail.component').then((m) => m.EmployeeDetailComponent)
  }
];
