import { NgClass, NgFor } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';

import { AppToast } from '../../../../shared/components/app-toast/app-toast';
import {
  DashboardLayout,
  DashboardMenuItem
} from '../../../../shared/components/dashboard-layout/dashboard-layout';
import { CaregiverAlertRepository } from '../../data/caregiver-alert.repository';
import { CaregiverSupportRepository } from '../../data/caregiver-support.repository';
import {
  CaregiverSupportTicket,
  CaregiverSupportTicketStatus
} from '../../domain/caregiver-support';

@Component({
  selector: 'app-caregiver-support',
  imports: [
    DashboardLayout,
    FormsModule,
    NgFor,
    NgClass,
    TranslatePipe,
    AppToast
  ],
  templateUrl: './support.html',
  styleUrl: './support.css',
})
export class Support {
  email = 'demo.caregiver@tukuntech.app';
  userId = 'caregiver-demo-user';
  urgentAlertShow = false;
  urgentAlertTitleKey = '';
  urgentAlertMessageKey = '';
  urgentAlertMessageParams: Record<string, string> = {};

  subject = '';
  description = '';
  showToast = false;

  tickets: CaregiverSupportTicket[] = [];

  menuItems: DashboardMenuItem[] = [
    { icon: 'bi-sun', labelKey: 'sidebar.caregiver.vitalSigns', route: '/caregiver/vital-signs' },
    { icon: 'bi-cpu', labelKey: 'sidebar.caregiver.device', route: '/caregiver/device' },
    { icon: 'bi-arrow-counterclockwise', labelKey: 'sidebar.caregiver.history', route: '/caregiver/history' },
    { icon: 'bi-person-check', labelKey: 'sidebar.caregiver.profile', route: '/caregiver/profile' },
    { icon: 'bi-ticket-perforated', labelKey: 'sidebar.caregiver.support', route: '/caregiver/support' },
    { icon: 'bi-gear', labelKey: 'sidebar.caregiver.settings', route: '/caregiver/settings' }
  ];

  constructor(
    private caregiverAlertRepository: CaregiverAlertRepository,
    private caregiverSupportRepository: CaregiverSupportRepository
  ) {
    this.loadTickets();
    this.loadGlobalCriticalAlert();
  }

  submitTicket(): void {
    const subject = this.subject.trim();
    const description = this.description.trim();

    if (!subject || !description) {
      return;
    }

    this.caregiverSupportRepository.createTicket(
      this.userId,
      this.email,
      subject,
      description
    );

    this.subject = '';
    this.description = '';
    this.loadTickets();
    this.showSuccessToast();
  }

  formatTicketDate(createdAt: string): string {
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(new Date(createdAt));
  }

  getStatusLabelKey(status: CaregiverSupportTicketStatus): string {
    return `caregiver.support.status.${status}`;
  }

  private loadTickets(): void {
    this.tickets = this.caregiverSupportRepository.getTicketsForCaregiver(this.email);
  }

  private loadGlobalCriticalAlert(): void {
    this.caregiverAlertRepository
      .getGlobalCriticalAlert(this.userId)
      .subscribe(alert => {
        this.urgentAlertShow = !!alert;
        this.urgentAlertTitleKey = alert?.titleKey || '';
        this.urgentAlertMessageKey = alert?.messageKey || '';
        this.urgentAlertMessageParams = alert?.messageParams || {};
      });
  }

  private showSuccessToast(): void {
    this.showToast = true;

    setTimeout(() => {
      this.showToast = false;
    }, 3000);
  }
}
