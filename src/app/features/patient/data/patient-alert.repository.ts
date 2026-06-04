import { Injectable } from '@angular/core';
import { combineLatest, map, Observable } from 'rxjs';

import { PatientGlobalAlert } from '../domain/patient-alert';
import { evaluatePatientVitals } from '../domain/patient-vitals';
import { PatientDeviceRepository } from './patient-device.repository';
import { PatientVitalsRepository } from './patient-vitals.repository';

@Injectable({
  providedIn: 'root'
})
export class PatientAlertRepository {
  constructor(
    private patientDeviceRepository: PatientDeviceRepository,
    private patientVitalsRepository: PatientVitalsRepository
  ) {}

  getGlobalUrgentAlert(userId: string): Observable<PatientGlobalAlert | null> {
    return combineLatest([
      this.patientDeviceRepository.getDeviceByPatient(userId),
      this.patientVitalsRepository.getVitalsPageData(userId)
    ]).pipe(
      map(([device, vitalsPageData]) => {
        if (device.connectionStatus === 'offline') {
          return {
            severity: 'critical',
            titleKey: 'patient.device.disconnectedTitle',
            messageKey: 'patient.device.disconnectedGlobalAlert'
          };
        }

        const criticalAlert = evaluatePatientVitals(
          vitalsPageData.vitals,
          vitalsPageData.alertSettings
        ).find(alert => alert.severity === 'critical');

        if (!criticalAlert) {
          return null;
        }

        return {
          severity: 'critical',
          titleKey: criticalAlert.titleKey,
          messageKey: criticalAlert.messageKey
        };
      })
    );
  }
}
