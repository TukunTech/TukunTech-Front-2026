export interface PatientMedicalParameters {
  heartRateMin: number | null;
  heartRateMax: number | null;
  oxygenSaturationMin: number | null;
  oxygenSaturationMax: number | null;
  temperatureMin: number | null;
  temperatureMax: number | null;
}

export interface RegistrationPatient {
  email: string;
  password: string;
  confirmPassword: string;
  dni: string;
  fullName: string;
  age: string;
  gender: string;
  bloodType: string;
  additionalNotes: string;
  medicalParameters: PatientMedicalParameters;
}

export function createEmptyRegistrationPatient(): RegistrationPatient {
  return {
    email: '',
    password: '',
    confirmPassword: '',
    dni: '',
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

export function hasValidPatientAccount(patient: RegistrationPatient): boolean {
  return /^\S+@\S+\.\S+$/.test(patient.email.trim()) &&
    patient.password.length >= 6 &&
    patient.password === patient.confirmPassword &&
    /^\d{8}$/.test(patient.dni.trim());
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

export function hasValidRegistrationPatient(patient: RegistrationPatient): boolean {
  return !!patient.fullName.trim() &&
    !!patient.age &&
    !!patient.gender &&
    !!patient.bloodType &&
    hasValidPatientAccount(patient) &&
    hasValidMedicalParameters(patient);
}
