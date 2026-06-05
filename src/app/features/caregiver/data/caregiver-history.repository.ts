import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

import {
  CaregiverHistoryDashboard,
  CaregiverHistoryPatient,
  CaregiverHistoryPeriod,
  CaregiverHistorySeedRecord,
  CaregiverVitalHistoryRecord,
  createCaregiverHistoryRecord
} from '../domain/caregiver-history';
import {
  CaregiverVitalAlertSettings,
  evaluateCaregiverPatientVitals
} from '../domain/caregiver-vital-signs';

@Injectable({
  providedIn: 'root'
})
export class CaregiverHistoryRepository {
  private patients: CaregiverHistoryPatient[] = [
    { userId: 'patient-eleanor', fullName: 'Eleanor Marsh', initials: 'EM' },
    { userId: 'patient-charls', fullName: 'Charls March', initials: 'CM' },
    { userId: 'patient-miguel', fullName: 'Miguel Montana', initials: 'MM' },
    { userId: 'patient-marian', fullName: 'Marian Medilla', initials: 'MM' },
    { userId: 'patient-robert', fullName: 'Robert Silva', initials: 'RS' }
  ];

  private readonly alertSettings = new Map<string, CaregiverVitalAlertSettings>(
    this.patients.map(patient => [
      patient.userId,
      this.createDefaultAlertSettings(patient.userId)
    ])
  );

  private records: CaregiverVitalHistoryRecord[] = this.createSeedRecords()
    .map(seed => createCaregiverHistoryRecord(
      seed,
      this.getAlertSettings(seed.patientUserId),
      evaluateCaregiverPatientVitals
    ));

  getDashboard(
    caregiverUserId: string,
    period: CaregiverHistoryPeriod
  ): Observable<CaregiverHistoryDashboard> {
    return of({
      caregiverUserId,
      caregiverEmail: 'demo.caregiver@tukuntech.app',
      patients: this.patients.map(patient => ({ ...patient })),
      records: this.filterRecordsByPeriod(this.records, period)
        .map(record => this.cloneRecord(record))
    });
  }

  getPatientHistory(
    caregiverUserId: string,
    patientUserId: string,
    period: CaregiverHistoryPeriod
  ): Observable<CaregiverVitalHistoryRecord[]> {
    const records = this.records
      .filter(record => record.patientUserId === patientUserId);

    return of(this.filterRecordsByPeriod(records, period)
      .map(record => this.cloneRecord(record)));
  }

  private createDefaultAlertSettings(patientUserId: string): CaregiverVitalAlertSettings {
    return {
      patientUserId,
      heartRate: {
        criticalLow: 50,
        noticeLow: 60,
        noticeHigh: 100,
        criticalHigh: 120
      },
      oxygen: {
        noticeLow: 95,
        criticalLow: 90
      },
      temperature: {
        noticeHigh: 38,
        criticalHigh: 39
      }
    };
  }

  private getAlertSettings(patientUserId: string): CaregiverVitalAlertSettings {
    return this.alertSettings.get(patientUserId)
      || this.createDefaultAlertSettings(patientUserId);
  }

