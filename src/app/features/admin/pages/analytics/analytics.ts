import { NgClass, NgFor, NgIf } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { CustomSelect, CustomSelectOption } from '../../../../shared/components/custom-select/custom-select';
import { AuthApiService } from '../../../../core/auth/auth-api.service';
import { DashboardLayout } from '../../../../shared/components/dashboard-layout/dashboard-layout';
import { adminMenuItems } from '../../admin-menu';
import { AdminAnalyticsRepository } from '../../data/admin-analytics.repository';
import { AdminAnalyticsBar, AdminAnalyticsMetric } from '../../domain/admin-analytics';

@Component({
  selector: 'app-admin-analytics',
  imports: [DashboardLayout, TranslatePipe, CustomSelect, NgFor, NgIf, NgClass],
  templateUrl: './analytics.html',
  styleUrl: './analytics.css',
})
export class Analytics implements OnInit {
  adminUserId = '';
  email = '';
  analyticsLoaded = false;
  selectedMonth = '';
  availableMonths: string[] = [];
  metrics: AdminAnalyticsMetric[] = [];
  usersChart: AdminAnalyticsBar[] = [];
  menuItems = adminMenuItems;

  constructor(
    private authService: AuthApiService,
    private adminAnalyticsRepository: AdminAnalyticsRepository,
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

  get maxChartValue(): number {
    return Math.max(...this.usersChart.map(item => item.value), 1);
  }

  changeMonth(month: string): void {
    this.loadDashboard(month);
  }

  getMetricClass(metric: AdminAnalyticsMetric): string {
    return `metric-card--${metric.tone}`;
  }

  getBarHeight(value: number): string {
    return `${Math.max((value / this.maxChartValue) * 100, 5)}%`;
  }

  private loadDashboard(month?: string): void {
    this.analyticsLoaded = false;
    this.adminAnalyticsRepository
      .getDashboard(this.adminUserId, month)
      .subscribe(data => {
        this.email = data.adminEmail;
        this.selectedMonth = data.selectedMonth;
        this.availableMonths = data.availableMonths;
        this.metrics = data.metrics;
        this.usersChart = data.usersChart;
        this.analyticsLoaded = true;
        this.changeDetector.detectChanges();
      });
  }

  private formatMonth(month: string): string {
    const [year, monthIndex] = month.split('-').map(Number);
    const date = new Date(year, monthIndex - 1, 1);

    return new Intl.DateTimeFormat(this.translateService.currentLang || 'en', {
      month: 'long',
      year: 'numeric'
    }).format(date);
  }
}
