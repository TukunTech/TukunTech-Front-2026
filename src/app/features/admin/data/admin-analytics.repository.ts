import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Inject } from '@angular/core';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { API_BASE_URL } from '../../../core/api/api.config';
import { AuthApiService } from '../../../core/auth/auth-api.service';

import { AdminAnalyticsDashboard } from '../domain/admin-analytics';

interface AdminUserResponse {
  userId?: string;
  email: string;
  fullName?: string;
  role: string;
  subscriptionPlan?: string;
  status?: string;
  subscriptionEnd?: string;
}

interface AdminSubscriptionStatsResponse {
  totalSubscribedUsers: number;
  activeSubscriptions: number;
  cancelledSubscriptions: number;
  newSubscriptionsThisMonth: number;
}

@Injectable({ providedIn: 'root' })
export class AdminAnalyticsRepository {
  private readonly adminEmail = '';
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

  constructor(
    private http: HttpClient,
    private authService: AuthApiService,
    @Inject(API_BASE_URL) private apiBaseUrl: string
  ) {}

  getDashboard(adminUserId: string, month = this.getCurrentMonthKey()): Observable<AdminAnalyticsDashboard> {
    return forkJoin({
      users: this.http.get<AdminUserResponse[]>(`${this.apiBaseUrl}/admin/users`).pipe(catchError(() => of([]))),
      stats: this.http.get<AdminSubscriptionStatsResponse>(`${this.apiBaseUrl}/admin/subscriptions/stats`).pipe(catchError(() => of(null)))
    }).pipe(
      map(({ users, stats }) => this.buildRealDashboard(users, stats, month)),
      catchError(() => of(this.buildRealDashboard([], null, month)))
    );
  }

  private buildMockDashboard(month: string): AdminAnalyticsDashboard {
    const selectedMonth = this.monthlyData[month] ? month : this.getCurrentMonthKey();
    const dashboard = this.monthlyData[selectedMonth] ?? this.monthlyData['2026-06'];

    return {
      ...dashboard,
      adminEmail: this.authService.getSession()?.email || dashboard.adminEmail,
      selectedMonth,
      availableMonths: this.getAvailableMonths(),
      metrics: dashboard.metrics.map(metric => ({ ...metric })),
      usersChart: dashboard.usersChart.map(item => ({ ...item }))
    };
  }

  private buildRealDashboard(
    users: AdminUserResponse[],
    stats: AdminSubscriptionStatsResponse | null = null,
    month: string
  ): AdminAnalyticsDashboard {
    const selectedMonth = month || this.getCurrentMonthKey();
    const activeSubscriptions = stats?.activeSubscriptions ?? users.filter(user => this.isActive(user.status)).length;
    const canceledSubscriptions = stats?.cancelledSubscriptions ?? users.filter(user => user.status && !this.isActive(user.status)).length;
    const totalSubscribedUsers = stats?.totalSubscribedUsers ?? users.length;

    return {
      adminEmail: this.authService.getSession()?.email || this.adminEmail,
      selectedMonth,
      availableMonths: this.getAvailableMonths(users),
      metrics: [
        { id: 'users', labelKey: 'admin.analytics.metrics.users', value: `${totalSubscribedUsers}`, tone: 'neutral' },
        { id: 'subscriptions', labelKey: 'admin.analytics.metrics.subscriptions', value: `${activeSubscriptions}`, tone: 'positive' },
        { id: 'canceled', labelKey: 'admin.analytics.metrics.canceled', value: `${canceledSubscriptions}`, tone: 'warning' }
      ],
      usersChart: this.buildUsersChart(users)
    };
  }

  private buildUsersChart(users: AdminUserResponse[]) {
    const grouped = users.reduce<Record<string, number>>((acc, user) => {
      const key = (user.subscriptionEnd || new Date().toISOString()).slice(0, 7);
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(grouped)
      .sort(([first], [second]) => first.localeCompare(second))
      .map(([label, value]) => ({ label, value }));
  }

  private getAvailableMonths(users: AdminUserResponse[] = []): string[] {
    const months = users
      .map(user => user.subscriptionEnd?.slice(0, 7))
      .filter((month): month is string => !!month);

    return Array.from(new Set([
      this.getCurrentMonthKey(),
      ...months,
      ...Object.keys(this.monthlyData)
    ])).sort((a, b) => b.localeCompare(a));
  }

  private isActive(status: string | undefined): boolean {
    return (status || '').toUpperCase() === 'ACTIVE';
  }

  private getCurrentMonthKey(): string {
    return new Date().toISOString().slice(0, 7);
  }
}
