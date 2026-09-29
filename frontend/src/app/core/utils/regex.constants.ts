import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export const EMAIL_REGEX = /^[^@\s]+@[^@\s]+\.[^@\s]+$/i;

export const emailValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const value = control.value;
  if (value === null || value === undefined || value === '') {
    return null;
  }
  return EMAIL_REGEX.test(String(value).trim()) ? null : { email: true };
};
