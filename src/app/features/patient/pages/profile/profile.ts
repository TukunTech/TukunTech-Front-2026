import { ChangeDetectorRef, Component } from '@angular/core';
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
import { AuthApiService } from '../../../../core/auth/auth-api.service';
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
  userId = '';
  email = '';
  profileLoaded = false;
  urgentAlertShow = false;
  urgentAlertTitleKey = '';
  urgentAlertMessageKey = '';

  showContactModal = false;

  showToast = false;
  toastMessageKey = '';
  contactError = '';

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
    age: null,
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
    { label: 'Male', value: 'Male' },
    { label: 'Other', value: 'Other' },
    { label: 'Prefer not to say', value: 'Prefer not to say' }
  ];

  constructor(
    private authService: AuthApiService,
    private patientProfileRepository: PatientProfileRepository,
    private patientAlertRepository: PatientAlertRepository,
    private changeDetector: ChangeDetectorRef
  ) {
    const session = this.authService.getSession();
    this.userId = session?.userId || '';
    this.email = session?.email || '';
    this.loadProfile();
  }

  addContact(): void {
    this.contactError = '';
    this.newContact = {
      name: '',
      relation: '',
      phone: ''
    };

    this.showContactModal = true;
  }

  closeContactModal(): void {
    this.showContactModal = false;
    this.contactError = '';
  }

  saveContact(): void {
    this.contactError = '';

    if (!this.newContact.name.trim() || !this.newContact.relation.trim()) {
      this.contactError = 'Completa nombre y relacion del contacto.';
      return;
    }

    const phone = this.normalizePeruPhone(this.newContact.phone);
    if (!this.isValidPeruPhone(phone)) {
      this.contactError = 'Ingresa un celular peruano valido de 9 digitos que empiece con 9.';
      return;
    }

    this.patientProfileRepository
      .createEmergencyContact(this.userId, {
        name: this.newContact.name.trim(),
        relation: this.newContact.relation.trim(),
        phone
      })
      .subscribe(() => {
        this.closeContactModal();
        this.loadProfile();
        this.showSuccessToast('patient.profile.contactAddedSuccessfully');
      }, () => {
        this.contactError = 'No se pudo guardar el contacto. Revisa los datos e intenta nuevamente.';
      });
  }

  removeContact(contactId: string): void {
    this.patientProfileRepository
      .deleteEmergencyContact(this.userId, contactId)
      .subscribe(() => {
        this.loadProfile();
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

  renewSubscription(): void {
    this.patientProfileRepository.renewSubscription().subscribe(subscription => {
      this.subscription = subscription;
      this.showSuccessToast('subscription.renewedSuccessfully');
    });
  }

  cancelSubscription(): void {
    this.patientProfileRepository.cancelSubscription().subscribe(subscription => {
      this.subscription = subscription;
      this.showSuccessToast('subscription.canceledSuccessfully');
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
        this.userId = data.profile.userId;
        this.email = data.profile.email;
        this.subscription = data.subscription;
        this.emergencyContacts = data.emergencyContacts;
        this.profileLoaded = true;
        this.changeDetector.detectChanges();
        this.loadGlobalUrgentAlert();
      });
  }

  updateContactPhone(value: string): void {
    this.newContact.phone = value.replace(/\D/g, '').slice(0, 9);
  }

  private normalizePeruPhone(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    return digits.startsWith('51') ? digits.slice(2, 11) : digits.slice(0, 9);
  }

  private isValidPeruPhone(phone: string): boolean {
    return /^9\d{8}$/.test(phone);
  }

  private loadGlobalUrgentAlert(): void {
    if (!this.userId) return;

    this.patientAlertRepository
      .getGlobalUrgentAlert(this.userId)
      .subscribe(alert => {
        this.urgentAlertShow = !!alert;
        this.urgentAlertTitleKey = alert?.titleKey || '';
        this.urgentAlertMessageKey = alert?.messageKey || '';
        this.changeDetector.detectChanges();
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
