import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

import { PatientDevice } from '../domain/patient-device';

@Injectable({
  providedIn: 'root'
})
export class PatientDeviceRepository {
  private device: PatientDevice = {
    id: 'device-demo-1',
    patientUserId: 'patient-demo-user',
    label: 'TukunTech IoT',
    serialNumber: 'CB-9F32-01',
    firmwareVersion: '1.0.5',
    connectionStatus: 'online',
    batteryPercent: 90,
    wifiSignalPercent: 77,
    wifiSignalLevel: 'strong',
    syncPercent: 44,
    syncStatus: 'good',
    lastSyncedAt: '2026-06-04T09:00:00.000Z'
  };

  getDeviceByPatient(userId: string): Observable<PatientDevice> {
    return of({
      ...this.device,
      patientUserId: userId
    });
  }
}
