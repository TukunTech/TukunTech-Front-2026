import { Routes } from '@angular/router';

export const caregiverRoutes: Routes = [
  {
    path: '',
    redirectTo: 'vital-signs',
    pathMatch: 'full'
  },
  {
    path: 'vital-signs',
    loadComponent: () =>
      import('./pages/vital-signs/vital-signs').then(m => m.VitalSigns)
  },
  {
    path: 'device',
    loadComponent: () =>
      import('./pages/device/device').then(m => m.Device)
  },
  {
    path: 'history',
    loadComponent: () =>
      import('./pages/history/history').then(m => m.History)
  },
  {
    path: 'profile',
    loadComponent: () =>
      import('./pages/profile/profile').then(m => m.Profile)
  },
  {
    path: 'support',
    loadComponent: () =>
      import('./pages/support/support').then(m => m.Support)
  },
  {
    path: 'settings',
    loadComponent: () =>
      import('./pages/settings/settings').then(m => m.Settings)
  }
];
