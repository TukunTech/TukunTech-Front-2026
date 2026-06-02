import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthLayout } from '../../components/auth-layout/auth-layout';
import { NgIf } from '@angular/common';

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

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {
    const currentRole = this.route.snapshot.paramMap.get('role');

    if (currentRole === 'caregiver' || currentRole === 'admin' || currentRole === 'patient') {
      this.role = currentRole;
    }

    this.email = `demo.${this.role}@tukuntech.app`;
  }

  signIn() {
    if (this.role === 'patient') {
      this.router.navigate(['/patient/today']);
      return;
    }

    if (this.role === 'caregiver') {
      this.router.navigate(['/caregiver']);
      return;
    }

    this.router.navigate(['/admin']);
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
