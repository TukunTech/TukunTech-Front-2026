export interface AdminAnalyticsMetric {
  id: string;
  labelKey: string;
  value: string;
  tone: 'neutral' | 'positive' | 'warning';
}

export interface AdminAnalyticsBar {
  label: string;
  value: number;
}

export interface AdminAnalyticsDashboard {
  adminEmail: string;
  selectedMonth: string;
  availableMonths: string[];
  metrics: AdminAnalyticsMetric[];
  usersChart: AdminAnalyticsBar[];
}
