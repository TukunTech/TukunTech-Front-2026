import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthApiService } from '../../../core/auth/auth-api.service';
import { UserProfileApiService, UserProfileResponse } from '../../../core/profiles/user-profile-api.service';

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
  constructor(
    private authService: AuthApiService,
    private userProfileApi: UserProfileApiService
  ) {}

  private profiles: CaregiverPatientProfile[] = [];

  private emergencyContacts: CaregiverEmergencyContact[] = [];

  getDashboard(caregiverUserId: string): Observable<CaregiverProfileDashboard> {
    return this.userProfileApi.getMyPatients().pipe(
      map(patients => {
        this.profiles = patients.map(patient => this.mapProfile(patient));
        this.emergencyContacts = patients.flatMap(patient => this.mapEmergencyContacts(patient));

        return {
          caregiverUserId: this.authService.getSession()?.userId || caregiverUserId,
          caregiverEmail: this.authService.getSession()?.email || '',
          patients: this.profiles.map(profile => ({ ...profile })),
          emergencyContacts: this.emergencyContacts.map(contact => ({ ...contact }))
        };
      })
    );
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

  private mapProfile(profile: UserProfileResponse): CaregiverPatientProfile {
    return {
      userId: profile.id,
      initials: this.getInitials(profile.fullName || profile.email),
      fullName: profile.fullName || profile.email,
      age: this.toOptionalNumber(profile.age),
      address: profile.address || '',
      bloodType: this.mapBloodType(profile.bloodType),
      gender: this.mapGender(profile.gender),
      notes: profile.notes || ''
    };
  }

  private mapEmergencyContacts(profile: UserProfileResponse): CaregiverEmergencyContact[] {
    return (profile.emergencyContacts || []).map((contact, index) => ({
      id: contact.internalId || `contact-${profile.id}-${index}`,
      patientUserId: profile.id,
      name: contact.name || '',
      relation: contact.relationship || '',
      phone: contact.phoneNumber || ''
    }));
  }

  private toOptionalNumber(value: unknown): number | null {
    const numberValue = Number(value);
    return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : null;
  }

  private mapBloodType(value?: string): CaregiverPatientProfile['bloodType'] {
    const bloodTypes: Record<string, CaregiverPatientProfile['bloodType']> = {
      A_POSITIVE: 'A+',
      A_NEGATIVE: 'A-',
      B_POSITIVE: 'B+',
      B_NEGATIVE: 'B-',
      AB_POSITIVE: 'AB+',
      AB_NEGATIVE: 'AB-',
      O_POSITIVE: 'O+',
      O_NEGATIVE: 'O-'
    };

    return bloodTypes[value || ''] || 'A+';
  }

  private mapGender(value?: string): CaregiverPatientProfile['gender'] {
    const genders: Record<string, CaregiverPatientProfile['gender']> = {
      FEMALE: 'Female',
      MALE: 'Male',
      OTHER: 'Other',
      PREFER_NOT_TO_SAY: 'Prefer not to say'
    };

    return genders[value || ''] || 'Prefer not to say';
  }

  private getInitials(name: string): string {
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part[0]?.toUpperCase())
      .join('');
  }
}
