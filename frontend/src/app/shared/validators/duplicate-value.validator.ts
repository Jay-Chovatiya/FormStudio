import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function duplicateValueValidator<T>(
  getItems: () => T[],
  getValue: (item: T) => unknown,
  getId: (item: T) => string | number | null,
  getCurrentIdentifier: () => string | number | null,
): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;

    if (value === null || value === undefined || value === '') {
      return null;
    }

    const items = getItems();
    const currentIdentifier = getCurrentIdentifier();
    const isDuplicate = items.some((item) => {
      const isCurrent =
        currentIdentifier !== null &&
        getId(item) !== null &&
        getId(item) !== undefined &&
        String(currentIdentifier) === String(getId(item));
      return getValue(item) === value && !isCurrent;
    });

    return isDuplicate ? { duplicateValue: true } : null;
  };
}
