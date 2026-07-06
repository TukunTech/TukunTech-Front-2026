export type CaregiverDeviceConnectionStatus = 'online' | 'offline';

export type CaregiverDeviceSignalLevel = 'strong' | 'off';

export type CaregiverDeviceSyncStatus = 'good' | 'pending' | 'failed';

export interface CaregiverDevicePatient {
  userId: string;
  fullName: string;
  initials: string;
}

export interface CaregiverPatientDevice {
  id: string;
  patient: CaregiverDevicePatient;
  label: string;
  serialNumber: string;
  firmwareVersion: string;
  connectionStatus: CaregiverDeviceConnectionStatus;
  batteryPercent: number;
  wifiSignalPercent: number;
  wifiSignalLevel: CaregiverDeviceSignalLevel;
  syncPercent: number;
  syncStatus: CaregiverDeviceSyncStatus;
  lastSyncedAt: string;
}

export interface CaregiverDeviceDashboard {
  caregiverUserId: string;
  caregiverEmail: string;
  devices: CaregiverPatientDevice[];
}
