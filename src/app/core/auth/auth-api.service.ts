import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';

import { API_BASE_URL } from '../api/api.config';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthSession {
  userId: string;
  email: string;
  role: 'PATIENT' | 'CAREGIVER' | 'ADMIN' | string;
  subscriptionPlan: string;
  accessToken: string;
  refreshToken: string;
}

interface JwtPayload {
  sub?: string;
  email?: string;
  role?: string;
  subscription_plan?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly accessTokenKey = 'tukuntech.auth.access-token';
  private readonly refreshTokenKey = 'tukuntech.auth.refresh-token';

  constructor(
    private http: HttpClient,
    @Inject(API_BASE_URL) private apiBaseUrl: string
  ) {}

  login(request: LoginRequest): Observable<AuthTokens> {
    return this.http.post<AuthTokens>(`${this.apiBaseUrl}/auth/login`, request).pipe(
      tap(tokens => this.storeTokens(tokens))
    );
  }

  refreshToken(): Observable<AuthTokens> {
    return this.http.post<AuthTokens>(`${this.apiBaseUrl}/auth/refresh-token`, {
      refreshToken: this.getRefreshToken()
    }).pipe(
      tap(tokens => this.storeTokens(tokens))
    );
  }

  getAccessToken(): string | null {
    return globalThis.localStorage?.getItem(this.accessTokenKey) ?? null;
  }

  getRefreshToken(): string | null {
    return globalThis.localStorage?.getItem(this.refreshTokenKey) ?? null;
  }

  getSession(): AuthSession | null {
    const accessToken = this.getAccessToken();
    const refreshToken = this.getRefreshToken();
    if (!accessToken || !refreshToken) return null;

    const payload = this.decodeJwt(accessToken);
    if (!payload) return null;

    return {
      userId: payload.sub ?? '',
      email: payload.email ?? '',
      role: payload.role ?? '',
      subscriptionPlan: payload.subscription_plan ?? 'NONE',
      accessToken,
      refreshToken
    };
  }

  logout(): void {
    globalThis.localStorage?.removeItem(this.accessTokenKey);
    globalThis.localStorage?.removeItem(this.refreshTokenKey);
  }

  private storeTokens(tokens: AuthTokens): void {
    globalThis.localStorage?.setItem(this.accessTokenKey, tokens.accessToken);
    globalThis.localStorage?.setItem(this.refreshTokenKey, tokens.refreshToken);
  }

  private decodeJwt(token: string): JwtPayload | null {
    try {
      const payload = token.split('.')[1];
      const normalizedPayload = payload.replace(/-/g, '+').replace(/_/g, '/');
      const paddedPayload = normalizedPayload.padEnd(
        normalizedPayload.length + (4 - normalizedPayload.length % 4) % 4,
        '='
      );
      return JSON.parse(atob(paddedPayload)) as JwtPayload;
    } catch {
      return null;
    }
  }
}
