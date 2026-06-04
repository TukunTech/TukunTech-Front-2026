export type VitalAlertSeverity = 'notice' | 'critical';

export type VitalAlertType =
  | 'heartRateLow'
  | 'heartRateHigh'
  | 'oxygenLow'
  | 'oxygenCritical'
  | 'temperatureFever'
  | 'temperatureHighFever';

export interface PatientVitals {
  patientUserId: string;
  measuredAt: string;
  heartRate: number;
  oxygen: number;
  temperature: number;
}

export interface VitalRangeThreshold {
  noticeLow?: number;
  criticalLow?: number;
  noticeHigh?: number;
  criticalHigh?: number;
}

export interface PatientVitalAlertSettings {
  patientUserId: string;
  heartRate: VitalRangeThreshold;
  oxygen: VitalRangeThreshold;
  temperature: VitalRangeThreshold;
}

export interface PatientVitalAlert {
  type: VitalAlertType;
  severity: VitalAlertSeverity;
  titleKey: string;
  messageKey: string;
  value: number;
}

export interface PatientVitalsPageData {
  patientName: string;
  initials: string;
  email: string;
  vitals: PatientVitals;
  alertSettings: PatientVitalAlertSettings;
}

export function evaluatePatientVitals(
  vitals: PatientVitals,
  settings: PatientVitalAlertSettings
): PatientVitalAlert[] {
  return [
    ...evaluateHeartRate(vitals.heartRate, settings.heartRate),
    ...evaluateOxygen(vitals.oxygen, settings.oxygen),
    ...evaluateTemperature(vitals.temperature, settings.temperature)
  ];
}

function evaluateHeartRate(
  heartRate: number,
  threshold: VitalRangeThreshold
): PatientVitalAlert[] {
  if (threshold.criticalLow !== undefined && heartRate < threshold.criticalLow) {
    return [createAlert('heartRateLow', 'critical', heartRate)];
  }

  if (threshold.criticalHigh !== undefined && heartRate > threshold.criticalHigh) {
    return [createAlert('heartRateHigh', 'critical', heartRate)];
  }

  if (threshold.noticeLow !== undefined && heartRate < threshold.noticeLow) {
    return [createAlert('heartRateLow', 'notice', heartRate)];
  }

  if (threshold.noticeHigh !== undefined && heartRate > threshold.noticeHigh) {
    return [createAlert('heartRateHigh', 'notice', heartRate)];
  }

  return [];
}

function evaluateOxygen(
  oxygen: number,
  threshold: VitalRangeThreshold
): PatientVitalAlert[] {
  if (threshold.criticalLow !== undefined && oxygen < threshold.criticalLow) {
    return [createAlert('oxygenCritical', 'critical', oxygen)];
  }

  if (threshold.noticeLow !== undefined && oxygen < threshold.noticeLow) {
    return [createAlert('oxygenLow', 'notice', oxygen)];
  }

  return [];
}

function evaluateTemperature(
  temperature: number,
  threshold: VitalRangeThreshold
): PatientVitalAlert[] {
  if (threshold.criticalHigh !== undefined && temperature >= threshold.criticalHigh) {
    return [createAlert('temperatureHighFever', 'critical', temperature)];
  }

  if (threshold.noticeHigh !== undefined && temperature >= threshold.noticeHigh) {
    return [createAlert('temperatureFever', 'notice', temperature)];
  }

  return [];
}

function createAlert(
  type: VitalAlertType,
  severity: VitalAlertSeverity,
  value: number
): PatientVitalAlert {
  return {
    type,
    severity,
    value,
    titleKey: `patient.today.alerts.${type}.title`,
    messageKey: `patient.today.alerts.${type}.${severity}`
  };
}
