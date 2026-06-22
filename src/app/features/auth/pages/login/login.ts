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

    this.email = `demo.${this.role}@tukuntech.app`;
    this.subscriptionBlocked = this.route.snapshot.queryParamMap.get('reason') === 'subscription-expired';
    if (this.subscriptionBlocked && this.role !== 'admin') {
      this.blockedRenewalDate = this.subscriptionStore.getRoleAccess(this.role).renewsOn;
    }
  }

  signIn() {
    if (this.role !== 'admin') {
      const access = this.subscriptionStore.getAccountAccess(this.email, this.role);
      if (!access.canAccess) {
        this.subscriptionBlocked = true;
        this.renewalSucceeded = false;
        this.blockedRenewalDate = access.renewsOn;
        return;
      }
    }

    if (this.role === 'patient') {
      this.router.navigate(['/patient/today']);
      return;
    }

    if (this.role === 'caregiver') {
      this.router.navigate(['/caregiver/vital-signs']);
      return;
    }

    this.router.navigate(['/admin']);
  }

  renewSubscription(): void {
    if (this.role === 'admin') return;
    const access = this.subscriptionStore.renew(this.email, this.role);
    this.subscriptionBlocked = false;
    this.renewalSucceeded = true;
    this.blockedRenewalDate = access.renewsOn;
  }

  goBack() {
    this.router.navigate(['/']);
  }

  goToCreateAccount() {
    if (this.role === 'patient') {
      this.router.navigate(['/register/patient']);
      return;
    }

    if (this.role === 'caregiver') {
      this.router.navigate(['/register/caregiver']);
    }
  }


  simulateError() {
    alert('Simulated login error');
  }

  showPassword = false;

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }
}
