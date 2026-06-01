import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthLayout } from '../../components/auth-layout/auth-layout';

@Component({
  selector: 'app-register-plan',
  imports: [AuthLayout, TranslatePipe],
  templateUrl: './register-plan.html',
  styleUrl: './register-plan.css',
})
export class RegisterPlan {
  constructor(private router: Router) {}

  goToPatientRegister() {
    this.router.navigate(['/register/patient']);
  }

  goToCaregiverRegister() {
    this.router.navigate(['/register/caregiver']);
  }

  goToLogin() {
    this.router.navigate(['/login/patient']);
  }
}
