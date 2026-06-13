import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';

import {
  AdminManagedUser,
  AdminManagedUserUpdate,
  AdminSecurityAuditDashboard
} from '../domain/admin-security-audit';

@Injectable({
  providedIn: 'root'
})
export class AdminSecurityAuditRepository {
  private users: AdminManagedUser[] = [
    {
      id: 'user-sarah-caregiver',
      fullName: 'Sarah Marsh',
      email: 'sarah@tukuntech.com',
      phone: '+51 955 512 880',
      role: 'caregiver',
      status: 'active',
      joinedAt: '2026-03-12'
    },
    {
      id: 'user-sarah-admin',
      fullName: 'Sarah Marsh',
      email: 'sarah.admin@tukuntech.com',
      phone: '+51 955 240 188',
      role: 'admin',
      status: 'active',
      joinedAt: '2026-03-12'
    },
    {
      id: 'user-sarah-patient',
      fullName: 'Sarah Marsh',
      email: 'sarah.patient@tukuntech.com',
      phone: '+51 955 991 244',
      role: 'patient',
      status: 'active',
      joinedAt: '2026-03-12'
    },
    {
      id: 'user-sarah-suspended',
      fullName: 'Sarah Marsh',
      email: 'sarah.suspended@tukuntech.com',
      phone: '+51 955 731 066',
      role: 'patient',
      status: 'suspended',
      joinedAt: '2026-03-12'
    }
  ];

  getDashboard(adminUserId: string): Observable<AdminSecurityAuditDashboard> {
    return of({
      adminUserId,
      adminEmail: 'demo.admin@tukuntech.app',
      users: this.users.map(user => ({ ...user }))
    });
  }

  updateUser(
    adminUserId: string,
    userId: string,
    update: AdminManagedUserUpdate
  ): Observable<AdminManagedUser> {
    if (
      !update.fullName.trim() ||
      !update.email.trim() ||
      !this.isValidPeruPhone(update.phone)
    ) {
      return throwError(() => new Error('Missing required user fields'));
    }

    const nextUser: AdminManagedUser = {
      id: userId,
      ...update,
      fullName: update.fullName.trim(),
      email: update.email.trim(),
      phone: this.formatPeruPhone(update.phone)
    };

    this.users = this.users.map(user =>
      user.id === userId
        ? nextUser
        : user
    );

    return of({ ...nextUser });
  }

  private isValidPeruPhone(phone: string): boolean {
    const digits = this.getPeruPhoneDigits(phone);

    return digits.length === 9 && digits.startsWith('9');
  }

  private formatPeruPhone(phone: string): string {
    const digits = this.getPeruPhoneDigits(phone);

    return `+51 ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 9)}`;
  }

  private getPeruPhoneDigits(phone: string): string {
    const digits = phone.replace(/\D/g, '');

    return digits.startsWith('51')
      ? digits.slice(2, 11)
      : digits.slice(0, 9);
  }
}
