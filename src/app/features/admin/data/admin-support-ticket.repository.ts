import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Inject } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';

import { API_BASE_URL } from '../../../core/api/api.config';
import { AuthApiService } from '../../../core/auth/auth-api.service';
import {
  AdminSupportTicket,
  AdminSupportTicketDashboard,
  AdminSupportTicketReply
} from '../domain/admin-support-ticket';

interface SupportTicketResponse {
  ticketId: string;
  reporterId: string;
  contactEmail: string;
  subject: string;
  description: string;
  status: string;
  createdAt: string;
  resolvedAt?: string | null;
}

@Injectable({ providedIn: 'root' })
export class AdminSupportTicketRepository {
  private readonly adminEmail = '';
  private readonly messagesStorageKey = 'tukuntech.supportTicketMessages';
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

  constructor(
    private http: HttpClient,
    private authService: AuthApiService,
    @Inject(API_BASE_URL) private apiBaseUrl: string
  ) {}

  getDashboard(adminUserId: string): Observable<AdminSupportTicketDashboard> {
    return this.http.get<SupportTicketResponse[]>(`${this.apiBaseUrl}/tickets`).pipe(
      map(tickets => {
        const mappedTickets = tickets.map(ticket => this.mapTicket(ticket));
        this.tickets = mappedTickets;

        return {
          adminEmail: this.authService.getSession()?.email || this.adminEmail,
          tickets: mappedTickets.map(ticket => this.cloneTicket(ticket))
        };
      }),
      catchError(() => of({
        adminEmail: this.authService.getSession()?.email || this.adminEmail,
        tickets: []
      }))
    );
  }

  replyToTicket(
    adminUserId: string,
    ticketId: string,
    reply: AdminSupportTicketReply
  ): Observable<AdminSupportTicket> {
    if (!reply.message.trim() && !reply.markDone) {
      return throwError(() => new Error('Reply message is required'));
    }

    const action = reply.markDone ? 'resolve' : 'in-progress';

    return this.http.put(`${this.apiBaseUrl}/tickets/${ticketId}/${action}`, {}, { responseType: 'text' }).pipe(
      map(() => this.appendLocalReply(ticketId, reply)),
      catchError(() => of(this.appendLocalReply(ticketId, reply)))
    );
  }

  updateTicketStatus(
    adminUserId: string,
    ticketId: string,
    status: AdminSupportTicket['status']
  ): Observable<AdminSupportTicket> {
    const action = status === 'done' ? 'resolve' : 'in-progress';

    return this.http.put(`${this.apiBaseUrl}/tickets/${ticketId}/${action}`, {}, { responseType: 'text' }).pipe(
      switchMap(() => this.getDashboard(adminUserId)),
      map(dashboard => dashboard.tickets.find(ticket => ticket.id === ticketId)),
      switchMap(ticket => ticket ? of(ticket) : of(this.updateLocalStatus(ticketId, status))),
      catchError(() => of(this.updateLocalStatus(ticketId, status)))
    );
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

  private appendLocalReply(
    ticketId: string,
    reply: AdminSupportTicketReply
  ): AdminSupportTicket {
    const currentTicket = this.tickets.find(ticket => ticket.id === ticketId)
      || this.cloneTickets().find(ticket => ticket.id === ticketId);

    const adminMessage = reply.message.trim()
      ? {
          id: `msg-${ticketId}-${Date.now()}`,
          authorName: 'Admin',
          createdAt: this.getCurrentTimeLabel(),
          message: reply.message.trim(),
          fromAdmin: true
        }
      : null;

    const updatedTicket: AdminSupportTicket = currentTicket
      ? {
          ...currentTicket,
          status: reply.markDone ? 'done' : currentTicket.status,
          messages: adminMessage
            ? [...currentTicket.messages, adminMessage]
            : currentTicket.messages
        }
      : {
          id: ticketId,
          code: `T-${ticketId.slice(0, 6).toUpperCase()}`,
          subject: '',
          requesterEmail: '',
          createdAgo: '',
          status: reply.markDone ? 'done' : 'pending',
          messages: adminMessage ? [adminMessage] : []
        };

    if (adminMessage) this.saveLocalMessage(ticketId, adminMessage);

    this.tickets = [
      updatedTicket,
      ...this.tickets.filter(ticket => ticket.id !== ticketId)
    ];

    return this.cloneTicket(updatedTicket);
  }

  private updateLocalStatus(
    ticketId: string,
    status: AdminSupportTicket['status']
  ): AdminSupportTicket {
    const currentTicket = this.tickets.find(ticket => ticket.id === ticketId);

    if (!currentTicket) {
      throw new Error('Ticket not found');
    }

    const updatedTicket = {
      ...currentTicket,
      status
    };

    this.tickets = this.tickets.map(ticket =>
      ticket.id === ticketId ? updatedTicket : ticket
    );

    return this.cloneTicket(updatedTicket);
  }

  private mapTicket(ticket: SupportTicketResponse): AdminSupportTicket {
    const existingTicket = this.tickets.find(item => item.id === ticket.ticketId);
    const localMessages = this.getLocalMessages(ticket.ticketId);

    const mappedTicket = {
      id: ticket.ticketId,
      code: `T-${ticket.ticketId.slice(0, 6).toUpperCase()}`,
      subject: ticket.subject,
      requesterEmail: ticket.contactEmail,
      createdAgo: this.formatCreatedAt(ticket.createdAt),
      status: this.mapStatus(ticket.status),
      messages: [
        {
          id: `msg-${ticket.ticketId}`,
          authorName: ticket.contactEmail,
          createdAt: this.formatCreatedAt(ticket.createdAt),
          message: ticket.description,
          fromAdmin: false
        }
      ]
    };

    return existingTicket
      ? {
          ...mappedTicket,
          messages: [
            ...mappedTicket.messages,
            ...localMessages,
            ...existingTicket.messages.filter(message =>
              message.fromAdmin && !localMessages.some(localMessage => localMessage.id === message.id)
            )
          ]
        }
      : {
          ...mappedTicket,
          messages: [...mappedTicket.messages, ...localMessages]
        };
  }

  private mapStatus(status: string): AdminSupportTicket['status'] {
    const normalizedStatus = status.toUpperCase();
    return normalizedStatus === 'RESOLVED' || normalizedStatus === 'CLOSED'
      ? 'done'
      : 'pending';
  }

  private formatCreatedAt(value: string): string {
    if (!value) return '';

    return new Intl.DateTimeFormat('en', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    }).format(new Date(value));
  }

  private getLocalMessages(ticketId: string): AdminSupportTicket['messages'] {
    return this.readLocalMessages()[ticketId] || [];
  }

  private saveLocalMessage(ticketId: string, message: AdminSupportTicket['messages'][number]): void {
    const messages = this.readLocalMessages();
    messages[ticketId] = [
      ...(messages[ticketId] || []).filter(item => item.id !== message.id),
      message
    ];
    localStorage.setItem(this.messagesStorageKey, JSON.stringify(messages));
  }

  private readLocalMessages(): Record<string, AdminSupportTicket['messages']> {
    try {
      return JSON.parse(localStorage.getItem(this.messagesStorageKey) || '{}');
    } catch {
      return {};
    }
  }
}
