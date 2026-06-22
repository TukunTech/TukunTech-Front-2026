import { Routes } from '@angular/router';
import { authRoutes } from './features/auth/auth-routes';
import { caregiverSubscriptionGuard, patientSubscriptionGuard } from './core/subscription/subscription-access.guard';

export const routes: Routes = [
  ...authRoutes,

  {
    path: 'patient',
    canActivate: [patientSubscriptionGuard],
    loadChildren: () =>
      import('./features/patient/patient-routes')
        .then(m => m.patientRoutes)
  },

  {
    path: 'caregiver',
    canActivate: [caregiverSubscriptionGuard],
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
    loadComponent: () =>
      import('./shared/pages/not-found/not-found').then(m => m.NotFound)
  }
];
