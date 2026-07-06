import { NgClass, NgFor, NgIf } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { interval, Subscription } from 'rxjs';

import {
  DashboardLayout,
  DashboardMenuItem
} from '../../../../shared/components/dashboard-layout/dashboard-layout';
import { AuthApiService } from '../../../../core/auth/auth-api.service';
import { CaregiverAlertRepository } from '../../data/caregiver-alert.repository';
import { EcgLiveChart } from '../../../../shared/components/ecg-live-chart/ecg-live-chart';
import { CaregiverVitalSignsRepository } from '../../data/caregiver-vital-signs.repository';
import {
  CaregiverPatientSummary,
  CaregiverVitalAlert,
  evaluateCaregiverPatientVitals,
  getCaregiverPatientSeverity
} from '../../domain/caregiver-vital-signs';

interface CaregiverPatientAlertView {
  patient: CaregiverPatientSummary;
  alert: CaregiverVitalAlert | null;
}

@Component({
  selector: 'app-caregiver-vital-signs',
  imports: [
    DashboardLayout,
    TranslatePipe,
    NgFor,
    NgIf,
    NgClass,
    EcgLiveChart
  ],
  templateUrl: './vital-signs.html',
  styleUrl: './vital-signs.css',
})
export class VitalSigns implements OnDestroy {
  caregiverUserId = '';
  email = '';
  selectedPatientId = '';
  isLoading = true;
  urgentAlertShow = false;
  urgentAlertTitleKey = '';
  urgentAlertMessageKey = '';
  urgentAlertMessageParams: Record<string, string> = {};

  patients: CaregiverPatientSummary[] = [];
  private refreshSubscription?: Subscription;

  menuItems: DashboardMenuItem[] = [
    { icon: 'bi-sun', labelKey: 'sidebar.caregiver.vitalSigns', route: '/caregiver/vital-signs' },
    { icon: 'bi-cpu', labelKey: 'sidebar.caregiver.device', route: '/caregiver/device' },
    { icon: 'bi-arrow-counterclockwise', labelKey: 'sidebar.caregiver.history', route: '/caregiver/history' },
    { icon: 'bi-person-check', labelKey: 'sidebar.caregiver.profile', route: '/caregiver/profile' },
    { icon: 'bi-ticket-perforated', labelKey: 'sidebar.caregiver.support', route: '/caregiver/support' },
    { icon: 'bi-gear', labelKey: 'sidebar.caregiver.settings', route: '/caregiver/settings' }
  ];

  constructor(
    private authService: AuthApiService,
    private caregiverAlertRepository: CaregiverAlertRepository,
    private caregiverVitalSignsRepository: CaregiverVitalSignsRepository,
    private translateService: TranslateService,
    private changeDetector: ChangeDetectorRef
  ) {
    const session = this.authService.getSession();
    this.caregiverUserId = session?.userId || '';
    this.email = session?.email || '';
    this.loadDashboard();
    this.refreshSubscription = interval(5000).subscribe(() => this.loadDashboard(true));
  }

  ngOnDestroy(): void {
    this.refreshSubscription?.unsubscribe();
  }

  get selectedPatient(): CaregiverPatientSummary | undefined {
    return this.patients.find(patient => patient.userId === this.selectedPatientId);
  }

  get selectedPatientOffline(): boolean {
    return this.selectedPatient?.device.connectionStatus === 'offline';
  }

  get selectedHeartRate(): string {
    if (!this.selectedPatient || this.selectedPatientOffline) {
      return '-';
    }

    return `${this.selectedPatient.vitals.heartRate} bpm`;
  }

  get selectedOxygen(): string {
    if (!this.selectedPatient || this.selectedPatientOffline) {
      return '-';
    }

    return `${this.selectedPatient.vitals.oxygen}%`;
  }

  get selectedTemperature(): string {
    if (!this.selectedPatient || this.selectedPatientOffline) {
      return '-';
    }

    return `${this.selectedPatient.vitals.temperature} \u00b0C`;
  }

  get selectedHeartStatusKey(): string {
    return this.getSelectedAlertTitleKey('heart') || 'caregiver.vitalSigns.heartStatus';
  }

  get selectedOxygenStatusKey(): string {
    return this.getSelectedAlertTitleKey('oxygen') || 'caregiver.vitalSigns.oxygenMetric';
  }

  get selectedTemperatureStatusKey(): string {
    return this.getSelectedAlertTitleKey('temperature') || 'caregiver.vitalSigns.normal';
  }

  get caregiverAlerts(): CaregiverPatientAlertView[] {
    return this.patients.flatMap<CaregiverPatientAlertView>(patient => {
      if (patient.device.connectionStatus === 'offline') {
        return [{ patient, alert: null }];
      }

      return this.getAlerts(patient).map(alert => ({ patient, alert }));
    });
  }

  get hasCaregiverAlerts(): boolean {
    return this.caregiverAlerts.length > 0;
  }

  selectPatient(patient: CaregiverPatientSummary): void {
    this.selectedPatientId = patient.userId;
  }

  getAlerts(patient: CaregiverPatientSummary): CaregiverVitalAlert[] {
    if (patient.device.connectionStatus === 'offline') {
      return [];
    }

    return evaluateCaregiverPatientVitals(patient.vitals, patient.alertSettings);
  }

  getPatientCardClass(patient: CaregiverPatientSummary): string {
    const selectedClass = patient.userId === this.selectedPatientId
      ? 'patient-card--selected'
      : '';

    return [
      `patient-card--${getCaregiverPatientSeverity(patient)}`,
      selectedClass
    ].filter(Boolean).join(' ');
  }

