export type CaregiverPatientBloodType =
  | 'A+'
  | 'A-'
  | 'B+'
  | 'B-'
  | 'AB+'
  | 'AB-'
  | 'O+'
  | 'O-';

export type CaregiverPatientGender = 'Female' | 'Male';

export interface CaregiverPatientProfile {
  userId: string;
  initials: string;
  fullName: string;
  age: number;
  address: string;
  bloodType: CaregiverPatientBloodType;
  gender: CaregiverPatientGender;
  notes: string;
}

export interface CaregiverEmergencyContact {
  id: string;
  patientUserId: string;
  name: string;
  relation: string;
  phone: string;
}

export interface CaregiverProfileDashboard {
  caregiverUserId: string;
  caregiverEmail: string;
  patients: CaregiverPatientProfile[];
  emergencyContacts: CaregiverEmergencyContact[];
}

export type CaregiverEmergencyContactDraft = Omit<
  CaregiverEmergencyContact,
  'id' | 'patientUserId'
>;
