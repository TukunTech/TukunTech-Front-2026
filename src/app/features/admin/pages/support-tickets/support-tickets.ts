import { NgClass, NgFor, NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';

import { AppToast } from '../../../../shared/components/app-toast/app-toast';
import { DashboardLayout } from '../../../../shared/components/dashboard-layout/dashboard-layout';
import { adminMenuItems } from '../../admin-menu';
import { AdminSupportTicketRepository } from '../../data/admin-support-ticket.repository';
import {
  AdminSupportTicket,
  AdminSupportTicketStatus,
  findTicketById
} from '../../domain/admin-support-ticket';

@Component({
  selector: 'app-admin-support-tickets',
  imports: [DashboardLayout, TranslatePipe, FormsModule, NgFor, NgIf, NgClass, AppToast],
  templateUrl: './support-tickets.html',
  styleUrl: './support-tickets.css',
})
export class SupportTickets {
  adminUserId = 'admin-demo-user';
  email = 'demo.admin@tukuntech.app';
  tickets: AdminSupportTicket[] = [];
  selectedTicketId = '';
  replyMessage = '';
  showToast = false;
  toastType: 'success' | 'error' = 'success';
  toastMessageKey = '';
  menuItems = adminMenuItems;

  constructor(private adminSupportTicketRepository: AdminSupportTicketRepository) {
    this.loadDashboard();
  }

  get selectedTicket(): AdminSupportTicket | null {
    return findTicketById(this.tickets, this.selectedTicketId);
  }

  selectTicket(ticketId: string): void {
    this.selectedTicketId = ticketId;
    this.replyMessage = '';
  }

  sendReply(): void {
    const ticket = this.selectedTicket;

    if (!ticket) {
      return;
    }

    this.adminSupportTicketRepository
      .replyToTicket(this.adminUserId, ticket.id, {
        message: this.replyMessage,
        markDone: false
      })
      .subscribe({
        next: updatedTicket => {
          this.replaceTicket(updatedTicket);
          this.replyMessage = '';
          this.showFeedback('success', 'admin.supportTickets.replySent');
        },
        error: () => {
          this.showFeedback('error', 'admin.supportTickets.replyError');
        }
      });
  }

  markDone(): void {
    this.updateStatus('done');
  }

  markPending(): void {
    this.updateStatus('pending');
  }

  getStatusLabelKey(status: AdminSupportTicketStatus): string {
    return `admin.supportTickets.status.${status}`;
  }

  getStatusClass(status: AdminSupportTicketStatus): string {
    return `status-pill--${status}`;
  }

  private updateStatus(status: AdminSupportTicketStatus): void {
    const ticket = this.selectedTicket;

    if (!ticket) {
      return;
    }

    this.adminSupportTicketRepository
      .updateTicketStatus(this.adminUserId, ticket.id, status)
      .subscribe({
        next: updatedTicket => {
          this.replaceTicket(updatedTicket);
          this.showFeedback('success', 'admin.supportTickets.statusSaved');
        },
        error: () => {
          this.showFeedback('error', 'admin.supportTickets.replyError');
        }
      });
  }

  private loadDashboard(): void {
    this.adminSupportTicketRepository
      .getDashboard(this.adminUserId)
      .subscribe(data => {
        this.email = data.adminEmail;
        this.tickets = data.tickets;
        this.selectedTicketId = data.tickets[0]?.id ?? '';
      });
  }

  private replaceTicket(ticket: AdminSupportTicket): void {
    this.tickets = this.tickets.map(item =>
      item.id === ticket.id
        ? ticket
        : item
    );
  }

  private showFeedback(type: 'success' | 'error', messageKey: string): void {
    this.toastType = type;
    this.toastMessageKey = messageKey;
    this.showToast = true;

    setTimeout(() => {
      this.showToast = false;
    }, 3000);
  }
}
