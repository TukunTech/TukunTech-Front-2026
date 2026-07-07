import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthApiService } from '../../../core/auth/auth-api.service';
import { PatientMedicalParametersStore } from '../../../core/patient-monitoring/patient-medical-parameters.store';
import { UserProfileApiService, UserProfileResponse } from '../../../core/profiles/user-profile-api.service';
import { HealthReportResponse, ReportApiService } from '../../../core/reports/report-api.service';

import {
  CaregiverHistoryDashboard,
  CaregiverHistoryQuery,
  CaregiverHistoryPatient,
  CaregiverHistoryPeriod,
  CaregiverVitalHistoryRecord
} from '../domain/caregiver-history';
import {
  CaregiverVitalAlertSettings,
  evaluateCaregiverPatientVitals
} from '../domain/caregiver-vital-signs';

@Injectable({
  providedIn: 'root'
})
export class CaregiverHistoryRepository {
  private patients: CaregiverHistoryPatient[] = [];

  private readonly alertSettings = new Map<string, CaregiverVitalAlertSettings>();
  private records: CaregiverVitalHistoryRecord[] = [];

  constructor(
    private authService: AuthApiService,
    private parametersStore: PatientMedicalParametersStore,
    private userProfileApi: UserProfileApiService,
    private reportApi: ReportApiService
  ) {}

  getDashboard(
    caregiverUserId: string,
    query: CaregiverHistoryQuery
  ): Observable<CaregiverHistoryDashboard> {
    return this.userProfileApi.getMyPatients().pipe(
      map(patients => {
        this.patients = patients.map(patient => this.mapPatient(patient));

        this.patients.forEach(patient => {
          if (!this.alertSettings.has(patient.userId)) {
            this.alertSettings.set(patient.userId, this.createDefaultAlertSettings(patient.userId));
          }
        });

        return {
          caregiverUserId: this.authService.getSession()?.userId || caregiverUserId,
          caregiverEmail: this.authService.getSession()?.email || '',
          patients: this.patients.map(patient => ({ ...patient })),
          records: this.filterRecords(this.records, query)
            .map(record => this.cloneRecord(record))
        };
      })
    );
  }

  getPatientHistory(
    caregiverUserId: string,
    patientUserId: string,
    query: CaregiverHistoryQuery
  ): Observable<CaregiverVitalHistoryRecord[]> {
    return this.reportApi.listPatientReports(patientUserId).pipe(
      map(reports => this.filterRecords(
        reports.map(report => this.mapReportToHistoryRecord(report, patientUserId)),
        query
      ).map(record => this.cloneRecord(record)))
    );
  }

  private createDefaultAlertSettings(patientUserId: string): CaregiverVitalAlertSettings {
    const parameters = this.parametersStore.getParameters(patientUserId);
    return {
      patientUserId,
      heartRate: {
        criticalLow: Math.max(1, parameters.heartRateMin - 10),
        noticeLow: parameters.heartRateMin,
        noticeHigh: parameters.heartRateMax,
        criticalHigh: parameters.heartRateMax + 20
      },
      oxygen: {
        noticeLow: parameters.oxygenSaturationMin,
        criticalLow: Math.max(1, parameters.oxygenSaturationMin - 5),
        noticeHigh: parameters.oxygenSaturationMax
      },
      temperature: {
        noticeLow: parameters.temperatureMin,
        criticalLow: parameters.temperatureMin - 1,
        noticeHigh: parameters.temperatureMax,
        criticalHigh: parameters.temperatureMax + 1
      }
    };
  }

  private filterRecords(
    records: CaregiverVitalHistoryRecord[],
    query: CaregiverHistoryQuery
  ): CaregiverVitalHistoryRecord[] {
    let filteredRecords = query.alertsOnly
      ? records.filter(record => record.alerts.length > 0)
      : [...records];

    if (query.period === 'custom') {
      const from = query.from ? new Date(`${query.from}T00:00:00`).getTime() : Number.MIN_SAFE_INTEGER;
      const to = query.to ? new Date(`${query.to}T23:59:59.999`).getTime() : Number.MAX_SAFE_INTEGER;
      filteredRecords = filteredRecords.filter(record => {
        const timestamp = new Date(record.recordedAt).getTime();
        return timestamp >= from && timestamp <= to;
      });
    }

    if (query.period === 'all' || query.period === 'custom') {
      return filteredRecords.sort((first, second) =>
        new Date(second.recordedAt).getTime() - new Date(first.recordedAt).getTime()
      );
    }

    const daysByPeriod: Record<Exclude<CaregiverHistoryPeriod, 'all' | 'custom'>, number> = {
      weekly: 7,
      biweekly: 15,
      monthly: 30
    };
    const latestRecord = filteredRecords
      .map(record => new Date(record.recordedAt).getTime())
      .sort((first, second) => second - first)[0];

    if (!latestRecord) {
      return [];
    }

    const minimumDate = latestRecord - (daysByPeriod[query.period] * 24 * 60 * 60 * 1000);

    return filteredRecords
      .filter(record => new Date(record.recordedAt).getTime() >= minimumDate)
      .sort((first, second) =>
        new Date(second.recordedAt).getTime() - new Date(first.recordedAt).getTime()
      );
  }

  private cloneRecord(record: CaregiverVitalHistoryRecord): CaregiverVitalHistoryRecord {
    return {
      ...record,
      vitals: { ...record.vitals },
      ranges: {
        heartRate: { ...record.ranges.heartRate },
        oxygen: { ...record.ranges.oxygen }
      },
      alerts: record.alerts.map(alert => ({ ...alert }))
    };
  }

  private mapPatient(profile: UserProfileResponse): CaregiverHistoryPatient {
    const fullName = profile.fullName || profile.email;
    return {
      userId: profile.id,
      fullName,
      initials: this.getInitials(fullName)
    };
  }

  private mapReportToHistoryRecord(
    report: HealthReportResponse,
    patientUserId: string
  ): CaregiverVitalHistoryRecord {
    const settings = this.alertSettings.get(patientUserId) || this.createDefaultAlertSettings(patientUserId);
    const heartRate = report.avgHeartRate || 0;
    const oxygen = report.avgSpO2 || 0;
    const temperature = report.avgTemperature || 0;
    const recordedAt = report.generatedAt || report.endDate;
    const vitals = {
      patientUserId,
      measuredAt: recordedAt,
      heartRate,
      oxygen,
      temperature
    };

    return {
      id: report.reportId,
      patientUserId,
      recordedAt,
      source: 'hourly',
      vitals,
      ranges: {
        heartRate: {
          min: report.minHeartRate || heartRate,
          max: report.maxHeartRate || heartRate
        },
        oxygen: {
          min: oxygen,
          max: oxygen
        }
      },
      alerts: heartRate || oxygen || temperature
        ? evaluateCaregiverPatientVitals(vitals, settings)
        : []
    };
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
