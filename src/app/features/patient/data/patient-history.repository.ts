import { Injectable } from '@angular/core';
import { map, Observable, of } from 'rxjs';

import {
  evaluatePatientVitals,
  PatientVitalAlert,
  PatientVitalsPageData
} from '../domain/patient-vitals';
import { PatientVitalsRepository } from './patient-vitals.repository';
import {
  PatientHistoryQuery,
  PatientHistoryPeriod,
  PatientHistoryRecordSource,
  PatientVitalHistoryRecord,
  isOfflineHistoryRecord
} from '../domain/patient-history';

@Injectable({
  providedIn: 'root'
})
export class PatientHistoryRepository {
  private readonly periodicSnapshotIntervalMs = 10 * 60 * 1000;
  private records: PatientVitalHistoryRecord[] = [];

  constructor(private patientVitalsRepository: PatientVitalsRepository) {}

  getHistory(
    userId: string,
    query: PatientHistoryQuery = { period: 'weekly' }
  ): Observable<PatientVitalHistoryRecord[]> {
    return of(this.getRecordsForUser(userId, query));
  }

  recordHourlySnapshot(userId: string): Observable<PatientVitalHistoryRecord> {
    return this.recordCurrentVitals(userId, 'hourly-snapshot');
  }

  recordPeriodicSnapshotIfDue(userId: string): Observable<PatientVitalHistoryRecord | null> {
    if (!this.isPeriodicSnapshotDue(userId)) {
      return of(null);
    }

    return this.recordCurrentVitals(userId, 'hourly-snapshot');
  }

  recordAlertSnapshot(userId: string): Observable<PatientVitalHistoryRecord | null> {
    return this.patientVitalsRepository.getVitalsPageData(userId).pipe(
      map(data => {
        const draftRecord = this.createRecord(userId, 'alert-event', data);
        const alerts = isOfflineHistoryRecord(draftRecord)
          ? []
          : evaluatePatientVitals(data.vitals, data.alertSettings);

        if (!alerts.length) {
          return null;
        }

        if (this.hasDuplicateAlertEvent(userId, data.vitals.measuredAt, alerts)) {
          return null;
        }

        return this.storeRecord({ ...draftRecord, alerts });
      })
    );
  }

  private recordCurrentVitals(
    userId: string,
    source: PatientHistoryRecordSource
  ): Observable<PatientVitalHistoryRecord> {
    return this.patientVitalsRepository.getVitalsPageData(userId).pipe(
      map(data => {
        const record = this.createRecord(userId, source, data);
        return this.storeRecord({
          ...record,
          alerts: isOfflineHistoryRecord(record)
            ? []
            : evaluatePatientVitals(data.vitals, data.alertSettings)
        });
      })
    );
  }

  private createRecord(
    userId: string,
    source: PatientHistoryRecordSource,
    data: PatientVitalsPageData
  ): PatientVitalHistoryRecord {
    return {
      id: this.createId(),
      patientUserId: userId,
      recordedAt: new Date().toISOString(),
      source,
      vitals: data.vitals,
      alerts: []
    };
  }

  private getRecordsForUser(
    userId: string,
    query: PatientHistoryQuery
  ): PatientVitalHistoryRecord[] {
    let userRecords = this.records.filter(record => record.patientUserId === userId);

    if (query.alertsOnly) {
      userRecords = userRecords.filter(record => record.alerts.length > 0);
    }

    if (query.period === 'custom') {
      const from = query.from ? new Date(`${query.from}T00:00:00`).getTime() : Number.MIN_SAFE_INTEGER;
      const to = query.to ? new Date(`${query.to}T23:59:59.999`).getTime() : Number.MAX_SAFE_INTEGER;
      userRecords = userRecords.filter(record => {
        const timestamp = new Date(record.recordedAt).getTime();
        return timestamp >= from && timestamp <= to;
      });
    } else if (query.period !== 'all') {
      const cutoff = this.getPeriodCutoff(query.period, userRecords);
      userRecords = userRecords.filter(record => new Date(record.recordedAt).getTime() >= cutoff.getTime());
    }

    return userRecords
      .sort((a, b) =>
        new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime()
      );
  }

  private getPeriodCutoff(
    period: Exclude<PatientHistoryPeriod, 'all' | 'custom'>,
    records: PatientVitalHistoryRecord[]
  ): Date {
    const latestTimestamp = records.reduce(
      (latest, record) => Math.max(latest, new Date(record.recordedAt).getTime()),
      Date.now()
    );

    const date = new Date(latestTimestamp);
    const daysByPeriod: Record<Exclude<PatientHistoryPeriod, 'all' | 'custom'>, number> = {
      weekly: 7,
      biweekly: 14,
      monthly: 30
    };

    date.setDate(date.getDate() - daysByPeriod[period]);

    return date;
  }

  private storeRecord(record: PatientVitalHistoryRecord): PatientVitalHistoryRecord {
    this.records = [
      record,
      ...this.records.filter(item => item.id !== record.id)
    ];

    return record;
  }

  private isPeriodicSnapshotDue(userId: string): boolean {
    const latestPeriodicSnapshot = this.records
      .filter(record =>
        record.patientUserId === userId &&
        record.source === 'hourly-snapshot'
      )
      .map(record => new Date(record.recordedAt).getTime())
      .filter(timestamp => Number.isFinite(timestamp))
      .sort((first, second) => second - first)[0];

    return !latestPeriodicSnapshot ||
      Date.now() - latestPeriodicSnapshot >= this.periodicSnapshotIntervalMs;
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
