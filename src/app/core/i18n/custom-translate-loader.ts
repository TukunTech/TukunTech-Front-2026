import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TranslateLoader } from '@ngx-translate/core';

export class CustomTranslateLoader implements TranslateLoader {

  constructor(
    private http: HttpClient,
    private prefix: string = '/i18n/',
    private suffix: string = '.json'
  ) {}

  getTranslation(lang: string): Observable<any> {
    return this.http.get<any>(`${this.prefix}${lang}${this.suffix}`);
  }
}
