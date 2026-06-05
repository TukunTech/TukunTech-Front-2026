import {
  CaregiverPatientVitals,
  CaregiverVitalAlert,
  CaregiverVitalAlertSettings,
  CaregiverVitalAlertSeverity
} from './caregiver-vital-signs';

export type CaregiverHistoryPeriod = 'weekly' | 'biweekly' | 'monthly';

export type CaregiverHistorySource =
  | 'hourly'
  | 'noticeAlert'
  | 'criticalAlert';

export interface CaregiverHistoryPatient {
  userId: string;
  fullName: string;
  initials: string;
}

export interface CaregiverVitalHistoryRange {
  min: number;
  max: number;
}

export interface CaregiverVitalHistoryRecord {
  id: string;
  patientUserId: string;
  recordedAt: string;
  source: CaregiverHistorySource;
  vitals: CaregiverPatientVitals;
  ranges: {
    heartRate: CaregiverVitalHistoryRange;
    oxygen: CaregiverVitalHistoryRange;
  };
  alerts: CaregiverVitalAlert[];
}

export interface CaregiverHistoryDashboard {
  caregiverUserId: string;
  caregiverEmail: string;
  patients: CaregiverHistoryPatient[];
  records: CaregiverVitalHistoryRecord[];
}

export interface CaregiverHistorySeedRecord {
  id: string;
  patientUserId: string;
  recordedAt: string;
  source: CaregiverHistorySource;
  heartRate: number;
  heartRateMin: number;
  heartRateMax: number;
  oxygen: number;
  oxygenMin: number;
  oxygenMax: number;
  temperature: number;
}

export function getCaregiverHistorySeverity(
  record: CaregiverVitalHistoryRecord
): 'normal' | CaregiverVitalAlertSeverity {
  if (record.alerts.some(alert => alert.severity === 'critical')) {
    return 'critical';
  }

  if (record.alerts.some(alert => alert.severity === 'notice')) {
    return 'notice';
  }

  return 'normal';
}

export function createCaregiverHistoryRecord(
  seed: CaregiverHistorySeedRecord,
  alertSettings: CaregiverVitalAlertSettings,
  evaluate: (
    vitals: CaregiverPatientVitals,
    settings: CaregiverVitalAlertSettings
  ) => CaregiverVitalAlert[]
): CaregiverVitalHistoryRecord {
  const vitals: CaregiverPatientVitals = {
    patientUserId: seed.patientUserId,
    measuredAt: seed.recordedAt,
    heartRate: seed.heartRate,
    oxygen: seed.oxygen,
    temperature: seed.temperature
  };

  return {
    id: seed.id,
    patientUserId: seed.patientUserId,
    recordedAt: seed.recordedAt,
    source: seed.source,
    vitals,
    ranges: {
      heartRate: {
        min: seed.heartRateMin,
        max: seed.heartRateMax
      },
      oxygen: {
        min: seed.oxygenMin,
        max: seed.oxygenMax
      }
    },
    alerts: evaluate(vitals, alertSettings)
  };
}
