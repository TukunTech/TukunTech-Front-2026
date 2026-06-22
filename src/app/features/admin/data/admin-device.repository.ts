import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { DeviceAssignmentStore } from '../../../core/device-assignment/device-assignment.store';

import {
  AdminAssignablePatient,
  AdminCaregiverGroup,
  AdminDevice,
  AdminDeviceDraft,
  AdminDevicesDashboard
} from '../domain/admin-device';

@Injectable({ providedIn: 'root' })
export class AdminDeviceRepository {
  private individualPatients: AdminAssignablePatient[] = [
    this.createPatient('patient-sarah', 'Sarah Marsh', 'sarah@tukuntech.com', 'individual'),
    this.createPatient('patient-james', 'James Patel', 'james@tukuntech.com', 'individual'),
    this.createPatient('patient-lucia', 'Lucía Torres', 'lucia@tukuntech.com', 'individual')
  ];

  private caregivers: AdminCaregiverGroup[] = [
    {
      id: 'caregiver-sara',
      fullName: 'Sara Ramírez',
      email: 'sara@tukuntech.com',
      patients: [
        this.createPatient('patient-eleanor', 'Eleanor Marsh', 'eleanor@tukuntech.com', 'caregiver-patient', 'device-eleanor', 'caregiver-sara'),
        this.createPatient('patient-charls', 'Charls March', 'charls@tukuntech.com', 'caregiver-patient', 'device-charls', 'caregiver-sara'),
        this.createPatient('patient-miguel', 'Miguel Montana', 'miguel@tukuntech.com', 'caregiver-patient', 'device-miguel', 'caregiver-sara'),
        this.createPatient('patient-ana', 'Ana Ramírez', 'ana@tukuntech.com', 'caregiver-patient', undefined, 'caregiver-sara'),
        this.createPatient('patient-luis', 'Luis Ramírez', 'luis@tukuntech.com', 'caregiver-patient', undefined, 'caregiver-sara')
      ]
    },
    {
      id: 'caregiver-carlos',
      fullName: 'Carlos Mendoza',
      email: 'carlos@tukuntech.com',
      patients: [
        this.createPatient('patient-marian', 'Marian Medilla', 'marian@tukuntech.com', 'caregiver-patient', 'device-marian', 'caregiver-carlos'),
        this.createPatient('patient-robert', 'Robert Silva', 'robert@tukuntech.com', 'caregiver-patient', 'device-robert', 'caregiver-carlos'),
        this.createPatient('patient-michael', 'Michael Mendoza', 'michael@tukuntech.com', 'caregiver-patient', undefined, 'caregiver-carlos'),
        this.createPatient('patient-sofia', 'Sofía Mendoza', 'sofia@tukuntech.com', 'caregiver-patient', undefined, 'caregiver-carlos'),
        this.createPatient('patient-diego', 'Diego Mendoza', 'diego@tukuntech.com', 'caregiver-patient', undefined, 'caregiver-carlos')
      ]
    }
  ];

  private devices: AdminDevice[] = [
    this.createSeedDevice('device-eleanor', 'CC4B32', 'Tukun Care 2', 'CB-9F32-01', 'online', '2.4.1', '2026-05-12', 'patient-eleanor'),
    this.createSeedDevice('device-charls', 'DD8A91', 'Tukun Care 2', 'C1-K22L-01', 'offline', '2.4.1', '2026-05-16', 'patient-charls'),
    this.createSeedDevice('device-miguel', 'FF3K22', 'Tukun Care Pro', 'H4-23LP-01', 'online', '2.5.0', '2026-05-22', 'patient-miguel'),
    this.createSeedDevice('device-marian', 'AA7N40', 'Tukun Care 2', 'CM-660E-12', 'offline', '2.4.1', '2026-06-02', 'patient-marian'),
    this.createSeedDevice('device-robert', 'ZX9P15', 'Tukun Care Pro', 'CR-520F-08', 'error', '2.5.0', '2026-06-03', 'patient-robert')
  ];

  constructor(private assignmentStore: DeviceAssignmentStore) {
    this.devices = this.devices.map(device => {
      if (!device.assignedPatient) return device;
      const savedAssignment = this.assignmentStore.getByPatient(device.assignedPatient.id);
      return savedAssignment ? { ...device, status: savedAssignment.connectionStatus } : device;
    });
    this.devices.filter(device => device.assignedPatient).forEach(device => this.publishAssignment(device));
  }

  getDashboard(adminUserId: string): Observable<AdminDevicesDashboard> {
    return of(this.buildDashboard(adminUserId));
  }

  createDevice(adminUserId: string, draft: AdminDeviceDraft): Observable<AdminDevice> {
    if (!this.isValidDraft(draft) || this.hasDuplicateIdentity(draft)) {
      return throwError(() => new Error('Invalid or duplicated device'));
    }

    const device: AdminDevice = {
      id: `device-${Date.now()}`,
      ...this.normalizeDraft(draft),
      status: 'available',
      assignedPatient: null
    };
    this.devices = [device, ...this.devices];
    return of(this.cloneDevice(device));
  }

  updateDevice(adminUserId: string, deviceId: string, draft: AdminDeviceDraft): Observable<AdminDevice> {
    const current = this.devices.find(device => device.id === deviceId);
    if (!current || !this.isValidDraft(draft) || this.hasDuplicateIdentity(draft, deviceId)) {
      return throwError(() => new Error('Invalid or duplicated device'));
    }

    const next: AdminDevice = {
      ...current,
      ...this.normalizeDraft(draft),
      status: current.assignedPatient && draft.status === 'available' ? current.status : draft.status
    };
    this.devices = this.devices.map(device => device.id === deviceId ? next : device);
    if (next.assignedPatient) this.publishAssignment(next);
    return of(this.cloneDevice(next));
  }

  assignDevice(adminUserId: string, patientId: string, deviceId: string): Observable<AdminDevice> {
    const patient = this.findPatient(patientId);
    const device = this.devices.find(item => item.id === deviceId);

    if (!patient || !device || patient.assignedDeviceId || device.assignedPatient || device.status !== 'available') {
      return throwError(() => new Error('Assignment violates business rules'));
    }

    this.setPatientDevice(patientId, deviceId);
    const assignedPatient = this.findPatient(patientId)!;
    const next = { ...device, status: 'online' as const, assignedPatient: { ...assignedPatient } };
    this.devices = this.devices.map(item => item.id === deviceId ? next : item);
    this.publishAssignment(next);
    return of(this.cloneDevice(next));
  }

  private buildDashboard(adminUserId: string): AdminDevicesDashboard {
    return {
      adminUserId,
      adminEmail: 'demo.admin@tukuntech.app',
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
}
