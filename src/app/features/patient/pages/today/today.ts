import { Component } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import {
  DashboardLayout,
  DashboardMenuItem
} from '../../../../shared/components/dashboard-layout/dashboard-layout';
import { EcgLiveChart } from '../../../../shared/components/ecg-live-chart/ecg-live-chart';

@Component({
  selector: 'app-today',
  imports: [
    DashboardLayout,
    TranslatePipe,
    EcgLiveChart
  ],
  templateUrl: './today.html',
  styleUrl: './today.css',
})
export class Today {
  menuItems: DashboardMenuItem[] = [
    { icon: 'bi-sun', labelKey: 'sidebar.patient.vitalSigns', route: '/patient/today' },
    { icon: 'bi-cpu', labelKey: 'sidebar.patient.device', route: '/patient/device' },
    { icon: 'bi-arrow-counterclockwise', labelKey: 'sidebar.patient.history', route: '/patient/history' },
    { icon: 'bi-person-check', labelKey: 'sidebar.patient.profile', route: '/patient/profile' },
    { icon: 'bi-ticket-perforated', labelKey: 'sidebar.patient.support', route: '/patient/support' },
    { icon: 'bi-gear', labelKey: 'sidebar.patient.settings', route: '/patient/settings' }
  ];

  patientName = 'Eleanor Marsh';
  initials = 'EM';
  email = 'demo.patient@tukuntech.app';

  vitals = {
    heartRate: 74,
    oxygen: 98,
    temperature: 36.7
  };
}
