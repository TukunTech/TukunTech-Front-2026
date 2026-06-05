import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

import {
  CaregiverPatientSummary,
  CaregiverVitalAlertSettings,
  CaregiverVitalSignsDashboard
} from '../domain/caregiver-vital-signs';

@Injectable({
  providedIn: 'root'
})
export class CaregiverVitalSignsRepository {
  private patients: CaregiverPatientSummary[] = [
    this.createPatient(
      'patient-eleanor',
      'Eleanor Marsh',
      'EM',
      82,
      74,
      98,
      36.6,
      'CB-8DF3-01',
      86,
      'strong',
      'online'
    ),
    this.createPatient(
      'patient-charls',
      'Charls March',
      'CM',
      72,
      99,
      97,
      36.7,
      'CZ-K230-01',
      45,
      'strong',
      'online'
    ),
    this.createPatient(
      'patient-miguel',
      'Miguel Montana',
      'MM',
      78,
      92,
      99,
      37.2,
      'CX-771A-04',
      64,
      'medium',
      'online'
    ),
    this.createPatient(
      'patient-marian',
      'Marian Medilla',
      'MM',
      88,
      76,
      97,
      36.8,
      'CM-660E-12',
      78,
      'strong',
      'online'
    ),
    this.createPatient(
      'patient-robert',
      'Robert Silva',
      'RS',
      69,
      0,
      0,
      0,
      'CR-520F-08',
      22,
      'weak',
      'offline'
    )
  ];

  getDashboard(caregiverUserId: string): Observable<CaregiverVitalSignsDashboard> {
    return of({
      caregiverUserId,
      caregiverEmail: 'demo.caregiver@tukuntech.app',
      patients: this.patients.map(patient => this.clonePatient(patient))
    });
  }

  getPatient(
    caregiverUserId: string,
    patientUserId: string
  ): Observable<CaregiverPatientSummary | undefined> {
    const patient = this.patients.find(item => item.userId === patientUserId);

    return of(patient ? this.clonePatient(patient) : undefined);
  }

  updatePatientVitals(
    patientUserId: string,
    values: Partial<CaregiverPatientSummary['vitals']>
  ): Observable<CaregiverPatientSummary | undefined> {
    this.patients = this.patients.map(patient => {
      if (patient.userId !== patientUserId) {
        return patient;
      }

      return {
        ...patient,
        vitals: {
          ...patient.vitals,
          ...values,
          measuredAt: new Date().toISOString()
        }
      };
    });

    const patient = this.patients.find(item => item.userId === patientUserId);

    return of(patient ? this.clonePatient(patient) : undefined);
  }

  updatePatientConnectionStatus(
    patientUserId: string,
    connectionStatus: CaregiverPatientSummary['device']['connectionStatus']
  ): Observable<CaregiverPatientSummary | undefined> {
    this.patients = this.patients.map(patient => {
      if (patient.userId !== patientUserId) {
        return patient;
      }

      return {
        ...patient,
        device: {
          ...patient.device,
          connectionStatus
        }
      };
    });

    const patient = this.patients.find(item => item.userId === patientUserId);

    return of(patient ? this.clonePatient(patient) : undefined);
  }

  private createPatient(
    userId: string,
    fullName: string,
    initials: string,
    age: number,
    heartRate: number,
    oxygen: number,
    temperature: number,
    deviceId: string,
    battery: number,
    wifiStrength: CaregiverPatientSummary['device']['wifiStrength'],
    connectionStatus: CaregiverPatientSummary['device']['connectionStatus']
  ): CaregiverPatientSummary {
    const alertSettings = this.createDefaultAlertSettings(userId);

    return {
      userId,
      fullName,
      initials,
      age,
      vitals: {
        patientUserId: userId,
        measuredAt: '2026-06-04T09:00:00.000Z',
        heartRate,
        oxygen,
        temperature
      },
      alertSettings,
      device: {
        id: deviceId,
        model: 'TukunTech IoT',
        battery,
        wifiStrength,
        connectionStatus
      }
    };
  }

  private createDefaultAlertSettings(patientUserId: string): CaregiverVitalAlertSettings {
    return {
      patientUserId,
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
  }

  private clonePatient(patient: CaregiverPatientSummary): CaregiverPatientSummary {
    return {
      ...patient,
      vitals: { ...patient.vitals },
      alertSettings: {
        ...patient.alertSettings,
        heartRate: { ...patient.alertSettings.heartRate },
        oxygen: { ...patient.alertSettings.oxygen },
        temperature: { ...patient.alertSettings.temperature }
      },
      device: { ...patient.device }
    };
  }
}
