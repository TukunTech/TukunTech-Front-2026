import { AppLanguage } from '../../../core/i18n/language.service';

export interface AdminSettingsProfile {
  adminEmail: string;
  language: AppLanguage;
}
