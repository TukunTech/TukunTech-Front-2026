import { Injectable } from '@angular/core';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { DeviceAssignmentStore } from '../../../core/device-assignment/device-assignment.store';
import { DeviceApiService, DeviceStatusResponse, PatientDashboardResponse } from '../../../core/devices/device-api.service';
import { AuthApiService } from '../../../core/auth/auth-api.service';
import { UserProfileApiService, UserProfileResponse } from '../../../core/profiles/user-profile-api.service';

import {
  CaregiverDeviceConnectionStatus,
  CaregiverDeviceDashboard,
  CaregiverPatientDevice
} from '../domain/caregiver-device';

@Injectable({
  providedIn: 'root',
})
export class CaregiverDeviceRepository {
  constructor(
    private assignmentStore: DeviceAssignmentStore,
    private authService: AuthApiService,
    private userProfileApi: UserProfileApiService,
    private deviceApi: DeviceApiService
  ) {}

  getDashboard(caregiverUserId: string): Observable<CaregiverDeviceDashboard> {
    return this.userProfileApi.getMyPatients().pipe(
      switchMap(patients => {
        const dashboardRequests = patients.map(patient =>
          this.deviceApi.getCaregiverPatientDashboard(patient.id).pipe(catchError(() => of(null)))
        );

        return (dashboardRequests.length ? forkJoin(dashboardRequests) : of([])).pipe(
          map(dashboards => ({
            caregiverUserId: this.authService.getSession()?.userId || caregiverUserId,
            caregiverEmail: this.authService.getSession()?.email || '',
            devices: patients.map((patient, index) => this.createDeviceFromProfile(patient, dashboards[index])),
          }))
        );
      })
    );
  }

  getDeviceByPatient(
    caregiverUserId: string,
    patientUserId: string,
  ): Observable<CaregiverPatientDevice | undefined> {
    return this.userProfileApi.getMyPatients().pipe(
      switchMap(patients => {
        const patient = patients.find(item => item.id === patientUserId);
        if (!patient) return of(undefined);

        return this.deviceApi.getCaregiverPatientDashboard(patientUserId).pipe(
          map(dashboard => this.createDeviceFromProfile(patient, dashboard)),
          catchError(() => of(this.createDeviceFromProfile(patient)))
        );
      })
    );
  }

  updateConnectionStatus(
    patientUserId: string,
    connectionStatus: CaregiverDeviceConnectionStatus,
  ): Observable<CaregiverPatientDevice | undefined> {
    this.assignmentStore.setConnectionStatus(patientUserId, connectionStatus);
    return this.getDeviceByPatient(this.authService.getSession()?.userId || "", patientUserId);
  }

  private createDeviceFromProfile(profile: UserProfileResponse, dashboard: PatientDashboardResponse | null = null): CaregiverPatientDevice {
    const assignment = this.assignmentStore.getByPatient(profile.id);
    const device = dashboard?.device;
    const online = this.deviceApi.isDeviceConnected(device);
    const deviceId = this.getDeviceId(device);
    const model = this.getDeviceModel(device);
    const lastSyncedAt = this.getLastSyncedAt(device);

    return {
      id: deviceId || assignment?.deviceId || '',
      patient: {
        userId: profile.id,
        fullName: profile.fullName || profile.email,
        initials: this.getInitials(profile.fullName || profile.email),
      },
      label: model || assignment?.model || '',
      serialNumber: deviceId || assignment?.serialNumber || '',
      firmwareVersion: assignment?.firmwareVersion || '',
      connectionStatus: online ? 'online' : 'offline',
      batteryPercent: device?.batteryLevel ?? 0,
      wifiSignalPercent: online ? 100 : 0,
      wifiSignalLevel: online ? 'strong' : 'off',
      syncPercent: online ? 100 : 0,
      syncStatus: online ? 'good' : 'failed',
      lastSyncedAt,
    };
  }

  private getDeviceId(device?: DeviceStatusResponse | null): string {
    return device?.deviceId || device?.rawDeviceId || device?.id || '';
  }

  private getDeviceModel(device?: DeviceStatusResponse | null): string {
    return device?.model || device?.modelName || '';
  }

  private getLastSyncedAt(device?: DeviceStatusResponse | null): string {
    return device?.lastSyncedAt || device?.lastSeenAt || '';
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
