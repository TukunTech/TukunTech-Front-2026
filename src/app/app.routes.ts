import { Routes } from '@angular/router';
import { authRoutes } from './features/auth/auth-routes';

export const routes: Routes = [
  ...authRoutes,

  {
    path: 'patient',
    loadChildren: () =>
      import('./features/patient/patient-routes')
        .then(m => m.patientRoutes)
  },

  {
    path: '**',
    redirectTo: ''
  }
];
