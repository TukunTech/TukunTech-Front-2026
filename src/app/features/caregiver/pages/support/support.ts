import { NgClass, NgFor, NgIf } from '@angular/common';
import { ChangeDetectorRef, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';

import { AppToast } from '../../../../shared/components/app-toast/app-toast';
import {
  DashboardLayout,
  DashboardMenuItem
} from '../../../../shared/components/dashboard-layout/dashboard-layout';
import { AuthApiService } from '../../../../core/auth/auth-api.service';
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
    NgIf,
    NgClass,
    TranslatePipe,
    AppToast
  ],
  templateUrl: './support.html',
  styleUrl: './support.css',
})
export class Support {
  email = '';
  userId = '';
  urgentAlertShow = false;
  urgentAlertTitleKey = '';
  urgentAlertMessageKey = '';
  urgentAlertMessageParams: Record<string, string> = {};

  subject = '';
  description = '';
  showToast = false;

  tickets: CaregiverSupportTicket[] = [];
  selectedTicketId = '';
  replyMessage = '';

  menuItems: DashboardMenuItem[] = [
    { icon: 'bi-sun', labelKey: 'sidebar.caregiver.vitalSigns', route: '/caregiver/vital-signs' },
    { icon: 'bi-cpu', labelKey: 'sidebar.caregiver.device', route: '/caregiver/device' },
    { icon: 'bi-arrow-counterclockwise', labelKey: 'sidebar.caregiver.history', route: '/caregiver/history' },
    { icon: 'bi-person-check', labelKey: 'sidebar.caregiver.profile', route: '/caregiver/profile' },
    { icon: 'bi-ticket-perforated', labelKey: 'sidebar.caregiver.support', route: '/caregiver/support' },
    { icon: 'bi-gear', labelKey: 'sidebar.caregiver.settings', route: '/caregiver/settings' }
  ];

  constructor(
    private authService: AuthApiService,
    private caregiverAlertRepository: CaregiverAlertRepository,
    private caregiverSupportRepository: CaregiverSupportRepository,
    private changeDetector: ChangeDetectorRef
  ) {
    const session = this.authService.getSession();
    this.userId = session?.userId || '';
    this.email = session?.email || '';
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
    ).subscribe(() => {
      this.subject = '';
      this.description = '';
      this.selectedTicketId = '';
      this.loadTickets();
      this.showSuccessToast();
      this.changeDetector.detectChanges();
    });
  }

  get selectedTicket(): CaregiverSupportTicket | undefined {
    return this.tickets.find(ticket => ticket.id === this.selectedTicketId);
  }

  startNewTicket(): void {
    this.selectedTicketId = '';
    this.replyMessage = '';
    this.subject = '';
    this.description = '';
  }

  selectTicket(ticket: CaregiverSupportTicket): void {
    this.selectedTicketId = ticket.id;
    this.replyMessage = '';
  }

  sendReply(): void {
    const ticket = this.selectedTicket;
    const message = this.replyMessage.trim();
    if (!ticket || !message) return;

    this.caregiverSupportRepository
      .replyToTicket(ticket, message, this.email)
      .subscribe(updatedTicket => {
        this.tickets = this.tickets.map(item =>
          item.id === updatedTicket.id ? updatedTicket : item
        );
        this.replyMessage = '';
        this.changeDetector.detectChanges();
      });
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
    this.caregiverSupportRepository.getTicketsForCaregiver(this.email)
      .subscribe(tickets => {
        this.tickets = tickets;
        if (this.selectedTicketId && !tickets.some(ticket => ticket.id === this.selectedTicketId)) {
          this.selectedTicketId = '';
        }
        this.changeDetector.detectChanges();
      });
  }

  private loadGlobalCriticalAlert(): void {
    if (!this.userId) return;

    this.caregiverAlertRepository
      .getGlobalCriticalAlert(this.userId)
      .subscribe(alert => {
        this.urgentAlertShow = !!alert;
        this.urgentAlertTitleKey = alert?.titleKey || '';
        this.urgentAlertMessageKey = alert?.messageKey || '';
        this.urgentAlertMessageParams = alert?.messageParams || {};
        this.changeDetector.detectChanges();
      });
  }

  private showSuccessToast(): void {
    this.showToast = true;

    setTimeout(() => {
      this.showToast = false;
    }, 3000);
  }
}
