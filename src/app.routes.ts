import { Routes } from '@angular/router';
import { AppLayout } from './app/layout/component/app.layout';
import { Dashboard } from './app/pages/dashboard/dashboard';
import { Notfound } from './app/pages/notfound/notfound';
import { Empty } from './app/pages/empty/empty';
import { authGuard, guestGuard } from './app/core/auth/guards/auth.guard';
import { roleGuard } from './app/core/auth/guards/role.guard';
import { permissionGuard } from './app/core/auth/guards/permission.guard';
import { ConfigurationComponent } from './app/features/configuration/components/configuration.component';

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
                canActivate: [permissionGuard],
                data: { permission: 'ver_contratos' },
                loadChildren: () => import('./app/features/contracts/contracts.routes').then((m) => m.CONTRACTS_ROUTES)
            },
            {
                path: 'colaboradores',
                canActivate: [permissionGuard],
                data: { permission: 'ver_colaboradores' },
                loadChildren: () => import('./app/features/employees/employees.routes').then((m) => m.EMPLOYEES_ROUTES)
            },
            {
                path: 'asistencia',
                loadChildren: () => import('./app/features/attendance/attendance.routes').then((m) => m.ATTENDANCE_ROUTES)
            },
            {
                path: 'vacaciones',
                canActivate: [permissionGuard],
                data: { permission: 'ver_asistencia' },
                loadChildren: () => import('./app/features/vacations/vacations.routes').then((m) => m.VACATIONS_ROUTES)
            },
            {
                path: 'reportes',
                canActivate: [permissionGuard],
                data: { permission: 'ver_reportes' },
                loadChildren: () => import('./app/features/reports/reports.routes').then((m) => m.REPORTS_ROUTES)
            },
            {
                path: 'configuracion',
                canActivate: [permissionGuard],
                data: { permission: 'configurar_sistema' },
                component: ConfigurationComponent
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
