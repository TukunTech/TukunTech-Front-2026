import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

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
  private preferences: CaregiverSettingsPreferences = {
    caregiverUserId: 'caregiver-demo-user',
    language: 'en'
  };

  private subscription: CaregiverFamilySubscription = {
    id: 'caregiver-family-plus',
    name: 'TukunTech Family Plus',
    renewsOn: '2026-06-09',
    priceLabel: '$200',
    status: 'active',
    planLabel: 'Premium - monthly'
  };

  getSettings(caregiverUserId: string): Observable<CaregiverSettingsDashboard> {
    return of({
      caregiverUserId,
      caregiverEmail: 'demo.caregiver@tukuntech.app',
      preferences: {
        ...this.preferences,
        caregiverUserId
      },
      subscription: { ...this.subscription }
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
    this.subscription = {
      ...this.subscription,
      status: 'active'
    };

    return of({ ...this.subscription });
  }

  cancelSubscription(
    caregiverUserId: string
  ): Observable<CaregiverFamilySubscription> {
    this.subscription = {
      ...this.subscription,
      status: 'canceled'
    };

    return of({ ...this.subscription });
  }
}
