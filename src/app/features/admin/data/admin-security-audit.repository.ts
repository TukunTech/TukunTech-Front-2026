import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Inject } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { API_BASE_URL } from '../../../core/api/api.config';
import { AuthApiService } from '../../../core/auth/auth-api.service';

import {
  AdminManagedUser,
  AdminManagedUserUpdate,
  AdminSecurityAuditDashboard
} from '../domain/admin-security-audit';

interface AdminUserResponse {
  userId: string;
  email: string;
  fullName?: string;
  role?: string;
  status?: string;
  subscriptionEnd?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdminSecurityAuditRepository {
  private users: AdminManagedUser[] = [];

  constructor(
    private http: HttpClient,
    private authService: AuthApiService,
    @Inject(API_BASE_URL) private apiBaseUrl: string
  ) {}

  getDashboard(adminUserId: string): Observable<AdminSecurityAuditDashboard> {
    return this.http.get<AdminUserResponse[]>(`${this.apiBaseUrl}/admin/users`).pipe(
      map(users => {
        const session = this.authService.getSession();
        this.users = this.dedupeUsers(users.map(user => this.mapAdminUser(user)));

        return {
          adminUserId: session?.userId || adminUserId,
          adminEmail: session?.email || '',
          users: this.users.map(user => ({ ...user }))
        };
      }),
      catchError(() => of({
        adminUserId,
        adminEmail: this.authService.getSession()?.email || '',
        users: this.users.map(user => ({ ...user }))
      }))
    );
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

    const updateLocal = () => {
      this.users = this.users.map(user =>
        user.id === userId
          ? nextUser
          : user
      );
      return { ...nextUser };
    };

    if (update.status === 'suspended') {
      return this.http.delete(`${this.apiBaseUrl}/accounts/${userId}`, { responseType: 'text' }).pipe(
        map(() => updateLocal()),
        catchError(() => throwError(() => new Error('Could not suspend user')))
      );
    }

    return of(updateLocal());
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

  private mapAdminUser(user: AdminUserResponse): AdminManagedUser {
    return {
      id: user.userId,
      fullName: user.fullName || user.email,
      email: user.email,
      phone: '',
      role: this.mapRole(user.role),
      status: this.mapStatus(user.status),
      joinedAt: user.subscriptionEnd || ''
    };
  }

  private mapRole(role?: string): AdminManagedUser['role'] {
    const normalizedRole = (role || '').toUpperCase();
    if (normalizedRole.includes('ADMIN')) return 'admin';
    if (normalizedRole.includes('CAREGIVER')) return 'caregiver';
    return 'patient';
  }

  private mapStatus(status?: string): AdminManagedUser['status'] {
    return (status || '').toUpperCase() === 'ACTIVE' ? 'active' : 'suspended';
  }

  private dedupeUsers(users: AdminManagedUser[]): AdminManagedUser[] {
    const seen = new Set<string>();
    return users.filter(user => {
      const key = (user.id || user.email).toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

}
