import { Injectable } from '@angular/core';

import { SupportTicketRepository } from '../../patient/data/support-ticket.repository';
import { CaregiverSupportTicket } from '../domain/caregiver-support';

@Injectable({
  providedIn: 'root'
})
export class CaregiverSupportRepository {
  constructor(private supportTicketRepository: SupportTicketRepository) {}

  getTicketsForCaregiver(email: string): CaregiverSupportTicket[] {
    return this.supportTicketRepository.getTicketsForUser(email, 'caregiver');
  }

  createTicket(
    caregiverUserId: string,
    caregiverEmail: string,
    subject: string,
    description: string
  ): CaregiverSupportTicket {
    return this.supportTicketRepository.createTicket({
      userId: caregiverUserId,
      userEmail: caregiverEmail,
      requesterRole: 'caregiver',
      subject,
      description
    });
  }
}
