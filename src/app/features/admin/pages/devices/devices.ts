import { NgClass, NgFor, NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { AppToast } from '../../../../shared/components/app-toast/app-toast';
import {
  CustomSelect,
  CustomSelectOption
} from '../../../../shared/components/custom-select/custom-select';
import {
  DashboardLayout
} from '../../../../shared/components/dashboard-layout/dashboard-layout';
import { adminMenuItems } from '../../admin-menu';
import { AdminDeviceRepository } from '../../data/admin-device.repository';
import {
  AdminDevice,
  AdminDevicesSummary,
  AdminDeviceStatus,
  filterAdminDevices
} from '../../domain/admin-device';

@Component({
  selector: 'app-admin-devices',
  imports: [
    DashboardLayout,
    TranslatePipe,
    FormsModule,
    NgFor,
    NgIf,
    NgClass,
    CustomSelect,
    AppToast
  ],
  templateUrl: './devices.html',
  styleUrl: './devices.css',
})
export class Devices {
  adminUserId = 'admin-demo-user';
  email = 'demo.admin@tukuntech.app';
  searchTerm = '';
  devices: AdminDevice[] = [];
  summary: AdminDevicesSummary = {
    total: 0,
    online: 0,
    offline: 0,
    errors: 0
  };
  selectedDevice: AdminDevice | null = null;
  editModel: AdminDevice | null = null;
  showToast = false;
  toastType: 'success' | 'error' = 'success';
  toastMessageKey = '';

  menuItems = adminMenuItems;

  constructor(
    private adminDeviceRepository: AdminDeviceRepository,
    private translateService: TranslateService
  ) {
    this.loadDashboard();
  }

  get filteredDevices(): AdminDevice[] {
    return filterAdminDevices(this.devices, this.searchTerm);
  }

  get statusOptions(): CustomSelectOption[] {
    return [
      { label: this.translateService.instant('admin.devices.status.online'), value: 'online' },
      { label: this.translateService.instant('admin.devices.status.offline'), value: 'offline' },
      { label: this.translateService.instant('admin.devices.status.error'), value: 'error' }
    ];
  }

  openEditModal(device: AdminDevice): void {
    this.selectedDevice = device;
    this.editModel = this.cloneDevice(device);
  }

  closeEditModal(): void {
    this.selectedDevice = null;
    this.editModel = null;
  }

  changeStatus(status: string): void {
    if (!this.editModel) {
      return;
    }

    this.editModel.status = status as AdminDeviceStatus;
  }

  changeOwnerId(ownerId: string): void {
    if (!this.editModel) {
      return;
    }

    this.editModel.ownerId = ownerId.replace(/\D/g, '').slice(0, 6);
  }

  preventInvalidNumberInput(event: KeyboardEvent): void {
    if (['e', 'E', '+', '-'].includes(event.key)) {
      event.preventDefault();
    }
  }

  saveDevice(): void {
    if (!this.editModel) {
      return;
    }

    if (!this.hasValidNumericParameters(this.editModel)) {
      this.showFeedback('error', 'admin.devices.invalidParameters');
      return;
    }

    const { id, ...update } = this.editModel;

    this.adminDeviceRepository
      .updateDevice(this.adminUserId, id, update)
      .subscribe({
        next: device => {
          this.devices = this.devices.map(item =>
            item.id === device.id
              ? device
              : item
          );
          this.closeEditModal();
          this.showFeedback('success', 'admin.devices.savedSuccessfully');
        },
        error: () => {
          this.showFeedback('error', 'admin.devices.saveError');
        }
      });
  }

  getStatusLabelKey(status: AdminDeviceStatus): string {
    return `admin.devices.status.${status}`;
  }

  getStatusClass(status: AdminDeviceStatus): string {
    return `status-pill--${status}`;
  }

  private loadDashboard(): void {
    this.adminDeviceRepository
      .getDashboard(this.adminUserId)
      .subscribe(data => {
        this.email = data.adminEmail;
        this.devices = data.devices;
        this.summary = data.summary;
      });
  }

  private hasValidNumericParameters(device: AdminDevice): boolean {
    const params = device.parameters;

    return !!device.ownerId &&
      params.heartRateMin > 0 &&
      params.heartRateMax > params.heartRateMin &&
      params.temperatureMin > 30 &&
      params.temperatureMax > params.temperatureMin &&
      params.oxygenSaturation >= 70 &&
      params.oxygenSaturation <= 100;
  }

  private cloneDevice(device: AdminDevice): AdminDevice {
    return {
      ...device,
      owner: { ...device.owner },
      parameters: { ...device.parameters }
    };
  }

  private showFeedback(type: 'success' | 'error', messageKey: string): void {
    this.toastType = type;
    this.toastMessageKey = messageKey;
    this.showToast = true;

    setTimeout(() => {
      this.showToast = false;
    }, 3000);
  }
}
