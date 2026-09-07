import { ValidationTypes } from './validation-types';

export interface FieldValidation {
  type: ValidationTypes;
  value?: string | number;
}
