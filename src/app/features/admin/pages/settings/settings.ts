import { NgIf } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

import { AuthApiService } from '../../../../core/auth/auth-api.service';
import { AppLanguage } from '../../../../core/i18n/language.service';
import { AppToast } from '../../../../shared/components/app-toast/app-toast';
import { CustomSelect, CustomSelectOption } from '../../../../shared/components/custom-select/custom-select';
import { DashboardLayout } from '../../../../shared/components/dashboard-layout/dashboard-layout';
import { adminMenuItems } from '../../admin-menu';
import { AdminSettingsRepository } from '../../data/admin-settings.repository';

@Component({
  selector: 'app-admin-settings',
  imports: [DashboardLayout, TranslatePipe, CustomSelect, AppToast, NgIf],
  templateUrl: './settings.html',
  styleUrl: './settings.css',
})
export class Settings implements OnInit {
  adminUserId = '';
  email = '';
  language: AppLanguage = 'en';
  settingsLoaded = false;
  showToast = false;
  menuItems = adminMenuItems;

  languageOptions: CustomSelectOption[] = [
    { label: 'English', value: 'en' },
    { label: 'Español', value: 'es' }
  ];

  constructor(
    private authService: AuthApiService,
    private adminSettingsRepository: AdminSettingsRepository,
    private changeDetector: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const session = this.authService.getSession();
    this.adminUserId = session?.userId || '';
    this.email = session?.email || '';
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
        this.settingsLoaded = true;
        this.changeDetector.detectChanges();
      });
  }
}
