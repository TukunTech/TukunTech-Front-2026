import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { AuthApiService } from '../../../core/auth/auth-api.service';
import { LanguageService } from '../../../core/i18n/language.service';
import { UserProfileApiService } from '../../../core/profiles/user-profile-api.service';
import { AdminSettingsProfile } from '../domain/admin-settings';

@Injectable({ providedIn: 'root' })
export class AdminSettingsRepository {
  private readonly adminEmail = '';

  constructor(
    private authService: AuthApiService,
    private languageService: LanguageService,
    private userProfileApi: UserProfileApiService
  ) {}

  getProfile(adminUserId: string): Observable<AdminSettingsProfile> {
    return this.userProfileApi.getMyProfile().pipe(
      map(profile => ({
        adminEmail: profile.email || this.authService.getSession()?.email || this.adminEmail,
        language: this.languageService.currentLanguage
      })),
      catchError(() => of({
        adminEmail: this.authService.getSession()?.email || this.adminEmail,
        language: this.languageService.currentLanguage
      }))
    );
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
