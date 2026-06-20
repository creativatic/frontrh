import { Routes } from '@angular/router';
import { VacationCalendarComponent } from './components/vacation-calendar.component';

export const VACATIONS_ROUTES: Routes = [
  {
    path: '',
    component: VacationCalendarComponent
  }
];
