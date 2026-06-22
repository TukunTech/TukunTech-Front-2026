import { Injectable } from '@angular/core';

export interface DeviceAssignmentProjection {
  deviceId: string;
  patientUserId: string;
  code: string;
  model: string;
  serialNumber: string;
  firmwareVersion: string;
  connectionStatus: 'online' | 'offline';
}

@Injectable({ providedIn: 'root' })
export class DeviceAssignmentStore {
  private readonly storageKey = 'tukuntech.device-assignments.v1';
  private assignments = new Map<string, DeviceAssignmentProjection>([
    [
      'patient-eleanor',
      this.seed(
        'device-eleanor',
        'patient-eleanor',
        'CC4B32',
        'Tukun Care 2',
        'CB-9F32-01',
        '2.4.1',
        'online',
      ),
    ],
    [
      'patient-charls',
      this.seed(
        'device-charls',
        'patient-charls',
        'DD8A91',
        'Tukun Care 2',
        'C1-K22L-01',
        '2.4.1',
        'online',
      ),
    ],
    [
      'patient-miguel',
      this.seed(
        'device-miguel',
        'patient-miguel',
        'FF3K22',
        'Tukun Care Pro',
        'H4-23LP-01',
        '2.5.0',
        'online',
      ),
    ],
    [
      'patient-robert',
      this.seed(
        'device-robert',
        'patient-robert',
        'ZX9P15',
        'Tukun Care Pro',
        'CR-520F-08',
        '2.5.0',
        'online',
      ),
    ],
    [
      'patient-marian',
      this.seed(
        'device-marian',
        'patient-marian',
        'AA7N40',
        'Tukun Care 2',
        'CM-660E-12',
        '2.4.1',
        'online',
      ),
    ],

  ]);

  constructor() {
    const saved = globalThis.localStorage?.getItem(this.storageKey);
    if (!saved) return;

    try {
      const assignments = JSON.parse(saved) as DeviceAssignmentProjection[];
      this.assignments = new Map(assignments.map(item => [item.patientUserId, item]));
    } catch {
      // Keep the local seed when stored mock data is invalid.
    }
  }

  getByPatient(patientUserId: string): DeviceAssignmentProjection | undefined {
    const resolvedId = patientUserId === 'patient-demo-user' ? 'patient-eleanor' : patientUserId;
    const assignment = this.assignments.get(resolvedId);
    return assignment ? { ...assignment, patientUserId } : undefined;
  }

  upsert(assignment: DeviceAssignmentProjection): void {
    for (const [patientId, current] of this.assignments) {
      if (current.deviceId === assignment.deviceId && patientId !== assignment.patientUserId) {
        this.assignments.delete(patientId);
      }
    }
    this.assignments.set(assignment.patientUserId, { ...assignment });
    this.persist();
  }

  setConnectionStatus(patientUserId: string, connectionStatus: 'online' | 'offline'): void {
    const current = this.assignments.get(patientUserId);
    if (current) {
      this.assignments.set(patientUserId, { ...current, connectionStatus });
      this.persist();
    }
  }

  private persist(): void {
    globalThis.localStorage?.setItem(
      this.storageKey,
      JSON.stringify([...this.assignments.values()]),
    );
  }

  private seed(
    deviceId: string,
    patientUserId: string,
    code: string,
    model: string,
    serialNumber: string,
    firmwareVersion: string,
    connectionStatus: 'online' | 'offline',
  ): DeviceAssignmentProjection {
    return {
      deviceId,
      patientUserId,
      code,
      model,
      serialNumber,
      firmwareVersion,
      connectionStatus,
    };
  }
}
