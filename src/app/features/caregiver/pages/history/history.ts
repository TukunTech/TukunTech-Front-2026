import { NgClass, NgFor, NgIf } from '@angular/common';
import { ChangeDetectorRef, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import {
  DashboardLayout,
  DashboardMenuItem
} from '../../../../shared/components/dashboard-layout/dashboard-layout';
import { AuthApiService } from '../../../../core/auth/auth-api.service';
import {
  CustomSelect,
  CustomSelectOption
} from '../../../../shared/components/custom-select/custom-select';
import { CaregiverAlertRepository } from '../../data/caregiver-alert.repository';
import { CaregiverHistoryRepository } from '../../data/caregiver-history.repository';
import {
  CaregiverHistoryPatient,
  CaregiverHistoryPeriod,
  CaregiverVitalHistoryRecord,
  getCaregiverHistorySeverity
} from '../../domain/caregiver-history';
import { CaregiverVitalAlert } from '../../domain/caregiver-vital-signs';

@Component({
  selector: 'app-caregiver-history',
  imports: [
    DashboardLayout,
    TranslatePipe,
    CustomSelect,
    NgFor,
    NgIf,
    NgClass,
    FormsModule
  ],
  templateUrl: './history.html',
  styleUrl: './history.css',
})
export class History {
  caregiverUserId = '';
  email = '';
  urgentAlertShow = false;
  urgentAlertTitleKey = '';
  urgentAlertMessageKey = '';
  urgentAlertMessageParams: Record<string, string> = {};

  patients: CaregiverHistoryPatient[] = [];
  selectedPatientId = '';
  selectedReportPatientId = '';
  selectedPeriod: CaregiverHistoryPeriod = 'weekly';
  dateFrom = '2026-01-01';
  dateTo = '2026-06-20';
  alertsOnly = false;
  history: CaregiverVitalHistoryRecord[] = [];
  reportMessage = '';
  reportMessageType: 'success' | 'error' = 'error';

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
    private caregiverHistoryRepository: CaregiverHistoryRepository,
    private translateService: TranslateService,
    private changeDetector: ChangeDetectorRef
  ) {
    const session = this.authService.getSession();
    this.caregiverUserId = session?.userId || '';
    this.email = session?.email || '';
    this.loadDashboard();
  }

  get patientOptions(): CustomSelectOption[] {
    return this.patients.map(patient => ({
      label: patient.fullName,
      value: patient.userId
    }));
  }

  get periodOptions(): CustomSelectOption[] {
    return [
      { label: this.translateService.instant('caregiver.history.weekly'), value: 'weekly' },
      { label: this.translateService.instant('caregiver.history.biweekly'), value: 'biweekly' },
      { label: this.translateService.instant('caregiver.history.monthly'), value: 'monthly' }
      ,{ label: this.translateService.instant('caregiver.history.allTime'), value: 'all' }
      ,{ label: this.translateService.instant('caregiver.history.custom'), value: 'custom' }
    ];
  }

  get selectedPatient(): CaregiverHistoryPatient | undefined {
    return this.patients.find(patient => patient.userId === this.selectedPatientId);
  }

  selectPatient(patient: CaregiverHistoryPatient): void {
    this.selectedPatientId = patient.userId;
    this.selectedReportPatientId = patient.userId;
    this.loadHistory();
  }

  changeReportPatient(patientUserId: string): void {
    this.selectedReportPatientId = patientUserId;
    this.selectedPatientId = patientUserId;
    this.loadHistory();
  }

  changePeriod(period: string): void {
    this.selectedPeriod = period as CaregiverHistoryPeriod;
    this.loadHistory();
  }

  changeCustomRange(): void {
    if (this.selectedPeriod === 'custom') this.loadHistory();
  }

  toggleAlertsOnly(): void {
    this.alertsOnly = !this.alertsOnly;
    this.loadHistory();
  }

  getPatientChipClass(patient: CaregiverHistoryPatient): string {
    return patient.userId === this.selectedPatientId
      ? 'patient-chip--selected'
      : '';
  }

  getRowClass(item: CaregiverVitalHistoryRecord): string {
    return `history-row--${getCaregiverHistorySeverity(item)}`;
  }

  getAlertPillClass(alert: CaregiverVitalAlert): string {
    return `alert-pill--${alert.severity}`;
  }

  getSeverityLabelKey(item: CaregiverVitalHistoryRecord): string {
    return `caregiver.history.severity.${getCaregiverHistorySeverity(item)}`;
  }

  formatDate(value: string): string {
    const locale = this.translateService.currentLang === 'es'
      ? 'es-PE'
      : 'en-US';

    return new Intl.DateTimeFormat(locale, {
      month: 'short',
      day: 'numeric'
    }).format(new Date(value));
  }

  formatHeartRate(item: CaregiverVitalHistoryRecord): string {
    return this.translateService.instant(
      'caregiver.history.heartRateSummary',
      {
        value: item.vitals.heartRate,
        min: item.ranges.heartRate.min,
        max: item.ranges.heartRate.max
      }
    );
  }

  formatOxygen(item: CaregiverVitalHistoryRecord): string {
    return this.translateService.instant(
      'caregiver.history.oxygenSummary',
      {
        value: item.vitals.oxygen,
        min: item.ranges.oxygen.min,
        max: item.ranges.oxygen.max
      }
    );
  }

  formatTemperature(item: CaregiverVitalHistoryRecord): string {
    const temperatureLabel = item.alerts.find(alert =>
      alert.type === 'temperatureFever' || alert.type === 'temperatureHighFever'
    )?.titleKey || 'caregiver.history.normal';

    return this.translateService.instant(
      'caregiver.history.temperatureSummary',
      {
        value: item.vitals.temperature,
        status: this.translateService.instant(temperatureLabel).toLowerCase()
      }
    );
  }

  generateReport(): void {
    this.reportMessageType = 'error';
    this.reportMessage = 'El backend solo expone reportes n8n para el paciente autenticado. Falta un endpoint para generar reportes de pacientes desde cuidador.';
  }

  private loadDashboard(): void {
    this.caregiverHistoryRepository
      .getDashboard(this.caregiverUserId, this.historyQuery)
      .subscribe(data => {
        this.caregiverUserId = data.caregiverUserId;
        this.email = data.caregiverEmail;
        this.patients = data.patients;
        this.selectedPatientId = this.selectedPatientId || data.patients[0]?.userId || '';
        this.selectedReportPatientId = this.selectedReportPatientId || this.selectedPatientId;
        this.loadHistory();
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

  private loadHistory(): void {
    if (!this.selectedPatientId) {
      this.history = [];
      return;
    }

    this.caregiverHistoryRepository
      .getPatientHistory(this.caregiverUserId, this.selectedPatientId, this.historyQuery)
      .subscribe(history => {
        this.history = history;
        this.changeDetector.detectChanges();
      });
  }

  private get historyQuery() {
    return {
      period: this.selectedPeriod,
      from: this.dateFrom,
      to: this.dateTo,
      alertsOnly: this.alertsOnly
    };
  }

}
