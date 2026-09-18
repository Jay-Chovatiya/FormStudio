import { AbstractControl, FormArray, ValidationErrors, ValidatorFn } from '@angular/forms';

export const uniqueOptionValueValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const options = control as FormArray;

  const values = options.controls.map((option) => option.get('value')?.value).filter(value => value.trimmed !== '');

  const uniqueValues = new Set(values);

  return uniqueValues.size === values.length ? null : { duplicateOptionValue: true };
};
