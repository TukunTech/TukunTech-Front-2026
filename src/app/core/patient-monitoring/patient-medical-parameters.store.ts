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
  private parameters = new Map<string, PatientMedicalParameters>();

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
