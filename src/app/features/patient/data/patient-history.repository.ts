import { Injectable } from '@angular/core';
import { map, Observable, of } from 'rxjs';

import {
  evaluatePatientVitals,
  PatientVitalAlert,
  PatientVitals
} from '../domain/patient-vitals';
import { PatientVitalsRepository } from './patient-vitals.repository';
import {
  PatientHistoryPeriod,
  PatientHistoryRecordSource,
  PatientVitalHistoryRecord
} from '../domain/patient-history';

@Injectable({
  providedIn: 'root'
})
export class PatientHistoryRepository {
  private records: PatientVitalHistoryRecord[] = [];

  constructor(private patientVitalsRepository: PatientVitalsRepository) {
    this.records = this.createSeedRecords();
  }

  getHistory(
    userId: string,
    period: PatientHistoryPeriod = 'weekly'
  ): Observable<PatientVitalHistoryRecord[]> {
    return of(this.getRecordsForUser(userId, period));
  }

  recordHourlySnapshot(userId: string): Observable<PatientVitalHistoryRecord> {
    return this.recordCurrentVitals(userId, 'hourly-snapshot');
  }

  recordAlertSnapshot(userId: string): Observable<PatientVitalHistoryRecord | null> {
    return this.patientVitalsRepository.getVitalsPageData(userId).pipe(
      map(data => {
        const alerts = evaluatePatientVitals(data.vitals, data.alertSettings);

        if (!alerts.length) {
          return null;
        }

        if (this.hasDuplicateAlertEvent(userId, data.vitals.measuredAt, alerts)) {
          return null;
        }

        return this.storeRecord({
          id: this.createId(),
          patientUserId: userId,
          recordedAt: new Date().toISOString(),
          source: 'alert-event',
          vitals: data.vitals,
          alerts
        });
      })
    );
  }

  private recordCurrentVitals(
    userId: string,
    source: PatientHistoryRecordSource
  ): Observable<PatientVitalHistoryRecord> {
    return this.patientVitalsRepository.getVitalsPageData(userId).pipe(
      map(data => this.storeRecord({
        id: this.createId(),
        patientUserId: userId,
        recordedAt: new Date().toISOString(),
        source,
        vitals: data.vitals,
        alerts: evaluatePatientVitals(data.vitals, data.alertSettings)
      }))
    );
  }

  private getRecordsForUser(
    userId: string,
    period: PatientHistoryPeriod
  ): PatientVitalHistoryRecord[] {
    const userRecords = this.records.filter(record => record.patientUserId === userId);
    const cutoff = this.getPeriodCutoff(period, userRecords);

    return userRecords
      .filter(record =>
        new Date(record.recordedAt).getTime() >= cutoff.getTime()
      )
      .sort((a, b) =>
        new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime()
      );
  }

  private getPeriodCutoff(
    period: PatientHistoryPeriod,
    records: PatientVitalHistoryRecord[]
  ): Date {
    const latestTimestamp = records.reduce(
      (latest, record) => Math.max(latest, new Date(record.recordedAt).getTime()),
      Date.now()
    );

    const date = new Date(latestTimestamp);
    const daysByPeriod: Record<PatientHistoryPeriod, number> = {
      weekly: 7,
      biweekly: 14,
      monthly: 30
    };

    date.setDate(date.getDate() - daysByPeriod[period]);

    return date;
  }

  private createSeedRecords(): PatientVitalHistoryRecord[] {
    return [
      this.createRecord(
        'history-001',
        'patient-demo-user',
        '2026-06-04T09:00:00.000Z',
        'hourly-snapshot',
        99,
        99,
        37.7
      ),
      this.createRecord(
        'history-002',
        'patient-demo-user',
        '2026-06-04T08:00:00.000Z',
        'hourly-snapshot',
        74,
        98,
        36.7
      ),
      this.createRecord(
        'history-003',
        'patient-demo-user',
        '2026-06-04T07:34:00.000Z',
        'alert-event',
        118,
        94,
        36.9
      ),
      this.createRecord(
        'history-004',
        'patient-demo-user',
        '2026-06-04T07:00:00.000Z',
        'hourly-snapshot',
        82,
        97,
        36.8
      ),
      this.createRecord(
        'history-005',
        'patient-demo-user',
        '2026-06-04T06:21:00.000Z',
        'alert-event',
        132,
        88,
        39.2
      ),
      this.createRecord(
        'history-006',
        'patient-demo-user',
        '2026-06-04T06:00:00.000Z',
        'hourly-snapshot',
        76,
        98,
        36.6
      )
    ];
  }

  private createRecord(
    id: string,
    patientUserId: string,
    recordedAt: string,
    source: PatientHistoryRecordSource,
    heartRate: number,
    oxygen: number,
    temperature: number
  ): PatientVitalHistoryRecord {
    const vitals: PatientVitals = {
      patientUserId,
      measuredAt: recordedAt,
      heartRate,
      oxygen,
      temperature
    };

    const alertSettings = this.patientVitalsRepository.getDefaultAlertSettings(patientUserId);

    return {
      id,
      patientUserId,
      recordedAt,
      source,
      vitals,
      alerts: evaluatePatientVitals(vitals, alertSettings)
    };
  }

  private storeRecord(record: PatientVitalHistoryRecord): PatientVitalHistoryRecord {
    this.records = [
      record,
      ...this.records.filter(item => item.id !== record.id)
    ];

    return record;
  }

  private hasDuplicateAlertEvent(
    userId: string,
    measuredAt: string,
    alerts: PatientVitalAlert[]
  ): boolean {
    const signature = this.createAlertSignature(alerts);

    return this.records.some(record =>
      record.patientUserId === userId &&
      record.source === 'alert-event' &&
      record.vitals.measuredAt === measuredAt &&
      this.createAlertSignature(record.alerts) === signature
    );
  }

  private createAlertSignature(alerts: PatientVitalAlert[]): string {
    return alerts
      .map(alert => `${alert.type}:${alert.severity}:${alert.value}`)
      .sort()
      .join('|');
  }

  private createId(): string {
    return `history-${Date.now()}`;
  }
}
