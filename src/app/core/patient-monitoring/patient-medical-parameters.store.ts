import { Injectable } from '@angular/core';

export interface PatientMedicalParameters {
  patientUserId: string;
  heartRateMin: number;
  heartRateMax: number;
  oxygenSaturationMin: number;
  oxygenSaturationMax: number;
  temperatureMin: number;
  temperatureMax: number;
}

@Injectable({ providedIn: 'root' })
export class PatientMedicalParametersStore {
  private parameters = new Map<string, PatientMedicalParameters>([
    ['patient-demo-user', this.createParameters('patient-demo-user', 70, 100, 95, 100, 36.1, 37.2)],
    ['patient-eleanor', this.createParameters('patient-eleanor', 70, 100, 95, 100, 36.1, 37.2)],
    ['patient-charls', this.createParameters('patient-charls', 65, 105, 94, 100, 36.0, 37.4)],
    ['patient-miguel', this.createParameters('patient-miguel', 68, 108, 93, 100, 36.0, 37.6)],
    ['patient-marian', this.createParameters('patient-marian', 72, 98, 96, 100, 36.2, 37.2)],
    ['patient-robert', this.createParameters('patient-robert', 65, 100, 95, 100, 36.1, 37.3)]
  ]);

  getParameters(patientUserId: string): PatientMedicalParameters {
    return {
      ...(this.parameters.get(patientUserId) ??
        this.createParameters(patientUserId, 60, 100, 95, 100, 36.1, 38))
    };
  }

  updateParameters(parameters: PatientMedicalParameters): PatientMedicalParameters {
    const nextParameters = { ...parameters };
    this.parameters.set(parameters.patientUserId, nextParameters);
    return { ...nextParameters };
  }

  private createParameters(
    patientUserId: string,
    heartRateMin: number,
    heartRateMax: number,
    oxygenSaturationMin: number,
    oxygenSaturationMax: number,
    temperatureMin: number,
    temperatureMax: number
  ): PatientMedicalParameters {
    return {
      patientUserId,
      heartRateMin,
      heartRateMax,
      oxygenSaturationMin,
      oxygenSaturationMax,
      temperatureMin,
      temperatureMax
    };
  }
}
