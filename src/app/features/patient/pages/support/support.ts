import { NgClass, NgFor } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';

import {
  DashboardLayout,
  DashboardMenuItem
} from '../../../../shared/components/dashboard-layout/dashboard-layout';
import { AppToast } from '../../../../shared/components/app-toast/app-toast';
import { PatientAlertRepository } from '../../data/patient-alert.repository';
import { SupportTicketRepository } from '../../data/support-ticket.repository';
import {
  SupportRequesterRole,
  SupportTicket,
  SupportTicketStatus
} from '../../domain/support-ticket';

@Component({
  selector: 'app-support',
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
  email = 'demo.patient@tukuntech.app';
  userId = 'patient-demo-user';
  requesterRole: SupportRequesterRole = 'patient';
  urgentAlertShow = false;
  urgentAlertTitleKey = '';
  urgentAlertMessageKey = '';

  subject = '';
  description = '';
  showToast = false;

  tickets: SupportTicket[] = [];

  menuItems: DashboardMenuItem[] = [
    { icon: 'bi-sun', labelKey: 'sidebar.patient.vitalSigns', route: '/patient/today' },
    { icon: 'bi-cpu', labelKey: 'sidebar.patient.device', route: '/patient/device' },
    { icon: 'bi-arrow-counterclockwise', labelKey: 'sidebar.patient.history', route: '/patient/history' },
    { icon: 'bi-person-check', labelKey: 'sidebar.patient.profile', route: '/patient/profile' },
    { icon: 'bi-ticket-perforated', labelKey: 'sidebar.patient.support', route: '/patient/support' },
    { icon: 'bi-gear', labelKey: 'sidebar.patient.settings', route: '/patient/settings' }
  ];

  constructor(
    private supportTicketRepository: SupportTicketRepository,
    private patientAlertRepository: PatientAlertRepository
  ) {
    this.loadTickets();
    this.loadGlobalUrgentAlert();
  }

  submitTicket(): void {
    const subject = this.subject.trim();
    const description = this.description.trim();

    if (!subject || !description) {
      return;
    }

    this.supportTicketRepository.createTicket({
      userId: this.userId,
      userEmail: this.email,
      requesterRole: this.requesterRole,
      subject,
      description
    });

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

  getStatusLabelKey(status: SupportTicketStatus): string {
    return `patient.support.status.${status}`;
  }

  private loadTickets(): void {
    this.tickets = this.supportTicketRepository.getTicketsForUser(
      this.email,
      this.requesterRole
    );
  }

  private loadGlobalUrgentAlert(): void {
    this.patientAlertRepository
      .getGlobalUrgentAlert(this.userId)
      .subscribe(alert => {
        this.urgentAlertShow = !!alert;
        this.urgentAlertTitleKey = alert?.titleKey || '';
        this.urgentAlertMessageKey = alert?.messageKey || '';
      });
  }

  private showSuccessToast(): void {
    this.showToast = true;

    setTimeout(() => {
      this.showToast = false;
    }, 3000);
  }
}
