import { AbstractControl, FormGroup, ValidationErrors, ValidatorFn } from '@angular/forms';
import { FieldValidation } from '../../core/models/field-validation';

export function defaultValueValidator(getValidations: () => FieldValidation[]): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const form = control as FormGroup;

    const defaultValue = form.controls['default'].value;

    const validations = getValidations();

    if (defaultValue === '') return null;

    const minValidation = validations.find((validation) => validation.type === 'minValue');

    const maxValidation = validations.find((validation) => validation.type === 'maxValue');

    if (minValidation && 'value' in minValidation && Number(defaultValue) < minValidation.value) {
      return { defaultMinValue: true };
    }

    if (maxValidation && 'value' in maxValidation && Number(defaultValue) > maxValidation.value) {
      return { defaultMaxValue: true };
    }

    const minLengthValidation = validations.find((validation) => validation.type === 'minLength');

    const maxLengthValidation = validations.find((validation) => validation.type === 'maxLength');

    if (
      minLengthValidation &&
      'value' in minLengthValidation &&
      typeof defaultValue === 'string' &&
      defaultValue.length < minLengthValidation.value
    ) {
      return { defaultMinLength: true };
    }

    if (
      maxLengthValidation &&
      'value' in maxLengthValidation &&
      typeof defaultValue === 'string' &&
      defaultValue.length > maxLengthValidation.value
    ) {
      return { defaultMaxLength: true };
    }

    return null;
  };
}
