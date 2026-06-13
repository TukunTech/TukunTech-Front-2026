import { DashboardMenuItem } from '../../shared/components/dashboard-layout/dashboard-layout';

export const adminMenuItems: DashboardMenuItem[] = [
  { icon: 'bi-shield-lock', labelKey: 'sidebar.admin.securityAudit', route: '/admin/security-audit' },
  { icon: 'bi-cpu', labelKey: 'sidebar.admin.devices', route: '/admin/devices' },
  { icon: 'bi-gem', labelKey: 'sidebar.admin.subscriptions', route: '/admin/subscriptions' },
  { icon: 'bi-ticket-detailed', labelKey: 'sidebar.admin.supportTickets', route: '/admin/support-tickets' },
  { icon: 'bi-boxes', labelKey: 'sidebar.admin.analytics', route: '/admin/analytics' },
  { icon: 'bi-gear', labelKey: 'sidebar.admin.settings', route: '/admin/settings' }
];
