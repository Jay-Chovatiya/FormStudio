import { HttpErrorResponse } from '@angular/common/http';

export function extractErrorMessage(err: unknown, fallbackMessage: string = 'An unexpected error occurred.'): string {
  if (!err) {
    return fallbackMessage;
  }

  if (err instanceof HttpErrorResponse) {
    if (err.status === 429) {
      return (
        err.error?.message ||
        'Too many requests. Please wait a minute and try again.'
      );
    }

    if (err.status === 0) {
      return 'Unable to reach the server. Please check your internet connection.';
    }

    const errorBody = err.error;

    if (typeof errorBody === 'string' && errorBody.trim().length > 0) {
      return errorBody;
    }

    if (errorBody && typeof errorBody === 'object') {
      if ('errors' in errorBody && errorBody.errors && typeof errorBody.errors === 'object') {
        const errorList: string[] = [];
        for (const [field, messages] of Object.entries(errorBody.errors)) {
          if (Array.isArray(messages)) {
            errorList.push(...messages);
          } else if (typeof messages === 'string') {
            errorList.push(messages);
          }
        }
        if (errorList.length > 0) {
          return errorList.join(' ');
        }
      }

      if ('message' in errorBody && typeof errorBody.message === 'string' && errorBody.message.trim().length > 0) {
        return errorBody.message;
      }

      if ('detail' in errorBody && typeof errorBody.detail === 'string' && errorBody.detail.trim().length > 0) {
        return errorBody.detail;
      }

      if ('title' in errorBody && typeof errorBody.title === 'string' && errorBody.title.trim().length > 0) {
        return errorBody.title;
      }

      const directErrorList: string[] = [];
      for (const [key, value] of Object.entries(errorBody)) {
        if (Array.isArray(value)) {
          for (const msg of value) {
            if (typeof msg === 'string') directErrorList.push(msg);
          }
        }
      }
      if (directErrorList.length > 0) {
        return directErrorList.join(' ');
      }
    }

    if (err.statusText && err.statusText !== 'OK') {
      return `${err.status}: ${err.statusText}`;
    }
  }

  if (err instanceof Error && err.message) {
    return err.message;
  }

  if (typeof err === 'string' && err.trim().length > 0) {
    return err;
  }

  return fallbackMessage;
}
