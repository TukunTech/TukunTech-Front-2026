import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

import {
  CaregiverEmergencyContact,
  CaregiverEmergencyContactDraft,
  CaregiverPatientProfile,
  CaregiverProfileDashboard
} from '../domain/caregiver-profile';

@Injectable({
  providedIn: 'root'
})
export class CaregiverProfileRepository {
  private profiles: CaregiverPatientProfile[] = [
    {
      userId: 'patient-eleanor',
      initials: 'EM',
      fullName: 'Eleanor Marsh',
      age: 82,
      address: 'Av. Siempre Viva 235',
      bloodType: 'A+',
      gender: 'Female',
      notes: 'Prefers morning check-ins'
    },
    {
      userId: 'patient-charls',
      initials: 'CM',
      fullName: 'Charls March',
      age: 72,
      address: '742 Cedar Avenue',
      bloodType: 'O+',
      gender: 'Male',
      notes: 'Hypertension follow-up'
    },
    {
      userId: 'patient-miguel',
      initials: 'MM',
      fullName: 'Miguel Montana',
      age: 78,
      address: '1189 North Lake Street',
      bloodType: 'B+',
      gender: 'Male',
      notes: 'Uses oxygen during sleep'
    },
    {
      userId: 'patient-marian',
      initials: 'MM',
      fullName: 'Marian Medilla',
      age: 88,
      address: '91 Garden Road',
      bloodType: 'AB+',
      gender: 'Female',
      notes: 'Temperature alerts configured by admin'
    },
    {
      userId: 'patient-robert',
      initials: 'RS',
      fullName: 'Robert Silva',
      age: 69,
      address: '505 Harbor Lane',
      bloodType: 'O-',
      gender: 'Male',
      notes: 'Device reconnection required'
    }
  ];

  private emergencyContacts: CaregiverEmergencyContact[] = [
    {
      id: 'contact-eleanor-001',
      patientUserId: 'patient-eleanor',
      name: 'Sara Marsh',
      relation: 'Daughter',
      phone: '940999345'
    },
    {
      id: 'contact-eleanor-002',
      patientUserId: 'patient-eleanor',
      name: 'Daniel Marsh',
      relation: 'Son',
      phone: '940883211'
    },
    {
      id: 'contact-charls-001',
      patientUserId: 'patient-charls',
      name: 'Andrea March',
      relation: 'Wife',
      phone: '941222333'
    },
    {
      id: 'contact-miguel-001',
      patientUserId: 'patient-miguel',
      name: 'Laura Montana',
      relation: 'Daughter',
      phone: '944555777'
    },
    {
      id: 'contact-marian-001',
      patientUserId: 'patient-marian',
      name: 'Peter Medilla',
      relation: 'Son',
      phone: '933112244'
    },
    {
      id: 'contact-robert-001',
      patientUserId: 'patient-robert',
      name: 'Mia Silva',
      relation: 'Sister',
      phone: '955001122'
    }
  ];

  getDashboard(caregiverUserId: string): Observable<CaregiverProfileDashboard> {
    return of({
      caregiverUserId,
      caregiverEmail: 'demo.caregiver@tukuntech.app',
      patients: this.profiles.map(profile => ({ ...profile })),
      emergencyContacts: this.emergencyContacts.map(contact => ({ ...contact }))
    });
  }

  getPatientProfile(
    caregiverUserId: string,
    patientUserId: string
  ): Observable<CaregiverPatientProfile | undefined> {
    const profile = this.profiles.find(item => item.userId === patientUserId);

    return of(profile ? { ...profile } : undefined);
  }

  updatePatientProfile(
    caregiverUserId: string,
    profile: CaregiverPatientProfile
  ): Observable<CaregiverPatientProfile> {
    this.profiles = this.profiles.map(item =>
      item.userId === profile.userId
        ? { ...profile }
        : item
    );

    return of({ ...profile });
  }

  createEmergencyContact(
    caregiverUserId: string,
    patientUserId: string,
    contact: CaregiverEmergencyContactDraft
  ): Observable<CaregiverEmergencyContact> {
    const createdContact: CaregiverEmergencyContact = {
      id: `caregiver-contact-${Date.now()}`,
      patientUserId,
      ...contact
    };

    this.emergencyContacts = [...this.emergencyContacts, createdContact];

    return of({ ...createdContact });
  }

  deleteEmergencyContact(
    caregiverUserId: string,
    patientUserId: string,
    contactId: string
  ): Observable<void> {
    this.emergencyContacts = this.emergencyContacts.filter(contact =>
      contact.patientUserId !== patientUserId || contact.id !== contactId
    );

    return of(undefined);
  }
}
