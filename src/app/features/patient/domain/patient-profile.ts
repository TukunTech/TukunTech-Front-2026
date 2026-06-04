export type PatientBloodType = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

export type PatientGender = 'Female' | 'Male';

export type PatientSubscriptionStatus = 'active' | 'inactive';

export interface PatientProfile {
  userId: string;
  email: string;
  initials: string;
  fullName: string;
  age: number;
  address: string;
  bloodType: PatientBloodType;
  gender: PatientGender;
  notes: string;
}

export interface PatientSubscription {
  id: string;
  name: string;
  renewsOn: string;
  priceLabel: string;
  status: PatientSubscriptionStatus;
  planLabel: string;
}

export interface EmergencyContact {
  id: string;
  patientUserId: string;
  name: string;
  relation: string;
  phone: string;
}

export interface CreateEmergencyContactPayload {
  name: string;
  relation: string;
  phone: string;
}

export interface PatientProfilePageData {
  profile: PatientProfile;
  subscription: PatientSubscription;
  emergencyContacts: EmergencyContact[];
}
