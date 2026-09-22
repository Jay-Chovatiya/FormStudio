import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { FormField } from '../../core/models/form-field';

export function duplicateFieldNameValidator(
  getFields: () => FormField[],
  getCurrentFieldIdentifier: () => string | number | null,
): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (value === '') {
      return null;
    }
    const fields = getFields();
    const currentIdentifier = getCurrentFieldIdentifier();
    const isDuplicatePresent = fields.some((field) => {
      const isCurrent =
        currentIdentifier !== null &&
        (field.guid === currentIdentifier || field.id === currentIdentifier || String(field.id) === String(currentIdentifier));
      return !isCurrent && field.name === value;
    });
    return isDuplicatePresent ? { duplicateFieldName: true } : null;
  };
}
