import { Routes } from '@angular/router';

export const CONTRACTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/contract-list.component').then((m) => m.ContractListComponent)
  },
  {
    path: 'nuevo',
    loadComponent: () => import('./components/contract-wizard.component').then((m) => m.ContractWizardComponent)
  }
];
