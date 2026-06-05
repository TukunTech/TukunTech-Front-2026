import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

import {
  CaregiverDeviceConnectionStatus,
  CaregiverDeviceDashboard,
  CaregiverDeviceSignalLevel,
  CaregiverDeviceSyncStatus,
  CaregiverPatientDevice
} from '../domain/caregiver-device';

@Injectable({
  providedIn: 'root'
})
export class CaregiverDeviceRepository {
  private devices: CaregiverPatientDevice[] = [
    this.createDevice(
      'device-eleanor',
      'patient-eleanor',
      'Eleanor Marsh',
      'EM',
      'CB-9F32-01',
      28,
      92,
      'strong',
      96,
      'good',
      'online'
    ),
    this.createDevice(
      'device-charls',
      'patient-charls',
      'Charls March',
      'CM',
      'C1-K22L-01',
      34,
      88,
      'strong',
      94,
      'good',
      'online'
    ),
    this.createDevice(
      'device-miguel',
      'patient-miguel',
      'Miguel Montana',
      'MM',
      'H4-23LP-01',
      67,
      62,
      'medium',
      90,
      'good',
      'online'
    ),
    this.createDevice(
      'device-marian',
      'patient-marian',
      'Marian Medilla',
      'MM',
      'CM-660E-12',
      78,
      86,
      'strong',
      95,
      'good',
      'online'
    ),
    this.createDevice(
      'device-robert',
      'patient-robert',
      'Robert Silva',
      'RS',
      'CR-520F-08',
      0,
      0,
      'weak',
      0,
      'failed',
      'offline'
    )
  ];

  getDashboard(caregiverUserId: string): Observable<CaregiverDeviceDashboard> {
    return of({
      caregiverUserId,
      caregiverEmail: 'demo.caregiver@tukuntech.app',
      devices: this.devices.map(device => this.cloneDevice(device))
    });
  }

  getDeviceByPatient(
    caregiverUserId: string,
    patientUserId: string
  ): Observable<CaregiverPatientDevice | undefined> {
    const device = this.devices.find(item => item.patient.userId === patientUserId);

    return of(device ? this.cloneDevice(device) : undefined);
  }

  updateConnectionStatus(
    patientUserId: string,
    connectionStatus: CaregiverDeviceConnectionStatus
  ): Observable<CaregiverPatientDevice | undefined> {
    this.devices = this.devices.map(device => {
      if (device.patient.userId !== patientUserId) {
        return device;
      }

      return {
        ...device,
        connectionStatus
      };
    });

    const device = this.devices.find(item => item.patient.userId === patientUserId);

    return of(device ? this.cloneDevice(device) : undefined);
  }

  private createDevice(
    id: string,
    patientUserId: string,
    fullName: string,
    initials: string,
    serialNumber: string,
    batteryPercent: number,
    wifiSignalPercent: number,
    wifiSignalLevel: CaregiverDeviceSignalLevel,
    syncPercent: number,
    syncStatus: CaregiverDeviceSyncStatus,
    connectionStatus: CaregiverDeviceConnectionStatus
  ): CaregiverPatientDevice {
    return {
      id,
      patient: {
        userId: patientUserId,
        fullName,
        initials
      },
      label: 'TukunTech IOT',
      serialNumber,
      firmwareVersion: '1.0.5',
      connectionStatus,
      batteryPercent,
      wifiSignalPercent,
      wifiSignalLevel,
      syncPercent,
      syncStatus,
      lastSyncedAt: '2026-06-04T09:00:00.000Z'
    };
  }

  private cloneDevice(device: CaregiverPatientDevice): CaregiverPatientDevice {
    return {
      ...device,
      patient: { ...device.patient }
    };
  }
}
