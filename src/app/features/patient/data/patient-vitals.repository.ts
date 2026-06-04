import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

import {
  PatientVitalAlertSettings,
  PatientVitals,
  PatientVitalsPageData
} from '../domain/patient-vitals';

@Injectable({
  providedIn: 'root'
})
export class PatientVitalsRepository {
  private vitals: PatientVitals = {
    patientUserId: 'patient-demo-user',
    measuredAt: '2026-06-04T09:00:00.000Z',
    heartRate: 99,
    oxygen: 99,
    temperature: 37.7
  };

  private alertSettings: PatientVitalAlertSettings = {
    patientUserId: 'patient-demo-user',
    heartRate: {
      criticalLow: 50,
      noticeLow: 60,
      noticeHigh: 100,
      criticalHigh: 120
    },
    oxygen: {
      noticeLow: 95,
      criticalLow: 90
    },
    temperature: {
      noticeHigh: 38,
      criticalHigh: 39
    }
  };

  getVitalsPageData(userId: string): Observable<PatientVitalsPageData> {
    return of({
      patientName: 'Eleanor Marsh',
      initials: 'EM',
      email: 'demo.patient@tukuntech.app',
      vitals: {
        ...this.vitals,
        patientUserId: userId
      },
      alertSettings: {
        ...this.alertSettings,
        patientUserId: userId
      }
    });
  }

  getDefaultAlertSettings(userId: string): PatientVitalAlertSettings {
    return {
      ...this.alertSettings,
      patientUserId: userId
    };
  }

  updateAlertSettings(
    userId: string,
    settings: PatientVitalAlertSettings
  ): Observable<PatientVitalAlertSettings> {
    this.alertSettings = {
      ...settings,
      patientUserId: userId
    };

    return of({ ...this.alertSettings });
  }
}
