import {
  HttpInterceptorFn,
  HttpErrorResponse,
  HttpRequest,
  HttpHandlerFn,
  HttpXsrfTokenExtractor,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { BehaviorSubject, catchError, filter, switchMap, take, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

function getXsrfToken(): string | null {
  if (typeof document === 'undefined') {
    return null;
  }
  const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

function addAuthAndXsrfHeaders(
  request: HttpRequest<unknown>,
  token?: string | null,
  xsrfToken?: string | null,
): HttpRequest<unknown> {
  const headers: Record<string, string> = {};

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (xsrfToken) {
    headers['X-XSRF-TOKEN'] = xsrfToken;
  }

  return request.clone({
    withCredentials: true,
    setHeaders: headers,
  });
}

function handle401Error(
  authService: AuthService,
  request: HttpRequest<unknown>,
  next: HttpHandlerFn,
  originalError: unknown,
) {
  if (!isRefreshing) {
    isRefreshing = true;
    refreshTokenSubject.next(null);

    return authService.refreshToken().pipe(
      switchMap((response) => {
        isRefreshing = false;
        refreshTokenSubject.next(response.token);
        const xsrfToken = getXsrfToken();
        return next(addAuthAndXsrfHeaders(request, response.token, xsrfToken));
      }),
      catchError((refreshError) => {
        isRefreshing = false;
        authService.logout();
        return throwError(() => refreshError);
      }),
    );
  }

  return refreshTokenSubject.pipe(
    filter((token): token is string => token !== null),
    take(1),
    switchMap((newToken) => {
      const xsrfToken = getXsrfToken();
      return next(addAuthAndXsrfHeaders(request, newToken, xsrfToken));
    }),
  );
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const xsrfExtractor = inject(HttpXsrfTokenExtractor);

  const isCookieAuthEndpoint =
    req.url.includes('/auth/login') ||
    req.url.includes('/auth/refresh-token') ||
    req.url.includes('/auth/revoke-token');

  const token = isCookieAuthEndpoint ? null : authService.token();
  const xsrfToken = xsrfExtractor.getToken() || getXsrfToken();

  const authReq = addAuthAndXsrfHeaders(req, token, xsrfToken);

  return next(authReq).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        if (isCookieAuthEndpoint) {
          authService.logout();
          return throwError(() => error);
        }

        return handle401Error(authService, req, next, error);
      }

      return throwError(() => error);
    }),
  );
};
