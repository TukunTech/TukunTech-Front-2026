import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { SubscriptionAccessStore } from '../../../core/subscription/subscription-access.store';

import { AppLanguage } from '../../../core/i18n/language.service';
import {
  CaregiverFamilySubscription,
  CaregiverSettingsDashboard,
  CaregiverSettingsPreferences
} from '../domain/caregiver-settings';

@Injectable({
  providedIn: 'root'
})
export class CaregiverSettingsRepository {
  constructor(private subscriptionStore: SubscriptionAccessStore) {}
  private preferences: CaregiverSettingsPreferences = {
    caregiverUserId: 'caregiver-demo-user',
    language: 'en'
  };

  private subscription: CaregiverFamilySubscription = {
    id: 'caregiver-family-plus',
    name: 'TukunTech Family Plus',
    renewsOn: '2026-06-24',
    priceLabel: '$200',
    status: 'active',
    planLabel: 'Premium - monthly'
  };

  getSettings(caregiverUserId: string): Observable<CaregiverSettingsDashboard> {
    const access = this.subscriptionStore.getRoleAccess('caregiver');
    return of({
      caregiverUserId,
      caregiverEmail: 'demo.caregiver@tukuntech.app',
      preferences: {
        ...this.preferences,
        caregiverUserId
      },
      subscription: {
        ...this.subscription,
        renewsOn: access.renewsOn,
        status: access.status === 'active' ? 'active' : access.status === 'canceled' ? 'canceled' : 'inactive'
      }
    });
  }

  updateLanguage(
    caregiverUserId: string,
    language: AppLanguage
  ): Observable<CaregiverSettingsPreferences> {
    this.preferences = {
      caregiverUserId,
      language
    };

    return of({ ...this.preferences });
  }

  renewSubscription(
    caregiverUserId: string
  ): Observable<CaregiverFamilySubscription> {
    const access = this.subscriptionStore.renew('demo.caregiver@tukuntech.app', 'caregiver');
    this.subscription = {
      ...this.subscription,
      status: 'active',
      renewsOn: access.renewsOn
    };

    return of({ ...this.subscription });
  }

  cancelSubscription(
    caregiverUserId: string
  ): Observable<CaregiverFamilySubscription> {
    this.subscriptionStore.cancel('demo.caregiver@tukuntech.app', 'caregiver');
    this.subscription = {
      ...this.subscription,
      status: 'canceled'
    };

    return of({ ...this.subscription });
  }
}
