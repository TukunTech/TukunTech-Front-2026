import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { AuthApiService } from './auth-api.service';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const authService = inject(AuthApiService);
  const token = authService.getAccessToken();

  if (!token || request.url.includes('/auth/login') || request.url.includes('/profiles/onboarding')) {
    return next(request);
  }

  return next(request.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  }));
};
