import { NgClass, NgFor, NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { AppToast } from '../../../../shared/components/app-toast/app-toast';
import { CustomSelect, CustomSelectOption } from '../../../../shared/components/custom-select/custom-select';
import { DashboardLayout } from '../../../../shared/components/dashboard-layout/dashboard-layout';
import { adminMenuItems } from '../../admin-menu';
import { AdminDeviceRepository } from '../../data/admin-device.repository';
import {
  AdminAssignablePatient,
  AdminCaregiverGroup,
  AdminDevice,
  AdminDeviceDraft,
  AdminDevicesSummary,
  AdminDeviceStatus,
  filterAdminDevices
} from '../../domain/admin-device';

@Component({
  selector: 'app-admin-devices',
  imports: [DashboardLayout, TranslatePipe, FormsModule, NgFor, NgIf, NgClass, CustomSelect, AppToast],
  templateUrl: './devices.html',
  styleUrl: './devices.css'
})
export class Devices {
  readonly adminUserId = 'admin-demo-user';
  readonly menuItems = adminMenuItems;

  email = 'demo.admin@tukuntech.app';
  activeView: 'inventory' | 'assignment' = 'inventory';
  assignmentMode: 'individual' | 'caregiver' = 'individual';
  searchTerm = '';
  patientSearchTerm = '';
  caregiverSearchTerm = '';
  devices: AdminDevice[] = [];
  individualPatients: AdminAssignablePatient[] = [];
  caregivers: AdminCaregiverGroup[] = [];
  summary: AdminDevicesSummary = { total: 0, available: 0, assigned: 0, errors: 0 };

  modalMode: 'create' | 'edit' | null = null;
  editingDeviceId: string | null = null;
  deviceDraft: AdminDeviceDraft = this.createEmptyDraft();

  selectedCaregiverId = '';
  selectedPatientId = '';
  selectedDeviceId = '';

  showToast = false;
  toastType: 'success' | 'error' = 'success';
  toastMessageKey = '';

  constructor(
    private repository: AdminDeviceRepository,
    private translateService: TranslateService
  ) {
    this.loadDashboard();
  }

  get filteredDevices(): AdminDevice[] {
    return filterAdminDevices(this.devices, this.searchTerm);
  }

  get availableDevices(): AdminDevice[] {
    return this.devices.filter(device => device.status === 'available' && !device.assignedPatient);
  }

  get availableDeviceOptions(): CustomSelectOption[] {
    return this.availableDevices.map(device => ({
      value: device.id,
      label: `${device.code} · ${device.model} · ${device.serialNumber}`
    }));
  }

  get statusOptions(): CustomSelectOption[] {
    return (['available', 'online', 'offline', 'error'] as AdminDeviceStatus[]).map(status => ({
      value: status,
      label: this.translateService.instant(`admin.devices.status.${status}`)
    }));
  }

  get filteredIndividualPatients(): AdminAssignablePatient[] {
    return this.filterPatients(this.individualPatients, this.patientSearchTerm);
  }

  get filteredCaregivers(): AdminCaregiverGroup[] {
    const term = this.caregiverSearchTerm.trim().toLowerCase();
    if (!term) return this.caregivers;
    return this.caregivers.filter(caregiver =>
      caregiver.fullName.toLowerCase().includes(term) || caregiver.email.toLowerCase().includes(term)
    );
  }

  get selectedCaregiver(): AdminCaregiverGroup | undefined {
    return this.caregivers.find(caregiver => caregiver.id === this.selectedCaregiverId);
  }

  get selectedPatient(): AdminAssignablePatient | undefined {
    return [...this.individualPatients, ...this.caregivers.flatMap(item => item.patients)]
      .find(patient => patient.id === this.selectedPatientId);
  }

  openCreateModal(): void {
    this.modalMode = 'create';
    this.editingDeviceId = null;
    this.deviceDraft = this.createEmptyDraft();
  }

  openEditModal(device: AdminDevice): void {
    this.modalMode = 'edit';
    this.editingDeviceId = device.id;
    this.deviceDraft = {
      code: device.code,
      model: device.model,
      serialNumber: device.serialNumber,
      status: device.status,
      firmwareVersion: device.firmwareVersion,
      registeredAt: device.registeredAt
    };
  }

  closeDeviceModal(): void {
    this.modalMode = null;
    this.editingDeviceId = null;
  }

  changeStatus(status: string): void {
    this.deviceDraft.status = status as AdminDeviceStatus;
  }

  saveDevice(): void {
    if (!this.isValidDraft()) {
      this.showFeedback('error', 'admin.devices.form.requiredError');
      return;
    }

    const request = this.modalMode === 'edit' && this.editingDeviceId
      ? this.repository.updateDevice(this.adminUserId, this.editingDeviceId, this.deviceDraft)
      : this.repository.createDevice(this.adminUserId, this.deviceDraft);

    request.subscribe({
      next: () => {
        const message = this.modalMode === 'create'
          ? 'admin.devices.createdSuccessfully'
          : 'admin.devices.savedSuccessfully';
        this.closeDeviceModal();
        this.loadDashboard();
        this.showFeedback('success', message);
      },
      error: () => this.showFeedback('error', 'admin.devices.saveError')
    });
  }

  setAssignmentMode(mode: 'individual' | 'caregiver'): void {
    this.assignmentMode = mode;
    this.selectedPatientId = '';
    this.selectedCaregiverId = '';
  }

  selectCaregiver(caregiverId: string): void {
    this.selectedCaregiverId = caregiverId;
    this.selectedPatientId = '';
  }

  selectPatient(patient: AdminAssignablePatient): void {
    if (!patient.assignedDeviceId) this.selectedPatientId = patient.id;
  }

  confirmAssignment(): void {
    if (!this.selectedPatientId || !this.selectedDeviceId) {
      this.showFeedback('error', 'admin.devices.assignment.incomplete');
      return;
    }

    this.repository.assignDevice(this.adminUserId, this.selectedPatientId, this.selectedDeviceId).subscribe({
      next: () => {
        this.selectedPatientId = '';
        this.selectedDeviceId = '';
        this.loadDashboard();
        this.showFeedback('success', 'admin.devices.assignment.success');
      },
      error: () => this.showFeedback('error', 'admin.devices.assignment.error')
    });
  }

  getStatusLabelKey(status: AdminDeviceStatus): string {
    return `admin.devices.status.${status}`;
  }

  getStatusClass(status: AdminDeviceStatus): string {
    return `status-pill--${status}`;
  }

  private loadDashboard(): void {
    this.repository.getDashboard(this.adminUserId).subscribe(data => {
      this.email = data.adminEmail;
      this.devices = data.devices;
      this.summary = data.summary;
      this.individualPatients = data.individualPatients;
      this.caregivers = data.caregivers;
    });
  }

  private filterPatients(patients: AdminAssignablePatient[], searchTerm: string): AdminAssignablePatient[] {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return patients;
    return patients.filter(patient =>
      patient.fullName.toLowerCase().includes(term) || patient.email.toLowerCase().includes(term)
    );
  }

  private createEmptyDraft(): AdminDeviceDraft {
    return {
      code: '',
      model: '',
      serialNumber: '',
      status: 'available',
      firmwareVersion: '',
      registeredAt: new Date().toISOString().slice(0, 10)
    };
  }

  private isValidDraft(): boolean {
    return !!this.deviceDraft.code.trim() && !!this.deviceDraft.model.trim() &&
      !!this.deviceDraft.serialNumber.trim() && !!this.deviceDraft.firmwareVersion.trim() &&
      !!this.deviceDraft.registeredAt;
  }

  private showFeedback(type: 'success' | 'error', messageKey: string): void {
    this.toastType = type;
    this.toastMessageKey = messageKey;
    this.showToast = true;
    setTimeout(() => this.showToast = false, 3000);
  }
}
