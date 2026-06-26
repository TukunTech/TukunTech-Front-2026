import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthLayout } from '../../components/auth-layout/auth-layout';
import { NgIf } from '@angular/common';
import { SubscriptionAccessStore } from '../../../../core/subscription/subscription-access.store';

@Component({
  selector: 'app-login',
  imports: [AuthLayout, FormsModule, TranslatePipe, NgIf],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  role: 'patient' | 'caregiver' | 'admin' = 'patient';

  email = '';
  password = 'password';
  subscriptionBlocked = false;
  renewalSucceeded = false;
  blockedRenewalDate = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private subscriptionStore: SubscriptionAccessStore
  ) {
    const currentRole = this.route.snapshot.paramMap.get('role');

    if (currentRole === 'carebridge') {
      this.role = 'caregiver';
    }

    if (currentRole === 'caregiver' || currentRole === 'admin' || currentRole === 'patient') {
      this.role = currentRole;
    }

    const blockedRole = this.route.snapshot.queryParamMap.get('role');
    if (blockedRole === 'caregiver' || blockedRole === 'patient') {
      this.role = blockedRole;
    }

    this.email = this.role === 'admin'
      ? 'demo.admin@tukuntech.app'
      : 'demo.caregiver@tukuntech.app';
    this.subscriptionBlocked = this.route.snapshot.queryParamMap.get('reason') === 'subscription-expired';
    if (this.subscriptionBlocked && this.role !== 'admin') {
      this.blockedRenewalDate = this.subscriptionStore.getRoleAccess(this.role).renewsOn;
    }
  }

  signIn() {
    const resolvedRole = this.resolveRoleFromEmail();

    if (resolvedRole !== 'admin') {
      const access = this.subscriptionStore.getAccountAccess(this.email, resolvedRole);
      if (!access.canAccess) {
        this.subscriptionBlocked = true;
        this.renewalSucceeded = false;
        this.blockedRenewalDate = access.renewsOn;
        return;
      }
    }

    if (resolvedRole === 'patient') {
      this.router.navigate(['/patient/today']);
      return;
    }

    if (resolvedRole === 'caregiver') {
      this.router.navigate(['/caregiver/vital-signs']);
      return;
    }

    this.router.navigate(['/admin']);
  }

  renewSubscription(): void {
    const resolvedRole = this.resolveRoleFromEmail();
    if (resolvedRole === 'admin') return;
    const access = this.subscriptionStore.renew(this.email, resolvedRole);
    this.subscriptionBlocked = false;
    this.renewalSucceeded = true;
    this.blockedRenewalDate = access.renewsOn;
  }

  goBack() {
    this.router.navigate(['/']);
  }

  goToCreateAccount() {
    this.router.navigate(['/register']);
  }


  simulateError() {
    alert('Simulated login error');
  }

  showPassword = false;

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  get isAdminLogin(): boolean {
    return this.role === 'admin';
  }

  get titleKey(): string {
    return this.isAdminLogin ? 'login.title.admin' : 'login.title.user';
  }

  get roleLabelKey(): string {
    return this.isAdminLogin ? 'roles.admin' : 'roles.member';
  }

  private resolveRoleFromEmail(): 'patient' | 'caregiver' | 'admin' {
    if (this.role === 'admin') {
      return 'admin';
    }

    const normalizedEmail = this.email.trim().toLowerCase();
    return normalizedEmail.includes('patient') ? 'patient' : 'caregiver';
  }
}
