import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

import {
  CreateEmergencyContactPayload,
  EmergencyContact,
  PatientProfile,
  PatientProfilePageData,
  PatientSubscription
} from '../domain/patient-profile';

@Injectable({
  providedIn: 'root'
})
export class PatientProfileRepository {
  private profile: PatientProfile = {
    userId: 'patient-demo-user',
    email: 'demo.patient@tukuntech.app',
    initials: 'EM',
    fullName: 'Eleanor Marsh',
    age: 68,
    address: 'Av. siempre viva 235',
    bloodType: 'A+',
    gender: 'Female',
    notes: 'no notes'
  };

  private subscription: PatientSubscription = {
    id: 'subscription-demo-1',
    name: 'TukunTech Premium',
    renewsOn: 'June 9, 2026',
    priceLabel: '$19.99',
    status: 'active',
    planLabel: 'Premium - monthly'
  };

  private emergencyContacts: EmergencyContact[] = [
    {
      id: 'contact-demo-1',
      patientUserId: 'patient-demo-user',
      name: 'Sarah Marsh',
      relation: 'Daughter',
      phone: '(503) 555-0184'
    },
    {
      id: 'contact-demo-2',
      patientUserId: 'patient-demo-user',
      name: 'Dr. Patel',
      relation: 'Family doctor',
      phone: '(503) 555-0102'
    }
  ];

  getProfilePageData(userId: string): Observable<PatientProfilePageData> {
    return of({
      profile: { ...this.profile, userId },
      subscription: { ...this.subscription },
      emergencyContacts: this.getContactsByUser(userId)
    });
  }

  updateProfile(userId: string, profile: PatientProfile): Observable<PatientProfile> {
    this.profile = {
      ...profile,
      userId
    };

    return of({ ...this.profile });
  }

  createEmergencyContact(
    patientUserId: string,
    payload: CreateEmergencyContactPayload
  ): Observable<EmergencyContact> {
    const contact: EmergencyContact = {
      ...payload,
      id: `contact-${Date.now()}`,
      patientUserId
    };

    this.emergencyContacts = [...this.emergencyContacts, contact];

    return of({ ...contact });
  }

  deleteEmergencyContact(patientUserId: string, contactId: string): Observable<void> {
    this.emergencyContacts = this.emergencyContacts.filter(contact =>
      contact.patientUserId !== patientUserId || contact.id !== contactId
    );

    return of(void 0);
  }

  private getContactsByUser(userId: string): EmergencyContact[] {
    return this.emergencyContacts
      .filter(contact => contact.patientUserId === userId)
      .map(contact => ({ ...contact }));
  }
}
