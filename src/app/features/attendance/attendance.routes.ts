import { Routes } from '@angular/router';
import { AttendanceListComponent } from './components/attendance-list.component';
import { AttendanceScannerComponent } from './components/attendance-scanner.component';
import { permissionGuard } from '../../core/auth/guards/permission.guard';

export const ATTENDANCE_ROUTES: Routes = [
  {
    path: '',
    canActivate: [permissionGuard],
    data: { permission: 'ver_asistencia' },
    component: AttendanceListComponent
  },
  {
    path: 'scanner',
    canActivate: [permissionGuard],
    data: { permission: 'acceso_scanner' },
    component: AttendanceScannerComponent
  },
  {
    path: ':employeeId',
    canActivate: [permissionGuard],
    data: { permission: 'ver_asistencia' },
    loadComponent: () => import('./components/attendance-detail.component').then((m) => m.AttendanceDetailComponent)
  }
];

