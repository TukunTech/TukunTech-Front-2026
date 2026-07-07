import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../api/api.config';

export interface GenerateReportRequest {
  startDate: string;
  endDate: string;
}

@Injectable({ providedIn: 'root' })
export class ReportApiService {
  constructor(
    private http: HttpClient,
    @Inject(API_BASE_URL) private apiBaseUrl: string
  ) {}

  generateMyReport(request: GenerateReportRequest): Observable<string> {
    return this.http.post(`${this.apiBaseUrl}/reports/me/generate`, request, {
      responseType: 'text'
    });
  }
}
