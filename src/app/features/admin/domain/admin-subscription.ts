export type AdminSubscriptionStatus = 'active' | 'canceled';

export interface AdminSubscription {
  id: string;
  userEmail: string;
  plan: string;
  status: AdminSubscriptionStatus;
  renewsAt: string;
  amount: number | null;
  currency: string;
  month: string;
}

export interface AdminSubscriptionSummary {
  active: number;
  new: number;
  canceled: number;
}

export interface AdminSubscriptionDashboard {
  adminEmail: string;
  selectedMonth: string;
  availableMonths: string[];
  summary: AdminSubscriptionSummary;
  subscriptions: AdminSubscription[];
}

export function filterSubscriptionsByMonth(
  subscriptions: AdminSubscription[],
  month: string
): AdminSubscription[] {
  if (month === 'all') {
    return subscriptions;
  }

  return subscriptions.filter(subscription =>
    subscription.month === month ||
    subscription.month === 'unassigned'
  );
}
