import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { extractErrorMessage } from '../utils/error-handler';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse) {
        const message = extractErrorMessage(error);

        Object.defineProperty(error, 'message', {
          value: message,
          writable: true,
          enumerable: true,
          configurable: true,
        });
      }

      return throwError(() => error);
    })
  );
};
