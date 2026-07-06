import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthLayout } from '../../components/auth-layout/auth-layout';
import { NgIf } from '@angular/common';
import { AuthApiService } from '../../../../core/auth/auth-api.service';
import { finalize, timeout } from 'rxjs';

@Component({
  selector: 'app-login',
  imports: [AuthLayout, FormsModule, TranslatePipe, NgIf],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  role: 'patient' | 'caregiver' | 'admin' = 'patient';

  email = '';
  password = '';
  isSubmitting = false;
  loginError = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthApiService
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
  }

  signIn() {
    this.loginError = '';
    this.isSubmitting = true;

    this.authService.login({
      email: this.email.trim(),
      password: this.password
    }).pipe(
      timeout(15000),
      finalize(() => {
        this.isSubmitting = false;
      })
    ).subscribe({
      next: () => {
        const role = this.authService.getSession()?.role.toUpperCase();

        if (role === 'PATIENT') {
          this.router.navigate(['/patient/today']);
          return;
        }

        if (role === 'CAREGIVER') {
          this.router.navigate(['/caregiver/vital-signs']);
          return;
        }

        if (role === 'ADMIN') {
          this.router.navigate(['/admin']);
          return;
        }

        this.authService.logout();
        this.loginError = 'No se pudo reconocer el rol de esta cuenta.';
      },
      error: error => {
        this.authService.logout();
        this.loginError = error.name === 'TimeoutError'
          ? 'El servidor tardó demasiado en responder. Intenta nuevamente.'
          : typeof error.error === 'string'
          ? error.error
          : 'No se pudo iniciar sesion. Revisa el correo y la contrasena.';
      }
    });
  }

  goBack() {
    this.router.navigate(['/']);
  }

  goToCreateAccount() {
    this.router.navigate(['/register']);
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

}
