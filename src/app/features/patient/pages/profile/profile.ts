import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgFor, NgIf } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';

import {
  DashboardLayout,
  DashboardMenuItem
} from '../../../../shared/components/dashboard-layout/dashboard-layout';

import {
  CustomSelect,
  CustomSelectOption
} from '../../../../shared/components/custom-select/custom-select';

import { AppToast } from '../../../../shared/components/app-toast/app-toast';
import { PatientAlertRepository } from '../../data/patient-alert.repository';
import { PatientProfileRepository } from '../../data/patient-profile.repository';
import {
  EmergencyContact,
  PatientBloodType,
  PatientGender,
  PatientProfile,
  PatientSubscription
} from '../../domain/patient-profile';

@Component({
  selector: 'app-profile',
  imports: [
    DashboardLayout,
    FormsModule,
    NgFor,
    NgIf,
    TranslatePipe,
    CustomSelect,
    AppToast
  ],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class Profile {
  userId = 'patient-demo-user';
  email = 'demo.patient@tukuntech.app';
  urgentAlertShow = false;
  urgentAlertTitleKey = '';
  urgentAlertMessageKey = '';

  showContactModal = false;

  showToast = false;
  toastMessageKey = '';

  menuItems: DashboardMenuItem[] = [
    { icon: 'bi-sun', labelKey: 'sidebar.patient.vitalSigns', route: '/patient/today' },
    { icon: 'bi-cpu', labelKey: 'sidebar.patient.device', route: '/patient/device' },
    { icon: 'bi-arrow-counterclockwise', labelKey: 'sidebar.patient.history', route: '/patient/history' },
    { icon: 'bi-person-check', labelKey: 'sidebar.patient.profile', route: '/patient/profile' },
    { icon: 'bi-ticket-perforated', labelKey: 'sidebar.patient.support', route: '/patient/support' },
    { icon: 'bi-gear', labelKey: 'sidebar.patient.settings', route: '/patient/settings' }
  ];

  profile: PatientProfile = {
    userId: this.userId,
    email: this.email,
    initials: '',
    fullName: '',
    age: 0,
    address: '',
    bloodType: 'A+',
    gender: 'Female',
    notes: ''
  };

  subscription: PatientSubscription = {
    id: '',
    name: '',
    renewsOn: '',
    priceLabel: '',
    status: 'inactive',
    planLabel: ''
  };

  emergencyContacts: EmergencyContact[] = [];

  newContact = {
    name: '',
    relation: '',
    phone: ''
  };

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

  genderOptions: CustomSelectOption[] = [
    { label: 'Female', value: 'Female' },
    { label: 'Male', value: 'Male' }
  ];

  constructor(
    private patientProfileRepository: PatientProfileRepository,
    private patientAlertRepository: PatientAlertRepository
  ) {
    this.loadProfile();
    this.loadGlobalUrgentAlert();
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
    if (!this.newContact.name.trim()) {
      return;
    }

    this.patientProfileRepository
      .createEmergencyContact(this.userId, {
        name: this.newContact.name.trim(),
        relation: this.newContact.relation.trim(),
        phone: this.newContact.phone.trim()
      })
      .subscribe(contact => {
        this.emergencyContacts = [...this.emergencyContacts, contact];
        this.closeContactModal();
        this.showSuccessToast('patient.profile.contactAddedSuccessfully');
      });
  }

  removeContact(contactId: string): void {
    this.patientProfileRepository
      .deleteEmergencyContact(this.userId, contactId)
      .subscribe(() => {
        this.emergencyContacts = this.emergencyContacts.filter(contact =>
          contact.id !== contactId
        );
      });
  }

  saveChanges(): void {
    this.patientProfileRepository
      .updateProfile(this.userId, this.profile)
      .subscribe(profile => {
        this.profile = profile;
        this.email = profile.email;
        this.showSuccessToast('patient.profile.changesSavedSuccessfully');
      });
  }

  changeBloodType(value: string): void {
    this.profile.bloodType = value as PatientBloodType;
  }

  changeGender(value: string): void {
    this.profile.gender = value as PatientGender;
  }

  private loadProfile(): void {
    this.patientProfileRepository
      .getProfilePageData(this.userId)
      .subscribe(data => {
        this.profile = data.profile;
        this.email = data.profile.email;
        this.subscription = data.subscription;
        this.emergencyContacts = data.emergencyContacts;
      });
  }

  private loadGlobalUrgentAlert(): void {
    this.patientAlertRepository
      .getGlobalUrgentAlert(this.userId)
      .subscribe(alert => {
        this.urgentAlertShow = !!alert;
        this.urgentAlertTitleKey = alert?.titleKey || '';
        this.urgentAlertMessageKey = alert?.messageKey || '';
      });
  }

  private showSuccessToast(messageKey: string): void {
    this.toastMessageKey = messageKey;
    this.showToast = true;

    setTimeout(() => {
      this.showToast = false;
    }, 3000);
  }
}
