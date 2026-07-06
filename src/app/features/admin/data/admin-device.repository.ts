import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Inject } from '@angular/core';
import { Observable, forkJoin, of, throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { API_BASE_URL } from '../../../core/api/api.config';
import { AuthApiService } from '../../../core/auth/auth-api.service';
import { AdminDeviceResponse, DeviceApiService } from '../../../core/devices/device-api.service';
import { DeviceAssignmentStore } from '../../../core/device-assignment/device-assignment.store';
import { UserProfileResponse } from '../../../core/profiles/user-profile-api.service';

import {
  AdminAssignablePatient,
  AdminCaregiverGroup,
  AdminDevice,
  AdminDeviceDraft,
  AdminDevicesDashboard
} from '../domain/admin-device';

interface AdminUserResponse {
  userId?: string;
  id?: string;
  email: string;
  fullName?: string;
  role: string;
  subscriptionPlan?: string;
  status?: string;
  subscriptionEnd?: string;
}

@Injectable({ providedIn: 'root' })
export class AdminDeviceRepository {
  private individualPatients: AdminAssignablePatient[] = [];

  private caregivers: AdminCaregiverGroup[] = [];

  private devices: AdminDevice[] = [];

  constructor(
    private assignmentStore: DeviceAssignmentStore,
    private deviceApi: DeviceApiService,
    private http: HttpClient,
    private authService: AuthApiService,
    @Inject(API_BASE_URL) private apiBaseUrl: string
  ) {}

  getDashboard(adminUserId: string): Observable<AdminDevicesDashboard> {
    return forkJoin({
      patients: this.http.get<UserProfileResponse[]>(`${this.apiBaseUrl}/profiles/patients`).pipe(catchError(() => of(null))),
      caregivers: this.http.get<UserProfileResponse[]>(`${this.apiBaseUrl}/profiles/caregivers`).pipe(catchError(() => of(null))),
      adminUsers: this.http.get<AdminUserResponse[]>(`${this.apiBaseUrl}/admin/users`).pipe(catchError(() => of(null))),
      devices: this.deviceApi.getAdminDevices().pipe(catchError(() => of(null)))
    }).pipe(
      switchMap(({ patients, caregivers, adminUsers, devices }) => {
        const profiles = this.resolveAvailableProfiles(patients, caregivers, adminUsers);
        const patientRequests = profiles.caregivers.map(caregiver =>
          this.http
            .get<UserProfileResponse[]>(`${this.apiBaseUrl}/profiles/caregivers/${caregiver.id}/patients`)
            .pipe(catchError(() => of(null)))
        );

        return (patientRequests.length ? forkJoin(patientRequests) : of([])).pipe(
          map(caregiverPatients => ({
            ...profiles,
            caregiverPatients,
            devices
          }))
        );
      }),
      map(({ patients, caregivers, caregiverPatients, devices }) => {
        this.applyRealProfiles(patients, caregivers, caregiverPatients);

        if (devices) {
          this.devices = devices.map(device => this.mapAdminDevice(device));
          this.syncPatientAssignmentsFromDevices();
        }

        return this.buildDashboard(this.authService.getSession()?.userId || adminUserId);
      }),
      catchError(() => of(this.buildDashboard(adminUserId)))
    );
  }

  createDevice(adminUserId: string, draft: AdminDeviceDraft): Observable<AdminDevice> {
    if (!this.isValidDraft(draft)) {
      return throwError(() => new Error('Missing required device fields'));
    }

    const normalizedDraft = this.normalizeDraft(draft);

    return this.http.post(`${this.apiBaseUrl}/devices/provision`, {
      macAddress: normalizedDraft.serialNumber,
      modelName: normalizedDraft.model,
      firmwareVersion: normalizedDraft.firmwareVersion
    }, { responseType: 'text' }).pipe(
      map(response => {
        const device: AdminDevice = {
          id: this.extractDeviceId(response) || normalizedDraft.serialNumber,
          ...normalizedDraft,
          status: 'available',
          assignedPatient: null
        };
        this.devices = [device, ...this.devices];
        return this.cloneDevice(device);
      }),
      catchError(() => throwError(() => new Error('Device provision failed')))
    );
  }

  updateDevice(adminUserId: string, deviceId: string, draft: AdminDeviceDraft): Observable<AdminDevice> {
    const current = this.devices.find(device => device.id === deviceId);
    if (!current || !this.isValidDraft(draft) || this.hasDuplicateIdentity(draft, deviceId)) {
      return throwError(() => new Error('Invalid or duplicated device'));
    }

    const normalizedDraft = this.normalizeDraft(draft);
    const shouldMakeAvailable = normalizedDraft.status === 'available';
    const next: AdminDevice = {
      ...current,
      ...normalizedDraft,
      status: normalizedDraft.status,
      assignedPatient: shouldMakeAvailable ? null : current.assignedPatient
    };
    return this.deviceApi.updateAdminDevice(deviceId, {
      modelName: next.model,
      status: this.toApiDeviceStatus(next.status),
      assignedPatientId: shouldMakeAvailable ? '' : next.assignedPatient?.id
    }).pipe(
      map(() => {
        this.devices = this.devices.map(device => device.id === deviceId ? next : device);
        if (next.assignedPatient) {
          this.publishAssignment(next);
        } else {
          this.clearPatientDevice(deviceId);
          this.assignmentStore.removeByDevice(deviceId);
        }
        return this.cloneDevice(next);
      })
    );
  }

  assignDevice(adminUserId: string, patientId: string, deviceId: string): Observable<AdminDevice> {
    const patient = this.findPatient(patientId);
    const device = this.devices.find(item => item.id === deviceId);

    if (!patient || !device || patient.assignedDeviceId || device.assignedPatient || device.status !== 'available') {
      return throwError(() => new Error('Assignment violates business rules'));
    }

    return this.http.post(`${this.apiBaseUrl}/devices/${deviceId}/assign`, {
      patientId
    }, { responseType: 'text' }).pipe(
      map(() => {
        this.setPatientDevice(patientId, deviceId);
        const assignedPatient = this.findPatient(patientId)!;
        const next = { ...device, status: 'online' as const, assignedPatient: { ...assignedPatient } };
        this.devices = this.devices.map(item => item.id === deviceId ? next : item);
        this.publishAssignment(next);
        return this.cloneDevice(next);
      }),
      catchError(() => throwError(() => new Error('Device assignment failed')))
    );
  }

  private buildDashboard(adminUserId: string): AdminDevicesDashboard {
    return {
      adminUserId,
      adminEmail: this.authService.getSession()?.email || '',
      summary: {
        total: this.devices.length,
        available: this.devices.filter(device => device.status === 'available').length,
        assigned: this.devices.filter(device => !!device.assignedPatient).length,
        errors: this.devices.filter(device => device.status === 'error').length
      },
      devices: this.devices.map(device => this.cloneDevice(device)),
      individualPatients: this.individualPatients.map(patient => ({ ...patient })),
      caregivers: this.caregivers.map(caregiver => ({
        ...caregiver,
        patients: caregiver.patients.map(patient => ({ ...patient }))
      }))
    };
  }

  private findPatient(patientId: string): AdminAssignablePatient | undefined {
    return this.individualPatients.find(patient => patient.id === patientId) ??
      this.caregivers.flatMap(caregiver => caregiver.patients).find(patient => patient.id === patientId);
  }

  private setPatientDevice(patientId: string, deviceId: string): void {
    this.individualPatients = this.individualPatients.map(patient =>
      patient.id === patientId ? { ...patient, assignedDeviceId: deviceId } : patient
    );
    this.caregivers = this.caregivers.map(caregiver => ({
      ...caregiver,
      patients: caregiver.patients.map(patient =>
        patient.id === patientId ? { ...patient, assignedDeviceId: deviceId } : patient
      )
    }));
  }

  private createSeedDevice(
    id: string,
    code: string,
    model: string,
    serialNumber: string,
    status: AdminDevice['status'],
    firmwareVersion: string,
    registeredAt: string,
    patientId?: string
  ): AdminDevice {
    return {
      id,
      code,
      model,
      serialNumber,
      status,
      firmwareVersion,
      registeredAt,
      assignedPatient: patientId ? { ...this.findPatient(patientId)! } : null
    };
  }

  private createPatient(
    id: string,
    fullName: string,
    email: string,
    accountType: AdminAssignablePatient['accountType'],
    assignedDeviceId?: string,
    caregiverId?: string
  ): AdminAssignablePatient {
    return { id, fullName, email, accountType, assignedDeviceId, caregiverId };
  }

  private normalizeDraft(draft: AdminDeviceDraft): AdminDeviceDraft {
    return {
      code: draft.code.trim().toUpperCase(),
      model: draft.model.trim(),
      serialNumber: draft.serialNumber.trim().toUpperCase(),
      status: draft.status,
      firmwareVersion: draft.firmwareVersion.trim(),
      registeredAt: draft.registeredAt
    };
  }

  private isValidDraft(draft: AdminDeviceDraft): boolean {
    return !!draft.code.trim() && !!draft.model.trim() && !!draft.serialNumber.trim() &&
      !!draft.firmwareVersion.trim() && !!draft.registeredAt;
  }

  private hasDuplicateIdentity(draft: AdminDeviceDraft, excludedId?: string): boolean {
    const code = draft.code.trim().toLowerCase();
    const serial = draft.serialNumber.trim().toLowerCase();
    return this.devices.some(device => device.id !== excludedId &&
      (device.code.toLowerCase() === code || device.serialNumber.toLowerCase() === serial));
  }

  private cloneDevice(device: AdminDevice): AdminDevice {
    return {
      ...device,
      assignedPatient: device.assignedPatient ? { ...device.assignedPatient } : null
    };
  }

  private publishAssignment(device: AdminDevice): void {
    if (!device.assignedPatient) return;
    this.assignmentStore.upsert({
      deviceId: device.id,
      patientUserId: device.assignedPatient.id,
      code: device.code,
      model: device.model,
      serialNumber: device.serialNumber,
      firmwareVersion: device.firmwareVersion,
      connectionStatus: device.status === 'online' ? 'online' : 'offline'
    });
  }

  private clearPatientDevice(deviceId: string): void {
    this.individualPatients = this.individualPatients.map(patient =>
      patient.assignedDeviceId === deviceId ? { ...patient, assignedDeviceId: undefined } : patient
    );
    this.caregivers = this.caregivers.map(caregiver => ({
      ...caregiver,
      patients: caregiver.patients.map(patient =>
        patient.assignedDeviceId === deviceId ? { ...patient, assignedDeviceId: undefined } : patient
      )
    }));
  }

  private syncPatientAssignmentsFromDevices(): void {
    const assignments = new Map(
      this.devices
        .filter(device => !!device.assignedPatient)
        .map(device => [device.assignedPatient!.id, device.id])
    );

    this.individualPatients = this.individualPatients.map(patient => ({
      ...patient,
      assignedDeviceId: assignments.get(patient.id)
    }));

    this.caregivers = this.caregivers.map(caregiver => ({
      ...caregiver,
      patients: caregiver.patients.map(patient => ({
        ...patient,
        assignedDeviceId: assignments.get(patient.id)
      }))
    }));
  }

  private mapAdminDevice(device: AdminDeviceResponse): AdminDevice {
    const assignedPatient = device.assignedPatientId ? this.findPatient(device.assignedPatientId) || null : null;
    const status = this.mapDeviceStatus(device.connectionStatus || device.status, device.allocationStatus, !!assignedPatient);
    const mappedDevice: AdminDevice = {
      id: device.deviceId,
      code: device.deviceId?.slice(0, 8).toUpperCase() || '',
      model: device.modelName || 'TukunTech IoT',
      serialNumber: device.deviceId || '',
      status,
      firmwareVersion: '-',
      registeredAt: (device.provisionedAt || '').slice(0, 10),
      assignedPatient: assignedPatient ? { ...assignedPatient, assignedDeviceId: device.deviceId } : null
    };

    if (mappedDevice.assignedPatient) {
      this.publishAssignment(mappedDevice);
    } else {
      this.assignmentStore.removeByDevice(mappedDevice.id);
    }
    return mappedDevice;
  }

  private mapDeviceStatus(
    status: string | undefined,
    allocationStatus: string | undefined,
    assigned: boolean
  ): AdminDevice['status'] {
    const normalizedAllocation = (allocationStatus || '').toUpperCase();
    if (!assigned && (normalizedAllocation.includes('DISPONIBLE') || normalizedAllocation.includes('AVAILABLE'))) {
      return 'available';
    }

    const normalizedStatus = (status || '').toUpperCase();
    if (normalizedStatus.includes('ERROR') || normalizedStatus.includes('MAINTENANCE')) return 'error';
    if (normalizedStatus.includes('ONLINE') || normalizedStatus.includes('ACTIVE')) return 'online';
    if (normalizedStatus.includes('OFFLINE') || normalizedStatus.includes('INACTIVE')) return 'offline';
    if (normalizedStatus.includes('PROVISIONED') || normalizedStatus.includes('AVAILABLE') || normalizedStatus.includes('DISPONIBLE')) {
      return assigned ? 'online' : 'available';
    }
    return assigned ? 'offline' : 'available';
  }

  private toApiDeviceStatus(status: AdminDevice['status']): string {
    const statuses: Record<AdminDevice['status'], string> = {
      available: 'PROVISIONED',
      online: 'ONLINE',
      offline: 'OFFLINE',
      error: 'MAINTENANCE'
    };
    return statuses[status];
  }

  private applyRealProfiles(
    patientProfiles: UserProfileResponse[],
    caregiverProfiles: UserProfileResponse[],
    caregiverPatientProfiles: Array<UserProfileResponse[] | null> = []
  ): void {
    const caregivers = caregiverProfiles.map(profile => this.createCaregiverGroup(profile));
    const caregiverIds = new Set(caregivers.map(caregiver => caregiver.id));
    const patients = patientProfiles.map(profile => this.createPatientFromProfile(profile));
    const hasCaregiverPatientData = caregiverPatientProfiles.some(group => Array.isArray(group));
    const groupedPatientIds = new Set<string>();

    this.individualPatients = [];
    this.caregivers = caregivers.map((caregiver, index) => {
      const patientsForCaregiver = caregiverPatientProfiles[index]?.map(profile =>
        this.createPatientFromProfile({
          ...profile,
          managedByCaregiverId: profile.managedByCaregiverId || caregiver.id
        })
      );

      if (patientsForCaregiver) {
        patientsForCaregiver.forEach(patient => groupedPatientIds.add(patient.id));

        return {
          ...caregiver,
          patients: patientsForCaregiver
        };
      }

      const fallbackPatients = patients.filter(patient => patient.caregiverId === caregiver.id);
      fallbackPatients.forEach(patient => groupedPatientIds.add(patient.id));

      return {
        ...caregiver,
        patients: fallbackPatients
      };
    });

    const unlinkedPatients = hasCaregiverPatientData
      ? patients.filter(patient => !groupedPatientIds.has(patient.id))
      : patients.filter(patient => !patient.caregiverId || !caregiverIds.has(patient.caregiverId));

    if (unlinkedPatients.length) {
      this.caregivers = [
        ...this.caregivers,
        {
          id: 'unlinked-caregiver',
          fullName: 'Sin cuidador asignado',
          email: '',
          patients: unlinkedPatients
        }
      ];
    }
  }

  private resolveAvailableProfiles(
    patientProfiles: UserProfileResponse[] | null,
    caregiverProfiles: UserProfileResponse[] | null,
    adminUsers: AdminUserResponse[] | null
  ): { patients: UserProfileResponse[]; caregivers: UserProfileResponse[] } {
    const adminPatients = this.mapAdminUsersByRole(adminUsers, 'PATIENT');
    const adminCaregivers = this.mapAdminUsersByRole(adminUsers, 'CAREGIVER');
    const patients = patientProfiles?.length ? patientProfiles : adminPatients;
    const caregivers = caregiverProfiles?.length ? caregiverProfiles : adminCaregivers;

    return { patients, caregivers };
  }

  private mapAdminUsersByRole(
    adminUsers: AdminUserResponse[] | null,
    role: 'PATIENT' | 'CAREGIVER'
  ): UserProfileResponse[] {
    if (!adminUsers?.length) {
      return [];
    }

    return adminUsers
      .filter(user => this.normalizeRole(user.role) === role)
      .map(user => ({
        id: user.userId || user.id || '',
        email: user.email,
        role,
        fullName: user.fullName,
        subscriptionType: user.subscriptionPlan,
        status: user.status,
        subscriptionEndDate: user.subscriptionEnd
      }))
      .filter(profile => !!profile.id && !!profile.email);
  }

  private normalizeRole(role: string | undefined): string {
    return (role || '')
      .toUpperCase()
      .replace(/^ROLE_/, '');
  }

  private createCaregiverGroup(profile: UserProfileResponse): AdminCaregiverGroup {
    return {
      id: profile.id,
      fullName: this.getDisplayName(profile),
      email: profile.email,
      patients: []
    };
  }

  private createPatientFromProfile(profile: UserProfileResponse): AdminAssignablePatient {
    const savedAssignment = this.assignmentStore.getByPatient(profile.id);

    return {
      id: profile.id,
      fullName: this.getDisplayName(profile),
      email: profile.email,
      accountType: 'caregiver-patient',
      caregiverId: profile.managedByCaregiverId,
      assignedDeviceId: savedAssignment?.deviceId
    };
  }

  private getDisplayName(profile: UserProfileResponse): string {
    if (profile.fullName?.trim()) {
      return profile.fullName.trim();
    }

    return profile.email.split('@')[0]
      .split(/[._-]+/)
      .filter(Boolean)
      .map(part => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
      .join(' ') || profile.email;
  }

  private extractDeviceId(response: string): string {
    return response.match(/Dispositivo\s+([^\s]+)/i)?.[1] || '';
  }
}
