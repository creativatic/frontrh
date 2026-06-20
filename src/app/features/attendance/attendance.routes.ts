import { Routes } from '@angular/router';
import { AttendanceListComponent } from './components/attendance-list.component';
import { AttendanceScannerComponent } from './components/attendance-scanner.component';

export const ATTENDANCE_ROUTES: Routes = [
  {
    path: '',
    component: AttendanceListComponent
  },
  {
    path: 'scanner',
    component: AttendanceScannerComponent
  },
  {
    path: ':employeeId',
    loadComponent: () => import('./components/attendance-detail.component').then((m) => m.AttendanceDetailComponent)
  }
];

