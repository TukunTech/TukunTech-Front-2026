import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import {provideHttpClient, HttpClient} from '@angular/common/http';
import { routes } from './app.routes';
import {provideTranslateService, TranslateLoader} from '@ngx-translate/core';
import {CustomTranslateLoader} from './core/i18n/custom-translate-loader';

export const appConfig: ApplicationConfig = {
  providers: [

    provideBrowserGlobalErrorListeners(),

    provideRouter(routes),

    provideHttpClient(),

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
