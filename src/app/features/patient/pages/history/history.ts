import { NgClass, NgFor, NgIf } from '@angular/common';
import { ChangeDetectorRef, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { finalize } from 'rxjs';

import {
  DashboardLayout,
  DashboardMenuItem
} from '../../../../shared/components/dashboard-layout/dashboard-layout';
import { AuthApiService } from '../../../../core/auth/auth-api.service';
import { ReportApiService } from '../../../../core/reports/report-api.service';
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
  isGeneratingReport = false;
  reportMessage = '';
  reportMessageType: 'success' | 'error' = 'success';

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
    private reportApi: ReportApiService,
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
    if (this.isGeneratingReport) {
      return;
    }

    this.reportMessage = '';
    this.isGeneratingReport = true;

    this.reportApi.generateMyReport(this.getReportRange()).pipe(
      finalize(() => {
        this.isGeneratingReport = false;
        this.changeDetector.detectChanges();
      })
    ).subscribe({
      next: message => {
        this.reportMessageType = 'success';
        this.reportMessage = message || 'Reporte solicitado. n8n esta procesando el PDF.';
        this.changeDetector.detectChanges();
      },
      error: error => {
        this.reportMessageType = 'error';
        this.reportMessage = this.getErrorMessage(error, 'No se pudo generar el reporte.');
        this.changeDetector.detectChanges();
      }
    });
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

  private getReportRange(): { startDate: string; endDate: string } {
    if (this.selectedPeriod === 'custom') {
      return {
        startDate: this.dateFrom,
        endDate: this.dateTo
      };
    }

    const end = new Date();
    const start = new Date(end);

    if (this.selectedPeriod === 'weekly') {
      start.setDate(end.getDate() - 7);
    } else if (this.selectedPeriod === 'biweekly') {
      start.setDate(end.getDate() - 14);
    } else if (this.selectedPeriod === 'monthly') {
      start.setMonth(end.getMonth() - 1);
    } else {
      start.setFullYear(end.getFullYear() - 1);
    }

    return {
      startDate: this.toDateOnly(start),
      endDate: this.toDateOnly(end)
    };
  }

  private toDateOnly(date: Date): string {
    return date.toISOString().slice(0, 10);
  }

  private getErrorMessage(error: unknown, fallback: string): string {
    const httpError = error as { error?: unknown; message?: string };

    if (typeof httpError.error === 'string' && httpError.error.trim()) {
      return httpError.error;
    }

    if (httpError.error && typeof httpError.error === 'object') {
      const body = httpError.error as Record<string, unknown>;
      const message = body['message'] || body['error'];
      if (typeof message === 'string' && message.trim()) {
        return message;
      }
    }

    return httpError.message || fallback;
  }
}
