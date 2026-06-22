import { NgClass, NgFor, NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import {
  DashboardLayout,
  DashboardMenuItem
} from '../../../../shared/components/dashboard-layout/dashboard-layout';
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
  caregiverUserId = 'caregiver-demo-user';
  email = 'demo.caregiver@tukuntech.app';
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

  menuItems: DashboardMenuItem[] = [
    { icon: 'bi-sun', labelKey: 'sidebar.caregiver.vitalSigns', route: '/caregiver/vital-signs' },
    { icon: 'bi-cpu', labelKey: 'sidebar.caregiver.device', route: '/caregiver/device' },
    { icon: 'bi-arrow-counterclockwise', labelKey: 'sidebar.caregiver.history', route: '/caregiver/history' },
    { icon: 'bi-person-check', labelKey: 'sidebar.caregiver.profile', route: '/caregiver/profile' },
    { icon: 'bi-ticket-perforated', labelKey: 'sidebar.caregiver.support', route: '/caregiver/support' },
    { icon: 'bi-gear', labelKey: 'sidebar.caregiver.settings', route: '/caregiver/settings' }
  ];

  constructor(
    private caregiverAlertRepository: CaregiverAlertRepository,
    private caregiverHistoryRepository: CaregiverHistoryRepository,
    private translateService: TranslateService
  ) {
    this.loadDashboard();
    this.loadGlobalCriticalAlert();
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
    const selectedPatient = this.patients.find(patient =>
      patient.userId === this.selectedReportPatientId
    );

    if (!selectedPatient) {
      return;
    }

    this.caregiverHistoryRepository
      .getPatientHistory(this.caregiverUserId, selectedPatient.userId, this.historyQuery)
      .subscribe(records => {
        const doc = new jsPDF();
        const title = this.translateService.instant('caregiver.history.reportTitle');

        doc.setFontSize(18);
        doc.text(title, 14, 18);

        doc.setFontSize(11);
        doc.text(`${this.translateService.instant('caregiver.history.patient')}: ${selectedPatient.fullName}`, 14, 28);
        doc.text(`${this.translateService.instant('caregiver.history.period')}: ${this.getPeriodLabel()}`, 14, 36);

        autoTable(doc, {
          startY: 46,
          head: [[
            this.translateService.instant('caregiver.history.date'),
            this.translateService.instant('caregiver.history.heartRate'),
            this.translateService.instant('caregiver.history.oxygen'),
            this.translateService.instant('caregiver.history.temperature'),
            this.translateService.instant('caregiver.history.status')
          ]],
          body: records.map(item => [
            this.formatDate(item.recordedAt),
            this.formatHeartRate(item),
            this.formatOxygen(item),
            this.formatTemperature(item),
            this.getReportStatus(item)
          ])
        });

        doc.save(`tukuntech-${selectedPatient.fullName.replace(/\s+/g, '-').toLowerCase()}-${this.selectedPeriod}-report.pdf`);
      });
  }

  private loadDashboard(): void {
    this.caregiverHistoryRepository
      .getDashboard(this.caregiverUserId, this.historyQuery)
      .subscribe(data => {
        this.email = data.caregiverEmail;
        this.patients = data.patients;
        this.selectedPatientId = this.selectedPatientId || data.patients[0]?.userId || '';
        this.selectedReportPatientId = this.selectedReportPatientId || this.selectedPatientId;
        this.loadHistory();
      });
  }

  private loadGlobalCriticalAlert(): void {
    this.caregiverAlertRepository
      .getGlobalCriticalAlert(this.caregiverUserId)
      .subscribe(alert => {
        this.urgentAlertShow = !!alert;
        this.urgentAlertTitleKey = alert?.titleKey || '';
        this.urgentAlertMessageKey = alert?.messageKey || '';
        this.urgentAlertMessageParams = alert?.messageParams || {};
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
      });
  }

  private getPeriodLabel(): string {
    return this.periodOptions.find(option =>
      option.value === this.selectedPeriod
    )?.label || this.selectedPeriod;
  }

  private get historyQuery() {
    return {
      period: this.selectedPeriod,
      from: this.dateFrom,
      to: this.dateTo,
      alertsOnly: this.alertsOnly
    };
  }

  private getReportStatus(item: CaregiverVitalHistoryRecord): string {
    if (!item.alerts.length) {
      return this.translateService.instant(this.getSeverityLabelKey(item));
    }

    return item.alerts
      .map(alert => this.translateService.instant(alert.titleKey))
      .join(', ');
  }
}
