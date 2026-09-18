import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export const identifierValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const value = control.value;

  if (value === '') {
    return null;
  }

  if (typeof value !== 'string') {
    return { invalidIdentifier: true };
  }

  const regex = /^[a-zA-Z][a-zA-Z0-9_]*$/;

  return regex.test(value) ? null : { invalidIdentifier: true };
};
