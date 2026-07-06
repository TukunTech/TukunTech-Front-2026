import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import {provideHttpClient, HttpClient, withInterceptors} from '@angular/common/http';
import { routes } from './app.routes';
import {provideTranslateService, TranslateLoader} from '@ngx-translate/core';
import {CustomTranslateLoader} from './core/i18n/custom-translate-loader';
import { authInterceptor } from './core/auth/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [

    provideBrowserGlobalErrorListeners(),

    provideRouter(routes),

    provideHttpClient(withInterceptors([authInterceptor])),

    provideTranslateService({
      fallbackLang: 'en',
      lang: 'en',

      loader: {
        provide: TranslateLoader,

        useFactory: (http: HttpClient) =>
          new CustomTranslateLoader(http),

        deps: [HttpClient],
      },
    }),
  ]
};
