import { FormField } from "../../../core/models/form-field";

export type PropertyName =
  | 'label'
  | 'name'
  | 'helperDescription'
  | 'placeholder'
  | 'default'
  | 'minLength'
  | 'maxLength'
  | 'minValue'
  | 'maxValue'
  | 'pattern'
  | 'options';

export interface PropertyError {
  property: PropertyName;
  message: string;
}
