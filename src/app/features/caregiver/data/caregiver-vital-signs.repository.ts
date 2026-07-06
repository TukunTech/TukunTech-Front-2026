import { Injectable } from '@angular/core';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { DeviceAssignmentStore } from '../../../core/device-assignment/device-assignment.store';
import { DeviceApiService, PatientDashboardResponse } from '../../../core/devices/device-api.service';

import {
  PatientMedicalParameters,
  PatientMedicalParametersStore
} from '../../../core/patient-monitoring/patient-medical-parameters.store';
import {
  CaregiverPatientSummary,
  CaregiverVitalAlertSettings,
  CaregiverVitalSignsDashboard
} from '../domain/caregiver-vital-signs';
import { AuthApiService } from '../../../core/auth/auth-api.service';
import { UserProfileApiService, UserProfileResponse } from '../../../core/profiles/user-profile-api.service';

@Injectable({
  providedIn: 'root'
})
export class CaregiverVitalSignsRepository {
  private readonly telemetryFreshnessMs = 10000;
  private patients: CaregiverPatientSummary[] = [];

  constructor(
    private parametersStore: PatientMedicalParametersStore,
    private assignmentStore: DeviceAssignmentStore,
    private authService: AuthApiService,
    private userProfileApi: UserProfileApiService,
    private deviceApi: DeviceApiService
  ) {}

  getDashboard(caregiverUserId: string): Observable<CaregiverVitalSignsDashboard> {
    return this.userProfileApi.getMyPatients().pipe(
      switchMap(patients => {
        const patientRequests = patients.map(patient =>
          forkJoin({
            dashboard: this.deviceApi.getCaregiverPatientDashboard(patient.id).pipe(catchError(() => of(null))),
            vitals: this.deviceApi.getLatestVitals(patient.id).pipe(catchError(() => of(null)))
          })
        );

        return (patientRequests.length ? forkJoin(patientRequests) : of([])).pipe(
          map(patientData => {
            this.patients = patients.map((patient, index) =>
              this.createPatientFromProfile(patient, patientData[index]?.dashboard, patientData[index]?.vitals)
            );

            return {
              caregiverUserId: this.authService.getSession()?.userId || caregiverUserId,
              caregiverEmail: this.authService.getSession()?.email || '',
              patients: this.patients.map(patient => this.clonePatient(patient))
            };
          })
        );
      })
    );
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

  private createPatientFromProfile(
    profile: UserProfileResponse,
    dashboard: PatientDashboardResponse | null,
    latestVitals: {
      heartRate?: number;
      oxygenSaturation?: number;
      temperature?: number;
      lastUpdated?: string;
      measuredAt?: string;
    } | null
  ): CaregiverPatientSummary {
    const userId = profile.id;
    const assignment = this.assignmentStore.getByPatient(userId);
    const alertSettings = this.createDefaultAlertSettingsFromProfile(profile);
    const device = dashboard?.device;
    const vitals = latestVitals || dashboard?.currentVitals;
    const measuredAt = vitals?.lastUpdated || vitals?.measuredAt || '';
    const hasFreshTelemetry = this.hasFreshTelemetry(measuredAt);
    const isOnline = hasFreshTelemetry || this.deviceApi.isDeviceConnected(device);

    return {
      userId,
      fullName: dashboard?.patientName || profile.fullName || profile.email,
      initials: this.getInitials(profile.fullName || profile.email),
      age: profile.age ?? 0,
      vitals: {
        patientUserId: userId,
        measuredAt,
        heartRate: Math.round(vitals?.heartRate || 0),
        oxygen: Math.round(vitals?.oxygenSaturation || 0),
        temperature: vitals?.temperature || 0
      },
      alertSettings,
      device: {
        id: device?.deviceId || assignment?.deviceId || '',
        model: device?.model || assignment?.model || '',
        battery: device?.batteryLevel || 0,
        wifiStrength: isOnline ? 'strong' : 'off',
        connectionStatus: isOnline ? 'online' : 'offline'
      }
    };
  }

  private createDefaultAlertSettings(patientUserId: string): CaregiverVitalAlertSettings {
    const parameters = this.parametersStore.getParameters(patientUserId);

    return this.mapParametersToAlertSettings(parameters);
  }

  private createDefaultAlertSettingsFromProfile(profile: UserProfileResponse): CaregiverVitalAlertSettings {
    if (
      profile.minHeartRate === undefined ||
      profile.maxHeartRate === undefined ||
      profile.minOxygenSaturation === undefined ||
      profile.maxOxygenSaturation === undefined ||
      profile.minTemperature === undefined ||
      profile.maxTemperature === undefined
    ) {
      return this.createDefaultAlertSettings(profile.id);
    }

    return this.mapParametersToAlertSettings({
      patientUserId: profile.id,
      heartRateMin: profile.minHeartRate,
      heartRateMax: profile.maxHeartRate,
      oxygenSaturationMin: profile.minOxygenSaturation,
      oxygenSaturationMax: profile.maxOxygenSaturation,
      temperatureMin: profile.minTemperature,
      temperatureMax: profile.maxTemperature
    });
  }

  private mapParametersToAlertSettings(
    parameters: PatientMedicalParameters
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

  private hasFreshTelemetry(measuredAt: string): boolean {
    if (!measuredAt) {
      return false;
    }

    const measuredAtMs = Date.parse(measuredAt);

    return Number.isFinite(measuredAtMs) && Date.now() - measuredAtMs <= this.telemetryFreshnessMs;
  }

  private clonePatient(patient: CaregiverPatientSummary): CaregiverPatientSummary {
    const alertSettings = patient.alertSettings;

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

  private getInitials(name: string): string {
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part[0]?.toUpperCase())
      .join('');
  }
}
