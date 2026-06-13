export type AdminManagedUserRole = 'caregiver' | 'admin' | 'patient';

export type AdminManagedUserStatus = 'active' | 'suspended';

export interface AdminManagedUser {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: AdminManagedUserRole;
  status: AdminManagedUserStatus;
  joinedAt: string;
}

export interface AdminSecurityAuditDashboard {
  adminUserId: string;
  adminEmail: string;
  users: AdminManagedUser[];
}

export type AdminManagedUserUpdate = Omit<AdminManagedUser, 'id'>;

export function filterAdminManagedUsers(
  users: AdminManagedUser[],
  searchTerm: string
): AdminManagedUser[] {
  const normalizedTerm = searchTerm.trim().toLowerCase();

  if (!normalizedTerm) {
    return users;
  }

  return users.filter(user =>
    user.fullName.toLowerCase().includes(normalizedTerm) ||
    user.email.toLowerCase().includes(normalizedTerm) ||
    user.role.toLowerCase().includes(normalizedTerm) ||
    user.status.toLowerCase().includes(normalizedTerm)
  );
}
