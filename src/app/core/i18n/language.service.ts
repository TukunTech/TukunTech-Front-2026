import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

export type AppLanguage = 'en' | 'es';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly fallbackLanguage: AppLanguage = 'en';
  private readonly storageKey = 'tukuntech.language';
  private readonly supportedLanguages: readonly AppLanguage[] = ['en', 'es'];

  constructor(private translate: TranslateService) {}

  initialize(): void {
    this.translate.addLangs([...this.supportedLanguages]);
    this.translate.setFallbackLang(this.fallbackLanguage);
    this.setLanguage(this.readStoredLanguage() ?? this.currentLanguage, false);
  }

  get currentLanguage(): AppLanguage {
    return (
      this.normalizeLanguage(this.translate.getCurrentLang()) ??
      this.normalizeLanguage(this.translate.getFallbackLang()) ??
      this.fallbackLanguage
    );
  }

  setLanguage(language: string, persist = true): AppLanguage {
    const nextLanguage = this.normalizeLanguage(language) ?? this.fallbackLanguage;

    if (persist) {
      this.writeStoredLanguage(nextLanguage);
    }

    this.translate.use(nextLanguage);
    return nextLanguage;
  }

  toggleLanguage(): AppLanguage {
    const nextLanguage = this.currentLanguage === 'en' ? 'es' : 'en';
    return this.setLanguage(nextLanguage);
  }

  private normalizeLanguage(language: string | null | undefined): AppLanguage | null {
    const normalizedLanguage = language?.split('-')[0] as AppLanguage | undefined;
    return normalizedLanguage && this.supportedLanguages.includes(normalizedLanguage)
      ? normalizedLanguage
      : null;
  }

  private readStoredLanguage(): AppLanguage | null {
    try {
      return this.normalizeLanguage(localStorage.getItem(this.storageKey));
    } catch {
      return null;
    }
  }

  private writeStoredLanguage(language: AppLanguage): void {
    try {
      localStorage.setItem(this.storageKey, language);
    } catch {
      return;
    }
  }
}
