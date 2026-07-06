import { NgClass, NgFor, NgIf } from '@angular/common';
import { ChangeDetectorRef, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';

import {
  DashboardLayout,
  DashboardMenuItem
} from '../../../../shared/components/dashboard-layout/dashboard-layout';
import { AppToast } from '../../../../shared/components/app-toast/app-toast';
import { AuthApiService } from '../../../../core/auth/auth-api.service';
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
  requesterRole: SupportRequesterRole = 'patient';
  urgentAlertShow = false;
  urgentAlertTitleKey = '';
  urgentAlertMessageKey = '';

  subject = '';
  description = '';
  showToast = false;

  tickets: SupportTicket[] = [];
  selectedTicketId = '';
  replyMessage = '';

  menuItems: DashboardMenuItem[] = [
    { icon: 'bi-sun', labelKey: 'sidebar.patient.vitalSigns', route: '/patient/today' },
    { icon: 'bi-cpu', labelKey: 'sidebar.patient.device', route: '/patient/device' },
    { icon: 'bi-arrow-counterclockwise', labelKey: 'sidebar.patient.history', route: '/patient/history' },
    { icon: 'bi-person-check', labelKey: 'sidebar.patient.profile', route: '/patient/profile' },
    { icon: 'bi-ticket-perforated', labelKey: 'sidebar.patient.support', route: '/patient/support' },
    { icon: 'bi-gear', labelKey: 'sidebar.patient.settings', route: '/patient/settings' }
  ];

  constructor(
    private authService: AuthApiService,
    private supportTicketRepository: SupportTicketRepository,
    private patientAlertRepository: PatientAlertRepository,
    private changeDetector: ChangeDetectorRef
  ) {
    const session = this.authService.getSession();
    this.userId = session?.userId || '';
    this.email = session?.email || '';
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
    }).subscribe(() => {
      this.subject = '';
      this.description = '';
      this.selectedTicketId = '';
      this.loadTickets();
      this.showSuccessToast();
      this.changeDetector.detectChanges();
    });
  }

  get selectedTicket(): SupportTicket | undefined {
    return this.tickets.find(ticket => ticket.id === this.selectedTicketId);
  }

  startNewTicket(): void {
    this.selectedTicketId = '';
    this.replyMessage = '';
    this.subject = '';
    this.description = '';
  }

  selectTicket(ticket: SupportTicket): void {
    this.selectedTicketId = ticket.id;
    this.replyMessage = '';
  }

  sendReply(): void {
    const ticket = this.selectedTicket;
    const message = this.replyMessage.trim();
    if (!ticket || !message) return;

    this.supportTicketRepository
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

  getStatusLabelKey(status: SupportTicketStatus): string {
    return `patient.support.status.${status}`;
  }

  private loadTickets(): void {
    this.supportTicketRepository.getTicketsForUser(
      this.email,
      this.requesterRole
    ).subscribe(tickets => {
      this.tickets = tickets;
      if (this.selectedTicketId && !tickets.some(ticket => ticket.id === this.selectedTicketId)) {
        this.selectedTicketId = '';
      }
      this.changeDetector.detectChanges();
    });
  }

  private loadGlobalUrgentAlert(): void {
    if (!this.userId) return;

    this.patientAlertRepository
      .getGlobalUrgentAlert(this.userId)
      .subscribe(alert => {
        this.urgentAlertShow = !!alert;
        this.urgentAlertTitleKey = alert?.titleKey || '';
        this.urgentAlertMessageKey = alert?.messageKey || '';
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
