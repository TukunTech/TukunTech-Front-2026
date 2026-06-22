export interface PatientMedicalParameters {
  heartRateMin: number | null;
  heartRateMax: number | null;
  oxygenSaturationMin: number | null;
  oxygenSaturationMax: number | null;
  temperatureMin: number | null;
  temperatureMax: number | null;
}

export interface RegistrationPatient {
  fullName: string;
  age: string;
  gender: string;
  bloodType: string;
  additionalNotes: string;
  medicalParameters: PatientMedicalParameters;
}

export function createEmptyRegistrationPatient(): RegistrationPatient {
  return {
    fullName: '',
    age: '',
    gender: '',
    bloodType: '',
    additionalNotes: '',
    medicalParameters: {
      heartRateMin: null,
      heartRateMax: null,
      oxygenSaturationMin: null,
      oxygenSaturationMax: null,
      temperatureMin: null,
      temperatureMax: null
    }
  };
}

export function hasValidMedicalParameters(patient: RegistrationPatient): boolean {
  const parameters = patient.medicalParameters;
  const values = Object.values(parameters);

  return values.every(value => value !== null && Number.isFinite(value)) &&
    parameters.heartRateMin! > 0 &&
    parameters.heartRateMax! > parameters.heartRateMin! &&
    parameters.oxygenSaturationMin! > 0 &&
    parameters.oxygenSaturationMax! <= 100 &&
    parameters.oxygenSaturationMax! > parameters.oxygenSaturationMin! &&
    parameters.temperatureMin! >= 30 &&
    parameters.temperatureMax! <= 45 &&
    parameters.temperatureMax! > parameters.temperatureMin!;
}
