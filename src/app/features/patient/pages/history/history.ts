import { NgClass, NgFor, NgIf } from '@angular/common';
import { ChangeDetectorRef, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import {
  DashboardLayout,
  DashboardMenuItem
} from '../../../../shared/components/dashboard-layout/dashboard-layout';
import { AuthApiService } from '../../../../core/auth/auth-api.service';
import {
  CustomSelect,
  CustomSelectOption
} from '../../../../shared/components/custom-select/custom-select';
import { PatientAlertRepository } from '../../data/patient-alert.repository';
import { PatientHistoryRepository } from '../../data/patient-history.repository';
import {
  getHistorySeverity,
  isOfflineHistoryRecord,
  PatientHistoryPeriod,
  PatientVitalHistoryRecord
} from '../../domain/patient-history';
import { PatientVitalAlert } from '../../domain/patient-vitals';

@Component({
  selector: 'app-history',
  imports: [DashboardLayout, TranslatePipe, FormsModule, NgFor, NgIf, NgClass, CustomSelect],
  templateUrl: './history.html',
  styleUrl: './history.css',
})
export class History {
  userId = '';
  email = '';
  urgentAlertShow = false;
  urgentAlertTitleKey = '';
  urgentAlertMessageKey = '';

  selectedPeriod: PatientHistoryPeriod = 'weekly';
  dateFrom = '2026-01-01';
  dateTo = '2026-06-20';
  alertsOnly = false;
  history: PatientVitalHistoryRecord[] = [];

  menuItems: DashboardMenuItem[] = [
    { icon: 'bi-sun', labelKey: 'sidebar.patient.vitalSigns', route: '/patient/today' },
    { icon: 'bi-cpu', labelKey: 'sidebar.patient.device', route: '/patient/device' },
    { icon: 'bi-arrow-counterclockwise', labelKey: 'sidebar.patient.history', route: '/patient/history' },
    { icon: 'bi-person-check', labelKey: 'sidebar.patient.profile', route: '/patient/profile' },
    { icon: 'bi-ticket-perforated', labelKey: 'sidebar.patient.support', route: '/patient/support' },
    { icon: 'bi-gear', labelKey: 'sidebar.patient.settings', route: '/patient/settings' }
  ];

  constructor(
    private authService: AuthApiService,
    private patientAlertRepository: PatientAlertRepository,
    private patientHistoryRepository: PatientHistoryRepository,
    private translateService: TranslateService,
    private changeDetector: ChangeDetectorRef
  ) {
    const session = this.authService.getSession();
    this.userId = session?.userId || '';
    this.email = session?.email || '';
    this.loadHistory();
    this.loadGlobalUrgentAlert();
  }

  syncNow(): void {
    this.patientHistoryRepository
      .recordHourlySnapshot(this.userId)
      .subscribe(() => this.loadHistory());
  }

  changePeriod(period: string): void {
    this.selectedPeriod = period as PatientHistoryPeriod;
    this.loadHistory();
  }

  get periodOptions(): CustomSelectOption[] {
    return [
      { label: this.translateService.instant('patient.history.weekly'), value: 'weekly' },
      { label: this.translateService.instant('patient.history.biweekly'), value: 'biweekly' },
      { label: this.translateService.instant('patient.history.monthly'), value: 'monthly' },
      { label: this.translateService.instant('patient.history.allTime'), value: 'all' },
      { label: this.translateService.instant('patient.history.custom'), value: 'custom' }
    ];
  }

  changeCustomRange(): void {
    if (this.selectedPeriod === 'custom') {
      this.loadHistory();
    }
  }

  toggleAlertsOnly(): void {
    this.alertsOnly = !this.alertsOnly;
    this.loadHistory();
  }

  getRowClass(item: PatientVitalHistoryRecord): string {
    return `history-row--${getHistorySeverity(item)}`;
  }

  getSourceLabelKey(item: PatientVitalHistoryRecord): string {
    return `patient.history.sources.${item.source}`;
  }

  getSeverityLabelKey(item: PatientVitalHistoryRecord): string {
    return `patient.history.severity.${getHistorySeverity(item)}`;
  }

  getAlertPillClass(alert: PatientVitalAlert): string {
    return `alert-pill--${alert.severity}`;
  }

  formatDateTime(value: string): string {
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(value));
  }

  formatHeartRate(item: PatientVitalHistoryRecord): string {
    if (isOfflineHistoryRecord(item)) {
      return '-';
    }

    return `${item.vitals.heartRate} bpm`;
  }

  formatOxygen(item: PatientVitalHistoryRecord): string {
    if (isOfflineHistoryRecord(item)) {
      return '-';
    }

    return `${item.vitals.oxygen}%`;
  }

  formatTemperature(item: PatientVitalHistoryRecord): string {
    if (isOfflineHistoryRecord(item)) {
      return '-';
    }

    return `${item.vitals.temperature} \u00b0C`;
  }

  generateReport(): void {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text('TukunTech - Vital Signs Report', 14, 18);

    doc.setFontSize(11);
    doc.text(`Period: ${this.selectedPeriod}`, 14, 28);
    doc.text(`Patient: ${this.email || this.userId}`, 14, 36);

    autoTable(doc, {
      startY: 46,
      head: [['Date', 'Source', 'Heart rate', 'Oxygen', 'Temperature', 'Status']],
      body: this.history.map(item => [
        this.formatDateTime(item.recordedAt),
        this.translateService.instant(this.getSourceLabelKey(item)),
        this.formatHeartRate(item),
        this.formatOxygen(item),
        this.formatTemperature(item),
        this.getReportStatus(item)
      ])
    });

    doc.save(`tukuntech-${this.selectedPeriod}-report.pdf`);
  }

  private loadHistory(): void {
    this.patientHistoryRepository
      .getHistory(this.userId, {
        period: this.selectedPeriod,
        from: this.dateFrom,
        to: this.dateTo,
        alertsOnly: this.alertsOnly
      })
      .subscribe(history => {
        this.history = history;
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

  private getReportStatus(item: PatientVitalHistoryRecord): string {
    if (!item.alerts.length) {
      return this.translateService.instant(this.getSeverityLabelKey(item));
    }

    return item.alerts
      .map(alert => this.translateService.instant(alert.titleKey))
      .join(', ');
  }
}
