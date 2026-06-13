import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

import { AdminAnalyticsDashboard } from '../domain/admin-analytics';

@Injectable({ providedIn: 'root' })
export class AdminAnalyticsRepository {
  private readonly adminEmail = 'demo.admin@tukuntech.app';
  private readonly monthlyData: Record<string, AdminAnalyticsDashboard> = {
    '2026-06': {
      adminEmail: this.adminEmail,
      selectedMonth: '2026-06',
      availableMonths: [],
      metrics: [
        { id: 'users', labelKey: 'admin.analytics.metrics.users', value: '1,234', tone: 'neutral' },
        { id: 'subscriptions', labelKey: 'admin.analytics.metrics.subscriptions', value: '$700', tone: 'positive' },
        { id: 'canceled', labelKey: 'admin.analytics.metrics.canceled', value: '8', tone: 'warning' }
      ],
      usersChart: [
        { label: 'M1', value: 1190 },
        { label: 'M2', value: 1060 },
        { label: 'M3', value: 1160 },
        { label: 'M4', value: 820 },
        { label: 'M5', value: 1310 },
        { label: 'M6', value: 870 },
        { label: 'M7', value: 880 },
        { label: 'M8', value: 835 },
        { label: 'M9', value: 825 },
        { label: 'M10', value: 980 },
        { label: 'M11', value: 1120 },
        { label: 'M12', value: 1220 }
      ]
    },
    '2026-05': {
      adminEmail: this.adminEmail,
      selectedMonth: '2026-05',
      availableMonths: [],
      metrics: [
        { id: 'users', labelKey: 'admin.analytics.metrics.users', value: '1,180', tone: 'neutral' },
        { id: 'subscriptions', labelKey: 'admin.analytics.metrics.subscriptions', value: '$620', tone: 'positive' },
        { id: 'canceled', labelKey: 'admin.analytics.metrics.canceled', value: '5', tone: 'warning' }
      ],
      usersChart: [
        { label: 'M1', value: 900 },
        { label: 'M2', value: 960 },
        { label: 'M3', value: 1040 },
        { label: 'M4', value: 1010 },
        { label: 'M5', value: 1180 },
        { label: 'M6', value: 1090 }
      ]
    },
    '2026-04': {
      adminEmail: this.adminEmail,
      selectedMonth: '2026-04',
      availableMonths: [],
      metrics: [
        { id: 'users', labelKey: 'admin.analytics.metrics.users', value: '1,045', tone: 'neutral' },
        { id: 'subscriptions', labelKey: 'admin.analytics.metrics.subscriptions', value: '$540', tone: 'positive' },
        { id: 'canceled', labelKey: 'admin.analytics.metrics.canceled', value: '6', tone: 'warning' }
      ],
      usersChart: [
        { label: 'M1', value: 740 },
        { label: 'M2', value: 820 },
        { label: 'M3', value: 910 },
        { label: 'M4', value: 1045 }
      ]
    }
  };

  getDashboard(adminUserId: string, month = this.getCurrentMonthKey()): Observable<AdminAnalyticsDashboard> {
    const selectedMonth = this.monthlyData[month] ? month : this.getCurrentMonthKey();
    const dashboard = this.monthlyData[selectedMonth] ?? this.monthlyData['2026-06'];

    return of({
      ...dashboard,
      selectedMonth,
      availableMonths: this.getAvailableMonths(),
      metrics: dashboard.metrics.map(metric => ({ ...metric })),
      usersChart: dashboard.usersChart.map(item => ({ ...item }))
    });
  }

  private getAvailableMonths(): string[] {
    return Array.from(new Set([
      this.getCurrentMonthKey(),
      ...Object.keys(this.monthlyData)
    ])).sort((a, b) => b.localeCompare(a));
  }

  private getCurrentMonthKey(): string {
    return new Date().toISOString().slice(0, 7);
  }
}
