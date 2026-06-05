import { Component } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { AppLanguage, LanguageService } from '../../../../core/i18n/language.service';
import { AppToast } from '../../../../shared/components/app-toast/app-toast';
import {
  CustomSelect,
  CustomSelectOption
} from '../../../../shared/components/custom-select/custom-select';
import {
  DashboardLayout,
  DashboardMenuItem
} from '../../../../shared/components/dashboard-layout/dashboard-layout';
import { CaregiverAlertRepository } from '../../data/caregiver-alert.repository';
import { CaregiverSettingsRepository } from '../../data/caregiver-settings.repository';
import { CaregiverFamilySubscription } from '../../domain/caregiver-settings';

@Component({
  selector: 'app-caregiver-settings',
  imports: [
    DashboardLayout,
    TranslatePipe,
    CustomSelect,
    AppToast
  ],
  templateUrl: './settings.html',
  styleUrl: './settings.css',
})
export class Settings {
  caregiverUserId = 'caregiver-demo-user';
  email = 'demo.caregiver@tukuntech.app';
  language: AppLanguage = 'en';
  urgentAlertShow = false;
  urgentAlertTitleKey = '';
  urgentAlertMessageKey = '';
  urgentAlertMessageParams: Record<string, string> = {};
  showToast = false;
  toastMessageKey = '';

  subscription: CaregiverFamilySubscription = {
    id: '',
    name: '',
    renewsOn: '',
    priceLabel: '',
    status: 'inactive',
    planLabel: ''
  };

  menuItems: DashboardMenuItem[] = [
    { icon: 'bi-sun', labelKey: 'sidebar.caregiver.vitalSigns', route: '/caregiver/vital-signs' },
    { icon: 'bi-cpu', labelKey: 'sidebar.caregiver.device', route: '/caregiver/device' },
    { icon: 'bi-arrow-counterclockwise', labelKey: 'sidebar.caregiver.history', route: '/caregiver/history' },
    { icon: 'bi-person-check', labelKey: 'sidebar.caregiver.profile', route: '/caregiver/profile' },
    { icon: 'bi-ticket-perforated', labelKey: 'sidebar.caregiver.support', route: '/caregiver/support' },
    { icon: 'bi-gear', labelKey: 'sidebar.caregiver.settings', route: '/caregiver/settings' }
  ];

  languageOptions: CustomSelectOption[] = [
    { label: 'English', value: 'en' },
    { label: 'Espa\u00f1ol', value: 'es' }
  ];

  constructor(
    private languageService: LanguageService,
    private translateService: TranslateService,
    private caregiverAlertRepository: CaregiverAlertRepository,
    private caregiverSettingsRepository: CaregiverSettingsRepository
  ) {
    this.language = this.languageService.currentLanguage;
    this.loadSettings();
    this.loadGlobalCriticalAlert();
  }

  changeLanguage(language: string): void {
    this.language = this.languageService.setLanguage(language);
  }

  saveSettings(): void {
    this.caregiverSettingsRepository
      .updateLanguage(this.caregiverUserId, this.language)
      .subscribe(preferences => {
        this.language = this.languageService.setLanguage(preferences.language);
        this.showSuccessToast('caregiver.settings.savedSuccessfully');
      });
  }

  renewSubscription(): void {
    this.caregiverSettingsRepository
      .renewSubscription(this.caregiverUserId)
      .subscribe(subscription => {
        this.subscription = subscription;
        this.showSuccessToast('caregiver.settings.subscriptionRenewed');
      });
  }

  cancelSubscription(): void {
    this.caregiverSettingsRepository
      .cancelSubscription(this.caregiverUserId)
      .subscribe(subscription => {
        this.subscription = subscription;
        this.showSuccessToast('caregiver.settings.subscriptionCanceled');
      });
  }

  getStatusLabelKey(): string {
    return `caregiver.settings.subscription.status.${this.subscription.status}`;
  }

  formatRenewalDate(value: string): string {
    if (!value) {
      return '';
    }

    const locale = this.translateService.currentLang === 'es'
      ? 'es-PE'
      : 'en-US';

    return new Intl.DateTimeFormat(locale, {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    }).format(new Date(value));
  }

  private loadSettings(): void {
    this.caregiverSettingsRepository
      .getSettings(this.caregiverUserId)
      .subscribe(data => {
        this.email = data.caregiverEmail;
        this.language = this.languageService.currentLanguage;
        this.subscription = data.subscription;
      });
  }

  private loadGlobalCriticalAlert(): void {
    this.caregiverAlertRepository
      .getGlobalCriticalAlert(this.caregiverUserId)
      .subscribe(alert => {
        this.urgentAlertShow = !!alert;
        this.urgentAlertTitleKey = alert?.titleKey || '';
        this.urgentAlertMessageKey = alert?.messageKey || '';
        this.urgentAlertMessageParams = alert?.messageParams || {};
      });
  }

  private showSuccessToast(messageKey: string): void {
    this.toastMessageKey = messageKey;
    this.showToast = true;

    setTimeout(() => {
      this.showToast = false;
    }, 3000);
  }
}
