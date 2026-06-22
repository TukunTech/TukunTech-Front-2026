import {
  PatientVitalAlert,
  PatientVitals,
  VitalAlertSeverity
} from './patient-vitals';

export type PatientHistoryRecordSource = 'hourly-snapshot' | 'alert-event';

export type PatientHistorySeverity = 'normal' | VitalAlertSeverity;

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
  if (record.alerts.some(alert => alert.severity === 'critical')) {
    return 'critical';
  }

  if (record.alerts.some(alert => alert.severity === 'notice')) {
    return 'notice';
  }

  return 'normal';
}
