import { NgClass, NgFor, NgIf } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { AppToast } from '../../../../shared/components/app-toast/app-toast';
import { AuthApiService } from '../../../../core/auth/auth-api.service';
import {
  CustomSelect,
  CustomSelectOption
} from '../../../../shared/components/custom-select/custom-select';
import {
  DashboardLayout
} from '../../../../shared/components/dashboard-layout/dashboard-layout';
import { adminMenuItems } from '../../admin-menu';
import { AdminSecurityAuditRepository } from '../../data/admin-security-audit.repository';
import {
  AdminManagedUser,
  AdminManagedUserRole,
  AdminManagedUserStatus,
  filterAdminManagedUsers
} from '../../domain/admin-security-audit';

@Component({
  selector: 'app-admin-security-audit',
  imports: [
    DashboardLayout,
    TranslatePipe,
    FormsModule,
    NgFor,
    NgIf,
    NgClass,
    CustomSelect,
    AppToast
  ],
  templateUrl: './security-audit.html',
  styleUrl: './security-audit.css',
})
export class SecurityAudit implements OnInit {
  adminUserId = '';
  email = '';
  searchTerm = '';
  users: AdminManagedUser[] = [];
  usersLoaded = false;
  selectedUser: AdminManagedUser | null = null;
  editModel: AdminManagedUser | null = null;
  showToast = false;
  toastType: 'success' | 'error' = 'success';
  toastMessageKey = '';

  menuItems = adminMenuItems;

  constructor(
    private adminSecurityAuditRepository: AdminSecurityAuditRepository,
    private translateService: TranslateService,
    private authService: AuthApiService,
    private changeDetector: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const session = this.authService.getSession();
    this.adminUserId = session?.userId || '';
    this.email = session?.email || '';
    this.loadDashboard();
  }

  get filteredUsers(): AdminManagedUser[] {
    return filterAdminManagedUsers(this.users, this.searchTerm);
  }

  get roleOptions(): CustomSelectOption[] {
    return [
      { label: this.translateService.instant('admin.securityAudit.roles.caregiver'), value: 'caregiver' },
      { label: this.translateService.instant('admin.securityAudit.roles.admin'), value: 'admin' },
      { label: this.translateService.instant('admin.securityAudit.roles.patient'), value: 'patient' }
    ];
  }

  get statusOptions(): CustomSelectOption[] {
    return [
      { label: this.translateService.instant('admin.securityAudit.status.active'), value: 'active' },
      { label: this.translateService.instant('admin.securityAudit.status.suspended'), value: 'suspended' }
    ];
  }

  openEditModal(user: AdminManagedUser): void {
    this.selectedUser = user;
    this.editModel = { ...user };
  }

  closeEditModal(): void {
    this.selectedUser = null;
    this.editModel = null;
  }

  changeRole(role: string): void {
    if (!this.editModel) {
      return;
    }

    this.editModel.role = role as AdminManagedUserRole;
  }

  changeStatus(status: string): void {
    if (!this.editModel) {
      return;
    }

    this.editModel.status = status as AdminManagedUserStatus;
  }

  changePhone(phone: string): void {
    if (!this.editModel) {
      return;
    }

    this.editModel.phone = this.formatPeruPhoneInput(phone);
  }

  saveUser(): void {
    if (!this.selectedUser || !this.editModel) {
      return;
    }

    if (!this.isValidPeruPhone(this.editModel.phone)) {
      this.showFeedback('error', 'admin.securityAudit.invalidPhone');
      return;
    }

    const { id, ...update } = this.editModel;

    this.adminSecurityAuditRepository
      .updateUser(this.adminUserId, id, update)
      .subscribe({
        next: user => {
          this.users = this.users.map(item =>
            item.id === user.id
              ? user
              : item
          );
          this.closeEditModal();
          this.showFeedback('success', 'admin.securityAudit.savedSuccessfully');
        },
        error: () => {
          this.showFeedback('error', 'admin.securityAudit.saveError');
        }
      });
  }

  getRoleLabelKey(role: AdminManagedUserRole): string {
    return `admin.securityAudit.roles.${role}`;
  }

  getStatusLabelKey(status: AdminManagedUserStatus): string {
    return `admin.securityAudit.status.${status}`;
  }

  getRoleClass(role: AdminManagedUserRole): string {
    return `role-pill--${role}`;
  }

  getStatusClass(status: AdminManagedUserStatus): string {
    return `status-pill--${status}`;
  }

  private loadDashboard(): void {
    this.usersLoaded = false;
    this.adminSecurityAuditRepository
      .getDashboard(this.adminUserId)
      .subscribe(data => {
        this.email = data.adminEmail;
        this.users = data.users;
        this.usersLoaded = true;
        this.changeDetector.detectChanges();
      });
  }

  private showFeedback(type: 'success' | 'error', messageKey: string): void {
    this.toastType = type;
    this.toastMessageKey = messageKey;
    this.showToast = true;

    setTimeout(() => {
      this.showToast = false;
    }, 3000);
  }

  private formatPeruPhoneInput(phone: string): string {
    const digits = this.getPeruPhoneDigits(phone);

    if (!digits) {
      return '';
    }

    const first = digits.slice(0, 3);
    const second = digits.slice(3, 6);
    const third = digits.slice(6, 9);

    return [
      '+51',
      first,
      second,
      third
    ].filter(Boolean).join(' ');
  }

  private isValidPeruPhone(phone: string): boolean {
    const digits = this.getPeruPhoneDigits(phone);

    return digits.length === 9 && digits.startsWith('9');
  }

  private getPeruPhoneDigits(phone: string): string {
    const digits = phone.replace(/\D/g, '');

    return digits.startsWith('51')
      ? digits.slice(2, 11)
      : digits.slice(0, 9);
  }
}
