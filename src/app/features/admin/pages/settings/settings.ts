import { Component } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

import { AppLanguage } from '../../../../core/i18n/language.service';
import { AppToast } from '../../../../shared/components/app-toast/app-toast';
import { CustomSelect, CustomSelectOption } from '../../../../shared/components/custom-select/custom-select';
import { DashboardLayout } from '../../../../shared/components/dashboard-layout/dashboard-layout';
import { adminMenuItems } from '../../admin-menu';
import { AdminSettingsRepository } from '../../data/admin-settings.repository';

@Component({
  selector: 'app-admin-settings',
  imports: [DashboardLayout, TranslatePipe, CustomSelect, AppToast],
  templateUrl: './settings.html',
  styleUrl: './settings.css',
})
export class Settings {
  adminUserId = 'admin-demo-user';
  email = 'demo.admin@tukuntech.app';
  language: AppLanguage = 'en';
  showToast = false;
  menuItems = adminMenuItems;

  languageOptions: CustomSelectOption[] = [
    { label: 'English', value: 'en' },
    { label: 'Español', value: 'es' }
  ];

  constructor(private adminSettingsRepository: AdminSettingsRepository) {
    this.loadSettings();
  }

  changeLanguage(language: string): void {
    this.language = language as AppLanguage;
  }

  saveSettings(): void {
    this.adminSettingsRepository
      .saveProfile(this.adminUserId, {
        adminEmail: this.email,
        language: this.language
      })
      .subscribe(profile => {
        this.email = profile.adminEmail;
        this.language = profile.language;
        this.showToast = true;

        setTimeout(() => {
          this.showToast = false;
        }, 3000);
      });
  }

  private loadSettings(): void {
    this.adminSettingsRepository
      .getProfile(this.adminUserId)
      .subscribe(profile => {
        this.email = profile.adminEmail;
        this.language = profile.language;
      });
  }
}
