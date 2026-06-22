export type AdminDeviceStatus = 'available' | 'online' | 'offline' | 'error';
export type AdminPatientAccountType = 'individual' | 'caregiver-patient';

export interface AdminAssignablePatient {
  id: string;
  fullName: string;
  email: string;
  accountType: AdminPatientAccountType;
  caregiverId?: string;
  assignedDeviceId?: string;
}

export interface AdminCaregiverGroup {
  id: string;
  fullName: string;
  email: string;
  patients: AdminAssignablePatient[];
}

export interface AdminDevice {
  id: string;
  code: string;
  model: string;
  serialNumber: string;
  status: AdminDeviceStatus;
  firmwareVersion: string;
  registeredAt: string;
  assignedPatient: AdminAssignablePatient | null;
}

export interface AdminDeviceDraft {
  code: string;
  model: string;
  serialNumber: string;
  status: AdminDeviceStatus;
  firmwareVersion: string;
  registeredAt: string;
}

export interface AdminDevicesSummary {
  total: number;
  available: number;
  assigned: number;
  errors: number;
}

export interface AdminDevicesDashboard {
  adminUserId: string;
  adminEmail: string;
  summary: AdminDevicesSummary;
  devices: AdminDevice[];
  individualPatients: AdminAssignablePatient[];
  caregivers: AdminCaregiverGroup[];
}

export function filterAdminDevices(devices: AdminDevice[], searchTerm: string): AdminDevice[] {
  const term = searchTerm.trim().toLowerCase();
  if (!term) return devices;

  return devices.filter(device => [
    device.code,
    device.model,
    device.serialNumber,
    device.status,
    device.firmwareVersion,
    device.assignedPatient?.fullName ?? ''
  ].some(value => value.toLowerCase().includes(term)));
}
