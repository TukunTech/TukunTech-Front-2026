export type CaregiverVitalAlertSeverity = 'notice' | 'critical';

export type CaregiverVitalAlertType =
  | 'heartRateLow'
  | 'heartRateHigh'
  | 'oxygenLow'
  | 'oxygenHigh'
  | 'oxygenCritical'
  | 'temperatureLow'
  | 'temperatureCriticalLow'
  | 'temperatureFever'
  | 'temperatureHighFever';

export type CaregiverPatientConnectionStatus = 'online' | 'offline';

export interface CaregiverPatientVitals {
  patientUserId: string;
  measuredAt: string;
  heartRate: number;
  oxygen: number;
  temperature: number;
}

export interface CaregiverVitalRangeThreshold {
  noticeLow?: number;
  criticalLow?: number;
  noticeHigh?: number;
  criticalHigh?: number;
}

export interface CaregiverVitalAlertSettings {
  patientUserId: string;
  heartRate: CaregiverVitalRangeThreshold;
  oxygen: CaregiverVitalRangeThreshold;
  temperature: CaregiverVitalRangeThreshold;
}

export interface CaregiverVitalAlert {
  type: CaregiverVitalAlertType;
  severity: CaregiverVitalAlertSeverity;
  titleKey: string;
  messageKey: string;
  value: number;
}

export interface CaregiverPatientDevice {
  id: string;
  model: string;
  battery: number;
  wifiStrength: 'strong' | 'off';
  connectionStatus: CaregiverPatientConnectionStatus;
}

export interface CaregiverPatientSummary {
  userId: string;
  fullName: string;
  initials: string;
  age: number;
  vitals: CaregiverPatientVitals;
  alertSettings: CaregiverVitalAlertSettings;
  device: CaregiverPatientDevice;
}

export interface CaregiverVitalSignsDashboard {
  caregiverUserId: string;
  caregiverEmail: string;
  patients: CaregiverPatientSummary[];
}

export function evaluateCaregiverPatientVitals(
  vitals: CaregiverPatientVitals,
  settings: CaregiverVitalAlertSettings
): CaregiverVitalAlert[] {
  return [
    ...evaluateHeartRate(vitals.heartRate, settings.heartRate),
    ...evaluateOxygen(vitals.oxygen, settings.oxygen),
    ...evaluateTemperature(vitals.temperature, settings.temperature)
  ];
}

export function getCaregiverPatientSeverity(
  patient: CaregiverPatientSummary
): 'normal' | 'offline' | CaregiverVitalAlertSeverity {
  if (patient.device.connectionStatus === 'offline') {
    return 'offline';
  }

  const alerts = evaluateCaregiverPatientVitals(patient.vitals, patient.alertSettings);

  if (alerts.some(alert => alert.severity === 'critical')) {
    return 'critical';
  }

  if (alerts.some(alert => alert.severity === 'notice')) {
    return 'notice';
  }

  return 'normal';
}

function evaluateHeartRate(
  heartRate: number,
  threshold: CaregiverVitalRangeThreshold
): CaregiverVitalAlert[] {
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
  threshold: CaregiverVitalRangeThreshold
): CaregiverVitalAlert[] {
  if (threshold.criticalLow !== undefined && oxygen < threshold.criticalLow) {
    return [createAlert('oxygenCritical', 'critical', oxygen)];
  }

  if (threshold.noticeLow !== undefined && oxygen < threshold.noticeLow) {
    return [createAlert('oxygenLow', 'notice', oxygen)];
  }

  if (threshold.noticeHigh !== undefined && oxygen > threshold.noticeHigh) {
    return [createAlert('oxygenHigh', 'notice', oxygen)];
  }

  return [];
}

function evaluateTemperature(
  temperature: number,
  threshold: CaregiverVitalRangeThreshold
): CaregiverVitalAlert[] {
  if (threshold.criticalLow !== undefined && temperature <= threshold.criticalLow) {
    return [createAlert('temperatureCriticalLow', 'critical', temperature)];
  }

  if (threshold.noticeLow !== undefined && temperature <= threshold.noticeLow) {
    return [createAlert('temperatureLow', 'notice', temperature)];
  }

  if (threshold.criticalHigh !== undefined && temperature >= threshold.criticalHigh) {
    return [createAlert('temperatureHighFever', 'critical', temperature)];
  }

  if (threshold.noticeHigh !== undefined && temperature >= threshold.noticeHigh) {
    return [createAlert('temperatureFever', 'notice', temperature)];
  }

  return [];
}

function createAlert(
  type: CaregiverVitalAlertType,
  severity: CaregiverVitalAlertSeverity,
  value: number
): CaregiverVitalAlert {
  return {
    type,
    severity,
    value,
    titleKey: `caregiver.vitalSigns.alerts.${type}.title`,
    messageKey: `caregiver.vitalSigns.alerts.${type}.${severity}`
  };
}
