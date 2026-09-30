import { HttpInterceptorFn, HttpErrorResponse, HttpContextToken } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { extractErrorMessage } from '../utils/error-handler';
import { ToastService } from '../services/toast.service';

/**
 * Usage: this.http.get(url, { context: new HttpContext().set(BYPASS_ERROR_TOAST, true) })
 */
export const BYPASS_ERROR_TOAST = new HttpContextToken<boolean>(() => false);

function getStatusTitle(status: number): string {
  switch (status) {
    case 0:
      return 'Connection Failed';
    case 400:
      return 'Invalid Request';
    case 401:
      return 'Unauthorized';
    case 403:
      return 'Access Denied';
    case 404:
      return 'Not Found';
    case 409:
      return 'Conflict';
    case 422:
      return 'Validation Error';
    case 429:
      return 'Too Many Requests';
    default:
      if (status >= 500) {
        return 'Server Error';
      }
      return 'Error';
  }
}

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toastService = inject(ToastService);

  return next(req).pipe(
    catchError((error: unknown) => {
      let message = 'An unexpected error occurred.';
      let title = 'Error';

      if (error instanceof HttpErrorResponse) {
        message = extractErrorMessage(error);
        title = getStatusTitle(error.status);

        Object.defineProperty(error, 'message', {
          value: message,
          writable: true,
          enumerable: true,
          configurable: true,
        });
      } else if (error instanceof Error) {
        message = error.message;
      }

      if (!req.context.get(BYPASS_ERROR_TOAST)) {
        toastService.error(message, title);
      }

      return throwError(() => error);
    })
  );
};