  getPatientBadgeClass(patient: CaregiverPatientSummary): string {
    return `status-badge--${getCaregiverPatientSeverity(patient)}`;
  }

  getPatientBadgeLabel(patient: CaregiverPatientSummary): string {
    if (patient.device.connectionStatus === 'offline') {
      return this.translateService.instant('caregiver.vitalSigns.offline');
    }

    const alerts = this.getAlerts(patient);

    if (!alerts.length) {
      return this.translateService.instant('caregiver.vitalSigns.allGood');
    }

    return this.translateService.instant(
      'caregiver.vitalSigns.alertWithCause',
      { cause: this.getAlertCauseLabel(alerts[0]) }
    );
  }

  getPatientHeartRate(patient: CaregiverPatientSummary): string {
    return patient.device.connectionStatus === 'offline'
      ? '-'
      : `${patient.vitals.heartRate} bpm`;
  }

  getPatientOxygen(patient: CaregiverPatientSummary): string {
    return patient.device.connectionStatus === 'offline'
      ? '-'
      : `${patient.vitals.oxygen}%`;
  }

  getPatientTemperature(patient: CaregiverPatientSummary): string {
    return patient.device.connectionStatus === 'offline'
      ? '-'
      : `${patient.vitals.temperature} \u00b0C`;
  }

  getPatientHeartRateForEcg(patient: CaregiverPatientSummary): number {
    return patient.device.connectionStatus === 'offline'
      ? 0
      : patient.vitals.heartRate;
  }

  getPatientEcgMessageKey(patient: CaregiverPatientSummary): string {
    return patient.device.connectionStatus === 'offline'
      ? 'caregiver.vitalSigns.monitoringOff'
      : 'caregiver.vitalSigns.noHeartSignal';
  }

  getWifiLabelKey(patient: CaregiverPatientSummary): string {
    return `caregiver.vitalSigns.wifi.${patient.device.wifiStrength}`;
  }

  getBatteryClass(patient: CaregiverPatientSummary): string {
    if (patient.device.battery <= 30) {
      return 'battery--low';
    }

    if (patient.device.battery <= 60) {
      return 'battery--medium';
    }

    return 'battery--good';
  }

  getAlertRowClass(alert: CaregiverVitalAlert | null): string {
    return alert ? `caregiver-alert--${alert.severity}` : 'caregiver-alert--offline';
  }

  getAlertIcon(alert: CaregiverVitalAlert | null): string {
    return alert?.severity === 'notice'
      ? 'bi-info-circle'
      : 'bi-exclamation-triangle';
  }

  getAlertValueLabel(alert: CaregiverVitalAlert): string {
    if (alert.type === 'heartRateLow' || alert.type === 'heartRateHigh') {
      return `${alert.value} bpm`;
    }

    if (alert.type === 'oxygenLow' || alert.type === 'oxygenCritical') {
      return `${alert.value}%`;
    }

    return `${alert.value} \u00b0C`;
  }

  getAlertMessageKey(alert: CaregiverVitalAlert | null): string {
    return alert?.messageKey || 'caregiver.vitalSigns.patientOfflineAlert';
  }

  getAlertTitleKey(alert: CaregiverVitalAlert | null): string {
    return alert?.titleKey || 'caregiver.vitalSigns.patientOfflineTitle';
  }

  getAlertValue(alert: CaregiverVitalAlert | null): string {
    return alert ? this.getAlertValueLabel(alert) : '';
  }

  private loadDashboard(isRefresh = false): void {
    if (!isRefresh) {
      this.isLoading = true;
    }

    this.caregiverVitalSignsRepository
      .getDashboard(this.caregiverUserId)
      .subscribe(data => {
        this.caregiverUserId = data.caregiverUserId;
        this.email = data.caregiverEmail;
        this.patients = data.patients;
        this.selectedPatientId = this.selectedPatientId || data.patients[0]?.userId || '';
        this.isLoading = false;
        this.changeDetector.detectChanges();
        this.loadGlobalCriticalAlert();
      });
  }

  private loadGlobalCriticalAlert(): void {
    if (!this.caregiverUserId) return;

    this.caregiverAlertRepository
      .getGlobalCriticalAlert(this.caregiverUserId)
      .subscribe(alert => {
        this.urgentAlertShow = !!alert;
        this.urgentAlertTitleKey = alert?.titleKey || '';
        this.urgentAlertMessageKey = alert?.messageKey || '';
        this.urgentAlertMessageParams = alert?.messageParams || {};
        this.changeDetector.detectChanges();
      });
  }

  private getSelectedAlertTitleKey(
    type: 'heart' | 'oxygen' | 'temperature'
  ): string | undefined {
    if (!this.selectedPatient || this.selectedPatientOffline) {
      return 'caregiver.vitalSigns.noData';
    }

    return this.getAlerts(this.selectedPatient).find(alert => {
      if (type === 'heart') {
        return alert.type === 'heartRateLow' || alert.type === 'heartRateHigh';
      }

      if (type === 'oxygen') {
        return alert.type === 'oxygenLow' || alert.type === 'oxygenCritical';
      }

      return alert.type === 'temperatureFever' || alert.type === 'temperatureHighFever';
    })?.titleKey;
  }

  private getAlertCauseLabel(alert: CaregiverVitalAlert): string {
    if (alert.type === 'heartRateLow' || alert.type === 'heartRateHigh') {
      return this.translateService.instant('caregiver.vitalSigns.alertCauses.heartRate');
    }

    if (alert.type === 'oxygenLow' || alert.type === 'oxygenCritical') {
      return this.translateService.instant('caregiver.vitalSigns.alertCauses.oxygen');
    }

    return this.translateService.instant('caregiver.vitalSigns.alertCauses.temperature');
  }
}
