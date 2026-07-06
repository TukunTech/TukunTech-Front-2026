import { Component, Input, OnInit } from '@angular/core';
import { NgClass, NgFor, NgIf } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { AuthApiService } from '../../../core/auth/auth-api.service';

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
    private authService: AuthApiService
  ) {}

  ngOnInit(): void {
    this.subscriptionWarningShow = false;
  }

  logout() {
    this.authService.logout();
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
