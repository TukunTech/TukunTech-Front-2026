import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

import { DeviceAssignmentStore } from '../../../core/device-assignment/device-assignment.store';
import { PatientDevice } from '../domain/patient-device';

@Injectable({ providedIn: 'root' })
export class PatientDeviceRepository {
  constructor(private assignmentStore: DeviceAssignmentStore) {}

  getDeviceByPatient(userId: string): Observable<PatientDevice> {
    const assignment = this.assignmentStore.getByPatient(userId);

    return of(assignment ? {
      id: assignment.deviceId,
      patientUserId: userId,
      label: assignment.model,
      serialNumber: assignment.serialNumber,
      firmwareVersion: assignment.firmwareVersion,
      connectionStatus: assignment.connectionStatus,
      batteryPercent: assignment.connectionStatus === 'online' ? 90 : 0,
      wifiSignalPercent: assignment.connectionStatus === 'online' ? 77 : 0,
      wifiSignalLevel: assignment.connectionStatus === 'online' ? 'strong' : 'weak',
      syncPercent: assignment.connectionStatus === 'online' ? 96 : 0,
      syncStatus: assignment.connectionStatus === 'online' ? 'good' : 'failed',
      lastSyncedAt: '2026-06-20T09:00:00.000Z'
    } : {
      id: '',
      patientUserId: userId,
      label: 'TukunTech IoT',
      serialNumber: '-',
      firmwareVersion: '-',
      connectionStatus: 'offline',
      batteryPercent: 0,
      wifiSignalPercent: 0,
      wifiSignalLevel: 'weak',
      syncPercent: 0,
      syncStatus: 'failed',
      lastSyncedAt: ''
    });
  }
}
