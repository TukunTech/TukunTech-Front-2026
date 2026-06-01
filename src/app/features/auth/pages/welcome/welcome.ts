import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AuthLayout } from '../../components/auth-layout/auth-layout';

@Component({
  selector: 'app-welcome',
  imports: [AuthLayout, TranslatePipe],
  templateUrl: './welcome.html',
  styleUrl: './welcome.css',
})
export class Welcome {

  currentLang = 'en';

  constructor(
    private router: Router,
    private translate: TranslateService
  ) {
    this.translate.use(this.currentLang);
  }

  goToLogin(role: string) {
    this.router.navigate([`/login/${role}`]);
  }

  toggleLanguage() {
    this.currentLang = this.currentLang === 'en' ? 'es' : 'en';
    this.translate.use(this.currentLang);
  }
}
