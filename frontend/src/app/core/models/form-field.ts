import { FieldOption } from './field-option';
import { FieldTypes } from './field-types';
import { FieldValidation } from './field-validation';

export interface FormField {
  id: number;
  guid?: string;
  name: string;
  type: FieldTypes;
  label: string;
  visibility: boolean;
  helperDescription?: string;
  placeholder?: string;
  default?: string | number | boolean;
  icon?: string;
  validations?: FieldValidation[];
  options?: FieldOption[];
}
