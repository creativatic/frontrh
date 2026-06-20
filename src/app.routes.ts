import { Routes } from '@angular/router';
import { AppLayout } from './app/layout/component/app.layout';
import { Dashboard } from './app/pages/dashboard/dashboard';
import { Notfound } from './app/pages/notfound/notfound';
import { Empty } from './app/pages/empty/empty';
import { authGuard, guestGuard } from './app/core/auth/guards/auth.guard';
import { roleGuard } from './app/core/auth/guards/role.guard';

export const appRoutes: Routes = [
    {
        path: '',
        component: AppLayout,
        canActivate: [authGuard],
        canActivateChild: [roleGuard],
        children: [
            { path: '', component: Dashboard },
            {
                path: 'contratos',
                loadChildren: () => import('./app/features/contracts/contracts.routes').then((m) => m.CONTRACTS_ROUTES)
            },
            {
                path: 'colaboradores',
                loadChildren: () => import('./app/features/employees/employees.routes').then((m) => m.EMPLOYEES_ROUTES)
            },
            {
                path: 'asistencia',
                loadChildren: () => import('./app/features/attendance/attendance.routes').then((m) => m.ATTENDANCE_ROUTES)
            },
            {
                path: 'vacaciones',
                loadChildren: () => import('./app/features/vacations/vacations.routes').then((m) => m.VACATIONS_ROUTES)
            },
            {
                path: 'reportes',
                loadChildren: () => import('./app/features/reports/reports.routes').then((m) => m.REPORTS_ROUTES)
            },
            {
                path: 'configuracion',
                component: Empty
            }
        ]
    },
    { path: 'notfound', component: Notfound },
    {
        path: 'auth',
        canActivate: [guestGuard],
        loadChildren: () => import('./app/pages/auth/auth.routes')
    },
    { path: '**', redirectTo: '/notfound' }
];
