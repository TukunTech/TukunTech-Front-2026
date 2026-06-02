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

interface EmergencyContact {
  name: string;
  relation: string;
  phone: string;
}

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
  email = 'demo.patient@tukuntech.app';

  showContactModal = false;

  showToast = false;
  toastMessage = '';

  menuItems: DashboardMenuItem[] = [
    { icon: 'bi-sun', labelKey: 'sidebar.patient.vitalSigns', route: '/patient/today' },
    { icon: 'bi-cpu', labelKey: 'sidebar.patient.device', route: '/patient/device' },
    { icon: 'bi-arrow-counterclockwise', labelKey: 'sidebar.patient.history', route: '/patient/history' },
    { icon: 'bi-person-check', labelKey: 'sidebar.patient.profile', route: '/patient/profile' },
    { icon: 'bi-ticket-perforated', labelKey: 'sidebar.patient.support', route: '/patient/support' },
    { icon: 'bi-gear', labelKey: 'sidebar.patient.settings', route: '/patient/settings' }
  ];

  profile = {
    initials: 'EM',
    fullName: 'Eleanor Marsh',
    age: 68,
    address: 'Av. siempre viva 235',
    bloodType: 'A+',
    gender: 'Female',
    notes: 'no notes'
  };

  emergencyContacts: EmergencyContact[] = [
    {
      name: 'Sarah Marsh',
      relation: 'Daughter',
      phone: '(503) 555-0184'
    },
    {
      name: 'Dr. Patel',
      relation: 'Family doctor',
      phone: '(503) 555-0102'
    }
  ];

  newContact: EmergencyContact = {
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

  addContact() {
    this.newContact = {
      name: '',
      relation: '',
      phone: ''
    };

    this.showContactModal = true;
  }

  closeContactModal() {
    this.showContactModal = false;
  }

  saveContact() {
    if (!this.newContact.name.trim()) {
      return;
    }

    this.emergencyContacts.push({ ...this.newContact });
    this.closeContactModal();

    this.showSuccessToast('Emergency contact added successfully');
  }

  removeContact(index: number) {
    this.emergencyContacts.splice(index, 1);
  }

  saveChanges() {
    console.log('Profile saved', this.profile, this.emergencyContacts);
    this.showSuccessToast('Changes were saved successfully');
  }

  showSuccessToast(message: string) {
    this.toastMessage = message;
    this.showToast = true;

    setTimeout(() => {
      this.showToast = false;
    }, 3000);
  }
}
