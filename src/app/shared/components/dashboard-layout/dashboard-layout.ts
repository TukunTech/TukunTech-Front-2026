import { Component, Input, OnInit } from '@angular/core';
import { NgClass, NgFor, NgIf } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { SubscriptionAccessStore, SubscriptionRole } from '../../../core/subscription/subscription-access.store';

export interface DashboardMenuItem {
  icon: string;
  labelKey: string;
  route: string;
}

@Component({
  selector: 'app-dashboard-layout',
  imports: [NgFor, NgIf, NgClass, RouterLink, RouterLinkActive, TranslatePipe],
  templateUrl: './dashboard-layout.html',
  styleUrl: './dashboard-layout.css',
})
export class DashboardLayout implements OnInit {
  subscriptionWarningShow = false;
  subscriptionDaysRemaining = 0;
  subscriptionRenewalRoute = '';

  constructor(
    private router: Router,
    private subscriptionStore: SubscriptionAccessStore
  ) {}

  ngOnInit(): void {
    const role: SubscriptionRole | null = this.router.url.startsWith('/patient')
      ? 'patient'
      : this.router.url.startsWith('/caregiver') ? 'caregiver' : null;

    if (!role) return;
    const access = this.subscriptionStore.getRoleAccess(role);
    if (!access.canAccess) {
      this.router.navigate(['/login', role], { queryParams: { reason: 'subscription-expired' } });
      return;
    }
    this.subscriptionWarningShow = access.canAccess && access.daysRemaining <= 7;
    this.subscriptionDaysRemaining = Math.max(0, access.daysRemaining);
    this.subscriptionRenewalRoute = role === 'patient' ? '/patient/profile' : '/caregiver/settings';
  }

  logout() {
    this.router.navigate(['/']);
  }

  @Input() menuItems: DashboardMenuItem[] = [];
  @Input() role = '';
  @Input() email = '';
  @Input() urgentAlertShow = false;
  @Input() urgentAlertTitleKey = '';
  @Input() urgentAlertMessageKey = '';
  @Input() urgentAlertMessageParams: Record<string, string> = {};
  @Input() variant: 'default' | 'admin' = 'default';

  sidebarOpen = false;

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  closeSidebar() {
    this.sidebarOpen = false;
  }
}
