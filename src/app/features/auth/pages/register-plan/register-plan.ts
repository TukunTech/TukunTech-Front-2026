import { Component } from '@angular/core';
import { NgFor } from '@angular/common';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthLayout } from '../../components/auth-layout/auth-layout';

@Component({
  selector: 'app-register-plan',
  imports: [AuthLayout, TranslatePipe, NgFor],
  templateUrl: './register-plan.html',
  styleUrl: './register-plan.css',
})
export class RegisterPlan {
  constructor(private router: Router) {}

  plans = [
    {
      id: 'individual',
      titleKey: 'registerPlan.individual.title',
      descriptionKey: 'registerPlan.individual.description',
      icon: 'bi bi-person-heart',
      tone: 'blue',
      monthlyPrice: 15,
      initialPrice: 50,
      monthlyStripePriceId: 'price_1TlKxoKE2OW5fr4NtaaptoKG',
      initialStripePriceId: 'price_1TlL0uKE2OW5fr4NJVs86Hxg'
    },
    {
      id: 'family-2',
      titleKey: 'registerPlan.family2.title',
      descriptionKey: 'registerPlan.family2.description',
      icon: 'bi bi-people',
      tone: 'green',
      monthlyPrice: 28,
      initialPrice: 95,
      monthlyStripePriceId: 'price_1TlWHFKE2OW5fr4NMGsrsJyi',
      initialStripePriceId: 'price_1TlWHgKE2OW5fr4N3EE7ulm7'
    },
    {
      id: 'family-3',
      titleKey: 'registerPlan.family3.title',
      descriptionKey: 'registerPlan.family3.description',
      icon: 'bi bi-people',
      tone: 'green',
      monthlyPrice: 40,
      initialPrice: 140,
      monthlyStripePriceId: 'price_1TlWHzKE2OW5fr4NVlwwbWaL',
      initialStripePriceId: 'price_1TlWIEKE2OW5fr4N6IYuqNzH'
    },
    {
      id: 'family-4',
      titleKey: 'registerPlan.family4.title',
      descriptionKey: 'registerPlan.family4.description',
      icon: 'bi bi-people',
      tone: 'green',
      monthlyPrice: 52,
      initialPrice: 180,
      monthlyStripePriceId: 'price_1TlWIRKE2OW5fr4NUYmM5vvk',
      initialStripePriceId: 'price_1TlWIeKE2OW5fr4NDHoURaeG'
    },
    {
      id: 'family-5',
      titleKey: 'registerPlan.family5.title',
      descriptionKey: 'registerPlan.family5.description',
      icon: 'bi bi-people',
      tone: 'green',
      monthlyPrice: 62,
      initialPrice: 215,
      monthlyStripePriceId: 'price_1TlWIrKE2OW5fr4Ns4OAz36U',
      initialStripePriceId: 'price_1TlWJ3KE2OW5fr4NCK15zWxe'
    }
  ];

  choosePlan(planId: string) {
    this.router.navigate(['/register/account'], { queryParams: { plan: planId } });
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}
