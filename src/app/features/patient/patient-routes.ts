import { Routes } from '@angular/router';
import { Today } from './pages/today/today';

//rutass de rol paciente
export const patientRoutes: Routes = [
  {
    path: '',
    redirectTo: 'today',
    pathMatch: 'full'
  },
  {
    path: 'today',
    component: Today
  },
  {
    path: 'device',
    loadComponent: () =>
      import('./pages/device/device')
        .then(m => m.Device)
  },
  {
    path: 'history',
    loadComponent: () =>
      import('./pages/history/history').then(m => m.History)
  }
];
