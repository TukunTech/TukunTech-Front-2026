import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AuthApiService } from '../../../core/auth/auth-api.service';
import { SubscriptionAccessStore } from '../../../core/subscription/subscription-access.store';
import { UserProfileApiService, UserProfileResponse } from '../../../core/profiles/user-profile-api.service';

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
  constructor(
    private authService: AuthApiService,
    private subscriptionStore: SubscriptionAccessStore,
    private userProfileApi: UserProfileApiService
  ) {}
  private profile: PatientProfile = {
    userId: '',
    email: '',
    initials: '',
    fullName: '',
    age: null,
    address: '',
    bloodType: 'A+',
    gender: 'Prefer not to say',
    notes: ''
  };

  private subscription: PatientSubscription = {
    id: '',
    name: '',
    renewsOn: '',
    priceLabel: '',
    status: 'inactive',
    planLabel: ''
  };

  private emergencyContacts: EmergencyContact[] = [];

  getProfilePageData(userId: string): Observable<PatientProfilePageData> {
    return this.userProfileApi.getMyProfile().pipe(
      map(profile => {
        this.profile = this.mapProfile(profile);
        return {
          profile: { ...this.profile },
          subscription: this.mapSubscription(profile),
          emergencyContacts: this.mapEmergencyContacts(profile)
        };
      }),
      catchError(() => of(this.createFallbackPageData(userId)))
    );
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
    return this.userProfileApi.updatePersonalInfo(userId, {
      fullName: profile.fullName,
      gender: this.toApiGender(profile.gender),
      age: profile.age ?? 0,
      bloodType: this.toApiBloodType(profile.bloodType),
      address: profile.address,
      notes: profile.notes
    }).pipe(
      map(() => {
        this.profile = { ...profile, userId };
        return { ...this.profile };
      })
    );
  }

  createEmergencyContact(
    patientUserId: string,
    payload: CreateEmergencyContactPayload
  ): Observable<EmergencyContact> {
    return this.userProfileApi.addEmergencyContact(patientUserId, {
      name: payload.name,
      relationship: payload.relation,
      phoneNumber: payload.phone
    }).pipe(
      map(() => ({
        ...payload,
        id: `contact-${Date.now()}`,
        patientUserId
      }))
    );
  }

  deleteEmergencyContact(patientUserId: string, contactId: string): Observable<void> {
    return this.userProfileApi.deleteEmergencyContact(patientUserId, contactId);
  }

  private mapProfile(profile: UserProfileResponse): PatientProfile {
    return {
      userId: profile.id,
      email: profile.email,
      initials: this.getInitials(profile.fullName || profile.email),
      fullName: profile.fullName || profile.email,
      age: this.toOptionalNumber(profile.age),
      address: profile.address || '',
      bloodType: this.mapBloodType(profile.bloodType),
      gender: this.mapGender(profile.gender),
      notes: profile.notes || ''
    };
  }

  private createFallbackPageData(userId: string): PatientProfilePageData {
    const session = this.authService.getSession();
    const email = session?.email || this.profile.email || '';
    const fallbackProfile: PatientProfile = {
      userId: session?.userId || userId || this.profile.userId || '',
      email,
      initials: this.getInitials(email),
      fullName: email,
      age: null,
      address: '',
      bloodType: 'A+',
      gender: 'Prefer not to say',
      notes: ''
    };

    this.profile = fallbackProfile;

    return {
      profile: { ...fallbackProfile },
      subscription: {
        id: fallbackProfile.userId,
        name: '',
        renewsOn: '',
        priceLabel: '',
        status: 'inactive',
        planLabel: ''
      },
      emergencyContacts: []
    };
  }

  private mapSubscription(profile: UserProfileResponse): PatientSubscription {
    const isActive = profile.status === 'ACTIVE';
    return {
      id: profile.id,
      name: profile.subscriptionType || 'TukunTech',
      renewsOn: profile.subscriptionEndDate || '',
      priceLabel: '',
      status: isActive ? 'active' : 'inactive',
      planLabel: profile.subscriptionType || ''
    };
  }

  private mapEmergencyContacts(profile: UserProfileResponse): EmergencyContact[] {
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

  private mapBloodType(value?: string): PatientProfile['bloodType'] {
    const bloodTypes: Record<string, PatientProfile['bloodType']> = {
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

  private mapGender(value?: string): PatientProfile['gender'] {
    const genders: Record<string, PatientProfile['gender']> = {
      FEMALE: 'Female',
      MALE: 'Male',
      OTHER: 'Other',
      PREFER_NOT_TO_SAY: 'Prefer not to say'
    };

    return genders[value || ''] || 'Prefer not to say';
  }

  private toApiBloodType(value: PatientProfile['bloodType']): string {
    const bloodTypes: Record<PatientProfile['bloodType'], string> = {
      'A+': 'A_POSITIVE',
      'A-': 'A_NEGATIVE',
      'B+': 'B_POSITIVE',
      'B-': 'B_NEGATIVE',
      'AB+': 'AB_POSITIVE',
      'AB-': 'AB_NEGATIVE',
      'O+': 'O_POSITIVE',
      'O-': 'O_NEGATIVE'
    };

    return bloodTypes[value];
  }

  private toApiGender(value: PatientProfile['gender']): string {
    const genders: Record<PatientProfile['gender'], string> = {
      Female: 'FEMALE',
      Male: 'MALE',
      Other: 'OTHER',
      'Prefer not to say': 'PREFER_NOT_TO_SAY'
    };

    return genders[value];
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
