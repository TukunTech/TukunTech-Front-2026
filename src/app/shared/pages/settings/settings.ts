import { ChangeDetectorRef, Component } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

import {
  DashboardLayout,
  DashboardMenuItem
} from '../../components/dashboard-layout/dashboard-layout';

import {
  CustomSelect,
  CustomSelectOption
} from '../../components/custom-select/custom-select';

import { AppToast } from '../../components/app-toast/app-toast';
import { AuthApiService } from '../../../core/auth/auth-api.service';
import { LanguageService } from '../../../core/i18n/language.service';
import { PatientAlertRepository } from '../../../features/patient/data/patient-alert.repository';

@Component({
  selector: 'app-settings',
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
  userId = '';
  email = '';
  role = 'Patient';
  urgentAlertShow = false;
  urgentAlertTitleKey = '';
  urgentAlertMessageKey = '';

  showToast = false;

  menuItems: DashboardMenuItem[] = [
    { icon: 'bi-sun', labelKey: 'sidebar.patient.vitalSigns', route: '/patient/today' },
    { icon: 'bi-cpu', labelKey: 'sidebar.patient.device', route: '/patient/device' },
    { icon: 'bi-arrow-counterclockwise', labelKey: 'sidebar.patient.history', route: '/patient/history' },
    { icon: 'bi-person-check', labelKey: 'sidebar.patient.profile', route: '/patient/profile' },
    { icon: 'bi-ticket-perforated', labelKey: 'sidebar.patient.support', route: '/patient/support' },
    { icon: 'bi-gear', labelKey: 'sidebar.patient.settings', route: '/patient/settings' }
  ];

  language = 'en';

  languageOptions: CustomSelectOption[] = [
    { label: 'English', value: 'en' },
    { label: 'Español', value: 'es' }
  ];

  constructor(
    private authService: AuthApiService,
    private languageService: LanguageService,
    private patientAlertRepository: PatientAlertRepository,
    private changeDetector: ChangeDetectorRef
  ) {
    const session = this.authService.getSession();
    this.userId = session?.userId || '';
    this.email = session?.email || '';
    this.language = this.languageService.currentLanguage;
    this.loadGlobalUrgentAlert();
  }

  changeLanguage(language: string) {
    this.language = this.languageService.setLanguage(language);
  }

  saveSettings() {
    this.language = this.languageService.setLanguage(this.language);

    this.showToast = true;

    setTimeout(() => {
      this.showToast = false;
    }, 3000);
  }

  private loadGlobalUrgentAlert(): void {
    if (!this.userId) return;

    this.patientAlertRepository
      .getGlobalUrgentAlert(this.userId)
      .subscribe(alert => {
        this.urgentAlertShow = !!alert;
        this.urgentAlertTitleKey = alert?.titleKey || '';
        this.urgentAlertMessageKey = alert?.messageKey || '';
        this.changeDetector.detectChanges();
      });
  }
}
