import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { SupportTicketRepository } from '../../patient/data/support-ticket.repository';
import { CaregiverSupportTicket } from '../domain/caregiver-support';

@Injectable({
  providedIn: 'root'
})
export class CaregiverSupportRepository {
  constructor(private supportTicketRepository: SupportTicketRepository) {}

  getTicketsForCaregiver(email: string): Observable<CaregiverSupportTicket[]> {
    return this.supportTicketRepository.getTicketsForUser(email, 'caregiver');
  }

  createTicket(
    caregiverUserId: string,
    caregiverEmail: string,
    subject: string,
    description: string
  ): Observable<void> {
    return this.supportTicketRepository.createTicket({
      userId: caregiverUserId,
      userEmail: caregiverEmail,
      requesterRole: 'caregiver',
      subject,
      description
    });
  }

  replyToTicket(
    ticket: CaregiverSupportTicket,
    message: string,
    authorName: string
  ): Observable<CaregiverSupportTicket> {
    return this.supportTicketRepository.replyToTicket(ticket, message, authorName);
  }
}
