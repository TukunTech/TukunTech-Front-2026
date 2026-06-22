import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { CustomSelect, CustomSelectOption } from '../../../../shared/components/custom-select/custom-select';
import {
  createEmptyRegistrationPatient,
  RegistrationPatient
} from '../../domain/registration-patient';

export type PatientFormData = RegistrationPatient;

@Component({
  selector: 'app-patient-form',
  imports: [
    FormsModule,
    TranslatePipe,
    CustomSelect
  ],
  templateUrl: './patient-form.html',
  styleUrl: './patient-form.css',
})
export class PatientForm {
  @Input() patient: PatientFormData = createEmptyRegistrationPatient();

  @Output() patientChange = new EventEmitter<PatientFormData>();

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

  emitChange() {
    this.patientChange.emit(this.patient);
  }
}
