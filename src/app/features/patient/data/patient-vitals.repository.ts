import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

import {
  PatientMedicalParameters,
  PatientMedicalParametersStore
} from '../../../core/patient-monitoring/patient-medical-parameters.store';
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

  constructor(private parametersStore: PatientMedicalParametersStore) {}

  getVitalsPageData(userId: string): Observable<PatientVitalsPageData> {
    const alertSettings = this.createAlertSettings(userId);

    return of({
      patientName: 'Eleanor Marsh',
      initials: 'EM',
      email: 'demo.patient@tukuntech.app',
      vitals: {
        ...this.vitals,
        patientUserId: userId
      },
      alertSettings: {
        ...alertSettings
      }
    });
  }

  getDefaultAlertSettings(userId: string): PatientVitalAlertSettings {
    return this.createAlertSettings(userId);
  }

  updateAlertSettings(
    userId: string,
    settings: PatientVitalAlertSettings
  ): Observable<PatientVitalAlertSettings> {
    const nextSettings = {
      ...settings,
      patientUserId: userId
    };

    return of(nextSettings);
  }

  private createAlertSettings(userId: string): PatientVitalAlertSettings {
    return this.mapParametersToAlertSettings(
      this.parametersStore.getParameters(userId)
    );
  }

  private mapParametersToAlertSettings(
    parameters: PatientMedicalParameters
  ): PatientVitalAlertSettings {
    return {
      patientUserId: parameters.patientUserId,
      heartRate: {
        noticeLow: parameters.heartRateMin,
        criticalLow: Math.max(1, parameters.heartRateMin - 10),
        noticeHigh: parameters.heartRateMax,
        criticalHigh: parameters.heartRateMax + 20
      },
      oxygen: {
        noticeLow: parameters.oxygenSaturationMin,
        criticalLow: Math.max(1, parameters.oxygenSaturationMin - 5),
        noticeHigh: parameters.oxygenSaturationMax
      },
      temperature: {
        noticeLow: parameters.temperatureMin,
        criticalLow: parameters.temperatureMin - 1,
        noticeHigh: parameters.temperatureMax,
        criticalHigh: parameters.temperatureMax + 1
      }
    };
  }
}
