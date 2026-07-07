import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../api/api.config';

export interface GenerateReportRequest {
  startDate: string;
  endDate: string;
}

export interface HealthReportResponse {
  reportId: string;
  patientId: string;
  startDate: string;
  endDate: string;
  status: string;
  generatedAt: string;
  avgHeartRate: number | null;
  minHeartRate: number | null;
  maxHeartRate: number | null;
  avgSpO2: number | null;
  avgTemperature: number | null;
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

  generatePatientReport(patientId: string, request: GenerateReportRequest): Observable<string> {
    return this.http.post(`${this.apiBaseUrl}/reports/caregiver/patient/${patientId}/generate`, request, {
      responseType: 'text'
    });
  }

  listPatientReports(patientId: string): Observable<HealthReportResponse[]> {
    return this.http.get<HealthReportResponse[]>(`${this.apiBaseUrl}/reports/caregiver/patient/${patientId}`);
  }
}
