import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
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
import {
  createEmptyRegistrationPatient,
  hasValidRegistrationPatient
} from '../../domain/registration-patient';

interface RegisterPlanOption {
  id: 'individual' | 'family-2' | 'family-3' | 'family-4' | 'family-5';
  titleKey: string;
  descriptionKey: string;
  patients: number;
  monthlyPrice: number;
  initialPrice: number;
  monthlyStripePriceId: string;
  initialStripePriceId: string;
  recommended?: boolean;
}

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

  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) {
    const requestedPlan = this.route.snapshot.queryParamMap.get('plan');
    const matchingPlan = this.planOptions.find(plan => plan.id === requestedPlan);
    this.selectedPlan = matchingPlan ?? this.planOptions[0];
    this.syncPatientsWithPlan();
  }

  currentStep = 1;
  activePatientIndex = 0;
  showMedicalParametersError = false;

  email = '';
  password = '';
  confirmPassword = '';

  street = '';

  deliveryPhone = '';
  deliveryInstructions = '';

  showPassword = false;
  showConfirmPassword = false;

  selectedPlan!: RegisterPlanOption;

  planOptions: RegisterPlanOption[] = [
    {
      id: 'individual',
      titleKey: 'register.plan.individualCare.title',
      descriptionKey: 'register.plan.individualCare.description',
      patients: 1,
      monthlyPrice: 15,
      initialPrice: 50,
      monthlyStripePriceId: 'price_1TlKxoKE2OW5fr4NtaaptoKG',
      initialStripePriceId: 'price_1TlL0uKE2OW5fr4NJVs86Hxg'
    },
    {
      id: 'family-2',
      titleKey: 'register.plan.family2.title',
      descriptionKey: 'register.plan.family2.description',
      patients: 2,
      monthlyPrice: 28,
      initialPrice: 95,
      monthlyStripePriceId: 'price_1TlWHFKE2OW5fr4NMGsrsJyi',
      initialStripePriceId: 'price_1TlWHgKE2OW5fr4N3EE7ulm7'
    },
    {
      id: 'family-3',
      titleKey: 'register.plan.family3.title',
      descriptionKey: 'register.plan.family3.description',
      patients: 3,
      monthlyPrice: 40,
      initialPrice: 140,
      monthlyStripePriceId: 'price_1TlWHzKE2OW5fr4NVlwwbWaL',
      initialStripePriceId: 'price_1TlWIEKE2OW5fr4N6IYuqNzH',
      recommended: true
    },
    {
      id: 'family-4',
      titleKey: 'register.plan.family4.title',
      descriptionKey: 'register.plan.family4.description',
      patients: 4,
      monthlyPrice: 52,
      initialPrice: 180,
      monthlyStripePriceId: 'price_1TlWIRKE2OW5fr4NUYmM5vvk',
      initialStripePriceId: 'price_1TlWIeKE2OW5fr4NDHoURaeG'
    },
    {
      id: 'family-5',
      titleKey: 'register.plan.family5.title',
      descriptionKey: 'register.plan.family5.description',
      patients: 5,
      monthlyPrice: 62,
      initialPrice: 215,
      monthlyStripePriceId: 'price_1TlWIrKE2OW5fr4Ns4OAz36U',
      initialStripePriceId: 'price_1TlWJ3KE2OW5fr4NCK15zWxe'
    }
  ];

  steps: RegisterStep[] = [
    { number: 1, key: 'register.steps.plan' },
    { number: 2, key: 'register.steps.account' },
    { number: 3, key: 'register.steps.personal' },
    { number: 4, key: 'register.steps.address' },
    { number: 5, key: 'register.steps.delivery' },
    { number: 6, key: 'register.steps.payment' },
    { number: 7, key: 'register.steps.done' },
  ];

  patients: PatientFormData[] = [];

  createEmptyPatient(): PatientFormData {
    return createEmptyRegistrationPatient();
  }

  continue() {
    if (this.currentStep === 3 && !this.canContinue) {
      this.showMedicalParametersError = true;
      return;
    }

    this.showMedicalParametersError = false;

    if (this.currentStep < this.steps.length) {
      this.currentStep++;
    }
  }

  get canContinue(): boolean {
    if (this.currentStep !== 3) {
      return true;
    }

    return this.patients.length === this.selectedPlan.patients &&
      this.patients.every(hasValidRegistrationPatient);
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
    this.router.navigate(['/caregiver/vital-signs']);
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

  get selectedMonthlyPrice(): string {
    return `$${this.selectedPlan.monthlyPrice}/mo`;
  }

  get selectedInitialPrice(): string {
    return `$${this.selectedPlan.initialPrice}`;
  }

  private syncPatientsWithPlan(): void {
    const nextPatients = [...this.patients];
    while (nextPatients.length < this.selectedPlan.patients) {
      nextPatients.push(this.createEmptyPatient());
    }
    this.patients = nextPatients.slice(0, this.selectedPlan.patients);
  }
}
