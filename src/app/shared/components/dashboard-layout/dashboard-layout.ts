import { Component, Input } from '@angular/core';
import { NgClass, NgFor, NgIf } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { Router } from '@angular/router';

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
export class DashboardLayout {
  constructor(private router: Router) {}

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
