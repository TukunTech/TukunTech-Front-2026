import { NgClass, NgFor, NgIf } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { CustomSelect, CustomSelectOption } from '../../../../shared/components/custom-select/custom-select';
import { AuthApiService } from '../../../../core/auth/auth-api.service';
import { DashboardLayout } from '../../../../shared/components/dashboard-layout/dashboard-layout';
import { adminMenuItems } from '../../admin-menu';
import { AdminSubscriptionRepository } from '../../data/admin-subscription.repository';
import {
  AdminSubscription,
  AdminSubscriptionSummary,
  AdminSubscriptionStatus
} from '../../domain/admin-subscription';

@Component({
  selector: 'app-admin-subscriptions',
  imports: [DashboardLayout, TranslatePipe, CustomSelect, NgFor, NgIf, NgClass],
  templateUrl: './subscriptions.html',
  styleUrl: './subscriptions.css',
})
export class Subscriptions implements OnInit {
  adminUserId = '';
  email = '';
  subscriptionsLoaded = false;
  selectedMonth = '';
  availableMonths: string[] = [];
  summary: AdminSubscriptionSummary = {
    active: 0,
    new: 0,
    canceled: 0
  };
  subscriptions: AdminSubscription[] = [];
  menuItems = adminMenuItems;

  constructor(
    private authService: AuthApiService,
    private adminSubscriptionRepository: AdminSubscriptionRepository,
    private translateService: TranslateService,
    private changeDetector: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const session = this.authService.getSession();
    this.adminUserId = session?.userId || '';
    this.email = session?.email || '';
    this.loadDashboard();
  }

  get monthOptions(): CustomSelectOption[] {
    return this.availableMonths.map(month => ({
      value: month,
      label: this.formatMonth(month)
    }));
  }

  changeMonth(month: string): void {
    this.loadDashboard(month);
  }

  getStatusLabelKey(status: AdminSubscriptionStatus): string {
    return `admin.subscriptions.status.${status}`;
  }

  getStatusClass(status: AdminSubscriptionStatus): string {
    return `status-pill--${status}`;
  }

  formatAmount(subscription: AdminSubscription): string {
    if (subscription.amount === null) {
      return '-';
    }

    return `${subscription.currency}${subscription.amount}/mo`;
  }

  private loadDashboard(month?: string): void {
    this.subscriptionsLoaded = false;
    this.adminSubscriptionRepository
      .getDashboard(this.adminUserId, month)
      .subscribe(data => {
        this.email = data.adminEmail;
        this.selectedMonth = data.selectedMonth;
        this.availableMonths = data.availableMonths;
        this.summary = data.summary;
        this.subscriptions = data.subscriptions;
        this.subscriptionsLoaded = true;
        this.changeDetector.detectChanges();
      });
  }

  private formatMonth(month: string): string {
    if (month === 'all') {
      return this.translateService.instant('admin.subscriptions.allMonths');
    }

    const [year, monthIndex] = month.split('-').map(Number);
    const date = new Date(year, monthIndex - 1, 1);

    return new Intl.DateTimeFormat(this.translateService.currentLang || 'en', {
      month: 'long',
      year: 'numeric'
    }).format(date);
  }
}
