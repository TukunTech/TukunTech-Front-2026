import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { CaregiverGlobalAlert } from '../domain/caregiver-alert';
import {
  evaluateCaregiverPatientVitals
} from '../domain/caregiver-vital-signs';
import { CaregiverVitalSignsRepository } from './caregiver-vital-signs.repository';

@Injectable({
  providedIn: 'root'
})
export class CaregiverAlertRepository {
  constructor(private caregiverVitalSignsRepository: CaregiverVitalSignsRepository) {}

  getGlobalCriticalAlert(caregiverUserId: string): Observable<CaregiverGlobalAlert | null> {
    return this.caregiverVitalSignsRepository.getDashboard(caregiverUserId).pipe(
      map(data => {
        const criticalPatientNames = data.patients
          .filter(patient => {
            if (patient.device.connectionStatus === 'offline') {
              return true;
            }

            return evaluateCaregiverPatientVitals(
              patient.vitals,
              patient.alertSettings
            ).some(alert => alert.severity === 'critical');
          })
          .map(patient => patient.fullName);

        if (!criticalPatientNames.length) {
          return null;
        }

        return {
          severity: 'critical',
          titleKey: 'caregiver.globalAlert.title',
          messageKey: 'caregiver.globalAlert.message',
          messageParams: {
            patients: criticalPatientNames.join(', ')
          }
        };
      })
    );
  }
}
