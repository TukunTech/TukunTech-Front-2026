import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Inject } from '@angular/core';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { API_BASE_URL } from '../../../core/api/api.config';
import { AuthApiService } from '../../../core/auth/auth-api.service';

import {
  AdminSubscription,
  AdminSubscriptionDashboard,
  filterSubscriptionsByMonth
} from '../domain/admin-subscription';

interface AdminUserResponse {
  userId?: string;
  id?: string;
  email: string;
  fullName?: string;
  role: string;
  subscriptionPlan?: string;
  planName?: string;
  subscriptionPlanName?: string;
  displayPlan?: string;
  status?: string;
  renewalsCount?: number;
  amount?: number;
  lastPaymentAmount?: number;
  monthlyAmount?: number;
  monthlyPayment?: number;
  subscriptionAmount?: number;
  subscriptionEnd?: string;
}

interface AdminSubscriptionStatsResponse {
  totalSubscribedUsers: number;
  activeSubscriptions: number;
  cancelledSubscriptions: number;
  newSubscriptionsThisMonth: number;
}

@Injectable({ providedIn: 'root' })
export class AdminSubscriptionRepository {
  private readonly adminEmail = '';

  constructor(
    private http: HttpClient,
    private authService: AuthApiService,
    @Inject(API_BASE_URL) private apiBaseUrl: string
  ) {}

  getDashboard(adminUserId: string, month = 'all'): Observable<AdminSubscriptionDashboard> {
    return forkJoin({
      users: this.http.get<AdminUserResponse[]>(`${this.apiBaseUrl}/admin/users`).pipe(catchError(() => of([]))),
      stats: this.http.get<AdminSubscriptionStatsResponse>(`${this.apiBaseUrl}/admin/subscriptions/stats`).pipe(catchError(() => of(null)))
    }).pipe(
      map(({ users, stats }) => this.buildDashboard(
        users.map(user => this.mapUserSubscription(user)),
        month,
        stats
      )),
      catchError(() => of(this.buildDashboard([], month)))
    );
  }

  private buildDashboard(
    subscriptionsSource: AdminSubscription[],
    month: string,
    stats: AdminSubscriptionStatsResponse | null = null
  ): AdminSubscriptionDashboard {
    const subscriptions = filterSubscriptionsByMonth(subscriptionsSource, month);
    const summary = this.createSummary(subscriptions, stats);

    return {
      adminEmail: this.authService.getSession()?.email || this.adminEmail,
      selectedMonth: month,
      availableMonths: this.getAvailableMonths(subscriptionsSource),
      summary,
      subscriptions
    };
  }

  private createSummary(
    subscriptions: AdminSubscription[],
    stats: AdminSubscriptionStatsResponse | null = null
  ) {
    if (stats) {
      return {
        active: stats.activeSubscriptions,
        new: stats.newSubscriptionsThisMonth,
        canceled: stats.cancelledSubscriptions
      };
    }

    return {
      active: subscriptions.filter(item => item.status === 'active').length,
      new: subscriptions.length,
      canceled: subscriptions.filter(item => item.status === 'canceled').length
    };
  }

  private mapUserSubscription(user: AdminUserResponse): AdminSubscription {
    const renewsAt = user.subscriptionEnd || '';
    const month = renewsAt ? renewsAt.slice(0, 7) : 'unassigned';
    const plan = user.subscriptionPlan || 'NONE';
    const amount = this.getSubscriptionAmount(user, plan);

    return {
      id: `sub-${user.userId || user.id || user.email}`,
      userEmail: user.email,
      plan: this.getPlanLabel(user, plan),
      status: this.isActive(user.status) ? 'active' : 'canceled',
      renewsAt,
      amount,
      currency: '$',
      month
    };
  }

  private getSubscriptionAmount(user: AdminUserResponse, plan?: string): number | null {
    const amount = user.monthlyAmount ?? user.monthlyPayment ?? user.subscriptionAmount ?? user.amount ?? user.lastPaymentAmount;

    if (typeof amount === 'number' && amount > 0) {
      return amount;
    }

    return this.getPlanAmount(plan);
  }

  private getPlanLabel(user: AdminUserResponse, plan?: string): string {
    const backendLabel = user.displayPlan || user.subscriptionPlanName || user.planName;

    if (backendLabel?.trim()) {
      return backendLabel.trim();
    }

    const normalizedPlan = (plan || 'NONE').toUpperCase();
    if (normalizedPlan === 'INDIVIDUAL') return 'Individual';
    if (normalizedPlan === 'FAMILY') return 'Family';
    if (normalizedPlan === 'NONE') return 'None';

    return plan || 'None';
  }

  private getPlanAmount(plan?: string): number | null {
    const normalizedPlan = (plan || '').toUpperCase().replace(/[\s-]+/g, '_');
    const planPrices: Record<string, number> = {
      NONE: 0,
      INDIVIDUAL: 15,
      TUKUNTECH_MONTHLY: 15,
      PLAN_1: 28,
      FAMILY_2: 28,
      PLAN_2: 40,
      FAMILY_3: 40,
      PLAN_3: 52,
      FAMILY_4: 52,
      PLAN_4: 62,
      FAMILY_5: 62
    };

    if (normalizedPlan in planPrices) {
      return planPrices[normalizedPlan];
    }

    if (normalizedPlan.includes('PLAN_4') || normalizedPlan.includes('TIER5') || normalizedPlan.includes('FAMILY_5')) return 62;
    if (normalizedPlan.includes('PLAN_3') || normalizedPlan.includes('TIER4') || normalizedPlan.includes('FAMILY_4')) return 52;
    if (normalizedPlan.includes('PLAN_2') || normalizedPlan.includes('TIER3') || normalizedPlan.includes('FAMILY_3')) return 40;
    if (normalizedPlan.includes('PLAN_1') || normalizedPlan.includes('TIER2') || normalizedPlan.includes('FAMILY_2')) return 28;
    if (normalizedPlan.includes('NONE')) return 0;
    if (normalizedPlan.includes('INDIVIDUAL')) return 15;

    return null;
  }

  private getAvailableMonths(subscriptionsSource: AdminSubscription[] = []): string[] {
    return Array.from(new Set([
      'all',
      this.getCurrentMonthKey(),
      ...subscriptionsSource.map(subscription => subscription.month).filter(month => month !== 'unassigned')
    ])).sort((a, b) => b.localeCompare(a));
  }

  private isActive(status: string | undefined): boolean {
    return (status || '').toUpperCase() === 'ACTIVE';
  }

  private getCurrentMonthKey(): string {
    return new Date().toISOString().slice(0, 7);
  }
}
