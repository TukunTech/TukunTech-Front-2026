import { AppLanguage } from '../../../core/i18n/language.service';

export type CaregiverSubscriptionStatus = 'active' | 'inactive' | 'canceled';

export interface CaregiverSettingsPreferences {
  caregiverUserId: string;
  language: AppLanguage;
}

export interface CaregiverFamilySubscription {
  id: string;
  name: string;
  renewsOn: string;
  priceLabel: string;
  status: CaregiverSubscriptionStatus;
  planLabel: string;
}

export interface CaregiverSettingsDashboard {
  caregiverUserId: string;
  caregiverEmail: string;
  preferences: CaregiverSettingsPreferences;
  subscription: CaregiverFamilySubscription;
}
