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
    path: 'caregiver',
    loadChildren: () =>
      import('./features/caregiver/caregiver-routes')
        .then(m => m.caregiverRoutes)
  },

  {
    path: 'carebridge',
    redirectTo: 'caregiver/vital-signs',
    pathMatch: 'full'
  },

  {
    path: 'admin',
    loadChildren: () =>
      import('./features/admin/admin-routes')
        .then(m => m.adminRoutes)
  },

  {
    path: '**',
    redirectTo: ''
  }
];
