import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../api/api.config';

export interface EmergencyContactResponse {
  internalId?: string;
  name?: string;
  relationship?: string;
  phoneNumber?: string;
}

export interface UserProfileResponse {
  id: string;
  email: string;
  role: string;
  subscriptionType?: string;
  status?: string;
  subscriptionStartDate?: string;
  subscriptionEndDate?: string;
  dni?: string;
  fullName?: string;
  age?: number;
  address?: string;
  bloodType?: string;
  gender?: string;
  notes?: string;
  minHeartRate?: number;
  maxHeartRate?: number;
  minOxygenSaturation?: number;
  maxOxygenSaturation?: number;
  minTemperature?: number;
  maxTemperature?: number;
  managedByCaregiverId?: string;
  emergencyContacts?: EmergencyContactResponse[];
}

export interface UpdatePersonalInfoRequest {
  fullName: string;
  dni?: string;
  gender: string;
  age: number;
  bloodType: string;
  address: string;
  notes: string;
}

export interface EmergencyContactRequest {
  name: string;
  relationship: string;
  phoneNumber: string;
}

@Injectable({ providedIn: 'root' })
export class UserProfileApiService {
  constructor(
    private http: HttpClient,
    @Inject(API_BASE_URL) private apiBaseUrl: string
  ) {}

  getMyProfile(): Observable<UserProfileResponse> {
    return this.http.get<UserProfileResponse>(`${this.apiBaseUrl}/profiles/me`);
  }

  getMyPatients(): Observable<UserProfileResponse[]> {
    return this.http.get<UserProfileResponse[]>(`${this.apiBaseUrl}/profiles/me/patients`);
  }

  updatePersonalInfo(userId: string, request: UpdatePersonalInfoRequest): Observable<void> {
    return this.http.put<void>(`${this.apiBaseUrl}/profiles/${userId}/personal-info`, request);
  }

  addEmergencyContact(userId: string, request: EmergencyContactRequest): Observable<void> {
    return this.http.post<void>(`${this.apiBaseUrl}/profiles/${userId}/emergency-contacts`, request);
  }

  updateEmergencyContact(userId: string, contactId: string, request: EmergencyContactRequest): Observable<void> {
    return this.http.put<void>(`${this.apiBaseUrl}/profiles/${userId}/emergency-contacts/${contactId}`, request);
  }

  deleteEmergencyContact(userId: string, contactId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiBaseUrl}/profiles/${userId}/emergency-contacts/${contactId}`);
  }
}
