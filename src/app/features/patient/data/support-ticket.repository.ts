import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { API_BASE_URL } from '../../../core/api/api.config';
import {
  CreateSupportTicketPayload,
  SupportRequesterRole,
  SupportTicket,
  SupportTicketMessage
} from '../domain/support-ticket';

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

@Injectable({
  providedIn: 'root'
})
export class SupportTicketRepository {
  private readonly messagesStorageKey = 'tukuntech.supportTicketMessages';

  constructor(
    private http: HttpClient,
    @Inject(API_BASE_URL) private apiBaseUrl: string
  ) {}

  getTicketsForUser(userEmail: string, requesterRole: SupportRequesterRole): Observable<SupportTicket[]> {
    return this.http.get<SupportTicketResponse[]>(`${this.apiBaseUrl}/tickets/me`).pipe(
      map(tickets => tickets.map(ticket => this.mapTicket(ticket, requesterRole))),
      catchError(() => of([]))
    );
  }

  createTicket(payload: CreateSupportTicketPayload): Observable<void> {
    return this.http.post(`${this.apiBaseUrl}/tickets`, {
      contactEmail: payload.userEmail,
      subject: payload.subject,
      description: payload.description
    }, { responseType: 'text' }).pipe(
      map(() => void 0)
    );
  }

  replyToTicket(
    ticket: SupportTicket,
    message: string,
    authorName: string
  ): Observable<SupportTicket> {
    const normalizedMessage = message.trim();
    if (!normalizedMessage) return of(ticket);

    const nextMessage: SupportTicketMessage = {
      id: `msg-${ticket.id}-${Date.now()}`,
      authorName,
      createdAt: this.getCurrentTimeLabel(),
      message: normalizedMessage,
      fromAdmin: false
    };

    this.saveLocalMessage(ticket.id, nextMessage);

    return of({
      ...ticket,
      messages: [...ticket.messages, nextMessage]
    });
  }

  private mapTicket(
    ticket: SupportTicketResponse,
    requesterRole: SupportRequesterRole
  ): SupportTicket {
    return {
      id: ticket.ticketId,
      userId: ticket.reporterId,
      userEmail: ticket.contactEmail,
      requesterRole,
      subject: ticket.subject,
      description: ticket.description,
      createdAt: ticket.createdAt,
      status: this.mapStatus(ticket.status),
      messages: [
        {
          id: `msg-${ticket.ticketId}`,
          authorName: ticket.contactEmail,
          createdAt: this.formatCreatedAt(ticket.createdAt),
          message: ticket.description,
          fromAdmin: false
        },
        ...this.getLocalMessages(ticket.ticketId)
      ]
    };
  }

  private mapStatus(status: string): SupportTicket['status'] {
    const normalizedStatus = status.toUpperCase();
    return normalizedStatus === 'RESOLVED' || normalizedStatus === 'CLOSED'
      ? 'done'
      : 'outstanding';
  }

  private getLocalMessages(ticketId: string): SupportTicketMessage[] {
    return this.readLocalMessages()[ticketId] || [];
  }

  private saveLocalMessage(ticketId: string, message: SupportTicketMessage): void {
    const messages = this.readLocalMessages();
    messages[ticketId] = [...(messages[ticketId] || []), message];
    localStorage.setItem(this.messagesStorageKey, JSON.stringify(messages));
  }

  private readLocalMessages(): Record<string, SupportTicketMessage[]> {
    try {
      return JSON.parse(localStorage.getItem(this.messagesStorageKey) || '{}');
    } catch {
      return {};
    }
  }

  private getCurrentTimeLabel(): string {
    return new Intl.DateTimeFormat('en', {
      hour: 'numeric',
      minute: '2-digit'
    }).format(new Date());
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
}
