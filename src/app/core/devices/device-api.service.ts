import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../api/api.config';

export interface AdminDeviceResponse {
  deviceId: string;
  modelName?: string;
  allocationStatus?: string;
  assignedPatientId?: string;
  status?: string;
  connectionStatus?: string;
  provisionedAt?: string;
}

export interface DeviceStatusResponse {
  id?: string;
  deviceId?: string;
  rawDeviceId?: string;
  model?: string;
  modelName?: string;
  batteryLevel?: number;
  wifiNetwork?: string;
  isOnline?: boolean;
  lastSyncedAt?: string;
  lastSeenAt?: string;
}

export interface CurrentVitalsResponse {
  heartRate?: number;
  oxygenSaturation?: number;
  temperature?: number;
  measuredAt?: string;
  lastUpdated?: string;
}

export interface PatientDashboardResponse {
  patientId: string;
  patientName?: string;
  overallStatus?: string;
  device?: DeviceStatusResponse;
  currentVitals?: CurrentVitalsResponse;
}

export interface AdminUpdateDeviceRequest {
  modelName: string;
  status: string;
  assignedPatientId?: string;
}

@Injectable({ providedIn: 'root' })
export class DeviceApiService {
  constructor(
    private http: HttpClient,
    @Inject(API_BASE_URL) private apiBaseUrl: string
  ) {}

  getAdminDevices(): Observable<AdminDeviceResponse[]> {
    return this.http.get<AdminDeviceResponse[]>(`${this.apiBaseUrl}/admin/devices`);
  }

  updateAdminDevice(deviceId: string, request: AdminUpdateDeviceRequest): Observable<string> {
    return this.http.put(`${this.apiBaseUrl}/admin/devices/${deviceId}`, request, { responseType: 'text' });
  }

  getCaregiverPatientDashboard(patientId: string): Observable<PatientDashboardResponse> {
    return this.http.get<PatientDashboardResponse>(`${this.apiBaseUrl}/dashboard/caregiver/patient/${patientId}`);
  }

  getMyPatientDashboard(): Observable<PatientDashboardResponse> {
    return this.http.get<PatientDashboardResponse>(`${this.apiBaseUrl}/dashboard/patient/me`);
  }

  isDeviceConnected(device?: DeviceStatusResponse | null): boolean {
    if (!device) {
      return false;
    }

    if (device.wifiNetwork) {
      return device.wifiNetwork.trim().toUpperCase() === 'CONECTADO';
    }

    return !!device.isOnline;
  }
}
