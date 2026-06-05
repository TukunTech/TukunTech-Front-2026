import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthLayout } from '../../components/auth-layout/auth-layout';
import { AppLanguage, LanguageService } from '../../../../core/i18n/language.service';

@Component({
  selector: 'app-welcome',
  imports: [AuthLayout, TranslatePipe],
  templateUrl: './welcome.html',
  styleUrl: './welcome.css',
})
export class Welcome {

  constructor(
    private router: Router,
    private languageService: LanguageService
  ) {}

  goToLogin(role: string) {
    this.router.navigate([`/login/${role}`]);
  }

  get currentLanguage(): AppLanguage {
    return this.languageService.currentLanguage;
  }

  toggleLanguage() {
    this.languageService.toggleLanguage();
  }
}
