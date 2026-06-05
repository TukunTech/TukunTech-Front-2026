export type CaregiverGlobalAlertSeverity = 'critical';

export interface CaregiverGlobalAlert {
  severity: CaregiverGlobalAlertSeverity;
  titleKey: string;
  messageKey: string;
  messageParams: Record<string, string>;
}
