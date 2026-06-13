import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

import { LanguageService } from '../../../core/i18n/language.service';
import { AdminSettingsProfile } from '../domain/admin-settings';

@Injectable({ providedIn: 'root' })
export class AdminSettingsRepository {
  private readonly adminEmail = 'demo.admin@tukuntech.app';

  constructor(private languageService: LanguageService) {}

  getProfile(adminUserId: string): Observable<AdminSettingsProfile> {
    return of({
      adminEmail: this.adminEmail,
      language: this.languageService.currentLanguage
    });
  }

  saveProfile(
    adminUserId: string,
    profile: AdminSettingsProfile
  ): Observable<AdminSettingsProfile> {
    const language = this.languageService.setLanguage(profile.language);

    return of({
      ...profile,
      language
    });
  }
}
