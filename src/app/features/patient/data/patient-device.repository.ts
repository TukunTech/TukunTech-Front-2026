import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { DeviceAssignmentStore } from '../../../core/device-assignment/device-assignment.store';
import { DeviceApiService, DeviceStatusResponse } from '../../../core/devices/device-api.service';
import { PatientDevice } from '../domain/patient-device';

@Injectable({ providedIn: 'root' })
export class PatientDeviceRepository {
  constructor(
    private assignmentStore: DeviceAssignmentStore,
    private deviceApi: DeviceApiService
  ) {}

  getDeviceByPatient(userId: string): Observable<PatientDevice> {
    const assignment = this.assignmentStore.getByPatient(userId);

    return this.deviceApi.getMyPatientDashboard().pipe(
      map(dashboard => {
        const device = dashboard.device;
        const online = this.deviceApi.isDeviceConnected(device);
        const patientUserId = dashboard.patientId || userId;
        const deviceId = this.getDeviceId(device);
        const model = this.getDeviceModel(device);
        const lastSyncedAt = this.getLastSyncedAt(device);

        return {
          id: deviceId || assignment?.deviceId || '',
          patientUserId,
          label: model || assignment?.model || '',
          serialNumber: deviceId || assignment?.serialNumber || '',
          firmwareVersion: assignment?.firmwareVersion || '',
          connectionStatus: online ? 'online' as const : 'offline' as const,
          batteryPercent: device?.batteryLevel ?? 0,
          wifiSignalPercent: online ? 100 : 0,
          wifiSignalLevel: online ? 'strong' as const : 'off' as const,
          syncPercent: online ? 100 : 0,
          syncStatus: online ? 'good' as const : 'failed' as const,
          lastSyncedAt
        };
      }),
      catchError(() => of(assignment ? {
        id: assignment.deviceId,
        patientUserId: userId,
        label: assignment.model,
        serialNumber: assignment.serialNumber,
        firmwareVersion: assignment.firmwareVersion,
        connectionStatus: assignment.connectionStatus,
        batteryPercent: 0,
        wifiSignalPercent: assignment.connectionStatus === 'online' ? 100 : 0,
        wifiSignalLevel: assignment.connectionStatus === 'online' ? 'strong' as const : 'off' as const,
        syncPercent: 0,
        syncStatus: 'failed' as const,
        lastSyncedAt: ''
      } : {
      id: '',
      patientUserId: userId,
      label: '',
      serialNumber: '',
      firmwareVersion: '',
      connectionStatus: 'offline' as const,
      batteryPercent: 0,
      wifiSignalPercent: 0,
      wifiSignalLevel: 'off' as const,
      syncPercent: 0,
      syncStatus: 'failed' as const,
      lastSyncedAt: ''
    }))
    );
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
}
