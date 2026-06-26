import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SubscriptionAccessStore, SubscriptionRole } from './subscription-access.store';

function createGuard(role: SubscriptionRole): CanActivateFn {
  return () => {
    const store = inject(SubscriptionAccessStore);
    const router = inject(Router);
    const access = store.getRoleAccess(role);

    return access.canAccess
      ? true
      : router.createUrlTree(['/login'], { queryParams: { reason: 'subscription-expired', role } });
  };
}

export const patientSubscriptionGuard = createGuard('patient');
export const caregiverSubscriptionGuard = createGuard('caregiver');
