import { Component } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { Router } from '@angular/router';

import { AuthLayout } from '../../components/auth-layout/auth-layout';
import {
  RegisterStepper,
  RegisterStep
} from '../../components/register-stepper/register-stepper';

import {
  PatientForm,
  PatientFormData
} from '../../components/patient-form/patient-form';

import { AddressMap } from '../../components/address-map/address-map';

@Component({
  selector: 'app-register-caregiver',
  imports: [
    AuthLayout,
    RegisterStepper,
    PatientForm,
    AddressMap,
    TranslatePipe,
    NgIf,
    NgFor,
    FormsModule
  ],
  templateUrl: './register-caregiver.html',
  styleUrl: './register-caregiver.css',
})
export class RegisterCaregiver {

  constructor(private router: Router) {}

  currentStep = 1;
  activePatientIndex = 0;

  email = '';
  password = '';
  confirmPassword = '';

  street = '';

  deliveryPhone = '';
  deliveryInstructions = '';

  showPassword = false;
  showConfirmPassword = false;

  steps: RegisterStep[] = [
    { number: 1, key: 'register.steps.plan' },
    { number: 2, key: 'register.steps.account' },
    { number: 3, key: 'register.steps.personal' },
    { number: 4, key: 'register.steps.address' },
    { number: 5, key: 'register.steps.delivery' },
    { number: 6, key: 'register.steps.payment' },
    { number: 7, key: 'register.steps.done' },
  ];

  patients: PatientFormData[] = [
    this.createEmptyPatient(),
    this.createEmptyPatient(),
    this.createEmptyPatient(),
    this.createEmptyPatient(),
    this.createEmptyPatient(),
  ];

  createEmptyPatient(): PatientFormData {
    return {
      fullName: '',
      age: '',
      gender: '',
      bloodType: '',
      additionalNotes: ''
    };
  }

  continue() {
    if (this.currentStep < this.steps.length) {
      this.currentStep++;
    }
  }

  backStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  goToPlanSelection() {
    this.router.navigate(['/register']);
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  selectPatient(index: number) {
    this.activePatientIndex = index;
  }

  nextPatient() {
    if (this.activePatientIndex < this.patients.length - 1) {
      this.activePatientIndex++;
    }
  }

  previousPatient() {
    if (this.activePatientIndex > 0) {
      this.activePatientIndex--;
    }
  }
}
