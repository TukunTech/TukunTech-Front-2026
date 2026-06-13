export type AdminSupportTicketStatus = 'pending' | 'done';

export interface AdminSupportMessage {
  id: string;
  authorName: string;
  createdAt: string;
  message: string;
  fromAdmin: boolean;
}

export interface AdminSupportTicket {
  id: string;
  code: string;
  subject: string;
  requesterEmail: string;
  createdAgo: string;
  status: AdminSupportTicketStatus;
  messages: AdminSupportMessage[];
}

export interface AdminSupportTicketDashboard {
  adminEmail: string;
  tickets: AdminSupportTicket[];
}

export interface AdminSupportTicketReply {
  message: string;
  markDone: boolean;
}

export function findTicketById(
  tickets: AdminSupportTicket[],
  ticketId: string
): AdminSupportTicket | null {
  return tickets.find(ticket => ticket.id === ticketId) ?? null;
}
