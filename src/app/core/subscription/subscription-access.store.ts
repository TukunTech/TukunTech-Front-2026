import { Injectable } from '@angular/core';

export type SubscriptionRole = 'patient' | 'caregiver';
export type SubscriptionStatus = 'active' | 'inactive' | 'expired' | 'canceled';

export interface SubscriptionAccess {
  email: string;
  role: SubscriptionRole;
  status: SubscriptionStatus;
  renewsOn: string;
  daysRemaining: number;
  canAccess: boolean;
}

@Injectable({ providedIn: 'root' })
export class SubscriptionAccessStore {
  private readonly storageKey = 'tukuntech.subscription-access.v1';
  private accounts: Array<Omit<SubscriptionAccess, 'daysRemaining' | 'canAccess'>> = [];

  constructor() {
    const saved = globalThis.localStorage?.getItem(this.storageKey);
    if (saved) {
      try {
        this.accounts = JSON.parse(saved);
      } catch {
        /* use seed state */
      }
    }
  }

  getRoleAccess(role: SubscriptionRole): SubscriptionAccess {
    return this.getAccountAccess('', role);
  }

  getAccountAccess(email: string, role: SubscriptionRole): SubscriptionAccess {
    const account = this.accounts.find(
      (item) => item.email.toLowerCase() === email.trim().toLowerCase() && item.role === role,
    ) ?? { email: email.trim(), role, status: 'inactive' as const, renewsOn: '' };

    const daysRemaining = this.calculateDaysRemaining(account.renewsOn);
    const status: SubscriptionStatus =
      account.status === 'active' && daysRemaining < 0 ? 'expired' : account.status;

    return {
      ...account,
      status,
      daysRemaining,
      canAccess: status === 'active',
    };
  }

  renew(email: string, role: SubscriptionRole): SubscriptionAccess {
    const normalizedEmail = email.trim().toLowerCase();
    const current = this.accounts.find(
      (item) => item.email.toLowerCase() === normalizedEmail && item.role === role,
    );
    const baseDate =
      current && this.calculateDaysRemaining(current.renewsOn) >= 0
        ? new Date(`${current.renewsOn}T12:00:00`)
        : new Date();
    baseDate.setDate(baseDate.getDate() + 30);

    const renewed = {
      email: email.trim(),
      role,
      status: 'active' as const,
      renewsOn: baseDate.toISOString().slice(0, 10),
    };

    this.accounts = [
      ...this.accounts.filter(
        (item) => !(item.email.toLowerCase() === normalizedEmail && item.role === role),
      ),
      renewed,
    ];
    globalThis.localStorage?.setItem(this.storageKey, JSON.stringify(this.accounts));
    return this.getAccountAccess(email, role);
  }

  cancel(email: string, role: SubscriptionRole): SubscriptionAccess {
    const normalizedEmail = email.trim().toLowerCase();
    const current = this.getAccountAccess(email, role);
    this.accounts = [
      ...this.accounts.filter(
        (item) => !(item.email.toLowerCase() === normalizedEmail && item.role === role),
      ),
      { email: email.trim(), role, status: 'canceled', renewsOn: current.renewsOn },
    ];
    globalThis.localStorage?.setItem(this.storageKey, JSON.stringify(this.accounts));
    return this.getAccountAccess(email, role);
  }

  private calculateDaysRemaining(renewsOn: string): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (!renewsOn) {
      return -1;
    }

    const renewal = new Date(`${renewsOn}T00:00:00`);
    return Math.ceil((renewal.getTime() - today.getTime()) / 86_400_000);
  }
}
