import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export const futureDateValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const value = control.value;

  if (!value || control.pristine) {
    return null;
  }

  const selectedDate = new Date(value);
  const now = new Date();

  return selectedDate > now ? null : { pastDate: true };
};
