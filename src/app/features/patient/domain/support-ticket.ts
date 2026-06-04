export type SupportRequesterRole = 'patient' | 'caregiver';

export type SupportTicketStatus = 'done' | 'outstanding';

export interface SupportTicket {
  id: string;
  userId: string;
  userEmail: string;
  requesterRole: SupportRequesterRole;
  subject: string;
  description: string;
  createdAt: string;
  status: SupportTicketStatus;
}

export interface CreateSupportTicketPayload {
  userId: string;
  userEmail: string;
  requesterRole: SupportRequesterRole;
  subject: string;
  description: string;
}
