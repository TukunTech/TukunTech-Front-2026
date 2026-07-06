import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgIf } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';

import { AuthLayout } from '../../components/auth-layout/auth-layout';

type PaymentResultStatus = 'success' | 'canceled';

@Component({
  selector: 'app-payment-result',
  imports: [AuthLayout, NgIf, TranslatePipe],
  templateUrl: './payment-result.html',
  styleUrl: './payment-result.css'
})
export class PaymentResult {
  readonly status: PaymentResultStatus;

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.status = this.route.snapshot.data['status'] === 'success'
      ? 'success'
      : 'canceled';
  }

  get isSuccess(): boolean {
    return this.status === 'success';
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  tryAgain(): void {
    this.router.navigate(['/register']);
  }
}
