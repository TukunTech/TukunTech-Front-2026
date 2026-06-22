import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { SubscriptionAccessStore } from '../../../core/subscription/subscription-access.store';

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
  constructor(private subscriptionStore: SubscriptionAccessStore) {}
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
    renewsOn: '2026-06-23',
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
    const access = this.subscriptionStore.getRoleAccess('patient');
    return of({
      profile: { ...this.profile, userId },
      subscription: {
        ...this.subscription,
        renewsOn: access.renewsOn,
        status: access.canAccess ? 'active' : 'inactive'
      },
      emergencyContacts: this.getContactsByUser(userId)
    });
  }

  renewSubscription(): Observable<PatientSubscription> {
    const access = this.subscriptionStore.renew(this.profile.email, 'patient');
    this.subscription = { ...this.subscription, renewsOn: access.renewsOn, status: 'active' };
    return of({ ...this.subscription });
  }

  cancelSubscription(): Observable<PatientSubscription> {
    this.subscriptionStore.cancel(this.profile.email, 'patient');
    this.subscription = { ...this.subscription, status: 'inactive' };
    return of({ ...this.subscription });
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
