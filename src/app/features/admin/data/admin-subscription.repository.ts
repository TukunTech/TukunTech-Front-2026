import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

import {
  AdminSubscription,
  AdminSubscriptionDashboard,
  filterSubscriptionsByMonth
} from '../domain/admin-subscription';

@Injectable({ providedIn: 'root' })
export class AdminSubscriptionRepository {
  private readonly adminEmail = 'demo.admin@tukuntech.app';
  private readonly monthlySummary = {
    '2026-06': {
      active: 67,
      new: 45,
      canceled: 8
    },
    '2026-05': {
      active: 61,
      new: 32,
      canceled: 5
    },
    '2026-04': {
      active: 54,
      new: 24,
      canceled: 6
    }
  };
  private readonly subscriptions: AdminSubscription[] = [
    {
      id: 'sub-2026-06-001',
      userEmail: 'sarah@tukuntech.com',
      plan: 'Individual plan',
      status: 'active',
      renewsAt: '2026-06-23',
      amount: 200,
      currency: '$',
      month: '2026-06'
    },
    {
      id: 'sub-2026-06-002',
      userEmail: 'family.marsh@tukuntech.com',
      plan: 'Family Pro',
      status: 'active',
      renewsAt: '2026-06-23',
      amount: 500,
      currency: '$',
      month: '2026-06'
    },
    {
      id: 'sub-2026-06-003',
      userEmail: 'eleanor@tukuntech.com',
      plan: 'Individual plan',
      status: 'active',
      renewsAt: '2026-06-24',
      amount: 200,
      currency: '$',
      month: '2026-06'
    },
    {
      id: 'sub-2026-06-004',
      userEmail: 'caregiver.plus@tukuntech.com',
      plan: 'Family Pro',
      status: 'canceled',
      renewsAt: '2026-06-25',
      amount: 550,
      currency: '$',
      month: '2026-06'
    },
    {
      id: 'sub-2026-05-001',
      userEmail: 'may.family@tukuntech.com',
      plan: 'Family Pro',
      status: 'active',
      renewsAt: '2026-05-19',
      amount: 500,
      currency: '$',
      month: '2026-05'
    },
    {
      id: 'sub-2026-05-002',
      userEmail: 'may.patient@tukuntech.com',
      plan: 'Individual plan',
      status: 'canceled',
      renewsAt: '2026-05-21',
      amount: 200,
      currency: '$',
      month: '2026-05'
    },
    {
      id: 'sub-2026-04-001',
      userEmail: 'april.family@tukuntech.com',
      plan: 'Family Pro',
      status: 'active',
      renewsAt: '2026-04-16',
      amount: 500,
      currency: '$',
      month: '2026-04'
    }
  ];

  getDashboard(adminUserId: string, month = this.getCurrentMonthKey()): Observable<AdminSubscriptionDashboard> {
    const subscriptions = filterSubscriptionsByMonth(this.subscriptions, month);
    const summary = this.monthlySummary[month as keyof typeof this.monthlySummary] ?? {
      active: subscriptions.filter(item => item.status === 'active').length,
      new: subscriptions.length,
      canceled: subscriptions.filter(item => item.status === 'canceled').length
    };

    return of({
      adminEmail: this.adminEmail,
      selectedMonth: month,
      availableMonths: this.getAvailableMonths(),
      summary,
      subscriptions
    });
  }

  private getAvailableMonths(): string[] {
    return Array.from(new Set([
      this.getCurrentMonthKey(),
      ...Object.keys(this.monthlySummary),
      ...this.subscriptions.map(subscription => subscription.month)
    ])).sort((a, b) => b.localeCompare(a));
  }

  private getCurrentMonthKey(): string {
    return new Date().toISOString().slice(0, 7);
  }
}
