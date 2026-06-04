import { Component } from '@angular/core';
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
import { LanguageService } from '../../../core/i18n/language.service';

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
  email = 'demo.patient@tukuntech.app';
  role = 'Patient';

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

  constructor(private languageService: LanguageService) {
    this.language = this.languageService.currentLanguage;
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
}
