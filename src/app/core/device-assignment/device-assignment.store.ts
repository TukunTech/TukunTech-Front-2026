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
  private readonly demoPatientIds = new Set([
    'patient-eleanor',
    'patient-charls',
    'patient-miguel',
    'patient-robert',
    'patient-marian',
  ]);
  private assignments = new Map<string, DeviceAssignmentProjection>();

  constructor() {
    const saved = globalThis.localStorage?.getItem(this.storageKey);
    if (!saved) return;

    try {
      const assignments = JSON.parse(saved) as DeviceAssignmentProjection[];
      const realAssignments = assignments.filter(item => !this.isDemoAssignment(item));
      this.assignments = new Map(realAssignments.map(item => [item.patientUserId, item]));
      if (realAssignments.length !== assignments.length) this.persist();
    } catch {
      this.assignments = new Map();
    }
  }

  getByPatient(patientUserId: string): DeviceAssignmentProjection | undefined {
    const assignment = this.assignments.get(patientUserId);
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

  removeByDevice(deviceId: string): void {
    let changed = false;

    for (const [patientId, current] of this.assignments) {
      if (current.deviceId === deviceId) {
        this.assignments.delete(patientId);
        changed = true;
      }
    }

    if (changed) {
      this.persist();
    }
  }

  private persist(): void {
    globalThis.localStorage?.setItem(
      this.storageKey,
      JSON.stringify([...this.assignments.values()]),
    );
  }

  private isDemoAssignment(assignment: DeviceAssignmentProjection): boolean {
    return this.demoPatientIds.has(assignment.patientUserId) ||
      assignment.deviceId.startsWith('device-') && this.demoPatientIds.has(assignment.patientUserId);
  }
}
