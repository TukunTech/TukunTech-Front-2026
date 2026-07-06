import {
  PatientVitalAlert,
  PatientVitals,
  VitalAlertSeverity
} from './patient-vitals';

export type PatientHistoryRecordSource = 'hourly-snapshot' | 'alert-event';

export type PatientHistorySeverity = 'normal' | 'offline' | VitalAlertSeverity;

export type PatientHistoryPeriod = 'weekly' | 'biweekly' | 'monthly' | 'all' | 'custom';

export interface PatientHistoryQuery {
  period: PatientHistoryPeriod;
  from?: string;
  to?: string;
  alertsOnly?: boolean;
}

export interface PatientVitalHistoryRecord {
  id: string;
  patientUserId: string;
  recordedAt: string;
  source: PatientHistoryRecordSource;
  vitals: PatientVitals;
  alerts: PatientVitalAlert[];
}

export function getHistorySeverity(
  record: PatientVitalHistoryRecord
): PatientHistorySeverity {
  if (isOfflineHistoryRecord(record)) {
    return 'offline';
  }

  if (record.alerts.some(alert => alert.severity === 'critical')) {
    return 'critical';
  }

  if (record.alerts.some(alert => alert.severity === 'notice')) {
    return 'notice';
  }

  return 'normal';
}

export function isOfflineHistoryRecord(record: PatientVitalHistoryRecord): boolean {
  const measuredAt = Date.parse(record.vitals.measuredAt);
  const hasMeasuredAt = Number.isFinite(measuredAt);
  const hasAnySignal = record.vitals.heartRate > 0 ||
    record.vitals.oxygen > 0 ||
    record.vitals.temperature > 0;

  return !hasMeasuredAt || !hasAnySignal;
}
