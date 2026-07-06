import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';

import { AuthApiService } from '../../../core/auth/auth-api.service';
import { CurrentVitalsResponse, DeviceApiService } from '../../../core/devices/device-api.service';
import {
  PatientMedicalParameters,
  PatientMedicalParametersStore
} from '../../../core/patient-monitoring/patient-medical-parameters.store';
import { UserProfileApiService, UserProfileResponse } from '../../../core/profiles/user-profile-api.service';
import {
  PatientVitalAlertSettings,
  PatientVitals,
  PatientVitalsPageData
} from '../domain/patient-vitals';

@Injectable({
  providedIn: 'root'
})
export class PatientVitalsRepository {
  constructor(
    private authService: AuthApiService,
    private parametersStore: PatientMedicalParametersStore,
    private userProfileApi: UserProfileApiService,
    private deviceApi: DeviceApiService
  ) {}

  getVitalsPageData(userId: string): Observable<PatientVitalsPageData> {
    return this.userProfileApi.getMyProfile().pipe(
      switchMap(profile => {
        const resolvedUserId = profile.id || userId;
        const alertSettings = this.createAlertSettingsFromProfile(profile, resolvedUserId);

        return this.deviceApi.getMyPatientDashboard().pipe(
          map(dashboard => dashboard.currentVitals || {}),
          catchError(() => this.deviceApi.getLatestVitals(resolvedUserId)),
          map(vitals => ({
            patientName: profile.fullName || profile.email,
            initials: this.getInitials(profile.fullName || profile.email),
            email: profile.email,
            vitals: this.mapVitals(vitals, resolvedUserId),
            alertSettings
          })),
          catchError(() => of({
            patientName: profile.fullName || profile.email,
            initials: this.getInitials(profile.fullName || profile.email),
            email: profile.email,
            vitals: this.createEmptyVitals(resolvedUserId),
            alertSettings
          }))
        );
      }),
      catchError(() => of(this.createFallbackVitalsPageData(userId)))
    );
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

  private createEmptyVitals(patientUserId: string): PatientVitals {
    return {
      patientUserId,
      measuredAt: '',
      heartRate: 0,
      oxygen: 0,
      temperature: 0
    };
  }

  private mapVitals(vitals: CurrentVitalsResponse, patientUserId: string): PatientVitals {
    return {
      patientUserId,
      measuredAt: vitals.measuredAt || vitals.lastUpdated || '',
      heartRate: Math.round(vitals.heartRate || 0),
      oxygen: Math.round(vitals.oxygenSaturation || 0),
      temperature: vitals.temperature || 0
    };
  }

  private createAlertSettings(userId: string): PatientVitalAlertSettings {
    return this.mapParametersToAlertSettings(
      this.parametersStore.getParameters(userId)
    );
  }

  private createAlertSettingsFromProfile(
    profile: UserProfileResponse,
    userId: string
  ): PatientVitalAlertSettings {
    if (
      profile.minHeartRate === undefined ||
      profile.maxHeartRate === undefined ||
      profile.minOxygenSaturation === undefined ||
      profile.maxOxygenSaturation === undefined ||
      profile.minTemperature === undefined ||
      profile.maxTemperature === undefined
    ) {
      return this.createAlertSettings(userId);
    }

    return this.mapParametersToAlertSettings({
      patientUserId: userId,
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

  private createFallbackVitalsPageData(userId: string): PatientVitalsPageData {
    const session = this.authService.getSession();
    const fallbackUserId = session?.userId || userId || '';
    const fallbackName = session?.email || 'Paciente';

    return {
      patientName: fallbackName,
      initials: this.getInitials(fallbackName),
      email: session?.email || '',
      vitals: this.createEmptyVitals(fallbackUserId),
      alertSettings: this.createAlertSettings(fallbackUserId)
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
