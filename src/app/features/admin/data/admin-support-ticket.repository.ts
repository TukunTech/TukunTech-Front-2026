import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';

import {
  AdminSupportTicket,
  AdminSupportTicketDashboard,
  AdminSupportTicketReply
} from '../domain/admin-support-ticket';

@Injectable({ providedIn: 'root' })
export class AdminSupportTicketRepository {
  private readonly adminEmail = 'demo.admin@tukuntech.app';
  private tickets: AdminSupportTicket[] = [
    {
      id: 'ticket-1041',
      code: 'T - 1041',
      subject: 'History tickets',
      requesterEmail: 'sarah@tukuntech.com',
      createdAgo: '2m ago',
      status: 'pending',
      messages: [
        {
          id: 'msg-1041-1',
          authorName: 'Sarah',
          createdAt: '10:14 AM',
          message: 'My device stopped syncing this morning.',
          fromAdmin: false
        }
      ]
    },
    {
      id: 'ticket-10724',
      code: 'T-10724',
      subject: "Device won't sync",
      requesterEmail: 'charls@tukuntech.com',
      createdAgo: '2m ago',
      status: 'pending',
      messages: [
        {
          id: 'msg-10724-1',
          authorName: 'Charls',
          createdAt: '10:14 AM',
          message: 'My device stopped syncing this morning.',
          fromAdmin: false
        }
      ]
    },
    {
      id: 'ticket-10888',
      code: 'T - 1088',
      subject: 'History tickets',
      requesterEmail: 'miguel@tukuntech.com',
      createdAgo: '12m ago',
      status: 'done',
      messages: [
        {
          id: 'msg-10888-1',
          authorName: 'Miguel',
          createdAt: '9:58 AM',
          message: 'I need help downloading a report.',
          fromAdmin: false
        },
        {
          id: 'msg-10888-2',
          authorName: 'Admin',
          createdAt: '10:01 AM',
          message: 'The report was regenerated and is available now.',
          fromAdmin: true
        }
      ]
    }
  ];

  getDashboard(adminUserId: string): Observable<AdminSupportTicketDashboard> {
    return of({
      adminEmail: this.adminEmail,
      tickets: this.cloneTickets()
    });
  }

  replyToTicket(
    adminUserId: string,
    ticketId: string,
    reply: AdminSupportTicketReply
  ): Observable<AdminSupportTicket> {
    if (!reply.message.trim() && !reply.markDone) {
      return throwError(() => new Error('Reply message is required'));
    }

    const ticket = this.tickets.find(item => item.id === ticketId);

    if (!ticket) {
      return throwError(() => new Error('Ticket not found'));
    }

    const updatedTicket: AdminSupportTicket = {
      ...ticket,
      status: reply.markDone ? 'done' : ticket.status,
      messages: reply.message.trim()
        ? [
          ...ticket.messages,
          {
            id: `msg-${ticketId}-${Date.now()}`,
            authorName: 'Admin',
            createdAt: this.getCurrentTimeLabel(),
            message: reply.message.trim(),
            fromAdmin: true
          }
        ]
        : ticket.messages
    };

    this.tickets = this.tickets.map(item =>
      item.id === ticketId
        ? updatedTicket
        : item
    );

    return of(this.cloneTicket(updatedTicket));
  }

  updateTicketStatus(
    adminUserId: string,
    ticketId: string,
    status: AdminSupportTicket['status']
  ): Observable<AdminSupportTicket> {
    const ticket = this.tickets.find(item => item.id === ticketId);

    if (!ticket) {
      return throwError(() => new Error('Ticket not found'));
    }

    const updatedTicket = {
      ...ticket,
      status
    };

    this.tickets = this.tickets.map(item =>
      item.id === ticketId
        ? updatedTicket
        : item
    );

    return of(this.cloneTicket(updatedTicket));
  }

  private cloneTickets(): AdminSupportTicket[] {
    return this.tickets.map(ticket => this.cloneTicket(ticket));
  }

  private cloneTicket(ticket: AdminSupportTicket): AdminSupportTicket {
    return {
      ...ticket,
      messages: ticket.messages.map(message => ({ ...message }))
    };
  }

  private getCurrentTimeLabel(): string {
    return new Intl.DateTimeFormat('en', {
      hour: 'numeric',
      minute: '2-digit'
    }).format(new Date());
  }
}
