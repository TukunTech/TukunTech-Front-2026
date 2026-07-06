import { NgClass, NgFor, NgIf } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { interval, Subscription } from 'rxjs';

import {
  DashboardLayout,
  DashboardMenuItem
} from '../../../../shared/components/dashboard-layout/dashboard-layout';
import { EcgLiveChart } from '../../../../shared/components/ecg-live-chart/ecg-live-chart';
import { AuthApiService } from '../../../../core/auth/auth-api.service';
import { PatientAlertRepository } from '../../data/patient-alert.repository';
import { PatientDeviceRepository } from '../../data/patient-device.repository';
import { PatientHistoryRepository } from '../../data/patient-history.repository';
import { PatientVitalsRepository } from '../../data/patient-vitals.repository';
import {
  evaluatePatientVitals,
  PatientVitalAlert,
  PatientVitalAlertSettings,
  PatientVitals
} from '../../domain/patient-vitals';

@Component({
  selector: 'app-today',
  imports: [
    DashboardLayout,
    TranslatePipe,
    EcgLiveChart,
    NgFor,
    NgClass,
    NgIf
  ],
  templateUrl: './today.html',
  styleUrl: './today.css',
})
export class Today implements OnDestroy {
  private readonly telemetryFreshnessMs = 60000;
  userId = '';
  deviceDisconnected = false;
  urgentAlertShow = false;
  urgentAlertTitleKey = '';
  urgentAlertMessageKey = '';

  menuItems: DashboardMenuItem[] = [
    { icon: 'bi-sun', labelKey: 'sidebar.patient.vitalSigns', route: '/patient/today' },
    { icon: 'bi-cpu', labelKey: 'sidebar.patient.device', route: '/patient/device' },
    { icon: 'bi-arrow-counterclockwise', labelKey: 'sidebar.patient.history', route: '/patient/history' },
    { icon: 'bi-person-check', labelKey: 'sidebar.patient.profile', route: '/patient/profile' },
    { icon: 'bi-ticket-perforated', labelKey: 'sidebar.patient.support', route: '/patient/support' },
    { icon: 'bi-gear', labelKey: 'sidebar.patient.settings', route: '/patient/settings' }
  ];

  patientName = '';
  initials = '';
  email = '';

  vitals: PatientVitals = {
    patientUserId: this.userId,
    measuredAt: '',
    heartRate: 0,
    oxygen: 0,
    temperature: 0
  };

  alertSettings: PatientVitalAlertSettings = {
    patientUserId: this.userId,
    heartRate: {},
    oxygen: {},
    temperature: {}
  };

  vitalAlerts: PatientVitalAlert[] = [];
  private refreshSubscription?: Subscription;

  constructor(
    private authService: AuthApiService,
    private patientDeviceRepository: PatientDeviceRepository,
    private patientVitalsRepository: PatientVitalsRepository,
    private patientAlertRepository: PatientAlertRepository,
    private patientHistoryRepository: PatientHistoryRepository,
    private translateService: TranslateService,
    private changeDetector: ChangeDetectorRef
  ) {
    const session = this.authService.getSession();
    this.userId = session?.userId || '';
    this.email = session?.email || '';
    this.loadVitals();
    this.refreshSubscription = interval(5000).subscribe(() => this.loadVitals());
  }

  ngOnDestroy(): void {
    this.refreshSubscription?.unsubscribe();
  }

  get statusTextKey(): string {
    if (this.deviceDisconnected) {
      return 'patient.today.statusOffline';
    }

    if (this.statusAlertSeverity === 'critical') {
      return 'patient.today.statusCritical';
    }

    if (this.hasVitalAlerts) {
      return 'patient.today.statusNotice';
    }

    return 'patient.today.status';
  }

  get statusPillLabel(): string {
    if (this.hasVitalAlerts) {
      return this.translateService.instant(
        'patient.today.statusPillAlertWithCause',
        { causes: this.statusAlertCauseLabels.join(', ') }
      );
    }

    const statusKey = this.deviceDisconnected
      ? 'patient.today.statusPillOffline'
      : 'patient.today.statusPill';

    return this.translateService.instant(statusKey);
  }

  get heartRateValue(): string {
    return this.deviceDisconnected ? '-' : `${this.vitals.heartRate} bpm`;
  }

  get oxygenValue(): string {
    return this.deviceDisconnected ? '-' : `${this.vitals.oxygen}%`;
  }

  get oxygenStatusKey(): string {
    if (this.deviceDisconnected) {
      return 'patient.today.noData';
    }

    return this.getVitalAlertTitleKey('oxygen') || 'patient.today.oxygenMetric';
  }

  get temperatureValue(): string {
    return this.deviceDisconnected ? '-' : `${this.vitals.temperature} \u00b0C`;
  }

  get heartStatusKey(): string {
    if (this.deviceDisconnected) {
      return 'patient.today.noData';
    }

    return this.getVitalAlertTitleKey('heart') || 'patient.today.heartStatus';
  }

  get temperatureStatusKey(): string {
    if (this.deviceDisconnected) {
      return 'patient.today.noData';
    }

    return this.getVitalAlertTitleKey('temperature') || 'patient.today.normal';
  }

