import { NgClass, NgFor, NgIf } from '@angular/common';
import { ChangeDetectorRef, Component } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

import {
  DashboardLayout,
  DashboardMenuItem
} from '../../../../shared/components/dashboard-layout/dashboard-layout';
import { AuthApiService } from '../../../../core/auth/auth-api.service';
import { CaregiverAlertRepository } from '../../data/caregiver-alert.repository';
import { CaregiverDeviceRepository } from '../../data/caregiver-device.repository';
import {
  CaregiverDeviceConnectionStatus,
  CaregiverDeviceSignalLevel,
  CaregiverDeviceSyncStatus,
  CaregiverPatientDevice
} from '../../domain/caregiver-device';

@Component({
  selector: 'app-caregiver-device',
  imports: [
    DashboardLayout,
    TranslatePipe,
    NgFor,
    NgIf,
    NgClass
  ],
  templateUrl: './device.html',
  styleUrl: './device.css',
})
export class Device {
  caregiverUserId = '';
  email = '';
  devices: CaregiverPatientDevice[] = [];
  urgentAlertShow = false;
  urgentAlertTitleKey = '';
  urgentAlertMessageKey = '';
  urgentAlertMessageParams: Record<string, string> = {};

  menuItems: DashboardMenuItem[] = [
    { icon: 'bi-sun', labelKey: 'sidebar.caregiver.vitalSigns', route: '/caregiver/vital-signs' },
    { icon: 'bi-cpu', labelKey: 'sidebar.caregiver.device', route: '/caregiver/device' },
    { icon: 'bi-arrow-counterclockwise', labelKey: 'sidebar.caregiver.history', route: '/caregiver/history' },
    { icon: 'bi-person-check', labelKey: 'sidebar.caregiver.profile', route: '/caregiver/profile' },
    { icon: 'bi-ticket-perforated', labelKey: 'sidebar.caregiver.support', route: '/caregiver/support' },
    { icon: 'bi-gear', labelKey: 'sidebar.caregiver.settings', route: '/caregiver/settings' }
  ];

  constructor(
    private authService: AuthApiService,
    private caregiverAlertRepository: CaregiverAlertRepository,
    private caregiverDeviceRepository: CaregiverDeviceRepository,
    private changeDetector: ChangeDetectorRef
  ) {
    const session = this.authService.getSession();
    this.caregiverUserId = session?.userId || '';
    this.email = session?.email || '';
    this.loadDevices();
  }

  get offlineDevices(): CaregiverPatientDevice[] {
    return this.devices.filter(device => this.isOffline(device));
  }

  get hasOfflineDevices(): boolean {
    return this.offlineDevices.length > 0;
  }

  getConnectionStatusLabelKey(status: CaregiverDeviceConnectionStatus): string {
    return `caregiver.device.${status}`;
  }

  getWifiSignalLabelKey(device: CaregiverPatientDevice): string {
    if (this.isOffline(device)) {
      return 'caregiver.device.offline';
    }

    return `caregiver.device.${device.wifiSignalLevel}`;
  }

  getSyncStatusLabelKey(device: CaregiverPatientDevice): string {
    if (this.isOffline(device)) {
      return 'caregiver.device.offline';
    }

    return `caregiver.device.${device.syncStatus}`;
  }

  getBatteryLabel(device: CaregiverPatientDevice): string {
    return this.isOffline(device)
      ? '-'
      : `${device.batteryPercent}%`;
  }

  getProgressWidth(value: number): number {
    return Math.min(100, Math.max(0, value));
  }

  getBatteryProgressWidth(device: CaregiverPatientDevice): number {
    return this.isOffline(device)
      ? 100
      : this.getProgressWidth(device.batteryPercent);
  }

  getWifiProgressWidth(device: CaregiverPatientDevice): number {
    return this.isOffline(device)
      ? 100
      : this.getProgressWidth(device.wifiSignalPercent);
  }

  getSyncProgressWidth(device: CaregiverPatientDevice): number {
    return this.isOffline(device)
      ? 100
      : this.getProgressWidth(device.syncPercent);
  }

  getBatteryLevelClass(device: CaregiverPatientDevice): string {
    if (this.isOffline(device)) {
      return 'stat-level--muted';
    }

    if (device.batteryPercent <= 30) {
      return 'stat-level--danger';
    }

    if (device.batteryPercent <= 60) {
      return 'stat-level--warning';
    }

    return 'stat-level--success';
  }

  getWifiLevelClass(device: CaregiverPatientDevice): string {
    return this.isOffline(device)
      ? 'stat-level--muted'
      : 'stat-level--success';
  }

  getSyncLevelClass(device: CaregiverPatientDevice): string {
    return this.isOffline(device)
      ? 'stat-level--muted'
      : 'stat-level--success';
  }

  getDeviceCardClass(device: CaregiverPatientDevice): string {
    return this.isOffline(device)
      ? 'device-card--offline'
      : 'device-card--online';
  }

  getStatusBadgeClass(device: CaregiverPatientDevice): string {
    return this.isOffline(device)
      ? 'status-badge--offline'
      : 'status-badge--online';
  }

  getOfflinePatientNames(): string {
    return this.offlineDevices
      .map(device => device.patient.fullName)
      .join(', ');
  }

  isOffline(device: CaregiverPatientDevice): boolean {
    return device.connectionStatus === 'offline';
  }

  private loadDevices(): void {
    this.caregiverDeviceRepository
      .getDashboard(this.caregiverUserId)
      .subscribe(data => {
        this.caregiverUserId = data.caregiverUserId;
        this.email = data.caregiverEmail;
        this.devices = data.devices;
        this.changeDetector.detectChanges();
        this.loadGlobalCriticalAlert();
      });
  }

  private loadGlobalCriticalAlert(): void {
    if (!this.caregiverUserId) return;

    this.caregiverAlertRepository
      .getGlobalCriticalAlert(this.caregiverUserId)
      .subscribe(alert => {
        this.urgentAlertShow = !!alert;
        this.urgentAlertTitleKey = alert?.titleKey || '';
        this.urgentAlertMessageKey = alert?.messageKey || '';
        this.urgentAlertMessageParams = alert?.messageParams || {};
        this.changeDetector.detectChanges();
      });
  }
}
