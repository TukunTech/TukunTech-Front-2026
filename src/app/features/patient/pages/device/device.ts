import { NgClass } from '@angular/common';
import { Component } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

import {
  DashboardLayout,
  DashboardMenuItem
} from '../../../../shared/components/dashboard-layout/dashboard-layout';
import { PatientAlertRepository } from '../../data/patient-alert.repository';
import { PatientDeviceRepository } from '../../data/patient-device.repository';
import {
  PatientDevice,
  PatientDeviceConnectionStatus,
  PatientDeviceSignalLevel,
  PatientDeviceSyncStatus
} from '../../domain/patient-device';

@Component({
  selector: 'app-device',
  imports: [
    DashboardLayout,
    TranslatePipe,
    NgClass
  ],
  templateUrl: './device.html',
  styleUrl: './device.css',
})
export class Device {
  userId = 'patient-demo-user';
  email = 'demo.patient@tukuntech.app';
  urgentAlertShow = false;
  urgentAlertTitleKey = '';
  urgentAlertMessageKey = '';

  menuItems: DashboardMenuItem[] = [
    { icon: 'bi-sun', labelKey: 'sidebar.patient.vitalSigns', route: '/patient/today' },
    { icon: 'bi-cpu', labelKey: 'sidebar.patient.device', route: '/patient/device' },
    { icon: 'bi-arrow-counterclockwise', labelKey: 'sidebar.patient.history', route: '/patient/history' },
    { icon: 'bi-person-check', labelKey: 'sidebar.patient.profile', route: '/patient/profile' },
    { icon: 'bi-ticket-perforated', labelKey: 'sidebar.patient.support', route: '/patient/support' },
    { icon: 'bi-gear', labelKey: 'sidebar.patient.settings', route: '/patient/settings' }
  ];

  device: PatientDevice = {
    id: '',
    patientUserId: this.userId,
    label: '',
    serialNumber: '',
    firmwareVersion: '',
    connectionStatus: 'offline',
    batteryPercent: 0,
    wifiSignalPercent: 0,
    wifiSignalLevel: 'weak',
    syncPercent: 0,
    syncStatus: 'pending',
    lastSyncedAt: ''
  };

  constructor(
    private patientDeviceRepository: PatientDeviceRepository,
    private patientAlertRepository: PatientAlertRepository
  ) {
    this.loadDevice();
    this.loadGlobalUrgentAlert();
  }

  getConnectionStatusLabelKey(status: PatientDeviceConnectionStatus): string {
    return `patient.device.${status}`;
  }

  get deviceDisconnected(): boolean {
    return this.device.connectionStatus === 'offline';
  }

  getWifiSignalLabelKey(signalLevel: PatientDeviceSignalLevel): string {
    if (this.deviceDisconnected) {
      return 'patient.device.offline';
    }

    return `patient.device.${signalLevel}`;
  }

  getBatteryLabel(): string {
    return this.deviceDisconnected
      ? '-'
      : `${this.device.batteryPercent}%`;
  }

  getSyncStatusLabelKey(syncStatus: PatientDeviceSyncStatus): string {
    if (this.device.connectionStatus === 'offline') {
      return 'patient.device.offline';
    }

    return `patient.device.${syncStatus}`;
  }

  getProgressWidth(value: number): number {
    return Math.min(100, Math.max(0, value));
  }

  getBatteryLevelClass(): string {
    if (this.deviceDisconnected) {
      return 'stat-level--muted';
    }

    if (this.device.batteryPercent <= 30) {
      return 'stat-level--danger';
    }

    if (this.device.batteryPercent <= 60) {
      return 'stat-level--warning';
    }

    return 'stat-level--success';
  }

  getWifiLevelClass(): string {
    return this.deviceDisconnected
      ? 'stat-level--muted'
      : 'stat-level--success';
  }

  getBatteryProgressWidth(): number {
    return this.deviceDisconnected
      ? 100
      : this.getProgressWidth(this.device.batteryPercent);
  }

  getWifiProgressWidth(): number {
    return this.deviceDisconnected
      ? 100
      : this.getProgressWidth(this.device.wifiSignalPercent);
  }

  getSyncLevelClass(): string {
    if (this.device.connectionStatus === 'offline') {
      return 'stat-level--muted';
    }

    return 'stat-level--success';
  }

  getSyncProgressWidth(): number {
    if (this.device.connectionStatus === 'offline') {
      return 100;
    }

    return this.getProgressWidth(this.device.syncPercent);
  }

  getDeviceAlertClass(): string {
    return this.device.connectionStatus === 'offline'
      ? 'device-alert--danger'
      : 'device-alert--normal';
  }

  getDeviceAlertIcon(): string {
    return this.device.connectionStatus === 'offline'
      ? 'bi-exclamation-triangle'
      : 'bi-check2-circle';
  }

  getDeviceAlertTitleKey(): string {
    return this.device.connectionStatus === 'offline'
      ? 'patient.device.disconnectedTitle'
      : 'patient.device.connectedTitle';
  }

  getDeviceAlertMessageKey(): string {
    return this.device.connectionStatus === 'offline'
      ? 'patient.device.disconnectedAlert'
      : 'patient.device.alert';
  }

  private loadDevice(): void {
    this.patientDeviceRepository
      .getDeviceByPatient(this.userId)
      .subscribe(device => {
        this.device = device;
      });
  }

  private loadGlobalUrgentAlert(): void {
    this.patientAlertRepository
      .getGlobalUrgentAlert(this.userId)
      .subscribe(alert => {
        this.urgentAlertShow = !!alert;
        this.urgentAlertTitleKey = alert?.titleKey || '';
        this.urgentAlertMessageKey = alert?.messageKey || '';
      });
  }
}
