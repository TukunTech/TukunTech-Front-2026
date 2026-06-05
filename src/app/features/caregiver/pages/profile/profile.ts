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
  DashboardLayout,
  DashboardMenuItem
} from '../../../../shared/components/dashboard-layout/dashboard-layout';
import { CaregiverAlertRepository } from '../../data/caregiver-alert.repository';
import { CaregiverProfileRepository } from '../../data/caregiver-profile.repository';
import {
  CaregiverEmergencyContact,
  CaregiverPatientBloodType,
  CaregiverPatientGender,
  CaregiverPatientProfile
} from '../../domain/caregiver-profile';

@Component({
  selector: 'app-caregiver-profile',
  imports: [
    DashboardLayout,
    TranslatePipe,
    CustomSelect,
    AppToast,
    FormsModule,
    NgFor,
    NgIf,
    NgClass
  ],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class Profile {
  caregiverUserId = 'caregiver-demo-user';
  email = 'demo.caregiver@tukuntech.app';
  selectedPatientId = '';
  urgentAlertShow = false;
  urgentAlertTitleKey = '';
  urgentAlertMessageKey = '';
  urgentAlertMessageParams: Record<string, string> = {};

  patients: CaregiverPatientProfile[] = [];
  profile: CaregiverPatientProfile = this.createEmptyProfile();
  emergencyContacts: CaregiverEmergencyContact[] = [];

  showContactModal = false;
  showToast = false;
  toastMessageKey = '';

  newContact = {
    name: '',
    relation: '',
    phone: ''
  };

  menuItems: DashboardMenuItem[] = [
    { icon: 'bi-sun', labelKey: 'sidebar.caregiver.vitalSigns', route: '/caregiver/vital-signs' },
    { icon: 'bi-cpu', labelKey: 'sidebar.caregiver.device', route: '/caregiver/device' },
    { icon: 'bi-arrow-counterclockwise', labelKey: 'sidebar.caregiver.history', route: '/caregiver/history' },
    { icon: 'bi-person-check', labelKey: 'sidebar.caregiver.profile', route: '/caregiver/profile' },
    { icon: 'bi-ticket-perforated', labelKey: 'sidebar.caregiver.support', route: '/caregiver/support' },
    { icon: 'bi-gear', labelKey: 'sidebar.caregiver.settings', route: '/caregiver/settings' }
  ];

  bloodTypeOptions: CustomSelectOption[] = [
    { label: 'A+', value: 'A+' },
    { label: 'A-', value: 'A-' },
    { label: 'B+', value: 'B+' },
    { label: 'B-', value: 'B-' },
    { label: 'AB+', value: 'AB+' },
    { label: 'AB-', value: 'AB-' },
    { label: 'O+', value: 'O+' },
    { label: 'O-', value: 'O-' }
  ];

  constructor(
    private caregiverAlertRepository: CaregiverAlertRepository,
    private caregiverProfileRepository: CaregiverProfileRepository,
    private translateService: TranslateService
  ) {
    this.loadDashboard();
    this.loadGlobalCriticalAlert();
  }

  get genderOptions(): CustomSelectOption[] {
    return [
      {
        label: this.translateService.instant('caregiver.profile.genderFemale'),
        value: 'Female'
      },
      {
        label: this.translateService.instant('caregiver.profile.genderMale'),
        value: 'Male'
      }
    ];
  }

  get selectedPatientContacts(): CaregiverEmergencyContact[] {
    return this.emergencyContacts.filter(contact =>
      contact.patientUserId === this.selectedPatientId
    );
  }

  selectPatient(patient: CaregiverPatientProfile): void {
    this.selectedPatientId = patient.userId;
    this.profile = { ...patient };
  }

  getPatientChipClass(patient: CaregiverPatientProfile): string {
    return patient.userId === this.selectedPatientId
      ? 'patient-chip--selected'
      : '';
  }

  addContact(): void {
    this.newContact = {
      name: '',
      relation: '',
      phone: ''
    };

    this.showContactModal = true;
  }

  closeContactModal(): void {
    this.showContactModal = false;
  }

  saveContact(): void {
    if (!this.selectedPatientId || !this.newContact.name.trim()) {
      return;
    }

    this.caregiverProfileRepository
      .createEmergencyContact(this.caregiverUserId, this.selectedPatientId, {
        name: this.newContact.name.trim(),
        relation: this.newContact.relation.trim(),
        phone: this.newContact.phone.trim()
      })
      .subscribe(contact => {
        this.emergencyContacts = [...this.emergencyContacts, contact];
        this.closeContactModal();
        this.showSuccessToast('caregiver.profile.contactAddedSuccessfully');
      });
  }

  removeContact(contactId: string): void {
    if (!this.selectedPatientId) {
      return;
    }

    this.caregiverProfileRepository
      .deleteEmergencyContact(this.caregiverUserId, this.selectedPatientId, contactId)
      .subscribe(() => {
        this.emergencyContacts = this.emergencyContacts.filter(contact =>
          contact.id !== contactId
        );
      });
  }

  saveChanges(): void {
    if (!this.profile.userId) {
      return;
    }

    this.caregiverProfileRepository
      .updatePatientProfile(this.caregiverUserId, this.profile)
      .subscribe(profile => {
        this.profile = { ...profile };
        this.patients = this.patients.map(patient =>
          patient.userId === profile.userId
            ? { ...profile }
            : patient
        );
        this.showSuccessToast('caregiver.profile.changesSavedSuccessfully');
      });
  }

  changeBloodType(value: string): void {
    this.profile.bloodType = value as CaregiverPatientBloodType;
  }

  changeGender(value: string): void {
    this.profile.gender = value as CaregiverPatientGender;
  }

  private loadDashboard(): void {
    this.caregiverProfileRepository
      .getDashboard(this.caregiverUserId)
      .subscribe(data => {
        this.email = data.caregiverEmail;
        this.patients = data.patients;
        this.emergencyContacts = data.emergencyContacts;

        const selectedProfile = data.patients.find(patient =>
          patient.userId === this.selectedPatientId
        ) || data.patients[0];

        if (selectedProfile) {
          this.selectedPatientId = selectedProfile.userId;
          this.profile = { ...selectedProfile };
        }
      });
  }

  private loadGlobalCriticalAlert(): void {
    this.caregiverAlertRepository
      .getGlobalCriticalAlert(this.caregiverUserId)
      .subscribe(alert => {
        this.urgentAlertShow = !!alert;
        this.urgentAlertTitleKey = alert?.titleKey || '';
        this.urgentAlertMessageKey = alert?.messageKey || '';
        this.urgentAlertMessageParams = alert?.messageParams || {};
      });
  }

  private showSuccessToast(messageKey: string): void {
    this.toastMessageKey = messageKey;
    this.showToast = true;

    setTimeout(() => {
      this.showToast = false;
    }, 3000);
  }

  private createEmptyProfile(): CaregiverPatientProfile {
    return {
      userId: '',
      initials: '',
      fullName: '',
      age: 0,
      address: '',
      bloodType: 'A+',
      gender: 'Female',
      notes: ''
    };
  }
}
