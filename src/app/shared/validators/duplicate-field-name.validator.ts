import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { FormField } from '../../core/models/form-field';

export function duplicateFieldNameValidator(
  getFields: () => FormField[],
  getCurrentFieldId: () => number | null,
): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (value === '') {
      return null;
    }
    const fields = getFields();
    const currentFieldId = getCurrentFieldId();
    const isDuplicatePresent = fields.some(
      (field) => field.id !== currentFieldId && field.name === value,
    );
    return isDuplicatePresent ? { duplicateFieldName: true } : null;
  };
}
