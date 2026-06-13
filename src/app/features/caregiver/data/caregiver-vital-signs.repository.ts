import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

import {
  DeviceAlertParameters,
  DeviceAlertParametersStore
} from '../../../core/device-parameters/device-alert-parameters.store';
import {
  CaregiverPatientSummary,
  CaregiverVitalAlertSettings,
  CaregiverVitalSignsDashboard
} from '../domain/caregiver-vital-signs';

@Injectable({
  providedIn: 'root'
})
export class CaregiverVitalSignsRepository {
  private patients: CaregiverPatientSummary[] = [];

  constructor(private parametersStore: DeviceAlertParametersStore) {
    this.patients = this.createPatients();
  }

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

  private createPatients(): CaregiverPatientSummary[] {
    return [
      this.createPatient(
        'patient-eleanor',
        'Eleanor Marsh',
        'EM',
        82,
        74,
        90,
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
  }

  private createDefaultAlertSettings(patientUserId: string): CaregiverVitalAlertSettings {
    const parameters = this.parametersStore.getParameters(patientUserId);

    return this.mapParametersToAlertSettings(parameters);
  }

  private mapParametersToAlertSettings(
    parameters: DeviceAlertParameters
  ): CaregiverVitalAlertSettings {
    return {
      patientUserId: parameters.patientUserId,
      heartRate: {
        noticeLow: parameters.heartRateMin,
        criticalLow: Math.max(1, parameters.heartRateMin - 10),
        noticeHigh: parameters.heartRateMax,
        criticalHigh: parameters.heartRateMax + 20
      },
      oxygen: {
        noticeLow: parameters.oxygenSaturation,
        criticalLow: Math.max(1, parameters.oxygenSaturation - 5)
      },
      temperature: {
        noticeLow: parameters.temperatureMin,
        criticalLow: parameters.temperatureMin - 1,
        noticeHigh: parameters.temperatureMax,
        criticalHigh: parameters.temperatureMax + 1
      }
    };
  }

  private clonePatient(patient: CaregiverPatientSummary): CaregiverPatientSummary {
    const alertSettings = this.createDefaultAlertSettings(patient.userId);

    return {
      ...patient,
      vitals: { ...patient.vitals },
      alertSettings: {
        ...alertSettings,
        heartRate: { ...alertSettings.heartRate },
        oxygen: { ...alertSettings.oxygen },
        temperature: { ...alertSettings.temperature }
      },
      device: { ...patient.device }
    };
  }
}
