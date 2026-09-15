import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export const requiredTrimmedValidator: ValidatorFn = (
  control: AbstractControl
): ValidationErrors | null => {
  const value = control.value;

  if (typeof value !== 'string' || value.trim() === '') {
    return { requiredTrimmed: true };
  }

  return null;
};