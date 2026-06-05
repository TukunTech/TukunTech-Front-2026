import { Injectable } from '@angular/core';

import {
  CreateSupportTicketPayload,
  SupportRequesterRole,
  SupportTicket
} from '../domain/support-ticket';

@Injectable({
  providedIn: 'root'
})
export class SupportTicketRepository {
  private tickets: SupportTicket[] = [
    {
      id: 'ticket-demo-1',
      userId: 'patient-demo-user',
      userEmail: 'demo.patient@tukuntech.app',
      requesterRole: 'patient',
      subject: 'Problem with connection',
      description: 'The device disconnected for a few minutes.',
      createdAt: '2026-03-24T10:00:00.000Z',
      status: 'done'
    },
    {
      id: 'ticket-demo-2',
      userId: 'patient-demo-user',
      userEmail: 'demo.patient@tukuntech.app',
      requesterRole: 'patient',
      subject: 'Problem with sync',
      description: 'The history page did not update immediately.',
      createdAt: '2026-03-24T12:30:00.000Z',
      status: 'outstanding'
    },
    {
      id: 'ticket-caregiver-demo-1',
      userId: 'caregiver-demo-user',
      userEmail: 'demo.caregiver@tukuntech.app',
      requesterRole: 'caregiver',
      subject: 'Patient device offline',
      description: 'Robert Silva device appears offline in the dashboard.',
      createdAt: '2026-03-24T10:00:00.000Z',
      status: 'outstanding'
    },
    {
      id: 'ticket-caregiver-demo-2',
      userId: 'caregiver-demo-user',
      userEmail: 'demo.caregiver@tukuntech.app',
      requesterRole: 'caregiver',
      subject: 'Report download question',
      description: 'Need help downloading a weekly report.',
      createdAt: '2026-03-24T12:30:00.000Z',
      status: 'done'
    }
  ];

  getTicketsForUser(userEmail: string, requesterRole: SupportRequesterRole): SupportTicket[] {
    return this.tickets.filter(ticket =>
      ticket.userEmail === userEmail && ticket.requesterRole === requesterRole
    );
  }

  createTicket(payload: CreateSupportTicketPayload): SupportTicket {
    const ticket: SupportTicket = {
      ...payload,
      id: `ticket-${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: 'outstanding'
    };

    this.tickets = [ticket, ...this.tickets];

    return ticket;
  }
}
