import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';

import { DeviceAlertParametersStore } from '../../../core/device-parameters/device-alert-parameters.store';
import {
  AdminDevice,
  AdminDevicesDashboard,
  AdminDeviceStatus,
  AdminDeviceUpdate
} from '../domain/admin-device';

@Injectable({
  providedIn: 'root'
})
export class AdminDeviceRepository {
  private devices: Omit<AdminDevice, 'parameters'>[] = [
    this.createDevice('device-eleanor', 'CB-7H8J-90', 'patient-eleanor', 'Sarah Marsh', 'sarahmarsh@tukuntech.com', '056', 'online', '2.4.1'),
    this.createDevice('device-charls', 'CB-7H8J-90', 'patient-charls', 'James Patel', 'jamespatel@tukuntech.com', '059', 'offline', '2.4.1'),
    this.createDevice('device-miguel', 'CB-7H8J-90', 'patient-miguel', 'Sarah Marsh', 'sarahmarsh@tukuntech.com', '056', 'online', '2.4.1'),
    this.createDevice('device-robert', 'CB-7H8J-90', 'patient-robert', 'Sarah Marsh', 'sarahmarsh@tukuntech.com', '056', 'error', '2.4.1')
  ];

  constructor(private parametersStore: DeviceAlertParametersStore) {}

  getDashboard(adminUserId: string): Observable<AdminDevicesDashboard> {
    const devices = this.getDevices();

    return of({
      adminUserId,
      adminEmail: 'demo.admin@tukuntech.app',
      summary: {
        total: 67,
        online: 45,
        offline: 14,
        errors: 8
      },
      devices
    });
  }

  updateDevice(
    adminUserId: string,
    deviceId: string,
    update: AdminDeviceUpdate
  ): Observable<AdminDevice> {
    if (!this.isValidUpdate(update)) {
      return throwError(() => new Error('Invalid device settings'));
    }

    this.parametersStore.updateParameters({
      ...update.parameters,
      patientUserId: update.owner.patientUserId
    });

    const nextDevice: Omit<AdminDevice, 'parameters'> = {
      id: deviceId,
      serial: update.serial.trim(),
      owner: { ...update.owner },
      ownerId: update.ownerId.trim(),
      status: update.status,
      version: update.version.trim()
    };

    this.devices = this.devices.map(device =>
      device.id === deviceId
        ? nextDevice
        : device
    );

    return of(this.hydrateDevice(nextDevice));
  }

  private getDevices(): AdminDevice[] {
    return this.devices.map(device => this.hydrateDevice(device));
  }

  private hydrateDevice(device: Omit<AdminDevice, 'parameters'>): AdminDevice {
    return {
      ...device,
      owner: { ...device.owner },
      parameters: this.parametersStore.getParameters(device.owner.patientUserId)
    };
  }

  private isValidUpdate(update: AdminDeviceUpdate): boolean {
    const params = update.parameters;

    return !!update.serial.trim() &&
      !!update.owner.fullName.trim() &&
      !!update.owner.email.trim() &&
      !!update.ownerId.trim() &&
      !!update.version.trim() &&
      params.heartRateMin > 0 &&
      params.heartRateMax > params.heartRateMin &&
      params.temperatureMin > 30 &&
      params.temperatureMax > params.temperatureMin &&
      params.oxygenSaturation >= 70 &&
      params.oxygenSaturation <= 100;
  }

  private createDevice(
    id: string,
    serial: string,
    patientUserId: string,
    ownerName: string,
    ownerEmail: string,
    ownerId: string,
    status: AdminDeviceStatus,
    version: string
  ): Omit<AdminDevice, 'parameters'> {
    return {
      id,
      serial,
      owner: {
        patientUserId,
        fullName: ownerName,
        email: ownerEmail
      },
      ownerId,
      status,
      version
    };
  }
}
