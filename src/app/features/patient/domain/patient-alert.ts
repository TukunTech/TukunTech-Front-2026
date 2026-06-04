export type PatientGlobalAlertSeverity = 'critical';

export interface PatientGlobalAlert {
  severity: PatientGlobalAlertSeverity;
  titleKey: string;
  messageKey: string;
}
