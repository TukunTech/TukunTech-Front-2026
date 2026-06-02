import { Component } from '@angular/core';
import { NgClass, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import {
  DashboardLayout,
  DashboardMenuItem
} from '../../../../shared/components/dashboard-layout/dashboard-layout';

type ReportPeriod = 'weekly' | 'biweekly' | 'monthly';
type AlertType = 'heart' | 'temperature' | 'none';

interface VitalHistoryItem {
  date: string;
  heartRate: string;
  oxygen: string;
  temperature: string;
  alertType: AlertType;
}

@Component({
  selector: 'app-history',
  imports: [DashboardLayout, TranslatePipe, FormsModule, NgFor, NgClass],
  templateUrl: './history.html',
  styleUrl: './history.css',
})
export class History {
  email = 'demo.patient@tukuntech.app';

  selectedPeriod: ReportPeriod = 'weekly';

  menuItems: DashboardMenuItem[] = [
    { icon: 'bi-sun', labelKey: 'sidebar.patient.vitalSigns', route: '/patient/today' },
    { icon: 'bi-cpu', labelKey: 'sidebar.patient.device', route: '/patient/device' },
    { icon: 'bi-arrow-counterclockwise', labelKey: 'sidebar.patient.history', route: '/patient/history' },
    { icon: 'bi-person-check', labelKey: 'sidebar.patient.profile', route: '/patient/profile' },
    { icon: 'bi-ticket-perforated', labelKey: 'sidebar.patient.support', route: '/patient/support' },
    { icon: 'bi-gear', labelKey: 'sidebar.patient.settings', route: '/patient/settings' }
  ];

  history: VitalHistoryItem[] = [
    {
      date: 'May 9',
      heartRate: '72 bpm avg. 60-98',
      oxygen: '98% avg. 95-99',
      temperature: '36.7 °C - normal',
      alertType: 'none'
    },
    {
      date: 'May 8',
      heartRate: '72 bpm avg. 60-98',
      oxygen: '98% avg. 95-99',
      temperature: '37 °C - fever',
      alertType: 'temperature'
    },
    {
      date: 'May 6',
      heartRate: '72 bpm avg. 60-98',
      oxygen: '98% avg. 95-99',
      temperature: '36.7 °C - normal',
      alertType: 'none'
    },
    {
      date: 'May 5',
      heartRate: '110 bpm avg. 60-98',
      oxygen: '98% avg. 95-99',
      temperature: '36.7 °C - normal',
      alertType: 'heart'
    }
  ];

  getRowClass(item: VitalHistoryItem): string {
    return `history-row--${item.alertType}`;
  }

  generateReport(): void {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text('TukunTech - Vital Signs Report', 14, 18);

    doc.setFontSize(11);
    doc.text(`Period: ${this.selectedPeriod}`, 14, 28);
    doc.text(`Patient: Eleanor Marsh`, 14, 36);

    autoTable(doc, {
      startY: 46,
      head: [['Date', 'Heart rate', 'Oxygen', 'Temperature']],
      body: this.history.map(item => [
        item.date,
        item.heartRate,
        item.oxygen,
        item.temperature
      ])
    });

    doc.save(`tukuntech-${this.selectedPeriod}-report.pdf`);
  }
}
