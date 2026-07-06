export type PatientDeviceConnectionStatus = 'online' | 'offline';

export type PatientDeviceSignalLevel = 'strong' | 'off';

export type PatientDeviceSyncStatus = 'good' | 'pending' | 'failed';

export interface PatientDevice {
  id: string;
  patientUserId: string;
  label: string;
  serialNumber: string;
  firmwareVersion: string;
  connectionStatus: PatientDeviceConnectionStatus;
  batteryPercent: number;
  wifiSignalPercent: number;
  wifiSignalLevel: PatientDeviceSignalLevel;
  syncPercent: number;
  syncStatus: PatientDeviceSyncStatus;
  lastSyncedAt: string;
}
