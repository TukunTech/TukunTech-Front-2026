
import { Component } from '@angular/core';
import { NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { PatientForm, PatientFormData } from '../../components/patient-form/patient-form';
import { AuthLayout } from '../../components/auth-layout/auth-layout';
import { AddressMap } from '../../components/address-map/address-map';
import {
  RegisterStepper,
  RegisterStep
} from '../../components/register-stepper/register-stepper';
import {
  createEmptyRegistrationPatient,
  hasValidMedicalParameters
} from '../../domain/registration-patient';

@Component({
  selector: 'app-register-patient',
  imports: [
    AuthLayout,
    TranslatePipe,
    NgIf,
    FormsModule,
    AddressMap,
    RegisterStepper,
    PatientForm
  ],
  templateUrl: './register-patient.html',
  styleUrl: './register-patient.css',
})
export class RegisterPatient {

  constructor(private router: Router) {}

  currentStep = 1;
  showMedicalParametersError = false;

  email = '';
  password = '';
  confirmPassword = '';

  patientData: PatientFormData = createEmptyRegistrationPatient();

  street = '';
  city = '';
  reference = '';

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

  continue() {
    if (this.currentStep === 3 && !hasValidMedicalParameters(this.patientData)) {
      this.showMedicalParametersError = true;
      return;
    }

    this.showMedicalParametersError = false;

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

  goToDashboard() {
    this.router.navigate(['/patient/today']);
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }
}
/*import { Component, ElementRef, ViewChild } from '@angular/core';
import { NgClass, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthLayout } from '../../components/auth-layout/auth-layout';
import { AddressMap } from '../../components/address-map/address-map';
import { CustomSelect, CustomSelectOption } from '../../../../shared/components/custom-select/custom-select';
import {Router} from '@angular/router';

@Component({
  selector: 'app-register-patient',
  imports: [
    AuthLayout,
    TranslatePipe,
    NgFor,
    NgClass,
    NgIf,
    FormsModule,
    AddressMap,
    CustomSelect
  ],
  templateUrl: './register-patient.html',
  styleUrl: './register-patient.css',
})
export class RegisterPatient {
  @ViewChild('stepperScroll') stepperScroll!: ElementRef<HTMLDivElement>;
  constructor(private router: Router) {}
  goToPlanSelection() {
    this.router.navigate(['/register']);
  }

  currentStep = 1;

  email = '';
  password = '';
  confirmPassword = '';
  fullName = '';
  age = '';
  gender = '';
  bloodType = '';
  additionalNotes = '';

  Address = '';

  deliveryPhone = '';
  deliveryInstructions = '';

  showPassword = false;
  showConfirmPassword = false;

  steps = [
    { number: 1, key: 'register.steps.plan' },
    { number: 2, key: 'register.steps.account' },
    { number: 3, key: 'register.steps.personal' },
    { number: 4, key: 'register.steps.address' },
    { number: 5, key: 'register.steps.delivery' },
    { number: 6, key: 'register.steps.payment' },
    { number: 7, key: 'register.steps.done' },
  ];

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

  scrollSteps(direction: 'left' | 'right') {
    this.stepperScroll.nativeElement.scrollBy({
      left: direction === 'right' ? 140 : -140,
      behavior: 'smooth',
    });
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  genderOptions: CustomSelectOption[] = [
    { label: 'Female', value: 'female' },
    { label: 'Male', value: 'male' }
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
}
*/