  private filterRecordsByPeriod(
    records: CaregiverVitalHistoryRecord[],
    period: CaregiverHistoryPeriod
  ): CaregiverVitalHistoryRecord[] {
    const daysByPeriod: Record<CaregiverHistoryPeriod, number> = {
      weekly: 7,
      biweekly: 15,
      monthly: 30
    };
    const latestRecord = records
      .map(record => new Date(record.recordedAt).getTime())
      .sort((first, second) => second - first)[0];

    if (!latestRecord) {
      return [];
    }

    const minimumDate = latestRecord - (daysByPeriod[period] * 24 * 60 * 60 * 1000);

    return records
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

  private createSeedRecords(): CaregiverHistorySeedRecord[] {
    return [
      this.record('history-eleanor-001', 'patient-eleanor', '2026-06-04T09:00:00.000Z', 'hourly', 74, 60, 98, 98, 95, 99, 36.7),
      this.record('history-eleanor-002', 'patient-eleanor', '2026-06-03T09:00:00.000Z', 'noticeAlert', 58, 54, 88, 97, 95, 99, 36.9),
      this.record('history-eleanor-003', 'patient-eleanor', '2026-05-30T09:00:00.000Z', 'hourly', 72, 60, 96, 98, 95, 99, 36.6),
      this.record('history-eleanor-004', 'patient-eleanor', '2026-05-20T09:00:00.000Z', 'criticalAlert', 125, 84, 126, 88, 86, 94, 39.2),

      this.record('history-charls-001', 'patient-charls', '2026-06-04T09:00:00.000Z', 'noticeAlert', 99, 74, 102, 97, 95, 99, 38.1),
      this.record('history-charls-002', 'patient-charls', '2026-06-02T09:00:00.000Z', 'hourly', 82, 68, 94, 98, 96, 99, 36.8),
      this.record('history-charls-003', 'patient-charls', '2026-05-27T09:00:00.000Z', 'criticalAlert', 126, 92, 128, 89, 87, 94, 38.6),
      this.record('history-charls-004', 'patient-charls', '2026-05-12T09:00:00.000Z', 'hourly', 78, 64, 92, 98, 96, 99, 36.7),

      this.record('history-miguel-001', 'patient-miguel', '2026-06-04T09:00:00.000Z', 'noticeAlert', 92, 70, 100, 94, 91, 97, 37.2),
      this.record('history-miguel-002', 'patient-miguel', '2026-06-01T09:00:00.000Z', 'criticalAlert', 122, 82, 125, 88, 86, 92, 36.9),
      this.record('history-miguel-003', 'patient-miguel', '2026-05-25T09:00:00.000Z', 'hourly', 76, 61, 91, 97, 95, 99, 36.6),
      this.record('history-miguel-004', 'patient-miguel', '2026-05-11T09:00:00.000Z', 'hourly', 73, 60, 88, 98, 95, 99, 36.7),

      this.record('history-marian-001', 'patient-marian', '2026-06-04T09:00:00.000Z', 'hourly', 76, 62, 90, 97, 95, 99, 36.8),
      this.record('history-marian-002', 'patient-marian', '2026-06-03T09:00:00.000Z', 'noticeAlert', 70, 60, 88, 98, 95, 99, 38.7),
      this.record('history-marian-003', 'patient-marian', '2026-05-29T09:00:00.000Z', 'hourly', 74, 61, 92, 98, 96, 99, 36.6),
      this.record('history-marian-004', 'patient-marian', '2026-05-18T09:00:00.000Z', 'criticalAlert', 110, 76, 122, 86, 84, 92, 39.3),

      this.record('history-robert-001', 'patient-robert', '2026-06-04T09:00:00.000Z', 'criticalAlert', 0, 0, 0, 0, 0, 0, 0),
      this.record('history-robert-002', 'patient-robert', '2026-06-02T09:00:00.000Z', 'hourly', 78, 62, 92, 97, 95, 99, 36.7),
      this.record('history-robert-003', 'patient-robert', '2026-05-26T09:00:00.000Z', 'noticeAlert', 54, 50, 88, 96, 94, 98, 36.6),
      this.record('history-robert-004', 'patient-robert', '2026-05-10T09:00:00.000Z', 'hourly', 72, 60, 90, 98, 95, 99, 36.8)
    ];
  }

  private record(
    id: string,
    patientUserId: string,
    recordedAt: string,
    source: CaregiverHistorySeedRecord['source'],
    heartRate: number,
    heartRateMin: number,
    heartRateMax: number,
    oxygen: number,
    oxygenMin: number,
    oxygenMax: number,
    temperature: number
  ): CaregiverHistorySeedRecord {
    return {
      id,
      patientUserId,
      recordedAt,
      source,
      heartRate,
      heartRateMin,
      heartRateMax,
      oxygen,
      oxygenMin,
      oxygenMax,
      temperature
    };
  }
}
