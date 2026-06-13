import { DeviceAlertParameters } from '../../../core/device-parameters/device-alert-parameters.store';

export type AdminDeviceStatus = 'online' | 'offline' | 'error';

export interface AdminDeviceOwner {
  patientUserId: string;
  fullName: string;
  email: string;
}

export interface AdminDevice {
  id: string;
  serial: string;
  owner: AdminDeviceOwner;
  ownerId: string;
  status: AdminDeviceStatus;
  version: string;
  parameters: DeviceAlertParameters;
}

export interface AdminDevicesSummary {
  total: number;
  online: number;
  offline: number;
  errors: number;
}

export interface AdminDevicesDashboard {
  adminUserId: string;
  adminEmail: string;
  summary: AdminDevicesSummary;
  devices: AdminDevice[];
}

export type AdminDeviceUpdate = Omit<AdminDevice, 'id'>;

export function filterAdminDevices(
  devices: AdminDevice[],
  searchTerm: string
): AdminDevice[] {
  const normalizedTerm = searchTerm.trim().toLowerCase();

  if (!normalizedTerm) {
    return devices;
  }

  return devices.filter(device =>
    device.serial.toLowerCase().includes(normalizedTerm) ||
    device.owner.fullName.toLowerCase().includes(normalizedTerm) ||
    device.owner.email.toLowerCase().includes(normalizedTerm) ||
    device.ownerId.toLowerCase().includes(normalizedTerm) ||
    device.status.toLowerCase().includes(normalizedTerm) ||
    device.version.toLowerCase().includes(normalizedTerm)
  );
}
