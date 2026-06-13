import { Routes } from '@angular/router';

export const adminRoutes: Routes = [
  {
    path: '',
    redirectTo: 'security-audit',
    pathMatch: 'full'
  },
  {
    path: 'security-audit',
    loadComponent: () =>
      import('./pages/security-audit/security-audit').then(m => m.SecurityAudit)
  },
  {
    path: 'devices',
    loadComponent: () =>
      import('./pages/devices/devices').then(m => m.Devices)
  },
  {
    path: 'subscriptions',
    loadComponent: () =>
      import('./pages/subscriptions/subscriptions').then(m => m.Subscriptions)
  },
  {
    path: 'support-tickets',
    loadComponent: () =>
      import('./pages/support-tickets/support-tickets').then(m => m.SupportTickets)
  },
  {
    path: 'analytics',
    loadComponent: () =>
      import('./pages/analytics/analytics').then(m => m.Analytics)
  },
  {
    path: 'settings',
    loadComponent: () =>
      import('./pages/settings/settings').then(m => m.Settings)
  }
];
