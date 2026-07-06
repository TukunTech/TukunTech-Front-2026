import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, timeout } from 'rxjs/operators';

import { API_BASE_URL } from '../../../core/api/api.config';
import { RegistrationPatient } from '../domain/registration-patient';

export interface OnboardingRequest {
  caregiverEmail: string;
  caregiverPassword: string;
  plan: 'INDIVIDUAL' | 'FAMILY';
  patients: OnboardingPatientRequest[];
}

export interface OnboardingPatientRequest {
  email: string;
  password: string;
  dni: string;
  fullName: string;
  age: number;
  address: string;
  bloodType: string;
  gender: string;
  notes: string;
  minHeartRate: number;
  maxHeartRate: number;
  minOxygenSaturation: number;
  maxOxygenSaturation: number;
  minTemperature: number;
  maxTemperature: number;
  termsAccepted: boolean;
  emergencyContacts: Array<{
    name: string;
    relationship: string;
    phoneNumber: string;
  }>;
}

@Injectable({ providedIn: 'root' })
export class OnboardingApiService {
  constructor(
    private http: HttpClient,
    @Inject(API_BASE_URL) private apiBaseUrl: string
  ) {}

  createCheckout(request: OnboardingRequest): Observable<string> {
    return this.http.post(`${this.apiBaseUrl}/profiles/onboarding`, request, {
      responseType: 'text'
    }).pipe(
      timeout(30000),
      map(response => this.extractCheckoutUrl(response))
    );
  }

  buildRequest(
    caregiverEmail: string,
    caregiverPassword: string,
    planId: string,
    termsAccepted: boolean,
    patients: RegistrationPatient[]
  ): OnboardingRequest {
    return {
      caregiverEmail: caregiverEmail.trim(),
      caregiverPassword,
      plan: planId === 'individual' ? 'INDIVIDUAL' : 'FAMILY',
      patients: patients.map(patient => this.mapPatient(patient, termsAccepted))
    };
  }

  private mapPatient(patient: RegistrationPatient, termsAccepted: boolean): OnboardingPatientRequest {
    return {
      email: patient.email.trim(),
      password: patient.password,
      dni: patient.dni.trim(),
      fullName: patient.fullName.trim(),
      age: Number(patient.age),
      address: patient.address.displayName || patient.address.street,
      bloodType: this.mapBloodType(patient.bloodType),
      gender: this.mapGender(patient.gender),
      notes: patient.additionalNotes.trim(),
      minHeartRate: Number(patient.medicalParameters.heartRateMin),
      maxHeartRate: Number(patient.medicalParameters.heartRateMax),
      minOxygenSaturation: Number(patient.medicalParameters.oxygenSaturationMin),
      maxOxygenSaturation: Number(patient.medicalParameters.oxygenSaturationMax),
      minTemperature: Number(patient.medicalParameters.temperatureMin),
      maxTemperature: Number(patient.medicalParameters.temperatureMax),
      termsAccepted,
      emergencyContacts: []
    };
  }

  private mapGender(gender: string): string {
    const genders: Record<string, string> = {
      female: 'FEMALE',
      male: 'MALE',
      other: 'OTHER'
    };

    return genders[gender] ?? 'PREFER_NOT_TO_SAY';
  }

  private mapBloodType(bloodType: string): string {
    const bloodTypes: Record<string, string> = {
      'A+': 'A_POSITIVE',
      'A-': 'A_NEGATIVE',
      'B+': 'B_POSITIVE',
      'B-': 'B_NEGATIVE',
      'AB+': 'AB_POSITIVE',
      'AB-': 'AB_NEGATIVE',
      'O+': 'O_POSITIVE',
      'O-': 'O_NEGATIVE'
    };

    return bloodTypes[bloodType] ?? 'UNKNOWN';
  }

  private extractCheckoutUrl(response: string): string {
    const cleanResponse = response.trim();
    if (cleanResponse.startsWith('http')) return cleanResponse;

    try {
      const parsed = JSON.parse(cleanResponse) as Record<string, unknown>;
      const checkoutUrl = parsed['url'] || parsed['checkoutUrl'] || parsed['sessionUrl'] || parsed['paymentUrl'];
      return typeof checkoutUrl === 'string' ? checkoutUrl.trim() : cleanResponse;
    } catch {
      return cleanResponse;
    }
  }
}