  get hasVitalAlerts(): boolean {
    return !this.deviceDisconnected && this.vitalAlerts.length > 0;
  }

  get statusHasAlerts(): boolean {
    return this.hasVitalAlerts;
  }

  get statusAlertSeverity(): string {
    return this.vitalAlerts.some(alert => alert.severity === 'critical')
      ? 'critical'
      : 'notice';
  }

  get statusAlertCauseLabels(): string[] {
    const causeKeys = this.vitalAlerts.reduce<string[]>((keys, alert) => {
      const causeKey = this.getAlertCauseKey(alert);

      return keys.includes(causeKey) ? keys : [...keys, causeKey];
    }, []);

    return causeKeys.map(key => this.translateService.instant(key));
  }

  get heartRateForEcg(): number {
    return this.deviceDisconnected ? 0 : this.vitals.heartRate;
  }

  get hasEcgSignal(): boolean {
    return !this.deviceDisconnected && this.heartRateForEcg > 0;
  }

  get ecgSubtitleKey(): string {
    if (this.deviceDisconnected) {
      return 'patient.today.ecgOfflineSubtitle';
    }

    return this.hasEcgSignal
      ? 'patient.today.ecgSubtitle'
      : 'patient.today.ecgNoSignalSubtitle';
  }

  get ecgInactiveMessageKey(): string {
    return this.deviceDisconnected
      ? 'patient.today.ecgOffline'
      : 'patient.today.ecgNoSignal';
  }

  getVitalCardAlertClass(type: 'heart' | 'oxygen' | 'temperature'): string {
    if (this.deviceDisconnected) {
      return '';
    }

    const alert = this.getVitalAlert(type);

    return alert ? `vital-card--${alert.severity}` : '';
  }

  getAlertValueLabel(alert: PatientVitalAlert): string {
    if (alert.type === 'heartRateLow' || alert.type === 'heartRateHigh') {
      return `${alert.value} bpm`;
    }

    if (alert.type === 'oxygenLow' || alert.type === 'oxygenCritical') {
      return `${alert.value}%`;
    }

    return `${alert.value} \u00b0C`;
  }

  private getVitalAlert(type: 'heart' | 'oxygen' | 'temperature'): PatientVitalAlert | undefined {
    return this.vitalAlerts.find(item => {
      if (type === 'heart') {
        return item.type === 'heartRateLow' || item.type === 'heartRateHigh';
      }

      if (type === 'oxygen') {
        return item.type === 'oxygenLow' || item.type === 'oxygenCritical';
      }

      return item.type === 'temperatureFever' || item.type === 'temperatureHighFever';
    });
  }

  private getVitalAlertTitleKey(type: 'heart' | 'oxygen' | 'temperature'): string | undefined {
    return this.getVitalAlert(type)?.titleKey;
  }

  private getAlertCauseKey(alert: PatientVitalAlert): string {
    if (alert.type === 'heartRateLow' || alert.type === 'heartRateHigh') {
      return 'patient.today.alertCauses.heartRate';
    }

    if (alert.type === 'oxygenLow' || alert.type === 'oxygenCritical') {
      return 'patient.today.alertCauses.oxygen';
    }

    return 'patient.today.alertCauses.temperature';
  }

  private loadVitals(): void {
    this.patientVitalsRepository
      .getVitalsPageData(this.userId)
      .subscribe(data => {
        this.patientName = data.patientName;
        this.initials = data.initials;
        this.email = data.email;
        this.vitals = data.vitals;
        this.userId = data.vitals.patientUserId;
        this.alertSettings = data.alertSettings;
        this.deviceDisconnected = !this.hasFreshTelemetry(data.vitals);
        this.vitalAlerts = evaluatePatientVitals(data.vitals, data.alertSettings);
        this.changeDetector.detectChanges();
        this.loadDeviceConnectionAlert();
        this.loadGlobalUrgentAlert();

        if (this.vitalAlerts.length) {
          this.patientHistoryRepository.recordAlertSnapshot(this.userId).subscribe();
        }

        this.patientHistoryRepository.recordPeriodicSnapshotIfDue(this.userId).subscribe();
      });
  }

  private loadDeviceConnectionAlert(): void {
    if (!this.userId) {
      this.deviceDisconnected = true;
      return;
    }

    this.patientDeviceRepository
      .getDeviceByPatient(this.userId)
      .subscribe(device => {
        this.deviceDisconnected = device.connectionStatus === 'offline' && !this.hasFreshTelemetry(this.vitals);
        this.changeDetector.detectChanges();
      });
  }

  private loadGlobalUrgentAlert(): void {
    if (!this.userId) return;

    this.patientAlertRepository
      .getGlobalUrgentAlert(this.userId)
      .subscribe(alert => {
        this.urgentAlertShow = !!alert;
        this.urgentAlertTitleKey = alert?.titleKey || '';
        this.urgentAlertMessageKey = alert?.messageKey || '';
        this.changeDetector.detectChanges();
      });
  }

  private hasFreshTelemetry(vitals: PatientVitals): boolean {
    if (!vitals.measuredAt) {
      return false;
    }

    const measuredAtMs = Date.parse(vitals.measuredAt);

    return Number.isFinite(measuredAtMs) && Date.now() - measuredAtMs <= this.telemetryFreshnessMs;
  }
}
